import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(req: Request) {
    try {
        const data = await req.json();
        const { userId, firstName, lastName, email, avatarUrl, seatLabel, dietaryPreference, notificationSettings } = data;

        if (!userId) {
             return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
        }

        const user = await prisma.user.upsert({
            where: { id: userId },
            update: {
                firstName,
                lastName,
                email,
                avatarUrl,
                assignedSeatId: seatLabel,
                dietaryPreference,
                notificationSettings: notificationSettings ? JSON.stringify(notificationSettings) : undefined
            },
            create: {
                id: userId,
                phone: `GUEST-${userId.slice(0,8)}`, // Fallback phone for schema requirement
                firstName,
                lastName,
                email,
                avatarUrl,
                assignedSeatId: seatLabel,
                dietaryPreference,
                notificationSettings: notificationSettings ? JSON.stringify(notificationSettings) : undefined
            }
        });

        return NextResponse.json(user);
    } catch (e: any) {
        console.error("User Sync Error", e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        return NextResponse.json(user);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
