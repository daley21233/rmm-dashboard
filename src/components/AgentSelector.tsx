// src/components/AgentSelector.tsx

'use client';

import React from 'react';

interface Agent {
    id: number;
    hostname: string;
    os: string;
    ip_address: string;
    status: 'online' | 'offline' | 'pending';
    last_seen: string;
}

interface AgentSelectorProps {
    agents: Agent[];
    selectedAgent: Agent | null;
    onSelectAgent: (agent: Agent) => void;
    loading: boolean;
}

export default function AgentSelector({ 
    agents, 
    selectedAgent, 
    onSelectAgent,
    loading 
}: AgentSelectorProps) {
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

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
                    Loading agents...
                </div>
            </div>
        );
    }

    if (agents.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-4 text-center text-gray-500">
                <p>No agents connected yet</p>
                <p className="text-sm">Wait for an agent to check in</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="p-3 border-b border-gray-100">
                <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    🖥️ Connected Agents
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {agents.filter(a => a.status === 'online').length} online
                    </span>
                </h3>
            </div>
            <div className="p-3 flex flex-wrap gap-2">
                {agents.map((agent) => (
                    <button
                        key={agent.id}
                        onClick={() => onSelectAgent(agent)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all text-sm ${
                            selectedAgent?.id === agent.id
                                ? 'border-blue-500 bg-blue-50 shadow-sm'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getStatusColor(agent.status)}`}></div>
                            <span className="font-medium">{agent.hostname}</span>
                            <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(agent.status)}`}>
                                {agent.status}
                            </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                            {agent.os} • {agent.ip_address}
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}