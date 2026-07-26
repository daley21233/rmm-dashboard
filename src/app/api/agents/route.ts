// src/app/api/agents/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db-simple';

export async function GET() {
    try {
        return NextResponse.json({ agents: db.agents });
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

        // Try to find existing agent by hostname
        let agent = db.getAgentByHostname(hostname);

        if (agent) {
            // Update existing agent
            agent = db.updateAgent(agent.id, {
                os: os || agent.os,
                ip_address: ip_address || agent.ip_address,
                last_seen: new Date().toISOString(),
                status: 'online'
            });
        } else {
            // Check if this is the known Agent 4 (DESKTOP-IJ5F28E)
            const existingAgent4 = db.getAgent(4);
            if (existingAgent4 && hostname === 'DESKTOP-IJ5F28E') {
                agent = db.updateAgent(4, {
                    os: os || existingAgent4.os,
                    ip_address: ip_address || existingAgent4.ip_address,
                    last_seen: new Date().toISOString(),
                    status: 'online'
                });
            } else {
                // Create new agent
                agent = db.addAgent({
                    hostname,
                    os,
                    ip_address,
                    last_seen: new Date().toISOString(),
                    status: 'online'
                });
            }
        }

        // Get pending commands
        const pendingCommands = db.getCommandsForAgent(agent.id)
            .filter((cmd: any) => cmd.status === 'pending');

        return NextResponse.json({
            agent_id: agent.id,
            status: agent.status,
            pending_commands: pendingCommands.map((cmd: any) => ({
                id: cmd.id,
                command_type: cmd.command_type,
                payload: cmd.payload
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
