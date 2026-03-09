import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const now = new Date().toISOString();

    const { data: expiredMedia, error: fetchError } = await supabase
      .from('media_files')
      .select('id, file_path')
      .lt('media_expiry', now)
      .eq('is_deleted', false);

    if (fetchError) {
      throw fetchError;
    }

    let deletedCount = 0;
    let storageDeletedCount = 0;

    if (expiredMedia && expiredMedia.length > 0) {
      for (const media of expiredMedia) {
        const filePath = media.file_path.replace('media/', '');

        const { error: storageError } = await supabase.storage
          .from('media')
          .remove([filePath]);

        if (!storageError) {
          storageDeletedCount++;
        }
      }

      const { error: updateError } = await supabase
        .from('media_files')
        .update({ is_deleted: true })
        .in('id', expiredMedia.map(m => m.id));

      if (updateError) {
        throw updateError;
      }

      deletedCount = expiredMedia.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleaned up ${deletedCount} expired media files`,
        deletedFromStorage: storageDeletedCount,
        deletedFromDatabase: deletedCount,
        timestamp: now,
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
