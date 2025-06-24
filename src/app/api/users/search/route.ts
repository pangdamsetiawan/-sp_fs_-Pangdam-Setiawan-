import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function getUserIdFromCookie() {
  const cookieStore = await cookies(); // ✅ Add await here
  const tokenCookie = cookieStore.get('token');

  if (!tokenCookie) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenCookie.value, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailQuery = searchParams.get('email');

    if (!emailQuery) {
      return NextResponse.json({ message: 'Email query parameter is required' }, { status: 400 });
    }

    const users = await prisma.user.findMany({
      where: {
        email: {
          contains: emailQuery,
        },
        NOT: {
          id: userId,
        },
      },
      select: {
        id: true,
        email: true,
      },
      take: 5,
    });

    return NextResponse.json(users, { status: 200 });

  } catch (error) {
    console.error('EMAIL_SEARCH_ERROR:', error);
    return NextResponse.json({ message: 'Failed to search users' }, { status: 500 });
  }
}