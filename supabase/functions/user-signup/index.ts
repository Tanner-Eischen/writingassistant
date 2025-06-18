    // @ts-ignore
import { Deno, serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from '@supabase/supabase-js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 405,
      });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email and password are required' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Sign up the user
    const { data, error } = await supabaseAdmin.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        emailRedirectTo: `${new URL(req.url).origin}`,
        data: {
          full_name: email.split('@')[0],
        }
      }
    });

    if (error) {
      console.error('Signup error:', error);
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      });
    }

    // The database trigger will automatically create user_settings
    // But we can verify it was created successfully
    if (data.user) {
      const { data: settingsData, error: settingsError } = await supabaseAdmin
        .from('user_settings')
        .select('user_id')
        .eq('user_id', data.user.id)
        .single();

      if (settingsError) {
        console.warn('User settings not found after signup:', settingsError);
      } else {
        console.log('User settings created successfully for:', data.user.email);
      }
    }

    return new Response(JSON.stringify({ 
      user: data.user, 
      success: true,
      message: data.user?.email_confirmed_at 
        ? 'Account created successfully!' 
        : 'Account created! Please check your email to verify your account.'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 