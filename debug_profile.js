import { createClient } from "@supabase/supabase-js";
// import 'dotenv/config'; // Removed to avoid install issues, we'll hardcode or read manually if needed

// Hardcoding for debug script (using values from .env.local tool read)
const SUPABASE_URL = "https://uxomylkurprgkbcxjnec.supabase.co";
// NOTE: I am using the ANON KEY here.
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV4b215bGt1cnByZ2tiY3hqbmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk5OTYxODUsImV4cCI6MjA3NTU3MjE4NX0.WvH3pz3SxIlxrxCyNT6tzedmFac50fMde7hkcqMg1oY";

console.log("Initializing Supabase Client...");
console.log("URL:", SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    console.log("Testing connection...");
    try {
        const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
        if (error) {
            console.error("Connection failed:", error);
        } else {
            console.log("Connection successful. Profiles count:", data); // data is null for head:true but count is in count
        }
    } catch (e) {
        console.error("Exception during connection test:", e);
    }
}

async function debugProfileUpdate() {
    console.log("Debugging Profile Update...");
    
    // 1. Sign In (We need a valid user to test RLS)
    // You might need to provide a valid test user email/password here
    // Or we can try to update a specific user if we have the service role key (which we don't here)
    // Let's assume we can't easily sign in without user interaction in this script
    // So we will just test the 'select' and 'upsert' assuming we might not be authenticated
    // which should return an error, but NOT hang.
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("Current User:", user?.id || "None");

    if (!user) {
        console.log("No user logged in. Attempting to sign in with a test account...");
        // NOTE: Replace with valid credentials if you want to test RLS
        const email = "pabloroga6@gmail.com"; 
        const password = "Password123!"; // You might need to change this
        
        console.log(`Attempting login for ${email}...`);
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (loginError) {
            console.error("Login failed:", loginError.message);
            return;
        }
        console.log("Login successful:", loginData.user.id);
    }

    // 2. Test Upsert
    console.log("Testing Upsert on 'profiles'...");
    const updates = {
        updated_at: new Date().toISOString(),
        full_name: "Test User Debug",
    };

    const { data: authUser } = await supabase.auth.getUser();
    if (!authUser.user) return;

    const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout in script')), 5000)
    );

    try {
        const updatePromise = supabase
            .from('profiles')
            .upsert({
                id: authUser.user.id,
                ...updates
            });
            
        console.log("Sending request...");
        const result = await Promise.race([updatePromise, timeoutPromise]);
        console.log("Request finished:", result);
    } catch (e) {
        console.error("Request failed/timed out:", e);
    }
}

async function run() {
    await testConnection();
    await debugProfileUpdate();
}

run();
