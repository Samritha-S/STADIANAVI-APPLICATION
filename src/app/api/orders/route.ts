import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/orders — place a new delivery order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { guestId, stallId, stallName, seatLabel, items, totalAmount, paymentMethod, notes } = body;

    if (!stallId || !seatLabel || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        guestId: guestId || 'guest-anon',
        stallId,
        stallName,
        seatLabel,
        totalAmount,
        paymentMethod: paymentMethod || 'UPI',
        paymentStatus: 'PAID',
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            menuItemId: item.id,
            name: item.name,
            emoji: item.emoji,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      include: { items: true },
    });

    return NextResponse.json({ success: true, orderId: order.id, order }, { status: 201 });
  } catch (err: any) {
    console.error('[Orders API]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/orders?guestId=xxx — fetch order history for a guest
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guestId = searchParams.get('guestId');
    if (!guestId) return NextResponse.json({ orders: [] });

    const orders = await prisma.order.findMany({
      where: { guestId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
