import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, getCurrentUser } from '../services/storageService';
import { Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole: Role;
  userName: string;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, userName }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
     if(userRole === Role.STUDENT || userRole === Role.ADMIN) {
        const updateNotifs = () => {
             const user = getCurrentUser();
             if(user) {
                 const id = userRole === Role.ADMIN ? user.email : user.rollNumber;
                 const notifs = JSON.parse(localStorage.getItem('swrs_notifications') || '[]');
                 const unread = notifs.filter((n: any) => n.studentRollNumber === id && !n.isRead).length;
                 setUnreadCount(unread);
             }
        };
        updateNotifs();
        const interval = setInterval(updateNotifs, 5000);
        return () => clearInterval(interval);
     }
  }, [userRole]);

  useEffect(() => {
    if (isDarkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTdGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTUwIDE1IEM1MCAxNSA4NSA0MCA4NSA2NSBDODUgOTAgNjAgOTUgNTAgOTUgQzQwIDk1IDE1IDkwIDE1IDY1IEMxNSA0MCA1MCAxNSA1MCAxNSBaIiBmaWxsPSIjZWNmZGY1Ii8+CiAgPHBhdGggZD0iTTUwIDIwIEM1MCAyMCA4MCA0NSA4MCA2NSBDODAgODUgNjAgOTUgNTAgOTUgQzNDIDk1IDIwIDg1IDIwIDY1IEMyMCA0NSA1MCAyMCA1MCAyMCBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0NSIgcj0iOSIgZmlsbD0iIzQzMzhjYSIvPgogIDxwYXRoIGQ9Ik0zMyA4MCBDMzMgNjUgNDIgNTggNTAgNTggQzU4IDU4IDY3IDY1IDY3IDgwIiBmaWxsPSJub25lIiBzdHJva2U9IiM0MzM4Y2EiIHN0cm9rZS13aWR0aD0iNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==";

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Helper to check active state based on path or query param
  const isActive = (path: string, queryParam?: string) => {
    if (location.pathname !== path) return false;
    if (!queryParam) return true;
    const params = new URLSearchParams(location.search);
    return params.get('view') === queryParam;
  };

  const navItemClass = (active: boolean) => 
    `w-full flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm group relative overflow-hidden ${
      active 
        ? 'text-primary-600 bg-primary-50/80 shadow-sm border border-primary-100/50' 
        : 'text-surface-500 hover:bg-surface-100/50 hover:text-primary-600 border border-transparent'
    }`;

  const renderNavItems = () => {
      if (userRole === Role.STUDENT) {
          return (
            <>
              <button onClick={() => navigate('/student-dashboard')} className={navItemClass(isActive('/student-dashboard'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/student-dashboard') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-chart-pie w-6 text-center text-lg ${isActive('/student-dashboard') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Dashboard</span>
              </button>
              <button onClick={() => navigate('/focus-timer')} className={navItemClass(isActive('/focus-timer'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/focus-timer') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-stopwatch w-6 text-center text-lg ${isActive('/focus-timer') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Focus Mode</span>
              </button>
              <button onClick={() => navigate('/goal-tracker')} className={navItemClass(isActive('/goal-tracker'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/goal-tracker') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-tasks w-6 text-center text-lg ${isActive('/goal-tracker') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Habits & Goals</span>
              </button>
              <button onClick={() => navigate('/community')} className={navItemClass(isActive('/community'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/community') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-users w-6 text-center text-lg ${isActive('/community') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Peer Community</span>
              </button>
              <button onClick={() => navigate('/student-interventions')} className={navItemClass(isActive('/student-interventions'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/student-interventions') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-clipboard-list w-6 text-center text-lg ${isActive('/student-interventions') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Recommendations</span>
              </button>
              <button onClick={() => navigate('/student-survey')} className={navItemClass(isActive('/student-survey'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/student-survey') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-clipboard-check w-6 text-center text-lg ${isActive('/student-survey') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Wellness Survey</span>
              </button>
              <button onClick={() => navigate('/wellness-insights')} className={navItemClass(isActive('/wellness-insights'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/wellness-insights') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-brain w-6 text-center text-lg ${isActive('/wellness-insights') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Wellness Insights</span>
              </button>
              <button onClick={() => navigate('/counselor-support')} className={navItemClass(isActive('/counselor-support'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/counselor-support') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-user-md w-6 text-center text-lg ${isActive('/counselor-support') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>Counselor Support</span>
              </button>
              <button onClick={() => navigate('/ai-journal')} className={navItemClass(isActive('/ai-journal'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/ai-journal') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className={`fas fa-book-reader w-6 text-center text-lg ${isActive('/ai-journal') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i><span>AI Journal</span>
              </button>
              <button onClick={() => navigate('/broadcasts')} className={navItemClass(isActive('/broadcasts'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/broadcasts') ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="relative">
                   <i className={`fas fa-bullhorn w-6 text-center text-lg ${isActive('/broadcasts') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i>
                   {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-bounce shadow-sm z-10">{unreadCount}</span>}
                </div>
                <span>Broadcasts</span>
              </button>
            </>
          );
      }
      if (userRole === Role.ADMIN) {
          const currentUser = getCurrentUser();
          const isGeneralAdmin = currentUser?.department === 'General' || !currentUser?.department;

          return (
            <>
              <div className="px-5 py-3 text-xs font-black text-surface-400 uppercase tracking-widest">Faculty Menu</div>
              <button onClick={() => navigate('/admin-dashboard?view=students')} className={navItemClass(isActive('/admin-dashboard', 'students') || (!location.search && location.pathname === '/admin-dashboard'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'students') || (!location.search && location.pathname === '/admin-dashboard') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-user-graduate w-6 text-center text-lg"></i><span>Students</span>
              </button>
              <button onClick={() => navigate('/admin-dashboard?view=overview')} className={navItemClass(isActive('/admin-dashboard', 'overview'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'overview') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-th-large w-6 text-center text-lg"></i><span>Overview</span>
              </button>
              <button onClick={() => navigate('/admin-dashboard?view=appointments')} className={navItemClass(isActive('/admin-dashboard', 'appointments'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'appointments') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-calendar-check w-6 text-center text-lg"></i><span>Appointments</span>
              </button>
              <button onClick={() => navigate('/admin-dashboard?view=interventions')} className={navItemClass(isActive('/admin-dashboard', 'interventions'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'interventions') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-clipboard-check w-6 text-center text-lg"></i><span>Interventions</span>
              </button>
              <button onClick={() => navigate('/admin-dashboard?view=emails')} className={navItemClass(isActive('/admin-dashboard', 'emails'))}>
                 <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'emails') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-envelope w-6 text-center text-lg"></i><span>Email Alerts</span>
              </button>
              <button onClick={() => navigate('/admin-dashboard?view=analytics')} className={navItemClass(isActive('/admin-dashboard', 'analytics'))}>
                 <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/admin-dashboard', 'analytics') ? 'opacity-100' : 'opacity-0'}`}></div>
                <i className="fas fa-chart-bar w-6 text-center text-lg"></i><span>Analytics</span>
              </button>
              <button onClick={() => navigate('/broadcasts')} className={navItemClass(isActive('/broadcasts'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/broadcasts') ? 'opacity-100' : 'opacity-0'}`}></div>
                <div className="relative">
                   <i className={`fas fa-bullhorn w-6 text-center text-lg ${isActive('/broadcasts') ? 'text-primary-500' : 'group-hover:text-primary-500 transition-colors'}`}></i>
                   {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border-2 border-white animate-bounce shadow-sm z-10">{unreadCount}</span>}
                </div>
                <span>Broadcasts</span>
              </button>
            </>
          );
      }
      if (userRole === Role.SUPER_ADMIN) {
        return (
          <>
            <div className="px-5 py-3 text-xs font-black text-surface-400 uppercase tracking-widest">Administration</div>
            <button onClick={() => navigate('/super-admin-dashboard?view=dashboard')} className={navItemClass(isActive('/super-admin-dashboard', 'dashboard') || (!location.search && location.pathname === '/super-admin-dashboard'))}>
               <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/super-admin-dashboard', 'dashboard') || (!location.search && location.pathname === '/super-admin-dashboard') ? 'opacity-100' : 'opacity-0'}`}></div>
              <i className="fas fa-tachometer-alt w-6 text-center text-lg"></i><span>Dashboard</span>
            </button>
            <button onClick={() => navigate('/super-admin-dashboard?view=students')} className={navItemClass(isActive('/super-admin-dashboard', 'students'))}>
               <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/super-admin-dashboard', 'students') ? 'opacity-100' : 'opacity-0'}`}></div>
              <i className="fas fa-users w-6 text-center text-lg"></i><span>Students</span>
            </button>
             <button onClick={() => navigate('/super-admin-dashboard?view=faculty')} className={navItemClass(isActive('/super-admin-dashboard', 'faculty'))}>
                <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/super-admin-dashboard', 'faculty') ? 'opacity-100' : 'opacity-0'}`}></div>
              <i className="fas fa-chalkboard-teacher w-6 text-center text-lg"></i><span>Faculty</span>
            </button>
            <button onClick={() => navigate('/super-admin-dashboard?view=analytics')} className={navItemClass(isActive('/super-admin-dashboard', 'analytics'))}>
               <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-r-md bg-gradient-to-b from-primary-400 to-secondary-400 transition-opacity ${isActive('/super-admin-dashboard', 'analytics') ? 'opacity-100' : 'opacity-0'}`}></div>
              <i className="fas fa-chart-pie w-6 text-center text-lg"></i><span>Analytics</span>
            </button>
          </>
        );
      }
  };

  return (
    <div className="min-h-screen bg-surface-50 flex font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 bg-blob w-[800px] h-[800px] rounded-full top-[-20%] left-[-20%] bg-primary-100/40 pointer-events-none"></div>

      <aside className="w-[280px] bg-white/70 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] fixed h-[calc(100vh-2rem)] m-4 rounded-[2rem] z-20 hidden lg:flex flex-col overflow-hidden">
        
        {/* Logo Section */}
        <div className="p-8 pb-4 flex justify-between items-center">
            <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => navigate('/')}>
                <div className="relative">
                    <div className="absolute inset-0 bg-primary-400 rounded-full blur-md opacity-0 group-hover:opacity-40 transition-opacity duration-500"></div>
                    <img src={LOGO_SRC} alt="WellNex Logo" className="w-12 h-12 object-contain relative z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300 bg-white rounded-full p-0.5" />
                </div>
                <h1 className="text-2xl font-extrabold text-surface-900 tracking-tight">Well<span className="text-primary-600">Nex</span></h1>
            </div>
            
            <button
                onClick={toggleTheme}
                className={`relative inline-flex h-7 w-14 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none shadow-inner ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
                title="Toggle Theme"
                role="switch"
                aria-checked={isDarkMode}
            >
                <span className="sr-only">Toggle theme</span>
                <span
                    className={`pointer-events-none relative inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out flex justify-center items-center ${isDarkMode ? 'translate-x-7' : 'translate-x-0'}`}
                >
                    <i className={`fas ${isDarkMode ? 'fa-moon text-indigo-600' : 'fa-sun text-amber-500'} text-[11px]`}></i>
                </span>
            </button>
        </div>

        {/* Navigation Section */}
        <nav className="p-5 space-y-1.5 flex-grow overflow-y-auto custom-scrollbar">
          {renderNavItems()}
        </nav>

        {/* User Profile Section */}
        <div className="p-6 pt-4 bg-gradient-to-t from-white/90 to-transparent">
          <div className="flex items-center space-x-4 mb-5 px-2 p-3 bg-white rounded-2xl shadow-sm border border-surface-100/50">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold shadow-md shadow-primary-500/20 text-lg">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-surface-900 truncate">{userName}</p>
              <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mt-0.5">{userRole === Role.SUPER_ADMIN ? 'System Admin' : userRole === Role.ADMIN ? 'Faculty' : 'Student'}</p>
            </div>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-5 py-3.5 bg-accent-50 text-accent-600 rounded-2xl hover:bg-accent-600 hover:text-white transition-all duration-300 text-sm font-bold shadow-sm group">
            <i className="fas fa-sign-out-alt group-hover:-translate-x-1 transition-transform"></i><span>Log Out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-[312px] p-6 lg:p-10 overflow-y-auto h-screen relative z-10 custom-scrollbar scroll-smooth">
        <div className="max-w-7xl mx-auto w-full animate-fade-in-up">
            {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;