import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Sprout, 
  LogOut, 
  CloudRain, 
  Sun, 
  Cloud, 
  CloudLightning,
  ShieldCheck,
  Languages,
  MapPin,
  Bell,
  Smartphone
} from 'lucide-react';
import type { Language, UserProfile, WeatherInfo } from '../types';
import { alertsAPI } from '../services/api';

interface ModelStatusInfo {
  api_reachable: boolean;
  model_loaded: boolean;
  model_id: string;
  status: string;
}

interface HeaderProps {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  user: UserProfile;
  onLogout: () => void;
  weather: WeatherInfo;
  isSpeaking: boolean;
  onToggleSpeech: () => void;
  unreadNotifications: number;
  onOpenNotifications: () => void;
  isMobileNavOpen: boolean;
  onToggleMobileNav: () => void;
  modelStatus?: ModelStatusInfo;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  onLanguageChange,
  user,
  onLogout,
  weather,
  isSpeaking,
  onToggleSpeech,
  unreadNotifications,
  onOpenNotifications,
  isMobileNavOpen,
  onToggleMobileNav,
  modelStatus,
}) => {
  const { t, i18n } = useTranslation();
  const activeLang = ((i18n.language || language || 'en').substring(0, 2)) as Language;
  const [isSendingHeaderSms, setIsSendingHeaderSms] = React.useState(false);

  const handleHeaderTestSms = async () => {
    setIsSendingHeaderSms(true);
    try {
      const phoneToSend = user?.phone || prompt('Enter 10-digit mobile number to receive live Fast2SMS advisory:');
      if (!phoneToSend) {
        setIsSendingHeaderSms(false);
        return;
      }
      const res = await alertsAPI.sendTestSms({
        uid: user?.id,
        phone: phoneToSend,
        location: weather.city || 'Nagpur',
        name: user?.name || 'Farmer Partner'
      });
      if (res?.success) {
        alert(`✅ Fast2SMS Live Advisory sent successfully to ${phoneToSend}!\n\nMessage: ${res.message || 'Weather & Irrigation Advisory delivered.'}`);
      } else {
        alert(`⚠️ Fast2SMS notice: ${res?.notice || res?.warning || 'Dispatched to gateway'}`);
      }
    } catch (err: any) {
      alert(`⚠️ Failed to send test SMS: ${err?.message || 'Gateway error'}`);
    } finally {
      setIsSendingHeaderSms(false);
    }
  };

  // Initialize and mount Google Translate Widget inside #google_translate_element
  useEffect(() => {
    const initWidget = () => {
      if (typeof window !== 'undefined' && (window as any).googleTranslateElementInit && (window as any).google?.translate) {
        const el = document.getElementById('google_translate_element');
        if (el && (!el.hasChildNodes() || el.children.length === 0)) {
          (window as any).googleTranslateElementInit();
        }
      }
    };

    initWidget();
    const interval = setInterval(initWidget, 500);
    const timeout = setTimeout(() => clearInterval(interval), 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Sync state if user directly interacts with Google Translate's .goog-te-combo dropdown
  useEffect(() => {
    const handleGoogleComboChange = () => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select && select.value) {
        const val = select.value as Language;
        if (val === 'en' || val === 'hi' || val === 'ta') {
          i18n.changeLanguage(val);
          localStorage.setItem('agriguard_language', val);
          localStorage.setItem('i18nextLng', val);
          onLanguageChange(val);
        }
      }
    };

    const attachTimer = setInterval(() => {
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        select.addEventListener('change', handleGoogleComboChange);
        clearInterval(attachTimer);
      }
    }, 400);

    return () => clearInterval(attachTimer);
  }, [i18n, onLanguageChange]);

  const handleLanguageSelect = (newLang: Language) => {
    i18n.changeLanguage(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agriguard_language', newLang);
      localStorage.setItem('i18nextLng', newLang);

      // Set Google Website Translator cookie to translate the entire page dynamically
      const cookieValue = `/en/${newLang}`;
      document.cookie = `googtrans=${cookieValue}; path=/;`;
      if (window.location.hostname && window.location.hostname.indexOf('.') !== -1) {
        document.cookie = `googtrans=${cookieValue}; path=/; domain=.${window.location.hostname};`;
      }

      // Update native Google Translate dropdown and trigger DOM translation
      const select = document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
      if (select) {
        let matched = false;
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].value === newLang) {
            select.selectedIndex = i;
            matched = true;
            break;
          }
        }
        if (!matched && newLang === 'en') {
          for (let i = 0; i < select.options.length; i++) {
            if (select.options[i].text.toLowerCase().includes('english') || select.options[i].value === '') {
              select.selectedIndex = i;
              break;
            }
          }
        }
        select.dispatchEvent(new Event('change'));
      }
    }
    onLanguageChange(newLang);
  };

  const getWeatherIcon = (type: WeatherInfo['iconType']) => {
    switch (type) {
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'storm': return <CloudLightning className="w-4 h-4 text-purple-600 animate-pulse" />;
      case 'sun': return <Sun className="w-4 h-4 text-amber-500 animate-spin-slow" />;
      case 'cloud': 
      default: return <Cloud className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <header className="sticky top-0 z-[100] w-full bg-white/80 backdrop-blur-md border-b border-agri-200/60 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18 gap-2 sm:gap-4">
          
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleMobileNav}
              aria-label="Toggle navigation menu"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white/85 text-slate-700 shadow-sm transition-all hover:bg-agri-50 hover:text-agri-800 md:hidden"
            >
              <span className="relative block h-4 w-5">
                <span className={`absolute left-0 right-0 h-0.5 rounded-full bg-current transition-all ${isMobileNavOpen ? 'top-1.5 rotate-45' : 'top-0'}`} />
                <span className={`absolute left-0 right-0 h-0.5 rounded-full bg-current transition-all ${isMobileNavOpen ? 'opacity-0' : 'top-1.5'}`} />
                <span className={`absolute left-0 right-0 h-0.5 rounded-full bg-current transition-all ${isMobileNavOpen ? 'top-1.5 -rotate-45' : 'top-3'}`} />
              </span>
            </button>

            {/* Brand Logo */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-agri-600 to-agri-800 flex items-center justify-center shadow-md shadow-agri-700/20 text-white transform hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 sm:w-7 sm:h-7 text-citrus-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-xl sm:text-2xl tracking-tight text-agri-950 font-sans">
                  Agri<span className="text-agri-600">Guard</span>
                </span>
                <span className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-agri-100 text-agri-800 border border-agri-300">
                  <ShieldCheck className="w-3 h-3 text-agri-600" /> AI v2.4
                </span>
              </div>
            </div>
          </div>

          {/* Location & Live Field Weather Pill */}
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1.5 rounded-2xl bg-agri-50/90 border border-agri-200/80 text-xs shadow-inner">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <MapPin className={`w-3.5 h-3.5 text-agri-700 ${weather.city.toLowerCase().includes('fetching') ? 'animate-pulse' : ''}`} />
              <span>{weather.city.toLowerCase().includes('fetching') ? t('fetchingLocation', 'Fetching location...') : `${weather.city}:`}</span>
              {!weather.city.toLowerCase().includes('fetching') && (
                <span className="text-agri-800 font-extrabold">{weather.tempC}°C</span>
              )}
            </div>
            <div className="h-3 w-px bg-agri-300" />
            <div className="text-slate-600 font-medium">
              {t('humidity', 'Humidity')}: <strong className="text-slate-800">{weather.humidity}%</strong>
            </div>
            <div className="h-3 w-px bg-agri-300" />
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
              weather.fungalRiskLevel === 'High' || weather.fungalRiskLevel === 'Severe' 
                ? 'bg-rose-100 text-rose-700 border border-rose-200 animate-pulse' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {t(`risk${weather.fungalRiskLevel.replace(/\s+/g, '')}`, `${weather.fungalRiskLevel} Risk`)}
            </span>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* Google Website Translator Widget & Navbar Language Switcher */}
            <div className="flex items-center gap-1.5 bg-slate-100/90 py-1 px-2 rounded-xl border border-slate-200 shadow-inner">
              <Languages className="w-3.5 h-3.5 text-agri-700 ml-0.5 shrink-0 hidden sm:inline" />
              
              {/* Google Website Translator Widget (English, Hindi, Tamil) */}
              <div id="google_translate_element" className="inline-flex items-center" />

              {/* Quick 1-Click Language Buttons */}
              <div className="flex items-center gap-0.5 ml-1 pl-1.5 border-l border-slate-300">
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('en')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    activeLang === 'en'
                      ? 'bg-white text-agri-950 shadow-xs border border-slate-200 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="English"
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('hi')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    activeLang === 'hi'
                      ? 'bg-white text-agri-950 shadow-xs border border-slate-200 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="हिंदी"
                >
                  हिंदी
                </button>
                <button
                  type="button"
                  onClick={() => handleLanguageSelect('ta')}
                  className={`px-1.5 sm:px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                    activeLang === 'ta'
                      ? 'bg-white text-agri-950 shadow-xs border border-slate-200 font-extrabold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  title="தமிழ்"
                >
                  தமிழ்
                </button>
              </div>
            </div>



            {/* Demo Fast2SMS Live Trigger Button */}
            <button
              type="button"
              onClick={handleHeaderTestSms}
              disabled={isSendingHeaderSms}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-agri-700 hover:from-emerald-700 hover:to-agri-800 text-white border border-emerald-500 shadow-md shadow-emerald-950/20 text-xs font-black transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Send live test SMS to your mobile phone via Fast2SMS"
            >
              <Smartphone className="w-3.5 h-3.5 text-citrus-300 animate-pulse" />
              <span className="hidden xs:inline">{isSendingHeaderSms ? 'Sending...' : 'Send Test SMS'}</span>
            </button>

            {/* Agricultural Advisory Notifications */}
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-700 hover:text-agri-800 hover:bg-agri-50 border border-slate-200 transition-colors"
              title="Open agricultural alerts"
              aria-label="Open agricultural alerts"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>


            {/* Farmer Profile Badge */}
            <div className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-xl bg-agri-100/90 border border-agri-300 text-agri-950">
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-agri-700 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                {user.name.charAt(0)}
              </div>
              <div className="text-left hidden md:block">
                <p className="text-xs font-black text-agri-950 leading-tight truncate max-w-[100px]">
                  {user.name}
                </p>
                <p className="text-[10px] text-agri-800 font-bold truncate max-w-[100px]">
                  {user.farmSize} {user.farmUnit}
                </p>
              </div>
            </div>

            {/* Dedicated Logout Button */}
            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-300 hover:border-rose-300 text-xs font-extrabold transition-all"
              title={t('logout', 'Logout & Switch Account')}
            >
              <LogOut className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">{t('logout', 'Logout & Switch Account').split(' ')[0]}</span>
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};
