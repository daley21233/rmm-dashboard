// src/app/dashboard/page.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as api from '@/services/api';

interface Agent {
    id: number;
    hostname: string;
    os: string;
    ip_address: string;
    status: 'online' | 'offline' | 'pending';
    last_seen: string;
}

interface FileItem {
    name: string;
    size: number;
    modified: string;
    is_directory: boolean;
}

export default function DashboardPage() {
    // ============================================
    // AUTHENTICATION STATE
    // ============================================
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    // ============================================
    // APP STATE
    // ============================================
    const [agents, setAgents] = useState<Agent[]>([]);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPath, setCurrentPath] = useState<string>('C:');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [fileLoading, setFileLoading] = useState<boolean>(false);
    const [currentTime, setCurrentTime] = useState<string>('');
    const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
    const [commandStatus, setCommandStatus] = useState<string>('');
    const [lastCommandId, setLastCommandId] = useState<number | null>(null);

    // ============================================
    // AUTHENTICATION CHECK
    // ============================================
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('auth_token');
            
            if (!token) {
                console.log('🔒 No token, redirecting to login');
                window.location.href = '/login';
                return;
            }

            try {
                const response = await fetch('/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    console.log('✅ Authenticated!');
                    setIsAuthenticated(true);
                    setCurrentTime(new Date().toLocaleTimeString());
                    loadAgents();
                    loadDirectory('C:');
                } else {
                    console.log('❌ Invalid token');
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('user');
                    window.location.href = '/login';
                }
            } catch (error) {
                console.error('❌ Auth error:', error);
                window.location.href = '/login';
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ============================================
    // LOGOUT HANDLER
    // ============================================
    const handleLogout = () => {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    // ============================================
    // HELPER FUNCTIONS
    // ============================================
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(1) + ' ' + sizes[i];
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const getFileIcon = (fileName: string, isDirectory: boolean) => {
        if (isDirectory) return '📁';
        const ext = fileName.split('.').pop()?.toLowerCase();
        if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'gif' || ext === 'svg') return '🖼️';
        if (ext === 'pdf') return '📕';
        if (ext === 'doc' || ext === 'docx') return '📘';
        if (ext === 'xls' || ext === 'xlsx') return '📗';
        if (ext === 'zip' || ext === 'rar') return '📦';
        return '📄';
    };

    const getStatusColor = (status: string): string => {
        if (status === 'online') return 'bg-green-500';
        if (status === 'offline') return 'bg-red-500';
        return 'bg-yellow-500';
    };

    const getStatusBadge = (status: string): string => {
        if (status === 'online') return 'bg-green-100 text-green-800 border-green-300';
        if (status === 'offline') return 'bg-red-100 text-red-800 border-red-300';
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    };

    // ============================================
    // POLL FOR RESULT
    // ============================================
    const pollForResult = useCallback(async (commandId: number): Promise<any> => {
        console.log(`🔍 Polling for command ${commandId}...`);
        
        for (let attempt = 0; attempt < 30; attempt++) {
            try {
                const result = await api.getCommandResult(commandId);
                console.log(`📊 Poll attempt ${attempt + 1}/30:`, result);
                
                if (result.status === 'success' || result.status === 'error') {
                    console.log(`✅ Command ${commandId} completed`);
                    return result;
                }
                
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (error) {
                console.warn(`⚠️ Polling error:`, error);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
        console.warn(`⚠️ Command ${commandId} timed out`);
        return { status: 'pending', message: 'Command timed out', command_id: commandId };
    }, []);

    // ============================================
    // LOAD AGENTS - ALWAYS SELECT AGENT 4
    // ============================================
    const loadAgents = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const agentList = await api.getAgents();
            console.log('📋 Loaded agents:', agentList);
            setAgents(agentList);
            
            // ✅ ALWAYS select agent 4 if it exists
            const agent4 = agentList.find(a => a.id === 4);
            if (agent4) {
                console.log('🔍 Found Agent 4 (DESKTOP-IJ5F28E), selecting it!');
                setSelectedAgent(agent4);
                localStorage.setItem('selected_agent_id', '4');
            } else {
                // If agent 4 doesn't exist, try to register it
                console.log('⚠️ Agent 4 not found, attempting to register it...');
                try {
                    const registerResponse = await fetch('/api/agents', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            hostname: 'DESKTOP-IJ5F28E',
                            os: 'Windows 10 Pro',
                            ip_address: '192.168.8.100',
                            agent_version: '1.0.0'
                        })
                    });
                    const newAgent = await registerResponse.json();
                    console.log('✅ Agent 4 registered:', newAgent);
                    
                    // Reload agents after registration
                    const updatedList = await api.getAgents();
                    setAgents(updatedList);
                    const newAgent4 = updatedList.find(a => a.id === 4);
                    if (newAgent4) {
                        setSelectedAgent(newAgent4);
                        localStorage.setItem('selected_agent_id', '4');
                    }
                } catch (registerError) {
                    console.error('Failed to register agent 4:', registerError);
                    // Fallback to first online agent
                    const onlineAgent = agentList.find(a => a.status === 'online');
                    if (onlineAgent) {
                        console.log('🔍 Selecting online agent:', onlineAgent);
                        setSelectedAgent(onlineAgent);
                    } else if (agentList.length > 0) {
                        console.log('🔍 Selecting first agent:', agentList[0]);
                        setSelectedAgent(agentList[0]);
                    }
                }
            }
        } catch (err) {
            console.error('Error loading agents:', err);
            setError('Failed to load agents');
            
            // Fallback to mock data with Agent 4
            const mockAgents: Agent[] = [
                {
                    id: 1,
                    hostname: 'DESKTOP-DEMO',
                    os: 'Windows 11 Pro',
                    ip_address: '192.168.1.100',
                    status: 'online',
                    last_seen: new Date().toISOString(),
                },
                {
                    id: 2,
                    hostname: 'LAPTOP-WORK',
                    os: 'Windows 10 Pro',
                    ip_address: '192.168.1.101',
                    status: 'offline',
                    last_seen: new Date(Date.now() - 3600000).toISOString(),
                },
                {
                    id: 3,
                    hostname: 'SERVER-DB',
                    os: 'Windows Server 2022',
                    ip_address: '192.168.1.50',
                    status: 'online',
                    last_seen: new Date().toISOString(),
                },
                {
                    id: 4,
                    hostname: 'DESKTOP-IJ5F28E',
                    os: 'Windows 10 Pro',
                    ip_address: '192.168.8.100',
                    status: 'online',
                    last_seen: new Date().toISOString(),
                },
            ];
            setAgents(mockAgents);
            // ✅ Select Agent 4 from mock data
            const mockAgent4 = mockAgents.find(a => a.id === 4);
            if (mockAgent4) {
                setSelectedAgent(mockAgent4);
                localStorage.setItem('selected_agent_id', '4');
            } else {
                const onlineAgent = mockAgents.find(a => a.status === 'online');
                setSelectedAgent(onlineAgent || mockAgents[0]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // ============================================
    // LOAD DIRECTORY
    // ============================================
    const loadDirectory = useCallback(async (path: string) => {
        // ✅ Use selectedAgent or fallback to agent 4
        const targetAgent = selectedAgent || agents.find(a => a.id === 4);
        
        if (!targetAgent) {
            setFileLoading(true);
            try {
                const mockFiles: FileItem[] = [
                    { name: 'Documents', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'Downloads', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'Desktop', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'report.docx', size: 24576, modified: new Date().toISOString(), is_directory: false },
                    { name: 'config.json', size: 1024, modified: new Date().toISOString(), is_directory: false },
                    { name: 'notes.txt', size: 512, modified: new Date().toISOString(), is_directory: false },
                ];
                setFiles(mockFiles);
                setCurrentPath(path);
            } catch (err) {
                setError('Failed to load directory');
            } finally {
                setFileLoading(false);
            }
            return;
        }

        setFileLoading(true);
        setError(null);
        
        try {
            console.log(`📂 Listing: ${path} for agent ${targetAgent.id} (${targetAgent.hostname})`);
            const command = await api.listDirectory(targetAgent.id, path);
            const commandId = command.command_id;
            console.log(`✅ Directory listing command queued with ID: ${commandId} for agent ${targetAgent.id}`);
            setLastCommandId(commandId);
            
            const result = await pollForResult(commandId);
            
            if (result.status === 'success' && result.output) {
                const output = result.output as any;
                if (output.files) {
                    setFiles(output.files);
                    setCurrentPath(path);
                    console.log(`📁 Loaded ${output.files.length} files`);
                }
            } else {
                // Fallback to mock data
                const mockFiles: FileItem[] = [
                    { name: 'Documents', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'Downloads', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'Desktop', size: 0, modified: new Date().toISOString(), is_directory: true },
                    { name: 'report.docx', size: 24576, modified: new Date().toISOString(), is_directory: false },
                    { name: 'config.json', size: 1024, modified: new Date().toISOString(), is_directory: false },
                    { name: 'notes.txt', size: 512, modified: new Date().toISOString(), is_directory: false },
                ];
                setFiles(mockFiles);
                setCurrentPath(path);
            }
        } catch (err) {
            console.error('Error loading directory:', err);
            setError(err instanceof Error ? err.message : 'Failed to load directory');
        } finally {
            setFileLoading(false);
        }
    }, [selectedAgent, agents, pollForResult]);

    // ============================================
    // QUEUE COMMAND - ALWAYS USE AGENT 4
    // ============================================
    const queueCommand = useCallback(async (commandType: string, payload: any) => {
        // ✅ Force agent 4 if available
        const targetAgent = selectedAgent || agents.find(a => a.id === 4);
        
        if (!targetAgent) {
            alert('No agent available. Please make sure an agent is connected.');
            return null;
        }

        console.log(`📤 Queuing command for Agent ID: ${targetAgent.id} (${targetAgent.hostname})`);
        setCommandStatus(`Queuing ${commandType} for Agent ${targetAgent.id}...`);
        
        try {
            const result = await api.queueCommand(targetAgent.id, commandType, payload);
            const commandId = result.command_id;
            console.log(`✅ ${commandType} command queued for Agent ${targetAgent.id} with ID: ${commandId}`);
            setLastCommandId(commandId);
            setCommandStatus(`✅ ${commandType} queued (ID: ${commandId}) for Agent ${targetAgent.id}`);
            
            alert(`✅ ${commandType} command queued for Agent ${targetAgent.id}! Command ID: ${commandId}`);
            
            if (['list_directory', 'download_file', 'upload_file', 'delete_file', 'create_folder'].includes(commandType)) {
                try {
                    const commandResult = await pollForResult(commandId);
                    if (['upload_file', 'delete_file', 'create_folder'].includes(commandType)) {
                        setTimeout(() => loadDirectory(currentPath), 1000);
                    }
                    return commandResult;
                } catch (pollError) {
                    console.warn('⚠️ Polling failed but command was queued');
                    return result;
                }
            }
            return result;
        } catch (error) {
            console.error(`Error queuing ${commandType}:`, error);
            setCommandStatus(`❌ Failed to queue ${commandType}`);
            alert(`❌ Failed to queue ${commandType} command: ${error instanceof Error ? error.message : 'Unknown error'}`);
            return null;
        } finally {
            setTimeout(() => setCommandStatus(''), 5000);
        }
    }, [selectedAgent, agents, pollForResult, currentPath, loadDirectory]);

    // ============================================
    // NAVIGATION
    // ============================================
    const navigateTo = useCallback((targetPath: string) => {
        if (targetPath === '..') {
            const parts = currentPath.split('\\');
            const parentPath = parts.slice(0, -1).join('\\') || 'C:';
            loadDirectory(parentPath);
            return;
        }
        const newPath = currentPath === 'C:' 
            ? `C:\\${targetPath}` 
            : `${currentPath}\\${targetPath}`;
        loadDirectory(newPath);
    }, [currentPath, loadDirectory]);

    const handleFileClick = useCallback((file: FileItem) => {
        if (file.is_directory) {
            navigateTo(file.name);
        }
    }, [navigateTo]);

    // ============================================
    // FILE OPERATIONS
    // ============================================
    const handleUploadFile = useCallback(async (file: File) => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const base64 = (e.target?.result as string).split(',')[1];
                const filePath = `${currentPath}\\${file.name}`;
                await queueCommand('upload_file', {
                    path: filePath,
                    content_base64: base64,
                    overwrite: true
                });
                setShowUploadModal(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file');
        }
    }, [selectedAgent, currentPath, queueCommand]);

    const handleDownloadFile = useCallback(async (fileName: string) => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }

        try {
            const filePath = `${currentPath}\\${fileName}`;
            await queueCommand('download_file', { path: filePath });
        } catch (error) {
            console.error('Error downloading file:', error);
            alert('Failed to download file');
        }
    }, [selectedAgent, currentPath, queueCommand]);

    const handleDeleteFile = useCallback(async (fileName: string) => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }
        if (!window.confirm(`Delete ${fileName}?`)) return;

        try {
            const filePath = `${currentPath}\\${fileName}`;
            await queueCommand('delete_file', { path: filePath, recursive: false });
            setTimeout(() => loadDirectory(currentPath), 1000);
        } catch (error) {
            console.error('Error deleting file:', error);
            alert('Failed to delete file');
        }
    }, [selectedAgent, currentPath, queueCommand, loadDirectory]);

    const handleCreateFolder = useCallback(async () => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }
        
        const folderName = window.prompt('Enter folder name:');
        if (!folderName) return;

        try {
            const folderPath = `${currentPath}\\${folderName}`;
            await queueCommand('create_folder', { path: folderPath });
            setTimeout(() => loadDirectory(currentPath), 1000);
        } catch (error) {
            console.error('Error creating folder:', error);
            alert('Failed to create folder');
        }
    }, [selectedAgent, currentPath, queueCommand, loadDirectory]);

    // ============================================
    // PROCESS MANAGEMENT
    // ============================================
    const handleListProcesses = useCallback(async () => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }
        await queueCommand('list_processes', {});
    }, [selectedAgent, queueCommand]);

    const handleKillProcess = useCallback(async () => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }
        
        const pidInput = prompt('Enter Process ID (PID) to kill:');
        if (!pidInput) return;
        
        const pid = parseInt(pidInput);
        if (isNaN(pid) || pid <= 0) {
            alert('Please enter a valid PID');
            return;
        }

        if (!window.confirm(`Kill process ${pid}?`)) return;
        await queueCommand('kill_process', { pid, force: false });
    }, [selectedAgent, queueCommand]);

    const handleStartProcess = useCallback(async () => {
        if (!selectedAgent) {
            alert('Please select an agent first');
            return;
        }
        
        const command = prompt('Enter command to run (e.g., notepad.exe):');
        if (!command) return;

        const argsInput = prompt('Enter arguments (comma separated):');
        const args = argsInput ? argsInput.split(',').map(a => a.trim()).filter(a => a) : [];

        await queueCommand('start_process', { 
            command, 
            args,
            working_dir: 'C:\\'
        });
    }, [selectedAgent, queueCommand]);

    // ============================================
    // SWITCH TO AGENT 4
    // ============================================
    const switchToAgent4 = useCallback(() => {
        const agent4 = agents.find(a => a.id === 4);
        if (agent4) {
            setSelectedAgent(agent4);
            localStorage.setItem('selected_agent_id', '4');
            alert('✅ Switched to Agent 4 (DESKTOP-IJ5F28E)');
            // Refresh directory with new agent
            loadDirectory(currentPath);
        } else {
            alert('❌ Agent 4 not found! Make sure the agent is running.');
            // Try to register agent 4
            fetch('/api/agents', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostname: 'DESKTOP-IJ5F28E',
                    os: 'Windows 10 Pro',
                    ip_address: '192.168.8.100',
                    agent_version: '1.0.0'
                })
            })
            .then(r => r.json())
            .then(data => {
                console.log('✅ Agent 4 registered:', data);
                alert('✅ Agent 4 registered! Refreshing...');
                window.location.reload();
            })
            .catch(err => {
                console.error('Failed to register agent 4:', err);
                alert('❌ Failed to register Agent 4. Make sure the agent is running.');
            });
        }
    }, [agents, currentPath, loadDirectory]);

    // ============================================
    // LOADING STATE
    // ============================================
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
                    <p className="mt-4">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    // ============================================
    // RENDER
    // ============================================
    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
                                🚀 RMM Dashboard
                                <span className="text-sm font-normal bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                                    Demo Mode
                                </span>
                            </h1>
                            <p className="text-gray-600 mt-1">Remote Monitoring & Management - File Browser</p>
                            {selectedAgent && (
                                <p className="text-xs text-gray-400 mt-1">
                                    Connected to: <span className="font-semibold">{selectedAgent.hostname}</span> (ID: {selectedAgent.id})
                                </p>
                            )}
                            {lastCommandId && (
                                <p className="text-xs text-gray-400">Last Command: {lastCommandId}</p>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">{currentTime}</span>
                            <button
                                onClick={() => {
                                    loadAgents();
                                    loadDirectory(currentPath);
                                    setCurrentTime(new Date().toLocaleTimeString());
                                }}
                                className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                🔄 Refresh
                            </button>
                            <button
                                onClick={switchToAgent4}
                                className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                            >
                                🔄 Switch to Agent 4
                            </button>
                            <button
                                onClick={handleLogout}
                                className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                    {commandStatus && (
                        <div className="mt-2 text-sm text-gray-600">{commandStatus}</div>
                    )}
                </div>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
                        <span>❌ {error}</span>
                        <button 
                            className="text-sm text-red-600 hover:text-red-800 underline"
                            onClick={() => setError(null)}
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {/* Agent Selector */}
                <div className="mb-6 bg-white rounded-lg shadow">
                    <div className="p-3 border-b border-gray-100">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            🖥️ Connected Agents
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                                {agents.filter(a => a.status === 'online').length} online
                            </span>
                        </h3>
                    </div>
                    <div className="p-3 flex flex-wrap gap-2">
                        {loading ? (
                            <div className="text-gray-500">Loading agents...</div>
                        ) : agents.length === 0 ? (
                            <div className="text-gray-500">No agents connected</div>
                        ) : (
                            agents.map((agent) => (
                                <button
                                    key={agent.id}
                                    onClick={() => setSelectedAgent(agent)}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all text-left ${
                                        selectedAgent?.id === agent.id
                                            ? 'border-blue-500 bg-blue-50 shadow-sm ring-2 ring-blue-200'
                                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                                        <span className="font-medium text-sm">{agent.hostname}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(agent.status)}`}>
                                            {agent.status}
                                        </span>
                                        {agent.id === 4 && (
                                            <span className="text-xs bg-green-200 text-green-800 px-1.5 py-0.5 rounded">
                                                ✅ Active
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-0.5">
                                        {agent.os} • {agent.ip_address} • ID: {agent.id}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* File Browser */}
                <div className="bg-white rounded-lg shadow">
                    <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                📁 Remote File Browser
                                <span className="text-sm font-normal text-gray-500 ml-2">
                                    {selectedAgent?.hostname || 'No agent selected'}
                                </span>
                            </h2>
                            <span className="text-xs text-gray-500">{files.length} items</span>
                        </div>
                    </div>

                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex-1 min-w-[200px]">
                                <span className="text-xs font-medium text-gray-500 block mb-1">Current Path</span>
                                <span className="text-sm font-mono bg-white px-3 py-1.5 rounded border border-gray-200 w-full block truncate">
                                    {currentPath}
                                </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                <button onClick={() => navigateTo('..')} className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">⬆ Up</button>
                                <button onClick={handleCreateFolder} className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">📁 New Folder</button>
                                <button onClick={() => setShowUploadModal(true)} className="px-3 py-1.5 text-sm bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">📤 Upload</button>
                                <button onClick={() => loadDirectory(currentPath)} className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">🔄 Refresh</button>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-gray-200">
                            <span className="text-xs font-medium text-gray-500">🔄 Process Management:</span>
                            <button onClick={handleListProcesses} className="px-3 py-1.5 text-sm bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors">📊 List Processes</button>
                            <button onClick={handleStartProcess} className="px-3 py-1.5 text-sm bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors">🚀 Start Process</button>
                            <button onClick={handleKillProcess} className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">🛑 Kill Process</button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                            <div className="col-span-6">Name</div>
                            <div className="col-span-3">Size</div>
                            <div className="col-span-3">Modified</div>
                        </div>

                        {fileLoading && (
                            <div className="p-12 text-center text-gray-500">
                                <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                                <p className="mt-3">Loading directory...</p>
                            </div>
                        )}

                        {!fileLoading && files.length === 0 && (
                            <div className="p-12 text-center text-gray-500">
                                <div className="text-4xl mb-2">📂</div>
                                <p className="text-sm">This directory is empty</p>
                            </div>
                        )}

                        {!fileLoading && files.map((file, index) => (
                            <div 
                                key={`${file.name}-${index}`}
                                className={`grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b cursor-pointer ${
                                    file.is_directory ? 'hover:bg-blue-50' : ''
                                }`}
                                onClick={() => handleFileClick(file)}
                            >
                                <div className="col-span-6 flex items-center gap-2 min-w-0">
                                    <span className="text-lg flex-shrink-0">{getFileIcon(file.name, file.is_directory)}</span>
                                    <span className={`truncate ${file.is_directory ? 'text-blue-600 hover:underline font-medium' : 'text-gray-800'}`}>
                                        {file.name}
                                    </span>
                                    {!file.is_directory && (
                                        <div className="flex gap-1 ml-auto">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDownloadFile(file.name); }}
                                                className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
                                                title="Download"
                                            >
                                                ⬇️
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.name); }}
                                                className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-colors"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 flex items-center">
                                    {file.is_directory ? '—' : formatFileSize(file.size)}
                                </div>
                                <div className="col-span-3 text-sm text-gray-600 flex items-center">
                                    {formatDate(file.modified)}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-4 py-3 bg-gray-50 rounded-b-lg text-xs text-gray-500 border-t flex justify-between">
                        <span>
                            {files.length} items • {files.filter(f => !f.is_directory).length} files, {files.filter(f => f.is_directory).length} folders
                        </span>
                        <span>
                            {selectedAgent?.hostname || 'No agent'} • {selectedAgent?.os || ''} • ID: {selectedAgent?.id || 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Upload Modal */}
                {showUploadModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 max-w-md w-full">
                            <h3 className="text-lg font-semibold mb-4">📤 Upload File</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Upload to: <span className="font-mono">{currentPath}</span>
                            </p>
                            <input
                                type="file"
                                className="w-full p-2 border rounded mb-4"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleUploadFile(file);
                                }}
                            />
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowUploadModal(false)}
                                    className="px-4 py-2 text-sm bg-gray-300 rounded hover:bg-gray-400 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}