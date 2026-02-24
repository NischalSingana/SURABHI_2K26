import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAppVersion } from '@/lib/app-version';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const appVersion = getAppVersion();
        // Simple query to check connection
        await prisma.$queryRaw`SELECT 1`;
        return NextResponse.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString(),
            env: process.env.NODE_ENV,
            appVersion,
        }, {
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma': 'no-cache',
                'Expires': '0',
                'x-app-version': appVersion,
            },
        });
    } catch (error) {
        console.error('Database connection failed:', error);
        const appVersion = getAppVersion();
        return NextResponse.json({
            status: 'error',
            database: 'disconnected',
            error: String(error),
            appVersion,
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
                'x-app-version': appVersion,
            },
        });
    }
}
