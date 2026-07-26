// src/app/api/agents/[agentId]/commands/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const agentIdNum = parseInt(agentId);
        
        const commands = db.getCommandsForAgent(agentIdNum);
        const pendingCommands = commands.filter((cmd: any) => cmd.status === 'pending');
        
        console.log(`📋 Getting commands for agent ${agentIdNum}: ${pendingCommands.length} pending`);
        
        return NextResponse.json({
            pending_commands: pendingCommands
        });
    } catch (error) {
        console.error('Error fetching commands:', error);
        return NextResponse.json(
            { error: 'Failed to fetch commands' },
            { status: 500 }
        );
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const agentIdNum = parseInt(agentId);
        const body = await request.json();
        const { command_type, payload } = body;
        
        const command = {
            id: Date.now(),
            agent_id: agentIdNum,
            command_type: command_type,
            payload: payload || {},
            status: 'pending',
            created_at: new Date().toISOString()
        };
        
        db.addCommand(agentIdNum, command);
        
        console.log(`✅ Command queued for agent ${agentIdNum}:`, command);
        
        return NextResponse.json({
            command_id: command.id,
            status: 'queued',
            message: 'Command queued successfully'
        });
    } catch (error) {
        console.error('Error queuing command:', error);
        return NextResponse.json(
            { error: 'Failed to queue command' },
            { status: 500 }
        );
    }
}
