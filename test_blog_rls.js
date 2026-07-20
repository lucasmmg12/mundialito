import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testRLS() {
  console.log("Testing insert into event_posts...");
  const { data: postData, error: postError } = await supabase
    .from('event_posts')
    .insert([{ author_name: 'Test', content: 'Test content', image_urls: [] }])
    .select();
  
  if (postError) {
    console.error("event_posts INSERT error:", postError);
  } else {
    console.log("event_posts INSERT success:", postData);
  }

  console.log("Testing insert into storage.objects...");
  const { data: storageData, error: storageError } = await supabase.storage
    .from('event_blog_media')
    .upload(`test_${Date.now()}.txt`, 'Hello world');
  
  if (storageError) {
    console.error("storage.objects INSERT error:", storageError);
  } else {
    console.log("storage.objects INSERT success:", storageData);
  }
}

testRLS();
