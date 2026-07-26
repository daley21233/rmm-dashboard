// src/app/api/commands/[id]/result/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commandId = parseInt(id);
        const body = await request.json();
        const { status, output } = body;
        
        const command = db.findCommand(commandId);
        
        if (!command) {
            return NextResponse.json(
                { error: 'Command not found' },
                { status: 404 }
            );
        }
        
        db.updateCommand(commandId, {
            status: status === 'success' ? 'executed' : 'failed',
            result: {
                status: status,
                output: output,
                executed_at: new Date().toISOString()
            }
        });
        
        return NextResponse.json({
            success: true,
            message: 'Result recorded successfully'
        });
    } catch (error) {
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
        
        const command = db.findCommand(commandId);
        
        if (!command) {
            return NextResponse.json(
                { error: 'Command not found' },
                { status: 404 }
            );
        }
        
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
            output: command.result?.output || null,
            executed_at: command.result?.executed_at || null
        });
    } catch (error) {
        return NextResponse.json(
            { error: 'Failed to fetch command result' },
            { status: 500 }
        );
    }
}
