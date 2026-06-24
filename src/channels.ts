import type { ChannelDef } from './types';

export const CHANNELS: ChannelDef[] = [
  { key: 'thr', label: 'Throttle', color: '#39d98a', defaultVisible: true, category: 'Output' },
  { key: 'str', label: 'Steering', color: '#5cc8ff', defaultVisible: true, category: 'Output' },
  { key: 'gz', label: 'GyroZ', color: '#ff6b6b', defaultVisible: true, category: 'IMU', unit: 'rad/s' },
  { key: 'ch1', label: 'CH1 Steering', color: '#a78bfa', category: 'RC' },
  { key: 'ch2', label: 'CH2 Throttle', color: '#fbbf24', category: 'RC' },
  { key: 'ch3', label: 'CH3 Park', color: '#f87171', category: 'RC' },
  { key: 'ch4', label: 'CH4 Mode', color: '#34d399', category: 'RC' },
  { key: 'ch5', label: 'CH5 Drift', color: '#60a5fa', category: 'RC' },
  { key: 'ch6', label: 'CH6 Scale', color: '#f472b6', category: 'RC' },
  { key: 'rct', label: 'RC Throttle', color: '#fbbf24', category: 'RC' },
  { key: 'rcs', label: 'RC Steering', color: '#a78bfa', category: 'RC' },
  { key: 'pt', label: 'Pilot Throttle', color: '#34d399', category: 'Pilot' },
  { key: 'ps', label: 'Pilot Steering', color: '#60a5fa', category: 'Pilot' },
  { key: 'mode', label: 'Mode', color: '#94a3b8', category: 'State' },
  { key: 'park', label: 'Park', color: '#f87171', category: 'State' },
  { key: 'de', label: 'Drift Enabled', color: '#60a5fa', category: 'State' },
  { key: 'da', label: 'Drift Active', color: '#34d399', category: 'State' },
  { key: 'dc', label: 'Drift Comp', color: '#f472b6', category: 'State' },
  { key: 'vol', label: 'Voltage', color: '#fbbf24', category: 'Power', unit: 'V' },
  { key: 'cur', label: 'Current', color: '#a78bfa', category: 'Power', unit: 'mA' },
  { key: 'gzf', label: 'GyroZ Filtered', color: '#fb923c', category: 'IMU', unit: 'rad/s' },
  { key: 'gx', label: 'GyroX', color: '#c084fc', category: 'IMU', unit: 'rad/s' },
  { key: 'gy', label: 'GyroY', color: '#818cf8', category: 'IMU', unit: 'rad/s' },
  { key: 'ax', label: 'AccelX', color: '#2dd4bf', category: 'IMU', unit: 'm/s²' },
  { key: 'ay', label: 'AccelY', color: '#38bdf8', category: 'IMU', unit: 'm/s²' },
  { key: 'az', label: 'AccelZ', color: '#a3e635', category: 'IMU', unit: 'm/s²' },
];

export function getDefaultVisibleChannels(): Set<string> {
  return new Set(CHANNELS.filter((c) => c.defaultVisible).map((c) => c.key));
}
