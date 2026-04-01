import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Role, StudentProfile } from '../types';
import { getCurrentUser, getCommunityPosts, saveCommunityPost, likeCommunityPost, addCommunityComment } from '../services/storageService';

interface Post {
  id: string;
  category: string;
  content: string;
  authorAlias: string; // Anonymous names like "Quiet Thinker"
  likes: number;
  comments: Comment[];
  timestamp: number;
  timeAgo: string;
}

interface Comment {
  id: string;
  content: string;
  authorAlias: string;
  timestamp: number;
}

const CATEGORIES = ['All', 'Stress Relief', 'Study Help', 'Motivation', 'Vent'];
const ALIASES = ['Quiet Thinker', 'Midnight Scholar', 'Zen Seeker', 'Coffee Bean', 'Cloud Watcher', 'Wandering Mind'];

const PeerCommunity: React.FC = () => {
  const [user, setUser] = useState<StudentProfile | null>(null);
  const [activeCategory, setActiveCategory] = useState('All');
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("Stress Relief");
  const [activeCommentPost, setActiveCommentPost] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");

  const loadPosts = async () => {
      try {
          const storedPosts = await getCommunityPosts();
          setPosts(storedPosts);
      } catch (error) {
          console.error("Failed to load posts", error);
      }
  };

  useEffect(() => {
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.role === Role.STUDENT) {
      setUser(currentUser);
      loadPosts();
    }
  }, []);

  const getRandomAlias = () => ALIASES[Math.floor(Math.random() * ALIASES.length)];

  const handlePostSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newPostContent.trim()) return;

      const newPost = {
          category: newPostCategory,
          content: newPostContent,
          authorAlias: getRandomAlias()
      };

      await saveCommunityPost(newPost);
      loadPosts(); // Reload from backend
      setNewPostContent("");
  };

  const handleLike = async (postId: string) => {
      await likeCommunityPost(postId);
      loadPosts(); // Reload from backend
  };

  const submitComment = async (e: React.FormEvent, postId: string) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      const comment = {
          content: newComment,
          authorAlias: getRandomAlias()
      };

      await addCommunityComment(postId, comment);
      loadPosts(); // Reload from backend
      setNewComment("");
      setActiveCommentPost(null);
  };

  const filteredPosts = activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory);

  if (!user) return null;

  return (
    <Layout userRole={Role.STUDENT} userName={user.name}>
      <div className="max-w-4xl mx-auto space-y-8 pb-10">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
             <div>
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Peer Support</h1>
                <p className="text-slate-500 mt-1">A safe, anonymous space to share and support each other.</p>
             </div>
             <div className="mt-4 md:mt-0 flex items-center bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 text-indigo-700">
                <i className="fas fa-user-secret mr-2"></i>
                <span className="font-bold text-sm">Posting Anonymously</span>
             </div>
        </div>

        {/* Create Post */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <form onSubmit={handlePostSubmit}>
                <textarea 
                    placeholder="Share what's on your mind... (Your identity is completely hidden)"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    className="w-full bg-gray-50 border-none p-4 rounded-2xl text-slate-700 resize-none h-28 focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                ></textarea>
                <div className="flex justify-between items-center">
                    <select 
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="bg-white border border-gray-200 text-sm font-bold text-slate-600 rounded-xl px-4 py-2 outline-none focus:border-indigo-500"
                    >
                        <option value="Stress Relief">Stress Relief</option>
                        <option value="Study Help">Study Help</option>
                        <option value="Motivation">Motivation</option>
                        <option value="Vent">Vent</option>
                    </select>
                    <button 
                        type="submit"
                        disabled={!newPostContent.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-200 transition-all flex items-center"
                    >
                        <i className="fas fa-paper-plane mr-2"></i> Post
                    </button>
                </div>
            </form>
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
                <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-5 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-500 border border-gray-200 hover:bg-gray-50'}`}
                >
                    {cat}
                </button>
            ))}
        </div>

        {/* Feed */}
        <div className="space-y-6">
            {filteredPosts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
                    <i className="fas fa-comment-dots text-4xl text-gray-300 mb-3"></i>
                    <p className="font-bold text-gray-500">No posts in this category yet.</p>
                </div>
            ) : (
                filteredPosts.map(post => (
                    <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col group">
                        
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-500 flex items-center justify-center text-lg">
                                    <i className="fas fa-user-astronaut"></i>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800">{post.authorAlias}</h4>
                                    <span className="text-xs text-slate-400 font-medium">{post.timeAgo}</span>
                                </div>
                            </div>
                            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                {post.category}
                            </span>
                        </div>
                        
                        <p className="text-slate-700 leading-relaxed mb-6">
                            {post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm font-bold text-gray-500 border-t border-gray-100 pt-4 mt-auto">
                            <button 
                                onClick={() => handleLike(post.id)}
                                className="flex items-center gap-1.5 hover:text-red-500 transition-colors"
                            >
                                <i className="fas fa-heart text-red-500/70"></i> {post.likes}
                            </button>
                            <button 
                                onClick={() => setActiveCommentPost(activeCommentPost === post.id ? null : post.id)}
                                className="flex items-center gap-1.5 hover:text-indigo-500 transition-colors"
                            >
                                <i className="fas fa-comment text-indigo-400"></i> {post.comments.length} Comments
                            </button>
                        </div>
                        
                        {/* Comments Section */}
                        {(post.comments.length > 0 || activeCommentPost === post.id) && (
                            <div className="bg-gray-50 rounded-2xl p-4 mt-4 space-y-4">
                                {post.comments.map(c => (
                                    <div key={c.id} className="text-sm">
                                        <span className="font-bold text-slate-700 mr-2">{c.authorAlias}:</span>
                                        <span className="text-slate-600">{c.content}</span>
                                    </div>
                                ))}
                                
                                {activeCommentPost === post.id && (
                                    <form onSubmit={(e) => submitComment(e, post.id)} className="flex gap-2 mt-2">
                                        <input 
                                            type="text" 
                                            placeholder="Write an encouraging comment..."
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            className="w-full bg-white border border-gray-200 p-2.5 rounded-xl text-sm outline-none focus:border-indigo-400"
                                            autoFocus
                                        />
                                        <button type="submit" className="bg-indigo-600 text-white px-4 rounded-xl text-sm font-bold hover:bg-indigo-700">
                                            Reply
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                        
                    </div>
                ))
            )}
        </div>

      </div>
    </Layout>
  );
};

export default PeerCommunity;
