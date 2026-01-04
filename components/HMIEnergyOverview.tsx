import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, ComposedChart, Bar, Cell
} from 'recharts';
import {
  Play, Pause, X, AlertTriangle,
  Sun, Wind, Waves, Zap, Activity, Droplets, RotateCcw, BatteryCharging,
  Thermometer, Gauge, Settings, Info, CloudSun, Leaf
} from 'lucide-react';
import { generateDayData, EnergyDataPoint } from '../utils/energySimulation';

// --- Types ---

interface HMIEnergyOverviewProps {
  onClose: () => void;
}

// --- Gauge Component ---
const PowerGauge: React.FC<{
  title: string;
  value: number;
  max: number;
  unit: string;
  color: string;
  icon: React.ReactNode;
}> = ({ title, value, max, unit, color, icon }) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  // Semi-circle circumference: PI * r
  const radius = 35;
  const circumference = Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="bg-white/80 rounded-xl p-3 flex items-center gap-3 border border-slate-200 shadow-sm backdrop-blur min-w-[160px]">
      <div className="relative w-16 h-10 flex items-end justify-center">
        <svg className="w-16 h-16 absolute top-0" viewBox="0 0 100 60">
          {/* Background Track */}
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
          {/* Value Track */}
          <path
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={251} // 40 * PI * 2 approx but for semi circle
            style={{
              strokeDasharray: `126`, // PI * 40
              strokeDashoffset: (126 * (1 - percentage / 100)),
              transition: 'stroke-dashoffset 0.5s ease'
            }}
          />
        </svg>
        <div className="text-[10px] font-bold text-slate-500 mb-1">{percentage.toFixed(0)}%</div>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-1 text-slate-500 text-xs mb-0.5">
          {icon} {title}
        </div>
        <div className="text-lg font-bold font-mono text-slate-800">
          {value.toFixed(1)} <span className="text-xs text-slate-400">{unit}</span>
        </div>
      </div>
    </div>
  );
};

// --- Sub-Component: PSK Detail View (Interface 2) ---
// Updated to reflect real physical parameters from datasheet
const PSKDetailView: React.FC<{
  data: EnergyDataPoint,
  onBack: () => void
}> = ({ data, onBack }) => {
  // --- Discharge State & Animation Logic ---
  const [isDischarging, setIsDischarging] = useState(false);

  // Simulated physics values
  const [simRpm, setSimRpm] = useState(0);
  const [simFlow, setSimFlow] = useState(0);
  const [simPower, setSimPower] = useState(0);

  // Initialize values when data changes (if not discharging)
  useEffect(() => {
    if (!isDischarging) {
      const targetRpm = Math.abs(data.pskPower * 150);
      const targetFlow = data.flowRate;
      const targetPower = Math.abs(data.pskPower);

      setSimRpm(targetRpm);
      setSimFlow(targetFlow);
      setSimPower(targetPower);
    }
  }, [data, isDischarging]);

  // Discharge Animation Loop (Inertia & Level Drop)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isDischarging) {
       interval = setInterval(() => {
          // Physics sim
          setSimRpm(prev => Math.max(0, prev * 0.95)); 
          setSimPower(prev => Math.max(0, prev * 0.8)); 
          setSimFlow(prev => (prev < 4.0 ? prev + 0.5 : 4.86));
          
          // Increase offset (drop level)
          setLevelOffset(prev => prev + 0.2); 
       }, 100);
    }
    return () => clearInterval(interval);
  }, [isDischarging]);

  // Derived state for display
  const isPumping = data.pskPower < -0.1;
  
  // Local level override for discharge visualization
  const [levelOffset, setLevelOffset] = useState(0);
  const visualLevel = Math.max(0, data.waterLevel - levelOffset);
  
  // Reset logic is implicit: when isDischarging becomes false, we STOP increasing the offset.
  // But we DO NOT reset the offset to 0. This preserves the drained state.

  // Level color
  const levelColor = visualLevel > 90 ? '#ef4444' : (visualLevel > 70 ? '#f59e0b' : '#3b82f6');

  return (
    <div className="absolute inset-0 bg-slate-100 text-slate-800 z-50 flex flex-col p-8 overflow-y-auto animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Droplets className="w-8 h-8 text-blue-600" />
            Pumpspeicherkraftwerk (PSK) Monitor
          </h2>
          <p className="text-slate-500 mt-1">Digital Twin & Control System • 20MW Pelton Storage</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
            <Thermometer className="text-blue-500 w-5 h-5" />
            <div>
              <div className="text-xs text-slate-400">Außentemp.</div>
              <div className="font-mono font-bold text-slate-700">{data.temperature.toFixed(1)}°C</div>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-6 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-200 shadow-sm transition-colors"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1">

        {/* Column 1: Technical Data (New Panel) */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-6 flex items-center gap-2 border-b border-slate-100 pb-2 text-slate-700">
            <Info className="w-5 h-5 text-blue-500" />
            Anlagendaten
          </h3>

          <div className="space-y-4 text-sm">
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Typ</span>
              <span className="font-bold text-slate-800">Speicher (PSK)</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Brutto-Fallhöhe</span>
              <span className="font-bold text-blue-600 font-mono">508.41 m</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Turbine</span>
              <span className="font-bold text-slate-800 text-right">2x Pelton<br /><span className="text-xs text-slate-400 font-normal">Alstom</span></span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Nennleistung</span>
              <span className="font-bold text-slate-800 font-mono">20.0 MW</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Max. Durchfluss</span>
              <span className="font-bold text-slate-800 font-mono">4.86 m³/s</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-500">Investition</span>
              <span className="font-bold text-slate-800 font-mono">82 Mio €</span>
            </div>
          </div>

          <div className="mt-auto pt-6">
            <div className="text-xs text-slate-400 mb-2">Systemstatus</div>
            <div className={`flex items-center gap-2 p-2 rounded border ${isDischarging ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-green-50 border-green-200 text-green-700'}`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${isDischarging ? 'bg-amber-500' : 'bg-green-500'}`}></div>
              <span className="font-mono font-bold">{isDischarging ? 'NOTABLASS AKTIV' : 'NORMALBETRIEB'}</span>
            </div>
          </div>
        </div>

        {/* Column 2: Reservoir Status */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col items-center justify-center relative">
          <h3 className="text-xl font-semibold mb-6 w-full text-left border-b border-slate-100 pb-2 text-slate-700">Oberbecken</h3>

          {/* Visual Tank */}
          <div className="w-full max-w-[180px] h-80 bg-slate-100 rounded-lg border-4 border-slate-300 relative overflow-hidden shadow-inner">
            {/* Water */}
            <div
              className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-in-out"
              style={{
                height: `${visualLevel}%`,
                backgroundColor: levelColor,
                opacity: 0.8
              }}
            >
              {/* Bubbles animation if pumping */}
              {(isPumping || isDischarging) && (
                <div className="w-full h-full animate-pulse opacity-30 bg-white/40" />
              )}
            </div>
            
            {/* Level Markers */}
            <div className="absolute right-0 top-[10%] w-full border-t border-dashed border-red-400/80"></div>
            <div className="absolute right-2 top-[10%] text-xs text-red-500 -mt-4 font-bold">90% MAX</div>
          </div>
          
          <div className="mt-4 text-4xl font-mono font-bold text-slate-800">
            {visualLevel.toFixed(1)}%
          </div>
          <div className={`mt-2 px-3 py-1 rounded-full text-sm font-bold ${visualLevel > 90 ? 'bg-red-100 text-red-600 animate-pulse border border-red-200' : 'bg-green-100 text-green-600 border border-green-200'}`}>
            {visualLevel > 90 ? 'LEVEL CRITICAL' : 'LEVEL NORMAL'}
          </div>
        </div>

        {/* Column 3: Turbine/Pump Operations */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-6 border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-700">
            <Settings className="w-5 h-5 text-blue-500" />
            Betrieb (Live)
          </h3>

          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            {/* Main Gauge Cluster */}
            <div className="grid grid-cols-1 gap-4 w-full">
              {/* RPM Gauge */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase font-bold mb-2">Drehzahl (RPM)</span>
                <div className="relative w-32 h-16 flex items-end justify-center overflow-hidden">
                  <div className="absolute top-0 w-32 h-32 rounded-full border-[12px] border-slate-200 border-b-0 border-l-0 border-r-0" style={{ transform: 'rotate(-90deg)' }}></div>
                  <div
                    className="absolute top-0 w-32 h-32 rounded-full border-[12px] border-blue-500 border-b-0 border-l-0 border-r-0 transition-all duration-100"
                    style={{
                      transform: `rotate(${-180 + (simRpm / 3500) * 180}deg)`,
                      clipPath: 'polygon(0 0, 100% 0, 100% 50%, 0 50%)'
                    }}
                  ></div>
                  <div className="text-2xl font-bold font-mono z-10">{simRpm.toFixed(0)}</div>
                </div>
              </div>

              {/* Power Gauge */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase font-bold mb-2">Leistung (MW)</span>
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(simPower / 25) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 font-mono font-bold text-xl">{simPower.toFixed(2)} MW</div>
              </div>

              {/* Flow Gauge */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center">
                <span className="text-xs text-slate-500 uppercase font-bold mb-2">Durchfluss (m³/s)</span>
                <div className="w-full h-4 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${(simFlow / 6) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-1 font-mono font-bold text-xl">{simFlow.toFixed(2)} m³/s</div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 4: Control Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-xl font-semibold mb-6 border-b border-slate-100 pb-2 flex items-center gap-2 text-slate-700">
            <Gauge className="w-5 h-5 text-blue-500" />
            Steuerung
          </h3>

          <div className="flex-1 flex flex-col gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-500">Modus</span>
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs uppercase font-bold border border-blue-200">Remote / Auto</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Netzwerk</span>
                <span className="flex items-center text-green-600 text-xs gap-1 font-medium">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                  Verbunden
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex-1">
              <div className="text-xs text-slate-400 mb-2 font-bold uppercase tracking-wider">Letzte Ereignisse</div>
              <div className="space-y-2 text-xs font-mono">
                <div className="text-slate-600 border-l-2 border-amber-400 pl-2">[13:42] Warnung: Level &gt; 90%</div>
                <div className="text-slate-400 border-l-2 border-slate-300 pl-2">[13:40] Pumpenstart seq. 2</div>
                <div className="text-slate-400 border-l-2 border-slate-300 pl-2">[13:15] Sollwert empfangen</div>
              </div>
            </div>

            <div className="mt-auto space-y-4">
              <button
                onClick={() => setIsDischarging(!isDischarging)}
                className={`w-full py-6 rounded-xl font-bold text-xl shadow-lg transition-all transform active:scale-95 ${isDischarging
                  ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                  : 'bg-red-500 hover:bg-red-600 text-white animate-pulse shadow-red-200'
                  }`}
              >
                {isDischarging ? 'SYSTEM RESET' : 'NOTABLASS (Notentleerung)'}
              </button>

              <p className="text-[10px] text-slate-400 text-center leading-tight">
                Bei Erreichen des maximalen Füllstands (100%) wird der Notablass aktiviert, um das Oberbecken über den Bypass zu entleeren. Die Turbine geht in den Leerlauf (Auslaufbetrieb).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


// --- Main Component ---

export const HMIEnergyOverview: React.FC<HMIEnergyOverviewProps> = ({ onClose }) => {
  // Data
  const dayData = useMemo(() => generateDayData(), []);

  // State
  const [timeIndex, setTimeIndex] = useState(0); // 0 to dayData.length - 1
  const [isPlaying, setIsPlaying] = useState(false);
  const [view, setView] = useState<'OVERVIEW' | 'PSK_DETAIL'>('OVERVIEW');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const currentData = dayData[timeIndex];

  // Derived Values
  const isDaytime = currentData.time > 8.0 && currentData.time < 16.5;
  const isWarning = currentData.waterLevel >= 90;

  // Background Gradient Logic
  // Night: #1e293b (slate-800) -> #0f172a (slate-900)
  // Day: #e0f2fe (sky-100) -> #f0f9ff (sky-50)
  // Transition should be smooth based on time
  const getBackgroundColor = () => {
    // Simple logic: if between 8 and 16, interpolate to white/blue.
    // Transition period: 7-9 and 15-17.

    // Normalized "Dayness" 0 to 1
    // Peak day at 12.0
    // Sigma roughly 4 hours
    const center = 12;
    const dayness = Math.exp(-Math.pow(currentData.time - center, 2) / 16);

    // This gives a value 0..1. 1 = Noon, 0 = Midnight.
    // CSS variable interpolation would be ideal, but let's use style objects or classes.
    return dayness; // We'll use this for opacity of a white overlay
  };

  const dayness = getBackgroundColor();

  // Timer Effect
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setTimeIndex(prev => {
          if (prev >= dayData.length - 1) return 0;
          return prev + 1;
        });
      }, 100); // Speed of simulation
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, dayData.length]);

  // Pause if warning happens? Optional. Let's not pause, let user react.

  // Handlers
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTimeIndex(parseInt(e.target.value));
  };

  const handleAlertClick = () => {
    setIsPlaying(false);
    setView('PSK_DETAIL');
  };

  if (view === 'PSK_DETAIL') {
    return <PSKDetailView data={currentData} onBack={() => setView('OVERVIEW')} />;
  }

  return (
    <div className="absolute inset-0 z-50 overflow-hidden flex flex-col transition-colors duration-1000"
      style={{
        background: `linear-gradient(to bottom, 
             rgba(15, 23, 42, 1) 0%, 
             rgba(30, 41, 59, 1) 100%)`
      }}>

      {/* Day Overlay (White/Blue) - Opacity controlled by time */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: dayness,
          background: `linear-gradient(to bottom, #e0f2fe 0%, #f8fafc 100%)`
        }}
      />

      {/* Header */}
      <div className="relative z-10 flex justify-between items-center px-8 py-4 border-b border-black/10 shadow-sm backdrop-blur-sm">
        <div>
          <h1 className={`text-2xl font-bold ${dayness > 0.5 ? 'text-slate-800' : 'text-slate-100'}`}>
            Energie-Management-System (HMI)
          </h1>
          <p className={`text-sm ${dayness > 0.5 ? 'text-slate-600' : 'text-slate-400'}`}>
            Application Layer Visualization • {currentData.timeLabel} Uhr
          </p>
        </div>

        <div className="flex items-center gap-4">
          {/* Current Stats Summary */}
          <div className={`flex gap-4 px-4 py-2 rounded-lg ${dayness > 0.5 ? 'bg-white/50' : 'bg-slate-800/50 text-white'}`}>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span className="font-mono">{currentData.totalGen.toFixed(1)} MW Gen</span>
            </div>
            <div className="w-px bg-current opacity-20"></div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              <span className="font-mono">{currentData.load.toFixed(1)} MW Last</span>
            </div>
          </div>

          <button onClick={onClose} className={`p-2 rounded-full hover:bg-black/10 ${dayness > 0.5 ? 'text-slate-800' : 'text-white'}`}>
            <X />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6 gap-6 overflow-hidden">

        {/* Top Row: Graphs */}
        <div className="flex-1 flex gap-6 min-h-0">

          {/* Chart 1: Generation vs Load */}
          <div className={`flex-1 rounded-2xl p-4 shadow-lg flex flex-col ${dayness > 0.5 ? 'bg-white/80' : 'bg-slate-800/80 text-white'}`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" /> Erzeugung vs. Last
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPV" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#eab308" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} interval={24} />
                  <YAxis unit=" MW" />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', color: '#000' }}
                    labelStyle={{ color: '#666' }}
                  />
                  <Legend />

                  {/* Stacked Areas */}
                  <Area type="monotone" dataKey="wind" stackId="1" stroke="#0ea5e9" fill="url(#colorWind)" name="Windpark (40MW)" />
                  <Area type="monotone" dataKey="wave" stackId="1" stroke="#3b82f6" fill="url(#colorWave)" name="Wellen (40MW)" />
                  <Area type="monotone" dataKey="pv" stackId="1" stroke="#eab308" fill="url(#colorPV)" name="PV (20MW)" />

                  {/* Load Line */}
                  <Line type="monotone" dataKey="load" stroke="#ef4444" strokeWidth={3} dot={false} name="Gesamtlast" />

                  {/* Time Indicator - ReferenceLine removed due to React 19 incompatibility */}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: PSK & Level */}
          <div className={`flex-1 rounded-2xl p-4 shadow-lg flex flex-col ${dayness > 0.5 ? 'bg-white/80' : 'bg-slate-800/80 text-white'}`}>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BatteryCharging className="w-5 h-5" /> PSK Speicher & Füllstand
            </h3>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dayData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="timeLabel" tick={{ fontSize: 12 }} interval={24} />
                  <YAxis yAxisId="left" orientation="left" label={{ value: 'Leistung (MW)', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} unit="%" label={{ value: 'Füllstand (%)', angle: 90, position: 'insideRight' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', color: '#000' }}
                  />
                  <Legend />

                  {/* Power Bar (Negative = Pump, Positive = Gen) */}
                  <Bar yAxisId="left" dataKey="pskPower" name="PSK Leistung (+Gen/-Pump)" fill="#8884d8">
                    {
                      dayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.pskPower > 0 ? '#22c55e' : '#3b82f6'} />
                      ))
                    }
                  </Bar>

                  {/* Level Line */}
                  <Line yAxisId="right" type="monotone" dataKey="waterLevel" stroke="#8b5cf6" strokeWidth={3} dot={false} name="Füllstand (%)" />

                  {/* Time Indicator - ReferenceLine removed due to React 19 incompatibility */}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Middle Row: Live Station Gauges */}
        <div className="flex gap-4 overflow-x-auto pb-2">
          <PowerGauge
            title="Windpark"
            value={currentData.wind}
            max={40}
            unit="MW"
            color="#0ea5e9"
            icon={<Wind size={12} />}
          />
          <PowerGauge
            title="Wellenkraft"
            value={currentData.wave}
            max={40}
            unit="MW"
            color="#3b82f6"
            icon={<Waves size={12} />}
          />
          <PowerGauge
            title="PV-Anlage"
            value={currentData.pv}
            max={20}
            unit="MW"
            color="#eab308"
            icon={<Sun size={12} />}
          />
          <PowerGauge
            title="Gesamtlast"
            value={currentData.load}
            max={100}
            unit="MW"
            color="#ef4444"
            icon={<Activity size={12} />}
          />
          <div className="w-px bg-slate-500/30 mx-2"></div>
          <PowerGauge
            title="Netto-Bilanz"
            value={Math.abs(currentData.netPower)}
            max={60}
            unit="MW"
            color={currentData.netPower > 0 ? '#22c55e' : '#ef4444'}
            icon={<Zap size={12} />}
          />
        </div>

        {/* Bottom Control Bar */}
        <div className={`h-24 rounded-2xl flex items-center px-8 gap-8 shadow-lg transition-all ${isWarning ? 'bg-red-500/10 border-2 border-red-500' : (dayness > 0.5 ? 'bg-white/90' : 'bg-slate-800/90 text-white')}`}>

          {/* Play Controls */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-4 rounded-full shadow-md transition-transform hover:scale-105 ${dayness > 0.5 ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`}
            >
              {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" />}
            </button>
          </div>

          {/* Slider */}
          <div className="flex-1 flex flex-col gap-2">
            <div className="flex justify-between text-sm font-mono opacity-70">
              <span>00:00</span>
              <span className="font-bold text-lg">{currentData.timeLabel}</span>
              <span>24:00</span>
            </div>
            <input
              type="range"
              min="0"
              max={dayData.length - 1}
              value={timeIndex}
              onChange={handleSliderChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
            />
          </div>

          {/* Status Indicators */}
          <div className="flex gap-6">
            {/* PSK Control Button - always accessible */}
            <button
              onClick={() => setView('PSK_DETAIL')}
              className={`flex flex-col items-center min-w-[100px] p-2 rounded-lg cursor-pointer transition-all hover:scale-105 ${dayness > 0.5 ? 'bg-blue-100 hover:bg-blue-200 text-blue-700' : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30'}`}
            >
              <Droplets className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">PSK Steuerung</span>
            </button>

            <div className="flex flex-col items-center min-w-[80px]">
              <Sun className={`w-6 h-6 mb-1 ${isDaytime ? 'text-yellow-500 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-xs font-bold">{isDaytime ? 'TAG' : 'NACHT'}</span>
            </div>

            <div className={`flex flex-col items-center min-w-[100px] p-2 rounded-lg cursor-pointer transition-all ${isWarning ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50' : 'opacity-50 grayscale'}`}
              onClick={isWarning ? handleAlertClick : undefined}
            >
              <AlertTriangle className="w-6 h-6 mb-1" />
              <span className="text-xs font-bold">{isWarning ? 'ALARM!' : 'SYSTEM OK'}</span>
              {isWarning && <span className="text-[10px] uppercase mt-1">Click to Inspect</span>}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
