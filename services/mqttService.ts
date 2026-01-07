
import mqtt from 'mqtt';
import { Device, DeviceType } from '../types';
import { db } from './mockDb';
import { automationService } from './automationService';

// This is the Production-Ready MQTT Service.
// It connects via WebSockets to a broker (like Mosquitto configured with WS support).

class MqttService {
  private client: mqtt.MqttClient | null = null;
  private isConnected: boolean = false;
  
  // Load config from LocalStorage or default to standard WS port
  private config = {
    brokerUrl: 'ws://localhost:9001', 
    username: '',
    password: ''
  };

  constructor() {
    const savedConfig = localStorage.getItem('mqtt_config');
    if (savedConfig) {
      this.config = JSON.parse(savedConfig);
    }
  }

  /**
   * Initializes the connection to the real broker.
   * Call this when the app starts.
   */
  async connect() {
    console.log(`🔌 MQTT: Connecting to ${this.config.brokerUrl}...`);

    try {
      this.client = mqtt.connect(this.config.brokerUrl, {
        username: this.config.username,
        password: this.config.password,
        keepalive: 60,
        reconnectPeriod: 5000, // Retry every 5s if lost
      });

      this.client.on('connect', () => {
        console.log('✅ MQTT: Connected successfully');
        this.isConnected = true;
        this.subscribeToAllDevices();
      });

      this.client.on('error', (err) => {
        console.error('❌ MQTT Error:', err);
        this.isConnected = false;
      });

      this.client.on('offline', () => {
        console.warn('⚠️ MQTT: Client Offline');
        this.isConnected = false;
      });

      this.client.on('message', this.handleIncomingMessage.bind(this));

    } catch (e) {
      console.error('MQTT Connection Setup Failed', e);
    }
  }

  /**
   * Subscribes to topics for all devices currently in the DB.
   */
  private async subscribeToAllDevices() {
    if (!this.client || !this.isConnected) return;

    const devices = await db.getDevices();
    devices.forEach(device => {
        if (device.mqttTopic) {
            this.client?.subscribe(device.mqttTopic, (err) => {
                if (!err) console.log(`📡 Subscribed to ${device.mqttTopic}`);
            });
        }
    });

    // Also subscribe to a discovery topic if needed
    this.client.subscribe('aurihome/discovery/#');
  }

  /**
   * Handles incoming MQTT messages from real hardware.
   * Updates the Local DB so UI reflects reality.
   */
  private async handleIncomingMessage(topic: string, message: Buffer) {
    const payloadStr = message.toString();
    console.log(`📥 MQTT IN [${topic}]: ${payloadStr}`);

    try {
        // Try to parse JSON (Zigbee2MQTT standard)
        // Expected format: { "state": "ON", "brightness": 50, "temperature": 22.5 }
        let payload: any;
        try {
            payload = JSON.parse(payloadStr);
        } catch {
            // If raw string (e.g. just "ON"), normalize it
            payload = { raw: payloadStr };
            if (payloadStr === 'ON') payload.state = 'ON';
            if (payloadStr === 'OFF') payload.state = 'OFF';
        }

        // 1. Find device by Topic
        const devices = await db.getDevices();
        const device = devices.find(d => d.mqttTopic === topic);

        if (device) {
            // 2. Map payload to internal DeviceState
            const updates: any = {};
            
            // Power Mapping
            if (payload.state === 'ON' || payload.power === 'ON' || payload.val === 1) updates.power = true;
            if (payload.state === 'OFF' || payload.power === 'OFF' || payload.val === 0) updates.power = false;

            // Value Mappings
            if (payload.brightness !== undefined) updates.brightness = payload.brightness;
            if (payload.color !== undefined) updates.color = typeof payload.color === 'object' ? payload.color.hex : payload.color;
            if (payload.temperature !== undefined) updates.temperature = payload.temperature;
            if (payload.humidity !== undefined) updates.humidity = payload.humidity;
            if (payload.power_usage !== undefined) updates.powerUsage = payload.power_usage;
            if (payload.contact !== undefined) updates.contact = payload.contact;

            // 3. Update DB
            if (Object.keys(updates).length > 0) {
                await db.updateDevice(device.id, { state: updates });
                
                // 4. Trigger Automation Logic
                await automationService.checkDeviceTriggers(device.id, { ...device.state, ...updates });
            }
        }
    } catch (err) {
        console.error('Error processing MQTT message', err);
    }
  }

  /**
   * Send a command to a physical device
   */
  publish(topic: string, message: string | object) {
    if (!this.client || !this.isConnected) {
        console.warn('⚠️ Cannot publish, MQTT disconnected');
        return;
    }
    
    const payload = typeof message === 'string' ? message : JSON.stringify(message);
    this.client.publish(topic, payload);
    console.log(`📤 MQTT PUB [${topic}]: ${payload}`);
  }

  /**
   * Helper to control a device directly from UI
   */
  setDeviceState(device: Device, state: any) {
    if (!device.mqttTopic) return;
    
    // Zigbee2MQTT standard set topic
    const setTopic = `${device.mqttTopic}/set`;
    
    // Convert internal state to standard Z2M payload
    const payload: any = {};
    if (state.power !== undefined) payload.state = state.power ? 'ON' : 'OFF';
    if (state.brightness !== undefined) payload.brightness = state.brightness;
    if (state.color !== undefined) payload.color = { hex: state.color };
    if (state.targetTemperature !== undefined) payload.current_heating_setpoint = state.targetTemperature;
    
    this.publish(setTopic, payload);
  }

  updateConfig(url: string, user?: string, pass?: string) {
    this.config.brokerUrl = url;
    if(user) this.config.username = user;
    if(pass) this.config.password = pass;
    
    localStorage.setItem('mqtt_config', JSON.stringify(this.config));
    
    if (this.client) {
        this.client.end();
        this.connect(); // Reconnect with new config
    }
  }

  getConfig() {
    return this.config;
  }
}

export const mqttService = new MqttService();
