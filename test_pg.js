import { Client } from 'pg';

const url1 = "postgresql://postgres:07052812Mv.@aws-0-us-east-1.pooler.supabase.com:6543/postgres?options=project%3Dhakysnqiryimxbwdslwe";
const url2 = "postgresql://postgres.hakysnqiryimxbwdslwe:07052812Mv.@aws-0-us-east-1.pooler.supabase.com:5432/postgres";

async function test(url, name) {
  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    console.log(name, "CONNECTED!");
    await client.end();
  } catch(e) {
    console.log(name, "FAILED:", e.message);
  }
}

async function run() {
  await test(url1, "URL1");
  await test(url2, "URL2");
}

run();
