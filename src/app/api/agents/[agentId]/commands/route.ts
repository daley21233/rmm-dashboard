// src/app/api/agents/[agentId]/commands/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const agentIdNum = parseInt(agentId);

        const commands = await prisma.command.findMany({
            where: {
                agent_id: agentIdNum,
                status: 'pending'
            },
            orderBy: { created_at: 'asc' }
        });

        console.log(`📋 Getting commands for agent ${agentIdNum}: ${commands.length} pending`);

        return NextResponse.json({
            pending_commands: commands.map(cmd => ({
                id: cmd.id,
                command_type: cmd.command_type,
                payload: JSON.parse(cmd.payload),
                status: cmd.status,
                created_at: cmd.created_at
            }))
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

        const command = await prisma.command.create({
            data: {
                agent_id: agentIdNum,
                command_type: command_type,
                payload: JSON.stringify(payload || {}),
                status: 'pending'
            }
        });

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