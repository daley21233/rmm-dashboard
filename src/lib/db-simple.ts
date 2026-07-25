// src/lib/db-simple.ts

// Simple in-memory database for Render deployment

type CommandStore = Record<number, any[]>;

// In-memory store
let store: CommandStore = {};

export const db = {
  agents: [
    { id: 1, hostname: 'DESKTOP-DEMO', os: 'Windows 11 Pro', ip_address: '192.168.1.100', status: 'online', last_seen: new Date().toISOString() },
    { id: 2, hostname: 'LAPTOP-WORK', os: 'Windows 10 Pro', ip_address: '192.168.1.101', status: 'offline', last_seen: new Date().toISOString() },
    { id: 3, hostname: 'SERVER-DB', os: 'Windows Server 2022', ip_address: '192.168.1.50', status: 'online', last_seen: new Date().toISOString() },
    { id: 4, hostname: 'DESKTOP-IJ5F28E', os: 'Windows 10 Pro', ip_address: '192.168.8.100', status: 'online', last_seen: new Date().toISOString() },
  ],
  
  getAgent(id: number) {
    return this.agents.find(a => a.id === id);
  },
  
  getAgentByHostname(hostname: string) {
    return this.agents.find(a => a.hostname === hostname);
  },
  
  addAgent(agent: any) {
    const newAgent = { ...agent, id: this.agents.length + 1 };
    this.agents.push(newAgent);
    return newAgent;
  },
  
  updateAgent(id: number, data: any) {
    const index = this.agents.findIndex(a => a.id === id);
    if (index !== -1) {
      this.agents[index] = { ...this.agents[index], ...data };
      return this.agents[index];
    }
    return null;
  }
};

// Command store functions
export function getCommandStore() {
  return store;
}

export function addCommand(agentId: number, command: any) {
  if (!store[agentId]) {
    store[agentId] = [];
  }
  store[agentId].push(command);
  return command;
}

export function getCommandsForAgent(agentId: number) {
  return store[agentId] || [];
}

export function findCommand(commandId: number) {
  for (const agentId in store) {
    const commands = store[agentId];
    for (const command of commands) {
      if (command.id === commandId) {
        return command;
      }
    }
  }
  return null;
}

export function updateCommand(commandId: number, updates: any) {
  for (const agentId in store) {
    const commands = store[agentId];
    for (const command of commands) {
      if (command.id === commandId) {
        Object.assign(command, updates);
        return command;
      }
    }
  }
  return null;
}
