
import { GoogleGenAI, FunctionDeclaration, Type } from "@google/genai";
import { db } from "./mockDb";
import { Device, AIProvider } from "../types";

interface ControlDeviceArgs {
    deviceName: string;
    action: string;
    value?: number;
}

class AIService {
  
  // --- Core Execution Logic ---
  
  async processCommand(userMessage: string): Promise<string> {
    const user = await db.getUser();
    const settings = user.settings;

    try {
      const systemPrompt = await this.getSystemPrompt();

      switch (settings.aiProvider) {
        case AIProvider.GEMINI:
          return await this.callGemini(userMessage, systemPrompt, settings.aiGeminiKey);
        
        case AIProvider.OPENAI:
          return await this.callOpenAI(userMessage, systemPrompt, settings.aiOpenAIKey);
          
        case AIProvider.LOCAL:
          return await this.callLocalAI(userMessage, systemPrompt, settings.aiLocalUrl);
          
        default:
          return "AI Provider not configured in Settings.";
      }
    } catch (error: any) {
      console.error("AI Service Error:", error);
      return `I encountered an error: ${error.message || 'Unknown system fault'}`;
    }
  }

  // --- Providers Implementation ---

  // 1. Google Gemini
  private async callGemini(message: string, systemPrompt: string, apiKey: string): Promise<string> {
    if (!apiKey) return "Please configure Gemini API Key in Settings > System Core.";
    
    const ai = new GoogleGenAI({ apiKey });
    
    // Explicitly typed Tool Definition for Google GenAI SDK
    const controlDeviceTool: FunctionDeclaration = {
      name: 'controlDevice',
      description: 'Control smart home devices. Supports single devices or bulk actions (e.g. "all lights").',
      parameters: {
        type: Type.OBJECT,
        properties: {
          deviceName: { 
              type: Type.STRING, 
              description: 'Name of device OR "all", "lights", "kitchen devices"' 
          },
          action: { 
              type: Type.STRING, 
              description: 'ON, OFF, SET_TEMP, SET_BRIGHTNESS, LOCK, UNLOCK' 
          },
          value: { 
              type: Type.NUMBER, 
              description: 'Value for temp/brightness' 
          },
        },
        required: ['deviceName', 'action']
      }
    };

    const getDevicesTool: FunctionDeclaration = {
        name: 'getDevices',
        description: 'Get list of devices and their current status properties.',
        parameters: { type: Type.OBJECT, properties: {} }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-preview-12-2025', // Using the latest recommended model
      contents: message,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: [controlDeviceTool, getDevicesTool] }],
      },
    });

    // Handle Function Calls
    const candidate = response.candidates?.[0];
    if (candidate && candidate.content && candidate.content.parts) {
         for (const part of candidate.content.parts) {
             if (part.functionCall) {
                 // Cast args to expected type safely
                 const args = part.functionCall.args as unknown as ControlDeviceArgs;
                 const result = await this.executeFunction(part.functionCall.name, args);
                 return result; 
             }
         }
    }

    return response.text || "I didn't receive a clear response from the home core.";
  }

  // 2. OpenAI (GPT-4o / GPT-3.5)
  private async callOpenAI(message: string, systemPrompt: string, apiKey: string): Promise<string> {
    if (!apiKey) return "Please configure OpenAI API Key in Settings.";

    // OpenAI uses a slightly different schema format, but compatible structure
    const tools = [
        {
            type: 'function',
            function: {
                name: 'controlDevice',
                description: 'Control smart home devices.',
                parameters: {
                    type: 'object',
                    properties: {
                        deviceName: { type: 'string', description: 'Device name' },
                        action: { type: 'string', description: 'ON, OFF, etc' },
                        value: { type: 'number' }
                    },
                    required: ['deviceName', 'action']
                }
            }
        },
        {
            type: 'function',
            function: {
                name: 'getDevices',
                description: 'Get device list',
                parameters: { type: 'object', properties: {} }
            }
        }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: message }
            ],
            tools: tools,
            tool_choice: 'auto'
        })
    });

    if (!response.ok) throw new Error('OpenAI API request failed');
    const data = await response.json();
    const choice = data.choices[0];

    if (choice.finish_reason === 'tool_calls') {
        const toolCall = choice.message.tool_calls[0];
        const args = JSON.parse(toolCall.function.arguments);
        return await this.executeFunction(toolCall.function.name, args);
    }

    return choice.message.content;
  }

  // 3. Local AI (Simulated or Ollama-compatible endpoint)
  private async callLocalAI(message: string, systemPrompt: string, url: string): Promise<string> {
      // NOTE: This assumes a custom endpoint wrapper or standard Ollama endpoint.
      
      if (url.includes('localhost') && !url.includes('11434')) {
          // Simulation Mode (Hardware not required for demo)
          await new Promise(r => setTimeout(r, 800));
          if (message.toLowerCase().includes('light') && message.toLowerCase().includes('on')) {
              await this.executeFunction('controlDevice', { deviceName: 'light', action: 'ON' });
              return "Local Core: Lights turned ON.";
          }
           if (message.toLowerCase().includes('light') && message.toLowerCase().includes('off')) {
              await this.executeFunction('controlDevice', { deviceName: 'light', action: 'OFF' });
              return "Local Core: Lights turned OFF.";
          }
          return "Local Core: Command processed (Simulation Mode).";
      }

      // Real Local Request (Ollama format example)
      try {
          const res = await fetch(`${url}/api/generate`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  model: 'llama3', 
                  prompt: `${systemPrompt}\nUser: ${message}\nAssistant:`, 
                  stream: false 
              })
          });
          const data = await res.json();
          return data.response;
      } catch (e) {
          return `Failed to connect to Local AI at ${url}. Check if Ollama is running.`;
      }
  }

  // --- Helpers ---

  private async getSystemPrompt(): Promise<string> {
      const devices = await db.getDevices();
      const deviceContext = devices.map(d => `${d.name} (${d.room}): ${JSON.stringify(d.state)}`).join('\n');
      return `You are the AuriHome Nexus Assistant. Current Time: ${new Date().toLocaleTimeString()}.
      
      Available Devices:
      ${deviceContext}

      Use 'controlDevice' to change states.
      Use 'getDevices' to query status.
      Be concise and helpful.`;
  }

  private async executeFunction(name: string, args: ControlDeviceArgs | any): Promise<string> {
      if (name === 'getDevices') {
          const devices = await db.getDevices();
          return `Devices: ${devices.map(d => `${d.name}: ${d.state.power ? 'ON' : 'OFF'}`).join(', ')}`;
      }

      if (name === 'controlDevice') {
          const { deviceName, action, value } = args;
          const allDevices = await db.getDevices();
          const lowerName = deviceName.toLowerCase();

          // --- Bulk Logic Logic ---
          let targets: Device[] = [];

          // 1. "All" Logic
          if (lowerName.includes('all') || lowerName.includes('everything') || lowerName.includes('every')) {
              if (lowerName.includes('light')) {
                  targets = allDevices.filter(d => d.type === 'LIGHT');
              } else if (lowerName.includes('lock')) {
                   targets = allDevices.filter(d => d.type === 'LOCK');
              } else {
                   targets = allDevices.filter(d => ['LIGHT', 'SWITCH', 'THERMOSTAT'].includes(d.type));
              }
          } 
          // 2. Specific Room Logic (e.g. "Living Room Lights")
          else {
              const roomMatch = allDevices.find(d => d.room && lowerName.includes(d.room.toLowerCase()));
              if (roomMatch && lowerName.includes('light')) {
                  targets = allDevices.filter(d => d.room === roomMatch.room && d.type === 'LIGHT');
              } else {
                  const single = allDevices.find(d => d.name.toLowerCase().includes(lowerName));
                  if (single) targets.push(single);
              }
          }
          
          if (targets.length === 0) return `Device(s) matching "${deviceName}" not found.`;

          // Execute actions
          let successCount = 0;
          for (const target of targets) {
             let updates: any = {};
             switch (action) {
                case 'ON': updates = { power: true }; break;
                case 'OFF': updates = { power: false }; break;
                case 'SET_TEMP': updates = { temperature: value }; break;
                case 'SET_BRIGHTNESS': updates = { brightness: value }; break;
                case 'LOCK': updates = { locked: true }; break;
                case 'UNLOCK': updates = { locked: false }; break;
             }
             if (Object.keys(updates).length > 0) {
                 await db.updateDevice(target.id, { state: { ...target.state, ...updates } });
                 successCount++;
             }
          }

          if (successCount > 1) {
              return `Successfully ${action} for ${successCount} devices.`;
          } else {
              return `Successfully set ${targets[0].name} to ${action}.`;
          }
      }
      return "Unknown function";
  }
}

export const aiService = new AIService();
