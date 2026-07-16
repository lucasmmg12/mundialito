import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: 'postgresql://postgres:07052812Mv.@db.hakysnqiryimxbwdslwe.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  console.log('Connected to DB. Reloading schema...');
  await client.query("NOTIFY pgrst, 'reload schema'");
  console.log('Schema reloaded!');
  await client.end();
}
run().catch(console.error);
