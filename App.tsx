import React, { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { MapArea } from './components/MapArea';
import { Sidebar } from './components/Sidebar';
import { GridNode, GridLink, Station, StationType, LatLng, NetworkCalculation } from './types';
import { getDistance, projectPointOnSegment, findShortestPath } from './utils/geometry';
import { findOptimalPointOnSegment, findTargetPointOnSegment } from './utils/optimization';
import { INITIAL_NODES, INITIAL_LINKS, INITIAL_STATIONS } from './data';

function App() {
  const [gridNodes, setGridNodes] = useState<GridNode[]>(INITIAL_NODES);
  const [gridLinks, setGridLinks] = useState<GridLink[]>(INITIAL_LINKS);
  const [stations, setStations] = useState<Station[]>(INITIAL_STATIONS);
  const [calculations, setCalculations] = useState<Record<string, NetworkCalculation>>({});
  
  const [mode, setMode] = useState<'VIEW' | 'ADD_NODE' | 'ADD_LINK' | 'ADD_STATION' | 'MEASURE' | 'DELETE' | 'MOVE_STATION'>('VIEW');
  const [selectedStationType, setSelectedStationType] = useState<StationType | null>(null);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  
  // Reuse this for selecting a node (to link OR to edit)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [movingStationId, setMovingStationId] = useState<string | null>(null);

  // Measurement state
  const [measurePoints, setMeasurePoints] = useState<LatLng[]>([]);

  // --- Logic ---

  // Connect a station to the NEAREST grid link (Geometry only)
  const calculateNearestConnection = useCallback((stationPos: LatLng): { point: LatLng, linkId: string, dist: number } | null => {
    if (gridLinks.length === 0) return null;

    let bestPoint: LatLng | null = null;
    let bestLink: string | null = null;
    let minDistance = Infinity;

    gridLinks.forEach(link => {
        const sNode = gridNodes.find(n => n.id === link.sourceId);
        const tNode = gridNodes.find(n => n.id === link.targetId);
        if (sNode && tNode) {
            const projected = projectPointOnSegment(stationPos, sNode.position, tNode.position);
            const dist = getDistance(stationPos, projected);
            if (dist < minDistance) {
                minDistance = dist;
                bestPoint = projected;
                bestLink = link.id;
            }
        }
    });

    if (bestPoint && bestLink) {
        return { point: bestPoint, linkId: bestLink, dist: minDistance };
    }
    return null;
  }, [gridNodes, gridLinks]);

  // Connect a station to the OPTIMAL grid link (Minimizing Total Distance: New Cable + Grid Path)
  const calculateOptimalConnection = useCallback((stationPos: LatLng, hubConn: { point: LatLng, linkId: string }): { point: LatLng, linkId: string, dist: number } | null => {
      if (gridLinks.length === 0) return null;
      
      let bestPoint: LatLng | null = null;
      let bestLink: string | null = null;
      let minWeightedCost = Infinity;
      let finalTotalDist = Infinity; // To return the real total distance

      // Find Hub Nodes
      const hubLinkObj = gridLinks.find(l => l.id === hubConn.linkId);
      if (!hubLinkObj) return calculateNearestConnection(stationPos);

      const hubNode1 = gridNodes.find(n => n.id === hubLinkObj.sourceId);
      const hubNode2 = gridNodes.find(n => n.id === hubLinkObj.targetId);
      if (!hubNode1 || !hubNode2) return calculateNearestConnection(stationPos);

      // Pre-calculate Hub Node Distances to Hub Connection Point
      const d_Hub_H1 = getDistance(hubConn.point, hubNode1.position);
      const d_Hub_H2 = getDistance(hubConn.point, hubNode2.position);

      gridLinks.forEach(link => {
          const sNode = gridNodes.find(n => n.id === link.sourceId);
          const tNode = gridNodes.find(n => n.id === link.targetId);
          if (sNode && tNode) {
              // Pre-calculate path distances from this link's endpoints to the Hub
              const p_S1_H1 = findShortestPath(gridNodes, gridLinks, sNode.id, hubNode1.id);
              const p_S1_H2 = findShortestPath(gridNodes, gridLinks, sNode.id, hubNode2.id);
              const d_S1_Hub = Math.min(
                  p_S1_H1 ? p_S1_H1.distance + d_Hub_H1 : Infinity,
                  p_S1_H2 ? p_S1_H2.distance + d_Hub_H2 : Infinity
              );

              const p_S2_H1 = findShortestPath(gridNodes, gridLinks, tNode.id, hubNode1.id);
              const p_S2_H2 = findShortestPath(gridNodes, gridLinks, tNode.id, hubNode2.id);
              const d_S2_Hub = Math.min(
                  p_S2_H1 ? p_S2_H1.distance + d_Hub_H1 : Infinity,
                  p_S2_H2 ? p_S2_H2.distance + d_Hub_H2 : Infinity
              );

              // Use Optimization Utility to find best point on this segment
              // Penalty factor 2.0: 1km of new cable is as "bad" as 2km of grid travel.
              // This strongly encourages connecting to closer grid lines (perpendicularly).
              const opt = findOptimalPointOnSegment(
                  stationPos, 
                  sNode.position, 
                  tNode.position, 
                  d_S1_Hub, 
                  d_S2_Hub, 
                  2.0 
              );

              const weightedCost = opt.cableDist * 2.0 + (opt.totalDist - opt.cableDist);

              if (weightedCost < minWeightedCost) {
                  minWeightedCost = weightedCost;
                  bestPoint = opt.point;
                  bestLink = link.id;
                  finalTotalDist = opt.totalDist;
              }
          }
      });

      if (bestPoint && bestLink) {
          return { point: bestPoint, linkId: bestLink, dist: finalTotalDist };
      }
      return calculateNearestConnection(stationPos);
  }, [gridNodes, gridLinks, calculateNearestConnection]);

  // Find a connection point that matches a TARGET TOTAL distance, minimizing New Cable Length
  const findTargetConnection = useCallback((stationPos: LatLng, targetTotalDist: number, hubConn: { point: LatLng, linkId: string }, originalOpt: { point: LatLng, linkId: string, dist: number }) => {
      // If we are already close enough or over, keep original
      if (originalOpt.dist >= targetTotalDist - 0.5) return originalOpt;

      let bestPoint = originalOpt.point;
      let bestLink = originalOpt.linkId;
      let minCableDist = Infinity;
      
      // Find Hub Nodes
      const hubLinkObj = gridLinks.find(l => l.id === hubConn.linkId);
      if (!hubLinkObj) return originalOpt;

      const hubNode1 = gridNodes.find(n => n.id === hubLinkObj.sourceId);
      const hubNode2 = gridNodes.find(n => n.id === hubLinkObj.targetId);
      if (!hubNode1 || !hubNode2) return originalOpt;

      const d_Hub_H1 = getDistance(hubConn.point, hubNode1.position);
      const d_Hub_H2 = getDistance(hubConn.point, hubNode2.position);

      // Check all links to find points where TotalDist ~= targetTotalDist
      gridLinks.forEach(link => {
          const sNode = gridNodes.find(n => n.id === link.sourceId);
          const tNode = gridNodes.find(n => n.id === link.targetId);
          if (sNode && tNode) {
              const p_S1_H1 = findShortestPath(gridNodes, gridLinks, sNode.id, hubNode1.id);
              const p_S1_H2 = findShortestPath(gridNodes, gridLinks, sNode.id, hubNode2.id);
              const d_S1_Hub = Math.min(
                  p_S1_H1 ? p_S1_H1.distance + d_Hub_H1 : Infinity,
                  p_S1_H2 ? p_S1_H2.distance + d_Hub_H2 : Infinity
              );

              const p_S2_H1 = findShortestPath(gridNodes, gridLinks, tNode.id, hubNode1.id);
              const p_S2_H2 = findShortestPath(gridNodes, gridLinks, tNode.id, hubNode2.id);
              const d_S2_Hub = Math.min(
                  p_S2_H1 ? p_S2_H1.distance + d_Hub_H1 : Infinity,
                  p_S2_H2 ? p_S2_H2.distance + d_Hub_H2 : Infinity
              );

              // Use Optimization Utility to find target point
              const res = findTargetPointOnSegment(
                  stationPos,
                  sNode.position,
                  tNode.position,
                  d_S1_Hub,
                  d_S2_Hub,
                  targetTotalDist
              );

              if (res) {
                   if (res.cableDist < minCableDist) {
                       minCableDist = res.cableDist;
                       bestPoint = res.point;
                       bestLink = link.id;
                   }
              }
          }
      });
      
      return { point: bestPoint, linkId: bestLink, dist: targetTotalDist }; // Return target dist as nominal
  }, [gridNodes, gridLinks]);

  // Effect: Recalculate all connections (including Auto-Balance)
  useEffect(() => {
    if (stations.length === 0) return;

    // 1. Prepare Hub Info
    const hub = stations.find(s => s.type === StationType.Hauptstandort);
    let hubConn = hub?.connectionPoint && hub?.connectedLinkId ? { point: hub.connectionPoint, linkId: hub.connectedLinkId } : null;
    
    // Calculate Hub Connection first
    let newHubConnPoint: LatLng | undefined;
    let newHubConnLink: string | undefined;

    if (hub) {
        const c = calculateNearestConnection(hub.position);
        if (c) {
            newHubConnPoint = c.point;
            newHubConnLink = c.linkId;
            hubConn = { point: c.point, linkId: c.linkId };
        }
    }

    // 2. Calculate Optimal for ALL first
    const calculatedConnections = new Map<string, { point: LatLng, linkId?: string, dist: number }>();
    
    stations.forEach(s => {
        if (s.type === StationType.Hauptstandort) {
            if (newHubConnPoint && newHubConnLink) {
                calculatedConnections.set(s.id, { point: newHubConnPoint, linkId: newHubConnLink, dist: 0 });
            }
        } else if (s.type === StationType.Kaeltemaschine && hub) {
            // Special Case: Direct connection to Hauptstandort Station
            // Does not depend on grid connection
            const dist = getDistance(s.position, hub.position);
            calculatedConnections.set(s.id, { point: hub.position, linkId: undefined, dist: dist });
        } else if (hubConn) {
            const opt = calculateOptimalConnection(s.position, hubConn);
            if (opt) calculatedConnections.set(s.id, opt);
        } else {
             const near = calculateNearestConnection(s.position);
             if (near) calculatedConnections.set(s.id, near);
        }
    });

    // 3. Apply Wind/Wave Equalization
    const windStation = stations.find(s => s.type === StationType.Windpark);
    const waveStation = stations.find(s => s.type === StationType.Wellenkraftwerk);

    if (windStation && waveStation && hubConn && calculatedConnections.has(windStation.id) && calculatedConnections.has(waveStation.id)) {
        const cWind = calculatedConnections.get(windStation.id)!;
        const cWave = calculatedConnections.get(waveStation.id)!;
        
        const maxDist = Math.max(cWind.dist, cWave.dist);
        
        if (Math.abs(cWind.dist - cWave.dist) > 0.1) {
            // Equalize
            if (cWind.dist < maxDist) {
                const newC = findTargetConnection(windStation.position, maxDist, hubConn, cWind);
                calculatedConnections.set(windStation.id, newC);
            } else {
                const newC = findTargetConnection(waveStation.position, maxDist, hubConn, cWave);
                calculatedConnections.set(waveStation.id, newC);
            }
        }
    }

    // 4. Update State
    setStations(currentStations => {
        let changed = false;
        const updated = currentStations.map(s => {
             const newConn = calculatedConnections.get(s.id);
             if (!newConn) return s;
             
             // Check if diff
             const p1 = s.connectionPoint;
             const p2 = newConn.point;
             if (!p1 || Math.abs(p1.lat - p2.lat) > 0.00001 || Math.abs(p1.lng - p2.lng) > 0.00001) {
                 changed = true;
                 return {
                     ...s,
                     connectionPoint: newConn.point,
                     connectedLinkId: newConn.linkId
                 };
             }
             return s;
        });
        
        return changed ? updated : currentStations;
    });

  }, [gridNodes, gridLinks, stations.length, stations.map(s => `${s.position.lat},${s.position.lng}`).join(','), calculateNearestConnection, calculateOptimalConnection, findTargetConnection]);


  // Effect: Calculate Distances
  useEffect(() => {
    const mainHub = stations.find(s => s.type === StationType.Hauptstandort);
    const newCalcs: Record<string, NetworkCalculation> = {};

    if (mainHub && gridNodes.length > 0) {
        // Hub Connection is already stored in station.connectionPoint
        // But we need the details (linkId) which is also in station.connectedLinkId
        
        if (mainHub.connectionPoint && mainHub.connectedLinkId) {
            const hubConnection = { point: mainHub.connectionPoint, linkId: mainHub.connectedLinkId, dist: getDistance(mainHub.position, mainHub.connectionPoint) };

            stations.forEach(station => {
                if (station.id === mainHub.id) return;
                
                // Geo Distance (Air Line)
                const geoDist = getDistance(station.position, mainHub.position);

                // Special Case: Kaeltemaschine (Direct Connection)
                if (station.type === StationType.Kaeltemaschine) {
                    newCalcs[station.id] = {
                        geoDistance: geoDist,
                        cableDistance: geoDist, // Direct connection, no grid travel
                        path: [station.position, mainHub.position]
                    };
                    return;
                }

                // Cable Distance logic
                // Station Connection is already stored
                if (station.connectionPoint && station.connectedLinkId) {
                     const stConn = { point: station.connectionPoint, linkId: station.connectedLinkId, dist: getDistance(station.position, station.connectionPoint) };

                    const linkS = gridLinks.find(l => l.id === stConn.linkId);
                    if (!linkS) return;
                    
                    const nodeS1 = gridNodes.find(n => n.id === linkS.sourceId);
                    const nodeS2 = gridNodes.find(n => n.id === linkS.targetId);

                    if (!nodeS1 || !nodeS2) return;

                    const d_S_N1 = getDistance(stConn.point, nodeS1.position);
                    const d_S_N2 = getDistance(stConn.point, nodeS2.position);

                    const linkH = gridLinks.find(l => l.id === hubConnection.linkId);
                    if (!linkH) return;

                    const nodeH1 = gridNodes.find(n => n.id === linkH.sourceId);
                    const nodeH2 = gridNodes.find(n => n.id === linkH.targetId);
                    
                    if (!nodeH1 || !nodeH2) return;

                    const d_H_N1 = getDistance(hubConnection.point, nodeH1.position);
                    const d_H_N2 = getDistance(hubConnection.point, nodeH2.position);

                    const paths = [
                        { start: nodeS1.id, end: nodeH1.id, offset: d_S_N1 + d_H_N1, startPoint: nodeS1.position, endPoint: nodeH1.position },
                        { start: nodeS1.id, end: nodeH2.id, offset: d_S_N1 + d_H_N2, startPoint: nodeS1.position, endPoint: nodeH2.position },
                        { start: nodeS2.id, end: nodeH1.id, offset: d_S_N2 + d_H_N1, startPoint: nodeS2.position, endPoint: nodeH1.position },
                        { start: nodeS2.id, end: nodeH2.id, offset: d_S_N2 + d_H_N2, startPoint: nodeS2.position, endPoint: nodeH2.position },
                    ];

                    let cableDist = Infinity;
                    let visualPath: LatLng[] = [];

                    if (stConn.linkId === hubConnection.linkId) {
                         cableDist = getDistance(stConn.point, hubConnection.point);
                         visualPath = [station.position, stConn.point, hubConnection.point, mainHub.position];
                    } 
                    
                    paths.forEach(p => {
                        const result = findShortestPath(gridNodes, gridLinks, p.start, p.end);
                        if (result) {
                            const total = result.distance + p.offset;
                            if (total < cableDist) {
                                cableDist = total;
                                // Construct Visual Path
                                const cleanPath: LatLng[] = [station.position, stConn.point];
                                result.path.forEach(nid => {
                                    const n = gridNodes.find(gn => gn.id === nid);
                                    if(n) cleanPath.push(n.position);
                                });
                                cleanPath.push(hubConnection.point, mainHub.position);
                                
                                visualPath = cleanPath;
                            }
                        }
                    });

                    const finalCableDist = cableDist + stConn.dist + hubConnection.dist;

                    newCalcs[station.id] = {
                        geoDistance: geoDist,
                        cableDistance: finalCableDist,
                        path: visualPath
                    };
                }
            });
        }
    }

    setCalculations(newCalcs);
  }, [stations, gridNodes, gridLinks]); // Removed calculateStationConnection dependency


  // --- Event Handlers ---

  const handleUpdateNode = (updatedNode: GridNode) => {
    setGridNodes(nodes => nodes.map(n => n.id === updatedNode.id ? updatedNode : n));
  };

  const handleUpdateStation = (updatedStation: Station) => {
    setStations(stations => stations.map(s => s.id === updatedStation.id ? updatedStation : s));
  };

  const handleDeleteNode = (nodeId: string) => {
    // Identify links that will be removed
    const linksToRemove = gridLinks.filter(l => l.sourceId === nodeId || l.targetId === nodeId);
    const linkIdsToRemove = new Set(linksToRemove.map(l => l.id));

    setGridNodes(nodes => nodes.filter(n => n.id !== nodeId));
    setGridLinks(links => links.filter(l => l.sourceId !== nodeId && l.targetId !== nodeId));
    
    // Reset stations that were connected to the removed links
    setStations(prev => prev.map(s => {
        if (s.connectedLinkId && linkIdsToRemove.has(s.connectedLinkId)) {
             return {
                 ...s,
                 connectionPoint: undefined,
                 connectedLinkId: undefined
             };
        }
        return s;
    }));

    setSelectedNodeId(null);
  };

  const handleStationClick = (id: string) => {
      if (mode === 'DELETE') {
          setStations(prev => prev.filter(s => s.id !== id));
          if (selectedStationId === id) setSelectedStationId(null);
      } else if (mode === 'VIEW') {
         setSelectedStationId(id === selectedStationId ? null : id);
      }
  };

  const handleStationMove = (id: string, newPos: LatLng) => {
      setStations(prev => prev.map(s => {
          if (s.id === id) {
              return {
                  ...s,
                  position: newPos,
                  connectionPoint: undefined, // Let Effect recalculate
                  connectedLinkId: undefined
              };
          }
          return s;
      }));
  };

  const handleMapClick = (pos: LatLng) => {
    if (mode === 'MOVE_STATION' && movingStationId) {
        // Move the station - Connection will be auto-calculated by Effect
        setStations(prev => prev.map(s => {
            if (s.id === movingStationId) {
                return {
                    ...s,
                    position: pos,
                    connectionPoint: undefined, // Let Effect handle it
                    connectedLinkId: undefined
                };
            }
            return s;
        }));
        setMode('VIEW');
        setMovingStationId(null);
        return;
    }

    if (mode === 'MEASURE') {
        const newPoints = [...measurePoints, pos];
        if (newPoints.length > 2) {
            setMeasurePoints([pos]); // Start over
        } else {
            setMeasurePoints(newPoints);
        }
    } else if (mode === 'ADD_STATION' && selectedStationType) {
        let newStations = [...stations];
        if (selectedStationType === StationType.Hauptstandort) {
            newStations = newStations.filter(s => s.type !== StationType.Hauptstandort);
        }

        const newStation: Station = {
            id: uuidv4(),
            type: selectedStationType,
            position: pos,
            connectionPoint: undefined, // Let Effect handle it
            connectedLinkId: undefined
        };
        
        setStations([...newStations, newStation]);
        if (selectedStationType === StationType.Hauptstandort) {
            setMode('VIEW');
            setSelectedStationType(null);
        }
    } else if (mode === 'ADD_NODE') {
        const newNode: GridNode = {
            id: uuidv4(),
            position: pos,
            isFixed: false,
            name: 'Neuer Knoten'
        };
        setGridNodes([...gridNodes, newNode]);
        // Auto select new node for editing
        setSelectedNodeId(newNode.id);
    } else {
        // In View mode, clicking map deselects node
        setSelectedNodeId(null);
        setSelectedStationId(null);
    }
  };

  const handleNodeClick = (id: string) => {
    if (mode === 'DELETE') {
        handleDeleteNode(id);
        return;
    }

    if (mode === 'MEASURE') {
        const node = gridNodes.find(n => n.id === id);
        if (node) {
            const newPoints = [...measurePoints, node.position];
            if (newPoints.length > 2) {
                setMeasurePoints([node.position]);
            } else {
                setMeasurePoints(newPoints);
            }
        }
        return;
    }

    if (mode === 'ADD_LINK') {
        if (selectedNodeId === null) {
            setSelectedNodeId(id);
        } else {
            if (selectedNodeId !== id) {
                const exists = gridLinks.some(l => 
                    (l.sourceId === selectedNodeId && l.targetId === id) || 
                    (l.sourceId === id && l.targetId === selectedNodeId)
                );

                if (!exists) {
                    setGridLinks([...gridLinks, {
                        id: uuidv4(),
                        sourceId: selectedNodeId,
                        targetId: id
                    }]);
                }
            }
            setSelectedNodeId(null);
        }
    } else {
        // In VIEW or ADD_NODE or ADD_STATION mode, clicking a node selects it for editing
        setSelectedNodeId(id === selectedNodeId ? null : id);
    }
  };

  const resetGrid = () => {
    setGridNodes(INITIAL_NODES);
    setGridLinks(INITIAL_LINKS);
    setStations([]);
    setCalculations({});
    setSelectedNodeId(null);
  };

  const clearGrid = () => {
    setGridNodes([]);
    setGridLinks([]);
    setStations([]);
    setCalculations({});
    setSelectedNodeId(null);
  };

  const handleAddNodeManual = (node: GridNode) => {
      const newNode = { ...node, id: uuidv4() };
      setGridNodes([...gridNodes, newNode]);
      setSelectedNodeId(newNode.id);
  };

  const handleClearMeasurement = () => {
      setMeasurePoints([]);
  };

  const handleExport = (type: 'BASIC' | 'FULL') => {
      const data = {
          gridNodes,
          gridLinks,
          stations: type === 'FULL' ? stations : []
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nordsee-netzplaner-${type.toLowerCase()}-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
  };

  const handleImport = (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const content = e.target?.result as string;
              const data = JSON.parse(content);
              if (data.gridNodes && Array.isArray(data.gridNodes)) setGridNodes(data.gridNodes);
              if (data.gridLinks && Array.isArray(data.gridLinks)) setGridLinks(data.gridLinks);
              if (data.stations && Array.isArray(data.stations)) setStations(data.stations);
              // Clear selection
              setSelectedNodeId(null);
              setSelectedStationId(null);
          } catch (err) {
              alert('Fehler beim Importieren der Datei: Ungültiges Format');
          }
      };
      reader.readAsText(file);
  };

  const selectedNode = gridNodes.find(n => n.id === selectedNodeId) || null;
  const selectedStation = stations.find(s => s.id === selectedStationId) || null;

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden fixed inset-0">
      {/* Sidebar - Left 30% or fixed width */}
      <div className="w-80 md:w-96 flex-shrink-0 z-20 relative h-full">
        <Sidebar 
            stations={stations}
            calculations={calculations}
            mode={mode}
            selectedStationType={selectedStationType}
            selectedNode={selectedNode}
            selectedStation={selectedStation}
            measurePoints={measurePoints}
            setMode={(m) => {
                setMode(m);
                setSelectedNodeId(null);
                setSelectedStationId(null);
            }}
            setStationType={setSelectedStationType}
            onRemoveStation={(id) => setStations(stations.filter(s => s.id !== id))}
            onResetGrid={resetGrid}
            onClearGrid={clearGrid}
            onUpdateNode={handleUpdateNode}
            onUpdateStation={handleUpdateStation}
            onSelectStation={setSelectedStationId}
            onAddNode={handleAddNodeManual}
            onDeleteNode={handleDeleteNode}
            onClearMeasurement={handleClearMeasurement}
            onMoveStation={(id) => {
                setMovingStationId(id);
                setMode('MOVE_STATION');
            }}
            onExportGrid={handleExport}
            onImportGrid={handleImport}
        />
      </div>

      {/* Map Area */}
      <div className="flex-1 relative z-10 h-full w-full overflow-hidden">
        <MapArea 
            gridNodes={gridNodes}
            gridLinks={gridLinks}
            stations={stations}
            calculations={calculations}
            measurePoints={measurePoints}
            mode={mode}
            selectedStationType={selectedStationType}
            selectedNodeId={selectedNodeId}
            selectedStationId={selectedStationId}
            onMapClick={handleMapClick}
            onNodeClick={handleNodeClick}
            onStationClick={handleStationClick}
            onStationMove={handleStationMove}
        />
        
        {/* Helper Badge for Modes */}
        {mode !== 'VIEW' && (
            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-4 py-2 rounded-lg shadow-md border border-slate-200 z-[1000] pointer-events-none">
                <span className="font-bold text-slate-700">Modus: </span>
                {mode === 'ADD_STATION' && <span className="text-blue-600">Kraftwerk platzieren ({selectedStationType})</span>}
                {mode === 'MOVE_STATION' && <span className="text-blue-600">Neue Position wählen...</span>}
                {mode === 'ADD_NODE' && <span className="text-slate-600">Klicken zum Erstellen von Knoten</span>}
                {mode === 'DELETE' && <span className="text-red-600">Klicken zum Löschen (Knoten oder Kraftwerk)</span>}
                {mode === 'ADD_LINK' && <span className="text-slate-600">
                    {selectedNodeId ? 'Zweiten Knoten wählen' : 'Startknoten wählen'}
                </span>}
            </div>
        )}
      </div>
    </div>
  );
}

export default App;