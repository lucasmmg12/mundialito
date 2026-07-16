import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error("Error: Necesitas el SUPABASE_SERVICE_ROLE_KEY en tu archivo .env para crear usuarios.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdmin() {
  const email = 'admin@sanatorio.com';
  const password = 'password123';

  console.log(`Intentando crear el usuario: ${email}...`);

  const { data, error } = await supabase.auth.admin.createUser({
    email: email,
    password: password,
    email_confirm: true // Confirmamos el email directamente
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ El usuario ya existe. Puedes usar sus credenciales.');
    } else {
      console.error('❌ Error creando usuario:', error.message);
    }
  } else {
    console.log('✅ ¡Usuario creado con éxito!');
  }
  
  console.log('-----------------------------------');
  console.log(`Email: ${email}`);
  console.log(`Contraseña: ${password}`);
  console.log('-----------------------------------');
}

createAdmin();
