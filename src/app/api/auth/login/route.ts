import { serialize } from 'cookie';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const MAX_AGE = 60 * 60 * 24; // 1 hari dalam detik

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      // Menggunakan new Response untuk konsistensi
      return new Response(JSON.stringify({ message: 'Email dan password dibutuhkan' }), { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return new Response(JSON.stringify({ message: 'Email atau password salah' }), { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return new Response(JSON.stringify({ message: 'Email atau password salah' }), { status: 401 });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: MAX_AGE }
    );

    const serialized = serialize('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: MAX_AGE,
      path: '/',
    });
    
    // SOLUSI: Membuat respons dengan new Response() secara manual
    // Ini memberikan kita kontrol penuh atas header yang dikirim.
    return new Response(JSON.stringify({ message: 'Login berhasil' }), {
      status: 200,
      headers: {
        'Set-Cookie': serialized,
        'Content-Type': 'application/json',
      },
    });

  } catch (error: unknown) {
    console.error("LOGIN API ERROR:", error);
    if (error instanceof Error) {
        return new Response(JSON.stringify({ message: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify({ message: 'Terjadi kesalahan pada server' }), { status: 500 });
  }
}