import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for deletion to bypass RLS if needed
);

async function deleteFirstTwoPosts() {
  console.log("Fetching the first two blog posts...");
  const { data: posts, error: fetchError } = await supabase
    .from('event_posts')
    .select('*')
    .order('created_at', { ascending: true })
    .limit(2);

  if (fetchError) {
    console.error("Error fetching posts:", fetchError);
    return;
  }

  if (!posts || posts.length === 0) {
    console.log("No posts found.");
    return;
  }

  console.log(`Found ${posts.length} posts to delete.`);
  for (const post of posts) {
    console.log(`- Post ID: ${post.id}, Content: "${post.content.substring(0, 30)}..."`);
  }

  const postIds = posts.map(p => p.id);
  
  console.log("Deleting posts...");
  const { error: deleteError } = await supabase
    .from('event_posts')
    .delete()
    .in('id', postIds);

  if (deleteError) {
    console.error("Error deleting posts:", deleteError);
  } else {
    console.log("Successfully deleted the first two posts.");
  }
}

deleteFirstTwoPosts();
