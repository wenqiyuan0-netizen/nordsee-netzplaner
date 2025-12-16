export type LatLng = {
  lat: number;
  lng: number;
};

export enum StationType {
  Windpark = 'Windpark',
  PV = 'Photovoltaik',
  Wellenkraftwerk = 'Wellenkraftwerk',
  Pumpspeicher = 'Pumpspeicherkraftwerk',
  Waermespeicher = 'Wärmeenergiespeicher',
  Kaeltemaschine = 'Kältemaschine',
  Hauptstandort = 'Hauptstandort'
}

export interface GridNode {
  id: string;
  position: LatLng;
  name?: string;
  isFixed: boolean; // True for the backbone grid
}

export interface GridLink {
  id: string;
  sourceId: string;
  targetId: string;
}

export interface Station {
  id: string;
  type: StationType;
  position: LatLng;
  connectionPoint?: LatLng; // The point where it connects to the grid line
  connectedLinkId?: string; // The specific grid link it connects to
}

export interface NetworkCalculation {
  geoDistance: number; // Direct distance
  cableDistance: number; // Distance via grid to Hauptstandort
  path: LatLng[]; // Visual path for electricity flow
}
