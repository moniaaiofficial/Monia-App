import { auth } from '@clerk/nextjs/server';
import { getDb } from '@/lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const db = getDb();
    const result = await db.query(
      'SELECT id, full_name, email, mobile, city, username, avatar_url FROM profiles WHERE id = $1',
      [userId]
    );
    const profile = result.rows[0] ?? null;
    return NextResponse.json({ profile });
  } catch (err: any) {
    console.error('[Profile API] Error:', err.message);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
