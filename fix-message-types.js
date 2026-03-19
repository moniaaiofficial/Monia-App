const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
  throw new Error(
    "Missing env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixMessageTypes() {
  console.log(
    "════════════════════════════════════════════════════════════════════════════════"
  );
  console.log(
    "MONIA APP - FIX MESSAGE TYPE MISMATCH AND TEST FULL CHAT SYSTEM"
  );
  console.log(
    "════════════════════════════════════════════════════════════════════════════════\n"
  );

  try {
    // Get an existing chat
    console.log("STEP 1: GET EXISTING CHAT");
    console.log(
      "────────────────────────────────────────────────────────────────────────────────\n"
    );

    const {
      data: chats,
      error: chatsError,
    } = await supabaseAdmin.from("chats").select("id").limit(1);

    if (chatsError) throw chatsError;
    if (!chats || chats.length === 0) throw new Error("No chats found");

    const chatId = chats[0].id;
    console.log(`✓ Found chat: ${chatId}\n`);

    // Test message insert with correct UUID type
    console.log("STEP 2: INSERT MESSAGE WITH CORRECT TYPES");
    console.log(
      "────────────────────────────────────────────────────────────────────────────────\n"
    );

    const {
      error: messageError,
    } = await supabaseAdmin.from("messages").insert([
      {
        chat_id: chatId, // This is already UUID from database
        sender_id: "google_user_1773448077695",
        content: "Test message after type fix",
      },
    ]);

    if (messageError) {
      console.error("❌ Message insert failed:", messageError);
      throw messageError;
    }

    console.log("✓ Message created successfully\n");

    // Verify message can be read back
    console.log("STEP 3: VERIFY MESSAGE READ");
    console.log(
      "────────────────────────────────────────────────────────────────────────────────\n"
    );

    const {
      data: messages,
      error: messagesError,
    } = await supabaseAdmin.from("messages").select("*").eq("chat_id", chatId);

    if (messagesError) throw messagesError;

    console.log(`✓ Retrieved ${messages.length} message(s):`);
    messages.forEach((msg, i) => {
      console.log(`  ${i + 1}. "${msg.content}" (${msg.sender_id})`);
    });
    console.log();

    // Test that getUserChats works
    console.log("STEP 4: TEST getUserChats QUERY");
    console.log(
      "────────────────────────────────────────────────────────────────────────────────\n"
    );

    const userId = "google_user_1773448077695";
    const { data: userChats, error: userChatsError } = await supabaseAdmin
      .from("chats")
      .select(
        `
        id,
        participants,
        last_message_time,
        created_at
      `
      )
      .contains("participants", [userId]);

    if (userChatsError) throw userChatsError;

    console.log(`✓ User chats query returned ${userChats.length} chat(s):`);
    userChats.forEach((chat, i) => {
      console.log(`  ${i + 1}. Chat ${chat.id}`);
      console.log(`     Participants: ${chat.participants.join(", ")}`);
      console.log(
        `     Last message: ${chat.last_message_time || "None yet"}`
      );
    });
    console.log();

    // Query messages for the chat
    console.log("STEP 5: TEST MESSAGE QUERY FOR CHAT");
    console.log(
      "────────────────────────────────────────────────────────────────────────────────\n"
    );

    const {
      data: chatMessages,
      error: chatMessagesError,
    } = await supabaseAdmin
      .from("messages")
      .select("*")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });

    if (chatMessagesError) throw chatMessagesError;

    console.log(`✓ Messages in chat: ${chatMessages.length}`);
    chatMessages.forEach((msg, i) => {
      console.log(`  ${i + 1}. ${msg.sender_id}: "${msg.content}"`);
    });
    console.log();

    // Summary
    console.log(
      "════════════════════════════════════════════════════════════════════════════════"
    );
    console.log("SUMMARY");
    console.log(
      "════════════════════════════════════════════════════════════════════════════════\n"
    );

    console.log("Chat System Status:");
    console.log("  ✓ Chats table: WORKING");
    console.log("  ✓ Messages table: WORKING");
    console.log("  ✓ Message inserts: WORKING (type mismatch fixed)");
    console.log("  ✓ getUserChats query: WORKING");
    console.log("  ✓ Chat message retrieval: WORKING");
    console.log("\n✅ FULL CHAT SYSTEM OPERATIONAL");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  }
}

fixMessageTypes();
