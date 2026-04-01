import React from 'react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const LOGO_SRC = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICA8Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0OCIgZmlsbD0id2hpdGUiIHN0cm9rZT0iI0UwRTdGRiIgc3Ryb2tlLXdpZHRoPSIyIi8+CiAgPHBhdGggZD0iTTUwIDE1IEM1MCAxNSA4NSA0MCA4NSA2NSBDODUgOTAgNjAgOTUgNTAgOTUgQzQwIDk1IDE1IDkwIDE1IDY1IEMxNSA0MCA1MCAxNSA1MCAxNSBaIiBmaWxsPSIjZWNmZGY1Ii8+CiAgPHBhdGggZD0iTTUwIDIwIEM1MCAyMCA4MCA0NSA4MCA2NSBDODAgODUgNjAgOTUgNTAgOTUgQzNDIDk1IDIwIDg1IDIwIDY1IEMyMCA0NSA1MCAyMCA1MCAyMCBaIiBmaWxsPSJub25lIiBzdHJva2U9IiMxMGI5ODEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI0NSIgcj0iOSIgZmlsbD0iIzQzMzhjYSIvPgogIDxwYXRoIGQ9Ik0zMyA4MCBDMzMgNjUgNDIgNTggNTAgNTggQzU4IDU4IDY3IDY1IDY3IDgwIiBmaWxsPSJub25lIiBzdHJva2U9IiM0MzM4Y2EiIHN0cm9rZS13aWR0aD0iNSIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIi8+Cjwvc3ZnPg==";

  return (
    <div className="relative min-h-screen bg-surface-50 flex flex-col font-sans text-surface-900 overflow-hidden">
      
      {/* Animated Background Elements */}
      <div className="bg-blob w-[500px] h-[500px] rounded-full top-[-10%] left-[-10%] bg-primary-100/60"></div>
      <div className="bg-blob w-[600px] h-[600px] rounded-full bottom-[-10%] right-[-10%] bg-secondary-100/60" style={{ animationDelay: '2s' }}></div>
      <div className="bg-blob w-[400px] h-[400px] rounded-full top-[40%] left-[60%] bg-accent-50/60" style={{ animationDelay: '4s' }}></div>

      {/* Decorative Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Navigation Bar */}
      <nav className="glass fixed top-0 w-full z-50 px-6 md:px-12 py-4 flex justify-between items-center bg-white/60">
        <div className="flex items-center gap-3">
          <img src={LOGO_SRC} alt="WellNex" className="w-10 h-10 object-contain drop-shadow" />
          <span className="text-xl font-bold tracking-tight text-surface-900">Well<span className="text-primary-600">Nex</span></span>
        </div>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-surface-600">
           <button onClick={() => navigate('/about')} className="hover:text-primary-600 transition-colors">About</button>
           <button onClick={() => navigate('/privacy')} className="hover:text-primary-600 transition-colors">Privacy</button>
           <button onClick={() => navigate('/help')} className="hover:text-primary-600 transition-colors">Help</button>
        </div>
      </nav>

      <main className="flex-grow flex flex-col items-center pt-32 pb-20 px-6 md:px-12 w-full max-w-7xl mx-auto space-y-24 z-10 relative">
        
        {/* HERO SECTION */}
        <div className="text-center space-y-8 max-w-4xl animate-fade-in-up">
          <div className="inline-flex items-center justify-center mb-4 relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
            <img 
              src={LOGO_SRC}
              alt="WellNex Logo" 
              className="relative w-36 h-36 object-contain drop-shadow-xl hover:scale-105 transition-transform duration-300 bg-white rounded-full p-2"
            />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight mb-4">
            <span className="text-surface-900">Elevate Your </span>
            <span className="text-gradient">Well-being.</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-surface-600 font-medium max-w-2xl mx-auto leading-relaxed">
            Intelligent, confidential, AI-powered wellness insights tailored for academic success.
          </p>
          
          <div className="flex items-center justify-center gap-4 text-xs md:text-sm font-bold text-surface-400 uppercase tracking-widest pt-6">
            <span className="flex items-center gap-2"><i className="fas fa-shield-alt text-primary-400"></i> Secure</span>
            <span className="w-1.5 h-1.5 rounded-full bg-surface-300"></span>
            <span className="flex items-center gap-2"><i className="fas fa-lock text-secondary-400"></i> Confidential</span>
            <span className="w-1.5 h-1.5 rounded-full bg-surface-300"></span>
            <span className="flex items-center gap-2"><i className="fas fa-brain text-accent-400"></i> AI-Driven</span>
          </div>
        </div>

        {/* LOGIN CARDS SECTION */}
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-4xl px-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          
          {/* Student Portal Card */}
          <div className="glass-card p-10 rounded-[2.5rem] hover-glow group flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-400 to-primary-600"></div>
             <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                <i className="fas fa-user-graduate"></i>
             </div>
             <h3 className="text-2xl font-bold mb-3 text-surface-900">Student Portal</h3>
             <p className="text-surface-500 mb-8 leading-relaxed text-sm md:text-base">
               Access your personalized dashboard, track wellness trends, and receive AI-driven recommendations.
             </p>
             <button 
                onClick={() => navigate('/login/student')}
                className="w-full py-4 rounded-2xl bg-surface-900 text-white font-bold text-sm tracking-wide shadow-xl shadow-surface-900/20 hover:bg-primary-600 hover:shadow-primary-600/40 transition-all active:scale-[0.98]"
             >
                Continue as Student <i className="fas fa-arrow-right ml-2"></i>
             </button>
          </div>

          {/* Faculty Portal Card */}
          <div className="glass-card p-10 rounded-[2.5rem] hover-glow group flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary-400 to-secondary-600"></div>
             <div className="w-20 h-20 bg-secondary-50 text-secondary-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-inner group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                <i className="fas fa-chalkboard-teacher"></i>
             </div>
             <h3 className="text-2xl font-bold mb-3 text-surface-900">Faculty & Admin</h3>
             <p className="text-surface-500 mb-8 leading-relaxed text-sm md:text-base">
               Monitor aggregate wellness analytics, identify trends, and provide timely, data-driven support.
             </p>
             <button 
                onClick={() => navigate('/login/admin')}
                className="w-full py-4 rounded-2xl bg-surface-100 text-surface-900 border border-surface-200 font-bold text-sm tracking-wide shadow-md hover:bg-secondary-600 hover:text-white hover:border-transparent hover:shadow-secondary-600/40 transition-all active:scale-[0.98]"
             >
                Continue as Faculty <i className="fas fa-arrow-right ml-2"></i>
             </button>
          </div>

        </div>

        {/* HOW IT WORKS SECTION */}
        <div className="w-full max-w-5xl pt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-center text-3xl font-bold text-surface-900 mb-16">How WellNex Works</h3>
            <div className="grid md:grid-cols-3 gap-12 text-center px-4 relative">
                {/* Connecting Line */}
                <div className="hidden md:block absolute top-10 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-primary-200 via-secondary-200 to-accent-200 z-0"></div>

                {/* Step 1 */}
                <div className="flex flex-col items-center space-y-4 relative z-10 group">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-surface-200 text-primary-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary-900/5 group-hover:-translate-y-2 transition-transform duration-300">
                        <i className="fas fa-clipboard-list"></i>
                    </div>
                    <h4 className="text-lg font-bold text-surface-900">Quick Survey</h4>
                    <p className="text-surface-500 text-sm leading-relaxed px-2">Log daily stress & sleep securely in just seconds.</p>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col items-center space-y-4 relative z-10 group">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-surface-200 text-secondary-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-secondary-900/5 group-hover:-translate-y-2 transition-transform duration-300">
                        <i className="fas fa-chart-line"></i>
                    </div>
                    <h4 className="text-lg font-bold text-surface-900">AI Insights</h4>
                    <p className="text-surface-500 text-sm leading-relaxed px-2">Receive tailored recommendations based on smart analytics.</p>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col items-center space-y-4 relative z-10 group">
                    <div className="w-20 h-20 rounded-2xl bg-white border border-surface-200 text-accent-600 flex items-center justify-center text-2xl font-bold shadow-lg shadow-accent-900/5 group-hover:-translate-y-2 transition-transform duration-300">
                        <i className="fas fa-hands-helping"></i>
                    </div>
                    <h4 className="text-lg font-bold text-surface-900">Proactive Support</h4>
                    <p className="text-surface-500 text-sm leading-relaxed px-2">Connect seamlessly with campus counselors when needed.</p>
                </div>
            </div>
        </div>

      </main>

      {/* FOOTER */}
      <footer className="relative w-full border-t border-surface-200/50 py-8 mt-auto z-10 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center text-sm text-surface-500">
              <div className="flex space-x-6 mb-4 md:mb-0 font-medium">
                  <button onClick={() => navigate('/about')} className="hover:text-primary-600 transition-colors">About</button>
                  <button onClick={() => navigate('/privacy')} className="hover:text-primary-600 transition-colors">Privacy</button>
                  <button onClick={() => navigate('/help')} className="hover:text-primary-600 transition-colors">Help</button>
              </div>
              <div className="flex items-center gap-2 font-medium">
                  WellNex &copy; {new Date().getFullYear()}
              </div>
          </div>
      </footer>
    </div>
  );
};

export default Landing;