import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userId, x, z, intensity } = await req.json();
    
    const flare = await prisma.socialFlare.create({
      data: {
        userId: userId || 'guest-anon',
        x,
        z,
        intensity: intensity || 1.0
      }
    });

    return NextResponse.json({ success: true, flare });
  } catch (error: any) {
    console.error('[Flare API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
