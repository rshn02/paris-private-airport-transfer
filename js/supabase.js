
const SUPABASE_URL = "https://xjdaqmaiisztwnwpxatn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_HA9Zc9jxsn29AcfdcC5-WQ_jWLJVkAg";

window.ppatSupabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);
