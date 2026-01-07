
export enum DeviceType {
  LIGHT = 'LIGHT',
  SENSOR = 'SENSOR', // Temperature & Humidity
  LOCK = 'LOCK',
  THERMOSTAT = 'THERMOSTAT',
  CAMERA = 'CAMERA',
  SWITCH = 'SWITCH'
}

export enum DeviceStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
  DISCONNECTED = 'DISCONNECTED'
}

// --- Stricter State Definitions ---

export interface BaseDeviceState {
  power?: boolean;
  powerUsage?: number; // Watts
  battery?: number; // Percentage
}

export interface LightState extends BaseDeviceState {
  brightness?: number;
  color?: string;
}

export interface ThermostatState extends BaseDeviceState {
  temperature?: number;
  humidity?: number;
  targetTemperature?: number;
  mode?: 'heat' | 'cool' | 'auto' | 'off';
}

export interface LockState extends BaseDeviceState {
  locked?: boolean;
  pinRequired?: boolean;
}

export interface SensorState extends BaseDeviceState {
  temperature?: number;
  humidity?: number;
  motion?: boolean;
  contact?: boolean; // True = Closed, False = Open
}

export interface CameraState extends BaseDeviceState {
  isRecording?: boolean;
  lastEventUrl?: string;
  streamUrl?: string; // Real MJPEG or HLS stream URL
}

// Union Type for State
export type DeviceState = LightState & ThermostatState & LockState & SensorState & CameraState;

export interface Device {
  id: string;
  userId: string;
  name: string;
  type: DeviceType;
  room?: string;
  status: DeviceStatus;
  state: DeviceState;
  lastSeen: string;
  createdAt: string;
  mqttTopic?: string;
}

// --- Chat / AI Types ---
export enum AIProvider {
  LOCAL = 'LOCAL',
  GEMINI = 'GEMINI',
  OPENAI = 'OPENAI'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

// --- Notification Types ---
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'critical' | 'success';
  timestamp: string;
  read: boolean;
}

// --- Advanced Logic Types ---

export type LogicOperator = 'AND' | 'OR';
export type ComparisonOperator = 'EQUALS' | 'GREATER' | 'LESS' | 'CONTAINS';

export interface Condition {
  id: string;
  type: 'device_state' | 'time_range' | 'variable';
  deviceId?: string;
  property?: keyof DeviceState;
  operator: ComparisonOperator;
  value: string | number | boolean;
}

export interface LogicBlock {
  id: string;
  conditions: Condition[];
  conditionOperator: LogicOperator;
  thenActions: Action[];
  elseActions: Action[];
}

export interface Action {
  id: string;
  deviceId: string;
  actionType: 'UPDATE_STATE';
  payload: Partial<DeviceState>;
  delay?: number; // milliseconds
}

export interface Scenario {
  id: string;
  name: string;
  enabled: boolean;
  trigger: {
    type: 'MANUAL' | 'SCHEDULE' | 'EVENT';
    cron?: string; // "0 8 * * *"
    deviceEvent?: { deviceId: string; property: string };
  };
  logic: LogicBlock[];
  lastRun?: string;
}

export interface EventLog {
  id: string;
  deviceId?: string;
  type: 'DEVICE_STATE' | 'SCENARIO_TRIGGERED' | 'SYSTEM' | 'ERROR';
  message: string;
  data?: any;
  timestamp: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  settings: SystemSettings;
}

export interface RoomConfig {
  id: string;
  name: string;
  path: string; 
  x: number;   
  y: number;    
  labelX: number;
  labelY: number;
}

export interface SystemSettings {
  mqttBrokerUrl: string;
  mqttUsername?: string;
  mqttPassword?: string;
  
  language: 'en' | 'ru';
  theme: 'dark' | 'light';
  
  floorPlan: RoomConfig[];

  energyCostPerKwh: number;
  currencySymbol: string;

  aiProvider: AIProvider;
  aiLocalUrl: string;       
  aiGeminiKey: string;
  aiOpenAIKey: string;

  // Security & Remote
  twoFactorEnabled: boolean;
  remoteAccess: boolean;
}
