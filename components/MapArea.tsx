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
  onMapClick: (pos: LatLng) => void;
  onNodeClick: (id: string) => void;
  onStationClick: (id: string) => void;
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
  onMapClick,
  onNodeClick,
  onStationClick,
}) => {
  const [selectedStationId, setSelectedStationId] = React.useState<string | null>(null);

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
            radius={node.id === selectedNodeId ? 8 : 6}
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
                            positions={[station.position, station.connectionPoint]}
                            pathOptions={{ color: isSelected ? '#f59e0b' : '#2563eb', dashArray: '10, 10', weight: isSelected ? 4 : 2 }}
                            eventHandlers={{
                                click: (e) => {
                                    L.DomEvent.stopPropagation(e);
                                    setSelectedStationId(isSelected ? null : station.id);
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
                    
                    {/* The Station Marker */}
                    <Marker
                        position={station.position}
                        icon={createStationIcon(station.type)}
                        eventHandlers={{
                            click: (e) => {
                                L.DomEvent.stopPropagation(e);
                                if (mode === 'DELETE') {
                                    onStationClick(station.id);
                                } else {
                                    setSelectedStationId(isSelected ? null : station.id);
                                }
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
