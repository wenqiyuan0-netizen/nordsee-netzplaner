import React from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Marker, Tooltip, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { GridNode, GridLink, Station, StationType, LatLng, NetworkCalculation } from '../types';
import { StationIcon } from './Icons';

// Fix Leaflet's default icon path issues in React
import iconMarker2x from 'leaflet/dist/images/marker-icon-2x.png';
import iconMarker from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: iconMarker2x,
  iconUrl: iconMarker,
  shadowUrl: iconShadow,
});

interface MapAreaProps {
  gridNodes: GridNode[];
  gridLinks: GridLink[];
  stations: Station[];
  calculations: Record<string, NetworkCalculation>;
  measurePoints: LatLng[];
  mode: 'VIEW' | 'ADD_NODE' | 'ADD_LINK' | 'ADD_STATION' | 'MEASURE' | 'DELETE';
  selectedStationType: StationType | null;
  selectedNodeId: string | null;
  selectedStationId: string | null;
  onMapClick: (pos: LatLng) => void;
  onNodeClick: (id: string) => void;
  onStationClick: (id: string) => void;
  onStationMove: (id: string, pos: LatLng) => void;
}

const MapEvents: React.FC<{ onClick: (pos: LatLng) => void }> = ({ onClick }) => {
  const map = useMapEvents({
    click(e) {
      onClick(e.latlng);
    },
  });

  // Force resize invalidate when map is ready or container resizes
  React.useEffect(() => {
    const timer = setTimeout(() => {
       map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
};

// Helper to create custom div icons for stations
const createStationIcon = (type: StationType) => {
    const html = renderToStaticMarkup(<StationIcon type={type} />);
    return L.divIcon({
        html: html,
        className: 'custom-icon-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
    });
};

export const MapArea: React.FC<MapAreaProps> = ({
  gridNodes,
  gridLinks,
  stations,
  calculations,
  measurePoints,
  mode,
  selectedNodeId,
  selectedStationId,
  onMapClick,
  onNodeClick,
  onStationClick,
  onStationMove,
}) => {
  // Use ref to track dragging state and ghost marker to avoid re-renders during drag
  const ghostMarkerRef = React.useRef<L.Marker | null>(null);
  const draggingIdRef = React.useRef<string | null>(null);
  const lineRefs = React.useRef<Record<string, L.Polyline>>({});

  return (
    <div className="h-full w-full relative">
        <MapContainer
        center={[56.5, 5.0]} // North Sea Center
        zoom={6}
        style={{ height: '100%', width: '100%' }}
        >
        <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapEvents onClick={onMapClick} />

        {/* Measurement Tool */}
        {measurePoints.map((p, i) => (
             <Marker 
                key={`m-${i}`} 
                position={p} 
                icon={L.divIcon({
                    className: 'bg-transparent',
                    html: `<div style="background-color: #6366f1; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
                })} 
             />
        ))}
        {measurePoints.length === 2 && (
            <Polyline 
                positions={measurePoints}
                pathOptions={{ color: '#6366f1', dashArray: '5, 10', weight: 3 }}
            >
                <Tooltip permanent direction="center" className="text-xs font-bold text-indigo-700 bg-white/80 border-indigo-200">
                     Measurement
                </Tooltip>
            </Polyline>
        )}

        {/* Highlight Path for Selected Station */}
        {selectedStationId && calculations[selectedStationId]?.path && (
            <Polyline
                positions={calculations[selectedStationId].path}
                pathOptions={{ color: '#f59e0b', weight: 6, opacity: 0.8 }}
            />
        )}

        {/* Grid Links */}
        {gridLinks.map((link) => {
            const source = gridNodes.find((n) => n.id === link.sourceId);
            const target = gridNodes.find((n) => n.id === link.targetId);
            if (!source || !target) return null;
            return (
            <Polyline
                key={link.id}
                positions={[source.position, target.position]}
                pathOptions={{ color: 'black', weight: 4, opacity: 0.7 }}
            />
            );
        })}

        {/* Grid Nodes */}
        {gridNodes.map((node) => (
            <CircleMarker
            key={node.id}
            center={node.position}
            radius={node.id === selectedNodeId ? 12 : 10}
            pathOptions={{
                color: '#333',
                weight: 2,
                fillColor: node.id === selectedNodeId ? 'red' : 'white',
                fillOpacity: 1,
            }}
            eventHandlers={{
                click: (e) => {
                L.DomEvent.stopPropagation(e);
                onNodeClick(node.id);
                },
            }}
            >
            <Tooltip>{node.name || 'Netzknoten'}</Tooltip>
            </CircleMarker>
        ))}

        {/* Stations and their Connection Lines */}
        {stations.map((station) => {
            const calc = calculations[station.id];
            const isSelected = selectedStationId === station.id;

            return (
                <React.Fragment key={station.id}>
                    {/* Connection Line to Grid */}
                    {station.connectionPoint && (
                        <Polyline
                            ref={(el) => {
                                if (el) lineRefs.current[station.id] = el;
                                else delete lineRefs.current[station.id];
                            }}
                            positions={[station.position, station.connectionPoint]}
                            pathOptions={{ 
                                color: isSelected ? '#f59e0b' : '#2563eb', 
                                dashArray: '10, 10', 
                                weight: isSelected ? 4 : 2,
                            }}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    onStationClick(station.id);
                                }
                            }}
                        >
                             {isSelected && calc && (
                                <Tooltip permanent direction="center" className="text-xs font-bold text-amber-700 bg-amber-50 border-amber-200">
                                    {calc.cableDistance.toFixed(2)} km
                                </Tooltip>
                             )}
                        </Polyline>
                    )}
                    
                    {/* The Station Marker (Draggable) */}
                    <Marker
                        position={station.position}
                        draggable={true}
                        icon={createStationIcon(station.type)}
                        eventHandlers={{
                            click: (e) => {
                                // Prevent click when ending drag
                                if (!draggingIdRef.current) {
                                    L.DomEvent.stopPropagation(e);
                                    onStationClick(station.id);
                                }
                            },
                            dragstart: (e) => {
                                draggingIdRef.current = station.id;
                                const map = e.target._map;
                                
                                // Create Ghost Marker (Manual Leaflet Layer)
                                const ghost = L.marker(station.position, { 
                                    icon: createStationIcon(station.type), 
                                    opacity: 0.3,
                                    interactive: false // Ignore events on ghost
                                }).addTo(map);
                                ghostMarkerRef.current = ghost;

                                // Fade the connection line if exists
                                const line = lineRefs.current[station.id];
                                if (line) {
                                    line.setStyle({ opacity: 0.3 });
                                }
                            },
                            dragend: (e) => {
                                draggingIdRef.current = null;
                                
                                // Remove Ghost Marker
                                if (ghostMarkerRef.current) {
                                    ghostMarkerRef.current.remove();
                                    ghostMarkerRef.current = null;
                                }

                                // Restore line opacity
                                const line = lineRefs.current[station.id];
                                if (line) {
                                    line.setStyle({ opacity: 1 }); // Or 0.7 if default? Default seems to be 1 or implicit
                                }

                                const marker = e.target;
                                const position = marker.getLatLng();
                                onStationMove(station.id, position);
                            }
                        }}
                    >
                        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                            <span className="font-bold">{station.type}</span>
                        </Tooltip>
                    </Marker>
                </React.Fragment>
            );
        })}
        </MapContainer>
    </div>
  );
};