import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the most recent active poll
    let poll = await prisma.poll.findFirst({
      where: { isActive: true },
      include: { options: true },
      orderBy: { createdAt: 'desc' }
    });

    // If no poll exists, create a default one for the demo
    if (!poll) {
      poll = await prisma.poll.create({
        data: {
          question: "Who will hit the next six?",
          options: {
            create: [
              { label: "Rohit Sharma", votes: 1420 },
              { label: "Ishan Kishan", votes: 850 },
              { label: "Suryakumar Yadav", votes: 2310 }
            ]
          }
        },
        include: { options: true }
      });
    }

    return NextResponse.json({ success: true, poll });
  } catch (error: any) {
    console.error('[Poll GET API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
