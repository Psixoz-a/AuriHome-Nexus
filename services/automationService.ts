
import { db } from './mockDb';
import { Scenario, Device, LogicBlock, Condition, Action, DeviceState } from '../types';

class AutomationService {
  
  /**
   * Evaluates and executes a specific scenario by ID (e.g., Manual Run)
   */
  async runScenario(scenarioId: string): Promise<boolean> {
    const scenarios = await db.getScenarios();
    const scenario = scenarios.find(s => s.id === scenarioId);
    
    if (!scenario || !scenario.enabled) return false;

    console.log(`[Automation] Running Scenario: ${scenario.name}`);
    await db.createLog({
        type: 'SCENARIO_TRIGGERED',
        message: `Scenario started: ${scenario.name}`,
        data: { trigger: 'MANUAL' }
    });

    // Execute Logic Blocks
    await this.processLogicBlocks(scenario.logic);
    
    // Update last run time
    await db.updateScenario(scenario.id, { lastRun: new Date().toISOString() });
    return true;
  }

  /**
   * Checks all scenarios triggered by a specific event (e.g., Device State Change)
   * This should be called whenever a device is updated.
   */
  async checkDeviceTriggers(deviceId: string, newState: DeviceState) {
    const scenarios = await db.getScenarios();
    const eventScenarios = scenarios.filter(s => 
        s.enabled && 
        s.trigger.type === 'EVENT'
        // In a complex app, we'd check specific device IDs in the trigger config here
    );

    for (const scenario of eventScenarios) {
        // For this demo, we assume EVENT triggers run logic evaluation on ANY device change,
        // and the conditions inside the logic block filter the specific devices.
        console.log(`[Automation] Evaluating ${scenario.name} due to device update...`);
        await this.processLogicBlocks(scenario.logic);
        await db.updateScenario(scenario.id, { lastRun: new Date().toISOString() });
    }
  }

  private async processLogicBlocks(blocks: LogicBlock[]) {
    if (!blocks || blocks.length === 0) return;

    // Fetch latest device state
    const devices = await db.getDevices();

    for (const block of blocks) {
        const isConditionMet = this.evaluateConditions(block.conditions, block.conditionOperator, devices);
        
        if (isConditionMet) {
            await this.executeActions(block.thenActions);
        } else {
            await this.executeActions(block.elseActions);
        }
    }
  }

  private evaluateConditions(conditions: Condition[], operator: 'AND' | 'OR', devices: Device[]): boolean {
      if (conditions.length === 0) return true; // No conditions = always true

      const results = conditions.map(cond => {
          const device = devices.find(d => d.id === cond.deviceId);
          if (!device) return false;

          // Extract value safely
          const deviceVal = (device.state as any)[cond.property || 'power'];
          const targetVal = cond.value;

          switch (cond.operator) {
              case 'EQUALS': return String(deviceVal) === String(targetVal);
              case 'GREATER': return Number(deviceVal) > Number(targetVal);
              case 'LESS': return Number(deviceVal) < Number(targetVal);
              case 'CONTAINS': return String(deviceVal).includes(String(targetVal));
              default: return false;
          }
      });

      if (operator === 'AND') return results.every(r => r === true);
      if (operator === 'OR') return results.some(r => r === true);
      return false;
  }

  private async executeActions(actions: Action[]) {
      for (const action of actions) {
          if (action.actionType === 'UPDATE_STATE') {
              console.log(`[Automation] Action: Updating Device ${action.deviceId}`, action.payload);
              try {
                  // We use db.updateDevice directly. 
                  // IMPORTANT: To prevent infinite loops in a real app, pass a flag to not re-trigger events, 
                  // or ensure logic conditions prevent toggling back and forth instantly.
                  await db.updateDevice(action.deviceId, { state: action.payload as any });
              } catch (e) {
                  console.error("Failed to execute action", e);
              }
          }
          // Handle delays if implemented
          if (action.delay) {
              await new Promise(r => setTimeout(r, action.delay));
          }
      }
  }
}

export const automationService = new AutomationService();
