// Lokasi: src/app/api/projects/[projectId]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// Fungsi bantuan yang konsisten untuk membaca token dari cookie
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

// ✅ GET: Ambil semua task di proyek (termasuk assignee)
export async function GET(
  request: NextRequest,
  // PERBAIKAN: Menggunakan destructuring { params } sebagai argumen kedua
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { projectId } = params; // Langsung gunakan `params`

    const membership = await prisma.membership.findFirst({
      where: { userId, projectId },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Forbidden: You are not a member of this project' }, { status: 403 });
    }

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
      include: {
        assignee: {
          select: {
            id: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(tasks, { status: 200 });

  } catch (error) {
    console.error('TASK_GET_ERROR:', error);
    return NextResponse.json({ message: 'Failed to fetch tasks' }, { status: 500 });
  }
}

// ✅ POST: Buat task baru (dengan assignee optional)
export async function POST(
  request: NextRequest,
  // PERBAIKAN: Menggunakan destructuring { params } sebagai argumen kedua
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { projectId } = params; // Langsung gunakan `params`

    const membership = await prisma.membership.findFirst({
      where: { userId, projectId },
    });

    if (!membership) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, status, assigneeId } = body;

    if (!title || !status) {
      return NextResponse.json({ message: 'Title and status are required' }, { status: 400 });
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        projectId,
        assigneeId: assigneeId || null,
      },
    });

    return NextResponse.json(newTask, { status: 201 });

  } catch (error) {
    console.error('TASK_POST_ERROR:', error);
    return NextResponse.json({ message: 'Failed to create task' }, { status: 500 });
  }
}
