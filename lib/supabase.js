import { createClient } from '@supabase/supabase-js';

let _client = null;
function getClient() {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_CC_SUPABASE_URL,
      process.env.CC_SUPABASE_SERVICE_KEY
    );
  }
  return _client;
}

// Lazy proxy — client is only created at first use, not at module load time.
// This prevents build failures when env vars are not yet set.
export const supabase = new Proxy({}, {
  get(_, prop) {
    const c = getClient();
    const val = c[prop];
    return typeof val === 'function' ? val.bind(c) : val;
  }
});
