import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chatId = params.id;

    const { data: chat, error: chatErr } = await supabaseAdmin
      .from('chats')
      .select('participants')
      .eq('id', chatId)
      .single();

    if (chatErr || !chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    if (!(chat.participants as string[]).includes(userId)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('messages')
      .delete()
      .eq('chat_id', chatId);

    if (error) {
      console.error('[Clear Chat] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await supabaseAdmin
      .from('chats')
      .update({ last_message: null, last_message_time: new Date().toISOString() })
      .eq('id', chatId);

    console.log(`[Clear Chat] ✅ Cleared all messages for chat ${chatId} by user ${userId}`);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Clear Chat] Unexpected error:', err);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
