
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id),
    sender_id UUID NOT NULL REFERENCES profiles(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_read BOOLEAN DEFAULT FALSE
);

-- RLS Policy: Allow users to view messages in their chats
CREATE POLICY "Allow users to view messages in their chats" ON messages
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM chat_participants WHERE chat_id = messages.chat_id));

-- RLS Policy: Allow users to insert messages in their chats
CREATE POLICY "Allow users to insert messages in their chats" ON messages
FOR INSERT WITH CHECK (auth.uid() = sender_id AND auth.uid() IN (SELECT user_id FROM chat_participants WHERE chat_id = messages.chat_id));
