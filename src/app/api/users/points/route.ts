import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { phone, userId, amount } = await req.json();
    
    if ((!phone && !userId) || amount === undefined) {
      return NextResponse.json({ error: 'Missing user or points data' }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: userId ? { id: userId } : { phone: phone },
      update: {
        loyaltyPoints: {
          increment: amount
        }
      },
      create: {
        phone: phone || `guest-${Math.random().toString(36).slice(2, 10)}`,
        firstName: 'Prototype',
        lastName: 'Fan',
        loyaltyPoints: amount
      }
    });

    return NextResponse.json({ success: true, points: user.loyaltyPoints });
  } catch (error: any) {
    console.error('[User Points API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
