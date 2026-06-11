import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { sync } from '../utils/sync';
import DisplayScreen from './DisplayScreen';
import { 
  Plus, Trash2, Edit2, Settings, Users, FileText, Play, Image, 
  Globe, LogOut, ArrowUp, ArrowDown, RefreshCw, UserPlus, 
  Clock, CloudSun, Layout, Save, Eye, EyeOff, ClipboardList, CheckCircle2, AlertTriangle,
  Sun, Moon
} from 'lucide-react';

const Youtube = ({ size = 16, style, ...props }) => (
  <svg 
    viewBox="0 0 24 24" 
    width={size} 
    height={size} 
    stroke="currentColor" 
    strokeWidth="2" 
    fill="none" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    style={{ display: 'inline-block', verticalAlign: 'middle', ...style }}
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

const SAUDI_CITIES = [
  { name: 'الرياض', code: 'Riyadh', lat: 24.7136, lon: 46.6753 },
  { name: 'جدة', code: 'Jeddah', lat: 21.5433, lon: 39.1728 },
  { name: 'الدمام', code: 'Dammam', lat: 26.4207, lon: 50.0888 },
  { name: 'مكة المكرمة', code: 'Mecca', lat: 21.3891, lon: 39.8579 },
  { name: 'المدينة المنورة', code: 'Medina', lat: 24.4672, lon: 39.6111 },
  { name: 'أبها', code: 'Abha', lat: 18.2164, lon: 42.5053 },
  { name: 'تبوك', code: 'Tabuk', lat: 28.3998, lon: 36.5668 },
  { name: 'جيزان', code: 'Jizan', lat: 16.8892, lon: 42.5511 },
  { name: 'بريدة', code: 'Buraidah', lat: 26.3260, lon: 43.9750 },
  { name: 'حائل', code: 'Hail', lat: 27.5219, lon: 41.6907 }
];

const getRoleArabicName = (role) => {
  switch (role) {
    case 'owner': return 'المالك';
    case 'editor': return 'محرر';
    case 'specialist': return 'مختص';
    case 'hr': return 'الموارد البشرية';
    default: return role;
  }
};

export default function Dashboard({ currentUser, onLogout }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('dashboard_theme') || 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const [activeTab, setActiveTab] = useState('playlist'); // playlist, ticker, users, logs, settings
  const [playlist, setPlaylist] = useState([]);
  const [tickerItems, setTickerItems] = useState([]);
  const [users, setUsers] = useState([]);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState({});
  const [previewKey, setPreviewKey] = useState(0); // To force re-render preview
  
  // Playlist Form State
  const [mediaType, setMediaType] = useState('image'); // image, video, youtube, web
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [duration, setDuration] = useState(10); // in seconds
  const [scheduleType, setScheduleType] = useState('always'); // always, scheduled
  const [startDateTime, setStartDateTime] = useState('');
  const [endDateTime, setEndDateTime] = useState('');
  const [editingItemId, setEditingItemId] = useState(null);
  const fileInputRef = useRef(null);

  // Ticker Form State
  const [tickerText, setTickerText] = useState('');
  const [tickerSchedule, setTickerSchedule] = useState('always');
  const [tickerStart, setTickerStart] = useState('');
  const [tickerEnd, setTickerEnd] = useState('');
  const [editingTickerId, setEditingTickerId] = useState(null);

  // Users Form State
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [userRole, setUserRole] = useState('editor'); // editor, specialist, hr
  const [editingUser, setEditingUser] = useState(null); // User object being edited
  const [userError, setUserError] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);

  // Admin Profile Edit State
  const [adminUsername, setAdminUsername] = useState(currentUser.username);
  const [adminPassword, setAdminPassword] = useState(currentUser.password || '');
  const [adminError, setAdminError] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Settings State variables
  const [stationName, setStationName] = useState('');
  const [weatherCity, setWeatherCity] = useState('Riyadh');
  const [tickerSpeed, setTickerSpeed] = useState(15);
  const [layoutRotation, setLayoutRotation] = useState('90');
  const [stationLogo, setStationLogo] = useState(null);
  const [selectedLogoFile, setSelectedLogoFile] = useState(null);
  
  // Global message notifications
  const [notification, setNotification] = useState(null);

  // Live Preview Scaling State & Ref
  const [previewScale, setPreviewScale] = useState(0.25);
  const [previewHeight, setPreviewHeight] = useState(180);
  const previewWrapperRef = useRef(null);

  const updatePreviewScale = () => {
    if (!previewWrapperRef.current) return;
    const wrapperWidth = previewWrapperRef.current.offsetWidth || 320;
    const isRotated = layoutRotation === '90' || layoutRotation === '270';
    const logicalWidth = isRotated ? 720 : 1280;
    const logicalHeight = isRotated ? 1280 : 720;
    const scale = wrapperWidth / logicalWidth;
    setPreviewScale(scale);
    setPreviewHeight(logicalHeight * scale);
  };

  useEffect(() => {
    // Small timeout to allow DOM to layout and give accurate offsetWidth
    const timer = setTimeout(updatePreviewScale, 100);
    window.addEventListener('resize', updatePreviewScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePreviewScale);
    };
  }, [layoutRotation, playlist, activeTab]);

  // Load Initial Data
  useEffect(() => {
    loadData();
    
    // Subscribe to events that might come from display screen (like heartbeat or status updates, if any)
    const unsubscribe = sync.subscribe((message) => {
      console.log('Dashboard received sync event:', message);
      // If display screen requests data update or reports state
      if (message.type === 'DISPLAY_STARTED') {
        // Send current content package
        syncContent();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadData = async () => {
    try {
      const pl = await db.getPlaylist();
      const ti = await db.getTickerItems();
      const s = await db.getSettings();
      const l = await db.getLogs();
      
      setPlaylist(pl);
      setTickerItems(ti);
      setSettings(s);
      setLogs(l);

      // Set settings form fields
      setStationName(s.stationName || 'محطة جو ستيشن الرقمية');
      setWeatherCity(s.weatherCity || 'Riyadh');
      setTickerSpeed(s.tickerSpeed || 15);
      setLayoutRotation(s.layoutRotation || '90');
      setStationLogo(s.stationLogo || null);

      if (currentUser.role === 'owner') {
        const u = await db.getUsers();
        setUsers(u);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ text: message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Sync content with Display Screen
  const syncContent = () => {
    sync.broadcast('PLAYLIST_CHANGED', { timestamp: Date.now() });
    setPreviewKey(prev => prev + 1); // Refresh local preview
  };

  // File to Base64 helper
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      showNotification('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 25 ميغابايت', 'error');
      e.target.value = null;
      return;
    }

    setSelectedFile(file); // Save File object for cloud upload
    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result); // Keeps preview URL working
      if (!title) {
        setTitle(file.name.substring(0, file.name.lastIndexOf('.')) || file.name);
      }
    };
    reader.onerror = (error) => {
      console.error('Error reading file:', error);
      showNotification('فشل قراءة الملف', 'error');
    };
    reader.readAsDataURL(file);
  };

  // Add / Edit Playlist Item
  const handleSavePlaylistItem = async (e) => {
    e.preventDefault();

    if (mediaType === 'web' && !url) {
      showNotification('يرجى إدخال رابط صفحة الويب', 'error');
      return;
    }
    if (mediaType === 'youtube' && !url) {
      showNotification('يرجى إدخال رابط يوتيوب', 'error');
      return;
    }
    if ((mediaType === 'image' || mediaType === 'video') && !fileBase64 && !editingItemId) {
      showNotification('يرجى اختيار ملف للرفع', 'error');
      return;
    }

    try {
      let finalUrl = url;
      if ((mediaType === 'image' || mediaType === 'video') && selectedFile) {
        showNotification('جاري رفع الملف السحابي...', 'info');
        finalUrl = await db.uploadMedia(selectedFile);
      }

      const itemData = {
        type: mediaType,
        title: title || 'عنصر عرض جديد',
        duration: parseInt(duration) || 10,
        scheduleType,
        startDateTime: scheduleType === 'scheduled' ? startDateTime : null,
        endDateTime: scheduleType === 'scheduled' ? endDateTime : null,
        createdBy: currentUser.username,
        updatedBy: currentUser.username,
        updatedAt: new Date().toISOString()
      };

      if (editingItemId) {
        itemData.id = editingItemId;
        // Retain original creator and file if not uploaded new
        const originalItem = await db.getPlaylistItem(editingItemId);
        
        // Editor checks: Can only edit their own items unless Owner
        if (currentUser.role !== 'owner' && originalItem.createdBy !== currentUser.username) {
          showNotification('لا تملك الصلاحية لتعديل هذا العنصر', 'error');
          return;
        }

        itemData.createdBy = originalItem.createdBy;
        itemData.createdAt = originalItem.createdAt;
        itemData.order = originalItem.order;

        if (mediaType === 'image' || mediaType === 'video') {
          itemData.url = selectedFile ? finalUrl : originalItem.url;
        } else {
          itemData.url = url;
        }

        await db.savePlaylistItem(itemData);
        await db.addLog(currentUser.username, currentUser.role, 'EDIT', 'PLAYLIST', `تعديل العنصر: ${itemData.title}`);
        showNotification('تم تحديث العنصر بنجاح');
      } else {
        itemData.createdAt = new Date().toISOString();
        if (mediaType === 'image' || mediaType === 'video') {
          itemData.url = finalUrl;
        } else {
          itemData.url = url;
        }

        await db.savePlaylistItem(itemData);
        await db.addLog(currentUser.username, currentUser.role, 'ADD', 'PLAYLIST', `إضافة العنصر: ${itemData.title}`);
        showNotification('تم إضافة العنصر بنجاح');
      }

      // Reset Form
      resetPlaylistForm();
      loadData();
      syncContent();
    } catch (err) {
      console.error(err);
      showNotification('حدث خطأ أثناء حفظ العنصر', 'error');
    }
  };

  const resetPlaylistForm = () => {
    setTitle('');
    setUrl('');
    setFileBase64('');
    setSelectedFile(null); // Reset file selection state
    setDuration(10);
    setScheduleType('always');
    setStartDateTime('');
    setEndDateTime('');
    setEditingItemId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditPlaylistItem = (item) => {
    // Editor authorization check
    if (currentUser.role !== 'owner' && item.createdBy !== currentUser.username) {
      showNotification('يمكنك فقط تعديل العناصر التي قمت بإضافتها بنفسك', 'error');
      return;
    }

    setEditingItemId(item.id);
    setMediaType(item.type);
    setTitle(item.title);
    if (item.type === 'youtube' || item.type === 'web') {
      setUrl(item.url);
      setFileBase64('');
    } else {
      setUrl('');
      // We don't display the full base64 in form input, but store it in fileBase64 if updated.
      setFileBase64(''); 
    }
    setDuration(item.duration);
    setScheduleType(item.scheduleType || 'always');
    setStartDateTime(item.startDateTime || '');
    setEndDateTime(item.endDateTime || '');
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeletePlaylistItem = async (item) => {
    if (currentUser.role === 'specialist') {
      showNotification('لا تملك الصلاحية لحذف عناصر العرض', 'error');
      return;
    }
    // Editor authorization check
    if (currentUser.role !== 'owner' && item.createdBy !== currentUser.username) {
      showNotification('يمكنك فقط حذف العناصر التي قمت بإضافتها بنفسك', 'error');
      return;
    }

    if (!confirm(`هل أنت متأكد من حذف العنصر: ${item.title}؟`)) return;

    try {
      await db.deletePlaylistItem(item.id);
      await db.addLog(currentUser.username, currentUser.role, 'DELETE', 'PLAYLIST', `حذف العنصر: ${item.title}`);
      showNotification('تم حذف العنصر بنجاح');
      loadData();
      syncContent();
    } catch (err) {
      console.error(err);
      showNotification('فشل في حذف العنصر', 'error');
    }
  };

  // Reorder Items
  const handleMoveItem = async (index, direction) => {
    const newPlaylist = [...playlist];
    if (direction === 'up' && index > 0) {
      const temp = newPlaylist[index];
      newPlaylist[index] = newPlaylist[index - 1];
      newPlaylist[index - 1] = temp;
    } else if (direction === 'down' && index < newPlaylist.length - 1) {
      const temp = newPlaylist[index];
      newPlaylist[index] = newPlaylist[index + 1];
      newPlaylist[index + 1] = temp;
    } else {
      return;
    }

    try {
      await db.updatePlaylistOrder(newPlaylist);
      setPlaylist(newPlaylist);
      syncContent();
    } catch (err) {
      console.error(err);
      showNotification('فشل تعديل الترتيب', 'error');
    }
  };

  // Save Ticker Item
  const handleSaveTickerItem = async (e) => {
    e.preventDefault();
    if (!tickerText.trim()) return;

    try {
      const item = {
        text: tickerText,
        scheduleType: tickerSchedule,
        startDateTime: tickerSchedule === 'scheduled' ? tickerStart : null,
        endDateTime: tickerSchedule === 'scheduled' ? tickerEnd : null,
        createdBy: currentUser.username,
        createdAt: new Date().toISOString()
      };

      if (editingTickerId) {
        const original = await db.getTickerItems();
        const originalItem = original.find(i => i.id === editingTickerId);

        if (currentUser.role !== 'owner' && originalItem.createdBy !== currentUser.username) {
          showNotification('لا تملك الصلاحية لتعديل هذا الشريط الإخباري', 'error');
          return;
        }

        item.id = editingTickerId;
        item.createdBy = originalItem.createdBy;
        item.createdAt = originalItem.createdAt;

        await db.saveTickerItem(item);
        await db.addLog(currentUser.username, currentUser.role, 'EDIT', 'TICKER', `تعديل شريط إخباري: ${tickerText.substring(0, 30)}...`);
      } else {
        await db.saveTickerItem(item);
        await db.addLog(currentUser.username, currentUser.role, 'ADD', 'TICKER', `إضافة شريط إخباري جديد: ${tickerText.substring(0, 30)}...`);
      }

      setTickerText('');
      setTickerSchedule('always');
      setTickerStart('');
      setTickerEnd('');
      setEditingTickerId(null);
      loadData();
      syncContent();
      showNotification('تم حفظ الشريط الإخباري بنجاح');
    } catch (err) {
      console.error(err);
      showNotification('فشل حفظ الشريط الإخباري', 'error');
    }
  };

  const handleEditTicker = (item) => {
    if (currentUser.role !== 'owner' && item.createdBy !== currentUser.username) {
      showNotification('يمكنك فقط تعديل الأشرطة الإخبارية التي أضفتها بنفسك', 'error');
      return;
    }

    setEditingTickerId(item.id);
    setTickerText(item.text);
    setTickerSchedule(item.scheduleType || 'always');
    setTickerStart(item.startDateTime || '');
    setTickerEnd(item.endDateTime || '');
  };

  const handleDeleteTicker = async (item) => {
    if (currentUser.role === 'specialist') {
      showNotification('لا تملك الصلاحية لحذف الأخبار', 'error');
      return;
    }
    if (currentUser.role !== 'owner' && item.createdBy !== currentUser.username) {
      showNotification('يمكنك فقط حذف الأشرطة الإخبارية التي أضفتها بنفسك', 'error');
      return;
    }

    if (!confirm('هل تريد حذف هذا الخبر؟')) return;

    try {
      await db.deleteTickerItem(item.id);
      await db.addLog(currentUser.username, currentUser.role, 'DELETE', 'TICKER', `حذف خبر: ${item.text.substring(0, 30)}...`);
      loadData();
      syncContent();
      showNotification('تم حذف الخبر بنجاح');
    } catch (err) {
      console.error(err);
      showNotification('فشل حذف الخبر', 'error');
    }
  };

  // Settings Save
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (currentUser.role !== 'owner') {
      showNotification('المالك فقط يمكنه تعديل الإعدادات العامة', 'error');
      return;
    }

    try {
      let finalLogoUrl = stationLogo;
      if (selectedLogoFile) {
        showNotification('جاري رفع شعار المحطة سحابياً...', 'info');
        finalLogoUrl = await db.uploadMedia(selectedLogoFile);
      }

      await db.saveSetting('stationName', stationName);
      await db.saveSetting('weatherCity', weatherCity);
      await db.saveSetting('tickerSpeed', parseInt(tickerSpeed));
      await db.saveSetting('layoutRotation', layoutRotation);
      await db.saveSetting('stationLogo', finalLogoUrl);

      await db.addLog(currentUser.username, currentUser.role, 'SETTINGS', 'SETTINGS', 'تحديث الإعدادات العامة للنظام');
      showNotification('تم حفظ الإعدادات بنجاح');
      setSelectedLogoFile(null); // Reset logo file state
      loadData();
      syncContent();
    } catch (err) {
      console.error(err);
      showNotification('فشل حفظ الإعدادات', 'error');
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedLogoFile(file); // Save logo file for cloud upload

    const reader = new FileReader();
    reader.onload = () => {
      setStationLogo(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Users Management
  const handleSaveUser = async (e) => {
    e.preventDefault();
    setUserError('');

    if (!newUsername.trim() || !newPassword.trim()) {
      setUserError('جميع الحقول مطلوبة');
      return;
    }

    const targetUsername = newUsername.trim().toLowerCase();

    try {
      if (editingUser) {
        // Edit mode
        if (targetUsername !== editingUser.username) {
          const existing = await db.getUser(targetUsername);
          if (existing) {
            setUserError('اسم المستخدم الجديد مسجل مسبقاً');
            return;
          }
        }

        const updatedUser = {
          username: targetUsername,
          password: newPassword,
          role: userRole,
          createdBy: editingUser.createdBy,
          createdAt: editingUser.createdAt
        };

        await db.saveUser(updatedUser);

        if (targetUsername !== editingUser.username) {
          await db.deleteUser(editingUser.username);
        }

        await db.addLog(
          currentUser.username, 
          currentUser.role, 
          'EDIT', 
          'USER', 
          `تعديل حساب المستخدم: ${editingUser.username} (الاسم الجديد: ${targetUsername}، الدور: ${getRoleArabicName(userRole)})`
        );

        showNotification('تم تحديث حساب المستخدم بنجاح');
        setEditingUser(null);
      } else {
        // Add mode
        const existing = await db.getUser(targetUsername);
        if (existing) {
          setUserError('اسم المستخدم مسجل مسبقاً');
          return;
        }

        const newUser = {
          username: targetUsername,
          password: newPassword,
          role: userRole,
          createdBy: currentUser.username,
          createdAt: new Date().toISOString()
        };

        await db.saveUser(newUser);
        await db.addLog(currentUser.username, currentUser.role, 'ADD', 'USER', `إضافة مستخدم جديد: ${newUser.username} (الدور: ${getRoleArabicName(userRole)})`);
        showNotification('تم إضافة المستخدم بنجاح');
      }

      setNewUsername('');
      setNewPassword('');
      setUserRole('editor');
      loadData();
    } catch (err) {
      console.error(err);
      setUserError('حدث خطأ أثناء حفظ المستخدم: ' + (err.message || err));
    }
  };

  const handleStartEditUser = (user) => {
    setEditingUser(user);
    setNewUsername(user.username);
    setNewPassword(user.password || '');
    setUserRole(user.role || 'editor');
    setUserError('');
    // Scroll to top/form smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditUser = () => {
    setEditingUser(null);
    setNewUsername('');
    setNewPassword('');
    setUserRole('editor');
    setUserError('');
  };

  const handleDeleteUser = async (username) => {
    if (!confirm(`هل أنت متأكد من حذف الحساب: ${username}؟`)) return;

    try {
      await db.deleteUser(username);
      await db.addLog(currentUser.username, currentUser.role, 'DELETE', 'USER', `حذف حساب المستخدم: ${username}`);
      loadData();
      showNotification('تم حذف حساب المستخدم بنجاح');
      if (editingUser && editingUser.username === username) {
        handleCancelEditUser();
      }
    } catch (err) {
      console.error(err);
      showNotification('فشل حذف المستخدم', 'error');
    }
  };

  const handleUpdateAdminProfile = async (e) => {
    e.preventDefault();
    setAdminError('');

    const targetUsername = adminUsername.trim().toLowerCase();
    if (!targetUsername || !adminPassword.trim()) {
      setAdminError('جميع الحقول مطلوبة');
      return;
    }

    try {
      if (targetUsername !== currentUser.username) {
        const existing = await db.getUser(targetUsername);
        if (existing) {
          setAdminError('اسم المستخدم الجديد مسجل مسبقاً');
          return;
        }
      }

      const updatedAdmin = {
        username: targetUsername,
        password: adminPassword,
        role: 'owner',
        createdBy: currentUser.createdBy || 'system',
        createdAt: currentUser.createdAt || new Date().toISOString()
      };

      await db.saveUser(updatedAdmin);

      if (targetUsername !== currentUser.username) {
        await db.deleteUser(currentUser.username);
      }

      await db.addLog(targetUsername, 'owner', 'EDIT', 'USER', `تحديث بيانات حساب المدير (الاسم الجديد: ${targetUsername})`);

      showNotification('تم تحديث الحساب الشخصي بنجاح، جاري إعادة التحميل...');

      localStorage.setItem('go_station_user', JSON.stringify(updatedAdmin));

      setTimeout(() => {
        window.location.reload();
      }, 1500);

    } catch (err) {
      console.error(err);
      setAdminError('حدث خطأ أثناء تحديث الحساب الشخصي: ' + (err.message || err));
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('هل تريد مسح سجل العمليات بالكامل؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    try {
      await db.clearLogs();
      loadData();
      showNotification('تم مسح السجل بنجاح');
    } catch (err) {
      console.error(err);
      showNotification('فشل مسح السجل', 'error');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Top Header */}
      <header className="dashboard-header glass-card">
        <div className="header-brand">
          <Layout className="icon-glow" size={24} />
          <h2>Go Station <span className="badge">لوحة التحكم</span></h2>
        </div>
        
        <div className="header-actions">
          <button 
            onClick={toggleTheme} 
            className="btn-theme-toggle" 
            title={theme === 'dark' ? 'الوضع المضيء' : 'الوضع المظلم'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <div className="user-profile">
            <span className="user-avatar">{currentUser.username[0].toUpperCase()}</span>
            <div className="user-info">
              <span className="username">{currentUser.username}</span>
              <span className="role">{getRoleArabicName(currentUser.role)}</span>
            </div>
          </div>
          
          <button onClick={onLogout} className="btn-logout" title="تسجيل الخروج">
            <LogOut size={18} />
            <span>خروج</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="dashboard-container">
        
        {/* Left Side: Scaled Live Preview */}
        <section className="preview-section glass-card">
          <div className="section-title">
            <Eye size={18} />
            <h3>شاشة المعاينة المباشرة</h3>
            <button 
              onClick={() => setPreviewKey(k => k + 1)} 
              className="btn-icon" 
              title="إعادة تحميل المعاينة"
            >
              <RefreshCw size={14} />
            </button>
          </div>
          
          <div className="preview-container-wrapper" ref={previewWrapperRef} style={{ height: `${previewHeight}px` }}>
            <div 
              className="preview-viewport" 
              style={{
                width: (layoutRotation === '90' || layoutRotation === '270') ? '720px' : '1280px',
                height: (layoutRotation === '90' || layoutRotation === '270') ? '1280px' : '720px',
                transform: `scale(${previewScale})`,
                position: 'absolute',
                top: 0,
                left: 0
              }}
            >
              <DisplayScreen isPreview={true} key={previewKey} />
            </div>
          </div>
          <div className="preview-footer-note">
            <p>المعاينة تعكس شاشة العرض الحقيقية تماماً بالتزامن اللحظي</p>
            <a 
              href={`${window.location.origin}/display`} 
              target="_blank" 
              rel="noreferrer" 
              className="btn-secondary-link"
            >
              فتح شاشة العرض برابط مستقل ملء الشاشة ↗
            </a>
          </div>
        </section>

        {/* Right Side: Main Editing Space */}
        <main className="workspace-section">
          {notification && (
            <div className={`alert-banner alert-${notification.type} slide-in`}>
              {notification.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              <span>{notification.text}</span>
            </div>
          )}

          {/* Quick Statistics Grid */}
          <div className="dashboard-stats-grid">
            <div className="stat-card glass-card">
              <div className="stat-icon-wrapper playlist-stat">
                <Play size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">عناصر البث</span>
                <span className="stat-value">{playlist.length}</span>
              </div>
            </div>
            
            <div className="stat-card glass-card">
              <div className="stat-icon-wrapper weather-stat">
                <CloudSun size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">مدينة الطقس</span>
                <span className="stat-value">
                  {SAUDI_CITIES.find(c => c.code === settings.weatherCity)?.name || 'الرياض'}
                </span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-icon-wrapper speed-stat">
                <RefreshCw size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">سرعة الشريط</span>
                <span className="stat-value">{settings.tickerSpeed || 15} ثانية</span>
              </div>
            </div>

            <div className="stat-card glass-card">
              <div className="stat-icon-wrapper logs-stat">
                <FileText size={20} />
              </div>
              <div className="stat-content">
                <span className="stat-label">سجل العمليات</span>
                <span className="stat-value">{logs.length} سجل</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="workspace-tabs glass-card">
            <button 
              className={activeTab === 'playlist' ? 'tab-active' : ''} 
              onClick={() => setActiveTab('playlist')}
            >
              <Play size={16} />
              قائمة العرض
            </button>
            
            <button 
              className={activeTab === 'ticker' ? 'tab-active' : ''} 
              onClick={() => setActiveTab('ticker')}
            >
              <ClipboardList size={16} />
              الشريط الإخباري
            </button>
            
             {currentUser.role !== 'hr' && (
              <button 
                className={activeTab === 'logs' ? 'tab-active' : ''} 
                onClick={() => setActiveTab('logs')}
              >
                <FileText size={16} />
                سجل العمليات
              </button>
            )}

            {currentUser.role === 'owner' && (
              <button 
                className={activeTab === 'users' ? 'tab-active' : ''} 
                onClick={() => setActiveTab('users')}
              >
                <Users size={16} />
                إدارة المستخدمين
              </button>
            )}

            {currentUser.role === 'owner' && (
              <button 
                className={activeTab === 'settings' ? 'tab-active' : ''} 
                onClick={() => setActiveTab('settings')}
              >
                <Settings size={16} />
                الإعدادات العامة
              </button>
            )}
          </nav>

          {/* Tab Content Panel */}
          <div className="workspace-content glass-card">
            
            {/* 1. PLAYLIST TAB */}
            {activeTab === 'playlist' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h3>{editingItemId ? 'تعديل عنصر عرض' : 'إضافة عنصر جديد لقائمة العرض'}</h3>
                  {editingItemId && (
                    <button onClick={resetPlaylistForm} className="btn-secondary">إلغاء التعديل</button>
                  )}
                </div>

                <form onSubmit={handleSavePlaylistItem} className="content-form">
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>نوع الوسائط</label>
                      <select 
                        value={mediaType} 
                        onChange={(e) => {
                          setMediaType(e.target.value);
                          resetPlaylistForm();
                        }}
                        className="form-control"
                      >
                        <option value="image">صورة (محلية)</option>
                        <option value="video">فيديو (محلية)</option>
                        <option value="youtube">رابط يوتيوب YouTube</option>
                        <option value="web">رابط صفحة ويب كاملة Web Page</option>
                      </select>
                    </div>

                    <div className="form-group flex-2">
                      <label>عنوان العنصر (للتوضيح في لوحة التحكم)</label>
                      <input 
                        type="text" 
                        value={title} 
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="مثال: إعلان عروض الصيف"
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    {/* File Inputs for Local Media */}
                    {(mediaType === 'image' || mediaType === 'video') && (
                      <div className="form-group flex-2">
                        <label>اختر الملف {editingItemId && '(اتركه فارغاً للاحتفاظ بالملف الحالي)'}</label>
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept={mediaType === 'image' ? 'image/*' : 'video/*'}
                          className="form-control file-input"
                        />
                        <small className="help-text">الحد الأقصى للملف: 25 ميغابايت</small>
                      </div>
                    )}

                    {/* URL Input for Youtube & Web */}
                    {(mediaType === 'youtube' || mediaType === 'web') && (
                      <div className="form-group flex-2">
                        <label>{mediaType === 'youtube' ? 'رابط فيديو يوتيوب' : 'رابط صفحة الويب كامل'}</label>
                        <input 
                          type="url" 
                          value={url} 
                          onChange={(e) => setUrl(e.target.value)}
                          placeholder={mediaType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://example.com'}
                          className="form-control"
                          required
                        />
                      </div>
                    )}

                    <div className="form-group flex-1">
                      <label>مدة العرض (بالثواني)</label>
                      <input 
                        type="number" 
                        value={duration} 
                        onChange={(e) => setDuration(e.target.value)}
                        min="3"
                        max="86400"
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>جدولة العرض</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="scheduleType" 
                            value="always"
                            checked={scheduleType === 'always'} 
                            onChange={() => setScheduleType('always')}
                          />
                          تشغيل دائم
                        </label>
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="scheduleType" 
                            value="scheduled"
                            checked={scheduleType === 'scheduled'} 
                            onChange={() => setScheduleType('scheduled')}
                          />
                          فترة زمنية محددة
                        </label>
                      </div>
                    </div>

                    {scheduleType === 'scheduled' && (
                      <>
                        <div className="form-group flex-1">
                          <label>تاريخ ووقت البدء</label>
                          <input 
                            type="datetime-local" 
                            value={startDateTime} 
                            onChange={(e) => setStartDateTime(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group flex-1">
                          <label>تاريخ ووقت الانتهاء (حذف ذاتي)</label>
                          <input 
                            type="datetime-local" 
                            value={endDateTime} 
                            onChange={(e) => setEndDateTime(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save size={16} />
                    {editingItemId ? 'تحديث العنصر في الشاشة' : 'نشر وتحديث الشاشة'}
                  </button>
                </form>

                <hr className="divider" />

                <div className="pane-header">
                  <h3>قائمة العناصر الحالية ({playlist.length})</h3>
                  <small className="info-badge">يمكنك إعادة ترتيب العناصر باستخدام الأسهم</small>
                </div>

                <div className="playlist-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>الترتيب</th>
                        <th>العنوان</th>
                        <th>النوع</th>
                        <th>المدة</th>
                        <th>الحالة / الجدولة</th>
                        <th>المضاف بواسطة</th>
                        <th style={{ width: '150px' }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {playlist.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center">لا توجد عناصر عرض حالياً. قم بإضافة عناصر لعرضها.</td>
                        </tr>
                      ) : (
                        playlist.map((item, index) => {
                          const isExpired = item.scheduleType === 'scheduled' && new Date(item.endDateTime) < new Date();
                          const isNotStarted = item.scheduleType === 'scheduled' && new Date(item.startDateTime) > new Date();
                          const isActive = !isExpired && !isNotStarted;

                          return (
                            <tr key={item.id} className={isExpired ? 'row-expired' : ''}>
                              <td>
                                <div className="order-actions">
                                  <button 
                                    onClick={() => handleMoveItem(index, 'up')} 
                                    disabled={index === 0}
                                    className="btn-order"
                                    title="تحريك لأعلى"
                                  >
                                    <ArrowUp size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleMoveItem(index, 'down')} 
                                    disabled={index === playlist.length - 1}
                                    className="btn-order"
                                    title="تحريك لأسفل"
                                  >
                                    <ArrowDown size={14} />
                                  </button>
                                </div>
                              </td>
                              <td className="font-weight-bold">
                                <span className="table-item-title">{item.title}</span>
                              </td>
                              <td>
                                <span className="media-type-tag">
                                  {item.type === 'image' && <Image size={14} />}
                                  {item.type === 'video' && <Play size={14} />}
                                  {item.type === 'youtube' && <Youtube size={14} />}
                                  {item.type === 'web' && <Globe size={14} />}
                                  {item.type === 'image' && ' صورة'}
                                  {item.type === 'video' && ' فيديو'}
                                  {item.type === 'youtube' && ' يوتيوب'}
                                  {item.type === 'web' && ' صفحة ويب'}
                                </span>
                              </td>
                              <td>{item.duration} ثانية</td>
                              <td>
                                {item.scheduleType === 'always' ? (
                                  <span className="status-badge active">دائم</span>
                                ) : (
                                  <div className="schedule-detail">
                                    <span className={`status-badge ${isActive ? 'active' : isNotStarted ? 'waiting' : 'expired'}`}>
                                      {isActive && 'نشط'}
                                      {isNotStarted && 'مجدول لاحقاً'}
                                      {isExpired && 'منتهي'}
                                    </span>
                                    <span className="date-range-text">
                                      {new Date(item.startDateTime).toLocaleDateString('ar-SA')} - {new Date(item.endDateTime).toLocaleDateString('ar-SA')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td>
                                <span className="creator-text">
                                  {item.createdBy} {item.createdBy === currentUser.username && '(أنت)'}
                                </span>
                              </td>
                              <td>
                                <div className="actions-cell">
                                  <button 
                                    onClick={() => handleEditPlaylistItem(item)} 
                                    disabled={currentUser.role !== 'owner' && item.createdBy !== currentUser.username}
                                    className="btn-action btn-edit"
                                    title="تعديل"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeletePlaylistItem(item)} 
                                    disabled={currentUser.role === 'specialist' || (currentUser.role !== 'owner' && item.createdBy !== currentUser.username)}
                                    className="btn-action btn-delete"
                                    title={currentUser.role === 'specialist' ? "لا تملك صلاحية الحذف" : "حذف"}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 2. TICKER TAB */}
            {activeTab === 'ticker' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h3>{editingTickerId ? 'تعديل شريط إخباري' : 'إضافة خبر جديد للشريط المتحرك في الأسفل'}</h3>
                  {editingTickerId && (
                    <button onClick={() => {
                      setTickerText('');
                      setEditingTickerId(null);
                    }} className="btn-secondary">إلغاء التعديل</button>
                  )}
                </div>

                <form onSubmit={handleSaveTickerItem} className="content-form">
                  <div className="form-group">
                    <label>نص الخبر أو الرسالة</label>
                    <textarea 
                      value={tickerText} 
                      onChange={(e) => setTickerText(e.target.value)}
                      placeholder="اكتب هنا الرسالة التي ستظهر وتتحرك في أسفل شاشة العرض..."
                      rows="3"
                      className="form-control"
                      required
                    ></textarea>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>الجدولة الزمنية</label>
                      <div className="radio-group">
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="tickerSchedule" 
                            value="always"
                            checked={tickerSchedule === 'always'} 
                            onChange={() => setTickerSchedule('always')}
                          />
                          تشغيل دائم
                        </label>
                        <label className="radio-label">
                          <input 
                            type="radio" 
                            name="tickerSchedule" 
                            value="scheduled"
                            checked={tickerSchedule === 'scheduled'} 
                            onChange={() => setTickerSchedule('scheduled')}
                          />
                          فترة زمنية محددة
                        </label>
                      </div>
                    </div>

                    {tickerSchedule === 'scheduled' && (
                      <>
                        <div className="form-group flex-1">
                          <label>تاريخ البدء</label>
                          <input 
                            type="datetime-local" 
                            value={tickerStart} 
                            onChange={(e) => setTickerStart(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>

                        <div className="form-group flex-1">
                          <label>تاريخ الانتهاء</label>
                          <input 
                            type="datetime-local" 
                            value={tickerEnd} 
                            onChange={(e) => setTickerEnd(e.target.value)}
                            className="form-control"
                            required
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save size={16} />
                    {editingTickerId ? 'تحديث الخبر' : 'نشر الخبر وتحديث الشريط'}
                  </button>
                </form>

                <hr className="divider" />

                <h3>قائمة الأخبار الحالية ({tickerItems.length})</h3>

                <div className="playlist-table-wrapper">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>الخبر</th>
                        <th>الجدولة</th>
                        <th>بواسطة</th>
                        <th style={{ width: '120px' }}>إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tickerItems.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center">لا توجد أخبار مضافة حالياً.</td>
                        </tr>
                      ) : (
                        tickerItems.map(item => {
                          const isExpired = item.scheduleType === 'scheduled' && new Date(item.endDateTime) < new Date();
                          return (
                            <tr key={item.id} className={isExpired ? 'row-expired' : ''}>
                              <td className="ticker-text-cell">{item.text}</td>
                              <td>
                                {item.scheduleType === 'always' ? (
                                  <span className="status-badge active">دائم</span>
                                ) : (
                                  <div className="schedule-detail">
                                    <span className={`status-badge ${new Date(item.endDateTime) > new Date() ? 'active' : 'expired'}`}>
                                      {new Date(item.endDateTime) > new Date() ? 'نشط' : 'منتهي'}
                                    </span>
                                    <span className="date-range-text">
                                      ينتهي في: {new Date(item.endDateTime).toLocaleString('ar-SA')}
                                    </span>
                                  </div>
                                )}
                              </td>
                              <td>{item.createdBy}</td>
                              <td>
                                <div className="actions-cell">
                                  <button 
                                    onClick={() => handleEditTicker(item)} 
                                    disabled={currentUser.role !== 'owner' && item.createdBy !== currentUser.username}
                                    className="btn-action btn-edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTicker(item)} 
                                    disabled={currentUser.role === 'specialist' || (currentUser.role !== 'owner' && item.createdBy !== currentUser.username)}
                                    className="btn-action btn-delete"
                                    title={currentUser.role === 'specialist' ? "لا تملك صلاحية الحذف" : "حذف"}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. LOGS TAB */}
            {activeTab === 'logs' && currentUser.role !== 'hr' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h3>سجل عمليات المنصة (Activity Log)</h3>
                  {currentUser.role === 'owner' && (
                    <button onClick={handleClearLogs} className="btn-delete-all">
                      <Trash2 size={14} />
                      مسح السجل بالكامل
                    </button>
                  )}
                </div>

                <div className="playlist-table-wrapper">
                  <table className="custom-table logs-table">
                    <thead>
                      <tr>
                        <th>التاريخ والوقت</th>
                        <th>المستخدم</th>
                        <th>الصلاحية</th>
                        <th>العملية</th>
                        <th>نوع الكيان</th>
                        <th>التفاصيل</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center">السجل فارغ حالياً.</td>
                        </tr>
                      ) : (
                        logs.map(log => (
                          <tr key={log.id}>
                            <td className="log-time">{new Date(log.timestamp).toLocaleString('ar-SA')}</td>
                            <td className="font-weight-bold">{log.username}</td>
                            <td>
                              <span className={`role-badge ${log.role}`}>
                                {getRoleArabicName(log.role)}
                              </span>
                            </td>
                            <td>
                              <span className={`action-badge ${log.actionType}`}>
                                {log.actionType === 'ADD' && 'إضافة'}
                                {log.actionType === 'EDIT' && 'تعديل'}
                                {log.actionType === 'DELETE' && 'حذف'}
                                {log.actionType === 'SETTINGS' && 'إعدادات'}
                                {log.actionType === 'LOGIN' && 'دخول'}
                              </span>
                            </td>
                            <td>
                              {log.entityType === 'PLAYLIST' && 'قائمة العرض'}
                              {log.entityType === 'TICKER' && 'الشريط الإخباري'}
                              {log.entityType === 'SETTINGS' && 'الإعدادات العامة'}
                              {log.entityType === 'USER' && 'حسابات المحررين'}
                            </td>
                            <td className="log-details">{log.details}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. USERS MANAGEMENT TAB (Owner Only) */}
            {activeTab === 'users' && currentUser.role === 'owner' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h3>إدارة المستخدمين وصلاحيات الوصول</h3>
                </div>

                <div className="users-tab-layout">
                  <div className="users-forms-column">
                    {/* Admin Profile Form */}
                    <form onSubmit={handleUpdateAdminProfile} className="content-form user-form-box">
                      <h4>تعديل الحساب الشخصي (المدير)</h4>
                      {adminError && <div className="form-error-banner"><AlertTriangle size={14} /> {adminError}</div>}
                      
                      <div className="form-group">
                        <label>اسم المستخدم للمدير</label>
                        <input 
                          type="text" 
                          value={adminUsername} 
                          onChange={(e) => setAdminUsername(e.target.value)}
                          placeholder="أدخل اسم المستخدم الجديد"
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>كلمة المرور للمدير</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showAdminPassword ? "text" : "password"} 
                            value={adminPassword} 
                            onChange={(e) => setAdminPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور الجديدة"
                            className="form-control"
                            style={{ paddingLeft: '45px' }}
                            required
                          />
                          <button 
                            type="button"
                            onClick={() => setShowAdminPassword(!showAdminPassword)}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px'
                            }}
                            title={showAdminPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                          >
                            {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <button type="submit" className="btn-primary full-width">
                        <Save size={16} />
                        حفظ بيانات المدير الشخصية
                      </button>
                    </form>

                    {/* Manage Users Form */}
                    <form onSubmit={handleSaveUser} className="content-form user-form-box">
                      <h4>{editingUser ? 'تعديل حساب مستخدم' : 'إضافة حساب مستخدم جديد'}</h4>
                      {userError && <div className="form-error-banner"><AlertTriangle size={14} /> {userError}</div>}
                      
                      <div className="form-group">
                        <label>اسم المستخدم</label>
                        <input 
                          type="text" 
                          value={newUsername} 
                          onChange={(e) => setNewUsername(e.target.value)}
                          placeholder="أدخل اسم مستخدم فريد"
                          className="form-control"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>كلمة المرور</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type={showUserPassword ? "text" : "password"} 
                            value={newPassword} 
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="أدخل كلمة المرور"
                            className="form-control"
                            style={{ paddingLeft: '45px' }}
                            required
                          />
                          <button 
                            type="button"
                            onClick={() => setShowUserPassword(!showUserPassword)}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              background: 'none',
                              border: 'none',
                              color: 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              padding: '5px'
                            }}
                            title={showUserPassword ? "إخفاء كلمة المرور" : "عرض كلمة المرور"}
                          >
                            {showUserPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>

                      <div className="form-group">
                        <label>صلاحية الحساب (الدور)</label>
                        <select 
                          value={userRole} 
                          onChange={(e) => setUserRole(e.target.value)}
                          className="form-control"
                        >
                          <option value="editor">محرر (صلاحيات كاملة عدا الحسابات والإعدادات)</option>
                          <option value="specialist">المختص (إضافة وتعديل البث والشريط + سجل العمليات)</option>
                          <option value="hr">الموارد البشرية (إضافة وتعديل وحذف البث والشريط فقط)</option>
                        </select>
                      </div>

                      <div className="form-buttons-row" style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                          {editingUser ? <Save size={16} /> : <UserPlus size={16} />}
                          {editingUser ? 'تحديث الحساب' : 'إنشاء الحساب'}
                        </button>
                        {editingUser && (
                          <button type="button" onClick={handleCancelEditUser} className="btn-secondary">
                            إلغاء
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  <div className="users-list-box">
                    <h4>قائمة الحسابات المسجلة ({users.filter(u => u.username !== currentUser.username).length})</h4>
                    <ul className="users-list-ul">
                      {users.filter(u => u.username !== currentUser.username).length === 0 ? (
                        <li className="no-users">لا يوجد مستخدمون مسجلون حالياً.</li>
                      ) : (
                        users.filter(u => u.username !== currentUser.username).map(user => (
                          <li key={user.username} className="user-list-item">
                            <div className="user-item-meta">
                              <div className="user-name-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span className="user-item-name" style={{ fontWeight: '700' }}>{user.username}</span>
                                <span className={`user-role-badge ${user.role}`}>
                                  {getRoleArabicName(user.role)}
                                </span>
                              </div>
                              <span className="user-item-date">أنشئ بواسطة {user.createdBy} في {new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
                            </div>
                            <div className="user-actions" style={{ display: 'flex', gap: '6px' }}>
                              <button 
                                type="button"
                                onClick={() => handleStartEditUser(user)}
                                className="btn-edit-user"
                                title="تعديل الحساب"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleDeleteUser(user.username)}
                                className="btn-delete-user"
                                title="حذف الحساب"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 5. SETTINGS TAB (Owner Only) */}
            {activeTab === 'settings' && currentUser.role === 'owner' && (
              <div className="tab-pane">
                <div className="pane-header">
                  <h3>الإعدادات العامة لشاشات العرض</h3>
                </div>

                <form onSubmit={handleSaveSettings} className="content-form">
                  <div className="form-row">
                    <div className="form-group flex-2">
                      <label>اسم الجهة أو المحطة</label>
                      <input 
                        type="text" 
                        value={stationName} 
                        onChange={(e) => setStationName(e.target.value)}
                        className="form-control"
                        required
                      />
                    </div>

                    <div className="form-group flex-1">
                      <label>مدينة الطقس (المملكة العربية السعودية)</label>
                      <select 
                        value={weatherCity} 
                        onChange={(e) => setWeatherCity(e.target.value)}
                        className="form-control"
                      >
                        {SAUDI_CITIES.map(city => (
                          <option key={city.code} value={city.code}>{city.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>تأثير دوران الشاشة</label>
                      <select 
                        value={layoutRotation} 
                        onChange={(e) => setLayoutRotation(e.target.value)}
                        className="form-control"
                      >
                        <option value="0">شاشة عرضية (أفقية 0°)</option>
                        <option value="90">شاشة طولية إعلانية (عمودية 90°)</option>
                        <option value="180">شاشة عرضية مقلوبة (أفقية 180°)</option>
                        <option value="270">شاشة طولية مقلوبة (عمودية 270°)</option>
                      </select>
                      <small className="help-text">عند اختيار الدوران، سيتم قلب وتوجيه المحتوى ليتطابق مع اتجاه الشاشة الفيزيائي.</small>
                    </div>

                    <div className="form-group flex-1">
                      <label>سرعة الشريط المتحرك (بالثواني لدورة كاملة)</label>
                      <input 
                        type="number" 
                        value={tickerSpeed} 
                        onChange={(e) => setTickerSpeed(e.target.value)}
                        min="5" 
                        max="60"
                        className="form-control"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>شعار الجهة (Logo)</label>
                    <div className="logo-upload-wrapper">
                      {stationLogo && (
                        <div className="logo-preview-box">
                          <img src={stationLogo} alt="Station Logo" />
                          <button 
                            type="button" 
                            onClick={() => setStationLogo(null)}
                            className="btn-remove-logo"
                          >
                            حذف
                          </button>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoUpload}
                        className="form-control file-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary">
                    <Save size={16} />
                    حفظ وتطبيق الإعدادات فوراً
                  </button>
                </form>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
}
