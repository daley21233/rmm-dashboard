// src/app/api/queue-command/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agent_id, command_type, payload } = body;
        
        console.log('📤 Queue Command Request:', { agent_id, command_type, payload });
        
        if (!agent_id || !command_type) {
            return NextResponse.json(
                { error: 'agent_id and command_type are required' },
                { status: 400 }
            );
        }

        const command = await prisma.command.create({
            data: {
                agent_id: agent_id,
                command_type: command_type,
                payload: JSON.stringify(payload || {}),
                status: 'pending'
            }
        });

        console.log('✅ Command stored:', command);

        return NextResponse.json({
            success: true,
            command_id: command.id,
            message: 'Command queued successfully',
            command: command
        });
    } catch (error) {
        console.error('❌ Error queuing command:', error);
        return NextResponse.json(
            { error: 'Failed to queue command' },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const commands = await prisma.command.findMany({
            include: { agent: true },
            orderBy: { created_at: 'desc' },
            take: 50
        });

        return NextResponse.json({
            total: commands.length,
            commands: commands.map(cmd => ({
                ...cmd,
                payload: JSON.parse(cmd.payload)
            }))
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch commands' },
            { status: 500 }
        );
    }
}