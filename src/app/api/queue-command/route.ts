// src/app/api/queue-command/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

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

        db.addCommand(agent_id, command);

        return NextResponse.json({
            success: true,
            command_id: command.id,
            message: 'Command queued successfully'
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to queue command' },
            { status: 500 }
        );
    }
}
