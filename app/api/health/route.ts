import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Simple query to check connection
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: String(error)
        }, { status: 500 });
    }
}
