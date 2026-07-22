import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE OR REPLACE FUNCTION calculate_prode_points()
RETURNS TRIGGER AS $$
DECLARE
  pred RECORD;
  points_to_add INTEGER;
  actual_result TEXT;
  predicted_result TEXT;
BEGIN
  -- Only run if status changed to 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    
    -- Determine actual result
    IF NEW.home_goals > NEW.away_goals THEN
      actual_result := 'home';
    ELSIF NEW.home_goals < NEW.away_goals THEN
      actual_result := 'away';
    ELSE
      actual_result := 'tie';
    END IF;

    -- Loop through all predictions for this match
    FOR pred IN SELECT * FROM public.prode_predictions WHERE match_id = NEW.id LOOP
      points_to_add := 0;

      -- Determine predicted result
      IF pred.home_goals > pred.away_goals THEN
        predicted_result := 'home';
      ELSIF pred.home_goals < pred.away_goals THEN
        predicted_result := 'away';
      ELSE
        predicted_result := 'tie';
      END IF;

      -- Calculate points
      IF pred.home_goals = NEW.home_goals AND pred.away_goals = NEW.away_goals THEN
        points_to_add := 3;
      ELSIF actual_result = predicted_result THEN
        points_to_add := 1;
      END IF;

      -- Update if points > 0
      IF points_to_add > 0 THEN
        UPDATE public.prode_predictions 
        SET points_awarded = points_to_add 
        WHERE id = pred.id;

        UPDATE public.profiles 
        SET total_points = COALESCE(total_points, 0) + points_to_add 
        WHERE id = pred.user_id;
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_calculate_prode_points ON public.matches;

CREATE TRIGGER trg_calculate_prode_points
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION calculate_prode_points();
`;

async function run() {
  try {
    await client.connect();
    console.log("Connected to DB!");
    await client.query(sql);
    console.log("Prode logic trigger installed successfully!");
  } catch (err) {
    console.error("Migration failed directly, trying fallback...", err.message);
    
    // Use the known working pooler connection
    const fallbackUrl = "postgresql://postgres.hakysnqiryimxbwdslwe:07052812Mv.@aws-1-us-east-1.pooler.supabase.com:5432/postgres";
      
    const client2 = new Client({
      connectionString: fallbackUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000
    });
    
    try {
        await client2.connect();
        console.log("Connected via fallback pooler!");
        await client2.query(sql);
        console.log("Prode logic trigger installed successfully via fallback!");
    } catch(err2) {
        console.error("Fallback migration failed:", err2.message);
    } finally {
        await client2.end();
    }
  } finally {
    await client.end();
  }
}
run();
