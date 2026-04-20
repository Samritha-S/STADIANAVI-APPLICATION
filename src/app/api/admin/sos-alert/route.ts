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

export async function PATCH(req: Request) {
  try {
    const { alertId, status } = await req.json();
    const alert = await prisma.emergencyAlert.update({
      where: { id: alertId },
      data: { status }
    });
    return NextResponse.json({ success: true, alert });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const alertId = searchParams.get('id');
    if (!alertId) return NextResponse.json({ error: 'Missing alert ID' }, { status: 400 });
    
    await prisma.emergencyAlert.delete({
      where: { id: alertId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
