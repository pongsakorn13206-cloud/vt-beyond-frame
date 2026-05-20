import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/auth — Admin login
export async function POST(request) {
  try {
    const { password } = await request.json();
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'ระบบยังไม่ได้ตั้งค่ารหัสผ่าน admin' },
        { status: 500 }
      );
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'รหัสผ่านไม่ถูกต้อง' },
        { status: 401 }
      );
    }

    // Set admin session cookie
    const cookieStore = await cookies();
    const token = Buffer.from(`admin:${Date.now()}`).toString('base64');
    
    cookieStore.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'เข้าสู่ระบบสำเร็จ' });
  } catch (error) {
    console.error('Auth error:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาด' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/auth — Admin logout
export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
