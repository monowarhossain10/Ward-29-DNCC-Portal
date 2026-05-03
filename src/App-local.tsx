import React, { useState, useEffect } from 'react';
import { 
  Search, 
  UserPlus, 
  MessageSquare, 
  ShieldCheck, 
  Menu, 
  X, 
  Printer, 
  Languages,
  CheckCircle2,
  Clock,
  LayoutDashboard,
  QrCode,
  Newspaper,
  Image as ImageIcon,
  Trash2,
  Plus,
  Pencil,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Share2,
  Facebook,
  Twitter,
  MessageCircle,
  Link2,
  HelpCircle,
  Sun,
  Moon,
  Info,
  Shield,
  FileText,
  ChevronDown,
  Mail,
  Send,
  Sparkles,
  UserCheck,
  User,
  Edit3,
  Users,
  Phone,
  Lock
} from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { translations } from './translations';
import QRCode from 'qrcode';
import { 
  localAuth,
  newsAPI,
  volunteersAPI,
  complaintsAPI,
  eventsAPI,
  galleryAPI,
  votersAPI,
  councilMembersAPI,
  councilorAPI,
  voterAPI
} from './lib/local-api';

interface AdminUser {
  uid: string;
  email: string;
  displayName: string;
  role: string;
}

interface News {
  id: number;
  title_en: string;
  title_bn: string;
  content_en: string;
  content_bn: string;
  image?: string;
  created_at: string;
}

interface Volunteer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  skills: string;
  status: string;
  created_at: string;
}

interface Complaint {
  id: number;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  admin_note?: string;
  tracking_id: string;
  created_at: string;
}

interface Event {
  id: number;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  event_date: string;
  location_en: string;
  location_bn: string;
  image?: string;
  created_at: string;
}

interface Gallery {
  id: number;
  caption_en: string;
  caption_bn: string;
  image: string;
  created_at: string;
}

interface Voter {
  id: number;
  nid: string;
  dob: string;
  name_en: string;
  name_bn: string;
  father_name: string;
  mother_name: string;
  address: string;
  serial_no: string;
  polling_center_en: string;
  polling_center_bn: string;
  booth_no: string;
  photo?: string;
  created_at: string;
}

interface CouncilMember {
  id: number;
  name_en: string;
  name_bn: string;
  position_en: string;
  position_bn: string;
  phone: string;
  email: string;
  photo?: string;
  created_at: string;
}

interface Councilor {
  name_en: string;
  name_bn: string;
  title_en: string;
  title_bn: string;
  phone: string;
  email: string;
  address_en: string;
  address_bn: string;
  bio_en: string;
  bio_bn: string;
  photo?: string;
}

export default function App() {
  const [lang, setLang] = useState<'en' | 'bn'>('en');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isAdminReady, setIsAdminReady] = useState(false);
  
  // Toast notifications
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  
  // Admin state
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  
  // Data states
  const [news, setNews] = useState<News[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [gallery, setGallery] = useState<Gallery[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);
  const [councilorProfile, setCouncilorProfile] = useState<Councilor | null>(null);
  
  // Form states
  const [newNews, setNewNews] = useState({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
  const [editingNews, setEditingNews] = useState<News | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{type: string, id: number} | null>(null);
  
  // Initialize auth
  useEffect(() => {
    const currentUser = localAuth.getCurrentUser();
    if (currentUser) {
      setAdminUser(currentUser);
    }
    setIsAdminReady(true);
  }, []);
  
  // Load data when tab changes
  useEffect(() => {
    if (activeTab === 'admin' || activeTab === 'home') {
      fetchAdminData();
    }
  }, [activeTab]);
  
  // Fetch admin data
  const fetchAdminData = async () => {
    try {
      const [galleryData, newsData, eventsData, councilMembersData, volunteersData, complaintsData, votersData] = await Promise.all([
        galleryAPI.getAll(),
        newsAPI.getAll(),
        eventsAPI.getAll(),
        councilMembersAPI.getAll(),
        volunteersAPI.getAll(),
        complaintsAPI.getAll(),
        votersAPI.getAll()
      ]);
      
      setGallery(galleryData);
      setNews(newsData);
      setEvents(eventsData);
      setCouncilMembers(councilMembersData);
      setVolunteers(volunteersData);
      setComplaints(complaintsData);
      setVoters(votersData);
      
      // Fetch councilor profile
      try {
        const councilor = await councilorAPI.get();
        setCouncilorProfile(councilor);
      } catch (err) {
        console.error("Councilor fetch error:", err);
      }
    } catch (err) {
      console.error("Admin data fetch error:", err);
      showToast('Failed to fetch admin data', 'error');
    }
  };
  
  // Admin login
  const handleAdminLogin = async (method: 'google' | 'email') => {
    setAdminLoginError('');
    try {
      if (method === 'google') {
        setAdminLoginError("Google login not available with local database. Please use email/password.");
        return;
      } else {
        if (!adminEmail || !adminPassword) {
          setAdminLoginError("Email and password are required");
          return;
        }
        
        const result = await localAuth.login(adminEmail, adminPassword);
        setAdminUser(result.user);
        setActiveTab('admin');
        setAdminEmail('');
        setAdminPassword('');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setAdminLoginError("Invalid email or password");
    }
  };
  
  // Admin logout
  const handleAdminLogout = async () => {
    try {
      localAuth.logout();
      setAdminUser(null);
      setActiveTab('home');
    } catch (err) {
      console.error(err);
    }
  };
  
  // News functions
  const addNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    
    try {
      const newsData = {
        ...newNews,
        image: newNews.image || null
      };
      
      await newsAPI.create(newsData);
      setNewNews({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'সংবাদ যোগ করা হয়েছে' : 'News added successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to add news', 'error');
    }
  };
  
  const updateNews = async () => {
    if (!adminUser || !editingNews) return;
    
    try {
      await newsAPI.update(editingNews.id.toString(), editingNews);
      setEditingNews(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'সংবাদ আপডেট করা হয়েছে' : 'News updated successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to update news', 'error');
    }
  };
  
  const deleteNews = async (id: number) => {
    if (!adminUser) return;
    
    try {
      await newsAPI.delete(id.toString());
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'সংবাদ মুছে ফেলা হয়েছে' : 'News deleted successfully');
    } catch (err) {
      console.error(err);
      showToast('Failed to delete news', 'error');
    }
  };
  
  const t = translations[lang];
  
  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}
      
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <img src="/dncc-logo.png" alt="DNCC Logo" className="w-8 h-8 mr-2" />
              <span className="text-xl font-bold">Ward 29 DNCC</span>
            </div>
            
            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <button onClick={() => setActiveTab('home')} className={activeTab === 'home' ? 'text-blue-600' : ''}>
                {t.home}
              </button>
              <button onClick={() => setActiveTab('services')} className={activeTab === 'services' ? 'text-blue-600' : ''}>
                {t.services}
              </button>
              <button onClick={() => setActiveTab('community')} className={activeTab === 'community' ? 'text-blue-600' : ''}>
                {t.community}
              </button>
              <button onClick={() => setActiveTab('events')} className={activeTab === 'events' ? 'text-blue-600' : ''}>
                {t.events}
              </button>
              <button onClick={() => setActiveTab('news')} className={activeTab === 'news' ? 'text-blue-600' : ''}>
                {t.news}
              </button>
              <button onClick={() => setActiveTab('gallery')} className={activeTab === 'gallery' ? 'text-blue-600' : ''}>
                {t.gallery}
              </button>
              {adminUser && (
                <button onClick={() => setActiveTab('admin')} className={activeTab === 'admin' ? 'text-blue-600' : ''}>
                  {t.admin || 'Admin'}
                </button>
              )}
            </nav>
            
            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'bn' : 'en')}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Languages size={20} />
              </button>
              
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              {/* Admin Login/Logout */}
              {adminUser ? (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{adminUser.displayName}</span>
                  <button
                    onClick={handleAdminLogout}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Lock size={20} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setActiveTab('admin')}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <User size={20} />
                </button>
              )}
              
              {/* Mobile Menu */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Admin Login */}
        {activeTab === 'admin' && !adminUser && isAdminReady && (
          <div className="max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
              
              {adminLoginError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {adminLoginError}
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@ward29.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input
                    type="password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin('email')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                  />
                </div>
                
                <button
                  onClick={() => handleAdminLogin('email')}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Admin Panel */}
        {activeTab === 'admin' && adminUser && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
            
            {/* News Management */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold mb-6">News Management</h2>
              
              {/* Add News Form */}
              <form onSubmit={addNews} className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Add News</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Title (English)</label>
                    <input
                      type="text"
                      value={newNews.title_en}
                      onChange={(e) => setNewNews({...newNews, title_en: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Title (Bangla)</label>
                    <input
                      type="text"
                      value={newNews.title_bn}
                      onChange={(e) => setNewNews({...newNews, title_bn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Content (English)</label>
                    <textarea
                      value={newNews.content_en}
                      onChange={(e) => setNewNews({...newNews, content_en: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Content (Bangla)</label>
                    <textarea
                      value={newNews.content_bn}
                      onChange={(e) => setNewNews({...newNews, content_bn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">Image URL</label>
                    <input
                      type="text"
                      value={newNews.image}
                      onChange={(e) => setNewNews({...newNews, image: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>
                </div>
                
                <button
                  type="submit"
                  className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add News
                </button>
              </form>
              
              {/* News List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Latest News</h3>
                {news.length === 0 ? (
                  <p className="text-gray-500">No news found</p>
                ) : (
                  <div className="space-y-4">
                    {news.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.title_en}</h4>
                            <p className="text-sm text-gray-600">{item.title_bn}</p>
                            <p className="mt-2">{item.content_en}</p>
                            <p className="text-sm text-gray-600 mt-1">{item.content_bn}</p>
                            {item.image && (
                              <img src={item.image} alt={item.title_en} className="mt-2 max-w-xs rounded" />
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={() => setEditingNews(item)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({type: 'news', id: item.id})}
                              className="p-2 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* News Page */}
        {activeTab === 'news' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Latest News</h1>
            {news.length === 0 ? (
              <p className="text-gray-500">No news available</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {news.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {item.image && (
                      <img src={item.image} alt={item.title_en} className="w-full h-48 object-cover" />
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold mb-2">{item.title_en}</h3>
                      <p className="text-sm text-gray-600 mb-4">{item.title_bn}</p>
                      <p className="text-gray-700">{item.content_en}</p>
                      <p className="text-sm text-gray-600 mt-2">{item.content_bn}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Home Page */}
        {activeTab === 'home' && (
          <div>
            <h1 className="text-3xl font-bold mb-8">Welcome to Ward 29 DNCC Portal</h1>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <p className="text-lg mb-4">
                Digital platform for civic services in Ward 29, Dhaka North City Corporation.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
                <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
                  <QrCode className="text-blue-600 mb-4" size={32} />
                  <h3 className="font-semibold mb-2">Voter Slip</h3>
                  <p className="text-sm">Generate and verify voter slips</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                  <UserPlus className="text-green-600 mb-4" size={32} />
                  <h3 className="font-semibold mb-2">Volunteer</h3>
                  <p className="text-sm">Join as a volunteer</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 p-6 rounded-lg">
                  <MessageSquare className="text-purple-600 mb-4" size={32} />
                  <h3 className="font-semibold mb-2">Complaint</h3>
                  <p className="text-sm">File complaints online</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Other tabs can be added similarly... */}
      </main>
      
      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-6">Are you sure you want to delete this {deleteConfirm.type}?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirm.type === 'news') {
                    deleteNews(deleteConfirm.id);
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit News Modal */}
      {editingNews && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit News</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title (English)</label>
                <input
                  type="text"
                  value={editingNews.title_en}
                  onChange={(e) => setEditingNews({...editingNews, title_en: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Title (Bangla)</label>
                <input
                  type="text"
                  value={editingNews.title_bn}
                  onChange={(e) => setEditingNews({...editingNews, title_bn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Content (English)</label>
                <textarea
                  value={editingNews.content_en}
                  onChange={(e) => setEditingNews({...editingNews, content_en: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Content (Bangla)</label>
                <textarea
                  value={editingNews.content_bn}
                  onChange={(e) => setEditingNews({...editingNews, content_bn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  type="text"
                  value={editingNews.image || ''}
                  onChange={(e) => setEditingNews({...editingNews, image: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setEditingNews(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={updateNews}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
