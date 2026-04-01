import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ADMIN_CREDENTIALS, SUPER_ADMIN_CREDENTIALS, DEPARTMENTS, YEARS } from '../constants';
import { saveStudent, loginStudent, setCurrentUser, getFaculty, resetUserPassword, syncWithBackend, API_BASE_URL } from '../services/storageService';
import { Role, StudentProfile } from '../types';

type AuthView = 'LOGIN' | 'REGISTER' | 'FORGOT_REQUEST' | 'FORGOT_RESET';

const Auth: React.FC = () => {
  const { type, token } = useParams<{ type?: string, token?: string }>(); 
  const navigate = useNavigate();
  const location = useLocation();
  
  const isStudent = type === 'student';
  // Determine initial view based on URL path
  let initialView: AuthView = 'LOGIN';
  if (location.pathname.includes('/register')) initialView = 'REGISTER';
  if (location.pathname.includes('/reset-password')) initialView = 'FORGOT_RESET';
  
  const [view, setView] = useState<AuthView>(initialView);

  // Regex Constants
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@bitsathy\.ac\.in$/;
  // Starts with 7376, followed by 8 alphanumeric characters (total 12)
  const ROLL_REGEX = /^7376[a-zA-Z0-9]{8}$/;
  // Min 8 chars, 1 Upper, 1 Lower, 1 Number, 1 Symbol
  const PASS_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

  // Form States
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    rollNumber: '',
    department: '',
    year: '',
    phone: '',
    gender: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const getPasswordStrength = (pass: string) => {
    return {
        length: pass.length >= 8,
        upper: /[A-Z]/.test(pass),
        lower: /[a-z]/.test(pass),
        number: /\d/.test(pass),
        symbol: /[@$!%*?&]/.test(pass)
    };
  };

  const passwordStrength = getPasswordStrength(formData.password);
  const isPasswordValid = Object.values(passwordStrength).every(Boolean);

  const hashPassword = async (text: string) => {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const validateInputs = () => {
    // 1. Email Validation (Skip for Super Admin hardcoded email in Login)
    if (view === 'LOGIN' && formData.email === SUPER_ADMIN_CREDENTIALS.email) {
       return null;
    }
    
    if (formData.email && isStudent && !EMAIL_REGEX.test(formData.email)) {
        return "Email must be a valid address ending in @bitsathy.ac.in";
    }

    const GENERIC_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (formData.email && !isStudent && !GENERIC_EMAIL_REGEX.test(formData.email)) {
        return "Please enter a valid email address.";
    }

    // 2. Registration & Password Reset Specific Validations
    if (view === 'REGISTER' || view === 'FORGOT_RESET') {
        if (view === 'REGISTER' && !ROLL_REGEX.test(formData.rollNumber)) {
            return "Roll Number must be 12 characters, start with '7376', and contain only letters and numbers.";
        }

        // Password Complexity
        if (!PASS_REGEX.test(formData.password)) {
            return "Password must be at least 8 characters long and include 1 Uppercase letter, 1 Lowercase letter, 1 Number, and 1 Symbol.";
        }

        // Match Password
        if (formData.password !== formData.confirmPassword) {
            return "Passwords do not match.";
        }

        // Required Fields for Register
        if (view === 'REGISTER') {
            if (!formData.fullName || !formData.department || !formData.year || !formData.phone || !formData.gender) {
                return "All fields are mandatory.";
            }
        }
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const validationError = validateInputs();
    if (validationError) {
        setError(validationError);
        setLoading(false);
        return;
    }

    try {
        // --- FORGOT PASSWORD FLOW ---
        if (view === 'FORGOT_REQUEST') {
            try {
                 const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ email: formData.email })
                 });
                 const data = await res.json();
                 
                 if (!res.ok) {
                     setError(data.error || 'Failed to send reset link.');
                     setLoading(false);
                     return;
                 }
                 
                 setSuccess(`Reset link sent to ${formData.email}. Please check your inbox.`);
                 setLoading(false);
                 // No auto-redirect; wait for the user to open the link from their email.
            } catch (err) {
                 setError('An unexpected error occurred while sending reset link.');
                 setLoading(false);
            }
            return;
        }
        if (view === 'FORGOT_RESET') {
            try {
                const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ token, password: formData.password })
                });
                const data = await res.json();
                
                if (!res.ok) {
                     setError(data.error || 'Could not reset password.');
                     setLoading(false);
                     return;
                }
                
                setSuccess('Password changed successfully! Redirecting to login...');
                setTimeout(() => {
                    setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
                    setView('LOGIN');
                    setSuccess('');
                }, 2000);
            } catch (err) {
                 setError('An unexpected error occurred while resetting password.');
            }
            setLoading(false);
            return;
        }

        // --- AUTH FLOW WITH BACKEND ---
        
        // Student Registration Logic
        if (view === 'REGISTER') {
            const res = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: Role.STUDENT,
                    rollNumber: formData.rollNumber,
                    department: formData.department,
                    year: formData.year,
                    phone: formData.phone,
                    gender: formData.gender
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Registration failed.');
                setLoading(false);
                return;
            }

            setSuccess('Registration Successful! Redirecting...');
            setTimeout(() => {
                setView('LOGIN');
                navigate('/login/student');
            }, 2000);
            return;
        }

        // Login Logic (Handles Student, Admin, Super Admin via Backend)
        if (view === 'LOGIN') {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: formData.email.toLowerCase().trim(),
                    password: formData.password
                })
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Invalid Credentials.');
                setLoading(false);
                return;
            }

            // Backend returns { token, user: { id, name, role } }
            localStorage.setItem('wellnex_token', data.token);
            setCurrentUser(data.user);

            setSuccess(`Welcome back, ${data.user.name}! Redirecting...`);

            // Sync all data from backend before navigation
            await syncWithBackend().catch(err => console.error("Sync failed:", err));
            setLoading(false);

            // Navigate based on role
            if (data.user.role === Role.SUPER_ADMIN) navigate('/super-admin-dashboard');
            else if (data.user.role === Role.ADMIN) navigate('/admin-dashboard');
            else navigate('/student-dashboard');
        }
    } catch (err) {
        setError('An unexpected error occurred. Please make sure the backend server is running.');
        console.error(err);
    } finally {
        setLoading(false);
    }

  };

  const toggleAuthMode = () => {
    const target = view === 'LOGIN' ? 'REGISTER' : 'LOGIN';
    setView(target);
    if (isStudent) {
      navigate(target === 'REGISTER' ? '/register/student' : '/login/student');
    }
  };

  const inputClass = "w-full pl-12 pr-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 font-medium text-sm hover:border-slate-300 shadow-sm";
  const selectClass = "w-full pl-12 pr-10 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-300 font-medium text-sm appearance-none cursor-pointer hover:border-slate-300 shadow-sm";

  return (
    <div className="min-h-screen bg-surface-50 flexItems-center justify-center p-4 font-sans relative overflow-hidden flex items-center">
      {/* Background Blobs */}
      <div className="bg-blob w-[600px] h-[600px] rounded-full top-[-20%] left-[-10%] bg-primary-200/40"></div>
      <div className="bg-blob w-[600px] h-[600px] rounded-full bottom-[-20%] right-[-10%] bg-secondary-200/40" style={{ animationDelay: '2s' }}></div>
      <div className="bg-blob w-[400px] h-[400px] rounded-full top-[30%] left-[40%] bg-accent-100/30" style={{ animationDelay: '4s' }}></div>

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Style to preserve input color on autofill */}
      <style>{`
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus, 
        input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px #ffffff inset !important;
            -webkit-text-fill-color: #0f172a !important;
            transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      <div className="w-full max-w-6xl glass-card rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row min-h-[750px] z-10 mx-auto relative overflow-hidden border border-white/60">
        
        {/* LEFT SIDE: FORM */}
        <div className="w-full md:w-1/2 p-8 md:p-14 lg:p-16 flex flex-col justify-center bg-white/60 backdrop-blur-xl relative">
            <div onClick={() => {
                if(view === 'FORGOT_REQUEST' || view === 'FORGOT_RESET') setView('LOGIN');
                else navigate('/');
            }} className="absolute top-8 left-8 text-surface-400 hover:text-primary-600 transition-colors cursor-pointer group flex items-center gap-2">
                <i className="fas fa-arrow-left text-sm group-hover:-translate-x-1 transition-transform"></i>
                <span className="text-sm font-bold">Back</span>
            </div>

            <div className="mb-8 mt-12 animate-fade-in-up">
                <h1 className="text-4xl font-extrabold text-surface-900 mb-3 tracking-tight">
                    {view === 'REGISTER' && 'Create Account'}
                    {view === 'LOGIN' && 'Sign In to your Account'}
                    {view === 'FORGOT_REQUEST' && 'Reset Password'}
                    {view === 'FORGOT_RESET' && 'Set New Password'}
                </h1>
                <p className="text-surface-500 text-base font-medium">
                    {view === 'REGISTER' && 'Start your wellness journey today.'}
                    {view === 'LOGIN' && 'Welcome back! Please enter your details.'}
                    {view === 'FORGOT_REQUEST' && 'Enter your email to receive a reset link.'}
                    {view === 'FORGOT_RESET' && 'Create a strong password for your account.'}
                </p>
            </div>

            {error && <div className="mb-6 p-4 bg-accent-50 text-accent-600 rounded-xl text-sm font-bold border border-accent-100 flex items-start animate-fade-in-down shadow-sm"><i className="fas fa-exclamation-circle mt-0.5 mr-2 text-base"></i><span>{error}</span></div>}
            {success && <div className="mb-6 p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-bold border border-emerald-100 flex items-center animate-fade-in-down shadow-sm"><i className="fas fa-check-circle mr-2 text-base"></i><span>{success}</span></div>}

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10 w-full animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                {/* REGISTER FIELDS */}
                {view === 'REGISTER' && (
                    <div className="space-y-5 animate-fade-in-up">
                         <div className="space-y-1 relative group input-focus-ring rounded-xl">
                            <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Full Name</label>
                            <div className="relative">
                                <i className="fas fa-user absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                <input required type="text" name="fullName" placeholder="John Doe" value={formData.fullName} onChange={handleChange} className={inputClass} />
                            </div>
                         </div>
                         <div className="grid grid-cols-2 gap-5">
                            <div className="space-y-1 relative group input-focus-ring rounded-xl">
                                <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Roll Number</label>
                                <div className="relative">
                                    <i className="fas fa-id-card absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                    <input required type="text" name="rollNumber" placeholder="7376XXXXXXXX" value={formData.rollNumber} onChange={handleChange} className={inputClass} />
                                </div>
                            </div>
                            <div className="space-y-1 relative group input-focus-ring rounded-xl">
                                <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Gender</label>
                                <div className="relative">
                                    <i className="fas fa-venus-mars absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                    <select required name="gender" value={formData.gender} onChange={handleChange} className={selectClass}><option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option></select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-surface-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                             <div className="space-y-1 relative group input-focus-ring rounded-xl">
                                <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Department</label>
                                <div className="relative">
                                    <i className="fas fa-building absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                    <select required name="department" value={formData.department} onChange={handleChange} className={selectClass}><option value="">Select</option>{DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}</select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-surface-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                             <div className="space-y-1 relative group input-focus-ring rounded-xl">
                                <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Year</label>
                                <div className="relative">
                                    <i className="fas fa-graduation-cap absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                    <select required name="year" value={formData.year} onChange={handleChange} className={selectClass}><option value="">Select</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}</select>
                                    <i className="fas fa-chevron-down absolute right-4 top-1/2 transform -translate-y-1/2 text-surface-400 pointer-events-none text-xs"></i>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1 relative group input-focus-ring rounded-xl">
                            <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Phone Number</label>
                            <div className="relative">
                                <i className="fas fa-phone absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                                <input required type="tel" name="phone" placeholder="9876543210" value={formData.phone} onChange={handleChange} className={inputClass} />
                            </div>
                        </div>
                    </div>
                )}
                
                {/* COMMON: EMAIL */}
                {view !== 'FORGOT_RESET' && (
                    <div className="space-y-1 relative group input-focus-ring rounded-xl">
                        <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                            <i className="fas fa-envelope absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                            <input 
                              required 
                              type="email" 
                              name="email" 
                              placeholder={isStudent ? (view === 'REGISTER' ? "student@bitsathy.ac.in" : "Roll Number or Email") : "admin@example.com"} 
                              value={formData.email} 
                              onChange={handleChange} 
                              className={inputClass} 
                            />
                        </div>
                    </div>
                )}
                
                {/* COMMON: PASSWORD */}
                {view !== 'FORGOT_REQUEST' && (
                    <div className="space-y-1 relative group input-focus-ring rounded-xl">
                        <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">
                            {view === 'FORGOT_RESET' ? 'New Password' : 'Password'}
                        </label>
                        <div className="relative">
                            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                            <input 
                                required 
                                type={showPassword ? "text" : "password"} 
                                name="password" 
                                placeholder="••••••••" 
                                value={formData.password} 
                                onChange={handleChange} 
                                className={inputClass} 
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-surface-400 hover:text-primary-600 transition-colors outline-none">
                                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                            </button>
                        </div>
                        
                        {/* Password Strength Indicator */}
                        {(view === 'REGISTER' || view === 'FORGOT_RESET') && formData.password && (
                            <div className="mt-4 grid grid-cols-2 gap-3 p-4 bg-surface-50 rounded-xl border border-surface-200/60 shadow-inner">
                                <div className={`text-xs font-bold flex items-center ${passwordStrength.length ? 'text-emerald-500' : 'text-surface-400'}`}>
                                    <i className={`fas ${passwordStrength.length ? 'fa-check-circle' : 'fa-circle'} mr-2 text-[10px]`}></i> Min 8 Chars
                                </div>
                                <div className={`text-xs font-bold flex items-center ${passwordStrength.upper ? 'text-emerald-500' : 'text-surface-400'}`}>
                                    <i className={`fas ${passwordStrength.upper ? 'fa-check-circle' : 'fa-circle'} mr-2 text-[10px]`}></i> Uppercase
                                </div>
                                <div className={`text-xs font-bold flex items-center ${passwordStrength.lower ? 'text-emerald-500' : 'text-surface-400'}`}>
                                    <i className={`fas ${passwordStrength.lower ? 'fa-check-circle' : 'fa-circle'} mr-2 text-[10px]`}></i> Lowercase
                                </div>
                                <div className={`text-xs font-bold flex items-center ${passwordStrength.number ? 'text-emerald-500' : 'text-surface-400'}`}>
                                    <i className={`fas ${passwordStrength.number ? 'fa-check-circle' : 'fa-circle'} mr-2 text-[10px]`}></i> Number
                                </div>
                                <div className={`text-xs font-bold flex items-center col-span-2 ${passwordStrength.symbol ? 'text-emerald-500' : 'text-surface-400'}`}>
                                    <i className={`fas ${passwordStrength.symbol ? 'fa-check-circle' : 'fa-circle'} mr-2 text-[10px]`}></i> Symbol (@$!%*?&)
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* CONFIRM PASSWORD */}
                {(view === 'REGISTER' || view === 'FORGOT_RESET') && (
                    <div className="space-y-1 relative group input-focus-ring rounded-xl">
                        <label className="text-xs font-bold text-surface-500 ml-1 uppercase tracking-wider">Confirm Password</label>
                        <div className="relative">
                            <i className="fas fa-lock absolute left-4 top-1/2 transform -translate-y-1/2 text-surface-400 group-focus-within:text-primary-500 transition-colors"></i>
                            <input required type="password" name="confirmPassword" placeholder="••••••••" value={formData.confirmPassword} onChange={handleChange} className={inputClass} />
                        </div>
                    </div>
                )}

                {/* LOGIN EXTRAS */}
                {view === 'LOGIN' && (
                    <div className="flex items-center justify-between mt-4">
                        <label className="flex items-center space-x-2 cursor-pointer group">
                            <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="w-4 h-4 text-primary-600 rounded border-surface-300 focus:ring-primary-500 transition-colors" />
                            <span className="text-sm font-semibold text-surface-500 group-hover:text-surface-700 transition-colors">Remember me</span>
                        </label>
                        <button type="button" onClick={() => setView('FORGOT_REQUEST')} className="text-sm font-bold text-primary-600 hover:text-primary-800 transition-colors">Forgot password?</button>
                    </div>
                )}

                <button type="submit" disabled={loading} className={`w-full py-4 rounded-2xl text-white font-bold text-sm tracking-widest uppercase bg-surface-900 hover:bg-primary-600 shadow-xl shadow-surface-900/20 hover:shadow-primary-600/40 transition-all duration-300 transform hover:-translate-y-1 active:scale-[0.98] mt-6 ${loading ? 'opacity-80 cursor-wait' : ''}`}>
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <i className="fas fa-spinner fa-spin"></i> Processing...
                        </span>
                    ) : (
                        view === 'REGISTER' ? 'Create Account' : 
                        view === 'LOGIN' ? 'Sign In' :
                        view === 'FORGOT_REQUEST' ? 'Send Reset Link' : 'Change Password'
                    )}
                </button>
            </form>
            
            {isStudent && (view === 'LOGIN' || view === 'REGISTER') && (
                <div className="mt-8 text-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                    <p className="text-surface-500 text-sm font-medium">
                        {view === 'REGISTER' ? 'Already have an account?' : 'Not registered yet?'} 
                        <button onClick={toggleAuthMode} className="text-primary-600 font-bold ml-2 hover:text-primary-800 transition-colors underline decoration-2 decoration-transparent hover:decoration-primary-600 underline-offset-4">
                            {view === 'REGISTER' ? 'Login here' : 'Create an account'}
                        </button>
                    </p>
                </div>
            )}
        </div>
        
        {/* RIGHT SIDE: ILLUSTRATION */}
        <div className="hidden md:flex w-1/2 bg-surface-900 relative flex-col items-center justify-center p-12 text-center text-white overflow-hidden group">
             {/* Premium Background Gradient */}
             <div className="absolute inset-0 bg-gradient-to-br from-primary-900 via-surface-900 to-secondary-900 opacity-90 z-0"></div>
             
             {/* Decorative Elements */}
             <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-primary-600/30 blur-[80px] z-0 group-hover:bg-primary-500/40 transition-colors duration-1000"></div>
             <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] rounded-full bg-secondary-600/30 blur-[80px] z-0 group-hover:bg-secondary-500/40 transition-colors duration-1000"></div>
             
             {/* Decorative Grid */}
             <div className="absolute inset-0 opacity-10 z-0" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
             
             <div className="relative z-10 max-w-sm animate-fade-in-up">
                 <div className="w-full aspect-square bg-white/5 backdrop-blur-md rounded-full flex items-center justify-center mb-10 border border-white/10 shadow-2xl relative hover:scale-105 transition-transform duration-700">
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-110 animate-pulse-slow"></div>
                    <div className="absolute inset-0 rounded-full border border-white/5 scale-125 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                    <i className={`fas ${!isStudent ? 'fa-chalkboard-teacher text-secondary-400' : 'fa-rocket text-primary-400'} text-[7rem] drop-shadow-2xl group-hover:rotate-12 transition-transform duration-700`}></i>
                    
                    {/* Floating Premium Icons */}
                    <div className="absolute top-4 right-4 p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl text-primary-300 animate-float" style={{ animationDelay: '0s' }}><i className="fas fa-chart-pie text-xl"></i></div>
                    <div className="absolute bottom-12 left-[-10px] p-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-xl text-accent-300 animate-float" style={{ animationDelay: '1s' }}><i className="fas fa-heart text-xl"></i></div>
                    <div className="absolute top-24 left-[-20px] p-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-xl text-emerald-400 animate-float" style={{ animationDelay: '2s' }}><i className="fas fa-check text-lg"></i></div>
                 </div>
                 
                 <h2 className="text-4xl font-extrabold mb-5 tracking-tight text-white drop-shadow-md">
                    {view === 'REGISTER' && 'Join the Community'}
                    {view === 'LOGIN' && 'Access Your Dashboard'}
                    {(view === 'FORGOT_REQUEST' || view === 'FORGOT_RESET') && 'Secure Recovery'}
                 </h2>
                 <p className="text-surface-300 text-lg leading-relaxed font-medium">
                    {!isStudent 
                        ? 'Monitor student wellness analytics, identify at-risk trends, and provide timely support to ensure academic success.' 
                        : 'Track your wellness journey, get personalized tips, and stay on top of your academic goals.'}
                 </p>
             </div>
        </div>

      </div>
    </div>
  );
};

export default Auth;