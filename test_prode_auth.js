import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testAuth() {
  const email = `testuser_${Date.now()}@example.com`;
  const password = "securepassword123";

  console.log(`Attempting to sign up with ${email}...`);
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) {
    console.error("Sign up failed:", error.message);
    return;
  }

  console.log("Sign up successful!", data.user ? `User ID: ${data.user.id}` : "No user returned.");
  
  if (data.session) {
      console.log("User was automatically signed in (Email confirmation is likely OFF).");
      
      console.log("Attempting to insert profile...");
      const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: data.user.id,
            full_name: "Test User",
            team_id: null,
            avatar_url: ""
          }
      ]);
      
      if (profileError) {
          console.error("Profile insertion failed:", profileError.message);
      } else {
          console.log("Profile inserted successfully!");
      }

  } else {
      console.log("User was NOT signed in automatically. Email confirmation is likely ON, or another setting requires verification.");
  }
}

testAuth();
