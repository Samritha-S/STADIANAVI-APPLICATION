import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const { userName, text, time, userId } = await req.json();
    
    if (!userName || !text) {
      return NextResponse.json({ error: 'Missing chat data' }, { status: 400 });
    }

    const message = await prisma.chatMessage.create({
      data: {
        userName,
        text,
        time,
        userId: userId || 'guest-anon'
      }
    });

    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('[Chat API]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const messages = await prisma.chatMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(messages.reverse());
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { messageId, flags } = await req.json();
    const updated = await prisma.chatMessage.update({
      where: { id: messageId },
      data: { flags }
    });
    return NextResponse.json({ success: true, message: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get('id');
    if (!messageId) return NextResponse.json({ error: 'Missing message ID' }, { status: 400 });
    
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
