// Lokasi: src/app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function getUserIdFromToken() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get('token');
  if (!tokenCookie) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenCookie.value, secret);
    return payload.userId as string;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const { projectId } = params;
    
    const membership = await prisma.membership.findFirst({
        where: { userId, projectId }
    });
    if (!membership) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) {
      return NextResponse.json({ message: 'Proyek tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(project, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Gagal mengambil detail proyek' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const { projectId } = params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });
    if (!project) return new NextResponse(null, { status: 204 });

    if (project.ownerId !== userId) {
      return NextResponse.json({ message: 'Forbidden: Only the project owner can delete this project' }, { status: 403 });
    }

    await prisma.project.delete({
      where: { id: projectId },
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: 'Failed to delete project' }, { status: 500 });
  }
}
