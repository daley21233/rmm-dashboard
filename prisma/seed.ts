// prisma/seed.ts

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

async function main() {
    console.log('🌱 Starting database seed...');

    try {
        // Create admin user
        const adminPassword = await hashPassword('admin123');
        const admin = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {},
            create: {
                username: 'admin',
                password: adminPassword,
                email: 'admin@rmm.local',
                role: 'admin'
            }
        });
        console.log('✅ Admin user created:', admin.username);

        // Create sample agent (ID 4)
        const agent = await prisma.agent.upsert({
            where: { id: 4 },
            update: {
                status: 'online',
                last_seen: new Date()
            },
            create: {
                id: 4,
                hostname: 'DESKTOP-IJ5F28E',
                os: 'Windows 10 Pro',
                ip_address: '192.168.8.100',
                status: 'online',
                last_seen: new Date()
            }
        });
        console.log('✅ Sample agent created:', agent.hostname);

        // Create sample agent (ID 1)
        const agent2 = await prisma.agent.upsert({
            where: { id: 1 },
            update: {},
            create: {
                id: 1,
                hostname: 'DESKTOP-DEMO',
                os: 'Windows 11 Pro',
                ip_address: '192.168.1.100',
                status: 'online',
                last_seen: new Date()
            }
        });
        console.log('✅ Sample agent created:', agent2.hostname);

        console.log('✅ Seeding complete!');
        console.log(`📊 Users: ${await prisma.user.count()}`);
        console.log(`📊 Agents: ${await prisma.agent.count()}`);

    } catch (error) {
        console.error('❌ Seed failed:', error);
        throw error;
    }
}

main()
    .catch(e => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
