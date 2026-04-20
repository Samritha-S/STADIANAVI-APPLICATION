import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const locations = await prisma.location.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            assignedSeatId: true,
            phone: true
          }
        }
      },
      where: {
        updatedAt: {
          gte: new Date(Date.now() - 60000) // Active in last 60 seconds
        }
      }
    });

    return NextResponse.json(locations);
  } catch (error) {
    return NextResponse.json({ error: 'Heatmap data failed' }, { status: 500 });
  }
}
