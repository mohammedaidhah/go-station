import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { sync } from '../utils/sync';
import { 
  Sun, Cloud, CloudSun, CloudRain, CloudSnow, CloudLightning, 
  Wind, Clock, HelpCircle, Loader2, AlertCircle, Maximize2 
} from 'lucide-react';

// Custom Colored Weather SVG Icons matching the mockup design
const ColoredSun = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <circle cx="12" cy="12" r="5" fill="#ffd54f" stroke="#ffb300" strokeWidth="1.5" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" stroke="#ffb300" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ColoredCloudSun = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <circle cx="16" cy="10" r="3.5" fill="#ffd54f" stroke="#ffb300" strokeWidth="1.2" />
    <path d="M16 4v1.5M16 14.5v1.5M20.24 5.76l-1.06 1.06M12.82 11.18l-1.06 1.06M21 10h-1.5M13.5 10H12M19.18 13.18l1.06 1.06M11.76 5.76l1.06 1.06" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 18a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 20H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const ColoredCloud = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <path d="M5 18a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 20H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

const ColoredCloudRain = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <path d="M5 16a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 18H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 19v3M12 19v3M16 19v3" stroke="#29b6f6" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ColoredCloudSnow = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <path d="M5 16a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 18H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
    <circle cx="8" cy="20" r="1.2" fill="#80deea" />
    <circle cx="12" cy="21" r="1.2" fill="#80deea" />
    <circle cx="16" cy="20" r="1.2" fill="#80deea" />
  </svg>
);

const ColoredCloudLightning = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <path d="M5 16a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 18H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13 18l-3 3.5h3L11 25" stroke="#ffd54f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#ffd54f" />
  </svg>
);

const ColoredCloudSunRain = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <circle cx="16" cy="10" r="3.5" fill="#ffd54f" stroke="#ffb300" strokeWidth="1.2" />
    <path d="M16 4v1.5M16 14.5v1.5M20.24 5.76l-1.06 1.06M12.82 11.18l-1.06 1.06M21 10h-1.5M13.5 10H12M19.18 13.18l1.06 1.06M11.76 5.76l1.06 1.06" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 16a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 18H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M8 19v3M12 19v3M16 19v3" stroke="#29b6f6" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const ColoredCloudSunLightning = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className="forecast-icon">
    <circle cx="16" cy="10" r="3.5" fill="#ffd54f" stroke="#ffb300" strokeWidth="1.2" />
    <path d="M16 4v1.5M16 14.5v1.5M20.24 5.76l-1.06 1.06M12.82 11.18l-1.06 1.06M21 10h-1.5M13.5 10H12M19.18 13.18l1.06 1.06M11.76 5.76l1.06 1.06" stroke="#ffb300" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 16a4 4 0 0 1 0-8 4.3 4.3 0 0 1 1 .1 5 5 0 0 1 9.4 2.4A4 4 0 0 1 15 18H6a4 4 0 0 1-1-2z" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" strokeLinejoin="round" />
    <path d="M13 18l-3 3.5h3L11 25" stroke="#ffd54f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="#ffd54f" />
  </svg>
);

const CITIES_COORDINATES = {
  Riyadh: { name: 'الرياض', lat: 24.7136, lon: 46.6753 },
  Jeddah: { name: 'جدة', lat: 21.5433, lon: 39.1728 },
  Dammam: { name: 'الدمام', lat: 26.4207, lon: 50.0888 },
  Mecca: { name: 'مكة المكرمة', lat: 21.3891, lon: 39.8579 },
  Medina: { name: 'المدينة المنورة', lat: 24.4672, lon: 39.6111 },
  Abha: { name: 'أبها', lat: 18.2164, lon: 42.5053 },
  Tabuk: { name: 'تبوك', lat: 28.3998, lon: 36.5668 },
  Jizan: { name: 'جيزان', lat: 16.8892, lon: 42.5511 },
  Buraidah: { name: 'بريدة', lat: 26.3260, lon: 43.9750 },
  Hail: { name: 'حائل', lat: 27.5219, lon: 41.6907 }
};

// Weather code formatter
function getWeatherDetails(code) {
  if (code === 0) return { text: 'مشمس صافٍ', Icon: ColoredSun, type: 'sunny' };
  if ([1, 2, 3].includes(code)) return { text: 'غائم جزئياً', Icon: ColoredCloudSun, type: 'cloudy' };
  if ([45, 48].includes(code)) return { text: 'ضباب', Icon: ColoredCloud, type: 'foggy' };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67].includes(code)) return { text: 'أمطار', Icon: ColoredCloudRain, type: 'rainy' };
  if ([80, 81, 82].includes(code)) return { text: 'زخات مطر', Icon: ColoredCloudSunRain, type: 'rainy' };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'ثلوج', Icon: ColoredCloudSnow, type: 'snowy' };
  if ([95].includes(code)) return { text: 'عاصفة رعدية', Icon: ColoredCloudSunLightning, type: 'stormy' };
  if ([96, 99].includes(code)) return { text: 'عاصفة رعدية شديدة', Icon: ColoredCloudLightning, type: 'stormy' };
  return { text: 'معتدل', Icon: ColoredSun, type: 'sunny' };
}

// Station name formatter
function renderStationName(name) {
  if (!name) return 'محطة جو ستيشن الرقمية';
  
  if (name.includes('\n') || name.includes('|')) {
    const parts = name.includes('\n') ? name.split('\n') : name.split('|');
    return (
      <>
        <span className="station-title-main">{parts[0].trim()}</span>
        {parts.slice(1).map((part, index) => (
          <span key={index} className="station-subtitle">{part.trim()}</span>
        ))}
      </>
    );
  }
  
  if (name.includes('شركة هلا السعودية للخدمات البترولية')) {
    return (
      <>
        <span className="station-title-main">شركة هلا السعودية</span>
        <span className="station-subtitle">للخدمات البترولية</span>
      </>
    );
  }
  
  if (name.includes('للخدمات البترولية')) {
    const parts = name.split('للخدمات البترولية');
    return (
      <>
        <span className="station-title-main">{parts[0].trim()}</span>
        <span className="station-subtitle">للخدمات البترولية {parts[1] || ''}</span>
      </>
    );
  }
  
  return name;
}

// Youtube parser
function getYouTubeId(url) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

// Check if two playlists are identical to prevent unnecessary state resets
function arePlaylistsEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (
      arr1[i].id !== arr2[i].id || 
      arr1[i].url !== arr2[i].url || 
      arr1[i].duration !== arr2[i].duration || 
      arr1[i].order !== arr2[i].order ||
      arr1[i].title !== arr2[i].title
    ) {
      return false;
    }
  }
  return true;
}

function areTickerItemsEqual(arr1, arr2) {
  if (arr1.length !== arr2.length) return false;
  for (let i = 0; i < arr1.length; i++) {
    if (arr1[i].id !== arr2[i].id || arr1[i].text !== arr2[i].text) {
      return false;
    }
  }
  return true;
}

export default function DisplayScreen({ isPreview = false }) {
  const [playlist, setPlaylist] = useState([]);
  const [tickerItems, setTickerItems] = useState([]);
  const [settings, setSettings] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [weeklyForecast, setWeeklyForecast] = useState([]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };
  
  // Weather state
  const [weather, setWeather] = useState({ temp: '--', text: 'جاري جلب الطقس...', Icon: Sun, type: 'sunny' });
  
  // Clock state
  const [currentTime, setCurrentTime] = useState('');
  const [currentDate, setCurrentDate] = useState('');

  // Refs for tracking timer
  const timerRef = useRef(null);
  const videoRef = useRef(null);
  const durationTotalRef = useRef(10);

  // Load initial content
  useEffect(() => {
    loadContent();

    // Notify dashboard that display screen is running (triggers initial sync broadcast if opened)
    if (!isPreview) {
      sync.broadcast('DISPLAY_STARTED');
    }

    // Subscribe to real-time synchronization updates
    const unsubscribe = sync.subscribe((message) => {
      console.log('[Display] Received message:', message.type);
      if (['PLAYLIST_CHANGED', 'SETTINGS_CHANGED', 'TICKER_CHANGED'].includes(message.type)) {
        loadContent();
      }
    });

    // Clock Interval
    const clockInterval = setInterval(updateClock, 1000);
    updateClock();

    // Cleanup
    return () => {
      unsubscribe();
      clearInterval(clockInterval);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPreview]);

  // Weather Fetch Loop
  useEffect(() => {
    const cityName = settings.weatherCity || 'Riyadh';
    fetchWeather(cityName);
    const weatherInterval = setInterval(() => {
      fetchWeather(cityName);
    }, 15 * 60 * 1000); // 15 mins

    return () => clearInterval(weatherInterval);
  }, [settings.weatherCity]);

  // 1. Initialize slide duration and settings when active item changes
  useEffect(() => {
    if (playlist.length === 0) return;
    const currentItem = playlist[currentIndex];
    if (currentItem) {
      const itemDuration = currentItem.duration || 10;
      durationTotalRef.current = itemDuration;
      setTimeRemaining(itemDuration);
      
      // Handle local video autoplay
      if (currentItem.type === 'video' && videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(e => console.log('Video autoplay blocked:', e));
      }
    }
  }, [playlist, currentIndex]);

  // 2. Ticking timer to count down slide time
  useEffect(() => {
    if (playlist.length <= 1) return;

    const tickInterval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(tickInterval);
  }, [playlist, currentIndex]);

  // 3. Transition to next slide when timer hits 0
  useEffect(() => {
    if (playlist.length <= 1) return;
    if (timeRemaining === 0) {
      nextSlide();
    }
  }, [timeRemaining, playlist.length]);

  const loadContent = async () => {
    try {
      const pl = await db.getPlaylist();
      const ti = await db.getTickerItems();
      const s = await db.getSettings();

      setSettings(s);
      
      // Filter out expired and un-started scheduled items
      const now = new Date();
      
      const activePlaylist = pl.filter(item => {
        if (item.scheduleType === 'always') return true;
        const start = new Date(item.startDateTime);
        const end = new Date(item.endDateTime);
        return now >= start && now <= end;
      });

      const activeTicker = ti.filter(item => {
        if (item.scheduleType === 'always') return true;
        const start = new Date(item.startDateTime);
        const end = new Date(item.endDateTime);
        return now >= start && now <= end;
      });

      setPlaylist(prev => {
        if (arePlaylistsEqual(prev, activePlaylist)) {
          return prev;
        }
        return activePlaylist;
      });
      setTickerItems(prev => {
        if (areTickerItemsEqual(prev, activeTicker)) {
          return prev;
        }
        return activeTicker;
      });

      // Adjust index if out of bounds
      if (currentIndex >= activePlaylist.length) {
        setCurrentIndex(0);
      }
    } catch (err) {
      console.error('Error loading content for display screen:', err);
    }
  };

  // Periodic check to remove expired items in the background
  useEffect(() => {
    const expiryChecker = setInterval(() => {
      // Re-run filter on schedule
      loadContent();
    }, 5000); // Check every 5s

    return () => clearInterval(expiryChecker);
  }, [playlist, currentIndex]);

  const updateClock = () => {
    const now = new Date();
    
    // Arabic day name
    const dayName = now.toLocaleDateString('ar-SA-u-nu-latn', { calendar: 'gregory', weekday: 'long' })
      .replace('أ', 'ا')
      .replace('إ', 'ا');
      
    // Arabic month name
    const monthName = now.toLocaleDateString('ar-SA-u-nu-latn', { calendar: 'gregory', month: 'long' });
    
    // Day number
    const dayNum = now.toLocaleDateString('ar-SA-u-nu-latn', { calendar: 'gregory', day: 'numeric' });
    
    // Year number
    const yearNum = now.toLocaleDateString('ar-SA-u-nu-latn', { calendar: 'gregory', year: 'numeric' });
    
    const dateStr = `${dayName} - ${dayNum} ${monthName} ${yearNum} م`;
    
    // Format Time: 12-hour format HH:MM:SS in Latin digits
    let hours = now.getHours();
    hours = hours % 12;
    hours = hours ? hours : 12; // '0' should be '12'
    const hrs = String(hours).padStart(2, '0');
    const mins = String(now.getMinutes()).padStart(2, '0');
    const secs = String(now.getSeconds()).padStart(2, '0');
    const timeStr = `${hrs}:${mins}:${secs}`;
    
    setCurrentTime(timeStr);
    setCurrentDate(dateStr);
  };

  const fetchWeather = async (cityName) => {
    const coords = CITIES_COORDINATES[cityName] || CITIES_COORDINATES.Riyadh;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true&daily=weathercode&timezone=auto`
      );
      if (!res.ok) throw new Error('Weather fetch failed');
      const data = await res.json();
      
      if (data && data.current_weather) {
        const temp = Math.round(data.current_weather.temperature);
        const code = data.current_weather.weathercode;
        const details = getWeatherDetails(code);
        setWeather({
          temp: `${temp}°`,
          text: `${coords.name} : ${details.text}`,
          Icon: details.Icon,
          type: details.type
        });
      }

      if (data && data.daily) {
        const times = data.daily.time;
        const codes = data.daily.weathercode;
        
        const ARABIC_WEEKDAYS = {
          6: 'السبت',
          0: 'الأحد',
          1: 'الأثنين',
          2: 'الثلاثاء',
          3: 'الاربعاء',
          4: 'الخميس',
          5: 'الجمعة'
        };

        const DAY_ORDER = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
        const todayString = new Date().toDateString();

        const forecastDays = times.map((timeStr, idx) => {
          const parts = timeStr.split('-');
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          const dayOfWeek = dateObj.getDay();
          const code = codes[idx];
          const details = getWeatherDetails(code);
          const isToday = dateObj.toDateString() === todayString;

          return {
            name: ARABIC_WEEKDAYS[dayOfWeek],
            dayOfWeek,
            Icon: details.Icon,
            isToday
          };
        });

        // Sort Saturday to Friday
        forecastDays.sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]);
        setWeeklyForecast(forecastDays);
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeather(prev => ({ ...prev, text: `${coords.name} : الطقس غير متاح`, type: 'sunny' }));
      
      // Fallback forecast
      const ARABIC_WEEKDAYS = {
        6: 'السبت',
        0: 'الأحد',
        1: 'الأثنين',
        2: 'الثلاثاء',
        3: 'الاربعاء',
        4: 'الخميس',
        5: 'الجمعة'
      };
      
      const fallbackIcons = {
        6: ColoredCloudSun,           // Saturday
        0: ColoredCloudSunRain,       // Sunday
        1: ColoredCloudSunLightning,  // Monday
        2: ColoredCloudRain,          // Tuesday
        3: ColoredSun,                // Wednesday
        4: ColoredCloudSunLightning,  // Thursday
        5: ColoredSun                 // Friday
      };

      const DAY_ORDER = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
      const today = new Date();
      const fallbackDays = [];
      const daysSinceSat = (today.getDay() + 1) % 7;
      const saturdayDate = new Date(today);
      saturdayDate.setDate(today.getDate() - daysSinceSat);

      for (let i = 0; i < 7; i++) {
        const d = new Date(saturdayDate);
        d.setDate(saturdayDate.getDate() + i);
        const dayOfWeek = d.getDay();
        fallbackDays.push({
          name: ARABIC_WEEKDAYS[dayOfWeek],
          dayOfWeek,
          Icon: fallbackIcons[dayOfWeek] || ColoredSun,
          isToday: d.toDateString() === today.toDateString()
        });
      }
      fallbackDays.sort((a, b) => DAY_ORDER[a.dayOfWeek] - DAY_ORDER[b.dayOfWeek]);
      setWeeklyForecast(fallbackDays);
    }
  };

  const nextSlide = () => {
    if (playlist.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const handleVideoEnded = () => {
    if (playlist.length > 1) {
      nextSlide();
    }
  };

  // Helper to compile ticker messages
  const getTickerText = () => {
    if (tickerItems.length === 0) {
      return 'أهلاً بكم في مقر قوستيشن الرئيسي - يسعدنا أن نقدم لكم أفضل الخدمات البترولية المتكاملة...';
    }
    return tickerItems.map(item => item.text).join('   |   🚀   |   ');
  };

  const currentItem = playlist[currentIndex];
  const WeatherIcon = weather.Icon;
  const rotationClass = settings.layoutRotation === '90' ? 'display-rotated-90' : '';

  return (
    <div className={`display-screen-container ${rotationClass} ${isPreview ? 'in-preview' : ''}`}>
      {/* Top Banner (Header) */}
      <header className={`display-header weather-bg-${weather.type || 'sunny'}`}>
        <div className="header-top-row">
          {/* Left Side: Date, Time, Temp stacked */}
          <div className="display-info-stack">
            <div className="display-date-row">{currentDate}</div>
            <div className="display-time-row">{currentTime}</div>
            <div className="display-weather-row">
              <span className="weather-temp-val">{weather.temp}</span>
              <div className="weather-icon-wrapper">
                <WeatherIcon size={56} className="weather-icon-glow" />
              </div>
            </div>
          </div>

          {/* Right Side: White Logo */}
          <div className="display-logo-area">
            {settings.stationLogo ? (
              <img src={settings.stationLogo} alt="Logo" className="display-logo-img" />
            ) : (
              <img 
                src="https://res.cloudinary.com/dca2x8jje/image/upload/v1780922392/logo_gostation_WHITE_ksopeg.png" 
                alt="Logo" 
                className="display-logo-img" 
              />
            )}
          </div>
        </div>

        {/* Weekly Weather Forecast Bar */}
        <div className="display-forecast-bar">
          {weeklyForecast.map((day, idx) => {
            const DayIcon = day.Icon;
            return (
              <div 
                key={idx} 
                className={`forecast-day-col ${day.isToday ? 'is-today' : ''}`}
              >
                {day.isToday && <div className="today-arrow">▼</div>}
                <div className="forecast-icon-box">
                  <DayIcon size={28} className="forecast-icon" />
                </div>
                <span className="forecast-day-name">{day.name}</span>
              </div>
            );
          })}
        </div>
      </header>

      {/* Main Body (Slide Content) */}
      <main className="display-main-content">
        {playlist.length === 0 ? (
          /* Fallback Screen Saver */
          <div className="display-fallback-screen glass-element">
            <div className="fallback-glow-logo">Go Station</div>
            <h2>جاهز للبث والعرض الرقمي</h2>
            <p>يرجى إضافة صور، مقاطع فيديو أو روابط من لوحة التحكم لعرضها هنا</p>
            <div className="loader-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        ) : (
          /* Active Content Viewer */
          <div className="display-content-viewer">
            
            {/* Visual Progress Bar (counts down remaining time) */}
            {playlist.length > 1 && (
              <div className="display-progress-container">
                <div 
                  className="display-progress-bar"
                  style={{ 
                    width: `${(timeRemaining / durationTotalRef.current) * 100}%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
            )}

            {/* Media Rendering Switch */}
            {currentItem.type === 'image' && (
              <div className="media-frame image-frame">
                <img 
                  src={currentItem.url} 
                  alt={currentItem.title} 
                  className="media-fit-cover"
                />
              </div>
            )}

            {currentItem.type === 'video' && (
              <div className="media-frame video-frame">
                <video
                  ref={videoRef}
                  src={currentItem.url}
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                  className="media-fit-cover"
                />
              </div>
            )}

            {currentItem.type === 'youtube' && (
              <div className="media-frame youtube-frame">
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(currentItem.url)}?autoplay=1&mute=1&controls=0&loop=1&playlist=${getYouTubeId(currentItem.url)}&rel=0&showinfo=0&iv_load_policy=3&disablekb=1&modestbranding=1`}
                  title={currentItem.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  className="youtube-iframe"
                />
              </div>
            )}

            {currentItem.type === 'web' && (
              <div className="media-frame web-frame">
                <iframe
                  src={currentItem.url}
                  title={currentItem.title}
                  sandbox="allow-scripts allow-same-origin"
                  className="web-iframe"
                />
              </div>
            )}

          </div>
        )}
      </main>

      {/* Double Footer (Mockup Exact Match) */}
      <footer className="display-double-footer">
        {/* Top layer: News Ticker in Orange Background */}
        <div className="ticker-orange-layer">
          <div className="ticker-scroll-container">
            <div 
              className="ticker-marquee-text"
              style={{ 
                animationDuration: `${settings.tickerSpeed || 15}s` 
              }}
            >
              {getTickerText()}
            </div>
          </div>
        </div>
        
        {/* Bottom layer: Dark Brand Bar */}
        <div className="footer-dark-layer">
          <span className="footer-brand-prefix">&gt;</span>
          <img 
            src="https://res.cloudinary.com/dca2x8jje/image/upload/v1780922392/logo_gostation_WHITE_ksopeg.png" 
            alt="Go Station Logo" 
            className="footer-mini-logo"
          />
          <span className="footer-brand-text">station and more .</span>
        </div>
      </footer>
    </div>
  );
}
