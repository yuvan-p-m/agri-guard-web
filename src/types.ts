export type Language = 'en' | 'hi' | 'ta';

export interface HardwareState {
  isConnected: boolean;
  deviceId: string | null;
  deviceName: string;
  lastPing: string | null;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  username: string;
  phone: string;
  language: Language;
  farmSize: number;
  farmUnit: 'Acres' | 'Hectares' | 'Bigha' | 'Guntha';
  primaryCrop: string;
  cropType?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  role?: string;
  secondaryCrops?: string[];
  soilType?: string;
  irrigationType?: string;
  iotDeviceSerial?: string;
  state: string;
  district: string;
  villageTaluka?: string;
  pincode?: string;
  isLoggedIn: boolean;
}

export interface WeatherInfo {
  city: string;
  state: string;
  tempC: number;
  condition: string;
  humidity: number;
  rainfallChance: number;
  windSpeedKmH: number;
  soilMoisture: string;
  fungalRiskLevel: 'Low' | 'Moderate' | 'High' | 'Severe';
  leafWetnessHours: number;
  alertSummary: string;
  iconType: 'rain' | 'sun' | 'cloud' | 'storm';
  sprayWindows?: {
    timeSlot: string;
    status: 'Optimal' | 'Caution' | 'Unfavorable';
    reason: string;
  }[];
  forecast?: {
    date: string;
    temp_max: number;
    temp_min: number;
    humidity: number;
    rainfall_mm: number;
    disease_risk: string;
    risk_reason: string;
  }[];
  weeklyForecast?: {
    day: string;
    tempMax: number;
    tempMin: number;
    condition: string;
    rainProb: number;
    risk: 'Low' | 'Moderate' | 'High';
  }[];
}

export interface IoTSensorData {
  deviceId: string;
  nodeName: string;
  lastUpdated: string;
  isOnline: boolean;
  batteryLevel: number;
  signalStrengthDbm: number;
  ambientTempC: number;
  soilTempC: number;
  ambientHumidityPct: number;
  soilMoisturePct: number;
  soilMoistureStatus: 'Dry' | 'Optimal' | 'Adequate' | 'Waterlogged';
  rainStatus: 'No Rain' | 'Light Rain' | 'Heavy Rain';
  rainIntensityMmHr: number;
  solarRadiationWm2: number;
  npk: {
    nitrogenMgKg: number;
    nitrogenStatus: 'Low' | 'Sufficient' | 'Optimal';
    phosphorusMgKg: number;
    phosphorusStatus: 'Low' | 'Sufficient' | 'Optimal';
    potassiumMgKg: number;
    potassiumStatus: 'Low' | 'Sufficient' | 'Optimal';
  };
  aiAdvisory: {
    en: string;
    hi: string;
    ta: string;
  };
}

export interface RemedyItem {
  id: string;
  name: string;
  activeIngredient?: string;
  dosageFormula: (sizeInAcres: number) => { amount: string; waterVolume: string };
  instructions: string;
  schedule: string;
  safetyCaution?: string;
  phiDays?: number; // Pre-Harvest Interval
  productLinkIds?: string[];
}

export interface DiseaseDiagnosis {
  id: string;
  cropId: string;
  cropName: { en: string; hi: string; ta: string };
  diseaseName: { en: string; hi: string; ta: string };
  scientificName: string;
  pathogenType: 'Fungus' | 'Bacterium' | 'Virus' | 'Pest' | 'Nutrient Deficiency';
  stage: 'Early Stage (Inception)' | 'Moderate Progression' | 'Severe Outbreak';
  confidence: number;
  incubationPeriod: string;
  spreadRiskRate: number; // e.g. 45% crop loss if untreated in 7 days
  earlyWarningAlert: { en: string; hi: string; ta: string };
  symptoms: { en: string[]; hi: string[]; ta: string[] };
  visualFeatures: string[];
  organicProtocol: {
    overview: { en: string; hi: string; ta: string };
    remedies: RemedyItem[];
  };
  chemicalProtocol: {
    overview: { en: string; hi: string; ta: string };
    remedies: RemedyItem[];
  };
  preventativeTips: { en: string[]; hi: string[]; ta: string[] };
  recommendedProductIds: string[];
  sampleImage: string;
}

export interface GeminiTreatment {
  immediate_steps: string;
  pesticide_name: string;
  active_ingredient?: string;
  category?: string;
  dosage: string;
  application_method: string;
  spray_timing?: string;
  precaution: string;
  phi_days?: string;
  organic_alternative?: string | null;
}

export interface ProgressionRisk {
  risk: 'No Risk' | 'Low Risk' | 'Medium Risk' | 'High Risk' | 'Severe Outbreak Risk' | string;
  progression_stage?: string;
  vulnerability_window?: string;
  message: string;
  pathology_factors?: string[];
  pesticide_recommendation?: GeminiTreatment | null;
  treatment?: GeminiTreatment | null;
}


export interface HistoryRecord {
  id: string;
  date: string;
  crop: string;
  diseaseName: string;
  stage: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  status: 'Resolved' | 'In Treatment' | 'Monitoring';
  fieldArea: string;
  treatmentChosen: 'Organic' | 'Chemical' | 'Combined';
  feedback: 'worked' | 'not_worked' | null;
  feedbackTimestamp?: string;
  confidenceScore: number;
  imageThumbnail: string;
}

export interface SmsAlert {
  id: string;
  timestamp: string;
  type: 'weather' | 'pest_alert' | 'treatment_reminder' | 'soil_advisory';
  urgency: 'high' | 'medium' | 'normal';
  title: { en: string; hi: string; ta: string };
  message: { en: string; hi: string; ta: string };
  actionRequired?: { en: string; hi: string; ta: string };
  isRead: boolean;
}

export interface MandiRecord {
  state: string;
  district: string;
  market: string;
  commodity: string;
  min_price: string | number;
  max_price: string | number;
  modal_price: string | number;
  arrival_date: string;
}

export interface PriceForecastResponse {
  crop: string;
  state: string;
  weekly_prices: { week: string; price: number }[];
  forecast: number[];
  trend: 'RISING' | 'FALLING' | 'STABLE';
  pct_change: number;
  verdict_title?: string;
  recommendation: string;
  record_count: number;
}

export interface CropAlertResponse {
  crop: string;
  alert_type: string;
  message: string;
  recommendation: string;
}


