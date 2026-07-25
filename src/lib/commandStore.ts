// src/lib/commandStore.ts

// ✅ Shared command store - used by all API routes
// Use global to persist across API routes
declare global {
    var _commandStore: Record<number, any[]>;
}

if (!global._commandStore) {
    global._commandStore = {};
}

export function getCommandStore() {
    return global._commandStore;
}

export function setCommandStore(store: Record<number, any[]>) {
    global._commandStore = store;
}

export function addCommand(agentId: number, command: any) {
    if (!global._commandStore[agentId]) {
        global._commandStore[agentId] = [];
    }
    global._commandStore[agentId].push(command);
    return command;
}

export function getCommandsForAgent(agentId: number) {
    return global._commandStore[agentId] || [];
}

export function findCommand(commandId: number) {
    for (const agentId in global._commandStore) {
        const commands = global._commandStore[agentId];
        for (const command of commands) {
            if (command.id === commandId) {
                return command;
            }
        }
    }
    return null;
}

export function updateCommand(commandId: number, updates: any) {
    for (const agentId in global._commandStore) {
        const commands = global._commandStore[agentId];
        for (const command of commands) {
            if (command.id === commandId) {
                Object.assign(command, updates);
                return command;
            }
        }
    }
    return null;
}

// For debugging
export function getFullStore() {
    return global._commandStore;
}