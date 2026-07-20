const https = require('https');

const SUPABASE_URL = 'https://hakysnqiryimxbwdslwe.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhha3lzbnFpcnlpbXhid2RzbHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDA0MjI3NCwiZXhwIjoyMDg1NjE4Mjc0fQ.v0Zw7yFjGKJX8xsMCZJPwRyhr2eNd1gjASsI7qSK0YM';

const sql = `
ALTER TABLE teams ADD COLUMN IF NOT EXISTS captain_email TEXT;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS management_token UUID DEFAULT gen_random_uuid();
ALTER TABLE players ADD COLUMN IF NOT EXISTS shirt_number TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'M';
ALTER TABLE players ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE players ADD COLUMN IF NOT EXISTS photo_url TEXT;
`;

function request(path, method, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'hakysnqiryimxbwdslwe.supabase.co',
      path,
      method,
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Running migration via Supabase REST API...\n');
  
  const res = await request('/rest/v1/rpc/exec_sql', 'POST', { sql });
  
  if (res.status === 200 || res.status === 204) {
    console.log('✅ Migration applied via RPC!');
  } else {
    console.log('RPC exec_sql not available (status', res.status + ')');
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard:');
    console.log('   https://hakysnqiryimxbwdslwe.supabase.co/project/hakysnqiryimxbwdslwe/sql/new\n');
    console.log('------- COPY THIS SQL -------');
    console.log(sql);
    console.log('-----------------------------');
  }
}

run().catch(console.error);
