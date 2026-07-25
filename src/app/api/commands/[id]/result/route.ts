// src/app/api/commands/[id]/result/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commandId = parseInt(id);
        const body = await request.json();
        const { status, output } = body;
        
        console.log(`📤 Receiving result for command ${commandId}:`, { status, output });

        const command = await prisma.command.update({
            where: { id: commandId },
            data: {
                status: status === 'success' ? 'executed' : 'failed',
                executed_at: new Date()
            }
        });

        await prisma.commandResult.create({
            data: {
                command_id: commandId,
                output: typeof output === 'string' ? output : JSON.stringify(output),
                status: status
            }
        });

        console.log(`✅ Updated command ${commandId}`);

        return NextResponse.json({
            success: true,
            message: 'Result recorded successfully'
        });
    } catch (error) {
        console.error('Error recording result:', error);
        return NextResponse.json(
            { error: 'Failed to record result' },
            { status: 500 }
        );
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commandId = parseInt(id);

        console.log(`📤 Getting result for command ${commandId}`);

        const command = await prisma.command.findUnique({
            where: { id: commandId },
            include: { result: true }
        });

        if (!command) {
            console.log(`❌ Command ${commandId} not found`);
            return NextResponse.json(
                { error: 'Command not found' },
                { status: 404 }
            );
        }

        console.log(`📤 Found command ${commandId}:`, command);

        if (command.status === 'pending') {
            return NextResponse.json({
                command_id: command.id,
                status: 'pending',
                message: 'Command is still pending'
            });
        }

        return NextResponse.json({
            command_id: command.id,
            status: command.status === 'executed' ? 'success' : 'error',
            output: command.result?.output ? JSON.parse(command.result.output) : null,
            error_message: command.status === 'failed' ? command.result?.output : undefined,
            executed_at: command.executed_at
        });
    } catch (error) {
        console.error('Error fetching command result:', error);
        return NextResponse.json(
            { error: 'Failed to fetch command result' },
            { status: 500 }
        );
    }
}