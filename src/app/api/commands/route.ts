// src/app/api/commands/route.ts

import { NextResponse } from 'next/server';
import { getCommandStore, findCommand } from '@/lib/commandStore';

// GET all commands (for debugging)
export async function GET() {
    try {
        const store = getCommandStore();
        const allCommands: any[] = [];
        
        for (const agentId in store) {
            const commands = store[agentId];
            for (const command of commands) {
                allCommands.push({
                    ...command,
                    agent_id: parseInt(agentId)
                });
            }
        }
        
        return NextResponse.json({
            total: allCommands.length,
            commands: allCommands
        });
    } catch (error) {
        console.error('Error fetching all commands:', error);
        return NextResponse.json(
            { error: 'Failed to fetch commands' },
            { status: 500 }
        );
    }
}

// POST - Queue a new command
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agent_id, command_type, payload } = body;
        
        if (!agent_id || !command_type) {
            return NextResponse.json(
                { error: 'agent_id and command_type are required' },
                { status: 400 }
            );
        }

        const command = {
            id: Date.now(),
            agent_id: agent_id,
            command_type: command_type,
            payload: payload || {},
            status: 'pending',
            created_at: new Date().toISOString()
        };

        // Store in the shared command store
        const store = getCommandStore();
        if (!store[agent_id]) {
            store[agent_id] = [];
        }
        store[agent_id].push(command);

        console.log('✅ Command queued:', command);

        return NextResponse.json({
            success: true,
            command_id: command.id,
            message: 'Command queued successfully',
            command: command
        });
    } catch (error) {
        console.error('Error queuing command:', error);
        return NextResponse.json(
            { error: 'Failed to queue command' },
            { status: 500 }
        );
    }
}