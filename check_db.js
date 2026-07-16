import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('event_posts').select('*').limit(1);
  if (error) {
    console.error('Table does not exist or error:', error.message);
  } else {
    console.log('Table event_posts exists!');
  }
  
  const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('event_blog_media');
  if (bucketError) {
    console.error('Bucket error:', bucketError.message);
  } else {
    console.log('Bucket event_blog_media exists!');
  }
}

check();
