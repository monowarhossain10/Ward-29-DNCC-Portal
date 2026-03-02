import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  ExternalLink,
  ChevronRight,
  AlertCircle,
  Share2
} from 'lucide-react';
import { translations } from './translations';
import QRCode from 'qrcode';

type Language = 'en' | 'bn';

interface Voter {
  id: number;
  nid: string;
  dob: string;
  name_en: string;
  name_bn: string;
  serial_no: string;
  polling_center_en: string;
  polling_center_bn: string;
  booth_no: string;
}

interface Volunteer {
  id: number;
  name: string;
  phone: string;
  email: string;
  photo: string;
  status: 'pending' | 'approved';
  created_at: string;
}

interface Complaint {
  id: number;
  tracking_id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string;
  created_at: string;
}

interface NewsItem {
  id: number;
  title_en: string;
  title_bn: string;
  content_en: string;
  content_bn: string;
  image: string;
  created_at: string;
}

interface GalleryItem {
  id: number;
  caption_en: string;
  caption_bn: string;
  image: string;
  created_at: string;
}

interface AdminUser {
  id: number;
  username: string;
  role: 'Viewer' | 'Editor' | 'SuperAdmin';
}

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[lang];

  // Voter State
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('');
  const [voter, setVoter] = useState<Voter | null>(null);
  const [voterError, setVoterError] = useState('');

  // Volunteer State
  const [volName, setVolName] = useState('');
  const [volPhone, setVolPhone] = useState('');
  const [volEmail, setVolEmail] = useState('');
  const [volPhoto, setVolPhoto] = useState<string | null>(null);
  const [volRegSuccess, setVolRegSuccess] = useState(false);

  // Complaint State
  const [compName, setCompName] = useState('');
  const [compPhone, setCompPhone] = useState('');
  const [compSub, setCompSub] = useState('');
  const [compMsg, setCompMsg] = useState('');
  const [compTracking, setCompTracking] = useState('');
  const [trackId, setTrackId] = useState('');
  const [trackedComplaint, setTrackedComplaint] = useState<Complaint | null>(null);
  const [trackError, setTrackError] = useState('');

  // Admin State
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [adminSubTab, setAdminSubTab] = useState<'volunteers' | 'complaints' | 'news' | 'gallery' | 'users'>('volunteers');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [adminComplaints, setAdminComplaints] = useState<Complaint[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);

  // Admin Form States
  const [newNews, setNewNews] = useState({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
  const [newGallery, setNewGallery] = useState({ caption_en: '', caption_bn: '', image: '' });
  const [editingComplaint, setEditingComplaint] = useState<{ id: number, status: string, admin_note: string } | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', role: 'Viewer' as const });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, type: 'news' | 'gallery' | 'user' } | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const toggleLang = () => setLang(prev => prev === 'en' ? 'bn' : 'en');

  const handleShare = (type: 'news' | 'gallery', id: number) => {
    const url = `${window.location.origin}?${type}Id=${id}`;
    navigator.clipboard.writeText(url);
    setShareToast(lang === 'bn' ? 'লিঙ্ক কপি করা হয়েছে!' : 'Link copied to clipboard!');
    setTimeout(() => setShareToast(null), 3000);
  };

  const handleVoterSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setVoterError('');
    setVoter(null);
    try {
      const res = await fetch('/api/voter/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nid, dob })
      });
      if (res.ok) {
        const data = await res.json();
        setVoter(data);
      } else {
        const errData = await res.json();
        setVoterError(errData.error || t.voter.notFound);
      }
    } catch (err) {
      setVoterError("Connection error");
    }
  };

  const handleVolunteerReg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/volunteers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: volName, phone: volPhone, email: volEmail, photo: volPhoto })
      });
      if (res.ok) {
        setVolRegSuccess(true);
        setVolName(''); setVolPhone(''); setVolEmail(''); setVolPhoto(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (val: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        callback(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: compName, phone: compPhone, subject: compSub, message: compMsg })
      });
      if (res.ok) {
        const data = await res.json();
        setCompTracking(data.tracking_id);
        setCompName(''); setCompPhone(''); setCompSub(''); setCompMsg('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleTrackComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedComplaint(null);
    try {
      const res = await fetch(`/api/complaints/track/${trackId}`);
      if (res.ok) {
        const data = await res.json();
        setTrackedComplaint(data);
      } else {
        setTrackError("Complaint not found with this ID.");
      }
    } catch (err) {
      setTrackError("Connection error");
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      if (res.ok) {
        const data = await res.json();
        setAdminUser(data);
        setAdminUsername('');
        setAdminPassword('');
      } else {
        setAdminLoginError('Invalid username or password');
      }
    } catch (err) {
      setAdminLoginError('Connection error');
    }
  };

  const fetchAdminData = async () => {
    try {
      const [vRes, cRes, nRes, gRes, uRes] = await Promise.all([
        fetch('/api/volunteers'),
        fetch('/api/admin/complaints'),
        fetch('/api/news'),
        fetch('/api/gallery'),
        fetch('/api/admin/users')
      ]);
      if (vRes.ok) setVolunteers(await vRes.json());
      if (cRes.ok) setAdminComplaints(await cRes.json());
      if (nRes.ok) setNews(await nRes.json());
      if (gRes.ok) setGallery(await gRes.json());
      if (uRes.ok) setAdminUsers(await uRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const approveVolunteer = async (id: number) => {
    if (!adminUser || adminUser.role === 'Viewer') return;
    await fetch('/api/volunteers/approve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
    fetchAdminData();
  };

  const updateComplaint = async () => {
    if (!adminUser || adminUser.role === 'Viewer' || !editingComplaint) return;
    await fetch('/api/admin/complaints/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingComplaint)
    });
    setEditingComplaint(null);
    fetchAdminData();
  };

  const addNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || adminUser.role === 'Viewer') return;
    await fetch('/api/admin/news', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNews)
    });
    setNewNews({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
    fetchAdminData();
  };

  const deleteNews = async (id: number) => {
    if (!adminUser || adminUser.role === 'Viewer') return;
    await fetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchAdminData();
  };

  const addGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || adminUser.role === 'Viewer') return;
    await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newGallery)
    });
    setNewGallery({ caption_en: '', caption_bn: '', image: '' });
    fetchAdminData();
  };

  const deleteGallery = async (id: number) => {
    if (!adminUser || adminUser.role === 'Viewer') return;
    await fetch(`/api/admin/gallery/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchAdminData();
  };

  const addAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || adminUser.role !== 'SuperAdmin') return;
    await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    setNewUser({ username: '', password: '', role: 'Viewer' });
    fetchAdminData();
  };

  const deleteAdminUser = async (id: number) => {
    if (!adminUser || adminUser.role !== 'SuperAdmin') return;
    await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    setDeleteConfirm(null);
    fetchAdminData();
  };

  useEffect(() => {
    if (activeTab === 'admin' || activeTab === 'home') {
      fetchAdminData();
    }
  }, [activeTab]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const newsId = params.get('newsId');
    const galleryId = params.get('galleryId');
    if (newsId && news.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`news-${newsId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
    if (galleryId && gallery.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`gallery-${galleryId}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [news, gallery]);

  return (
    <div className={`min-h-screen flex flex-col ${lang === 'bn' ? 'bn' : ''}`}>
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                29
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">{t.hero.title}</h1>
                <p className="text-xs text-slate-500 font-medium">Mohammadpur, Dhaka</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {Object.entries(t.nav).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`text-sm font-medium transition-colors ${activeTab === key ? 'text-emerald-600' : 'text-slate-600 hover:text-emerald-600'}`}
                >
                  {label}
                </button>
              ))}
              <button 
                onClick={toggleLang}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                <Languages size={14} />
                {lang === 'en' ? 'বাংলা' : 'English'}
              </button>
            </div>

            <div className="md:hidden flex items-center gap-4">
              <button onClick={toggleLang} className="p-2 text-slate-600"><Languages size={20} /></button>
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-slate-600">
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-slate-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-2">
                {Object.entries(t.nav).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setActiveTab(key); setIsMenuOpen(false); }}
                    className="block w-full text-left px-4 py-3 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-16"
            >
              <section className="text-center py-12 space-y-6">
                <motion.h2 
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight"
                >
                  {t.hero.title}
                </motion.h2>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                  {t.hero.subtitle}
                </p>
                <div className="flex flex-wrap justify-center gap-4 pt-4">
                  <button onClick={() => setActiveTab('voterSlip')} className="btn-primary flex items-center gap-2">
                    <Search size={18} /> {t.hero.cta}
                  </button>
                  <button onClick={() => setActiveTab('volunteer')} className="px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm flex items-center gap-2">
                    <UserPlus size={18} /> {t.nav.volunteer}
                  </button>
                </div>
              </section>

              {/* News Section */}
              {news.length > 0 && (
                <section className="space-y-8">
                  <div className="flex justify-between items-end">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                      <Newspaper className="text-emerald-600" /> {lang === 'bn' ? 'সর্বশেষ সংবাদ' : 'Latest News'}
                    </h3>
                  </div>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {news.map(item => (
                      <div key={item.id} id={`news-${item.id}`} className="card group cursor-pointer">
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          {item.image && <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                        </div>
                        <div className="p-6">
                          <p className="text-xs text-slate-400 font-bold mb-2">{new Date(item.created_at).toLocaleDateString()}</p>
                          <h4 className="text-lg font-bold mb-2 line-clamp-2">{lang === 'bn' ? item.title_bn : item.title_en}</h4>
                          <p className="text-sm text-slate-500 line-clamp-3">{lang === 'bn' ? item.content_bn : item.content_en}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Gallery Section */}
              {gallery.length > 0 && (
                <section className="space-y-8">
                  <h3 className="text-2xl font-bold flex items-center gap-2">
                    <ImageIcon className="text-emerald-600" /> {lang === 'bn' ? 'গ্যালারি' : 'Campaign Gallery'}
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {gallery.map(item => (
                      <div key={item.id} id={`gallery-${item.id}`} className="aspect-square card overflow-hidden relative group">
                        <img src={item.image} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                          <p className="text-white text-xs font-medium">{lang === 'bn' ? item.caption_bn : item.caption_en}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </motion.div>
          )}

          {activeTab === 'voterSlip' && (
            <motion.div
              key="voter"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="card p-8 no-print">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Search className="text-emerald-600" /> {t.voter.title}
                </h2>
                <form onSubmit={handleVoterSearch} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.voter.nidLabel}</label>
                    <input
                      type="text"
                      required
                      value={nid}
                      onChange={(e) => setNid(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="e.g. 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">{t.voter.dobLabel}</label>
                    <input
                      type="date"
                      required
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <button type="submit" className="w-full btn-primary py-3">
                    {t.voter.searchBtn}
                  </button>
                </form>
                {voterError && (
                  <p className="mt-4 text-red-600 text-sm font-medium bg-red-50 p-3 rounded-lg">{voterError}</p>
                )}
              </div>

              {voter && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card p-8 border-2 border-emerald-600 relative overflow-hidden"
                  id="voter-slip"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-600/5 rounded-bl-full -mr-8 -mt-8" />
                  
                  <div className="flex justify-between items-start mb-8 relative">
                    <div>
                      <h3 className="text-2xl font-bold text-emerald-800">{t.voter.slipHeader}</h3>
                      <p className="text-slate-500 font-bold">Ward 29, DNCC</p>
                    </div>
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                      <QrCode className="text-slate-400" size={40} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-slate-100 pt-6">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.name}</p>
                      <p className="text-lg font-bold">{lang === 'bn' ? voter.name_bn : voter.name_en}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.serial}</p>
                      <p className="text-lg font-bold font-mono">{voter.serial_no}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.center}</p>
                      <p className="text-lg font-bold">{lang === 'bn' ? voter.polling_center_bn : voter.polling_center_en}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.booth}</p>
                      <p className="text-lg font-bold font-mono">{voter.booth_no}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">NID</p>
                      <p className="text-lg font-bold font-mono">{voter.nid}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-dashed border-slate-200 flex justify-between items-center no-print">
                    <p className="text-xs text-slate-400 italic">Generated on {new Date().toLocaleDateString()}</p>
                    <button 
                      onClick={async () => {
                        const qrData = `NID: ${voter.nid}\nName: ${voter.name_en}\nCenter: ${voter.polling_center_en}\nSerial: ${voter.serial_no}`;
                        const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 200 });
                        const win = window.open('', '_blank');
                        if (win) {
                          win.document.write(`
                            <html>
                              <head>
                                <title>Voter Slip - ${voter.name_en}</title>
                                <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                <style>
                                  @media print { .no-print { display: none; } }
                                  body { background: #f8fafc; padding: 40px; font-family: sans-serif; }
                                  .slip-card { width: 450px; margin: auto; border: 2px solid #10b981; border-radius: 1.5rem; overflow: hidden; background: white; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25); }
                                </style>
                              </head>
                              <body class="flex flex-col items-center">
                                <div class="slip-card">
                                  <div class="bg-emerald-600 p-6 text-white text-center">
                                    <h1 class="text-xl font-black tracking-tight">WARD 29, DNCC</h1>
                                    <p class="text-[10px] uppercase tracking-[0.2em] font-bold mt-1">Official Voter Information Slip</p>
                                  </div>
                                  
                                  <div class="p-8 space-y-6">
                                    <div class="flex justify-between items-start">
                                      <div class="space-y-4">
                                        <div>
                                          <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">Voter Name</p>
                                          <p class="text-lg font-black text-slate-900">${voter.name_en}</p>
                                          <p class="text-sm font-bold text-slate-600">${voter.name_bn}</p>
                                        </div>
                                        <div>
                                          <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">NID Number</p>
                                          <p class="text-sm font-bold text-slate-900 font-mono">${voter.nid}</p>
                                        </div>
                                      </div>
                                      <div class="w-24 h-24 bg-white p-1 border border-slate-100 rounded-xl shadow-sm">
                                        <img src="${qrDataUrl}" class="w-full h-full object-contain">
                                      </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                      <div>
                                        <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">Serial Number</p>
                                        <p class="text-sm font-bold text-slate-900 font-mono">${voter.serial_no}</p>
                                      </div>
                                      <div>
                                        <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">Booth Number</p>
                                        <p class="text-sm font-bold text-slate-900 font-mono">${voter.booth_no}</p>
                                      </div>
                                    </div>

                                    <div class="border-t border-slate-100 pt-6">
                                      <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">Polling Center</p>
                                      <p class="text-sm font-bold text-slate-900">${voter.polling_center_en}</p>
                                      <p class="text-xs font-bold text-slate-600 mt-1">${voter.polling_center_bn}</p>
                                    </div>

                                    <div class="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                                      <p class="text-[9px] text-emerald-700 font-bold leading-relaxed">
                                        Please bring this slip and your original NID card to the polling center on election day. This slip is for information purposes only.
                                      </p>
                                    </div>
                                  </div>

                                  <div class="bg-slate-900 p-4 text-center">
                                    <p class="text-[8px] text-slate-400 font-medium">
                                      Generated on ${new Date().toLocaleString()} • Ward 29 DNCC Digital Services
                                    </p>
                                  </div>
                                </div>
                                
                                <div class="mt-12 no-print">
                                  <button onclick="window.print()" class="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl hover:bg-emerald-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                    Print Official Voter Slip
                                  </button>
                                </div>
                              </body>
                            </html>
                          `);
                          win.document.close();
                        }
                      }}
                      className="flex items-center gap-2 text-emerald-600 font-bold hover:text-emerald-700"
                    >
                      <Printer size={18} /> {t.voter.print}
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {activeTab === 'volunteer' && (
            <motion.div
              key="volunteer"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <div className="card p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <UserPlus className="text-emerald-600" /> {t.volunteer.title}
                </h2>
                
                {volRegSuccess ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold">{t.volunteer.success}</h3>
                    <button onClick={() => setVolRegSuccess(false)} className="text-emerald-600 font-bold">Register another</button>
                  </div>
                ) : (
                  <form onSubmit={handleVolunteerReg} className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.volunteer.name}</label>
                        <input type="text" required value={volName} onChange={e => setVolName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.volunteer.phone}</label>
                        <input type="tel" required value={volPhone} onChange={e => setVolPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t.volunteer.email}</label>
                      <input type="email" required value={volEmail} onChange={e => setVolEmail(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t.volunteer.photo}</label>
                      <div className="mt-1 flex items-center gap-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden">
                          {volPhoto ? <img src={volPhoto} className="w-full h-full object-cover" /> : <UserPlus className="text-slate-300" />}
                        </div>
                        <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, setVolPhoto)} className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
                      </div>
                    </div>
                    <button type="submit" className="w-full btn-primary py-3">
                      {t.volunteer.submit}
                    </button>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'complaint' && (
            <motion.div
              key="complaint"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-8"
            >
              <div className="card p-8">
                <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                  <MessageSquare className="text-amber-600" /> {t.complaint.title}
                </h2>
                <p className="text-slate-500 mb-8">{t.complaint.subtitle}</p>

                {compTracking ? (
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-xl text-center space-y-2">
                    <p className="text-amber-800 font-medium">{t.complaint.tracking}</p>
                    <p className="text-3xl font-bold font-mono text-amber-900">{compTracking}</p>
                    <button onClick={() => setCompTracking('')} className="text-amber-700 text-sm font-bold pt-4">Submit another</button>
                  </div>
                ) : (
                  <form onSubmit={handleComplaintSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.complaint.name}</label>
                        <input type="text" required value={compName} onChange={e => setCompName(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">{t.complaint.phone}</label>
                        <input type="tel" required value={compPhone} onChange={e => setCompPhone(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t.complaint.subject}</label>
                      <input type="text" required value={compSub} onChange={e => setCompSub(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">{t.complaint.message}</label>
                      <textarea required rows={4} value={compMsg} onChange={e => setCompMsg(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none resize-none"></textarea>
                    </div>
                    <button type="submit" className="w-full bg-amber-600 text-white py-3 rounded-lg font-bold hover:bg-amber-700 transition-colors">
                      {t.complaint.submit}
                    </button>
                  </form>
                )}
              </div>

              {/* Tracking Section */}
              <div className="card p-8 border-t-4 border-amber-500">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Search className="text-amber-600" /> {t.complaint.trackTitle}
                </h3>
                <form onSubmit={handleTrackComplaint} className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={trackId}
                    onChange={e => setTrackId(e.target.value)}
                    placeholder={t.complaint.trackPlaceholder}
                    className="flex-grow px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button type="submit" className="bg-slate-900 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-800 transition-colors">
                    {t.complaint.trackBtn}
                  </button>
                </form>

                {trackError && <p className="mt-4 text-red-600 text-sm font-medium">{trackError}</p>}

                {trackedComplaint && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-6 p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.complaint.status}</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-bold mt-1 ${
                          trackedComplaint.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                          trackedComplaint.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {trackedComplaint.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">{new Date(trackedComplaint.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.complaint.subject}</p>
                      <p className="font-bold text-slate-900">{trackedComplaint.subject}</p>
                    </div>
                    {trackedComplaint.admin_note && (
                      <div className="p-3 bg-white border border-slate-200 rounded-lg">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-1">{t.complaint.adminNote}</p>
                        <p className="text-sm text-slate-700 italic">{trackedComplaint.admin_note}</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
            >
              {!adminUser ? (
                <div className="max-w-md mx-auto card p-8 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="text-slate-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold">{t.admin.loginTitle}</h2>
                    <p className="text-slate-500 text-sm">{t.admin.loginSubtitle}</p>
                  </div>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Username</label>
                      <input 
                        type="text" 
                        required 
                        value={adminUsername} 
                        onChange={e => setAdminUsername(e.target.value)} 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
                      <input 
                        type="password" 
                        required 
                        value={adminPassword} 
                        onChange={e => setAdminPassword(e.target.value)} 
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-500" 
                      />
                    </div>
                    {adminLoginError && <p className="text-red-600 text-xs font-bold">{adminLoginError}</p>}
                    <button type="submit" className="w-full btn-primary py-3">Login to Dashboard</button>
                  </form>
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 min-h-[600px]">
                  {/* Admin Sidebar */}
                  <aside className="lg:w-64 flex-shrink-0">
                    <div className="card p-4 sticky top-24 space-y-2">
                      <div className="px-4 py-3 mb-4 border-b border-slate-100">
                        <h2 className="text-lg font-bold flex items-center gap-2">
                          <LayoutDashboard size={20} className="text-emerald-600" /> 
                          {t.admin.dashboard}
                        </h2>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                          Logged in as {adminUser.role}
                        </p>
                      </div>
                      
                      <nav className="space-y-1">
                        {[
                          { id: 'volunteers', icon: UserPlus, label: t.admin.volunteers },
                          { id: 'complaints', icon: MessageSquare, label: t.admin.complaints },
                          { id: 'news', icon: Newspaper, label: t.admin.news },
                          { id: 'gallery', icon: ImageIcon, label: t.admin.gallery },
                          ...(adminUser.role === 'SuperAdmin' ? [{ id: 'users', icon: ShieldCheck, label: t.admin.users }] : [])
                        ].map(tab => (
                          <button
                            key={tab.id}
                            onClick={() => setAdminSubTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                              adminSubTab === tab.id 
                                ? 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                            }`}
                          >
                            <tab.icon size={18} /> {tab.label}
                          </button>
                        ))}
                      </nav>

                      <div className="pt-4 mt-4 border-t border-slate-100">
                        <button 
                          onClick={() => setAdminUser(null)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <X size={18} /> {t.admin.logout}
                        </button>
                      </div>
                    </div>
                  </aside>

                  {/* Admin Content Area */}
                  <div className="flex-grow space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-slate-800 capitalize">
                        {adminSubTab.replace('_', ' ')}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                        <Clock size={14} /> {new Date().toLocaleDateString()}
                      </div>
                    </div>

                    {adminSubTab === 'volunteers' && (
                    <div className="card overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                              <th className="px-6 py-4">Volunteer</th>
                              <th className="px-6 py-4">Contact</th>
                              <th className="px-6 py-4">Status</th>
                              <th className="px-6 py-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {volunteers.map(v => (
                              <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden">
                                      {v.photo ? <img src={v.photo} className="w-full h-full object-cover" /> : <UserPlus className="w-full h-full p-2 text-slate-400" />}
                                    </div>
                                    <span className="font-bold">{v.name}</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <div className="text-sm">
                                    <p className="font-medium">{v.phone}</p>
                                    <p className="text-slate-400">{v.email}</p>
                                  </div>
                                </td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${v.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {v.status === 'approved' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                                    {v.status === 'approved' ? t.volunteer.approved : t.volunteer.pending}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  {v.status === 'pending' && adminUser.role !== 'Viewer' && (
                                    <button 
                                      onClick={() => approveVolunteer(v.id)}
                                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {v.status === 'approved' && (
                                    <div className="flex items-center gap-2">
                                      <button 
                                        onClick={async () => {
                                          const qrData = `ID: V29-${v.id.toString().padStart(4, '0')}\nName: ${v.name}\nStatus: Verified Volunteer`;
                                          const qrDataUrl = await QRCode.toDataURL(qrData, { margin: 1, width: 200 });
                                          const win = window.open('', '_blank');
                                          if (win) {
                                            win.document.write(`
                                              <html>
                                                <head>
                                                  <title>Volunteer ID - ${v.name}</title>
                                                  <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
                                                  <style>
                                                    @media print { .no-print { display: none; } }
                                                    body { background: #f8fafc; padding: 40px; font-family: sans-serif; }
                                                    .id-card { width: 350px; height: 500px; position: relative; }
                                                  </style>
                                                </head>
                                                <body class="flex flex-col items-center">
                                                  <div class="id-card bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 flex flex-col">
                                                    <div class="bg-emerald-600 h-32 p-6 text-white text-center relative">
                                                      <h1 class="text-lg font-black tracking-tighter">WARD 29, DNCC</h1>
                                                      <p class="text-[10px] opacity-90 uppercase tracking-[0.2em] font-bold mt-1">Official Volunteer Card</p>
                                                      <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl bg-white p-1 shadow-lg">
                                                        <img src="${v.photo}" class="w-full h-full object-cover rounded-xl">
                                                      </div>
                                                    </div>
                                                    
                                                    <div class="flex-grow pt-16 px-8 pb-6 flex flex-col items-center text-center">
                                                      <div class="mb-4">
                                                        <h2 class="text-xl font-black text-slate-900 leading-tight">${v.name}</h2>
                                                        <div class="inline-flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-2 border border-emerald-100">
                                                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                                                          Verified Volunteer
                                                        </div>
                                                      </div>
                                                      
                                                      <div class="w-full grid grid-cols-2 gap-6 text-left mb-6 border-y border-slate-50 py-4">
                                                        <div>
                                                          <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">ID Number</p>
                                                          <p class="text-xs font-bold text-slate-700">V29-${v.id.toString().padStart(4, '0')}</p>
                                                        </div>
                                                        <div>
                                                          <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">Valid From</p>
                                                          <p class="text-xs font-bold text-slate-700">${new Date(v.created_at).getFullYear()}</p>
                                                        </div>
                                                      </div>

                                                      <div class="flex items-center justify-between w-full gap-4">
                                                        <div class="text-left">
                                                          <div class="w-20 h-8 border-b border-slate-300 mb-1"></div>
                                                          <p class="text-[8px] uppercase text-slate-400 font-bold">Authorized Sign</p>
                                                        </div>
                                                        <div class="w-16 h-16 bg-white p-1 border border-slate-100 rounded-lg">
                                                          <img src="${qrDataUrl}" class="w-full h-full object-contain">
                                                        </div>
                                                      </div>
                                                    </div>

                                                    <div class="bg-slate-900 p-4 text-center">
                                                      <p class="text-[8px] text-slate-400 font-medium leading-relaxed">
                                                        This card is the property of Ward 29 DNCC. If found, please return to the Ward Office. For verification, scan the QR code.
                                                      </p>
                                                    </div>
                                                  </div>
                                                  
                                                  <div class="mt-12 no-print">
                                                    <button onclick="window.print()" class="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black shadow-2xl hover:bg-emerald-700 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3">
                                                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                                                      Print Official ID Card
                                                    </button>
                                                  </div>
                                                </body>
                                              </html>
                                            `);
                                            win.document.close();
                                          }
                                        }}
                                        className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                      >
                                        <Printer size={12} /> Print ID
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'complaints' && (
                    <div className="space-y-4">
                      {adminComplaints.map(c => (
                        <div key={c.id} className="card p-6 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-bold text-slate-400 font-mono">{c.tracking_id}</p>
                              <h4 className="text-lg font-bold">{c.subject}</h4>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              c.status === 'Open' ? 'bg-blue-100 text-blue-700' : 
                              c.status === 'In Progress' ? 'bg-amber-100 text-amber-700' : 
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600">{c.message}</p>
                          <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400">
                            <span className="flex items-center gap-1"><UserPlus size={12} /> {c.name}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(c.created_at).toLocaleString()}</span>
                          </div>
                          
                          {editingComplaint?.id === c.id ? (
                            <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-200">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Status</label>
                                  <select 
                                    value={editingComplaint.status}
                                    onChange={e => setEditingComplaint({...editingComplaint, status: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                  >
                                    <option>Open</option>
                                    <option>In Progress</option>
                                    <option>Resolved</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1">Admin Note</label>
                                  <input 
                                    type="text"
                                    value={editingComplaint.admin_note}
                                    onChange={e => setEditingComplaint({...editingComplaint, admin_note: e.target.value})}
                                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button onClick={updateComplaint} className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold">Save</button>
                                <button onClick={() => setEditingComplaint(null)} className="bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-xs font-bold">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            adminUser.role !== 'Viewer' && (
                              <button 
                                onClick={() => setEditingComplaint({ id: c.id, status: c.status, admin_note: c.admin_note })}
                                className="text-xs font-bold text-emerald-600 hover:underline"
                              >
                                Update Status & Note
                              </button>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                   {adminSubTab === 'news' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                      {adminUser.role !== 'Viewer' && (
                        <div className="lg:col-span-1">
                          <form onSubmit={addNews} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center gap-2"><Plus size={18} /> Add News</h3>
                            <input type="text" placeholder="Title (EN)" required value={newNews.title_en} onChange={e => setNewNews({...newNews, title_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="text" placeholder="Title (BN)" required value={newNews.title_bn} onChange={e => setNewNews({...newNews, title_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <textarea placeholder="Content (EN)" required rows={3} value={newNews.content_en} onChange={e => setNewNews({...newNews, content_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                            <textarea placeholder="Content (BN)" required rows={3} value={newNews.content_bn} onChange={e => setNewNews({...newNews, content_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                            <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setNewNews({...newNews, image: val}))} className="text-xs" />
                            <button type="submit" className="w-full btn-primary">Publish News</button>
                          </form>
                        </div>
                      )}
                      <div className={adminUser.role === 'Viewer' ? 'lg:col-span-3 space-y-4' : 'lg:col-span-2 space-y-4'}>
                        {news.map(item => (
                          <div key={item.id} className="card p-4 flex gap-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                              {item.image && <img src={item.image} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold">{item.title_bn}</h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.content_bn}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button 
                                  onClick={() => handleShare('news', item.id)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                >
                                  <Share2 size={14} /> Share
                                </button>
                                {adminUser.role !== 'Viewer' && (
                                  <button onClick={() => setDeleteConfirm({ id: item.id, type: 'news' })} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                   {adminSubTab === 'gallery' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                      {adminUser.role !== 'Viewer' && (
                        <div className="lg:col-span-1">
                          <form onSubmit={addGallery} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center gap-2"><Plus size={18} /> Add Photo</h3>
                            <input type="text" placeholder="Caption (EN)" required value={newGallery.caption_en} onChange={e => setNewGallery({...newGallery, caption_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="text" placeholder="Caption (BN)" required value={newGallery.caption_bn} onChange={e => setNewGallery({...newGallery, caption_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setNewGallery({...newGallery, image: val}))} className="text-xs" />
                            <button type="submit" className="w-full btn-primary">Upload to Gallery</button>
                          </form>
                        </div>
                      )}
                      <div className={adminUser.role === 'Viewer' ? 'lg:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4' : 'lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4'}>
                        {gallery.map(item => (
                          <div key={item.id} className="card group relative aspect-square overflow-hidden">
                            <img src={item.image} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                              <p className="text-white text-xs font-medium mb-2">{item.caption_bn}</p>
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleShare('gallery', item.id)}
                                  className="text-white bg-emerald-600 p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  <Share2 size={14} />
                                </button>
                                {adminUser.role !== 'Viewer' && (
                                  <button onClick={() => setDeleteConfirm({ id: item.id, type: 'gallery' })} className="text-white bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-colors">
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'users' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                      <div className="lg:col-span-1">
                        <form onSubmit={addAdminUser} className="card p-6 space-y-4 sticky top-24">
                          <h3 className="font-bold flex items-center gap-2"><Plus size={18} /> Add Admin User</h3>
                          <input type="text" placeholder="Username" required value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                          <input type="password" placeholder="Password" required value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                          <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as any})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm">
                            <option value="Viewer">Viewer</option>
                            <option value="Editor">Editor</option>
                            <option value="SuperAdmin">Super Admin</option>
                          </select>
                          <button type="submit" className="w-full btn-primary">Create User</button>
                        </form>
                      </div>
                      <div className="lg:col-span-2 card overflow-hidden">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs uppercase tracking-wider text-slate-400 font-bold border-b border-slate-100">
                              <th className="px-6 py-4">Username</th>
                              <th className="px-6 py-4">Role</th>
                              <th className="px-6 py-4">Created</th>
                              <th className="px-6 py-4">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {adminUsers.map(user => (
                              <tr key={user.id}>
                                <td className="px-6 py-4 font-bold">{user.username}</td>
                                <td className="px-6 py-4">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                    user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 
                                    user.role === 'Editor' ? 'bg-blue-100 text-blue-700' : 
                                    'bg-slate-100 text-slate-700'
                                  }`}>
                                    {user.role}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">{(user as any).created_at}</td>
                                <td className="px-6 py-4">
                                  {user.username !== 'admin' && (
                                    <button onClick={() => setDeleteConfirm({ id: user.id, type: 'user' })} className="text-red-600 hover:text-red-700">
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Confirm Deletion</h3>
                <p className="text-slate-500 text-sm mt-2">Are you sure you want to delete this {deleteConfirm.type}? This action cannot be undone.</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    if (deleteConfirm.type === 'news') deleteNews(deleteConfirm.id);
                    if (deleteConfirm.type === 'gallery') deleteGallery(deleteConfirm.id);
                    if (deleteConfirm.type === 'user') deleteAdminUser(deleteConfirm.id);
                  }}
                  className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="bg-slate-900 text-slate-400 py-12 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center gap-2 items-center mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">29</div>
            <span className="text-white font-bold">Ward 29 DNCC</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Ward 29, Mohammadpur. All rights reserved.</p>
          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-widest">
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      {/* Share Toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-sm"
          >
            <CheckCircle2 className="text-emerald-400" size={18} />
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
