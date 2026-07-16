import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

// Same string the CLI tried to use:
const fallbackUrl = "postgresql://postgres.hakysnqiryimxbwdslwe:07052812Mv.@aws-1-us-east-1.pooler.supabase.com:5432/postgres";

const client2 = new Client({
  connectionString: fallbackUrl,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

async function run() {
  try {
      await client2.connect();
      console.log("Connected via fallback pooler on 5432!");
      const sql = fs.readFileSync('supabase/migrations/20260715100900_blog_and_match_events.sql', 'utf8');
      await client2.query(sql);
      console.log("Migration executed successfully via fallback!");
  } catch(err2) {
      console.error("Fallback migration failed:", err2.message);
  } finally {
      await client2.end();
  }
}
run();
