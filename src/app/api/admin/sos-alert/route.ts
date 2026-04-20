import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, userName, seatLabel, reason } = await req.json();
    
    if (!userName || !seatLabel) {
      return NextResponse.json({ error: 'Missing emergency data' }, { status: 400 });
    }

    const alert = await prisma.emergencyAlert.create({
      data: {
        userId: userId || 'guest-anon',
        userName,
        seatLabel,
        reason: reason || 'Standard SOS Trigger',
        status: 'ACTIVE'
      }
    });

    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    console.error('[SOS Alert API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const alerts = await prisma.emergencyAlert.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    return NextResponse.json(alerts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
