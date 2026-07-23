-- ==========================================
-- PRODE POINTS CALCULATION TRIGGER
-- Copia y pega esto en el SQL Editor de Supabase
-- ==========================================

CREATE OR REPLACE FUNCTION calculate_prode_points()
RETURNS TRIGGER AS $$
DECLARE
  pred RECORD;
  points_to_add INTEGER;
  points_to_subtract INTEGER;
  actual_result TEXT;
  predicted_result TEXT;
BEGIN
  -- Solo calcular si el partido pasa a estado completado (o si cambian los goles de un completado)
  IF NEW.status = 'completed' AND 
     (OLD.status != 'completed' OR OLD.home_goals != NEW.home_goals OR OLD.away_goals != NEW.away_goals) THEN
    
    -- Determinar el resultado real del partido
    IF NEW.home_goals > NEW.away_goals THEN
      actual_result := 'home';
    ELSIF NEW.home_goals < NEW.away_goals THEN
      actual_result := 'away';
    ELSE
      actual_result := 'tie';
    END IF;

    -- Iterar por todas las predicciones de este partido
    FOR pred IN SELECT * FROM public.prode_predictions WHERE match_id = NEW.id LOOP
      points_to_add := 0;
      points_to_subtract := COALESCE(pred.points_awarded, 0);

      -- Determinar el resultado de la predicción
      IF pred.home_goals > pred.away_goals THEN
        predicted_result := 'home';
      ELSIF pred.home_goals < pred.away_goals THEN
        predicted_result := 'away';
      ELSE
        predicted_result := 'tie';
      END IF;

      -- Calcular puntos (3 por resultado exacto, 1 por ganador/empate correcto)
      IF pred.home_goals = NEW.home_goals AND pred.away_goals = NEW.away_goals THEN
        points_to_add := 3;
      ELSIF actual_result = predicted_result THEN
        points_to_add := 1;
      END IF;

      -- Actualizar puntos ganados en la predicción
      UPDATE public.prode_predictions 
      SET points_awarded = points_to_add 
      WHERE id = pred.id;

      -- Sumar al total del usuario restando el anterior si hubo recálculo
      UPDATE public.profiles 
      SET total_points = COALESCE(total_points, 0) - points_to_subtract + points_to_add 
      WHERE id = pred.user_id;

    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar el trigger si existe para recrearlo
DROP TRIGGER IF EXISTS trg_calculate_prode_points ON public.matches;

-- Crear el trigger para que escuche cambios en matches
CREATE TRIGGER trg_calculate_prode_points
AFTER UPDATE ON public.matches
FOR EACH ROW
EXECUTE FUNCTION calculate_prode_points();

-- Asegurarse de que el bucket de avatares exista
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;
