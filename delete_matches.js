import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkMatches() {
  const { data, error } = await supabase.from('matches').select('*');
  console.log("Matches count:", data ? data.length : 0);
  if (data && data.length > 0) {
    console.log("Deleting all matches to clear constraints...");
    const { error: delError } = await supabase.from('matches').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log("Delete matches error:", delError);
  }
}

checkMatches();
