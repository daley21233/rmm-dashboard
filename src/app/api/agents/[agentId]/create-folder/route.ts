// src/app/api/agents/[agentId]/create-folder/route.ts

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

        const command = await prisma.command.create({
            data: {
                agent_id: agentIdNum,
                command_type: 'create_folder',
                payload: JSON.stringify({ path }),
                status: 'pending'
            }
        });

        return NextResponse.json({
            command_id: command.id,
            status: 'queued',
            message: `Create folder command queued for agent ${agentId}`
        });
    } catch (error) {
        console.error('Error queueing create folder:', error);
        return NextResponse.json(
            { error: 'Failed to queue create folder' },
            { status: 500 }
        );
    }
}
