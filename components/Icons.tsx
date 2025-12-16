import React from 'react';
import { StationType } from '../types';
import { Wind, Sun, Waves, Zap, Thermometer, Snowflake, Anchor } from 'lucide-react';

export const StationIconConfig = {
  [StationType.Windpark]: { icon: Wind, color: '#06b6d4' }, // Cyan
  [StationType.PV]: { icon: Sun, color: '#eab308' }, // Yellow
  [StationType.Wellenkraftwerk]: { icon: Waves, color: '#3b82f6' }, // Blue
  [StationType.Pumpspeicher]: { icon: Zap, color: '#a855f7' }, // Purple
  [StationType.Waermespeicher]: { icon: Thermometer, color: '#ef4444' }, // Red
  [StationType.Kaeltemaschine]: { icon: Snowflake, color: '#0ea5e9' }, // Sky
  [StationType.Hauptstandort]: { icon: Anchor, color: '#10b981' }, // Green
};

interface IconProps {
    type: StationType;
    size?: number;
}

export const StationIcon: React.FC<IconProps> = ({ type, size = 24 }) => {
    const config = StationIconConfig[type];
    const IconComponent = config.icon;
    return (
        <div style={{
            backgroundColor: 'white',
            borderRadius: '50%',
            padding: '4px',
            border: `2px solid ${config.color}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: `${size + 8}px`,
            height: `${size + 8}px`
        }}>
            <IconComponent size={size} color={config.color} />
        </div>
    );
};
