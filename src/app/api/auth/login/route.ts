// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { username, password } = body;

        console.log('🔐 Login attempt for:', username);

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Username and password are required' },
                { status: 400 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { username }
        });

        if (!user) {
            console.log('❌ User not found:', username);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            console.log('❌ Invalid password for:', username);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        console.log('✅ Login successful for:', username);

        try {
            await prisma.auditLog.create({
                data: {
                    user_id: user.id,
                    action: 'LOGIN',
                    details: `User ${user.username} logged in`,
                    ip_address: request.headers.get('x-forwarded-for') || 
                               request.headers.get('x-real-ip') || 
                               'unknown'
                }
            });
        } catch (logError) {
            console.warn('⚠️ Failed to create audit log:', logError);
        }

        return NextResponse.json({
            success: true,
            token: token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('❌ Login error:', error);
        return NextResponse.json(
            { error: 'Login failed' },
            { status: 500 }
        );
    }
}