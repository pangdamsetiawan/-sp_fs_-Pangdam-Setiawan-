import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers'; // ✅ untuk akses cookie

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

export async function POST(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  try {
    const inviterId = await getUserIdFromToken(); // ✅ gunakan cookie, bukan header
    if (!inviterId) {
      return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
    }

    const { projectId } = params;
    const { email: inviteeEmail } = await request.json();

    if (!inviteeEmail) {
      return NextResponse.json({ message: 'User email is required' }, { status: 400 });
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 });
    }

    if (project.ownerId !== inviterId) {
      return NextResponse.json(
        { message: 'Forbidden: Only the project owner can invite members' },
        { status: 403 }
      );
    }

    const invitee = await prisma.user.findUnique({
      where: { email: inviteeEmail },
    });

    if (!invitee) {
      return NextResponse.json(
        { message: `User with email ${inviteeEmail} not found` },
        { status: 404 }
      );
    }

    const existingMembership = await prisma.membership.findFirst({
      where: {
        projectId: projectId,
        userId: invitee.id,
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { message: 'User is already a member of this project' },
        { status: 409 }
      );
    }

    const newMembership = await prisma.membership.create({
      data: {
        userId: invitee.id,
        projectId: projectId,
      },
    });

    return NextResponse.json(newMembership, { status: 201 });

  } catch (error) {
    console.error('INVITE_MEMBER_ERROR:', error);
    return NextResponse.json({ message: 'Failed to invite member' }, { status: 500 });
  }
}
export async function GET(
  request: Request,
  { params }: { params: { projectId: string } }
) {
  const userId = await getUserIdFromToken();
  if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  const isMember = await prisma.membership.findFirst({
    where: { userId, projectId: params.projectId },
  });
  if (!isMember) return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  const members = await prisma.membership.findMany({
    where: { projectId: params.projectId },
    include: { user: { select: { id: true, email: true } } },
  });

  const users = members.map(m => m.user);
  return NextResponse.json(users, { status: 200 });
}