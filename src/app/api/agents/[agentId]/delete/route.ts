// src/app/api/agents/[agentId]/delete/route.ts

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
        const { path, recursive } = body;

        const command = await prisma.command.create({
            data: {
                agent_id: agentIdNum,
                command_type: 'delete_file',
                payload: JSON.stringify({ path, recursive }),
                status: 'pending'
            }
        });

        return NextResponse.json({
            command_id: command.id,
            status: 'queued',
            message: `Delete command queued for agent ${agentId}`
        });
    } catch (error) {
        console.error('Error queueing delete:', error);
        return NextResponse.json(
            { error: 'Failed to queue delete' },
            { status: 500 }
        );
    }
}
