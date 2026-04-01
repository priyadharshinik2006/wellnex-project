import React, { useState, useRef, useEffect } from 'react';
import { getCurrentUser } from '../services/storageService';
import { Role } from '../types';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState<Role>(Role.STUDENT);

  useEffect(() => {
      const user = getCurrentUser();
      if (user) setUserRole(user.role);
      
      setMessages([
          { 
            text: user?.role === Role.ADMIN 
              ? "Hello Faculty. I can help suggest intervention strategies for at-risk students." 
              : "Hi! I'm your wellness assistant. How are you feeling today?", 
            isBot: true 
          }
      ]);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const getBotResponse = (msg: string) => {
    const lowerMsg = msg.toLowerCase();
    
    if (userRole === Role.ADMIN) {
        if (lowerMsg.includes('high risk') || lowerMsg.includes('critical')) {
            return "For high-risk students, consider scheduling an immediate 1:1 session. Look for patterns in sleep deprivation and academic pressure.";
        }
        if (lowerMsg.includes('intervention') || lowerMsg.includes('help')) {
            return "Intervention strategies include: 1. Academic workload adjustment. 2. Referral to peer mentorship. 3. Professional counseling referral.";
        }
        if (lowerMsg.includes('inactive')) {
            return "For inactive students, a gentle automated reminder often works. If they miss 5+ days, a personal email is recommended.";
        }
        return "I can assist with risk assessment strategies and intervention planning. Ask me about 'high risk' or 'intervention'.";
    }

    // Student Logic
    if (lowerMsg.includes('stress') || lowerMsg.includes('worried') || lowerMsg.includes('tense')) {
      return "I hear you. Stress is tough. Have you tried the 4-7-8 breathing technique? Inhale for 4s, hold for 7s, exhale for 8s. It really helps!";
    }
    if (lowerMsg.includes('sleep') || lowerMsg.includes('tired') || lowerMsg.includes('insomnia')) {
      return "Sleep is vital. Try avoiding screens 1 hour before bed and keep your room cool. A warm tea might help too.";
    }
    if (lowerMsg.includes('exam') || lowerMsg.includes('study') || lowerMsg.includes('fail')) {
      return "Exams can be overwhelming. Break your study material into small chunks and take 5-minute breaks every 25 minutes (Pomodoro technique). You got this!";
    }
    if (lowerMsg.includes('sad') || lowerMsg.includes('depressed') || lowerMsg.includes('lonely')) {
      return "It's okay to feel this way sometimes. If this feeling persists, please consider reaching out to a counselor through the dashboard recommendations.";
    }
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi')) {
      return "Hello there! I'm here to listen. What's on your mind?";
    }
    return "Thank you for sharing. Remember, taking care of your mental health is as important as your grades. Try taking a short walk or drinking some water.";
  };

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
    setInput('');

    setTimeout(() => {
      const botResponse = getBotResponse(userMsg);
      setMessages(prev => [...prev, { text: botResponse, isBot: true }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-white w-80 h-96 rounded-2xl shadow-2xl border border-gray-100 flex flex-col mb-4 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-4 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <i className="fas fa-robot text-lg"></i>
              <span className="font-semibold">{userRole === Role.ADMIN ? 'Faculty Assistant' : 'Wellness Buddy'}</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-gray-200">
              <i className="fas fa-times"></i>
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed ${
                  m.isBot 
                    ? 'bg-white text-slate-700 shadow-sm rounded-tl-none border border-gray-100' 
                    : 'bg-indigo-500 text-white rounded-tr-none'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex space-x-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type message..."
              className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
            <button 
              onClick={handleSend}
              className="bg-indigo-500 text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-indigo-600 transition-colors"
            >
              <i className="fas fa-paper-plane text-xs"></i>
            </button>
          </div>
        </div>
      )}

      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`${isOpen ? 'bg-red-400 rotate-45' : 'bg-gradient-to-r from-indigo-500 to-purple-600'} text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110`}
      >
        <i className={`fas ${userRole === Role.ADMIN ? 'fa-brain' : 'fa-comment-medical'} text-2xl`}></i>
      </button>
    </div>
  );
};

export default Chatbot;