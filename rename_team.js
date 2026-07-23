import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for database update
);

async function renameTeam() {
  const oldName = "Recepción de Internado";
  const newName = "Laboratorio";

  console.log(`Renaming team from "${oldName}" to "${newName}"...`);

  const { data, error } = await supabase
    .from('teams')
    .update({ name: newName })
    .eq('name', oldName)
    .select();

  if (error) {
    console.error("Error renaming team:", error.message);
  } else if (data && data.length > 0) {
    console.log(`Successfully renamed team to "${data[0].name}".`);
  } else {
    console.log(`Team "${oldName}" not found.`);
  }
}

renameTeam();
