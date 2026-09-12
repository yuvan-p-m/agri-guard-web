import React from 'react';
import { 
  FlaskConical, 
  Leaf, 
  AlertTriangle, 
  Droplets, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  Activity,
  Clock,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import type { Language, GeminiTreatment } from '../types';
import type { RawSensorData } from '../services/sensorService';
import { useAppTranslation } from '../i18n';

interface TreatmentDosageCardProps {
  treatment?: GeminiTreatment | null;
  sensorSnapshot?: RawSensorData | Record<string, any> | null;
  weatherSnapshot?: Record<string, any> | null;
  isHealthy?: boolean;
  isLoading?: boolean;
  language?: Language;
  acreage?: number;
}

export const TreatmentDosageCard: React.FC<TreatmentDosageCardProps> = ({
  treatment,
  sensorSnapshot,
  weatherSnapshot,
  isHealthy,
  isLoading,
  language = 'en',
  acreage,
}) => {
  const { t } = useAppTranslation();

  // 1. SKELETON LOADER while Gemini is loading
  if (isLoading) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200 space-y-5 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="space-y-2">
            <div className="w-56 h-5 bg-slate-200 rounded-lg" />
            <div className="w-36 h-3 bg-slate-100 rounded" />
          </div>
          <div className="w-28 h-6 bg-slate-100 rounded-full" />
        </div>

        {/* 1. Immediate Steps highlighted box skeleton */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-100 space-y-2">
          <div className="w-48 h-4 bg-amber-200/70 rounded" />
          <div className="w-full h-3 bg-amber-100 rounded" />
          <div className="w-3/4 h-3 bg-amber-100 rounded" />
        </div>

        {/* 2. Pesticide Name skeleton */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
          <div className="w-32 h-3 bg-slate-200 rounded" />
          <div className="w-48 h-5 bg-slate-300 rounded" />
        </div>

        {/* 3 & 4. Dosage & Application Method skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-24 h-3 bg-slate-200 rounded" />
            <div className="w-36 h-4 bg-slate-300 rounded" />
          </div>
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="w-28 h-3 bg-slate-200 rounded" />
            <div className="w-44 h-4 bg-slate-300 rounded" />
          </div>
        </div>

        {/* 5. Precaution skeleton */}
        <div className="p-3.5 rounded-2xl bg-rose-50/70 border border-rose-100 space-y-2">
          <div className="w-28 h-3 bg-rose-200/70 rounded" />
          <div className="w-full h-3 bg-rose-100 rounded" />
        </div>

        {/* 6. Organic alternative skeleton */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-2">
          <div className="w-36 h-3 bg-emerald-200/70 rounded" />
          <div className="w-3/4 h-3 bg-emerald-100 rounded" />
        </div>

        {/* Sensor proof line skeleton */}
        <div className="pt-2 border-t border-slate-100">
          <div className="w-72 h-3 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // 2. HEALTHY BANNER: If the crop is healthy and there is no treatment data
  if (isHealthy || (!treatment && isHealthy)) {
    return (
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 sm:p-8 shadow-xl text-white space-y-4 animate-slide-up border border-emerald-400/40">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md shrink-0 shadow-inner">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-black backdrop-blur-xs border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-citrus-300" />
              <span>{t('plantHealthVerified', 'Plant Health Verified by Gemini AI')}</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              {t('cropHealthyTitle', 'Your crop is healthy and no pesticide treatment is needed')}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed font-medium">
              {t('cropHealthyDesc', 'AgriGuard AI pathology assessment confirms normal, robust leaf tissue without active pathogen damage or infection progression. Continue regular irrigation, balanced soil nutrients, and routine field scouting.')}
            </p>
          </div>
        </div>

        {/* Sensor proof line below healthy banner */}
        <div className="pt-3 border-t border-white/20 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-100 font-mono">
          <span className="text-[11px] opacity-90">
            ⚡ {t('evaluatedWithSensors', 'Evaluated with live IoT micro-climate telemetry')}: {t('humidity', 'Humidity')}: <strong className="text-white font-bold">{sensorSnapshot?.humidity ?? '--'}%</strong> • {t('iotSoilTemp', 'Temperature')}: <strong className="text-white font-bold">{sensorSnapshot?.temperature ?? '--'}°C</strong> • {t('soilMoisture', 'Soil Moisture')}: <strong className="text-white font-bold">{sensorSnapshot?.moisture ?? '--'}%</strong>
          </span>
          <span className="text-[10px] font-sans font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-white/20">
            {t('liveFirebaseSensors', 'Live Firebase Sensors')}
          </span>
        </div>
      </div>
    );
  }

  // 3. If no treatment object exists yet (e.g. initial unscanned state)
  if (!treatment) {
    return null;
  }

  const immediateSteps = treatment.immediate_steps || 'Apply recommended dosage evenly across the affected foliage during morning hours.';
  const pesticideName = treatment.pesticide_name || 'Recommended Agrochemical Formulation';
  const activeIngredient = treatment.active_ingredient;
  const category = treatment.category;
  const dosageText = treatment.dosage || '2 - 2.5 ml/g per liter of clean water';
  const appMethod = treatment.application_method || 'Foliar spray with uniform canopy coverage';
  const sprayTiming = treatment.spray_timing;
  const phiDays = treatment.phi_days;
  const precautionText = treatment.precaution || 'Wear protective mask and gloves. Avoid spraying in high wind or midday sun.';

  const hasOrganicAlternative = Boolean(
    treatment.organic_alternative &&
    treatment.organic_alternative.trim() !== '' &&
    treatment.organic_alternative.toLowerCase() !== 'null' &&
    treatment.organic_alternative.toLowerCase() !== 'none' &&
    treatment.organic_alternative.toLowerCase() !== 'n/a'
  );

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-agri-200/80 space-y-5 animate-slide-up">
      
      {/* Title & Powered By Gemini Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              {t('prescriptionDosageProtocol', 'Prescription & Targeted Pesticide Protocol')}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-agri-50 text-agri-800 text-[10px] font-bold border border-agri-200">
              <Sparkles className="w-3 h-3 text-agri-600" /> {t('liveGeminiAi', 'Live Gemini AI')}
            </span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-0.5">
            <FlaskConical className="w-5 h-5 text-agri-700" />
            <span>{t('precisionTreatment', 'Targeted Pesticide & Treatment Recommendation')}</span>
          </h3>
        </div>

        {acreage && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 self-start sm:self-auto">
            {t('targetField', 'Target Field')}: <strong className="text-slate-900">{acreage} {t('acresUnit', 'Acres')}</strong>
          </span>
        )}
      </div>

      {/* 1. IMMEDIATE STEPS in a highlighted box at the top */}
      <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/95 border-2 border-amber-200/90 shadow-sm space-y-1.5">
        <div className="flex items-center gap-2 text-amber-950 font-black text-xs sm:text-sm uppercase tracking-wider">
          <Zap className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{t('immediateStepsTitle', 'Immediate Steps (Do Right Now)')}</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-950 font-semibold leading-relaxed whitespace-pre-line">
          {immediateSteps}
        </p>
      </div>

      {/* 2. PESTICIDE FORMULATION & ACTIVE INGREDIENT */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
            {t('targetedChemicalTitle', 'Recommended Pesticide Formulation')}
          </span>
          {category && (
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-900 border border-blue-200">
              {category}
            </span>
          )}
        </div>
        <h4 className="text-base sm:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-agri-700 shrink-0" />
          <span>{pesticideName}</span>
        </h4>
        {activeIngredient && (
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-500">{t('activeIngredientLabel', 'Active Ingredient')}:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-800 font-semibold">
              {activeIngredient}
            </span>
          </div>
        )}
      </div>

      {/* 3 & 4. DOSAGE and APPLICATION METHOD */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* 3. Dosage */}
        <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-agri-600" />
            {t('dosageTitle', 'Precision Dosage')}
          </span>
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
            {dosageText}
          </p>
        </div>

        {/* 4. Application Method */}
        <div className="p-4 rounded-2xl bg-slate-50/90 border border-slate-200/80 space-y-1">
          <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Droplets className="w-3.5 h-3.5 text-blue-600" />
            {t('applicationMethodTitle', 'Application Method')}
          </span>
          <p className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
            {appMethod}
          </p>
        </div>
      </div>

      {/* 5. WEATHER-OPTIMIZED SPRAY TIMING */}
      {sprayTiming && (
        <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200/90 flex items-start gap-3 text-indigo-950">
          <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-700 block">
              {t('sprayTimingTitle', 'Weather-Optimized Spray Window')}
            </span>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-indigo-950">
              {sprayTiming}
            </p>
          </div>
        </div>
      )}

      {/* 6. PRECAUTION & PHI */}
      <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200/90 flex items-start gap-3 text-rose-900">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        <div className="space-y-1 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
              {t('safetyPrecautionTitle', 'Safety Precautions & PHI')}
            </span>
            {phiDays && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-950">
                <Calendar className="w-3 h-3 text-rose-700" /> {t('phiLabel', 'Pre-Harvest Interval')}: <strong>{phiDays}</strong>
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm font-semibold leading-relaxed text-rose-900">
            {precautionText}
          </p>
        </div>
      </div>

      {/* 7. ORGANIC ALTERNATIVE in green only if it exists */}
      {hasOrganicAlternative && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-950">
          <Leaf className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 block">
              {t('organicAlternativeTitle', 'Organic / Bio-Control Alternative')}
            </span>
            <p className="text-xs sm:text-sm font-bold leading-relaxed text-emerald-950">
              {treatment.organic_alternative}
            </p>
          </div>
        </div>
      )}

      {/* SENSOR & WEATHER PROOF LINE */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-mono">
        <span>
          ⚡ {t('evaluatedWithSensors', 'Evaluated with live IoT micro-climate telemetry')}: {t('humidity', 'Humidity')}: <strong className="text-slate-800 font-bold">{sensorSnapshot?.humidity ?? '--'}%</strong> • {t('iotSoilTemp', 'Temperature')}: <strong className="text-slate-800 font-bold">{sensorSnapshot?.temperature ?? '--'}°C</strong> • {t('soilMoisture', 'Soil Moisture')}: <strong className="text-slate-800 font-bold">{sensorSnapshot?.moisture ?? '--'}%</strong>
        </span>
        <span className="text-[10px] font-sans font-black text-agri-800 bg-agri-50 px-2 py-0.5 rounded border border-agri-200">
          {t('liveSensorTelemetry', 'Live Sensor Telemetry')}
        </span>
      </div>
    </div>
  );
};

