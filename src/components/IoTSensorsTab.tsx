import React, { useEffect, useState } from 'react';
import {
  Cpu,
  Wifi,
  RefreshCw,
  Thermometer,
  Droplets,
  CloudRain,
  Activity,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Radio,
  ArrowRight,
  Power,
  Zap,
} from 'lucide-react';
import type { HardwareState, Language } from '../types';
import { useAppTranslation } from '../i18n';
import {
  subscribeToLiveSensors,
  fetchSensorSnapshotOnce,
  type InterpretedSensorSnapshot,
  type SensorStatus,
} from '../services/sensorService';

interface IoTSensorsTabProps {
  language: Language;
  onNavigateToDiagnosis?: () => void;
  hardwareState: HardwareState;
  onPairHardware: () => void;
}

export const IoTSensorsTab: React.FC<IoTSensorsTabProps> = ({
  language,
  onNavigateToDiagnosis,
  hardwareState,
  onPairHardware,
}) => {
  const { t } = useAppTranslation();
  const [snapshot, setSnapshot] = useState<InterpretedSensorSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('Connecting...');

  // Live listener to Firebase Realtime Database (`sensors` path)
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToLiveSensors((data) => {
      setSnapshot(data);
      setIsLoading(false);
      setIsRefreshing(false);
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchSensorSnapshotOnce();
      setSnapshot(data);
      setLastSyncTime(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Manual refresh failed:', e);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: SensorStatus) => {
    switch (status) {
      case 'Optimal':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Optimal</span>
          </span>
        );
      case 'Low':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            <span>Low</span>
          </span>
        );
      case 'High':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-orange-100 text-orange-900 border border-orange-300 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-orange-600" />
            <span>High</span>
          </span>
        );
      case 'Critical':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-900 border border-rose-300 flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Critical</span>
          </span>
        );
      case 'No reading':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-300 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>No reading</span>
          </span>
        );
    }
  };

  const readings = snapshot?.readings || {};

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* 3 or more zero/no-reading warning banner */}
      {snapshot?.hardwareWarning && (
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 sm:p-5 shadow-lg flex items-start gap-3.5">
          <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-1">
            <h4 className="text-sm font-black text-amber-900 tracking-tight">Hardware Connection Alert</h4>
            <p className="text-xs sm:text-sm text-amber-800 font-medium leading-relaxed">
              {snapshot.hardwareWarning}
            </p>
          </div>
        </div>
      )}

      {/* Header card with status & stream information */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-agri-200/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border shadow-2xs ${
                  snapshot?.available
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                    : 'bg-rose-100 text-rose-900 border-rose-300'
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    snapshot?.available ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'
                  }`}
                />
                <span>
                  {snapshot?.available ? 'Live Firebase Stream: Connected' : 'Firebase Stream: Disconnected'}
                </span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold font-mono border border-slate-200">
                <Radio className="w-3.5 h-3.5 text-blue-600" />
                <span>RS485 7-in-1 Modbus</span>
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{t.iotTitle}</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium max-w-2xl leading-relaxed">
              Streaming real-time micro-climate and soil chemical readings directly from your connected field sensor node.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
            {!hardwareState.isConnected && (
              <button
                type="button"
                onClick={onPairHardware}
                className="px-4 py-2 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white text-xs font-black shadow-md shadow-agri-700/25 transition-all flex items-center gap-1.5"
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>{hardwareState.deviceId || 'Pair Hardware'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="px-4 py-2 rounded-2xl bg-agri-700 hover:bg-agri-800 text-white text-xs font-black shadow-md shadow-agri-700/25 transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-75"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold text-slate-700">Firebase RTDB: /sensors</span>
            <span className="text-slate-400">• Last Sync: {lastSyncTime}</span>
          </div>
          <span className="font-mono text-[11px] text-agri-800 bg-agri-50 px-2 py-0.5 rounded-md border border-agri-200 font-bold">
            Live onValue Listener Active
          </span>
        </div>
      </div>

      {/* Loading or Data Unavailable fallback */}
      {isLoading && !snapshot && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-12 text-center shadow-lg border border-slate-200 space-y-3">
          <RefreshCw className="w-8 h-8 text-agri-600 animate-spin mx-auto" />
          <p className="text-sm font-black text-slate-700">Connecting to Firebase Realtime Database...</p>
          <p className="text-xs text-slate-500">Listening for live packets from your ESP32 soil sensor.</p>
        </div>
      )}

      {snapshot && !snapshot.available && (
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-10 text-center shadow-lg border border-rose-200 space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="text-base font-black text-slate-800">Sensor Data Unavailable</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Unable to stream live data from Firebase Realtime Database. Please verify your internet connection and ESP32 power.
          </p>
          <button
            type="button"
            onClick={handleManualRefresh}
            className="px-5 py-2.5 rounded-2xl bg-agri-700 text-white text-xs font-black shadow-md hover:bg-agri-800 transition-all"
          >
            Retry Connection
          </button>
        </div>
      )}

      {snapshot && snapshot.available && (
        <>
          {/* Micro-climate Sensors Grid (Temperature, Humidity, Soil Moisture, EC) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Soil pH */}
            {readings.ph && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 flex flex-col justify-between space-y-3 hover:border-agri-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
                      pH
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Soil pH</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Acidity / Alkalinity</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.ph.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {readings.ph.displayValue}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Optimal Range: 6.0 – 7.5</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.ph.explanation}
                </p>
              </div>
            )}

            {/* 2. Air Humidity */}
            {readings.humidity && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 flex flex-col justify-between space-y-3 hover:border-agri-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Air Humidity</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Ambient Relative Humidity</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.humidity.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {readings.humidity.displayValue} <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Optimal Range: 40% – 70%</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.humidity.explanation}
                </p>
              </div>
            )}

            {/* 3. Air Temperature */}
            {readings.temperature && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 flex flex-col justify-between space-y-3 hover:border-agri-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                      <Thermometer className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Temperature</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Ambient Canopy Temp</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.temperature.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {readings.temperature.displayValue} <span className="text-sm font-semibold text-slate-500">°C</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Optimal Range: 18°C – 30°C</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.temperature.explanation}
                </p>
              </div>
            )}

            {/* 4. Soil Moisture */}
            {readings.moisture && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 flex flex-col justify-between space-y-3 hover:border-agri-400 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                      <Droplets className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Soil Moisture</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Volumetric Water Content</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.moisture.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-3xl font-black text-slate-900 font-mono">
                    {readings.moisture.displayValue} <span className="text-sm font-semibold text-slate-500">%</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Optimal Range: 40% – 60%</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.moisture.explanation}
                </p>
              </div>
            )}
          </div>

          {/* NPK Macronutrients Section */}
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl border border-slate-200/90 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900">
                    Soil N-P-K Macronutrients (mg/kg dry soil)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    RS485 Modbus Optical 7-in-1 Soil Sensor Telemetry
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-agri-900 bg-agri-50 px-3 py-1 rounded-xl border border-agri-200 self-start sm:self-auto">
                Probe: Live Modbus
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Nitrogen (N) */}
              {readings.nitrogen && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Nitrogen (N)</span>
                    {getStatusBadge(readings.nitrogen.status)}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.nitrogen.displayValue} <span className="text-xs text-slate-500 font-normal">mg/kg</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {readings.nitrogen.explanation}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200">
                    Standard range: 80 – 200 mg/kg
                  </p>
                </div>
              )}

              {/* Phosphorus (P) */}
              {readings.phosphorous && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Phosphorus (P)</span>
                    {getStatusBadge(readings.phosphorous.status)}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.phosphorous.displayValue} <span className="text-xs text-slate-500 font-normal">mg/kg</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {readings.phosphorous.explanation}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200">
                    Standard range: 40 – 100 mg/kg
                  </p>
                </div>
              )}

              {/* Potassium (K) */}
              {readings.potassium && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-800">Potassium (K)</span>
                    {getStatusBadge(readings.potassium.status)}
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.potassium.displayValue} <span className="text-xs text-slate-500 font-normal">mg/kg</span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium leading-snug">
                    {readings.potassium.explanation}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200">
                    Standard range: 100 – 250 mg/kg
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* EC, Rain, and Pump Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Electrical Conductivity (EC) */}
            {readings.ec && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                      <Zap className="w-4 h-4 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Conductivity (EC)</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Salinity & Total Dissolved Solids</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.ec.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.ec.displayValue} <span className="text-xs font-semibold text-slate-500">µS/cm</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Optimal: 50 – 200 µS/cm</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.ec.explanation}
                </p>
              </div>
            )}

            {/* Rain Sensor */}
            {readings.rain && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                      <CloudRain className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Rain Sensor</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Precipitation Detector</p>
                    </div>
                  </div>
                  {getStatusBadge(readings.rain.status)}
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.rain.displayValue}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Live Weather Sensor</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.rain.explanation}
                </p>
              </div>
            )}

            {/* Pump Status */}
            {readings.pump && (
              <div className="bg-white/95 backdrop-blur-md rounded-3xl p-5 shadow-lg border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                      <Power className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Irrigation Pump</h3>
                      <p className="text-[10px] text-slate-400 font-medium">Relay Switch State</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                      readings.pump.displayValue === 'ON'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-slate-100 text-slate-700 border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        readings.pump.displayValue === 'ON' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                      }`}
                    />
                    <span>{readings.pump.displayValue}</span>
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {readings.pump.displayValue === 'ON' ? 'Active' : 'Standby'}
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">Automated / Manual Relay</span>
                </div>

                <p className="text-[11px] text-slate-600 font-medium leading-snug">
                  {readings.pump.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Action callout */}
          <div className="bg-gradient-to-r from-agri-900 via-agri-800 to-agri-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl border border-agri-700/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h4 className="text-base font-black text-citrus-300">Run Vision Diagnosis with Field Data</h4>
              <p className="text-xs text-agri-100 max-w-xl">
                Combine your live micro-climate sensor data with computer-vision leaf diagnosis to calculate accurate disease progression risk.
              </p>
            </div>
            {onNavigateToDiagnosis && (
              <button
                type="button"
                onClick={onNavigateToDiagnosis}
                className="px-5 py-3 rounded-2xl bg-citrus-500 hover:bg-citrus-400 text-slate-950 text-xs font-black shadow-md transition-all flex items-center gap-2 shrink-0"
              >
                <span>Diagnose Crop</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
