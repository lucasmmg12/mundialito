import { Client } from 'pg';
import dns from 'dns';

async function getIPv4(hostname) {
  return new Promise((resolve, reject) => {
    dns.lookup(hostname, { family: 4 }, (err, address) => {
      if (err) reject(err);
      else resolve(address);
    });
  });
}

async function run() {
  try {
    const ip = await getIPv4('db.hakysnqiryimxbwdslwe.supabase.co');
    console.log("Resolved IPv4:", ip);
    
    const client = new Client({
      host: ip,
      port: 5432,
      database: 'postgres',
      user: 'postgres',
      password: '07052812Mv.',
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log("CONNECTED TO IPV4 DIRECTLY!");
    
    const res = await client.query('SELECT 1 as val');
    console.log("QUERY RESULT:", res.rows);
    
    await client.end();
  } catch (err) {
    console.error("FAILED:", err.message);
  }
}

run();
