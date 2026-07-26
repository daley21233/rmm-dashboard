// src/app/api/agents/[agentId]/upload-file/route.ts

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
        const { path, content_base64, overwrite } = body;

        const command = {
            id: Date.now(),
            agent_id: agentIdNum,
            command_type: 'upload_file',
            payload: { path, content_base64, overwrite },
            status: 'pending',
            created_at: new Date().toISOString()
        };

        db.addCommand(agentIdNum, command);

        return NextResponse.json({
            command_id: command.id,
            status: 'queued',
            message: `Upload command queued for agent ${agentId}`
        });
    } catch (error) {
        console.error('Error queueing upload:', error);
        return NextResponse.json(
            { error: 'Failed to queue upload' },
            { status: 500 }
        );
    }
}
