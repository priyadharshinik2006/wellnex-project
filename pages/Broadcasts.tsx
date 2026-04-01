import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { getCurrentUser, getStudentNotifications, syncWithBackend } from '../services/storageService';
import { Role, SystemNotification } from '../types';

const Broadcasts: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'ALERT' | 'INFO' | 'REMINDER'>('ALL');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndData = async () => {
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        await syncWithBackend();
        const identifier = currentUser.role === Role.ADMIN ? currentUser.email : currentUser.rollNumber;
        setNotifications(getStudentNotifications(identifier));
      }
      setLoading(false);
    };
    fetchUserAndData();
  }, []);

  const markAsRead = (id: string) => {
    // Optimistic reading
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    // In a real app we would ping the backend here: fetchWithAuth(`/notifications/${id}/read`, { method: 'PATCH' })
    const allNotifs = JSON.parse(localStorage.getItem('swrs_notifications') || '[]');
    const index = allNotifs.findIndex((n: any) => n.id === id);
    if(index !== -1) {
        allNotifs[index].isRead = true;
        localStorage.setItem('swrs_notifications', JSON.stringify(allNotifs));
    }
  };

  const filteredNotifications = notifications.filter(n => filter === 'ALL' || n.type === filter);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading || !user) {
    return (
      <Layout userRole={Role.STUDENT} userName="Loading...">
        <div className="flex justify-center items-center h-full">
            <i className="fas fa-spinner fa-spin text-3xl text-indigo-500"></i>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userRole={user.role} userName={user.name}>
      <div className="space-y-6 pb-12 font-sans text-slate-800 animate-fade-in-up">
        
        {/* Header */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-indigo-50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center">
                        <i className="fas fa-bullhorn text-indigo-500 mr-3"></i> System Broadcasts
                    </h1>
                    <p className="text-slate-500 font-medium mt-2 max-w-lg">
                        Stay updated with the latest announcements, urgent alerts, and wellness reminders from the administration.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-red-500/20 font-bold text-sm flex items-center animate-pulse-slow">
                        <i className="fas fa-bell mr-2"></i> {unreadCount} Unread Message{unreadCount > 1 ? 's' : ''}
                    </div>
                )}
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {['ALL', 'INFO', 'ALERT', 'REMINDER'].map(type => (
                <button
                    key={type}
                    onClick={() => setFilter(type as any)}
                    className={`px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${
                        filter === type 
                        ? 'bg-slate-800 text-white shadow-md' 
                        : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
                    }`}
                >
                    {type === 'ALL' ? 'All Messages' : type === 'INFO' ? 'Information' : type === 'ALERT' ? 'Urgent Alerts' : 'Reminders'}
                </button>
            ))}
        </div>

        {/* Messages List */}
        <div className="space-y-4">
            {filteredNotifications.length === 0 ? (
                <div className="bg-white/60 backdrop-blur-md rounded-3xl border border-white p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <i className="fas fa-inbox text-3xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-700">No Messages Found</h3>
                    <p className="text-slate-500 mt-2">You don't have any {filter !== 'ALL' ? filter.toLowerCase() : ''} broadcasts at the moment.</p>
                </div>
            ) : (
                filteredNotifications.map((notif, index) => {
                    const isAlert = notif.type === 'ALERT';
                    const isReminder = notif.type === 'REMINDER';
                    const isInfo = notif.type === 'INFO';
                    
                    return (
                        <div 
                            key={notif.id} 
                            className={`relative bg-white rounded-3xl p-6 md:p-8 flex flex-col md:flex-row gap-6 shadow-sm border transition-all hover:shadow-md transform hover:-translate-y-1 ${
                                !notif.isRead ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-slate-100'
                            }`}
                            style={{ animationDelay: `${index * 0.05}s` }}
                        >
                            {/* Unread Indicator */}
                            {!notif.isRead && (
                                <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden rounded-tr-3xl pointer-events-none">
                                    <div className="absolute top-2 -right-6 bg-red-500 text-white text-[10px] font-bold py-1 px-8 rotate-45 shadow-sm">NEW</div>
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl shadow-inner ${
                                isAlert ? 'bg-red-50 text-red-500 border border-red-100' : 
                                isReminder ? 'bg-orange-50 text-orange-500 border border-orange-100' : 
                                'bg-blue-50 text-blue-500 border border-blue-100'
                            }`}>
                                <i className={`fas ${isAlert ? 'fa-exclamation-triangle' : isReminder ? 'fa-clock' : 'fa-info-circle'}`}></i>
                            </div>

                            {/* Content */}
                            <div className="flex-1">
                                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-2">
                                    <h3 className={`text-lg font-bold ${
                                        isAlert ? 'text-red-700' : isReminder ? 'text-orange-700' : 'text-blue-700'
                                    }`}>
                                        {isAlert ? 'Critical System Alert' : isReminder ? 'Wellness Reminder' : 'General Information'}
                                    </h3>
                                    <span className="text-xs font-bold text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100 w-fit">
                                        {notif.date}
                                    </span>
                                </div>
                                <p className={`text-slate-600 leading-relaxed font-medium ${!notif.isRead ? 'text-slate-800' : ''}`}>
                                    {notif.message}
                                </p>
                            </div>

                            {/* Action */}
                            <div className="flex items-center md:items-start justify-end flex-shrink-0">
                                {!notif.isRead ? (
                                    <button 
                                        onClick={() => markAsRead(notif.id)}
                                        className="px-5 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-sm font-bold transition-colors border border-indigo-100 hover:border-indigo-600 w-full md:w-auto"
                                    >
                                        Mark as Read
                                    </button>
                                ) : (
                                    <div className="px-5 py-2 text-slate-400 flex items-center text-sm font-bold">
                                        <i className="fas fa-check-double mr-2"></i> Read
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </Layout>
  );
};

export default Broadcasts;
