// Lokasi: src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(request: NextRequest) {
  // SOLUSI: Baca token dari cookie, bukan dari header
  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value;

  // Jika tidak ada token, tolak akses
  if (!token) {
    return NextResponse.json({ message: 'Authentication failed: No token provided.' }, { status: 401 });
  }

  try {
    // Verifikasi token yang didapat dari cookie
    await jwtVerify(token, secret);
    
    // Jika token valid, lanjutkan ke API endpoint yang diminta
    return NextResponse.next();
  } catch {
    // Jika token tidak valid (kadaluarsa, dll), tolak akses
    return NextResponse.json({ message: 'Authentication failed: Invalid token.' }, { status: 401 });
  }
}

// Konfigurasi ini tetap sama, melindungi semua rute di bawah /api/projects/
export const config = {
  matcher: '/api/projects/:path*',
};
