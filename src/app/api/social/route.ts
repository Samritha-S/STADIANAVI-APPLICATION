import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const { senderId, receiverPhone } = await req.json();

  try {
    const receiver = await prisma.user.findUnique({
      where: { phone: receiverPhone }
    });

    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const request = await prisma.socialGraph.create({
      data: {
        senderId,
        receiverId: receiver.id,
        status: 'PENDING'
      }
    });

    return NextResponse.json(request);
  } catch (error) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const { requestId, status } = await req.json();

  try {
    const updated = await prisma.socialGraph.update({
      where: { id: requestId },
      data: { status }
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
