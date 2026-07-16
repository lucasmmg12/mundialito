import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function setup() {
  console.log('Creating bucket...');
  const { data, error } = await supabase.storage.createBucket('event_blog_media', {
    public: true,
    fileSizeLimit: 10485760, // 10MB
  });

  if (error) {
    console.error('Bucket creation error (might already exist):', error.message);
  } else {
    console.log('Bucket created successfully:', data);
  }
}

setup();
