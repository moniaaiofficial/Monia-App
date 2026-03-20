import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    const limit  = parseInt(searchParams.get('limit') ?? '100', 10);

    if (!chatId) {
      return NextResponse.json({ error: 'Missing chatId' }, { status: 400 });
    }

    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('participants')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!(chat.participants as string[]).includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) {
      console.error('[Messages GET] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data: data ?? [] });
  } catch (err) {
    console.error('[Messages GET] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { chatId, content, type = 'text' } = await request.json();

    if (!chatId || !content) {
      return NextResponse.json({ error: 'Missing chatId or content' }, { status: 400 });
    }

    const { data: chat, error: chatError } = await supabaseAdmin
      .from('chats')
      .select('participants')
      .eq('id', chatId)
      .single();

    if (chatError || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!(chat.participants as string[]).includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: msg, error } = await supabaseAdmin
      .from('messages')
      .insert({ chat_id: chatId, sender_id: userId, content, type, status: 'sent' })
      .select()
      .single();

    if (error) {
      console.error('[Messages POST] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const preview = type === 'text' ? content : `📎 ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    await supabaseAdmin
      .from('chats')
      .update({ last_message: preview, last_message_time: new Date().toISOString() })
      .eq('id', chatId);

    return NextResponse.json({ data: msg });
  } catch (err) {
    console.error('[Messages POST] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId, status } = await request.json();
    if (!messageId || !status) {
      return NextResponse.json({ error: 'Missing messageId or status' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .update({ status })
      .eq('id', messageId);

    if (error) {
      console.error('[Messages PATCH] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Messages PATCH] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
