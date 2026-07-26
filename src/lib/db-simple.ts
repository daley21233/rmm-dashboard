// src/lib/db-simple.ts

// Simple JSON file-based database for Render deployment
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DATA_PATH = path.join(process.cwd(), 'data.json');

// Default data structure
const defaultData = {
  users: [
    {
      id: 1,
      username: 'admin',
      // Password: admin123
      password: '$2a$10$N9qo8uLOickgx2ZMRZoMy.Mr/.6I0j5YK1x8tVvZqY4kqY5qY5qY5',
      email: 'admin@rmm.local',
      role: 'admin',
      created_at: new Date().toISOString()
    }
  ],
  agents: [
    { id: 1, hostname: 'DESKTOP-DEMO', os: 'Windows 11 Pro', ip_address: '192.168.1.100', status: 'online', last_seen: new Date().toISOString() },
    { id: 2, hostname: 'LAPTOP-WORK', os: 'Windows 10 Pro', ip_address: '192.168.1.101', status: 'offline', last_seen: new Date().toISOString() },
    { id: 3, hostname: 'SERVER-DB', os: 'Windows Server 2022', ip_address: '192.168.1.50', status: 'online', last_seen: new Date().toISOString() },
    { id: 4, hostname: 'DESKTOP-IJ5F28E', os: 'Windows 10 Pro', ip_address: '192.168.8.100', status: 'online', last_seen: new Date().toISOString() },
  ],
  commands: [],
  commandResults: [],
  auditLogs: []
};

// Read data from file
function readData() {
  try {
    if (fs.existsSync(DATA_PATH)) {
      const raw = fs.readFileSync(DATA_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (error) {
    console.error('Error reading data file:', error);
  }
  // Return default data if file doesn't exist or is corrupted
  return JSON.parse(JSON.stringify(defaultData));
}

// Write data to file
function writeData(data: any) {
  try {
    fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error writing data file:', error);
  }
}

// Initialize data file if it doesn't exist
function initData() {
  if (!fs.existsSync(DATA_PATH)) {
    writeData(defaultData);
  }
}
initData();

// Database interface
export const db = {
  get users() {
    const data = readData();
    return data.users;
  },
  
  get agents() {
    const data = readData();
    return data.agents;
  },
  
  get commands() {
    const data = readData();
    return data.commands || [];
  },
  
  get commandResults() {
    const data = readData();
    return data.commandResults || [];
  },
  
  // User methods
  findUserByUsername(username: string) {
    return this.users.find((u: any) => u.username === username);
  },
  
  findUserById(id: number) {
    return this.users.find((u: any) => u.id === id);
  },
  
  // Agent methods
  getAgent(id: number) {
    return this.agents.find((a: any) => a.id === id);
  },
  
  getAgentByHostname(hostname: string) {
    return this.agents.find((a: any) => a.hostname === hostname);
  },
  
  addAgent(agent: any) {
    const data = readData();
    const newAgent = { ...agent, id: data.agents.length + 1 };
    data.agents.push(newAgent);
    writeData(data);
    return newAgent;
  },
  
  updateAgent(id: number, updates: any) {
    const data = readData();
    const index = data.agents.findIndex((a: any) => a.id === id);
    if (index !== -1) {
      data.agents[index] = { ...data.agents[index], ...updates };
      writeData(data);
      return data.agents[index];
    }
    return null;
  },
  
  // Command methods
  addCommand(agentId: number, command: any) {
    const data = readData();
    const newCommand = { ...command, agent_id: agentId };
    if (!data.commands) data.commands = [];
    data.commands.push(newCommand);
    writeData(data);
    return newCommand;
  },
  
  getCommandsForAgent(agentId: number) {
    const data = readData();
    return (data.commands || []).filter((c: any) => c.agent_id === agentId);
  },
  
  findCommand(commandId: number) {
    const data = readData();
    return (data.commands || []).find((c: any) => c.id === commandId) || null;
  },
  
  updateCommand(commandId: number, updates: any) {
    const data = readData();
    const index = (data.commands || []).findIndex((c: any) => c.id === commandId);
    if (index !== -1) {
      data.commands[index] = { ...data.commands[index], ...updates };
      writeData(data);
      return data.commands[index];
    }
    return null;
  },
  
  // CommandResult methods
  addCommandResult(result: any) {
    const data = readData();
    if (!data.commandResults) data.commandResults = [];
    data.commandResults.push(result);
    writeData(data);
    return result;
  },
  
  getCommandResult(commandId: number) {
    const data = readData();
    return (data.commandResults || []).find((r: any) => r.command_id === commandId) || null;
  }
};
