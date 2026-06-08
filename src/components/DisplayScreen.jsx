import React, { useState, useEffect, useRef } from 'react';
import { db } from '../utils/db';
import { sync } from '../utils/sync';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, 
  Wind, Clock, HelpCircle, Loader2, AlertCircle, Maximize2 
} from 'lucide-react';

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
  if (code === 0) return { text: 'مشمس صافٍ', Icon: Sun };
  if ([1, 2, 3].includes(code)) return { text: 'غائم جزئياً', Icon: Cloud };
  if ([45, 48].includes(code)) return { text: 'ضباب', Icon: Cloud };
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { text: 'أمطار حية', Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { text: 'ثلوج', Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { text: 'عاصفة رعدية', Icon: CloudLightning };
  return { text: 'معتدل', Icon: Sun };
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
  const [weather, setWeather] = useState({ temp: '--', text: 'جاري جلب الطقس...', Icon: Sun });
  
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
    // Arabic formatted date
    const timeOptions = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    
    setCurrentTime(now.toLocaleTimeString('ar-SA', timeOptions));
    setCurrentDate(now.toLocaleDateString('ar-SA', dateOptions));
  };

  const fetchWeather = async (cityName) => {
    const coords = CITIES_COORDINATES[cityName] || CITIES_COORDINATES.Riyadh;
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`
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
          Icon: details.Icon
        });
      }
    } catch (err) {
      console.error('Error fetching weather:', err);
      setWeather(prev => ({ ...prev, text: `${coords.name} : الطقس غير متاح` }));
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
      return 'أهلاً بكم في نظام جو ستيشن - شاشات عرض رقمية ذكية ومتكاملة...';
    }
    return tickerItems.map(item => item.text).join('   |   🚀   |   ');
  };

  const currentItem = playlist[currentIndex];
  const WeatherIcon = weather.Icon;
  const rotationClass = settings.layoutRotation === '90' ? 'display-rotated-90' : '';

  return (
    <div className={`display-screen-container ${rotationClass} ${isPreview ? 'in-preview' : ''}`}>
      {/* Top Banner (Header) */}
      <header className="display-header glass-element">
        {/* Left Side: Brand Logo & Title */}
        <div className="display-logo-area">
          {settings.stationLogo ? (
            <img src={settings.stationLogo} alt="Logo" className="display-logo-img" />
          ) : (
            <div className="display-logo-placeholder">Go</div>
          )}
          <h1 className="display-station-name">
            {renderStationName(settings.stationName)}
          </h1>
        </div>

        {/* Center: Clock & Date */}
        <div className="display-clock-area">
          <div className="display-time">
            <Clock size={48} className="clock-pulse" />
            <span>{currentTime}</span>
          </div>
          <div className="display-date">{currentDate}</div>
        </div>

        {/* Right Side: Weather Widget */}
        <div className="display-weather-area">
          <div className="weather-meta">
            <span className="weather-temp">{weather.temp}</span>
            <span className="weather-city">{weather.text}</span>
          </div>
          <div className="weather-icon-box">
            <WeatherIcon size={72} className="weather-glow" />
          </div>
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

            {/* Float Item Overlay Title */}
            <div className="display-item-overlay-title">
              <span>{currentItem.title}</span>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Ticker Tape */}
      <footer className="display-ticker-footer glass-element">
        <div className="ticker-label">تنبيهات هامة</div>
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
      </footer>

      {/* Floating Fullscreen Toggle Button - hidden inside preview or if already in Fullscreen */}
      {!isPreview && !isFullscreen && (
        <button onClick={toggleFullscreen} className="btn-fullscreen-toggle" title="ملء الشاشة">
          <Maximize2 size={16} />
          <span>ملء الشاشة</span>
        </button>
      )}
    </div>
  );
}
