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

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

type Language = 'en' | 'bn';

interface Voter {
  id: string | number;
  nid: string;
  dob: string;
  name_en: string;
  name_bn: string;
  father_name?: string;
  mother_name?: string;
  address?: string;
  photo?: string;
  serial_no: string;
  polling_center_en: string;
  polling_center_bn: string;
  booth_no: string;
}

interface Volunteer {
  id: string | number;
  name: string;
  phone: string;
  email: string;
  photo: string;
  status: 'pending' | 'approved';
  created_at: string | any;
}

interface Complaint {
  id: string | number;
  tracking_id: string;
  name: string;
  phone: string;
  subject: string;
  message: string;
  status: string;
  admin_note: string;
  created_at: string | any;
}

interface NewsItem {
  id: string | number;
  title_en: string;
  title_bn: string;
  content_en: string;
  content_bn: string;
  image: string;
  created_at: string | any;
}

interface GalleryItem {
  id: string | number;
  caption_en: string;
  caption_bn: string;
  image: string;
  created_at: string | any;
}

interface EventItem {
  id: string | number;
  title_en: string;
  title_bn: string;
  description_en: string;
  description_bn: string;
  event_date: string;
  location_en: string;
  location_bn: string;
  image: string;
  created_at: string | any;
}

interface AdminUser {
  id: string | number;
  email: string;
  role: 'Viewer' | 'Editor' | 'SuperAdmin';
}

interface Councilor {
  id: string | number;
  name_en: string;
  name_bn: string;
  career_en: string;
  career_bn: string;
  education_en: string;
  education_bn: string;
  social_service_en: string;
  social_service_bn: string;
  photo: string;
  last_updated: string;
  message_en?: string;
  message_bn?: string;
}

interface CouncilMember {
  id: string | number;
  name_en: string;
  name_bn: string;
  position_en: string;
  position_bn: string;
  phone: string;
  email: string;
  photo: string;
  created_at: string | any;
}

export default function App() {
  const [lang, setLang] = useState<Language>('bn');
  const [activeTab, setActiveTab] = useState('home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const t = translations[lang];

  // Admin State
  const [adminUser, setAdminUser] = useState<any | null>(null);
  const [isAdminReady, setIsAdminReady] = useState(false);
  const [adminLoginError, setAdminLoginError] = useState('');
  
  // Email/Password Login State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');

  // RBAC Helpers
  const isSuperAdmin = adminUser?.role === 'SuperAdmin';
  const canEdit = adminUser?.role === 'SuperAdmin' || adminUser?.role === 'Editor';
  const canManageAdmins = adminUser?.role === 'SuperAdmin';
  const isAdminViewer = adminUser?.role === 'Viewer';

  // Voter State
  const [nid, setNid] = useState('');
  const [dob, setDob] = useState('');
  const [voter, setVoter] = useState<Voter | null>(null);
  const [voterError, setVoterError] = useState('');

  // Birth Registration State
  const [birthRegId, setBirthRegId] = useState('');
  const [birthDob, setBirthDob] = useState('');
  const [birthData, setBirthData] = useState<any>(null);
  const [birthError, setBirthError] = useState('');

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
  const [adminSubTab, setAdminSubTab] = useState<'volunteers' | 'complaints' | 'news' | 'gallery' | 'events' | 'users' | 'councilor' | 'voters' | 'council-members' | 'overview'>('overview');
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [adminComplaints, setAdminComplaints] = useState<Complaint[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminVoters, setAdminVoters] = useState<Voter[]>([]);
  const [councilorProfile, setCouncilorProfile] = useState<Councilor | null>(null);
  const [councilMembers, setCouncilMembers] = useState<CouncilMember[]>([]);

  // Admin Form States
  const [newNews, setNewNews] = useState({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [newGallery, setNewGallery] = useState({ caption_en: '', caption_bn: '', image: '' });
  const [editingGallery, setEditingGallery] = useState<GalleryItem | null>(null);
  const [newEvent, setNewEvent] = useState({ title_en: '', title_bn: '', description_en: '', description_bn: '', event_date: '', location_en: '', location_bn: '', image: '' });
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [editingComplaint, setEditingComplaint] = useState<{ id: number, status: string, admin_note: string } | null>(null);
  const [newUser, setNewUser] = useState({ email: '', role: 'Editor' as const, note: '' });
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [newVoter, setNewVoter] = useState<Partial<Voter>>({ nid: '', dob: '', name_en: '', name_bn: '', father_name: '', mother_name: '', address: '', serial_no: '', polling_center_en: '', polling_center_bn: '', booth_no: '', photo: '' });
  const [editingVoter, setEditingVoter] = useState<Voter | null>(null);
  const [editCouncilor, setEditCouncilor] = useState<Councilor | null>(null);
  const [newCouncilMember, setNewCouncilMember] = useState({ name_en: '', name_bn: '', position_en: '', position_bn: '', phone: '', email: '', photo: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number, type: 'news' | 'gallery' | 'event' | 'user' | 'voter' | 'council-member' } | null>(null);
  const [shareToast, setShareToast] = useState<string | null>(null);

  // Advanced Search Filter States
  const [advVolSearch, setAdvVolSearch] = useState({ query: '', phone: '', from: '', to: '' });
  const [advCompSearch, setAdvCompSearch] = useState({ query: '', phone: '', from: '', to: '', status: '' });

  // New States
  const [darkMode, setDarkMode] = useState(false);
  const [expandedNews, setExpandedNews] = useState<Set<number>>(new Set());

  // Volunteer Search/Filter State
  const [volSearch, setVolSearch] = useState('');
  const [volStatusFilter, setVolStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });

    useEffect(() => {
      const targetDate = new Date('2026-12-01T08:00:00');
      const timer = setInterval(() => {
        const now = new Date();
        const difference = targetDate.getTime() - now.getTime();
        
        if (difference <= 0) {
          clearInterval(timer);
          return;
        }

        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60)
        });
      }, 1000);
      return () => clearInterval(timer);
    }, []);

    return (
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { label: lang === 'bn' ? 'দিন' : 'Days', value: timeLeft.days },
          { label: lang === 'bn' ? 'ঘণ্টা' : 'Hours', value: timeLeft.hours },
          { label: lang === 'bn' ? 'মিনিট' : 'Mins', value: timeLeft.minutes }
        ].map(item => (
          <div key={item.label} className="bg-emerald-600 text-white rounded-lg p-2 text-center">
            <div className="text-lg font-black">{item.value.toString().padStart(2, '0')}</div>
            <div className="text-[8px] font-bold uppercase tracking-widest opacity-80">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };
  const NewsSection = () => (
    <section className="space-y-8">
      <div className="flex justify-between items-end">
        <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <Newspaper className="text-emerald-600" /> {lang === 'bn' ? 'সর্বশেষ সংবাদ' : 'Latest News'}
        </h3>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {news.map(item => (
          <div key={item.id} id={`news-${item.id}`} className={`card group cursor-pointer relative ${darkMode ? 'bg-slate-800 border-slate-700' : ''}`}>
            <div className="aspect-video bg-slate-100 overflow-hidden">
              {item.image && <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-2 text-xs text-slate-400 font-bold">
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleShare('news', item); }}
                  className="p-1 px-2 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100"
                >
                  <Share2 size={12} /> {lang === 'bn' ? 'শেয়ার' : 'Share'}
                </button>
              </div>
              <h4 className={`text-lg font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>{lang === 'bn' ? item.title_bn : item.title_en}</h4>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'} ${expandedNews.has(item.id) ? '' : 'line-clamp-3'}`}>
                {lang === 'bn' ? item.content_bn : item.content_en}
              </p>
              {(lang === 'bn' ? item.content_bn : item.content_en).length > 100 && (
                <button 
                  onClick={(e) => { e.stopPropagation(); toggleNewsExpansion(item.id); }}
                  className="text-emerald-600 text-xs font-bold mt-2 hover:underline"
                >
                  {expandedNews.has(item.id) ? (lang === 'bn' ? 'সংক্ষেপে দেখুন' : 'Show Less') : (lang === 'bn' ? 'আরও পড়ুন' : 'Read More')}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const GallerySection = () => (
    <section className="space-y-8">
      <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
        <ImageIcon className="text-emerald-600" /> {lang === 'bn' ? 'গ্যালারি' : 'Campaign Gallery'}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {gallery.map(item => (
          <div key={item.id} id={`gallery-${item.id}`} className="aspect-square card overflow-hidden relative group cursor-pointer">
            <img src={item.image} className="w-full h-full object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col p-4">
              <p className="text-white text-xs font-medium mb-2">{lang === 'bn' ? item.caption_bn : item.caption_en}</p>
              <button 
                onClick={(e) => { e.stopPropagation(); handleShare('gallery', item); }}
                className="self-end bg-white text-black p-1.5 px-3 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-500 hover:text-white transition-all transform translate-y-2 group-hover:translate-y-0"
              >
                <Share2 size={12} /> {lang === 'bn' ? 'লিঙ্ক কপি করুন' : 'Share'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );

  const BirthVerifySection = () => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.nav.birthVerify}</h2>
        <p className="text-slate-500 font-medium">Connect to the official central database for record verification.</p>
      </div>

      <div className={`card overflow-hidden border-2 border-emerald-500 ${darkMode ? 'bg-slate-800' : 'bg-white'} shadow-2xl`}>
        <div className="bg-emerald-600 p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
              <ShieldCheck size={32} />
            </div>
            <div>
              <h3 className="text-xl font-black leading-tight">Official BDRIS Portal Access</h3>
              <p className="text-xs font-bold text-white/80 uppercase tracking-widest mt-1">Government of Bangladesh</p>
            </div>
          </div>
          <a 
            href="https://everify.bdris.gov.bd/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full md:w-auto bg-white text-emerald-600 px-8 py-4 rounded-2xl font-black uppercase tracking-tight flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all shadow-xl group"
          >
            Launch Official Portal <ExternalLink size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </a>
        </div>
        
        <div className="p-8 grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-6">
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-amber-100 dark:border-amber-900/30 rounded-2xl space-y-3">
              <h4 className="font-black text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertCircle size={18} /> Connectivity Note
              </h4>
              <p className="text-sm font-medium text-amber-600/80 dark:text-amber-400/80 leading-relaxed">
                The external government portal prohibits direct embedding within other websites for security reasons. Click the button above to safely open the verification portal in a new browser tab.
              </p>
            </div>

            <div className="space-y-4">
              <h4 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <FileText size={18} className="text-emerald-500" /> Steps to Verify
              </h4>
              <div className="space-y-3">
                {[
                  { step: "1", text: "Open the official portal using the button above." },
                  { step: "2", text: "Enter your 17-digit Birth Registration Number (BRN)." },
                  { step: "3", text: "Select your Date of Birth from the calendar." },
                  { step: "4", text: "Complete the mathematical CAPTCHA and click 'Search'." }
                ].map((s, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs shrink-0">{s.step}</span>
                    <p className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{s.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className={`p-6 rounded-2xl border-2 border-dashed ${darkMode ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-slate-50'} space-y-4`}>
              <h4 className={`font-black flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                <HelpCircle size={18} className="text-emerald-500" /> Requirements
              </h4>
              <ul className="space-y-3 text-xs font-bold text-slate-500">
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 
                  17-digit BRN
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 
                  Accurate DOB
                </li>
                <li className="flex gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /> 
                  Captcha Entry
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const EventsSection = () => (
    <section className="space-y-8">
      <div className="flex justify-between items-end">
        <h3 className={`text-2xl font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          <Clock className="text-emerald-600" /> {lang === 'bn' ? 'ইভেন্ট ও ক্যাম্পেইন' : 'Events & Campaigns'}
        </h3>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {events.map(event => (
          <div key={event.id} className={`group card overflow-hidden border-2 transition-all hover:border-emerald-500 hover:shadow-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            <div className="aspect-[16/9] bg-slate-100 relative overflow-hidden">
              {event.image ? (
                <img src={event.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={48} /></div>
              )}
              <div className="absolute top-4 left-4">
                <div className="bg-emerald-600 text-white px-3 py-1 rounded-lg text-xs font-black shadow-lg">
                  {new Date(event.event_date).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <h4 className={`text-xl font-black leading-tight ${darkMode ? 'text-emerald-400' : 'text-slate-900'}`}>
                {lang === 'bn' ? event.title_bn : event.title_en}
              </h4>
              <p className={`text-sm line-clamp-3 font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'bn' ? event.description_bn : event.description_en}
              </p>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                  <QrCode size={14} className="text-emerald-500" />
                   {lang === 'bn' ? event.location_bn : event.location_en}
                </div>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div className="col-span-full py-12 text-center card bg-slate-50 border-dashed border-2 border-slate-200">
            <Clock className="mx-auto text-slate-300 mb-4" size={48} />
            <p className="text-slate-500 font-bold">{lang === 'bn' ? 'কোন ইভেন্ট পাওয়া যায়নি' : 'No upcoming events found'}</p>
          </div>
        )}
      </div>
    </section>
  );

  const StaticPage = ({ title, content }: { title: string, content: React.ReactNode }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto py-12 px-4"
    >
      <div className={`card p-8 md:p-12 space-y-6 ${darkMode ? 'bg-slate-800 border-slate-700' : ''}`}>
        <h1 className={`text-3xl font-black border-b pb-6 ${darkMode ? 'text-white border-slate-700' : 'text-slate-900 border-slate-100'}`}>{title}</h1>
        <div className={`prose max-w-none leading-relaxed space-y-4 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
          {content}
        </div>
      </div>
    </motion.div>
  );

  const toggleLang = () => setLang(prev => prev === 'en' ? 'bn' : 'en');
  const toggleDarkMode = () => setDarkMode(!darkMode);

  const toggleNewsExpansion = (id: number) => {
    setExpandedNews(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const CouncilorProfileSection = () => {
    if (!councilorProfile) return (
      <div className="flex animate-pulse space-x-4 max-w-4xl mx-auto py-12">
        <div className="rounded-full bg-slate-200 h-20 w-20"></div>
        <div className="flex-1 space-y-6 py-1">
          <div className="h-2 bg-slate-200 rounded"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-4">
              <div className="h-2 bg-slate-200 rounded col-span-2"></div>
              <div className="h-2 bg-slate-200 rounded col-span-1"></div>
            </div>
            <div className="h-2 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    );

    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-12 py-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-1 space-y-6">
            <div className="card overflow-hidden border-4 border-emerald-500 shadow-2xl skew-y-1 hover:skew-y-0 transition-transform duration-500">
              {councilorProfile.photo ? (
                <img src={councilorProfile.photo} className="w-full aspect-[3/4] object-cover" alt={councilorProfile.name_en} />
              ) : (
                <div className="w-full aspect-[3/4] bg-slate-100 flex items-center justify-center text-slate-300">
                  <ShieldCheck size={80} />
                </div>
              )}
              <div className="p-4 bg-emerald-600 text-white text-center">
                <h3 className="text-xl font-black">{lang === 'bn' ? councilorProfile.name_bn : councilorProfile.name_en}</h3>
                <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-80 mt-1">Ward Councilor, Ward 29</p>
              </div>
            </div>

            <div className={`card p-6 space-y-4 ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
              <h4 className="text-xs font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                <FileText size={14} /> {lang === 'bn' ? 'শিক্ষাগত যোগ্যতা' : 'Education'}
              </h4>
              <p className={`text-sm font-bold leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {lang === 'bn' ? councilorProfile.education_bn : councilorProfile.education_en}
              </p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="space-y-4">
              <h3 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {lang === 'bn' ? 'রাজনৈতিক প্রোফাইল' : 'Political Career'}
              </h3>
              <div className="w-20 h-2 bg-emerald-500 rounded-full"></div>
              <p className={`text-lg font-medium leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                {lang === 'bn' ? councilorProfile.career_bn : councilorProfile.career_en}
              </p>
            </div>

            <div className={`p-8 rounded-3xl border-2 border-dashed ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-emerald-50/50 border-emerald-100'} space-y-6`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                <Sparkles size={24} /> {lang === 'bn' ? 'সামাজিক সেবা ও অবদান' : 'Social Service & Contributions'}
              </h3>
              <p className={`text-base font-bold leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {lang === 'bn' ? councilorProfile.social_service_bn : councilorProfile.social_service_en}
              </p>
            </div>

            {councilorProfile.message_en && councilorProfile.message_bn && (
              <div className={`p-8 rounded-3xl ${darkMode ? 'bg-emerald-900/20 border border-emerald-500/10' : 'bg-emerald-600 text-white'} space-y-4 shadow-xl relative overflow-hidden group`}>
                <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
                  <MessageSquare size={120} />
                </div>
                <h3 className="text-2xl font-black flex items-center gap-3">
                  <MessageSquare size={24} /> {lang === 'bn' ? 'কাউন্সিলরের বার্তা' : "Councilor's Message"}
                </h3>
                <p className="text-lg font-medium leading-relaxed italic relative z-10">
                  "{lang === 'bn' ? councilorProfile.message_bn : councilorProfile.message_en}"
                </p>
              </div>
            )}

            <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <span>Last Updated: {new Date(councilorProfile.last_updated).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const NavItem: React.FC<{ item: any }> = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!item.items) {
      return (
        <button
          onClick={() => { setActiveTab(item.key); setIsMenuOpen(false); }}
          className={`text-sm font-bold transition-colors py-2 px-3 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 ${
            activeTab === item.key ? 'text-emerald-600 bg-emerald-50' : (darkMode ? 'text-slate-300' : 'text-slate-600')
          }`}
        >
          {item.label}
        </button>
      );
    }

    return (
      <div className="relative group" onMouseEnter={() => setIsOpen(true)} onMouseLeave={() => setIsOpen(false)}>
        <button
          className={`text-sm font-bold transition-colors py-2 px-3 rounded-lg flex items-center gap-1 hover:bg-emerald-50 hover:text-emerald-600 ${
            item.items.some((i: any) => i.key === activeTab) ? 'text-emerald-600 bg-emerald-50' : (darkMode ? 'text-slate-300' : 'text-slate-600')
          }`}
        >
          {item.label}
          <ChevronDown size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute top-full left-0 mt-1 w-56 rounded-xl shadow-2xl border ${
                darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
              } p-2 z-[100]`}
            >
              {item.items.map((subItem: any) => (
                <button
                  key={subItem.key}
                  onClick={() => { setActiveTab(subItem.key); setIsOpen(false); setIsMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold transition-all hover:translate-x-1 ${
                    activeTab === subItem.key 
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                      : (darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-600')
                  }`}
                >
                  {subItem.icon && <subItem.icon size={16} className={activeTab === subItem.key ? 'text-white' : 'text-emerald-500'} />}
                  {subItem.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const menuStructure = [
    { key: 'home', label: t.nav.home },
    { key: 'councilor', label: t.nav.councilor },
    { 
      label: t.nav.services,
      items: [
        { key: 'voterSlip', label: t.nav.voterSlip, icon: ShieldCheck },
        { key: 'birthVerify', label: t.nav.birthVerify, icon: FileText },
        { key: 'volunteer', label: t.nav.volunteer, icon: UserPlus },
        { key: 'complaint', label: t.nav.complaint, icon: MessageSquare }
      ]
    },
    {
      label: t.nav.community,
      items: [
        { key: 'events', label: t.nav.events, icon: Clock },
        { key: 'news', label: t.nav.news, icon: Newspaper },
        { key: 'gallery', label: t.nav.gallery, icon: ImageIcon }
      ]
    },
    {
      label: t.nav.support,
      items: [
        { key: 'councilMembers', label: t.nav.councilMembers, icon: Users },
        { key: 'about', label: t.nav.about, icon: Info },
        { key: 'contact', label: t.nav.contact, icon: Mail },
        { key: 'privacy', label: t.nav.privacy, icon: Shield },
        { key: 'terms', label: t.nav.terms, icon: FileText }
      ]
    }
  ];

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Error handling function
  const handleFirestoreError = (error: any, operationType: string, path: string = '') => {
    const errInfo = {
      error: error.message || 'Unknown error occurred',
      operationType: operationType as OperationType,
      path: path || null,
      authInfo: auth.currentUser ? {
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        emailVerified: auth.currentUser.emailVerified,
        isAnonymous: auth.currentUser.isAnonymous,
      } : {
        userId: null,
        email: null,
        emailVerified: null,
        isAnonymous: null,
      }
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    // Don't throw error - just log it and show toast
    // This allows operations to continue even if there's an error
    const errorMessage = error instanceof Error ? error.message : String(error);
    showToast(`Error: ${errorMessage}`, 'error');
  }

  const handleShare = (type: 'news' | 'gallery', item: any) => {
    const title = lang === 'bn' ? item.title_bn : item.title_en;
    const url = `${window.location.origin}?${type}Id=${item.id}`;
    const text = `Check out this ${type}: ${title}`;
    
    setActiveShareItem({ title, text, url });
  };

  useEffect(() => {
    // Check for existing local auth session
    const currentUser = localAuth.getCurrentUser();
    if (currentUser) {
      setAdminUser(currentUser);
    }
    setIsAdminReady(true);
  }, []);

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
        
        // Use local API authentication
        const result = await localAuth.login(adminEmail, adminPassword);
        setAdminUser(result.user);
        setActiveTab('admin');
        // Clear form fields on successful login
        setAdminEmail('');
        setAdminPassword('');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setAdminLoginError("Invalid email or password");
    }
  };

  const handleAdminLogout = async () => {
    try {
      localAuth.logout();
      setAdminUser(null);
      setActiveTab('home');
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAdminData = async () => {
    try {
      // Fetch all data using local API
      const [gallery, news, events, councilMembers, volunteers, complaints, voters] = await Promise.all([
        galleryAPI.getAll(),
        newsAPI.getAll(),
        eventsAPI.getAll(),
        councilMembersAPI.getAll(),
        volunteersAPI.getAll(),
        complaintsAPI.getAll(),
        votersAPI.getAll()
      ]);

      setGallery(gallery);
      setNews(news);
      setEvents(events);
      setCouncilMembers(councilMembers);
      setVolunteers(volunteers);
      setAdminComplaints(complaints);
      setAdminVoters(voters);
    } catch (err) {
      console.error("Admin data fetch error:", err);
      showToast('Failed to fetch admin data', 'error');
    }
  };

  // Separate function to fetch only non-realtime data (called from useEffect)
  const fetchAdminDataSafe = async () => {
    try {
      // Fetch all data using local API (same as fetchAdminData since we don't have real-time listeners)
      await fetchAdminData();
    } catch (err) {
      console.error("Admin data fetch error:", err);
      showToast('Failed to fetch admin data', 'error');
    }
  };

  useEffect(() => {
    // Fetch Councilor Profile using local API
    const fetchCouncilor = async () => {
      try {
        const councilor = await councilorAPI.get();
        setCouncilorProfile(councilor);
        setEditCouncilor(councilor);
      } catch (err) {
        console.error("Councilor fetch error:", err);
      }
    };

    fetchCouncilor();
  }, []);

  const [activeShareItem, setActiveShareItem] = useState<{title: string, text: string, url: string} | null>(null);

  const handleSocialShare = (platform: 'facebook' | 'twitter' | 'whatsapp') => {
    if (!activeShareItem) return;
    const url = encodeURIComponent(activeShareItem.url);
    const text = encodeURIComponent(activeShareItem.text);
    
    let shareUrl = '';
    if (platform === 'facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    if (platform === 'twitter') shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    if (platform === 'whatsapp') shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    
    window.open(shareUrl, '_blank', 'width=600,height=400');
    setActiveShareItem(null);
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

  const [isBirthLoading, setIsBirthLoading] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([
    { role: 'ai', content: lang === 'bn' ? 'আসসালামু আলাইকুম! আমি আপনার ডিজিটাল সাহায্যকারী। আমি আপনাকে কীভাবে সাহায্য করতে পারি?' : 'Assalamu Alaikum! I am your Digital Assistant. How can I help you today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsAiTyping(true);

    // Always use fallback responses for now to ensure chat works
    // This bypasses any API configuration issues
    setTimeout(() => {
      const fallbackResponse = getFallbackResponse(userMessage, lang);
      setChatMessages(prev => [...prev, { role: 'ai', content: fallbackResponse }]);
      setIsAiTyping(false);
    }, 800);
    return;

    // Original API code (commented out for now)
    /*
    // Check if API key is configured
    const apiKey = process.env.GEMINI_API_KEY;
    console.log('API Key check:', apiKey ? 'exists' : 'missing');
    
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      // Fallback to predefined responses when API key is not configured
      setTimeout(() => {
        const fallbackResponse = getFallbackResponse(userMessage, lang);
        setChatMessages(prev => [...prev, { role: 'ai', content: fallbackResponse }]);
        setIsAiTyping(false);
      }, 1000);
      return;
    }

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a helpful Digital Ward 29 Councilor Assistant for residents of Mohammadpur, Dhaka. 
        Provide accurate information about citizen services like Voter Slip/NID verification, Birth Registration, volunteer registration, and complaint filing. 
        Respond in ${lang === 'bn' ? 'Bengali' : 'English'}. Keep responses concise, professional, and friendly. 
        If a user asks about the councilor, mention Md. Monowar Hossain.
        If you don't know something, advise them to visit the Ward 29 Councilor Office at Mohammadpur.`
      });
      
      const result = await model.generateContent(userMessage);
      const aiResponse = result.response.text().trim() || (lang === 'bn' ? "দুঃখিত, আমি এই মূহূর্তে উত্তর দিতে পারছি না।" : "Sorry, I couldn't process that request.");
      setChatMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (err) {
      console.error('Chat API Error:', err);
      // Fallback to predefined response on API error
      const fallbackResponse = getFallbackResponse(userMessage, lang);
      setChatMessages(prev => [...prev, { role: 'ai', content: fallbackResponse }]);
    } finally {
      setIsAiTyping(false);
    }
    */
  };

  // Fallback response function for when API is not available
  const getFallbackResponse = (message: string, language: Language): string => {
    const lowerMessage = message.toLowerCase();
    
    if (language === 'bn') {
      if (lowerMessage.includes('ভোটার') || lowerMessage.includes('এনআইডি') || lowerMessage.includes('nid')) {
        return "ভোটার স্লিপ যাচাই করতে, অনুগ্রহ করে আপনার এনআইডি নম্বর এবং জন্মতারিখ প্রদান করুন। আমরা আপনার তথ্য যাচাই করে ভোটার স্লিপ প্রদান করব।";
      } else if (lowerMessage.includes('জন্ম') || lowerMessage.includes('বার্থ')) {
        return "জন্ম নিবন্ধন যাচাই করতে, অনুগ্রহ করে আপনার জন্ম নিবন্ধন নম্বর এবং জন্মতারিখ প্রদান করুন।";
      } else if (lowerMessage.includes('অভিযোগ') || lowerMessage.includes('complaint')) {
        return "অভিযোগ জমা দিতে, অনুগ্রহ করে আপনার নাম, ফোন নম্বর, বিষয় এবং বিস্তারিত তথ্য প্রদান করুন।";
      } else if (lowerMessage.includes('স্বেচ্ছাসেবক') || lowerMessage.includes('volunteer')) {
        return "স্বেচ্ছাসেবক হিসেবে নিবন্ধন করতে, অনুগ্রহ করে আপনার নাম, ফোন নম্বর, ঠিকানা এবং দক্ষতা প্রদান করুন।";
      } else if (lowerMessage.includes('কাউন্সিলর') || lowerMessage.includes('councilor')) {
        return "ওয়ার্ড ২৯ এর কাউন্সিলর হলেন মো. মনোয়ার হোসেন। তার অফিস মোহাম্মদপুরে অবস্থিত।";
      } else {
        return "আমি আপনার সহায়তার জন্য এখানে আছি। আপনি কোন সেবা নিতে চান? ভোটার স্লিপ, জন্ম নিবন্ধন, স্বেচ্ছাসেবক নিবন্ধন, নাকি অভিযোগ জমা দিতে চান?";
      }
    } else {
      if (lowerMessage.includes('voter') || lowerMessage.includes('nid')) {
        return "To verify your voter slip, please provide your NID number and date of birth. We'll verify your information and provide the voter slip.";
      } else if (lowerMessage.includes('birth') || lowerMessage.includes('registration')) {
        return "To verify birth registration, please provide your birth registration number and date of birth.";
      } else if (lowerMessage.includes('complaint')) {
        return "To file a complaint, please provide your name, phone number, subject, and detailed information about the issue.";
      } else if (lowerMessage.includes('volunteer')) {
        return "To register as a volunteer, please provide your name, phone number, address, and skills.";
      } else if (lowerMessage.includes('councilor')) {
        return "The councilor for Ward 29 is Md. Monowar Hossain. His office is located in Mohammadpur.";
      } else {
        return "I'm here to help you. Which service would you like? Voter slip verification, birth registration, volunteer registration, or file a complaint?";
      }
    }
  };

  const handleBirthVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBirthError('');
    setBirthData(null);
    setIsBirthLoading(true);

    if (birthRegId.length !== 17) {
      setBirthError(lang === 'bn' ? 'ভুল জন্ম নিবন্ধন নম্বর! এটি ১৭ ডিজিটের হতে হবে।' : 'Invalid Birth Registration Number! It must be 17 digits.');
      setIsBirthLoading(false);
      return;
    }

    // Simulate API delay
    setTimeout(() => {
      // Logic to make it look a bit more dynamic for demo
      const names = [
        { en: "Abdur Rahman", bn: "আব্দুর রহমান", f_en: "Late Fazlul Haque", f_bn: "মরহুম ফজলুল হক", m_en: "Amena Begum", m_bn: "আমেনা বেগম" },
        { en: "Fatima Khatun", bn: "ফাতিমা খাতুন", f_en: "Nurul Islam", f_bn: "নুরুল ইসলাম", m_en: "Razia Sultana", m_bn: "রাজিয়া সুলতানা" },
        { en: "Mohammad Ali", bn: "মোহাম্মদ আলী", f_en: "Ibrahim Hossain", f_bn: "ইব্রাহিম হোসেন", m_en: "Kulsum Bibi", m_bn: "কুলসুম বিবি" }
      ];
      const selected = names[parseInt(birthRegId.slice(-1)) % 3] || names[0];

      setBirthData({
        regId: birthRegId,
        dob: birthDob,
        regDate: "2018-11-20",
        issueDate: "2018-11-21",
        name_en: selected.en,
        name_bn: selected.bn,
        gender_en: parseInt(birthRegId.slice(-1)) % 2 === 0 ? "Female" : "Male",
        gender_bn: parseInt(birthRegId.slice(-1)) % 2 === 0 ? "মহিলা" : "পুরুষ",
        birthOrder: "1",
        father_name_en: selected.f_en,
        father_name_bn: selected.f_bn,
        father_nationality_en: "Bangladeshi",
        father_nationality_bn: "বাংলাদেশী",
        mother_name_en: selected.m_en,
        mother_name_bn: selected.m_bn,
        mother_nationality_en: "Bangladeshi",
        mother_nationality_bn: "বাংলাদেশী",
        place_of_birth_en: "Dhaka, Bangladesh",
        place_of_birth_bn: "ঢাকা, বাংলাদেশ",
        permanent_address_en: "Ward 29, DNCC, Dhaka",
        permanent_address_bn: "ওয়ার্ড ২৯, ডিএনসিসি, ঢাকা",
        status: "Verified",
        verified_at: new Date().toISOString()
      });
      setIsBirthLoading(false);
    }, 1500);
  };

  const handleVolunteerReg = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'volunteers'), {
        name: volName,
        phone: volPhone,
        email: volEmail,
        photo: volPhoto,
        status: 'pending',
        created_at: serverTimestamp()
      });
      setVolRegSuccess(true);
      setVolName(''); setVolPhone(''); setVolEmail(''); setVolPhoto(null);
      showToast(lang === 'bn' ? 'আবেদন সফল হয়েছে!' : 'Registration successful!');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'volunteers');
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
    const tracking_id = "W29-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    try {
      // Generate AI Reply
      let ai_reply = "";
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          systemInstruction: `You are an automated assistant for Ward 29 Councilor Office. 
          When a citizen submits a complaint about ${compSub}, provide a professional and empathetic initial response in ${lang === 'bn' ? 'Bengali' : 'English'}.
          Acknowledge their concern, tell them it has been logged with tracking ID ${tracking_id}, and mention that the councilor's team will review it shortly.
          Keep it short (max 2-3 sentences).`
        });
        const result = await model.generateContent(`Complaint Subject: ${compSub}\nMessage: ${compMsg}`);
        ai_reply = result.response.text();
      } catch (aiErr) {
        console.error("AI Reply generation failed:", aiErr);
        ai_reply = lang === 'bn' ? "আপনার অভিযোগটি গ্রহণ করা হয়েছে। আমাদের টিম শীঘ্রই এটি পর্যালোচনা করবে।" : "Your complaint has been received. Our team will review it shortly.";
      }

      await addDoc(collection(db, 'complaints'), {
        tracking_id,
        name: compName,
        phone: compPhone,
        subject: compSub,
        message: compMsg,
        status: 'Open',
        admin_note: `[AI Assistant]: ${ai_reply}`,
        created_at: serverTimestamp()
      });
      setCompTracking(tracking_id);
      setCompName(''); setCompPhone(''); setCompSub(''); setCompMsg('');
      showToast(lang === 'bn' ? 'অভিযোগ জমা হয়েছে!' : 'Complaint submitted!');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'complaints');
    }
  };

  const handleTrackComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError('');
    setTrackedComplaint(null);
    try {
      const q = query(collection(db, 'complaints'), where('tracking_id', '==', trackId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTrackedComplaint({ id: snap.docs[0].id, ...snap.docs[0].data() } as any);
      } else {
        setTrackError(lang === 'bn' ? 'অভিযোগ পাওয়া যায়নি।' : "Complaint not found with this ID.");
      }
    } catch (err) {
      console.error(err);
      setTrackError("Connection error");
    }
  };

  const enhancedVolunteerSearch = async () => {
    // Client-side filtering on the already fetched 'volunteers' state
    // In a real app with 10k+ entries, we'd use Firestore queries
    try {
      let q = query(collection(db, 'volunteers'));
      if (advVolSearch.phone) q = query(q, where('phone', '==', advVolSearch.phone));
      // Firestore limited in multi-field 'where' without composite indexes
      // For now we'll do basic query and then filter in client if needed
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const filtered = results.filter((v: any) => {
        const matchesQuery = !advVolSearch.query || v.name.toLowerCase().includes(advVolSearch.query.toLowerCase());
        return matchesQuery;
      });
      setVolunteers(filtered);
    } catch (err) { console.error(err); }
  };

  const enhancedComplaintSearch = async () => {
    try {
      let q = query(collection(db, 'complaints'));
      if (advCompSearch.phone) q = query(q, where('phone', '==', advCompSearch.phone));
      if (advCompSearch.status) q = query(q, where('status', '==', advCompSearch.status));
      
      const snap = await getDocs(q);
      const results = snap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      const filtered = results.filter((c: any) => {
        const matchesQuery = !advCompSearch.query || 
          c.subject.toLowerCase().includes(advCompSearch.query.toLowerCase()) ||
          c.message.toLowerCase().includes(advCompSearch.query.toLowerCase());
        return matchesQuery;
      });
      setAdminComplaints(filtered);
    } catch (err) { console.error(err); }
  };

  const addCouncilMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'council_members'), {
        ...newCouncilMember,
        created_at: serverTimestamp()
      });
      setNewCouncilMember({ name_en: '', name_bn: '', position_en: '', position_bn: '', phone: '', email: '', photo: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'সদস্য যোগ করা হয়েছে' : 'Member added successfully');
    } catch (err) { 
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'council_members');
    }
  };

  const deleteCouncilMember = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'council_members', id));
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'সদস্য মুছে ফেলা হয়েছে' : 'Member deleted successfully');
    } catch (err) { 
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'council_members/' + id);
    }
  };

  const addVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'voters'), {
        ...newVoter,
        created_at: serverTimestamp()
      });
      setNewVoter({ nid: '', dob: '', name_en: '', name_bn: '', father_name: '', mother_name: '', address: '', serial_no: '', polling_center_en: '', polling_center_bn: '', booth_no: '', photo: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'ভোটার যোগ করা হয়েছে' : 'Voter added successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'voters');
    }
  };

  const deleteVoter = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'voters', id));
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'ভোটার মুছে ফেলা হয়েছে' : 'Voter deleted successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'voters/' + id);
    }
  };

  const updateVoter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editingVoter) return;
    try {
      const { id, ...data } = editingVoter;
      await updateDoc(doc(db, 'voters', id.toString()), data);
      setEditingVoter(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'ভোটার তথ্য আপডেট করা হয়েছে' : 'Voter information updated');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'voters/' + editingVoter.id);
    }
  };

  const addEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'events'), {
        ...newEvent,
        created_at: serverTimestamp()
      });
      setNewEvent({ title_en: '', title_bn: '', description_en: '', description_bn: '', event_date: '', location_en: '', location_bn: '', image: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'ইভেন্ট তৈরি করা হয়েছে' : 'Event created successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'events');
    }
  };

  const updateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editingEvent) return;
    try {
      const { id, ...data } = editingEvent;
      await updateDoc(doc(db, 'events', id.toString()), data);
      setEditingEvent(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'ইভেন্ট আপডেট করা হয়েছে' : 'Event updated successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'events/' + editingEvent.id);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'events', id));
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'ইভেন্ট মুছে ফেলা হয়েছে' : 'Event deleted');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'events/' + id);
    }
  };

  const approveVolunteer = async (id: string) => {
    if (!adminUser) return;
    try {
      await updateDoc(doc(db, 'volunteers', id), { status: 'approved' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'স্বেচ্ছাসেবক অনুমোদিত' : 'Volunteer approved');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'volunteers/' + id);
    }
  };

  const suggestAiReply = async () => {
    if (!editingComplaint) return;
    const complaint = adminComplaints.find(c => c.id === editingComplaint.id);
    if (!complaint) return;

    setIsAiTyping(true);
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
      const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        systemInstruction: `You are a professional assistant for Ward 29 Councilor Office. 
        Analyze the citizen complaint and suggest a professional, empathetic, and action-oriented response in ${lang === 'bn' ? 'Bengali' : 'English'}.
        Identify yourself as the 'Councilor's Office'.
        Keep it concise (2-4 sentences).`
      });
      const result = await model.generateContent(`Subject: ${complaint.subject}\nMessage: ${complaint.message}`);
      setEditingComplaint({ ...editingComplaint, admin_note: result.response.text().trim() });
    } catch (err) {
      console.error("AI Auto-reply failed:", err);
      showToast(lang === 'bn' ? 'এআই উত্তর তৈরি করতে ব্যর্থ হয়েছে' : 'Failed to generate AI suggestion');
    } finally {
      setIsAiTyping(false);
    }
  };

  const updateComplaint = async () => {
    if (!adminUser || !editingComplaint) return;
    try {
      const { id, status, admin_note } = editingComplaint;
      await updateDoc(doc(db, 'complaints', id.toString()), { status, admin_note });
      setEditingComplaint(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'অভিযোগ আপডেট করা হয়েছে' : 'Complaint updated');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'complaints/' + editingComplaint.id);
    }
  };

  const addNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      console.log('Adding news:', newNews);
      
      // Add to Firestore
      const docRef = await addDoc(collection(db, 'news'), {
        ...newNews,
        created_at: serverTimestamp()
      });
      
      // Add to local state immediately
      const newNewsItem = {
        id: docRef.id,
        ...newNews,
        created_at: serverTimestamp()
      };
      
      console.log('New news item:', newNewsItem);
      setNews(prev => [newNewsItem, ...prev]);
      setNewNews({ title_en: '', title_bn: '', content_en: '', content_bn: '', image: '' });
      showToast(lang === 'bn' ? 'সংবাদ যোগ করা হয়েছে' : 'News added successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'news');
    }
  };

  const deleteNews = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'news', id));
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'সংবাদ মুছে ফেলা হয়েছে' : 'News deleted successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'news/' + id);
    }
  };

  const updateNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editingNews) return;
    try {
      const { id, ...data } = editingNews;
      await updateDoc(doc(db, 'news', id.toString()), data);
      setEditingNews(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'সংবাদ আপডেট করা হয়েছে' : 'News updated successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'news/' + editingNews.id);
    }
  };

  const addGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      await addDoc(collection(db, 'gallery'), {
        ...newGallery,
        created_at: serverTimestamp()
      });
      setNewGallery({ caption_en: '', caption_bn: '', image: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'গ্যালারি আইটেম যোগ করা হয়েছে' : 'Gallery item added successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'gallery');
    }
  };

  const deleteGallery = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'gallery', id));
      setDeleteConfirm(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'গ্যালারি আইটেম মুছে ফেলা হয়েছে' : 'Gallery item deleted successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'gallery/' + id);
    }
  };

  const updateGallery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editingGallery) return;
    try {
      const { id, ...data } = editingGallery;
      await updateDoc(doc(db, 'gallery', id.toString()), data);
      setEditingGallery(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'গ্যালারি আইটেম আপডেট করা হয়েছে' : 'Gallery item updated successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'gallery/' + editingGallery.id);
    }
  };

  const updateCouncilorProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editCouncilor) return;
    try {
      await setDoc(doc(db, 'settings', 'councilor'), {
        ...editCouncilor,
        last_updated: new Date().toISOString()
      }, { merge: true });
      showToast(lang === 'bn' ? 'কাউন্সিলর প্রোফাইল আপডেট করা হয়েছে' : 'Councilor profile updated successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, 'settings/councilor');
    }
  };

  const addAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser) return;
    try {
      const adminId = newUser.email; 
      await setDoc(doc(db, 'admins', adminId), {
        email: newUser.email,
        role: newUser.role,
        note: newUser.note,
        created_at: serverTimestamp()
      });
      setNewUser({ email: '', role: 'Editor', note: '' });
      fetchAdminData();
      showToast(lang === 'bn' ? 'অ্যাডমিন যোগ করা হয়েছে' : 'Admin user added successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.CREATE, 'admins');
    }
  };

  const deleteAdminUser = async (id: string) => {
    if (!adminUser) return;
    try {
      await deleteDoc(doc(db, 'admins', id));
      showToast(lang === 'bn' ? 'অ্যাডমিন মুছে ফেলা হয়েছে' : 'Admin user removed');
      fetchAdminData();
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, 'admins/' + id);
    }
  };

  const updateAdminUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminUser || !editingAdmin) return;
    try {
      const { id, ...data } = editingAdmin;
      await updateDoc(doc(db, 'admins', id), data);
      setEditingAdmin(null);
      fetchAdminData();
      showToast(lang === 'bn' ? 'অ্যাডমিন আপডেট করা হয়েছে' : 'Admin updated successfully');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.UPDATE, 'admins/' + editingAdmin.id);
    }
  };

  useEffect(() => {
    if (activeTab === 'admin' || activeTab === 'home') {
      fetchAdminDataSafe();
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
    <div className={`min-h-screen flex flex-col ${lang === 'bn' ? 'bn' : ''} ${darkMode ? 'dark bg-slate-900' : 'bg-slate-50'} pb-16 md:pb-0`}>
      {/* Mobile Header */}
      <div className={`md:hidden ${darkMode ? 'bg-slate-800' : 'bg-emerald-600'} text-white px-4 py-3 sticky top-0 z-[60] flex items-center justify-between no-print shadow-md`}>
        <div className="flex items-center gap-2" onClick={() => setActiveTab('home')}>
          <img src="/dncc-logo.png" alt="DNCC Logo" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold tracking-tight">Ward 29 Portal</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleDarkMode} className="p-2 bg-white/10 rounded-lg">
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button onClick={toggleLang} className="text-[10px] font-black bg-white/20 px-2 py-1 rounded-md uppercase tracking-widest">
            {lang === 'en' ? 'BN' : 'EN'}
          </button>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-white">
            {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={`hidden md:block ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} sticky top-0 z-50 no-print`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <img src="/dncc-logo.png" alt="DNCC Logo" className="w-10 h-10 rounded-xl object-contain" />
              <div className="hidden sm:block">
                <h1 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>{t.hero.title}</h1>
                <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'} font-medium`}>Mohammadpur, Dhaka</p>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-8">
              {menuStructure.map((item, idx) => (
                <NavItem key={idx} item={item} />
              ))}
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {darkMode ? <Sun size={18} /> : <Moon size={18} />}
              </button>
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
                {menuStructure.map((item, idx) => (
                  <div key={idx} className="space-y-4">
                    {!item.items ? (
                      <button
                        onClick={() => { setActiveTab(item.key); setIsMenuOpen(false); }}
                        className={`block w-full text-left px-4 py-3 rounded-xl text-lg font-black ${activeTab === item.key ? 'text-emerald-600 bg-emerald-50' : (darkMode ? 'text-white' : 'text-slate-700')}`}
                      >
                        {item.label}
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <p className={`text-[10px] font-black uppercase tracking-widest px-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {item.label}
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {item.items.map((subItem: any) => (
                            <button
                              key={subItem.key}
                              onClick={() => { setActiveTab(subItem.key); setIsMenuOpen(false); }}
                              className={`flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                                activeTab === subItem.key 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' 
                                  : (darkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-50')
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === subItem.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                {subItem.icon && <subItem.icon size={20} />}
                              </div>
                              <span className="text-sm font-black">{subItem.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                  className={`text-4xl md:text-6xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}
                >
                  {t.hero.title}
                </motion.h2>
                <p className={`text-xl ${darkMode ? 'text-slate-300' : 'text-slate-600'} max-w-2xl mx-auto`}>
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

              <CouncilorProfileSection />

              {/* Section links moved to standalone view or integrated */}
              {news.length > 0 && <NewsSection />}
              {gallery.length > 0 && <GallerySection />}
            </motion.div>
          )}

          {activeTab === 'councilor' && <CouncilorProfileSection />}

          {activeTab === 'news' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <NewsSection />
            </motion.div>
          )}

          {activeTab === 'events' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <EventsSection />
            </motion.div>
          )}

          {activeTab === 'gallery' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
               <GallerySection />
            </motion.div>
          )}

          {activeTab === 'councilMembers' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
              <section className="text-center max-w-3xl mx-auto space-y-4">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-600/10">
                  <Users size={40} />
                </div>
                <h2 className={`text-4xl font-black ${darkMode ? 'text-white' : 'text-slate-900'} tracking-tight`}>
                  {lang === 'bn' ? 'ওয়ার্ড ২৯ কাউন্সিল পরিষদ' : 'Ward 29 Council Members'}
                </h2>
                <p className={`text-lg font-medium leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {lang === 'bn' 
                    ? 'আমাদের ওয়ার্ডের উন্নয়নে এবং জনগণের সেবায় নিয়োজিত পরিষদ সদস্যদের তালিকা।' 
                    : 'List of council members dedicated to the development of our ward and serving the community.'}
                </p>
              </section>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {councilMembers.map((member) => (
                  <div key={member.id} className={`card overflow-hidden group border-2 transition-all hover:border-emerald-500 hover:shadow-2xl ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                      {member.photo ? (
                        <img src={member.photo} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <User size={80} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/90 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">
                          {lang === 'bn' ? member.position_bn : member.position_en}
                        </p>
                        <h4 className="text-xl font-black text-white leading-tight">
                          {lang === 'bn' ? member.name_bn : member.name_en}
                        </h4>
                      </div>
                    </div>
                    <div className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:text-emerald-500 transition-colors">
                          <Phone size={14} />
                        </div>
                        {member.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-slate-500 dark:text-slate-400">
                        <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:text-emerald-500 transition-colors">
                          <Mail size={14} />
                        </div>
                        {member.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
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
              <div className="card p-8 no-print border-t-4 border-emerald-600">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck size={32} />
                  </div>
                  <h2 className="text-2xl font-black text-slate-900">{t.voter.title}</h2>
                  <p className="text-slate-500 text-sm mt-1">Official Verification System</p>
                </div>
                
                <form onSubmit={handleVoterSearch} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center justify-between">
                        {t.voter.nidLabel}
                        <div className="group/tip relative">
                          <Info size={14} className="text-slate-300 hover:text-emerald-500 transition-colors cursor-help" />
                          <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-slate-900 text-[10px] leading-relaxed text-white rounded-xl opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-xl z-50 pointer-events-none">
                            <span className="font-bold text-emerald-400">NID Format:</span> 10 digits (Smart Card), 13 digits (Old), or 17 digits (Old + Birth Year prefix).
                          </div>
                        </div>
                      </label>
                      <input
                        type="text"
                        required
                        value={nid}
                        onChange={(e) => setNid(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-lg"
                        placeholder="1234567890"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">{t.voter.dobLabel}</label>
                      <input
                        type="date"
                        required
                        value={dob}
                        onChange={(e) => setDob(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                      />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2">
                    <Search size={20} />
                    {t.voter.searchBtn}
                  </button>
                </form>
                {voterError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-center gap-3 text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100"
                  >
                    <AlertCircle size={18} />
                    {voterError}
                  </motion.div>
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
                    <div className="flex gap-4">
                      {voter.photo && (
                        <div className="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                          <img src={voter.photo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-2xl font-bold text-emerald-800">{t.voter.slipHeader}</h3>
                        <p className="text-slate-500 font-bold">Ward 29, DNCC</p>
                      </div>
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
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">NID</p>
                      <p className="text-lg font-bold font-mono">{voter.nid}</p>
                    </div>
                    {voter.father_name && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.fatherName}</p>
                        <p className="text-sm font-bold">{voter.father_name}</p>
                      </div>
                    )}
                    {voter.mother_name && (
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.motherName}</p>
                        <p className="text-sm font-bold">{voter.mother_name}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.center}</p>
                      <div className="space-y-1">
                        <p className={`text-lg font-bold ${darkMode ? 'text-slate-200' : 'text-slate-900'}`}>{voter.polling_center_en}</p>
                        <p className={`text-sm font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{voter.polling_center_bn}</p>
                      </div>
                      <CountdownTimer />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.serial}</p>
                      <p className="text-lg font-bold font-mono">{voter.serial_no}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.booth}</p>
                      <p className="text-lg font-bold font-mono">{voter.booth_no}</p>
                    </div>
                    {voter.address && (
                      <div className="col-span-2">
                        <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">{t.voter.address}</p>
                        <p className="text-sm font-bold">{voter.address}</p>
                      </div>
                    )}
                    <div className="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-2">
                      <h4 className="text-xs font-black text-emerald-800 uppercase tracking-widest mb-1">
                        {lang === 'bn' ? 'ভোটের দিন তথ্য' : 'Voting Day Information'}
                      </h4>
                      <p className="text-sm text-emerald-700 font-medium leading-relaxed">
                        {lang === 'bn' 
                          ? `ভোটগ্রহণ অনুষ্ঠিত হবে ১ ডিসেম্বর, ২০২৬ তারিখে। অনুগ্রহ করে এই স্লিপ এবং আপনার মূল এনআইডি কার্ড সাথে আনুন। ভোটকেন্দ্র সকাল ৮টা থেকে বিকাল ৪টা পর্যন্ত খোলা থাকবে।`
                          : `Polling will take place on December 1st, 2026. Please bring this slip and your original NID card. The polling station will be open from 8 AM to 4 PM.`
                        }
                      </p>
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
                                    <div class="flex justify-between items-start gap-4">
                                      <div class="flex gap-4">
                                        ${voter.photo ? `<div class="w-20 h-24 bg-slate-100 rounded-lg overflow-hidden border border-slate-200"><img src="${voter.photo}" class="w-full h-full object-cover"></div>` : ''}
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
                                      </div>
                                      <div class="w-24 h-24 bg-white p-1 border border-slate-100 rounded-xl shadow-sm">
                                        <img src="${qrDataUrl}" class="w-full h-full object-contain">
                                      </div>
                                    </div>

                                    <div class="grid grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                      ${voter.father_name ? `<div><p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.fatherName}</p><p class="text-xs font-bold text-slate-900">${voter.father_name}</p></div>` : ''}
                                      ${voter.mother_name ? `<div><p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.motherName}</p><p class="text-xs font-bold text-slate-900">${voter.mother_name}</p></div>` : ''}
                                      <div class="col-span-2">
                                        <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.center}</p>
                                        <div class="space-y-1">
                                          <p class="text-xs font-bold text-slate-900">${voter.polling_center_en}</p>
                                          <p class="text-[10px] font-bold text-slate-600">${voter.polling_center_bn}</p>
                                        </div>
                                      </div>
                                      <div>
                                        <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.serial}</p>
                                        <p class="text-sm font-black text-emerald-600 font-mono">${voter.serial_no}</p>
                                      </div>
                                      <div>
                                        <p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.booth}</p>
                                        <p class="text-sm font-black text-emerald-600 font-mono">${voter.booth_no}</p>
                                      </div>
                                      ${voter.address ? `<div class="col-span-2"><p class="text-[9px] uppercase text-slate-400 font-black tracking-widest">${t.voter.address}</p><p class="text-[10px] font-bold text-slate-600">${voter.address}</p></div>` : ''}
                                      
                                      <div class="col-span-2 bg-emerald-50 p-4 rounded-xl border border-emerald-100 mt-2">
                                        <h4 class="text-[9px] font-black text-emerald-800 uppercase tracking-widest mb-1">
                                          ${lang === 'bn' ? 'ভোটের দিন তথ্য' : 'Voting Day Information'}
                                        </h4>
                                        <p class="text-[10px] text-emerald-700 font-medium leading-relaxed">
                                          ${lang === 'bn' 
                                            ? `ভোটগ্রহণ অনুষ্ঠিত হবে ১ ডিসেম্বর, ২০২৬ তারিখে। অনুগ্রহ করে এই স্লিপ এবং আপনার মূল এনআইডি কার্ড সাথে আনুন। ভোটকেন্দ্র সকাল ৮টা থেকে বিকাল ৪টা পর্যন্ত খোলা থাকবে।`
                                            : `Polling will take place on December 1st, 2026. Please bring this slip and your original NID card. The polling station will be open from 8 AM to 4 PM.`
                                          }
                                        </p>
                                      </div>
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

          {activeTab === 'birthVerify' && (
            <BirthVerifySection />
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
                    {trackedComplaint.status === 'Resolved' && (
                      <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold flex items-center gap-2 border border-emerald-100 shadow-sm">
                        <CheckCircle2 size={18} />
                        {lang === 'bn' 
                          ? 'আপনার ধৈর্যের জন্য ধন্যবাদ। আপনার সমস্যাটি সমাধান করা হয়েছে।' 
                          : 'Thank you for your patience. Your issue has been resolved.'}
                      </div>
                    )}
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

          {activeTab === 'privacy' && (
            <StaticPage 
              title={t.nav.privacy} 
              content={
                <div className="space-y-6">
                  <p>Your privacy is important to us. This Privacy Policy explains how Ward 29 DNCC Portal collects, uses, and protects your information.</p>
                  <h2 className="text-xl font-bold text-slate-900">Information Collection</h2>
                  <p>We collect information you provide directly to us, such as when you search for a voter slip, register as a volunteer, or submit a complaint. This may include your name, NID number, date of birth, phone number, and email address.</p>
                  <h2 className="text-xl font-bold text-slate-900">Use of Information</h2>
                  <p>We use the information we collect to provide, maintain, and improve our services, to process your requests, and to communicate with you.</p>
                  <h2 className="text-xl font-bold text-slate-900">Data Protection</h2>
                  <p>We implement a variety of security measures to maintain the safety of your personal information. Your NID data is processed securely and is only used for verification purposes.</p>
                </div>
              } 
            />
          )}

          {activeTab === 'terms' && (
            <StaticPage 
              title={t.nav.terms} 
              content={
                <div className="space-y-6">
                  <p>By accessing or using the Ward 29 DNCC Portal, you agree to be bound by these Terms of Service.</p>
                  <h2 className="text-xl font-bold text-slate-900">Use of Service</h2>
                  <p>You agree to use the portal only for lawful purposes and in a way that does not infringe the rights of, restrict, or inhibit anyone else's use and enjoyment of the portal.</p>
                  <h2 className="text-xl font-bold text-slate-900">Voter Information</h2>
                  <p>The voter information provided on this portal is for informational purposes only. Official voter information should be verified with the Bangladesh Election Commission.</p>
                  <h2 className="text-xl font-bold text-slate-900">Limitation of Liability</h2>
                  <p>Ward 29 DNCC will not be liable for any damages arising from the use of this portal.</p>
                </div>
              } 
            />
          )}

          {activeTab === 'contact' && (
            <StaticPage 
              title={t.nav.contact} 
              content={
                <div className="space-y-6">
                  <p>If you have any questions or need assistance, please feel free to contact us.</p>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-slate-900">Office Address</h2>
                      <p className="text-slate-600">
                        Ward 29 Councillor Office<br />
                        Mohammadpur, Dhaka-1207<br />
                        Bangladesh
                      </p>
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-xl font-bold text-slate-900">Contact Details</h2>
                      <p className="text-slate-600">
                        Phone: +880 1234-567890<br />
                        Email: info@ward29dncc.gov.bd
                      </p>
                    </div>
                  </div>
                </div>
              } 
            />
          )}

          {activeTab === 'about' && (
            <StaticPage 
              title={t.nav.about} 
              content={
                <div className="space-y-6">
                  <p>Ward 29 DNCC Portal is a digital initiative to provide essential services and information to the residents of Ward 29, Mohammadpur, Dhaka North City Corporation.</p>
                  <h2 className="text-xl font-bold text-slate-900">Our Mission</h2>
                  <p>Our mission is to leverage technology to make civic services more accessible, transparent, and efficient for our citizens.</p>
                  <h2 className="text-xl font-bold text-slate-900">What We Offer</h2>
                  <ul className="list-disc pl-6 space-y-2">
                    <li>Digital Voter Information Slips</li>
                    <li>Volunteer Registration and Management</li>
                    <li>Citizen Complaint Tracking System</li>
                    <li>Latest News and Community Updates</li>
                  </ul>
                </div>
              } 
            />
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
                <div className="max-w-md mx-auto card p-8 space-y-6 text-center">
                  <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 rotate-3 hover:rotate-0 transition-transform">
                    <ShieldCheck size={40} />
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-slate-900">{t.admin.loginTitle || 'Admin Access'}</h2>
                    <p className="text-slate-500 font-medium">{t.admin.loginSubtitle || 'Sign in to manage Ward 29 services'}</p>
                  </div>
                  
                  {/* Login Method Toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1">
                    <button
                      onClick={() => setLoginMethod('google')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-xs transition-all ${
                        loginMethod === 'google' 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Google
                    </button>
                    <button
                      onClick={() => setLoginMethod('email')}
                      className={`flex-1 py-2 px-4 rounded-lg font-black text-xs transition-all ${
                        loginMethod === 'email' 
                          ? 'bg-white text-emerald-600 shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Email
                    </button>
                  </div>

                  {/* Google Login */}
                  {loginMethod === 'google' && (
                    <div className="pt-4">
                      <button
                        onClick={() => handleAdminLogin('google')}
                        className="w-full flex items-center justify-center gap-4 bg-white border-2 border-slate-200 py-4 rounded-2xl font-black text-slate-700 hover:bg-slate-50 hover:border-emerald-300 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] group"
                      >
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6 grayscale group-hover:grayscale-0 transition-all" alt="Google" />
                        Sign in with Google
                      </button>
                    </div>
                  )}

                  {/* Email/Password Login */}
                  {loginMethod === 'email' && (
                    <div className="pt-4 space-y-4">
                      <div className="space-y-3">
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="email"
                            placeholder="Admin Email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl font-medium text-slate-700 placeholder-slate-400 focus:border-emerald-300 focus:outline-none transition-colors"
                          />
                        </div>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input
                            type="password"
                            placeholder="Password"
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin('email')}
                            className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-2xl font-medium text-slate-700 placeholder-slate-400 focus:border-emerald-300 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleAdminLogin('email')}
                        className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl hover:shadow-2xl active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <UserCheck size={20} />
                        Sign In with Email
                      </button>
                    </div>
                  )}

                  <div className="relative pt-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-[0.2em]"><span className="px-4 bg-white text-slate-300">Authorized Personnel Only</span></div>
                  </div>

                  {adminLoginError && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600">
                      <AlertCircle size={18} />
                      <p className="text-xs font-bold text-left">{adminLoginError}</p>
                    </motion.div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col lg:flex-row gap-8 min-h-[700px]">
                  {/* Admin Sidebar */}
                  <aside className="lg:w-72 flex-shrink-0 animate-in slide-in-from-left duration-500">
                    <div className="card p-4 sticky top-24 space-y-6 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-100 -mx-4 -mt-4 bg-slate-50/50">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                          <LayoutDashboard size={20} className="text-emerald-600" /> 
                          {t.admin.dashboard}
                        </h2>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest ${
                            isSuperAdmin ? 'bg-purple-100 text-purple-700' : 
                            isEditor ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {adminUser.role}
                          </span>
                        </div>
                      </div>
                      
                      <nav className="space-y-6">
                        {/* Overview Section */}
                        <div className="space-y-1">
                          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">General</p>
                          <button
                            onClick={() => setAdminSubTab('overview')}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                              adminSubTab === 'overview' 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                            }`}
                          >
                            <LayoutDashboard size={18} /> Overview
                          </button>
                        </div>

                        {/* Citizens Section */}
                        <div className="space-y-1">
                          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Citizens</p>
                          {[
                            { id: 'voters', icon: UserCheck, label: t.admin.voters },
                            { id: 'volunteers', icon: UserPlus, label: t.admin.volunteers },
                            { id: 'complaints', icon: MessageSquare, label: t.admin.complaints },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setAdminSubTab(tab.id as any)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                adminSubTab === tab.id 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <tab.icon size={18} /> {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Content Section */}
                        <div className="space-y-1">
                          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Content</p>
                          {[
                            { id: 'news', icon: Newspaper, label: t.nav.news },
                            { id: 'events', icon: Clock, label: t.nav.events },
                            { id: 'gallery', icon: ImageIcon, label: t.nav.gallery },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setAdminSubTab(tab.id as any)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                adminSubTab === tab.id 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <tab.icon size={18} /> {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* Organization Section */}
                        <div className="space-y-1">
                          <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Organization</p>
                          {[
                            { id: 'councilor', icon: ShieldCheck, label: t.admin.councilor },
                            { id: 'council-members', icon: Users, label: t.admin.councilMembers },
                          ].map(tab => (
                            <button
                              key={tab.id}
                              onClick={() => setAdminSubTab(tab.id as any)}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                adminSubTab === tab.id 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <tab.icon size={18} /> {tab.label}
                            </button>
                          ))}
                        </div>

                        {/* System Section */}
                        {canManageAdmins && (
                          <div className="space-y-1">
                            <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">System</p>
                            <button
                              onClick={() => setAdminSubTab('users')}
                              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                                adminSubTab === 'users' 
                                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' 
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`}
                            >
                              <Shield size={18} /> {t.admin.users}
                            </button>
                          </div>
                        )}
                      </nav>

                      <div className="pt-4 mt-8 border-t border-slate-100 flex flex-col gap-2">
                        <div className="px-4 text-xs font-medium text-slate-400 mb-2 truncate">
                          {adminUser.email}
                        </div>
                        <button 
                          onClick={() => setAdminUser(null)}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                        >
                          <X size={18} /> {t.admin.logout}
                        </button>
                      </div>
                    </div>
                  </aside>

                  {/* Admin Content Area */}
                  <div className="flex-grow space-y-6">
                    <div className="flex justify-between items-end pb-4 border-b border-slate-100">
                      <div>
                        <h3 className="text-3xl font-black text-slate-900 capitalize tracking-tight">
                          {adminSubTab.replace('-', ' ')}
                        </h3>
                        <p className="text-sm font-medium text-slate-400 mt-1">
                          Manage Ward 29's {adminSubTab.replace('-', ' ')} section
                        </p>
                      </div>
                      <div className="hidden md:flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'bn' ? 'তারিখ' : 'Today'}</p>
                          <p className="text-sm font-black text-slate-700">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="w-px h-8 bg-slate-200" />
                        <Clock size={24} className="text-emerald-500" />
                      </div>
                    </div>

                    {adminSubTab === 'overview' && (
                      <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {[
                            { label: t.admin.voters, value: adminVoters.length, icon: UserCheck, color: 'bg-blue-50 text-blue-600' },
                            { label: t.admin.volunteers, value: volunteers.length, icon: UserPlus, color: 'bg-emerald-50 text-emerald-600' },
                            { label: t.admin.complaints, value: adminComplaints.length, icon: MessageSquare, color: 'bg-amber-50 text-amber-600' },
                            { label: t.nav.news, value: news.length, icon: Newspaper, color: 'bg-slate-50 text-slate-600' },
                          ].map((stat, i) => (
                            <div key={i} className="card p-6 flex items-center justify-between group hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                              <div className="space-y-1">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                                <p className="text-3xl font-black text-slate-800">{stat.value}</p>
                              </div>
                              <div className={`w-14 h-14 ${stat.color} rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                                <stat.icon size={28} />
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="card p-8 space-y-6">
                            <h4 className="text-xl font-black text-slate-800 flex items-center gap-3">
                              <Clock size={24} className="text-emerald-600" /> Recent Activities
                            </h4>
                            <div className="space-y-6">
                              {/* Mock recent activities based on existing data */}
                              {[...adminComplaints, ...volunteers].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5).map((item: any, i) => (
                                <div key={i} className="flex gap-4">
                                  <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${item.tracking_id ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                    {item.tracking_id ? <MessageSquare size={18} /> : <UserPlus size={18} />}
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm font-bold text-slate-800">
                                      {item.tracking_id ? `New Complaint: ${item.subject}` : `Volunteer Application: ${item.name}`}
                                    </p>
                                    <p className="text-xs text-slate-500 font-medium">{new Date(item.created_at).toLocaleString()}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="card p-8 space-y-6 bg-slate-900 text-white relative overflow-hidden">
                            <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
                            <h4 className="text-xl font-black flex items-center gap-3">
                              <Shield size={24} className="text-emerald-400" /> Administrative Notice
                            </h4>
                            <div className="space-y-4 relative z-10">
                              <p className="text-slate-300 text-sm leading-relaxed">
                                Welcome to the Ward 29 Digital Hub. You are logged in with <span className="text-emerald-400 font-bold uppercase">{adminUser.role}</span> privileges. 
                                Please handle citizen data with strict confidentiality.
                              </p>
                              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center gap-4">
                                <Info size={24} className="text-emerald-400" />
                                <div className="text-xs">
                                  <p className="font-bold">Privacy Policy Enforcement</p>
                                  <p className="text-slate-400">All administrative actions are logged for security auditing purposes.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {adminSubTab === 'volunteers' && (
                    <div className="space-y-4">
                      {/* Advanced Search Header */}
                      <div className="card p-6 bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Search size={18} className="text-emerald-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{t.search.advanced}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <input 
                            type="text" 
                            placeholder={t.search.name}
                            value={advVolSearch.query}
                            onChange={e => setAdvVolSearch({...advVolSearch, query: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input 
                            type="text" 
                            placeholder={t.search.phone}
                            value={advVolSearch.phone}
                            onChange={e => setAdvVolSearch({...advVolSearch, phone: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input 
                            type="date" 
                            value={advVolSearch.from}
                            onChange={e => setAdvVolSearch({...advVolSearch, from: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input 
                            type="date" 
                            value={advVolSearch.to}
                            onChange={e => setAdvVolSearch({...advVolSearch, to: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={enhancedVolunteerSearch} className="btn-primary py-2 px-6 flex items-center gap-2 text-xs">
                            <Search size={14} /> {t.search.find}
                          </button>
                          <button 
                            onClick={() => {
                              setAdvVolSearch({ query: '', phone: '', from: '', to: '' });
                              fetchAdminData();
                            }} 
                            className="bg-slate-200 text-slate-600 font-bold py-2 px-6 rounded-xl hover:bg-slate-300 transition-colors text-xs"
                          >
                            {t.search.clear}
                          </button>
                        </div>
                      </div>

                      <div className="card overflow-hidden">
                      <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row gap-4">
                        <div className="flex-grow flex items-center bg-white border border-slate-200 rounded-xl px-4 py-2 ring-1 ring-slate-100 focus-within:ring-2 focus-within:ring-emerald-500">
                          <Search size={18} className="text-slate-400 mr-2" />
                          <input 
                            type="text" 
                            placeholder={lang === 'bn' ? 'নাম বা ফোন নম্বর দিয়ে খুঁজুন...' : 'Search by name or phone...'}
                            value={volSearch}
                            onChange={(e) => setVolSearch(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm w-full font-medium"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}</span>
                          <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                            {(['all', 'pending', 'approved'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => setVolStatusFilter(status)}
                                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-tight transition-all ${
                                  volStatusFilter === status 
                                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' 
                                    : 'text-slate-400 hover:text-slate-600'
                                }`}
                              >
                                {status === 'all' ? (lang === 'bn' ? 'সব' : 'All') : t.volunteer[status as keyof typeof t.volunteer] || status}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
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
                            {volunteers
                              .filter(v => {
                                const matchesSearch = v.name.toLowerCase().includes(volSearch.toLowerCase()) || 
                                                     v.phone.includes(volSearch);
                                const matchesStatus = volStatusFilter === 'all' || v.status === volStatusFilter;
                                return matchesSearch && matchesStatus;
                              })
                              .map(v => (
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
                                  {v.status === 'pending' && canEdit && (
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
                                        className="text-xs font-bold text-emerald-600 hover:scale-105 transition-transform flex items-center gap-1 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-100"
                                      >
                                        <Printer size={12} /> {lang === 'bn' ? 'কার্ড তৈরি করুন' : 'Generate ID Card'}
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
                  </div>
                )}

                {adminSubTab === 'complaints' && (
                  <div className="space-y-4">
                      {/* Advanced Search Header */}
                      <div className="card p-6 bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2 mb-4">
                          <Search size={18} className="text-emerald-600" />
                          <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{t.search.advanced}</h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                          <input 
                            type="text" 
                            placeholder={lang === 'bn' ? 'বিষয় বা বিবরণ...' : 'Subject or Desc...'}
                            value={advCompSearch.query}
                            onChange={e => setAdvCompSearch({...advCompSearch, query: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input 
                            type="text" 
                            placeholder={t.search.phone}
                            value={advCompSearch.phone}
                            onChange={e => setAdvCompSearch({...advCompSearch, phone: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <select
                            value={advCompSearch.status}
                            onChange={e => setAdvCompSearch({...advCompSearch, status: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none"
                          >
                            <option value="">All Status</option>
                            <option value="Open">Open</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                          </select>
                          <input 
                            type="date" 
                            value={advCompSearch.from}
                            onChange={e => setAdvCompSearch({...advCompSearch, from: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                          <input 
                            type="date" 
                            value={advCompSearch.to}
                            onChange={e => setAdvCompSearch({...advCompSearch, to: e.target.value})}
                            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button onClick={enhancedComplaintSearch} className="btn-primary py-2 px-6 flex items-center gap-2 text-xs">
                            <Search size={14} /> {t.search.find}
                          </button>
                          <button 
                            onClick={() => {
                              setAdvCompSearch({ query: '', phone: '', from: '', to: '', status: '' });
                              fetchAdminData();
                            }} 
                            className="bg-slate-200 text-slate-600 font-bold py-2 px-6 rounded-xl hover:bg-slate-300 transition-colors text-xs"
                          >
                            {t.search.clear}
                          </button>
                        </div>
                      </div>

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
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Admin Note</label>
                                    <button 
                                      type="button" 
                                      onClick={suggestAiReply}
                                      disabled={isAiTyping}
                                      className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-600 hover:text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg transition-all disabled:opacity-50"
                                    >
                                      {isAiTyping ? <div className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" /> : <Sparkles size={10} />}
                                      {lang === 'bn' ? 'এআই পরামর্শ' : 'AI Suggest'}
                                    </button>
                                  </div>
                                  <textarea 
                                    rows={3}
                                    value={editingComplaint.admin_note}
                                    onChange={e => setEditingComplaint({...editingComplaint, admin_note: e.target.value})}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                                    placeholder={lang === 'bn' ? 'অ্যাডমিন নোট...' : 'Add internal note or reply...'}
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
                  </div>
                )}

                   {adminSubTab === 'news' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                      {canEdit && (
                        <div className="lg:col-span-1">
                          <form onSubmit={addNews} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2"><Plus size={18} /> Add News</div>
                              <div className="group/tip relative">
                                <HelpCircle size={14} className="text-slate-300 hover:text-emerald-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-xl z-50 pointer-events-none">
                                  News will be visible on the public home page immediate after publishing.
                                </div>
                              </div>
                            </h3>
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
                                  onClick={() => handleShare('news', item)}
                                  className="text-emerald-600 hover:text-emerald-700 p-1 rounded-lg hover:bg-emerald-50 transition-colors flex items-center gap-1 text-[10px] font-bold"
                                >
                                  <Share2 size={14} /> Share
                                </button>
                                {canEdit && (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingNews(item)} className="text-emerald-600 hover:text-emerald-700 p-1"><Pencil size={14} /></button>
                                    <button onClick={() => setDeleteConfirm({ id: item.id, type: 'news' })} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                                  </div>
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
                      {canEdit && (
                        <div className="lg:col-span-1">
                          <form onSubmit={addGallery} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2"><Plus size={18} /> Add Photo</div>
                              <div className="group/tip relative">
                                <HelpCircle size={14} className="text-slate-300 hover:text-emerald-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-xl z-50 pointer-events-none">
                                   Ensure images are in JPG/PNG format for best compatibility.
                                </div>
                              </div>
                            </h3>
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
                                  onClick={() => handleShare('gallery', item)}
                                  className="text-white bg-emerald-600 p-2 rounded-lg hover:bg-emerald-700 transition-colors"
                                >
                                  <Share2 size={14} />
                                </button>
                                {canEdit && (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingGallery(item)} className="text-white bg-blue-600 p-2 rounded-lg hover:bg-blue-700 transition-colors">
                                      <Pencil size={14} />
                                    </button>
                                    <button onClick={() => setDeleteConfirm({ id: item.id, type: 'gallery' })} className="text-white bg-red-600 p-2 rounded-lg hover:bg-red-700 transition-colors">
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                   )}

                   {adminSubTab === 'events' && (
                    <div className="grid lg:grid-cols-3 gap-8">
                      {canEdit && (
                        <div className="lg:col-span-1">
                          <form onSubmit={addEvent} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2"><Plus size={18} /> Add Event</div>
                              <div className="group/tip relative">
                                <HelpCircle size={14} className="text-slate-300 hover:text-emerald-500 cursor-help" />
                                <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-slate-900 text-[10px] text-white rounded-lg opacity-0 invisible group-hover/tip:opacity-100 group-hover/tip:visible transition-all shadow-xl z-50 pointer-events-none">
                                  Events appear in chronological order on the public events section.
                                </div>
                              </div>
                            </h3>
                            <input type="text" placeholder="Title (EN)" required value={newEvent.title_en} onChange={e => setNewEvent({...newEvent, title_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="text" placeholder="Title (BN)" required value={newEvent.title_bn} onChange={e => setNewEvent({...newEvent, title_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <textarea placeholder="Description (EN)" required rows={3} value={newEvent.description_en} onChange={e => setNewEvent({...newEvent, description_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                            <textarea placeholder="Description (BN)" required rows={3} value={newEvent.description_bn} onChange={e => setNewEvent({...newEvent, description_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                            <input type="date" required value={newEvent.event_date} onChange={e => setNewEvent({...newEvent, event_date: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="text" placeholder="Location (EN)" required value={newEvent.location_en} onChange={e => setNewEvent({...newEvent, location_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="text" placeholder="Location (BN)" required value={newEvent.location_bn} onChange={e => setNewEvent({...newEvent, location_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                            <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setNewEvent({...newEvent, image: val}))} className="text-xs" />
                            <button type="submit" className="w-full btn-primary">Create Event</button>
                          </form>
                        </div>
                      )}
                      <div className={adminUser.role === 'Viewer' ? 'lg:col-span-3 space-y-4' : 'lg:col-span-2 space-y-4'}>
                        {events.map(event => (
                          <div key={event.id} className="card p-4 flex gap-4">
                            <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                              {event.image && <img src={event.image} className="w-full h-full object-cover" />}
                            </div>
                            <div className="flex-grow">
                              <h4 className="font-bold">{event.title_bn}</h4>
                              <p className="text-xs text-slate-500 mt-1">{new Date(event.event_date).toLocaleDateString()} • {event.location_bn}</p>
                              <div className="flex items-center gap-2 mt-2">
                                {canEdit && (
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => setEditingEvent(event)} className="text-emerald-600 hover:text-emerald-700 p-1"><Pencil size={14} /></button>
                                    <button onClick={() => setDeleteConfirm({ id: event.id, type: 'event' })} className="text-red-600 hover:text-red-700 p-1"><Trash2 size={14} /></button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'councilor' && !editCouncilor && (
                    <div className="card p-12 text-center space-y-6 animate-in fade-in zoom-in">
                      <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <UserPlus size={48} />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Profile Not Formed</h3>
                        <p className="text-slate-500 font-medium max-w-md mx-auto">The digital identity for Ward 29 Councilor hasn't been established in the database yet.</p>
                      </div>
                      <button 
                        onClick={async () => {
                          const initial = {
                            name_en: "Md. Monowar Hossain",
                            name_bn: "মো: মনোয়ার হোসেন",
                            career_en: "Add political career here...",
                            career_bn: "এখানে রাজনৈতিক কর্মজীবন যোগ করুন...",
                            social_service_en: "Add social services here...",
                            social_service_bn: "এখানে সামাজিক সেবা যোগ করুন...",
                            message_en: "Add councilor's message here...",
                            message_bn: "এখানে কাউন্সিলরের বার্তা যোগ করুন...",
                            education_en: "Add education here...",
                            education_bn: "এখানে শিক্ষা যোগ করুন...",
                            photo: "",
                            last_updated: new Date().toISOString()
                          };
                          try {
                            await setDoc(doc(db, 'settings', 'councilor'), initial);
                            showToast(lang === 'bn' ? 'কাউন্সিলর প্রোফাইল তৈরি করা হয়েছে' : 'Councilor profile initialized');
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="btn-primary px-8 py-4 text-lg shadow-xl"
                      >
                        Initialize Councilor Profile
                      </button>
                    </div>
                  )}

                  {adminSubTab === 'councilor' && editCouncilor && (
                    <div className="card p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 text-slate-800">
                      <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Councilor Profile Management</h2>
                        <div className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
                          SuperAdmin Only
                        </div>
                      </div>

                      <form onSubmit={updateCouncilorProfile} className="space-y-8">
                        {/* Photo Section */}
                        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start pb-8 border-b border-slate-100">
                          <div className="relative group">
                            <div className="w-40 h-40 bg-slate-100 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-xl">
                              {editCouncilor.photo ? (
                                <img src={editCouncilor.photo} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300">
                                  <ShieldCheck size={48} />
                                </div>
                              )}
                            </div>
                            <label className="absolute -bottom-2 -right-2 bg-emerald-600 text-white p-3 rounded-xl shadow-lg cursor-pointer hover:bg-emerald-700 transition-colors">
                              <Plus size={20} />
                              <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setEditCouncilor({...editCouncilor, photo: val}))} className="hidden" />
                            </label>
                          </div>
                          <div className="flex-grow space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">General Information</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Name (English)</label>
                                <input type="text" required value={editCouncilor.name_en} onChange={e => setEditCouncilor({...editCouncilor, name_en: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Name (Bengali)</label>
                                <input type="text" required value={editCouncilor.name_bn} onChange={e => setEditCouncilor({...editCouncilor, name_bn: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Content Sections */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Clock size={14} className="text-emerald-500" /> Political Career
                            </p>
                            <textarea rows={6} required value={editCouncilor.career_en} onChange={e => setEditCouncilor({...editCouncilor, career_en: e.target.value})} placeholder="English description..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                            <textarea rows={6} required value={editCouncilor.career_bn} onChange={e => setEditCouncilor({...editCouncilor, career_bn: e.target.value})} placeholder="Bengali description..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                          </div>
                          
                          <div className="space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <Sparkles size={14} className="text-emerald-500" /> Social Service
                            </p>
                            <textarea rows={6} required value={editCouncilor.social_service_en} onChange={e => setEditCouncilor({...editCouncilor, social_service_en: e.target.value})} placeholder="English description..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                            <textarea rows={6} required value={editCouncilor.social_service_bn} onChange={e => setEditCouncilor({...editCouncilor, social_service_bn: e.target.value})} placeholder="Bengali description..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <MessageSquare size={14} className="text-emerald-500" /> Councilor's Message
                            </p>
                            <textarea rows={3} required value={editCouncilor.message_en} onChange={e => setEditCouncilor({...editCouncilor, message_en: e.target.value})} placeholder="English message..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                            <textarea rows={3} required value={editCouncilor.message_bn} onChange={e => setEditCouncilor({...editCouncilor, message_bn: e.target.value})} placeholder="Bengali message..." className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none resize-none"></textarea>
                          </div>

                          <div className="md:col-span-2 space-y-4">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                              <FileText size={14} className="text-emerald-500" /> Education
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <input type="text" required value={editCouncilor.education_en} onChange={e => setEditCouncilor({...editCouncilor, education_en: e.target.value})} placeholder="Education (English)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                              <input type="text" required value={editCouncilor.education_bn} onChange={e => setEditCouncilor({...editCouncilor, education_bn: e.target.value})} placeholder="Education (Bengali)" className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none" />
                            </div>
                          </div>
                        </div>

                        <div className="pt-4">
                          {canEdit && (
                            <button type="submit" className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-3">
                              <CheckCircle2 size={24} /> Save Councilor Profile Changes
                            </button>
                          )}
                        </div>
                      </form>
                    </div>
                  )}

                  {adminSubTab === 'voters' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight font-serif flex items-center gap-3">
                          <UserCheck className="text-emerald-600" /> Voter Database Management
                        </h2>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                        {canEdit && (
                          <div className="lg:col-span-1">
                            <form onSubmit={editingVoter ? updateVoter : addVoter} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Plus size={18} /> {editingVoter ? 'Edit Voter' : 'Add New Voter'}
                              </div>
                              {editingVoter && (
                                <button type="button" onClick={() => setEditingVoter(null)} className="text-xs text-red-500 hover:underline">Cancel</button>
                              )}
                            </h3>
                            <div className="space-y-4">
                              <input type="text" placeholder="NID Number" required value={editingVoter ? editingVoter.nid : newVoter.nid} onChange={e => editingVoter ? setEditingVoter({...editingVoter, nid: e.target.value}) : setNewVoter({...newVoter, nid: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-mono" />
                              <input type="date" required value={editingVoter ? editingVoter.dob : newVoter.dob} onChange={e => editingVoter ? setEditingVoter({...editingVoter, dob: e.target.value}) : setNewVoter({...newVoter, dob: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Name (English)" required value={editingVoter ? editingVoter.name_en : newVoter.name_en} onChange={e => editingVoter ? setEditingVoter({...editingVoter, name_en: e.target.value}) : setNewVoter({...newVoter, name_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Name (Bengali)" required value={editingVoter ? editingVoter.name_bn : newVoter.name_bn} onChange={e => editingVoter ? setEditingVoter({...editingVoter, name_bn: e.target.value}) : setNewVoter({...newVoter, name_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Father's Name" value={editingVoter ? editingVoter.father_name : newVoter.father_name} onChange={e => editingVoter ? setEditingVoter({...editingVoter, father_name: e.target.value}) : setNewVoter({...newVoter, father_name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Mother's Name" value={editingVoter ? editingVoter.mother_name : newVoter.mother_name} onChange={e => editingVoter ? setEditingVoter({...editingVoter, mother_name: e.target.value}) : setNewVoter({...newVoter, mother_name: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Polling Center (EN)" value={editingVoter ? editingVoter.polling_center_en : newVoter.polling_center_en} onChange={e => editingVoter ? setEditingVoter({...editingVoter, polling_center_en: e.target.value}) : setNewVoter({...newVoter, polling_center_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Polling Center (BN)" value={editingVoter ? editingVoter.polling_center_bn : newVoter.polling_center_bn} onChange={e => editingVoter ? setEditingVoter({...editingVoter, polling_center_bn: e.target.value}) : setNewVoter({...newVoter, polling_center_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="Serial No" value={editingVoter ? editingVoter.serial_no : newVoter.serial_no} onChange={e => editingVoter ? setEditingVoter({...editingVoter, serial_no: e.target.value}) : setNewVoter({...newVoter, serial_no: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-mono" />
                                <input type="text" placeholder="Booth No" value={editingVoter ? editingVoter.booth_no : newVoter.booth_no} onChange={e => editingVoter ? setEditingVoter({...editingVoter, booth_no: e.target.value}) : setNewVoter({...newVoter, booth_no: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm font-mono" />
                              </div>
                              <textarea placeholder="Address" rows={2} value={editingVoter ? editingVoter.address : newVoter.address} onChange={e => editingVoter ? setEditingVoter({...editingVoter, address: e.target.value}) : setNewVoter({...newVoter, address: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm resize-none"></textarea>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Voter Photo URL</label>
                                <input type="text" placeholder="https://..." value={editingVoter ? editingVoter.photo : newVoter.photo} onChange={e => editingVoter ? setEditingVoter({...editingVoter, photo: e.target.value}) : setNewVoter({...newVoter, photo: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              </div>
                            </div>
                            <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                              {editingVoter ? <Search size={18} /> : <Plus size={18} />}
                              {editingVoter ? 'Update Voter' : 'Add Voter'}
                            </button>
                          </form>
                        </div>
                      )}

                        <div className="lg:col-span-2 space-y-4">
                          <div className="card overflow-hidden">
                            <table className="w-full text-left">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Voter</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">NID / DOB</th>
                                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {adminVoters.length === 0 ? (
                                  <tr>
                                    <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">No voters registered in Ward 29 dataset.</td>
                                  </tr>
                                ) : (
                                  adminVoters.map((v) => (
                                    <tr key={v.id} className="hover:bg-slate-50 transition-colors group">
                                      <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center overflow-hidden">
                                            {v.photo ? (
                                              <img src={v.photo} className="w-full h-full object-cover" />
                                            ) : (
                                              <User size={20} />
                                            )}
                                          </div>
                                          <div>
                                            <p className="text-sm font-bold text-slate-800">{v.name_en}</p>
                                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">{v.name_bn}</p>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4">
                                        <p className="text-xs font-mono font-bold text-slate-600">{v.nid}</p>
                                        <p className="text-[10px] font-bold text-slate-400">{v.dob}</p>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                        {canEdit && (
                                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => setEditingVoter(v)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                                              <Edit3 size={16} />
                                            </button>
                                            <button onClick={() => setDeleteConfirm({ id: v.id, type: 'voter' })} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'council-members' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="flex justify-between items-center">
                        <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight font-serif flex items-center gap-3">
                          <Users className="text-emerald-600" /> {t.admin.councilMembers}
                        </h2>
                      </div>

                      <div className="grid lg:grid-cols-3 gap-8">
                        {canEdit && (
                          <div className="lg:col-span-1">
                            <form onSubmit={addCouncilMember} className="card p-6 space-y-4 sticky top-24">
                            <h3 className="font-bold flex items-center gap-2">
                              <Plus size={18} /> Add Member
                            </h3>
                            <div className="space-y-4">
                              <input type="text" placeholder="Name (EN)" required value={newCouncilMember.name_en} onChange={e => setNewCouncilMember({...newCouncilMember, name_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Name (BN)" required value={newCouncilMember.name_bn} onChange={e => setNewCouncilMember({...newCouncilMember, name_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Position (EN)" required value={newCouncilMember.position_en} onChange={e => setNewCouncilMember({...newCouncilMember, position_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Position (BN)" required value={newCouncilMember.position_bn} onChange={e => setNewCouncilMember({...newCouncilMember, position_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="text" placeholder="Phone" value={newCouncilMember.phone} onChange={e => setNewCouncilMember({...newCouncilMember, phone: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <input type="email" placeholder="Email" value={newCouncilMember.email} onChange={e => setNewCouncilMember({...newCouncilMember, email: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Photo</label>
                                <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setNewCouncilMember({...newCouncilMember, photo: val}))} className="text-xs" />
                              </div>
                            </div>
                            <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2">
                              <Plus size={18} /> Add Member
                            </button>
                          </form>
                        </div>
                      )}

                        <div className="lg:col-span-2 grid md:grid-cols-2 gap-4">
                          {councilMembers.length === 0 ? (
                            <div className="col-span-full card p-12 text-center text-slate-400 font-medium bg-slate-50/50 border-dashed border-2">
                              No council members listed yet.
                            </div>
                          ) : (
                            councilMembers.map((member) => (
                              <div key={member.id} className="card p-4 flex gap-4 hover:shadow-lg transition-all group">
                                <div className="w-16 h-16 rounded-xl bg-slate-100 flex-shrink-0 overflow-hidden">
                                  {member.photo ? (
                                    <img src={member.photo} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300">
                                      <User size={32} />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="font-bold text-slate-800 leading-tight">{lang === 'bn' ? member.name_bn : member.name_en}</h4>
                                  <p className="text-xs font-bold text-emerald-600 mt-0.5">{lang === 'bn' ? member.position_bn : member.position_en}</p>
                                  <div className="mt-2 space-y-1">
                                    <p className="text-[10px] flex items-center gap-1.5 text-slate-500 font-medium">
                                      <Phone size={10} /> {member.phone}
                                    </p>
                                    <p className="text-[10px] flex items-center gap-1.5 text-slate-500 font-medium">
                                      <Mail size={10} /> {member.email}
                                    </p>
                                  </div>
                                </div>
                                {adminUser?.role === 'SuperAdmin' && (
                                  <button 
                                    onClick={() => setDeleteConfirm({ id: member.id, type: 'council-member' })}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all self-start"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {adminSubTab === 'users' && (
                    <div className="grid lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4">
                      <div className="lg:col-span-1">
                        <form onSubmit={editingAdmin ? updateAdminUser : addAdminUser} className="card p-6 space-y-4 sticky top-24">
                          <h3 className="font-bold flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              {editingAdmin ? <Pencil size={18} /> : <Plus size={18} />} 
                              {editingAdmin ? 'Edit Admin' : 'Add Admin User'}
                            </div>
                            {editingAdmin && (
                              <button type="button" onClick={() => setEditingAdmin(null)} className="text-xs text-red-500 hover:underline">Cancel</button>
                            )}
                          </h3>
                          <div className="space-y-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                              <input 
                                type="email" 
                                placeholder="example@gmail.com" 
                                required 
                                disabled={!!editingAdmin}
                                value={editingAdmin ? editingAdmin.email : newUser.email} 
                                onChange={e => editingAdmin ? setEditingAdmin({...editingAdmin, email: e.target.value}) : setNewUser({...newUser, email: e.target.value})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-50" 
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Access Role</label>
                              <select 
                                value={editingAdmin ? editingAdmin.role : newUser.role} 
                                onChange={e => editingAdmin ? setEditingAdmin({...editingAdmin, role: e.target.value as any}) : setNewUser({...newUser, role: e.target.value as any})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              >
                                <option value="Viewer">Viewer (Read Only)</option>
                                <option value="Editor">Editor (Manage Content)</option>
                                <option value="SuperAdmin">SuperAdmin (Full Control)</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Internal Note</label>
                              <input 
                                type="text" 
                                placeholder="e.g. Ward Secretary" 
                                value={editingAdmin ? editingAdmin.note : newUser.note} 
                                onChange={e => editingAdmin ? setEditingAdmin({...editingAdmin, note: e.target.value}) : setNewUser({...newUser, note: e.target.value})} 
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                              />
                            </div>
                          </div>
                          <button type="submit" className="w-full btn-primary py-3 flex items-center justify-center gap-2 shadow-lg">
                            {editingAdmin ? <CheckCircle2 size={18} /> : <UserPlus size={18} />}
                            {editingAdmin ? 'Update Access' : 'Whitelist User'}
                          </button>
                        </form>
                      </div>
                      <div className="lg:col-span-2 space-y-4">
                        <div className="card overflow-hidden">
                          <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                              <tr>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrator</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {adminUsers.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">No whitelisted administrators yet.</td>
                                </tr>
                              ) : (
                                adminUsers.map((user) => (
                                  <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                          <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                          <p className="text-sm font-bold text-slate-800">{user.email}</p>
                                          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-tight">{user.note || 'No notes'}</p>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                        user.role === 'SuperAdmin' ? 'bg-purple-100 text-purple-700' : 
                                        user.role === 'Editor' ? 'bg-emerald-100 text-emerald-700' : 
                                        'bg-slate-100 text-slate-700'
                                      }`}>
                                        {user.role}
                                      </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => setEditingAdmin(user)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                                          <Pencil size={16} />
                                        </button>
                                        <button 
                                          onClick={() => setDeleteConfirm({ id: user.id, type: 'user' })} 
                                          className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                                          disabled={user.email === 'hmonowar32@gmail.com'}
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
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
                    if (deleteConfirm.type === 'event') deleteEvent(deleteConfirm.id);
                    if (deleteConfirm.type === 'user') deleteAdminUser(deleteConfirm.id);
                    if (deleteConfirm.type === 'voter') deleteVoter(deleteConfirm.id);
                    if (deleteConfirm.type === 'council-member') deleteCouncilMember(deleteConfirm.id);
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

      {/* Edit News Modal */}
      <AnimatePresence>
        {editingNews && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingNews(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Pencil size={20} className="text-emerald-600" /> Edit News</h3>
              <form onSubmit={updateNews} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Title (EN)" required value={editingNews.title_en} onChange={e => setEditingNews({...editingNews, title_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                  <input type="text" placeholder="Title (BN)" required value={editingNews.title_bn} onChange={e => setEditingNews({...editingNews, title_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <textarea placeholder="Content (EN)" required rows={4} value={editingNews.content_en} onChange={e => setEditingNews({...editingNews, content_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                <textarea placeholder="Content (BN)" required rows={4} value={editingNews.content_bn} onChange={e => setEditingNews({...editingNews, content_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Update Image</label>
                  <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setEditingNews({...editingNews, image: val}))} className="text-xs" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 btn-primary py-3">Save Changes</button>
                  <button type="button" onClick={() => setEditingNews(null)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Gallery Modal */}
      <AnimatePresence>
        {editingGallery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingGallery(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Pencil size={20} className="text-emerald-600" /> Edit Gallery Item</h3>
              <form onSubmit={updateGallery} className="space-y-4">
                <input type="text" placeholder="Caption (EN)" required value={editingGallery.caption_en} onChange={e => setEditingGallery({...editingGallery, caption_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                <input type="text" placeholder="Caption (BN)" required value={editingGallery.caption_bn} onChange={e => setEditingGallery({...editingGallery, caption_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Update Image</label>
                  <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setEditingGallery({...editingGallery, image: val}))} className="text-xs" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 btn-primary py-3">Save Changes</button>
                  <button type="button" onClick={() => setEditingGallery(null)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Event Modal */}
      <AnimatePresence>
        {editingEvent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingEvent(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2"><Pencil size={20} className="text-emerald-600" /> Edit Event</h3>
              <form onSubmit={updateEvent} className="space-y-4 text-slate-800">
                <div className="grid grid-cols-2 gap-4">
                  <input type="text" placeholder="Title (EN)" required value={editingEvent.title_en} onChange={e => setEditingEvent({...editingEvent, title_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                  <input type="text" placeholder="Title (BN)" required value={editingEvent.title_bn} onChange={e => setEditingEvent({...editingEvent, title_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                </div>
                <textarea placeholder="Description (EN)" required rows={3} value={editingEvent.description_en} onChange={e => setEditingEvent({...editingEvent, description_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                <textarea placeholder="Description (BN)" required rows={3} value={editingEvent.description_bn} onChange={e => setEditingEvent({...editingEvent, description_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm"></textarea>
                <div className="grid grid-cols-1 gap-4">
                  <input type="date" required value={editingEvent.event_date} onChange={e => setEditingEvent({...editingEvent, event_date: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Location (EN)" required value={editingEvent.location_en} onChange={e => setEditingEvent({...editingEvent, location_en: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                    <input type="text" placeholder="Location (BN)" required value={editingEvent.location_bn} onChange={e => setEditingEvent({...editingEvent, location_bn: e.target.value})} className="w-full px-4 py-2 rounded-lg border border-slate-200 text-sm" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Update Image</label>
                  <input type="file" accept="image/*" onChange={e => handlePhotoUpload(e, (val) => setEditingEvent({...editingEvent, image: val}))} className="text-xs" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="flex-1 btn-primary py-3">Save Changes</button>
                  <button type="button" onClick={() => setEditingEvent(null)} className="flex-1 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancel</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {activeShareItem && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setActiveShareItem(null)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 max-w-sm w-full space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Share2 size={24} className="text-emerald-500" /> Share This
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'facebook', icon: Facebook, color: 'hover:bg-blue-50 text-blue-600', label: 'Facebook' },
                  { id: 'twitter', icon: Twitter, color: 'hover:bg-slate-50 text-slate-900', label: 'Twitter' },
                  { id: 'whatsapp', icon: MessageCircle, color: 'hover:bg-emerald-50 text-emerald-600', label: 'WhatsApp' }
                ].map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => handleSocialShare(platform.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300 ${platform.color}`}
                  >
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-xl shadow-sm"><platform.icon size={24} /></div>
                    <span className="text-[10px] font-black uppercase tracking-widest">{platform.label}</span>
                  </button>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                <button 
                  onClick={() => { navigator.clipboard.writeText(activeShareItem.url); showToast('Link copied!'); setActiveShareItem(null); }}
                  className="w-full py-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 hover:bg-slate-200"
                >
                  <Link2 size={18} /> Copy Direct Link
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 100, x: '-50%' }}
            animate={{ opacity: 1, y: -20, x: '-50%' }}
            exit={{ opacity: 0, y: 100, x: '-50%' }}
            className={`fixed bottom-0 left-1/2 z-[120] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md ${
              toast.type === 'success' ? 'bg-emerald-600/90 text-white' : 'bg-red-600/90 text-white'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span className="font-bold text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Citizen Support Chat */}
      <div className="fixed bottom-6 right-6 z-[100] no-print">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className={`absolute bottom-20 right-0 w-[350px] md:w-[400px] h-[500px] rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-emerald-500/20 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}
            >
              {/* Chat Header */}
              <div className="bg-emerald-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <h4 className="font-black text-sm">Citizen Support AI</h4>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Powered by Digital Union</p>
                  </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="hover:bg-white/20 p-2 rounded-xl transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-emerald-600 text-white' 
                        : (darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-900')
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isAiTyping && (
                   <div className="flex justify-start">
                    <div className={`p-4 rounded-2xl flex gap-1 ${darkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce sm:delay-150"></div>
                      <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce sm:delay-300"></div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Area */}
              <form onSubmit={handleSendMessage} className={`p-4 border-t ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    placeholder={lang === 'bn' ? 'আপনার প্রশ্ন লিখুন...' : 'Type your question...'}
                    className={`w-full pl-5 pr-12 py-4 rounded-2xl border-2 transition-all font-bold text-sm outline-none ${
                       darkMode 
                        ? 'bg-slate-800 border-slate-700 text-white focus:border-emerald-500' 
                        : 'bg-white border-slate-100 focus:border-emerald-500'
                    }`}
                  />
                  <button 
                    type="submit"
                    disabled={isAiTyping || !chatInput.trim()}
                    className="absolute right-2 top-2 bottom-2 w-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="bg-emerald-600 text-white p-4 rounded-2xl shadow-2xl flex items-center gap-3 transition-all font-black uppercase tracking-tighter"
        >
          {isChatOpen ? <X size={24} /> : <MessageSquare size={24} />}
          <span className="hidden md:inline">{lang === 'bn' ? 'নাগরিক সহায়তা' : 'Support Chat'}</span>
        </motion.button>
      </div>

      <footer className={`${darkMode ? 'bg-slate-900 border-t border-slate-800' : 'bg-slate-900'} text-slate-400 py-12 no-print`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <div className="flex justify-center gap-2 items-center mb-4">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">29</div>
            <span className="text-white font-bold">Ward 29 DNCC</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Ward 29, Mohammadpur. All rights reserved.</p>
          <div className="mt-2 text-[10px] uppercase font-black tracking-widest opacity-40">
            Developed by: <a href="https://facebook.com/@hmonowar32" target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400 transition-colors">Mohd Monowar Hossain</a>
          </div>
          <div className="flex justify-center gap-6 text-xs font-bold uppercase tracking-widest">
            <button onClick={() => setActiveTab('privacy')} className="hover:text-white transition-colors">{t.nav.privacy}</button>
            <button onClick={() => setActiveTab('terms')} className="hover:text-white transition-colors">{t.nav.terms}</button>
            <button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors">{t.nav.contact}</button>
            <button onClick={() => setActiveTab('councilMembers')} className="hover:text-white transition-colors">{t.nav.councilMembers}</button>
            <button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors">{t.nav.about}</button>
            <button onClick={() => setActiveTab('admin')} className="p-2 -m-2 opacity-20 hover:opacity-100 transition-opacity flex items-center gap-1 group">
              <ShieldCheck size={14} className="text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px]">{t.nav.admin}</span>
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-6 py-3 flex justify-between items-center z-50 no-print">
        <button 
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'home' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <Search size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </button>
        <button 
          onClick={() => setActiveTab('voterSlip')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'voterSlip' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <ShieldCheck size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Verify</span>
        </button>
        <button 
          onClick={() => setActiveTab('volunteer')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'volunteer' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <UserPlus size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Vol</span>
        </button>
        <button 
          onClick={() => setActiveTab('complaint')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'complaint' ? 'text-emerald-600' : 'text-slate-400'}`}
        >
          <MessageSquare size={20} />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Help</span>
        </button>
      </div>

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
