// Lokasi: src/app/api/projects/[projectId]/export/route.ts
import { NextResponse } from 'next/server';
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
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const userId = await getUserIdFromToken();
    if (!userId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { projectId } = params;

    // Otorisasi: Pastikan user adalah anggota proyek
    const membership = await prisma.membership.findFirst({
      where: { userId, projectId },
    });
    if (!membership) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    // Ambil semua data terkait proyek dalam satu query
    const projectData = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        tasks: { // Sertakan semua tugas
          include: {
            assignee: { // Sertakan data assignee untuk setiap tugas
              select: { id: true, email: true },
            },
          },
        },
        memberships: { // Sertakan semua keanggotaan
          include: {
            user: { // Sertakan data user untuk setiap anggota
              select: { id: true, email: true },
            },
          },
        },
      },
    });

    if (!projectData) {
      return NextResponse.json({ message: 'Proyek tidak ditemukan' }, { status: 404 });
    }

    // Buat nama file yang dinamis
    const fileName = `project_${projectData.name.replace(/\s+/g, '_')}_${new Date().toISOString()}.json`;

    // Kirim data sebagai file JSON yang akan diunduh
    return new NextResponse(JSON.stringify(projectData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });

  } catch {
    return NextResponse.json({ message: 'Gagal mengekspor data proyek' }, { status: 500 });
  }
}
