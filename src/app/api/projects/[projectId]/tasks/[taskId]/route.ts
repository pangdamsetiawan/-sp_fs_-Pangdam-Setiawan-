// Lokasi: src/app/api/projects/[projectId]/tasks/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers'; // ✅

const prisma = new PrismaClient();

async function getUserIdFromCookie() {
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

export async function PATCH(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId)
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });

    const { taskId } = params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task)
      return NextResponse.json({ message: 'Task not found' }, { status: 404 });

    const membership = await prisma.membership.findFirst({
      where: { userId, projectId: task.projectId },
    });

    if (!membership)
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    const body = await request.json();
    const { title, description, status, assigneeId } = body;

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        title,
        description,
        status,
        assigneeId: assigneeId || null, // optional
      },
    });

    return NextResponse.json(updatedTask, { status: 200 });

  } catch (err) {
    console.error('PATCH_TASK_ERROR:', err);
    return NextResponse.json({ message: 'Failed to update task' }, { status: 500 });
  }
}

// ✅ DELETE: Hapus task
export async function DELETE(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const userId = await getUserIdFromCookie();
    if (!userId)
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });

    const { taskId } = params;

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task)
      return NextResponse.json({ message: 'Task not found or already deleted' }, { status: 200 });

    const membership = await prisma.membership.findFirst({
      where: { userId, projectId: task.projectId },
    });

    if (!membership)
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

    await prisma.task.delete({ where: { id: taskId } });

    return new NextResponse(null, { status: 204 });

  } catch (err) {
    console.error('DELETE_TASK_ERROR:', err);
    return NextResponse.json({ message: 'Failed to delete task' }, { status: 500 });
  }
}
