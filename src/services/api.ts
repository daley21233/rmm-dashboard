// src/services/api.ts

import { Agent, FileItem, CommandResponse, CommandResult } from '@/lib/types';

const API_BASE = '/api';

// Simple fetch wrapper
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
}

// ============================================
// AGENT MANAGEMENT
// ============================================

export async function getAgents(): Promise<Agent[]> {
    const response = await apiRequest<{ agents: Agent[] }>('/agents');
    return response.agents || [];
}

export async function getAgent(agentId: number): Promise<Agent> {
    return apiRequest<Agent>(`/agents/${agentId}`);
}

// ============================================
// COMMAND QUEUING
// ============================================

export async function queueCommand(agentId: number, commandType: string, payload: any): Promise<CommandResponse> {
    const response = await fetch(`http://localhost:3000/api/queue-command`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            agent_id: agentId,
            command_type: commandType,
            payload: payload
        })
    });

    if (!response.ok) {
        throw new Error(`Failed to queue command: ${response.status}`);
    }

    return response.json();
}

// ============================================
// FILE OPERATIONS
// ============================================

export async function listDirectory(agentId: number, path: string): Promise<CommandResponse> {
    return queueCommand(agentId, 'list_directory', { path });
}

export async function downloadFile(agentId: number, path: string): Promise<CommandResponse> {
    return queueCommand(agentId, 'download_file', { path });
}

export async function uploadFile(
    agentId: number, 
    path: string, 
    contentBase64: string, 
    overwrite: boolean = true
): Promise<CommandResponse> {
    return queueCommand(agentId, 'upload_file', {
        path: path,
        content_base64: contentBase64,
        overwrite: overwrite
    });
}

export async function deleteFile(
    agentId: number, 
    path: string, 
    recursive: boolean = false
): Promise<CommandResponse> {
    return queueCommand(agentId, 'delete_file', {
        path: path,
        recursive: recursive
    });
}

export async function createFolder(agentId: number, path: string): Promise<CommandResponse> {
    return queueCommand(agentId, 'create_folder', { path });
}

// ============================================
// PROCESS MANAGEMENT
// ============================================

export async function listProcesses(agentId: number): Promise<CommandResponse> {
    return queueCommand(agentId, 'list_processes', {});
}

export async function killProcess(
    agentId: number, 
    pid: number, 
    force: boolean = false
): Promise<CommandResponse> {
    return queueCommand(agentId, 'kill_process', {
        pid: pid,
        force: force
    });
}

export async function startProcess(
    agentId: number, 
    command: string, 
    args: string[] = [], 
    workingDir: string = 'C:\\'
): Promise<CommandResponse> {
    return queueCommand(agentId, 'start_process', {
        command: command,
        args: args,
        working_dir: workingDir
    });
}

// ============================================
// SCRIPT EXECUTION
// ============================================

export async function runScript(
    agentId: number, 
    script: string, 
    scriptType: 'python' | 'powershell' | 'bash' = 'python',
    timeout: number = 30
): Promise<CommandResponse> {
    return queueCommand(agentId, 'run_script', {
        script: script,
        type: scriptType,
        timeout: timeout
    });
}

// ============================================
// SYSTEM INFORMATION
// ============================================

export async function getSystemInfo(agentId: number): Promise<CommandResponse> {
    return queueCommand(agentId, 'get_system_info', {});
}

// ============================================
// COMMAND RESULTS
// ============================================

export async function getCommandResult(commandId: number): Promise<CommandResult> {
    return apiRequest<CommandResult>(`/commands/${commandId}/result`);
}

export async function getCommandStatus(commandId: number): Promise<{ status: string; executed_at?: string }> {
    return apiRequest<{ status: string; executed_at?: string }>(`/commands/${commandId}/status`);
}

// ============================================
// BULK OPERATIONS (Convenience Functions)
// ============================================

/**
 * Upload multiple files to the agent
 */
export async function uploadMultipleFiles(
    agentId: number, 
    files: Array<{ path: string; contentBase64: string }>,
    overwrite: boolean = true
): Promise<CommandResponse[]> {
    const results: CommandResponse[] = [];
    for (const file of files) {
        const result = await uploadFile(agentId, file.path, file.contentBase64, overwrite);
        results.push(result);
    }
    return results;
}

/**
 * Delete multiple files or folders
 */
export async function deleteMultipleFiles(
    agentId: number, 
    paths: string[],
    recursive: boolean = false
): Promise<CommandResponse[]> {
    const results: CommandResponse[] = [];
    for (const path of paths) {
        const result = await deleteFile(agentId, path, recursive);
        results.push(result);
    }
    return results;
}

/**
 * Kill multiple processes
 */
export async function killMultipleProcesses(
    agentId: number, 
    pids: number[],
    force: boolean = false
): Promise<CommandResponse[]> {
    const results: CommandResponse[] = [];
    for (const pid of pids) {
        const result = await killProcess(agentId, pid, force);
        results.push(result);
    }
    return results;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert a file to base64 for upload
 */
export function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
    });
}

/**
 * Check if an agent is online
 */
export async function isAgentOnline(agentId: number): Promise<boolean> {
    try {
        const agent = await getAgent(agentId);
        return agent.status === 'online';
    } catch {
        return false;
    }
}

/**
 * Get a summary of all agents
 */
export async function getAgentsSummary(): Promise<{
    total: number;
    online: number;
    offline: number;
    pending: number;
}> {
    const agents = await getAgents();
    return {
        total: agents.length,
        online: agents.filter(a => a.status === 'online').length,
        offline: agents.filter(a => a.status === 'offline').length,
        pending: agents.filter(a => a.status === 'pending').length,
    };
}