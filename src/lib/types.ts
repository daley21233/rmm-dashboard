// src/lib/types.ts

export interface Agent {
    id: number;
    hostname: string;
    os: string;
    ip_address: string;
    status: 'online' | 'offline' | 'pending';
    last_seen: string;
    created_at?: string;
    pending_commands_count?: number;
}

export interface FileItem {
    name: string;
    size: number;
    modified: string;
    is_directory: boolean;
    permissions?: string;
}

export interface CommandResponse {
    command_id: number;
    status: 'queued' | 'pending' | 'success' | 'error';
    message?: string;
}

export interface CommandResult {
    command_id: number;
    status: 'pending' | 'success' | 'error';
    output?: {
        files?: FileItem[];
        total?: number;
        path?: string;
        content?: string;
        size?: number;
        name?: string;
        // Process management
        processes?: ProcessInfo[];
        pid?: number;
        command?: string;
        args?: string[];
        action?: string;
        // Script execution
        stdout?: string;
        stderr?: string;
        returncode?: number;
    };
    error_message?: string;
    executed_at?: string;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu_percent: number;
    memory_percent: number;
    status: string;
    create_time: string;
}

export interface SystemInfo {
    hostname: string;
    os: string;
    os_version: string;
    architecture: string;
    processor: string;
    python_version: string;
    current_time: string;
    disk_total?: number;
    disk_used?: number;
    disk_free?: number;
    disk_usage_percent?: number;
    memory_total?: number;
    memory_available?: number;
    memory_usage_percent?: number;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}

// Database types
export interface DBCommand {
    id: number;
    agent_id: number;
    command_type: 
        | 'list_directory' 
        | 'download_file' 
        | 'upload_file' 
        | 'delete_file' 
        | 'create_folder' 
        | 'run_script' 
        | 'get_system_info'
        | 'list_processes'
        | 'kill_process'
        | 'start_process';
    payload: any;
    status: 'pending' | 'sent' | 'executed' | 'failed';
    created_at: string;
    executed_at: string | null;
}

export interface DBCommandResult {
    id: number;
    command_id: number;
    output: string;
    status: 'success' | 'error';
    executed_at: string;
}