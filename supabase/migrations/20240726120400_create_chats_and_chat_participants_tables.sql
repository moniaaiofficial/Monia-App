
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE chat_participants (
    chat_id UUID NOT NULL REFERENCES chats(id),
    user_id UUID NOT NULL REFERENCES profiles(id),
    PRIMARY KEY (chat_id, user_id)
);

-- RLS Policy: Allow users to view chats they are a part of
CREATE POLICY "Allow users to view chats they are a part of" ON chats
FOR SELECT USING (auth.uid() IN (SELECT user_id FROM chat_participants WHERE chat_id = chats.id));

-- RLS Policy: Allow users to view chat participants
CREATE POLICY "Allow users to view chat participants" ON chat_participants
FOR SELECT USING (auth.uid() = user_id);
