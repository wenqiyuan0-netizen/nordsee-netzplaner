import React, { useState } from 'react';
import { Station, StationType, NetworkCalculation, GridNode, LatLng } from '../types';
import { StationIconConfig } from './Icons';
import { Trash2, Plus, AlertTriangle, CheckCircle, MapPin, Save, X, Ruler, Move } from 'lucide-react';
import { getDistance } from '../utils/geometry';

interface SidebarProps {
  stations: Station[];
  calculations: Record<string, NetworkCalculation>;
  mode: 'VIEW' | 'ADD_NODE' | 'ADD_LINK' | 'ADD_STATION' | 'MEASURE' | 'DELETE';
  selectedStationType: StationType | null;
  selectedNode: GridNode | null;
  selectedStation: Station | null;
  measurePoints: LatLng[];
  setMode: (m: 'VIEW' | 'ADD_NODE' | 'ADD_LINK' | 'ADD_STATION' | 'MEASURE' | 'DELETE') => void;
  setStationType: (t: StationType) => void;
  onRemoveStation: (id: string) => void;
  onResetGrid: () => void;
  onClearGrid: () => void;
  onUpdateNode: (node: GridNode) => void;
  onUpdateStation: (station: Station) => void;
  onSelectStation: (id: string | null) => void;
  onAddNode: (node: GridNode) => void;
  onDeleteNode: (id: string) => void;
  onClearMeasurement: () => void;
  onMoveStation: (id: string) => void;
  onExportGrid: (type: 'BASIC' | 'FULL') => void;
  onImportGrid: (file: File) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  stations,
  calculations,
  mode,
  selectedStationType,
  selectedNode,
  selectedStation,
  measurePoints,
  setMode,
  setStationType,
  onRemoveStation,
  onResetGrid,
  onClearGrid,
  onUpdateNode,
  onUpdateStation,
  onSelectStation,
  onAddNode,
  onDeleteNode,
  onClearMeasurement,
  onMoveStation,
  onExportGrid,
  onImportGrid
}) => {
  const stationTypes = Object.values(StationType).filter(t => t !== StationType.Hauptstandort);
  const mainHub = stations.find(s => s.type === StationType.Hauptstandort);

  // Manual Node Input State
  const [manualNode, setManualNode] = useState<Partial<GridNode>>({
    name: 'Neuer Knoten',
    position: { lat: 55.0, lng: 5.0 },
    isFixed: true
  });

  // Check constraint
  const windStation = stations.find(s => s.type === StationType.Windpark);
  const waveStation = stations.find(s => s.type === StationType.Wellenkraftwerk);
  
  let constraintStatus: 'neutral' | 'success' | 'fail' = 'neutral';
  let diffKm = 0;

  if (windStation && waveStation && mainHub) {
      const distWind = calculations[windStation.id]?.cableDistance || 0;
      const distWave = calculations[waveStation.id]?.cableDistance || 0;
      diffKm = Math.abs(distWind - distWave);
      constraintStatus = diffKm < 5 ? 'success' : 'fail'; // 5km tolerance
  }

  return (
    <div className="h-full w-full bg-white shadow-lg overflow-y-auto flex flex-col font-sans">
      <div className="p-4 border-b bg-slate-50">
        <h1 className="text-xl font-bold text-slate-800">Nordsee Netzplaner</h1>
        <p className="text-xs text-slate-500 mt-1">Betrachtetes Einzugsgebiet: Schweden, Norwegen, Dänemark, Deutschland.</p>
      </div>

      <div className="p-4 space-y-6 flex-1">
        
        {/* Station Editor Section - Visible when a station is selected */}
        {selectedStation && (
            <div className="bg-orange-50 border border-orange-200 rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between text-orange-800">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <MapPin size={16}/> Kraftwerk bearbeiten
                    </h3>
                    <button onClick={() => onSelectStation(null)} className="text-orange-500 hover:bg-orange-100 p-1 rounded" title="Schließen">
                        <X size={16} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    <div className="text-xs font-semibold text-orange-700 mb-1">
                        {selectedStation.type}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-orange-700 mb-1">Breitengrad</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={selectedStation.position.lat} 
                                onChange={(e) => onUpdateStation({...selectedStation, position: {...selectedStation.position, lat: parseFloat(e.target.value)}})}
                                className="w-full text-sm p-1.5 border rounded focus:ring-2 focus:ring-orange-300 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-orange-700 mb-1">Längengrad</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={selectedStation.position.lng} 
                                onChange={(e) => onUpdateStation({...selectedStation, position: {...selectedStation.position, lng: parseFloat(e.target.value)}})}
                                className="w-full text-sm p-1.5 border rounded focus:ring-2 focus:ring-orange-300 outline-none"
                            />
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Node Editor Section - Visible when a node is selected */}
        {selectedNode && (
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3 space-y-3">
                <div className="flex items-center justify-between text-blue-800">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                        <MapPin size={16}/> Knoten bearbeiten
                    </h3>
                    <button onClick={() => onDeleteNode(selectedNode.id)} className="text-red-500 hover:bg-red-100 p-1 rounded" title="Knoten löschen">
                        <Trash2 size={16} />
                    </button>
                </div>
                
                <div className="space-y-2">
                    <div>
                        <label className="block text-xs font-semibold text-blue-700 mb-1">Name</label>
                        <input 
                            type="text" 
                            value={selectedNode.name || ''} 
                            onChange={(e) => onUpdateNode({...selectedNode, name: e.target.value})}
                            className="w-full text-sm p-1.5 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
                            placeholder="Knotenname"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-1">Breitengrad</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={selectedNode.position.lat} 
                                onChange={(e) => onUpdateNode({...selectedNode, position: {...selectedNode.position, lat: parseFloat(e.target.value)}})}
                                className="w-full text-sm p-1.5 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-1">Längengrad</label>
                            <input 
                                type="number" 
                                step="0.0001"
                                value={selectedNode.position.lng} 
                                onChange={(e) => onUpdateNode({...selectedNode, position: {...selectedNode.position, lng: parseFloat(e.target.value)}})}
                                className="w-full text-sm p-1.5 border rounded focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2 pt-2">
                        <input 
                            type="checkbox" 
                            id="isFixed"
                            checked={selectedNode.isFixed || false}
                            onChange={(e) => onUpdateNode({...selectedNode, isFixed: e.target.checked})}
                            className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                        />
                        <label htmlFor="isFixed" className="text-sm text-slate-700">Als Basisknoten fixieren</label>
                    </div>
                </div>
            </div>
        )}

        {/* Hauptstandort Section */}
        <div className="space-y-2">
            <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Basis</h2>
            <button
                onClick={() => {
                    setMode('ADD_STATION');
                    setStationType(StationType.Hauptstandort);
                }}
                disabled={!!mainHub}
                className={`w-full flex items-center justify-center p-3 rounded border-2 transition-colors ${
                    mainHub 
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default'
                    : (mode === 'ADD_STATION' && selectedStationType === StationType.Hauptstandort)
                        ? 'border-emerald-500 bg-emerald-100 ring-2 ring-emerald-200'
                        : 'border-dashed border-slate-300 hover:border-emerald-500 text-slate-600'
                }`}
            >
                {mainHub ? <CheckCircle className="mr-2 h-4 w-4"/> : <Plus className="mr-2 h-4 w-4"/>}
                {mainHub ? 'Hauptstandort gesetzt' : 'Hauptstandort setzen'}
            </button>
        </div>

        {/* Tools Section */}
        <div className="space-y-3">
            <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Kraftwerke hinzufügen</h2>
            <div className="grid grid-cols-2 gap-2">
                {stationTypes.map((type) => {
                    const config = StationIconConfig[type];
                    const Icon = config.icon;
                    const isActive = mode === 'ADD_STATION' && selectedStationType === type;
                    const existingCount = stations.filter(s => s.type === type).length;
                    
                    return (
                        <button
                            key={type}
                            onClick={() => {
                                setMode('ADD_STATION');
                                setStationType(type);
                            }}
                            className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${
                                isActive 
                                ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <Icon size={20} color={config.color} className="mb-2"/>
                            <span className="text-xs text-center leading-tight">{type}</span>
                            {existingCount > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-slate-300"></span>}
                        </button>
                    )
                })}
            </div>
            
            {/* List of added stations with coordinates */}
            {stations.filter(s => s.type !== StationType.Hauptstandort).length > 0 && (
                <div className="mt-4 space-y-1">
                    <h3 className="text-xs font-semibold text-slate-500 mb-2">Vorhandene Kraftwerke</h3>
                    {stations.filter(s => s.type !== StationType.Hauptstandort).map(station => {
                        const config = StationIconConfig[station.type];
                        const Icon = config.icon;
                        const isSelected = selectedStation?.id === station.id;
                        
                        return (
                            <div key={station.id} className={`border rounded text-xs transition-colors ${isSelected ? 'bg-orange-50 border-orange-200' : 'bg-white hover:bg-slate-50 border-slate-200'}`}>
                                {/* Header / Summary Row */}
                                <div 
                                    className="p-2 flex items-center justify-between cursor-pointer"
                                    onClick={() => onSelectStation(isSelected ? null : station.id)}
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon size={16} color={config.color}/>
                                        <span className={`font-medium ${isSelected ? 'text-orange-800' : 'text-slate-700'}`}>
                                            {station.type}
                                        </span>
                                    </div>
                                    <div className="flex gap-1 items-center">
                                        {/* Show simple coordinates when collapsed */}
                                        {!isSelected && (
                                            <span className="text-[10px] text-slate-400 mr-1">
                                                {station.position.lat.toFixed(2)}, {station.position.lng.toFixed(2)}
                                            </span>
                                        )}
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRemoveStation(station.id);
                                            }}
                                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors"
                                            title="Entfernen"
                                        >
                                            <Trash2 size={12}/>
                                        </button>
                                    </div>
                                </div>

                                {/* Expanded Editor */}
                                {isSelected && (
                                    <div className="px-2 pb-2 pt-0 border-t border-orange-100 mt-1">
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div>
                                                <label className="block text-[10px] font-semibold text-orange-700 mb-0.5">Breite</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={station.position.lat}
                                                    onChange={(e) => onUpdateStation({...station, position: {...station.position, lat: parseFloat(e.target.value)}})}
                                                    className="w-full p-1.5 border border-orange-200 rounded bg-white focus:ring-1 focus:ring-orange-300 outline-none text-orange-900"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold text-orange-700 mb-0.5">Länge</label>
                                                <input 
                                                    type="number" 
                                                    step="0.01"
                                                    value={station.position.lng}
                                                    onChange={(e) => onUpdateStation({...station, position: {...station.position, lng: parseFloat(e.target.value)}})}
                                                    className="w-full p-1.5 border border-orange-200 rounded bg-white focus:ring-1 focus:ring-orange-300 outline-none text-orange-900"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>

        {/* Grid Editor Tools */}
        <div className="space-y-3 border-t pt-4">
             <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Netzstruktur bearbeiten</h2>
             <div className="flex gap-2">
                 <button 
                    onClick={() => setMode('ADD_NODE')}
                    className={`flex-1 p-2 text-sm rounded border ${mode === 'ADD_NODE' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}`}
                 >
                    <Plus size={16} className="inline mr-1"/> Knoten
                 </button>
                 <button 
                    onClick={() => setMode('ADD_LINK')}
                    className={`flex-1 p-2 text-sm rounded border ${mode === 'ADD_LINK' ? 'bg-slate-800 text-white' : 'hover:bg-slate-100'}`}
                 >
                    <div className="inline-block w-4 h-0.5 bg-current align-middle mr-1"></div> Verb.
                 </button>
                 <button 
                    onClick={() => setMode('DELETE')}
                    className={`flex-1 p-2 text-sm rounded border ${mode === 'DELETE' ? 'bg-red-600 text-white border-red-600' : 'hover:bg-red-50 text-red-600 border-red-200'}`}
                    title="Klicken um Elemente zu löschen"
                 >
                    <Trash2 size={16} className="inline mr-1"/> Löschen
                 </button>
             </div>

             {/* Manual Node Input */}
             {mode === 'ADD_NODE' && (
                <div className="bg-slate-50 p-3 rounded border border-slate-200 text-sm space-y-2 mt-2">
                    <div className="font-semibold text-slate-700">Manuell hinzufügen</div>
                    <input 
                        type="text" 
                        placeholder="Name"
                        value={manualNode.name}
                        onChange={e => setManualNode({...manualNode, name: e.target.value})}
                        className="w-full p-1 border rounded"
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-slate-500">Breite</label>
                            <input 
                                type="number" step="0.1" placeholder="Lat"
                                value={manualNode.position?.lat}
                                onChange={e => setManualNode({...manualNode, position: {...manualNode.position!, lat: parseFloat(e.target.value)}})}
                                className="w-full p-1 border rounded"
                            />
                        </div>
                        <div>
                            <label className="text-xs text-slate-500">Länge</label>
                            <input 
                                type="number" step="0.1" placeholder="Lng"
                                value={manualNode.position?.lng}
                                onChange={e => setManualNode({...manualNode, position: {...manualNode.position!, lng: parseFloat(e.target.value)}})}
                                className="w-full p-1 border rounded"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            if(manualNode.position && manualNode.name) {
                                onAddNode({
                                    id: 'temp_' + Date.now(),
                                    name: manualNode.name,
                                    position: manualNode.position as LatLng,
                                    isFixed: true
                                });
                            }
                        }}
                        className="w-full bg-blue-600 text-white p-1 rounded hover:bg-blue-700"
                    >
                        Hinzufügen
                    </button>
                </div>
             )}

             <div className="flex justify-between items-center text-xs mt-2">
                 <button onClick={onResetGrid} className="text-blue-500 hover:underline">Standardnetz</button>
                 <button onClick={onClearGrid} className="text-red-500 hover:underline">Alles löschen</button>
             </div>
        </div>

        {/* Tools Section - Measurement */}
        <div className="space-y-3 border-t pt-4">
             <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Werkzeuge</h2>
             <button 
                onClick={() => {
                    if(mode === 'MEASURE') {
                        setMode('VIEW');
                        onClearMeasurement();
                    } else {
                        setMode('MEASURE');
                    }
                }}
                className={`w-full flex items-center justify-center p-2 text-sm rounded border ${mode === 'MEASURE' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'hover:bg-slate-100'}`}
             >
                <Ruler size={16} className="mr-2"/>
                {mode === 'MEASURE' ? 'Messung beenden' : 'Entfernung messen'}
             </button>
             
             {mode === 'MEASURE' && measurePoints.length > 0 && (
                 <div className="bg-indigo-50 p-3 rounded text-sm text-indigo-900 border border-indigo-100">
                    <div className="font-semibold mb-1">Messung:</div>
                    {measurePoints.length === 1 && <div>Wähle den zweiten Punkt...</div>}
                    {measurePoints.length === 2 && (
                        <div>
                            Distanz: <span className="font-bold text-lg">
                                {getDistance(measurePoints[0], measurePoints[1]).toFixed(2)} km
                            </span>
                        </div>
                    )}
                 </div>
             )}
        </div>

        {/* Import / Export Section */}
        <div className="space-y-3 border-t pt-4">
             <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Datei</h2>
             <div className="grid grid-cols-2 gap-2">
                 <button 
                    onClick={() => onExportGrid('BASIC')}
                    className="p-2 text-xs rounded border hover:bg-slate-50 flex items-center justify-center"
                 >
                    <Save size={14} className="mr-1"/> Basis-Netz
                 </button>
                 <button 
                    onClick={() => onExportGrid('FULL')}
                    className="p-2 text-xs rounded border hover:bg-slate-50 flex items-center justify-center"
                 >
                    <Save size={14} className="mr-1"/> Gesamt-Netz
                 </button>
             </div>
             <label className="block w-full cursor-pointer">
                 <span className="sr-only">Datei importieren</span>
                 <div className="w-full p-2 text-xs text-center rounded border border-dashed hover:border-blue-500 hover:text-blue-600 transition-colors">
                    Datei importieren (JSON)
                 </div>
                 <input 
                    type="file" 
                    className="hidden" 
                    accept=".json"
                    onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                            onImportGrid(e.target.files[0]);
                        }
                    }}
                 />
             </label>
        </div>

        {/* Analysis Section */}
        {mainHub && stations.length > 1 && (
            <div className="space-y-3 border-t pt-4">
                 <h2 className="text-sm font-semibold uppercase text-slate-500 tracking-wider">Analyse</h2>
                 
                 {/* Constraint Box */}
                 <div className={`p-3 rounded border text-sm ${
                     constraintStatus === 'success' ? 'bg-green-50 border-green-200 text-green-800' :
                     constraintStatus === 'fail' ? 'bg-amber-50 border-amber-200 text-amber-800' :
                     'bg-slate-50 border-slate-200 text-slate-500'
                 }`}>
                     <div className="flex items-start gap-2">
                         {constraintStatus === 'fail' ? <AlertTriangle size={16} className="mt-0.5 flex-shrink-0"/> : <CheckCircle size={16} className="mt-0.5 flex-shrink-0"/>}
                         <div className="w-full">
                             <span className="font-bold block mb-1">Entfernungsgleichheit</span>
                             <div className="flex justify-between text-xs mb-1">
                                <span>Windpark:</span>
                                <span className="font-mono">{windStation && calculations[windStation.id] ? calculations[windStation.id].cableDistance.toFixed(1) : '-'} km</span>
                             </div>
                             <div className="flex justify-between text-xs mb-2">
                                <span>Wellenkraftwerk:</span>
                                <span className="font-mono">{waveStation && calculations[waveStation.id] ? calculations[waveStation.id].cableDistance.toFixed(1) : '-'} km</span>
                             </div>
                             
                             {constraintStatus !== 'neutral' && (
                                 <div className="mt-2 pt-2 border-t border-amber-200/50 font-mono text-xs flex justify-between items-center">
                                     <span>Differenz:</span>
                                     <span className={`font-bold ${diffKm > 1 ? 'text-red-600' : 'text-green-600'}`}>
                                         {diffKm.toFixed(2)} km
                                     </span>
                                 </div>
                             )}
                             
                             {constraintStatus === 'fail' && (
                                 <div className="mt-2 text-xs text-amber-700 bg-amber-100/50 p-1 rounded">
                                     Die Positionen werden automatisch angepasst, um die Entfernung anzugleichen.
                                 </div>
                             )}
                         </div>
                     </div>
                 </div>

                 {/* Table */}
                 <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="border-b">
                                <th className="py-1">Typ</th>
                                <th className="py-1 text-right">Luftlinie</th>
                                <th className="py-1 text-right">Kabel</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stations.filter(s => s.type !== StationType.Hauptstandort).map(s => {
                                const calc = calculations[s.id];
                                return (
                                    <tr 
                                        key={s.id} 
                                        className={`border-b border-slate-100 cursor-pointer transition-colors ${selectedStation?.id === s.id ? 'bg-orange-50' : 'hover:bg-slate-50'}`}
                                        onClick={() => onSelectStation(selectedStation?.id === s.id ? null : s.id)}
                                    >
                                        <td className="py-2 font-medium">{s.type.substring(0, 10)}...</td>
                                        <td className="py-2 text-right text-slate-500">
                                            {calc ? `${Math.round(calc.geoDistance)} km` : '-'}
                                        </td>
                                        <td className="py-2 text-right font-mono font-bold text-blue-600">
                                            {calc ? `${Math.round(calc.cableDistance)} km` : '-'}
                                        </td>
                                        <td className="py-1 pl-2 flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => onMoveStation(s.id)} 
                                                className="text-slate-400 hover:text-blue-500"
                                                title="Verschieben"
                                            >
                                                <Move size={12}/>
                                            </button>
                                            <button onClick={() => onRemoveStation(s.id)} className="text-slate-400 hover:text-red-500" title="Löschen">
                                                <Trash2 size={12}/>
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                 </div>
            </div>
        )}
      </div>
    </div>
  );
};