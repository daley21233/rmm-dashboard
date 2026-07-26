// src/app/api/auth/login/route.ts

import { NextResponse } from 'next/server';
import { comparePassword, generateToken } from '@/lib/auth';
import { db } from '@/lib/db-simple';

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

        // ✅ Find user in JSON database
        const user = db.findUserByUsername(username);

        if (!user) {
            console.log('❌ User not found:', username);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Check password
        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            console.log('❌ Invalid password for:', username);
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate token
        const token = generateToken({
            userId: user.id,
            username: user.username,
            role: user.role
        });

        console.log('✅ Login successful for:', username);

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
            { error: 'Login failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 500 }
        );
    }
}
