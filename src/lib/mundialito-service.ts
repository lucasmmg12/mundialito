import { supabase } from './supabase';

export interface Team {
  id: string;
  name: string;
  logo_url?: string;
}

export interface Match {
  id: string;
  match_date: string;
  status: string;
  home_team_id: string;
  away_team_id: string;
  home_goals: number;
  away_goals: number;
}

export interface EventPost {
  id: string;
  author_name: string;
  content: string;
  image_urls: string[];
  status: string;
  created_at: string;
}

export interface MatchEvent {
  id: string;
  match_id: string;
  player_id: string;
  event_type: 'goal' | 'assist' | 'yellow_card' | 'red_card';
  minute: number;
  created_at: string;
}

export const getEventPosts = async () => {
  const { data, error } = await supabase
    .from('event_posts')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as EventPost[];
};

export const createEventPost = async (post: { author_name: string; content: string; image_urls: string[] }) => {
  const { data, error } = await supabase
    .from('event_posts')
    .insert([post])
    .select()
    .single();

  if (error) throw error;
  return data as EventPost;
};

export const uploadBlogMedia = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `blog/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('event_blog_media')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('event_blog_media')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const getTeams = async () => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .order('name');
  if (error) throw error;
  return data;
};

export const getPlayersByTeam = async (teamId: string) => {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .eq('team_id', teamId)
    .order('jersey_number');
  if (error) throw error;
  return data;
};

export const startMatch = async (matchId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .update({ status: 'in_progress' })
    .eq('id', matchId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const endMatch = async (matchId: string) => {
  // 1. Terminar partido
  const { data: match, error } = await supabase
    .from('matches')
    .update({ status: 'completed' })
    .eq('id', matchId)
    .select()
    .single();
  if (error) throw error;

  // 2. Calcular puntos del Prode
  try {
    const { data: predictions } = await supabase
      .from('prode_predictions')
      .select('*')
      .eq('match_id', matchId);

    if (predictions && match) {
      for (const pred of predictions) {
        let points = 0;
        
        // Exact match (3 pts)
        if (pred.home_goals === match.home_goals && pred.away_goals === match.away_goals) {
          points = 3;
        } else {
          // Check if guessed the winner or tie (1 pt)
          const actualResult = match.home_goals > match.away_goals ? 'home' : (match.home_goals < match.away_goals ? 'away' : 'tie');
          const predictedResult = pred.home_goals > pred.away_goals ? 'home' : (pred.home_goals < pred.away_goals ? 'away' : 'tie');
          
          if (actualResult === predictedResult) {
            points = 1;
          }
        }

        if (points > 0) {
          // Update prediction points
          await supabase.from('prode_predictions').update({ points_awarded: points }).eq('id', pred.id);
          
          // Update user profile total points
          const { data: profile } = await supabase.from('profiles').select('total_points').eq('id', pred.user_id).single();
          if (profile) {
            await supabase.from('profiles').update({ total_points: (profile.total_points || 0) + points }).eq('id', pred.user_id);
          }
        }
      }
    }
  } catch (err) {
    console.error("Error calculating Prode points", err);
  }

  return match;
};

export const recordMatchEvent = async (matchId: string, playerId: string, eventType: 'goal' | 'assist' | 'yellow_card' | 'red_card', minute: number = 0) => {
  // 1. Inserción del evento
  const { data: eventData, error: eventError } = await supabase
    .from('match_events')
    .insert([{ match_id: matchId, player_id: playerId, event_type: eventType, minute }])
    .select()
    .single();

  if (eventError) throw eventError;

  // 2. Obtener el jugador actual para incrementar su contador
  const { data: player, error: fetchError } = await supabase
    .from('players')
    .select('*')
    .eq('id', playerId)
    .single();

  if (fetchError) throw fetchError;

  // 3. Actualizar el contador en la tabla players
  const updates: any = {};
  if (eventType === 'goal') updates.goals = (player.goals || 0) + 1;
  if (eventType === 'assist') updates.assists = (player.assists || 0) + 1;
  if (eventType === 'yellow_card') updates.yellow_cards = (player.yellow_cards || 0) + 1;
  if (eventType === 'red_card') updates.red_cards = (player.red_cards || 0) + 1;

  const { error: updateError } = await supabase
    .from('players')
    .update(updates)
    .eq('id', playerId);

  if (updateError) throw updateError;

  // 4. Si es gol, actualizar el marcador del partido (opcional, requiere lógica adicional para saber si es home o away)
  if (eventType === 'goal') {
      const { data: match, error: matchError } = await supabase
          .from('matches')
          .select('*')
          .eq('id', matchId)
          .single();
      
      if (!matchError && match) {
          if (match.home_team_id === player.team_id) {
              await supabase.from('matches').update({ home_goals: (match.home_goals || 0) + 1 }).eq('id', matchId);
          } else if (match.away_team_id === player.team_id) {
              await supabase.from('matches').update({ away_goals: (match.away_goals || 0) + 1 }).eq('id', matchId);
          }
      }
  }

  return eventData;
};

export const getTeamByToken = async (token: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('management_token', token)
    .single();
  if (error) throw error;
  return data;
};

export const getTeamById = async (id: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const uploadPlayerPhoto = async (file: File) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('player_photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from('player_photos')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

export const updatePlayerPhotoUrl = async (playerId: string, url: string) => {
  const { error } = await supabase
    .from('players')
    .update({ photo_url: url })
    .eq('id', playerId);
  if (error) throw error;
};

export const addPlayerToTeam = async (playerData: any) => {
  const { data, error } = await supabase
    .from('players')
    .insert([playerData])
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const removePlayer = async (playerId: string) => {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', playerId);
  if (error) throw error;
};
