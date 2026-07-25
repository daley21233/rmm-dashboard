// src/components/FileBrowser.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileItem } from '@/lib/types';
import * as api from '@/services/api';
// ... rest of your code

interface FileBrowserProps {
    agentId: number;
    agentName: string;
}

export default function FileBrowser({ agentId, agentName }: FileBrowserProps) {
    const [currentPath, setCurrentPath] = useState<string>('C:\\');
    const [files, setFiles] = useState<FileItem[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [pathHistory, setPathHistory] = useState<string[]>(['C:\\']);

    const pollForResult = useCallback(async (commandId: number, maxAttempts: number = 30): Promise<any> => {
        for (let i = 0; i < maxAttempts; i++) {
            const result = await api.getCommandResult(commandId);
            
            if (result.status === 'success' || result.status === 'error') {
                return result;
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
        }
        throw new Error('Command timed out');
    }, []);

    const loadDirectory = useCallback(async (path: string) => {
        setLoading(true);
        setError(null);
        
        try {
            // Format path for Windows
            const formattedPath = path.replace(/\//g, '\\');
            
            // Send command to agent
            const command = await api.listDirectory(agentId, formattedPath);
            
            // Poll for results
            const result = await pollForResult(command.command_id);
            
            if (result.status === 'success' && result.output) {
                setFiles(result.output.files || []);
                setCurrentPath(formattedPath);
                
                // Update path history
                setPathHistory(prev => {
                    const index = prev.indexOf(formattedPath);
                    if (index !== -1) {
                        return prev.slice(0, index + 1);
                    }
                    return [...prev, formattedPath];
                });
            } else {
                setError(result.error_message || 'Failed to load directory');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [agentId, pollForResult]);

    const navigateTo = useCallback((path: string) => {
        if (path === '..') {
            // Go up one level
            const parentPath = currentPath.split('\\').slice(0, -1).join('\\');
            loadDirectory(parentPath || 'C:\\');
        } else {
            // Navigate to a specific directory
            const newPath = currentPath.endsWith('\\') 
                ? `${currentPath}${path}` 
                : `${currentPath}\\${path}`;
            loadDirectory(newPath);
        }
    }, [currentPath, loadDirectory]);

    const handleDownload = useCallback(async (fileName: string) => {
        try {
            const filePath = `${currentPath}\\${fileName}`;
            const command = await api.downloadFile(agentId, filePath);
            const result = await pollForResult(command.command_id);
            
            if (result.status === 'success' && result.output) {
                // Handle download - the output should contain base64 data
                const output = result.output as any;
                if (output.content) {
                    const link = document.createElement('a');
                    link.href = `data:application/octet-stream;base64,${output.content}`;
                    link.download = fileName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            } else {
                setError('Failed to download file');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Download failed');
        }
    }, [agentId, currentPath, pollForResult]);

    const handleUpload = useCallback(async (file: File) => {
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const base64 = (e.target?.result as string).split(',')[1];
                    const filePath = `${currentPath}\\${file.name}`;
                    
                    const command = await api.uploadFile(agentId, filePath, base64);
                    await pollForResult(command.command_id);
                    
                    // Refresh the directory listing
                    loadDirectory(currentPath);
                } catch (err) {
                    setError(err instanceof Error ? err.message : 'Upload failed');
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Upload failed');
        }
    }, [agentId, currentPath, loadDirectory, pollForResult]);

    const handleDelete = useCallback(async (fileName: string) => {
        if (!window.confirm(`Are you sure you want to delete ${fileName}?`)) {
            return;
        }
        
        try {
            const filePath = `${currentPath}\\${fileName}`;
            const command = await api.deleteFile(agentId, filePath);
            await pollForResult(command.command_id);
            loadDirectory(currentPath);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Delete failed');
        }
    }, [agentId, currentPath, loadDirectory, pollForResult]);

    const handleCreateFolder = useCallback(async () => {
        const folderName = window.prompt('Enter folder name:');
        if (!folderName) return;
        
        try {
            const folderPath = `${currentPath}\\${folderName}`;
            const command = await api.createFolder(agentId, folderPath);
            await pollForResult(command.command_id);
            loadDirectory(currentPath);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Create folder failed');
        }
    }, [agentId, currentPath, loadDirectory, pollForResult]);

    // Initial load
    useEffect(() => {
        loadDirectory('C:\\');
    }, [loadDirectory]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr);
        return date.toLocaleString();
    };

    const getFileIcon = (fileName: string, isDirectory: boolean) => {
        if (isDirectory) return '📁';
        
        const ext = fileName.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'svg':
                return '🖼️';
            case 'mp4':
            case 'avi':
            case 'mov':
                return '🎬';
            case 'mp3':
            case 'wav':
                return '🎵';
            case 'pdf':
                return '📕';
            case 'doc':
            case 'docx':
                return '📘';
            case 'xls':
            case 'xlsx':
                return '📗';
            case 'zip':
            case 'rar':
            case '7z':
                return '📦';
            default:
                return '📄';
        }
    };

    // Toggle file selection
    const toggleSelection = (fileName: string) => {
        setSelectedFiles(prev => 
            prev.includes(fileName) 
                ? prev.filter(f => f !== fileName)
                : [...prev, fileName]
        );
    };

    return (
        <div className="bg-white rounded-lg shadow-xl">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    📁 Remote File Browser
                    <span className="text-sm font-normal text-gray-500 ml-2">
                        {agentName}
                    </span>
                </h2>
            </div>

            {/* Error Message */}
            {error && (
                <div className="m-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex justify-between items-center">
                    <span>❌ {error}</span>
                    <button 
                        className="text-sm text-red-600 hover:text-red-800 underline"
                        onClick={() => setError(null)}
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex flex-wrap items-center gap-3">
                    {/* Breadcrumb */}
                    <div className="flex-1 min-w-[200px]">
                            <span className="text-sm font-medium text-gray-700">📍 </span>
    <span className="text-sm font-mono bg-white px-3 py-1 rounded border">
        {currentPath}
    </span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                        <button 
                            onClick={() => navigateTo('..')}
                            className="px-3 py-1.5 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                        >
                            ⬆ Up
                        </button>
                        <button 
                            onClick={handleCreateFolder}
                            className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                        >
                            📁 New Folder
                        </button>
                        <button 
                            onClick={() => loadDirectory(currentPath)}
                            className="px-3 py-1.5 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1"
                        >
                            🔄 Refresh
                        </button>
                    </div>
                </div>

                {/* File Upload */}
                <div className="mt-3">
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleUpload(file);
                            e.target.value = '';
                        }}
                    />
                    <label 
                        htmlFor="file-upload"
                        className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        📤 Click to upload a file
                    </label>
                </div>
            </div>

            {/* File List */}
            <div className="overflow-x-auto">
                {/* Column Headers */}
                <div className="grid grid-cols-12 gap-2 bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 uppercase tracking-wider border-b">
                    <div className="col-span-6">Name</div>
                    <div className="col-span-3">Size</div>
                    <div className="col-span-3">Modified</div>
                </div>

                {/* Loading State */}
                {loading && (
                    <div className="p-12 text-center text-gray-500">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-500 border-t-transparent"></div>
                        <p className="mt-3 text-sm">Loading directory...</p>
                    </div>
                )}

                {/* Empty State */}
                {!loading && files.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        <div className="text-4xl mb-2">📂</div>
                        <p className="text-sm">This directory is empty</p>
                    </div>
                )}

                {/* File Items */}
                {!loading && files.map((file) => (
                    <div 
                        key={file.name}
                        className={`grid grid-cols-12 gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors border-b cursor-pointer ${
                            selectedFiles.includes(file.name) ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => toggleSelection(file.name)}
                    >
                        {/* Name */}
                        <div className="col-span-6 flex items-center gap-2 min-w-0">
                            <span className="text-lg">{getFileIcon(file.name, file.is_directory)}</span>
                            <span 
                                className={`truncate ${file.is_directory ? 'text-blue-600 hover:underline cursor-pointer' : 'text-gray-800'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (file.is_directory) {
                                        navigateTo(file.name);
                                    }
                                }}
                            >
                                {file.name}
                            </span>
                        </div>

                        {/* Size */}
                        <div className="col-span-3 text-sm text-gray-600">
                            {file.is_directory ? '—' : formatFileSize(file.size)}
                        </div>

                        {/* Modified */}
                        <div className="col-span-3 text-sm text-gray-600 flex items-center justify-between">
                            <span>{formatDate(file.modified)}</span>
                            
                            {/* Action Buttons for selected files */}
                            {selectedFiles.includes(file.name) && (
                                <div className="flex gap-1">
                                    {!file.is_directory && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDownload(file.name);
                                            }}
                                            className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded hover:bg-blue-600 transition-colors"
                                            title="Download"
                                        >
                                            ⬇
                                        </button>
                                    )}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(file.name);
                                        }}
                                        className="text-xs bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-colors"
                                        title="Delete"
                                    >
                                        🗑
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer Stats */}
            <div className="px-4 py-3 bg-gray-50 rounded-b-lg text-xs text-gray-500 border-t">
                {files.length} items • {files.filter(f => !f.is_directory).length} files, {files.filter(f => f.is_directory).length} folders
                {selectedFiles.length > 0 && (
                    <span className="ml-4">• {selectedFiles.length} selected</span>
                )}
            </div>
        </div>
    );
}