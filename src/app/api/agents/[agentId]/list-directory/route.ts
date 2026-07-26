// src/app/api/agents/[agentId]/list-directory/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const agentIdNum = parseInt(agentId);
        const body = await request.json();
        const { path } = body;

        const command = {
            id: Date.now(),
            agent_id: agentIdNum,
            command_type: 'list_directory',
            payload: { path },
            status: 'pending',
            created_at: new Date().toISOString()
        };

        db.addCommand(agentIdNum, command);

        return NextResponse.json({
            command_id: command.id,
            status: 'queued',
            message: `Directory listing command queued for agent ${agentId}`
        });
    } catch (error) {
        console.error('Error queueing directory listing:', error);
        return NextResponse.json(
            { error: 'Failed to queue directory listing' },
            { status: 500 }
        );
    }
}
