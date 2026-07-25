// src/app/api/commands/[id]/route.ts

import { NextResponse } from 'next/server';
import { findCommand, updateCommand } from '@/lib/commandStore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commandId = parseInt(id);
        
        const command = findCommand(commandId);
        
        if (!command) {
            return NextResponse.json(
                { error: 'Command not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json(command);
    } catch (error) {
        console.error('Error fetching command:', error);
        return NextResponse.json(
            { error: 'Failed to fetch command' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const commandId = parseInt(id);
        
        // Find and remove the command
        const store = (global as any).commandStore || {};
        let found = false;
        
        for (const agentId in store) {
            const commands = store[agentId];
            const index = commands.findIndex((cmd: any) => cmd.id === commandId);
            if (index !== -1) {
                commands.splice(index, 1);
                found = true;
                break;
            }
        }
        
        if (!found) {
            return NextResponse.json(
                { error: 'Command not found' },
                { status: 404 }
            );
        }
        
        return NextResponse.json({
            success: true,
            message: 'Command deleted'
        });
    } catch (error) {
        console.error('Error deleting command:', error);
        return NextResponse.json(
            { error: 'Failed to delete command' },
            { status: 500 }
        );
    }
}