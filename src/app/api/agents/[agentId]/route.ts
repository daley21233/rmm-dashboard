// src/app/api/agents/[agentId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ agentId: string }> }
) {
    try {
        const { agentId } = await params;
        const agentIdNum = parseInt(agentId);
        
        const agent = db.getAgent(agentIdNum);

        if (!agent) {
            return NextResponse.json(
                { error: 'Agent not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(agent);
    } catch (error) {
        console.error('Error fetching agent:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agent' },
            { status: 500 }
        );
    }
}