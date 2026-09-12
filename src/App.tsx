import React, { useState, useEffect } from 'react';
import { Sprout } from 'lucide-react';
import type { 
  Language, 
  UserProfile, 
  WeatherInfo, 
  DiseaseDiagnosis, 
  HistoryRecord, 
  HardwareState,
  ProgressionRisk
} from './types';
import { useAppTranslation } from './i18n';
import { cropDiseases } from './data/cropDiseases';
import { demoProfiles, sampleWeatherStations, initialHistoryRecords } from './data/sampleHistory';


import { AuthPage } from './components/AuthPage';
import { Header } from './components/Header';
import { NavigationTabs, type DashboardTab } from './components/NavigationTabs';
import { DiagnosticHub } from './components/DiagnosticHub';
import { EarlyDetectionCard } from './components/EarlyDetectionCard';
import { DiseaseProgressionRiskCard } from './components/DiseaseProgressionRiskCard';
import { TreatmentDosageCard } from './components/TreatmentDosageCard';
import { WeatherSoilCard } from './components/WeatherSoilCard';
import { IoTSensorsTab } from './components/IoTSensorsTab';
import { CropRecommendationTab } from './components/CropRecommendationTab';
import { MarketplaceTab } from './components/MarketplaceTab';
import { GovtSchemesTab } from './components/GovtSchemesTab';
import { PrescriptionModal } from './components/PrescriptionModal';
import { ProfileFarmSettings } from './components/ProfileFarmSettings';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getApiBaseUrl, weatherAPI, diseaseAPI, modelAPI } from './services/api';

export const App: React.FC = () => {
  const { t, i18n } = useAppTranslation();
  // Page Routing State: Page 1 (Auth View) vs Page 2 (Main Dashboard)
  const [currentPage, setCurrentPage] = useState<'auth' | 'dashboard'>('auth');
  
  // Dashboard Tab Navigation State (5 Tabs: diagnosis, history, weather, iot, store)
  const [activeTab, setActiveTab] = useState<DashboardTab>('diagnosis');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Global App States - persisted language preference (normalized to 'en' | 'hi' | 'ta')
  const [language, setLanguage] = useState<Language>(() => {
    const stored = (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng') || 'en').toLowerCase();
    if (stored.startsWith('hi')) return 'hi';
    if (stored.startsWith('ta')) return 'ta';
    return 'en';
  });
  const [user, setUser] = useState<UserProfile>({
    id: '',
    name: 'Farmer Partner',
    username: '',
    phone: '',
    language: (localStorage.getItem('agriguard_language') || localStorage.getItem('i18nextLng') || 'en') as Language,
    farmSize: 2.5,
    farmUnit: 'Acres',
    primaryCrop: 'Citrus (Orange / Lemon)',
    state: '',
    district: '',
    isLoggedIn: false,
  });
  const [weather, setWeather] = useState<WeatherInfo>({
    ...sampleWeatherStations['Nagpur (Citrus Belt)'],
    city: 'Fetching location',
    state: '',
  });
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);
  const [isGpsDenied, setIsGpsDenied] = useState<boolean>(false);
  
  // Diagnostic States
  const [activeDiagnosis, setActiveDiagnosis] = useState<DiseaseDiagnosis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isAnalyzed, setIsAnalyzed] = useState<boolean>(false);
  const [acreage, setAcreage] = useState<number>(4.5);
  const [progressionRisk, setProgressionRisk] = useState<ProgressionRisk | null>(null);
  const [predictionSensorSnapshot, setPredictionSensorSnapshot] = useState<any>(null);
  const [predictionWeatherSnapshot, setPredictionWeatherSnapshot] = useState<any>(null);

  // History & Feedback States
  const [history, setHistory] = useState<HistoryRecord[]>(initialHistoryRecords);

  const [hardwareState, setHardwareState] = useState<HardwareState>({
    isConnected: false,
    deviceId: null,
    deviceName: 'AgriGuard Prototype Node (ESP32)',
    lastPing: null,
  });

  // Modals & TTS
  const [isPrescriptionOpen, setIsPrescriptionOpen] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);

  // AI Model Connection Status (polled every 30s)
  const [modelStatus, setModelStatus] = useState<{
    api_reachable: boolean;
    model_loaded: boolean;
    model_id: string;
    status: string;
  }>({ api_reachable: false, model_loaded: false, model_id: 'checking', status: 'checking' });

  // Poll backend model status on mount and every 30 seconds
  useEffect(() => {
    let cancelled = false;
    const checkStatus = async () => {
      const result = await modelAPI.getStatus();
      if (!cancelled) setModelStatus(result);
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Trigger high-accuracy live GPS tracking
  const requestLiveGpsLocation = (isManualRetry = false) => {
    if ('geolocation' in navigator) {
      setIsWeatherLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsGpsDenied(false);
          const { latitude: lat, longitude: lon } = pos.coords;
          fetchLiveWeatherByCoords(lat, lon);
        },
        (err) => {
          console.warn("GPS tracking denied or failed:", err);
          setIsGpsDenied(true);
          setIsWeatherLoading(false);
          if (isManualRetry || !weather.city) {
            fetchLiveWeatherByCity('Nagpur');
          }
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsGpsDenied(true);
      fetchLiveWeatherByCity('Nagpur');
    }
  };

  // Auto-track location & fetch live weather on Dashboard Mount
  useEffect(() => {
    if (currentPage === 'dashboard') {
      requestLiveGpsLocation();
    }
  }, [currentPage]);

  // Auth Handlers: Prompt for GPS location permission immediately after sign in
  const handleLoginSuccess = (profile: UserProfile) => {
    setUser(profile);
    setAcreage(profile.farmSize || 4.5);
    if (profile.language) {
      setLanguage(profile.language);
      i18n.changeLanguage(profile.language);
      localStorage.setItem('agriguard_language', profile.language);
      localStorage.setItem('i18nextLng', profile.language);
    }
    setCurrentPage('dashboard');
    setActiveTab('diagnosis');
    setIsAnalyzed(false);
    requestLiveGpsLocation();
  };

  const handleLogout = () => {
    setUser({
      id: '',
      name: 'Farmer Partner',
      username: '',
      phone: '',
      language: language,
      farmSize: 2.5,
      farmUnit: 'Acres',
      primaryCrop: 'Citrus (Orange / Lemon)',
      state: '',
      district: '',
      isLoggedIn: false
    });
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setCurrentPage('auth');
  };

  const handleProfileSave = (profile: UserProfile) => {
    setUser(profile);
    setAcreage(profile.farmSize || 4.5);
  };

  const handlePairHardware = () => {
    const lastPing = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    setHardwareState({
      isConnected: true,
      deviceId: 'ESP32-AgriNode-#01',
      deviceName: 'AgriGuard Prototype Node (ESP32)',
      lastPing,
    });
    setUser((profile) => ({ ...profile, iotDeviceSerial: 'ESP32-AgriNode-#01' }));
  };

  // Language & Location Handlers
  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    setUser((prev) => ({ ...prev, language: newLang }));
    i18n.changeLanguage(newLang);
    localStorage.setItem('agriguard_language', newLang);
    localStorage.setItem('i18nextLng', newLang);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const fetchLiveWeatherByCoords = async (lat: number, lon: number) => {
    setIsWeatherLoading(true);
    try {
      const data = await weatherAPI.getWeatherByCoords(lat, lon);
      if (data) {
        setWeather(data as WeatherInfo);
        if (data.city || data.location) {
          const locName = data.city || data.location;
          setUser((prev) => ({
            ...prev,
            location: locName,
            district: locName,
            latitude: lat,
            longitude: lon,
          }));
        }
      }
    } catch (err) {
      console.warn("GPS Weather API fetch error, falling back to city lookup:", err);
      fetchLiveWeatherByCity(weather.city || 'Nagpur');
    } finally {
      setIsWeatherLoading(false);
    }
  };

  const fetchLiveWeatherByCity = async (cityName: string) => {
    setIsWeatherLoading(true);
    try {
      const data = await weatherAPI.getWeatherByCity(cityName);
      if (data) {
        setWeather(data as WeatherInfo);
      }
    } catch (err) {
      console.warn("Live Weather API warning:", err);
    } finally {
      setIsWeatherLoading(false);
    }
  };

  useEffect(() => {
    if (currentPage === 'dashboard') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude: lat, longitude: lon } = pos.coords;
            fetchLiveWeatherByCoords(lat, lon);
          },
          (err) => {
            console.warn("GPS location permission denied or error, fallback to default city:", err);
            fetchLiveWeatherByCity(weather.city || 'Nagpur');
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
        );
      } else {
        fetchLiveWeatherByCity(weather.city || 'Nagpur');
      }
    }
  }, [activeTab, currentPage]);

  const handleLocationSelect = (stationName: string) => {
    const cleanCity = stationName.split('(')[0].trim();
    fetchLiveWeatherByCity(cleanCity);
  };

  // AI Diagnostic Analysis with real PyTorch Backend Integration
  const handleAnalyze = async (
    file: File | null,
    customImage?: string,
    symptomText?: string,
    sampleDisease?: DiseaseDiagnosis
  ) => {
    setIsAnalyzing(true);
    try {
      let fileToUpload: File | null = file;

      if (!fileToUpload && customImage && customImage.startsWith('blob:')) {
        // Real camera/blob capture → convert to File for model inference
        try {
          const blob = await fetch(customImage).then((r) => r.blob());
          fileToUpload = new File([blob], 'uploaded_leaf.jpg', { type: blob.type || 'image/jpeg' });
        } catch (e) {
          console.warn("Failed to convert blob preview to File:", e);
        }
      } else if (!fileToUpload && customImage && (customImage.startsWith('http') || customImage.startsWith('/'))) {
        // Static sample/placeholder image — do NOT send to AI model
        // Instead, use the sampleDisease template directly for instant demo result
        if (sampleDisease) {
          setActiveDiagnosis({ ...sampleDisease, id: `demo-${Date.now()}` });
          setIsAnalyzed(true);
          setIsAnalyzing(false);
          return;
        }
        // No template, alert user to upload a real photo
        alert("⚠️ Please upload or capture a real leaf photo to run AI crop detection. Sample images cannot be processed by the model.");
        setIsAnalyzing(false);
        return;
      }

      if (!fileToUpload) {
        alert("⚠️ Please upload or capture a leaf photo first to run AI crop detection.");
        setIsAnalyzing(false);
        return;
      }

      const currentLang = i18n.language || language || 'en';
      const predictionResult = await diseaseAPI.predict(fileToUpload, currentLang);


      if (predictionResult && predictionResult.status === 'invalid_leaf') {
        alert("⚠️ Leaf Detection Alert: The uploaded image does not appear to contain a valid crop leaf. Please upload a clear, focused photo of a plant leaf.");
        setIsAnalyzing(false);
        setIsAnalyzed(false);
        setActiveDiagnosis(null);
        return;
      }

      if (predictionResult && predictionResult.disease) {
        const rawDisease = predictionResult.disease; // e.g. "Apple with Black Rot" or "Potato___Late_blight" or "Healthy"
        const realConfidence = predictionResult.confidence; // e.g. 94.32

        // Part 3: Combined Progression risk + Treatment from Gemini reasoning
        if (predictionResult.progression_risk) {
          const rec = predictionResult.progression_risk.pesticide_recommendation || predictionResult.pesticide_recommendation || predictionResult.progression_risk.treatment || predictionResult.treatment || null;
          setProgressionRisk({
            ...predictionResult.progression_risk,
            pesticide_recommendation: rec,
            treatment: rec,
          });
        } else if (rawDisease.toLowerCase().includes('healthy')) {
          setProgressionRisk({
            risk: 'No Risk',
            progression_stage: 'Optimal Plant Health / No Disease',
            vulnerability_window: 'N/A',
            message: 'Plant is healthy — no disease progression to assess.',
            pesticide_recommendation: null,
            treatment: null,
          });
        } else {
          setProgressionRisk(null);
        }

        if (predictionResult.sensor_snapshot) {
          setPredictionSensorSnapshot(predictionResult.sensor_snapshot);
        }
        if (predictionResult.weather_snapshot) {
          setPredictionWeatherSnapshot(predictionResult.weather_snapshot);
        }

        // Clean and format display title
        const formattedTitle = rawDisease
          .replace(/___/g, ' - ')
          .replace(/_/g, ' ')
          .trim();

        const isHealthy = rawDisease.toLowerCase().includes('healthy');

        // Extract crop and disease names cleanly
        let cropNamePart = 'Crop';
        let diseaseNamePart = formattedTitle;

        if (formattedTitle.includes(' - ')) {
          const parts = formattedTitle.split(' - ');
          cropNamePart = parts[0].trim();
          diseaseNamePart = parts[1].trim();
        } else if (formattedTitle.toLowerCase().includes(' with ')) {
          const parts = formattedTitle.split(/ with /i);
          cropNamePart = parts[0].trim();
          diseaseNamePart = parts[1].trim();
        } else if (isHealthy) {
          cropNamePart = formattedTitle.replace(/healthy/i, '').replace(/plant/i, '').trim() || 'Plant';
          diseaseNamePart = 'Healthy (No Disease Detected)';
        }

        // Find matching base template in cropDiseases; DO NOT default to Citrus (cropDiseases[0])!
        const lowerRaw = rawDisease.toLowerCase();
        const lowerCrop = cropNamePart.toLowerCase();
        const lowerDisease = diseaseNamePart.toLowerCase();

        const template = cropDiseases.find((d) => {
          const cId = d.cropId.toLowerCase();
          const cEn = d.cropName.en.toLowerCase();
          const dEn = d.diseaseName.en.toLowerCase();
          return (
            lowerRaw.includes(cId) ||
            lowerCrop.includes(cId) ||
            cEn.includes(lowerCrop) ||
            dEn.includes(lowerDisease)
          );
        });

        // Build customized diagnosis object for exact AI model result
        const dynamicDiagnosis: DiseaseDiagnosis = template ? {
          ...template,
          id: `ai-${Date.now()}`,
          diseaseName: {
            en: isHealthy ? `Healthy ${cropNamePart} (No Disease)` : diseaseNamePart,
            hi: isHealthy ? `स्वस्थ ${cropNamePart} (कोई बीमारी नहीं)` : diseaseNamePart,
            ta: isHealthy ? `ஆரோக்கியமான ${cropNamePart} (நோய் இல்லை)` : diseaseNamePart
          },
          cropName: {
            en: `${cropNamePart} (AI Backend Identified)`,
            hi: `${cropNamePart} (AI द्वारा पहचाना गया)`,
            ta: `${cropNamePart} (AI கண்டறிந்தது)`
          },
          confidence: realConfidence,
          stage: isHealthy ? 'Early Stage (Inception)' : (realConfidence > 85 ? 'Moderate Progression' : 'Early Stage (Inception)'),
          spreadRiskRate: isHealthy ? 0 : Math.min(95, Math.round(realConfidence * 0.85)),
          earlyWarningAlert: {
            en: isHealthy
              ? `AI Crop Classifier confirmed this ${cropNamePart} leaf is healthy with ${realConfidence}% confidence. No immediate chemical intervention required.`
              : `AI Model identified ${diseaseNamePart} on ${cropNamePart} with ${realConfidence}% confidence. Follow recommended organic or targeted protocols below.`,
            hi: isHealthy
              ? `AI मॉडल ने ${realConfidence}% सटीकता के साथ पुष्टि की है कि यह ${cropNamePart} पत्ता स्वस्थ है।`
              : `AI मॉडल ने ${realConfidence}% सटीकता से ${cropNamePart} पर ${diseaseNamePart} की पहचान की है।`,
            ta: isHealthy
              ? `AI மாதிரி ${realConfidence}% நம்பிக்கையுடன் இந்த ${cropNamePart} இலை ஆரோக்கியமானது என்பதை உறுதிப்படுத்தியுள்ளது.`
              : `AI மாதிரி ${realConfidence}% நம்பிக்கையுடன் ${cropNamePart} இலையில் ${diseaseNamePart} நோயைக் கண்டறிந்துள்ளது.`
          },
          symptoms: isHealthy
            ? {
                en: [
                  'Vibrant green leaf tissue with uniform chlorophyll distribution',
                  'No fungal, bacterial, or necrotic lesions detected',
                  'Healthy leaf veins and normal stomatal transpiration'
                ],
                hi: ['समान क्लोरोफिल वितरण के साथ हरा पत्ता', 'कोई कवक या जीवाणु के धब्बे नहीं', 'स्वस्थ पत्ती की शिराएं'],
                ta: ['சீரான பச்சையத்துடன் கூடிய ஆரோக்கியமான இலை', 'பூஞ்சை அல்லது பாக்டீரியா புள்ளிகள் இல்லை', 'ஆரோக்கியமான நரம்புகள்']
              }
            : {
                en: template.symptoms?.en || ['Observed characteristic lesions on foliage'],
                hi: template.symptoms?.hi || template.symptoms?.en || ['पत्तियों पर लक्षण देखे गए'],
                ta: template.symptoms?.ta || template.symptoms?.en || ['இலையில் நோய் அறிகுறிகள் தெரிகின்றன']
              },
          sampleImage: customImage || template.sampleImage
        } : {
          id: `ai-${Date.now()}`,
          cropId: cropNamePart.toLowerCase().replace(/\s+/g, '-'),
          cropName: {
            en: `${cropNamePart} (AI Backend Identified)`,
            hi: `${cropNamePart} (AI द्वारा पहचाना गया)`,
            ta: `${cropNamePart} (AI கண்டறிந்தது)`
          },
          diseaseName: {
            en: isHealthy ? `Healthy ${cropNamePart} (No Disease)` : diseaseNamePart,
            hi: isHealthy ? `स्वस्थ ${cropNamePart} (कोई बीमारी नहीं)` : diseaseNamePart,
            ta: isHealthy ? `ஆரோக்கியமான ${cropNamePart} (நோய் இல்லை)` : diseaseNamePart
          },
          scientificName: isHealthy ? 'N/A' : `${cropNamePart} Pathogen`,
          pathogenType: isHealthy ? 'Nutrient Deficiency' : (diseaseNamePart.toLowerCase().includes('virus') ? 'Virus' : (diseaseNamePart.toLowerCase().includes('bacteri') ? 'Bacterium' : 'Fungus')),
          stage: isHealthy ? 'Early Stage (Inception)' : (realConfidence > 85 ? 'Moderate Progression' : 'Early Stage (Inception)'),
          confidence: realConfidence,
          incubationPeriod: isHealthy ? 'N/A' : '3 - 7 Days',
          spreadRiskRate: isHealthy ? 0 : Math.min(95, Math.round(realConfidence * 0.85)),
          earlyWarningAlert: {
            en: isHealthy
              ? `AI Crop Classifier confirmed this ${cropNamePart} leaf is healthy with ${realConfidence}% confidence. No immediate chemical intervention required.`
              : `AI Model identified ${diseaseNamePart} on ${cropNamePart} with ${realConfidence}% confidence. Follow recommended organic or targeted protocols below.`,
            hi: isHealthy
              ? `AI मॉडल ने ${realConfidence}% सटीकता के साथ पुष्टि की है कि यह ${cropNamePart} पत्ता स्वस्थ है।`
              : `AI मॉडल ने ${realConfidence}% सटीकता से ${cropNamePart} पर ${diseaseNamePart} की पहचान की है।`,
            ta: isHealthy
              ? `AI மாதிரி ${realConfidence}% நம்பிக்கையுடன் இந்த ${cropNamePart} இலை ஆரோக்கியமானது என்பதை உறுதிப்படுத்தியுள்ளது.`
              : `AI மாதிரி ${realConfidence}% நம்பிக்கையுடன் ${cropNamePart} இலையில் ${diseaseNamePart} நோயைக் கண்டறிந்துள்ளது.`
          },
          symptoms: isHealthy
            ? {
                en: [
                  'Vibrant green leaf tissue with uniform chlorophyll distribution',
                  'No fungal, bacterial, or necrotic lesions detected',
                  'Healthy leaf veins and normal stomatal transpiration'
                ],
                hi: ['समान क्लोरोफिल वितरण के साथ हरा पत्ता', 'कोई कवक या जीवाणु के धब्बे नहीं', 'स्वस्थ पत्ती की शिराएं'],
                ta: ['சீரான பச்சையத்துடன் கூடிய ஆரோக்கியமான இலை', 'பூஞ்சை या பாக்டீரியா புள்ளிகள் இல்லை', 'ஆரோக்கியமான நரம்புகள்']
              }
            : {
                en: [
                  `Observed foliage spots and lesions characteristic of ${diseaseNamePart} on ${cropNamePart}`,
                  `Chlorotic yellow halos or necrotic tissue patches on affected leaves`,
                  `Potential leaf dropping and reduced photosynthetic capacity if untreated`
                ],
                hi: [
                  `${cropNamePart} पर ${diseaseNamePart} के लक्षण देखे गए`,
                  `प्रभावित पत्तियों पर पीले या भूरे धब्बे`,
                  `उपचार न करने पर पत्तियों के गिरने की संभावना`
                ],
                ta: [
                  `${cropNamePart} இலையில் ${diseaseNamePart} அறிகுறிகள் கண்டறியப்பட்டுள்ளன`,
                  `பாதிக்கப்பட்ட இலைகளில் பழுப்பு புள்ளிகள்`,
                  `சிகிச்சை அளிக்காவிட்டால் இலை உதிரும் அபாயம்`
                ]
              },
          visualFeatures: isHealthy ? ['Uniform green chlorophyll', 'Smooth leaf margin'] : ['Foliage lesions', 'Chlorotic halo', 'Tissue discoloration'],
          organicProtocol: {
            overview: {
              en: isHealthy
                ? 'Apply seaweed extract or bio-stimulant foliar spray for enhanced plant vigor and stress tolerance.'
                : `Apply bio-fungicide/bactericide (Neem oil 1500ppm / Trichoderma / Pseudomonas) to suppress ${diseaseNamePart}.`,
              hi: isHealthy
                ? 'पौधे की प्रतिरोधक क्षमता बढ़ाने के लिए समुद्री शैवाल अर्क का प्रयोग करें।'
                : `${diseaseNamePart} को रोकने के लिए जैविक कवकनाशी का उपयोग करें।`,
              ta: isHealthy
                ? 'பயிரின் நோய் எதிர்ப்புத் திறனை அதிகரிக்க கடற்பாசி சாறு தெளிக்கவும்.'
                : `${diseaseNamePart} நோயைக் கட்டுப்படுத்த இயற்கை பூஞ்சைக் கொல்லியைப் பயன்படுத்தவும்.`
            },
            remedies: [
              {
                id: `org-${Date.now()}`,
                name: isHealthy ? 'Liquid Seaweed Extract Bio-Stimulant' : 'Cold-Pressed Neem Oil (1500 ppm) + Bio-Fungicide',
                dosageFormula: (acres: number) => ({
                  amount: `${(acres * 1000).toFixed(0)} ml (${(1.0 * acres).toFixed(1)} L)`,
                  waterVolume: `${(acres * 200).toFixed(0)} Liters (10-12 Knapsack Tanks)`
                }),
                instructions: isHealthy
                  ? 'Mix 2.5ml per liter of clean water and spray on foliage during early morning.'
                  : 'Mix 5ml Neem oil per liter of water with 1ml organic liquid soap. Spray thoroughly on upper and lower leaf surfaces.',
                schedule: 'Apply every 7-10 days until crop condition improves.',
                safetyCaution: 'Do not spray under direct midday sun (above 35°C).',
                phiDays: 0,
                productLinkIds: ['prod-neem-1500', 'prod-knapsack-sprayer']
              }
            ]
          },
          chemicalProtocol: {
            overview: {
              en: isHealthy
                ? 'No chemical sprays required for healthy crops. Maintain balanced NPK nutrition.'
                : `Targeted systemic/contact spray formulation recommended for ${diseaseNamePart} control.`,
              hi: isHealthy
                ? 'स्वस्थ फसल के लिए किसी रासायनिक छिड़काव की आवश्यकता नहीं है।'
                : `${diseaseNamePart} नियंत्रण के लिए अनुशंसित रासायनिक छिड़काव।`,
              ta: isHealthy
                ? 'ஆரோக்கியமான பயிர்களுக்கு இரசாயன தெளிப்பு தேவையில்லை.'
                : `${diseaseNamePart} கட்டுப்பாட்டுக்கான பரிந்துரைக்கப்பட்ட தெளிப்பு.`
            },
            remedies: [
              {
                id: `chem-${Date.now()}`,
                name: isHealthy ? 'Chelated Micronutrient Spray' : `Targeted Formulation for ${diseaseNamePart}`,
                activeIngredient: isHealthy ? 'Micronutrient Mixture (Zn, Fe, B)' : `Active Fungicide / Bactericide for ${diseaseNamePart}`,
                dosageFormula: (acres: number) => ({
                  amount: `${(acres * 400).toFixed(0)} grams / ml (2.0 per Liter water)`,
                  waterVolume: `${(acres * 200).toFixed(0)} Liters`
                }),
                instructions: 'Dissolve 2g/ml per liter of water. Spray using a clean knapsack sprayer with hollow cone nozzle.',
                schedule: 'Spray once immediately; repeat after 10-14 days if disease pressure persists.',
                safetyCaution: 'Wear protective mask and gloves. Observe pre-harvest interval.',
                phiDays: isHealthy ? 0 : 7,
                productLinkIds: ['prod-copper-oxy', 'prod-ppe-kit']
              }
            ]
          },
          preventativeTips: {
            en: [
              `Maintain proper field sanitation and remove debris infected with ${diseaseNamePart}.`,
              `Ensure adequate plant spacing and canopy aeration for ${cropNamePart}.`,
              `Monitor crop regularly using AgriGuard AI scanner for early detection.`
            ],
            hi: [
              `खेत की स्वच्छता बनाए रखें और ${diseaseNamePart} से प्रभावित अवशेषों को हटाएं।`,
              `${cropNamePart} के लिए पर्याप्त हवा और धूप का ध्यान रखें।`,
              `एग्रीगार्ड ऐप से नियमित जांच करते रहें।`
            ],
            ta: [
              `வயலை சுத்தமாக வைத்துக்கொண்டிருங்கள்.`,
              `பயிர்களுக்கு இடையே சரியான இடைவெளி பராமரிக்கவும்.`,
              `அக்ரிகார்ட் செயலியைப் பயன்படுத்தி தொடர்ந்து கண்காணிக்கவும்.`
            ]
          },
          recommendedProductIds: ['prod-neem-1500', 'prod-copper-oxy', 'prod-knapsack-sprayer', 'prod-ppe-kit'],
          sampleImage: customImage || '/images/auth-bg.png'
        };

        setActiveDiagnosis(dynamicDiagnosis);
        setIsAnalyzed(true);

        // Add to history records automatically
        const newRecord: HistoryRecord = {
          id: `hist-${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          crop: cropNamePart,
          diseaseName: isHealthy ? 'Healthy Plant' : diseaseNamePart,
          stage: dynamicDiagnosis.stage,
          severity: isHealthy ? 'Low' : (realConfidence > 85 ? 'High' : 'Moderate'),
          status: isHealthy ? 'Resolved' : 'In Treatment',
          fieldArea: `${acreage} ${t.acresUnit}`,
          treatmentChosen: 'Organic',
          feedback: null,
          confidenceScore: realConfidence,
          imageThumbnail: customImage || '/images/auth-bg.png'
        };

        setHistory((prev) => [newRecord, ...prev]);
      } else {
        alert("Backend API Warning: Disease detection returned no classification.");
      }
    } catch (err) {
      console.error("Backend Connection Error:", err);
      alert(`Backend Connection Error: Could not connect to AI model server at ${getApiBaseUrl()}/disease/predict. Please verify the configured backend URL.`);
      setIsAnalyzing(false);
      setIsAnalyzed(false);
      setActiveDiagnosis(null);
    } finally {
      setIsAnalyzing(false);
      const resultsEl = document.getElementById('diagnosis-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // History Feedback & Re-Reference Handlers
  const handleUpdateFeedback = (recordId: string, feedback: 'worked' | 'not_worked') => {
    setHistory((prev) =>
      prev.map((rec) =>
        rec.id === recordId
          ? {
              ...rec,
              feedback,
              status: feedback === 'worked' ? 'Resolved' : 'In Treatment',
              feedbackTimestamp: new Date().toISOString().split('T')[0]
            }
          : rec
      )
    );
  };

  const handleSelectHistoryItem = (record: HistoryRecord) => {
    const matched = cropDiseases.find(
      (d) =>
        d.diseaseName[language].toLowerCase().includes(record.diseaseName.toLowerCase()) ||
        d.cropName[language].toLowerCase().includes(record.crop.toLowerCase())
    );
    if (matched) {
      setActiveDiagnosis(matched);
    }
    setActiveTab('diagnosis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };



  // Text-To-Speech (TTS) Narration
  const handleToggleSpeech = () => {
    if (isSpeaking) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    if (!activeDiagnosis) return;

    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    const textToSpeak = `
      ${activeDiagnosis.diseaseName[language]}. 
      ${activeDiagnosis.earlyWarningAlert[language]}. 
      ${t.dosageForField} ${acreage} ${t.acresUnit}. 
      ${activeDiagnosis.organicProtocol.overview[language]}.
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = language === 'hi' ? 'hi-IN' : language === 'ta' ? 'ta-IN' : 'en-US';
    utterance.rate = 0.95;

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const unreadAlertsCount = 0;

  const handleTabChange = (tab: DashboardTab) => {
    setActiveTab(tab);
    setIsMobileNavOpen(false);
  };

  // ==========================================
  // VIEW 1: Standalone Authentication Page
  // ==========================================
  if (currentPage === 'auth') {
    return (
      <AuthPage
        language={language}
        onLanguageChange={handleLanguageChange}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // ==========================================
  // VIEW 2: Main Farmer Dashboard with isolated tab views
  // ==========================================
  return (
    <div className="relative min-h-screen max-w-[100vw] overflow-x-hidden font-sans bg-earth-50 text-slate-800 antialiased pb-16 sm:pb-0">
      
      {/* 100% Sharp, Crisp, and Clear Background matching Login page clarity */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/images/dashboard-bg.jpg')" }}
      >
        {/* Soft edge tint to maintain pristine image clarity while maximizing card contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-agri-950/80 via-agri-950/40 to-agri-950/75" />
      </div>

      {/* Main Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        
        {/* Sticky Glassmorphism Header */}
        <Header
          language={language}
          onLanguageChange={handleLanguageChange}
          user={user}
          onLogout={handleLogout}
          weather={weather}
          isSpeaking={isSpeaking}
          onToggleSpeech={handleToggleSpeech}
          unreadNotifications={unreadAlertsCount}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
          onOpenNotifications={() => {
            setActiveTab('diagnosis');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          modelStatus={modelStatus}
        />

        {/* Tab Navigation (Desktop Top Bar / Mobile Bottom Bar) */}
        <NavigationTabs
          activeTab={activeTab}
          onTabChange={handleTabChange}
          unreadSmsCount={unreadAlertsCount}
          isMobileOpen={isMobileNavOpen}
          onCloseMobileNav={() => setIsMobileNavOpen(false)}
        />

        {/* Dashboard Content Area */}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 md:pl-72 md:pr-8">
          
          {/* ========================================================= */}
          {/* TAB 1: CROP DIAGNOSIS (Default Focused View)               */}
          {/* ========================================================= */}
          {activeTab === 'diagnosis' && (
            <ErrorBoundary fallbackTitle="Crop Diagnosis View">
              <div className="space-y-6 max-w-5xl mx-auto animate-fade-in">
                
                {/* 1. Input Area: Dual Input Photo & Voice/Symptoms */}
                <DiagnosticHub
                  language={language}
                  onAnalyze={handleAnalyze}
                  isAnalyzing={isAnalyzing}
                  selectedAcreage={acreage}
                  onAcreageChange={(val) => setAcreage(val)}
                  activeDiagnosis={activeDiagnosis}
                  isAnalyzed={isAnalyzed}
                  onClearAnalysis={() => {
                    setIsAnalyzed(false);
                    setProgressionRisk(null);
                    setPredictionSensorSnapshot(null);
                    setPredictionWeatherSnapshot(null);
                  }}
                />

                {/* While Gemini is loading, show skeleton loader on both sections simultaneously */}
                {isAnalyzing && (
                  <div className="space-y-5 animate-fade-in">
                    <DiseaseProgressionRiskCard
                      progressionRisk={null}
                      sensorSnapshot={predictionSensorSnapshot}
                      weatherSnapshot={predictionWeatherSnapshot || weather}
                      language={language}
                      isLoading={true}
                    />
                    <TreatmentDosageCard
                      treatment={null}
                      sensorSnapshot={predictionSensorSnapshot}
                      weatherSnapshot={predictionWeatherSnapshot || weather}
                      isLoading={true}
                      language={language}
                      acreage={acreage}
                    />
                  </div>
                )}

                {!isAnalyzed && !isAnalyzing && (
                  <div className="bg-white/90 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-lg border border-agri-200/80 text-center animate-fade-in">
                    <div className="w-12 h-12 mx-auto rounded-2xl bg-agri-100 flex items-center justify-center text-2xl">📷</div>
                    <p className="mt-3 text-sm sm:text-base font-bold leading-relaxed text-slate-700">
                      {t('noCropScanActive', "No Crop Scan Active: Upload a leaf photo or describe symptoms via voice and click 'Analyze Crop with AgriGuard AI' to generate diagnostic findings and dosage recommendations.")}
                    </p>
                  </div>
                )}

                {isAnalyzed && activeDiagnosis && (
                  <>
                    {/* 2. AI Early Disease Detection Results */}
                    <div id="diagnosis-results" className="space-y-5">
                      <EarlyDetectionCard
                        diagnosis={activeDiagnosis}
                        language={language}
                        onOpenPrescription={() => setIsPrescriptionOpen(true)}
                      />

                      {/* Disease Progression Risk via Gemini AI Reasoning & Live Sensors + Weather */}
                      <DiseaseProgressionRiskCard
                        progressionRisk={progressionRisk}
                        sensorSnapshot={predictionSensorSnapshot}
                        weatherSnapshot={predictionWeatherSnapshot || weather}
                        language={language}
                        isLoading={isAnalyzing}
                      />
                    </div>

                    {/* 3. Precision Treatment & Dosage Recommendations via Live Gemini API */}
                    <TreatmentDosageCard
                      treatment={progressionRisk?.pesticide_recommendation || progressionRisk?.treatment}
                      isHealthy={progressionRisk?.risk === 'No Risk' || String(activeDiagnosis.diseaseName?.en || '').toLowerCase().includes('healthy')}
                      sensorSnapshot={predictionSensorSnapshot}
                      weatherSnapshot={predictionWeatherSnapshot || weather}
                      isLoading={isAnalyzing}
                      language={language}
                      acreage={acreage}
                    />
                  </>
                )}

              </div>
            </ErrorBoundary>
          )}



          {/* ========================================================= */}
          {/* TAB 2: CROP RECOMMENDATION (GEMINI AI + SENSORS + WEATHER) */}
          {/* ========================================================= */}
          {activeTab === 'recommendations' && (
            <CropRecommendationTab
              language={language}
              user={user}
              onNavigateToDiagnosis={() => {
                setActiveTab('diagnosis');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: MARKETPLACE & MANDI PRICE COMPARISON & FORECAST      */}
          {/* ========================================================= */}
          {activeTab === 'marketplace' && (
            <MarketplaceTab
              language={language}
              user={user}
            />
          )}

          {/* ========================================================= */}
          {/* TAB 3: GOVT SCHEMES (CENTRAL & STATE DIRECT BENEFIT WELFARE)*/}
          {/* ========================================================= */}
          {activeTab === 'schemes' && (
            <GovtSchemesTab
              language={language}
              user={user}
            />
          )}

          {/* ========================================================= */}
          {/* TAB: FIELD DATA (LIVE GPS WEATHER & IOT SENSOR TELEMETRY) */}
          {/* ========================================================= */}
          {activeTab === 'fieldData' && (
            <div className="max-w-5xl mx-auto animate-fade-in space-y-6">
              <WeatherSoilCard
                weather={weather}
                language={language}
                user={user}
                isLoading={isWeatherLoading}
                isGpsDenied={isGpsDenied}
                onRefreshLocation={() => requestLiveGpsLocation(true)}
                onManualCitySubmit={(cityName) => fetchLiveWeatherByCity(cityName)}
              />
              <IoTSensorsTab
                language={language}
                hardwareState={hardwareState}
                onPairHardware={handlePairHardware}
                onNavigateToDiagnosis={() => {
                  setActiveTab('diagnosis');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </div>
          )}



          {activeTab === 'profile' && (
            <ProfileFarmSettings 
              language={language} 
              user={user} 
              onSave={handleProfileSave} 
              hardwareState={hardwareState} 
              onLogout={handleLogout} 
            />
          )}

        </main>

        {/* Global Footer */}
        <footer className="border-t border-white/20 bg-slate-900/80 backdrop-blur-md mt-12 py-6 text-center text-xs text-white/70 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-bold text-white">
              <Sprout className="w-4 h-4 text-citrus-400" />
              <span>AgriGuard AI — Agricultural Health, IoT & Early Warning System</span>
            </div>
            <p className="text-white/70">
              Farmer Support in English • हिंदी • தமிழ்
            </p>
            <div className="flex items-center gap-3 text-citrus-300 font-semibold">
              <span>CIB-RC Approved Formulations</span>
              <span>•</span>
              <span>ESP32 Hardware Node Mesh</span>
            </div>
          </div>
        </footer>

      </div>

      {/* Modals & Drawers */}
      <PrescriptionModal
        isOpen={isPrescriptionOpen}
        onClose={() => setIsPrescriptionOpen(false)}
        diagnosis={activeDiagnosis}
        user={user}
        acreage={acreage}
        language={language}
      />



    </div>
  );
};

export default App;
