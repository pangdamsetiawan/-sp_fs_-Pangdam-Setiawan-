// Lokasi: src/app/api/projects/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers'; // Import cookies dari next/headers

const prisma = new PrismaClient();

// Fungsi bantuan untuk mendapatkan ID user dari TOKEN DI COOKIE
async function getUserIdFromToken() {
 const cookieStore = await cookies();
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

export async function POST(request: Request) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const body = await request.json();
    const { name } = body;
    if (!name) {
      return NextResponse.json({ message: 'Project name is required' }, { status: 400 });
    }

    const newProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: { name, ownerId: userId },
      });
      await tx.membership.create({
        data: { projectId: project.id, userId: userId },
      });
      return project;
    });

    return NextResponse.json(newProject, { status: 201 });
  } catch {
    return NextResponse.json({ message: 'Failed to create project' }, { status: 500 });
  }
}

export async function GET() { // Request parameter tidak dibutuhkan lagi
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: userId },
      include: { project: true },
      orderBy: { project: { createdAt: 'desc' } }
    });

    const projects = memberships.map(membership => membership.project);
    return NextResponse.json(projects, { status: 200 });

  } catch {
    return NextResponse.json({ message: 'Failed to fetch projects' }, { status: 500 });
  }
}
