import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Supabase client for admin operations (uses service role key)
export const supabaseAdmin = createClient(
    env.SUPABASE_URL || '',
    env.SUPABASE_SERVICE_ROLE_KEY || '',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

// Regular Supabase client for user operations (uses anon key)
export const supabase = createClient(
    env.SUPABASE_URL || '',
    env.SUPABASE_ANON_KEY || ''
);
