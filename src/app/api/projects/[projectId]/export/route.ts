// Lokasi: src/app/api/projects/[projectId]/export/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

async function getUserIdFromToken() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('token');
    if (!tokenCookie) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(tokenCookie.value, secret);
    return payload.userId as string;
  } catch (error) {
    console.error('Failed to verify token:', error);
    return null;
  }
}

// PERBAIKAN: Mendefinisikan tipe untuk argumen kedua secara eksplisit
type RouteContext = {
  params: {
    projectId: string;
  };
};

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    // Menggunakan projectId dari context yang sudah diberi tipe
    const { projectId } = context.params;

    const membership = await prisma.membership.findFirst({
      where: { userId, projectId },
    });
    if (!membership) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const projectData = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: {
          include: {
            assignee: { select: { id: true, email: true } },
          },
        },
        memberships: {
          include: {
            user: { select: { id: true, email: true } },
          },
        },
      },
    });

    if (!projectData) {
      return NextResponse.json({ message: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    const fileName = `project_${projectData.name.replace(/\s+/g, '_')}_${new Date().toISOString()}.json`;

    return new NextResponse(JSON.stringify(projectData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('EXPORT_ERROR:', error);
    return NextResponse.json({ message: 'Gagal mengekspor data proyek' }, { status: 500 });
  }
}
