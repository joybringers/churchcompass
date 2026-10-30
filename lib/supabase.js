import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_CC_SUPABASE_URL;
const key = process.env.CC_SUPABASE_SERVICE_KEY;

export const supabase = createClient(url, key);
