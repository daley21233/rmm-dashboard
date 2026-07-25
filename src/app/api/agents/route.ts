// src/app/api/agents/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
    try {
        const agents = await prisma.agent.findMany({
            orderBy: { hostname: 'asc' }
        });
        return NextResponse.json({ agents });
    } catch (error) {
        console.error('Error fetching agents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch agents' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { hostname, os, ip_address, agent_version } = body;

        let agent = await prisma.agent.findFirst({
            where: { hostname }
        });

        if (agent) {
            agent = await prisma.agent.update({
                where: { id: agent.id },
                data: {
                    os: os || agent.os,
                    ip_address: ip_address || agent.ip_address,
                    last_seen: new Date(),
                    status: 'online'
                }
            });
        } else {
            // Check if this is Agent 4 (DESKTOP-IJ5F28E)
            const existingAgent4 = await prisma.agent.findUnique({
                where: { id: 4 }
            });
            
            if (existingAgent4 && hostname === 'DESKTOP-IJ5F28E') {
                agent = await prisma.agent.update({
                    where: { id: 4 },
                    data: {
                        os: os || existingAgent4.os,
                        ip_address: ip_address || existingAgent4.ip_address,
                        last_seen: new Date(),
                        status: 'online'
                    }
                });
            } else {
                agent = await prisma.agent.create({
                    data: {
                        hostname,
                        os,
                        ip_address,
                        last_seen: new Date(),
                        status: 'online'
                    }
                });
            }
        }

        const pendingCommands = await prisma.command.findMany({
            where: {
                agent_id: agent.id,
                status: 'pending'
            },
            orderBy: { created_at: 'asc' }
        });

        return NextResponse.json({
            agent_id: agent.id,
            status: agent.status,
            pending_commands: pendingCommands.map(cmd => ({
                id: cmd.id,
                command_type: cmd.command_type,
                payload: JSON.parse(cmd.payload)
            }))
        });
    } catch (error) {
        console.error('Agent check-in error:', error);
        return NextResponse.json(
            { error: 'Failed to check in agent' },
            { status: 500 }
        );
    }
}