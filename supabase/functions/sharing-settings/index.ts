import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SharingSettingsData {
  user_id?: string;
  user_email?: string;
  sharing_enabled?: boolean;
  share_sermons?: boolean;
  share_events?: boolean;
  share_prayer_requests?: boolean;
  share_announcements?: boolean;
  share_media?: boolean;
  allow_public_sharing?: boolean;
  share_with_contacts?: boolean;
  share_with_groups?: boolean;
  custom_message?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get user from JWT token if available
    let userId: string | null = null
    let userEmail: string | null = null

    const authHeader = req.headers.get('Authorization')
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (user && !userError) {
          userId = user.id
          userEmail = user.email || null
          console.log('Authenticated user found:', user.id)
        }
      } catch (error) {
        console.log('JWT token invalid or expired:', error.message)
      }
    }

    if (req.method === 'GET') {
      // Get sharing settings for user
      let query = supabaseClient
        .from('pastor_sharing_settings')
        .select('*')

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.eq('user_email', userEmail)
      } else {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required to fetch sharing settings' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      const { data: settings, error: fetchError } = await query.single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Database error:', fetchError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to fetch sharing settings',
            details: fetchError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Return default settings if none found
      const defaultSettings = {
        id: null,
        user_id: userId,
        user_email: userEmail,
        sharing_enabled: true,
        share_sermons: true,
        share_events: true,
        share_prayer_requests: true,
        share_announcements: true,
        share_media: true,
        allow_public_sharing: false,
        share_with_contacts: true,
        share_with_groups: true,
        custom_message: null,
        created_at: null,
        updated_at: null
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: settings || defaultSettings
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'POST' || req.method === 'PUT') {
      // Create or update sharing settings
      const body: SharingSettingsData = await req.json()
      
      // Validate required fields for authentication
      if (!userId && !userEmail) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required to save sharing settings' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Prepare settings data
      const settingsData = {
        user_id: userId || body.user_id || null,
        user_email: userEmail || body.user_email || null,
        sharing_enabled: body.sharing_enabled ?? true,
        share_sermons: body.share_sermons ?? true,
        share_events: body.share_events ?? true,
        share_prayer_requests: body.share_prayer_requests ?? true,
        share_announcements: body.share_announcements ?? true,
        share_media: body.share_media ?? true,
        allow_public_sharing: body.allow_public_sharing ?? false,
        share_with_contacts: body.share_with_contacts ?? true,
        share_with_groups: body.share_with_groups ?? true,
        custom_message: body.custom_message || null,
      }

      // Check if settings already exist
      let existingSettings = null
      if (userId) {
        const { data } = await supabaseClient
          .from('pastor_sharing_settings')
          .select('id')
          .eq('user_id', userId)
          .single()
        existingSettings = data
      } else if (userEmail) {
        const { data } = await supabaseClient
          .from('pastor_sharing_settings')
          .select('id')
          .eq('user_email', userEmail)
          .single()
        existingSettings = data
      }

      let result
      let error

      if (existingSettings) {
        // Update existing settings
        const { data, error: updateError } = await supabaseClient
          .from('pastor_sharing_settings')
          .update(settingsData)
          .eq('id', existingSettings.id)
          .select()
          .single()

        result = data
        error = updateError
      } else {
        // Create new settings
        const { data, error: insertError } = await supabaseClient
          .from('pastor_sharing_settings')
          .insert(settingsData)
          .select()
          .single()

        result = data
        error = insertError
      }

      if (error) {
        console.error('Database error:', error)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to save sharing settings',
            details: error.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Sharing settings ${existingSettings ? 'updated' : 'created'} for user: ${userId || userEmail}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sharing settings saved successfully',
          data: result
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    if (req.method === 'DELETE') {
      // Delete sharing settings
      if (!userId && !userEmail) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Authentication required to delete sharing settings' 
          }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      let query = supabaseClient
        .from('pastor_sharing_settings')
        .delete()

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.eq('user_email', userEmail)
      }

      const { error: deleteError } = await query

      if (deleteError) {
        console.error('Database error:', deleteError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Failed to delete sharing settings',
            details: deleteError.message 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log(`Sharing settings deleted for user: ${userId || userEmail}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Sharing settings deleted successfully'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Method not allowed' 
      }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
