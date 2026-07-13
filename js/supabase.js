
const SUPABASE_URL = "https://xjdaqmaiisztwnwpxatn.supabase.co/rest/v1/";
const SUPABASE_ANON_KEY = "sb_publishable_HA9Zc9jxsn29AcfdcC5-WQ_jWLJVkAg";

// Initialisation du client Supabase
const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Vérification de la connexion
console.log("✅ Supabase connecté");