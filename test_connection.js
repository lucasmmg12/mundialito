import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testDB() {
  console.log("Testing connection...");
  
  // Test matches
  const { data: matches, error: mErr } = await supabase.from('matches').select('id').limit(1);
  if (mErr) console.error("Matches error:", mErr.message);
  else console.log("Matches connected! Found:", matches?.length);

  // Test match_events
  const { data: events, error: eErr } = await supabase.from('match_events').select('id').limit(1);
  if (eErr) console.error("Match Events error:", eErr.message);
  else console.log("Match Events connected! Found:", events?.length);
  
  // Test event_posts
  const { data: posts, error: pErr } = await supabase.from('event_posts').select('id').limit(1);
  if (pErr) console.error("Event Posts error:", pErr.message);
  else console.log("Event Posts connected! Found:", posts?.length);
}

testDB();
