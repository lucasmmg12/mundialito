import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000 // 10s timeout
});

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB!");
    const sql = fs.readFileSync('supabase/migrations/20260720_prode_schema.sql', 'utf8');
    await client.query(sql);
    console.log("Migration executed successfully!");
  } catch (err) {
    console.error("Migration failed:", err);
    
    // Fallback to connection pooler if port 5432 is blocked
    console.log("Attempting fallback with port 6543 pooler...");
    const fallbackUrl = process.env.SUPABASE_DB_URL
      .replace('db.hakysnqiryimxbwdslwe.supabase.co:5432', 'aws-0-us-east-1.pooler.supabase.com:6543')
      .replace('postgres:', 'postgres.hakysnqiryimxbwdslwe:');
      
    const client2 = new Client({
      connectionString: fallbackUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    
    try {
        await client2.connect();
        console.log("Connected via fallback pooler!");
        const sql = fs.readFileSync('supabase/migrations/20260720_prode_schema.sql', 'utf8');
        await client2.query(sql);
        console.log("Migration executed successfully via fallback!");
    } catch(err2) {
        console.error("Fallback migration failed:", err2);
    } finally {
        await client2.end();
    }
    
  } finally {
    await client.end();
  }
}
run();
