// Lokasi: src/app/api/tasks/[taskId]/route.ts
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

async function authorizeUserForTask(userId: string, taskId: string): Promise<boolean> {
    const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true }
    });
    if (!task) return false;
    const membership = await prisma.membership.findFirst({
        where: { userId, projectId: task.projectId },
    });
    return !!membership;
}

// PERBAIKAN: Menggunakan destructuring { params } sebagai argumen kedua
export async function PATCH(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const { taskId } = params; // Langsung gunakan `params`
    
    const isAuthorized = await authorizeUserForTask(userId, taskId);
    if (!isAuthorized) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { ...body },
    });
    return NextResponse.json(updatedTask, { status: 200 });
  } catch {
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 });
  }
}

// PERBAIKAN: Menggunakan destructuring { params } sebagai argumen kedua
export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }
    const { taskId } = params; // Langsung gunakan `params`

    const isAuthorized = await authorizeUserForTask(userId, taskId);
    if (!isAuthorized) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    await prisma.task.delete({
      where: { id: taskId },
    });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 });
  }
}
