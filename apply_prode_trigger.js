import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const fallbackUrl = "postgresql://postgres:07052812Mv.@aws-0-us-east-1.pooler.supabase.com:6543/postgres?options=project%3Dhakysnqiryimxbwdslwe";
const client = new Client({
  connectionString: fallbackUrl,
  ssl: { rejectUnauthorized: false }
});

const sql = `
CREATE OR REPLACE FUNCTION calculate_prode_points()
RETURNS TRIGGER AS $$
DECLARE
  pred RECORD;
  points_to_add INTEGER;
  points_to_subtract INTEGER;
  actual_result TEXT;
  predicted_result TEXT;
BEGIN
  -- We run this if the match is completed (either newly completed, or goals changed while completed)
  IF NEW.status = 'completed' AND 
     (OLD.status != 'completed' OR OLD.home_goals != NEW.home_goals OR OLD.away_goals != NEW.away_goals) THEN
    
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
      points_to_subtract := COALESCE(pred.points_awarded, 0);

      -- Determine predicted result
      IF pred.home_goals > pred.away_goals THEN
        predicted_result := 'home';
      ELSIF pred.home_goals < pred.away_goals THEN
        predicted_result := 'away';
      ELSE
        predicted_result := 'tie';
      END IF;

      -- Calculate new points
      IF pred.home_goals = NEW.home_goals AND pred.away_goals = NEW.away_goals THEN
        points_to_add := 3;
      ELSIF actual_result = predicted_result THEN
        points_to_add := 1;
      END IF;

      -- Update the prediction's points_awarded
      UPDATE public.prode_predictions 
      SET points_awarded = points_to_add 
      WHERE id = pred.id;

      -- Update the user's total_points (subtract old, add new)
      UPDATE public.profiles 
      SET total_points = COALESCE(total_points, 0) - points_to_subtract + points_to_add 
      WHERE id = pred.user_id;

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
    console.error("Migration failed:", err.message);
  } finally {
    await client.end();
  }
}
run();
