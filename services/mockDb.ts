
import { Device, DeviceType, DeviceStatus, Scenario, EventLog, User, AIProvider, DeviceState } from '../types';
// We import automationService lazily or use a callback to avoid circular dependency issues in a simple setup
// For this architecture, we will rely on the UI/Controllers to call AutomationService, 
// OR we export a helper here that doesn't import the class directly yet.

// PRODUCTION: Start with empty arrays. Data must be added by user or discovery.
const INITIAL_DEVICES: Device[] = [];
const INITIAL_SCENARIOS: Scenario[] = [];
const INITIAL_LOGS: EventLog[] = [];

// Default Admin User (Bootstrap)
const CURRENT_USER: User = {
  id: 'u1',
  email: 'admin@aurihome.com',
  name: 'Admin',
  settings: {
    mqttBrokerUrl: 'ws://localhost:9001',
    language: 'en', // Default language
    theme: 'dark',
    energyCostPerKwh: 5.50,
    currencySymbol: '$',
    // Start with a blank floor plan
    floorPlan: [],
    // Default AI Config
    aiProvider: AIProvider.GEMINI,
    aiLocalUrl: 'http://localhost:8000',
    aiGeminiKey: '',
    aiOpenAIKey: '',
    // Security Defaults
    twoFactorEnabled: false,
    remoteAccess: false
  }
};

// Internal Mock Password Store (Not exposed in User interface for security simulation)
const MOCK_PASSWORDS: Record<string, string> = {
    'u1': 'password' // Default password
};

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class MockDB {
  private get<T>(key: string, initial: T): T {
    const stored = localStorage.getItem(key);
    if (!stored) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  }

  private set(key: string, data: any) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Factory Reset
  async resetDatabase(): Promise<void> {
    await delay(500);
    localStorage.clear();
    window.location.reload();
  }

  async getUser(): Promise<User> {
    await delay(300);
    return this.get<User>('user', CURRENT_USER);
  }

  async verifyPassword(userId: string, passwordInput: string): Promise<boolean> {
      await delay(500);
      const stored = localStorage.getItem('auth_secrets');
      const secrets = stored ? JSON.parse(stored) : MOCK_PASSWORDS;
      return secrets[userId] === passwordInput;
  }

  async changePassword(userId: string, newPassword: string): Promise<void> {
      await delay(500);
      const stored = localStorage.getItem('auth_secrets');
      const secrets = stored ? JSON.parse(stored) : MOCK_PASSWORDS;
      secrets[userId] = newPassword;
      localStorage.setItem('auth_secrets', JSON.stringify(secrets));
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    await delay(500);
    const user = await this.getUser();
    
    // Logic to properly merge settings (especially replacing arrays like floorPlan)
    let newSettings = user.settings;
    if (updates.settings) {
        newSettings = {
            ...user.settings,
            ...updates.settings,
            // Explicitly overwrite floorPlan if provided, don't merge arrays
            floorPlan: updates.settings.floorPlan || user.settings.floorPlan
        };
    }

    const newUser = { ...user, ...updates, settings: newSettings };
    this.set('user', newUser);
    return newUser;
  }

  async getDevices(): Promise<Device[]> {
    await delay(200);
    return this.get<Device[]>('devices', INITIAL_DEVICES);
  }

  async getDeviceById(id: string): Promise<Device | undefined> {
    await delay(100);
    const devices = this.get<Device[]>('devices', INITIAL_DEVICES);
    return devices.find(d => d.id === id);
  }

  async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    await delay(150);
    const devices = this.get<Device[]>('devices', INITIAL_DEVICES);
    const index = devices.findIndex(d => d.id === id);
    if (index === -1) throw new Error('Device not found');
    
    // Deep merge for state
    const currentState = devices[index].state || {};
    const updatesState = updates.state || {};
    const newState = { ...currentState, ...updatesState } as DeviceState;

    devices[index] = { 
        ...devices[index], 
        ...updates, 
        state: newState,
        lastSeen: new Date().toISOString() 
    };
    this.set('devices', devices);
    
    // Create log if meaningful change
    if (updates.state) {
        this.createLog({
        type: 'DEVICE_STATE',
        deviceId: id,
        message: `${devices[index].name} state changed`,
        data: updates.state
        });
    }

    return devices[index];
  }

  async addDevice(device: Omit<Device, 'id' | 'createdAt' | 'lastSeen' | 'status'>): Promise<Device> {
    await delay(400);
    const devices = this.get<Device[]>('devices', INITIAL_DEVICES);
    const newDevice: Device = {
      ...device,
      id: Math.random().toString(36).substr(2, 9),
      status: DeviceStatus.ONLINE,
      lastSeen: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    devices.push(newDevice);
    this.set('devices', devices);
    return newDevice;
  }

  async deleteDevice(id: string): Promise<void> {
    await delay(300);
    const devices = this.get<Device[]>('devices', INITIAL_DEVICES);
    this.set('devices', devices.filter(d => d.id !== id));
  }

  async getScenarios(): Promise<Scenario[]> {
    await delay(200);
    return this.get<Scenario[]>('scenarios', INITIAL_SCENARIOS);
  }

  async updateScenario(id: string, updates: Partial<Scenario>): Promise<Scenario> {
    await delay(200);
    const scenarios = this.get<Scenario[]>('scenarios', INITIAL_SCENARIOS);
    const index = scenarios.findIndex(s => s.id === id);
    if (index === -1) throw new Error('Scenario not found');
    
    scenarios[index] = { ...scenarios[index], ...updates };
    this.set('scenarios', scenarios);
    return scenarios[index];
  }

  async createScenario(scenario: Omit<Scenario, 'id'>): Promise<Scenario> {
    await delay(300);
    const scenarios = this.get<Scenario[]>('scenarios', INITIAL_SCENARIOS);
    const newScenario = { ...scenario, id: Math.random().toString(36).substr(2, 9) };
    scenarios.push(newScenario);
    this.set('scenarios', scenarios);
    return newScenario;
  }

  async deleteScenario(id: string): Promise<void> {
     await delay(200);
     const scenarios = this.get<Scenario[]>('scenarios', INITIAL_SCENARIOS);
     this.set('scenarios', scenarios.filter(s => s.id !== id));
  }

  async getLogs(): Promise<EventLog[]> {
    return this.get<EventLog[]>('logs', INITIAL_LOGS).sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async createLog(log: Omit<EventLog, 'id' | 'timestamp'>): Promise<EventLog> {
    const logs = this.get<EventLog[]>('logs', INITIAL_LOGS);
    const newLog: EventLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    // Keep last 100 logs
    const updatedLogs = [newLog, ...logs].slice(0, 100);
    this.set('logs', updatedLogs);
    return newLog;
  }
}

export const db = new MockDB();
