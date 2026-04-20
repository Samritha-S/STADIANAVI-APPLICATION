import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { optionId } = await req.json();
    if (!optionId) return NextResponse.json({ error: 'Missing optionId' }, { status: 400 });

    const updatedOption = await prisma.pollOption.update({
      where: { id: optionId },
      data: { votes: { increment: 1 } }
    });

    return NextResponse.json({ success: true, updatedOption });
  } catch (error: any) {
    console.error('[Poll Vote API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
