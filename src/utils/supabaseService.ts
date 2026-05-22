import { supabase } from "@/integrations/supabase/client";
import { RegisteredPlayer, Match, Player } from "../types/pontinho";

// Helper to check if Supabase is reachable and tables exist
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

// --- PLAYERS API ---

export async function fetchRegisteredPlayers(): Promise<RegisteredPlayer[]> {
  try {
    const { data, error } = await supabase
      .from("players")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    if (data) {
      return data.map((p: any) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
        color: p.color || "#EF4444",
        createdAt: new Date(p.created_at).getTime(),
      }));
    }
  } catch (err) {
    console.warn("[Supabase] Falling back to localStorage for players:", err);
  }

  // Fallback
  const saved = localStorage.getItem("pontinho_registered_players");
  return saved ? JSON.parse(saved) : [];
}

export async function insertRegisteredPlayer(player: RegisteredPlayer): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").insert([
      {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        color: player.color,
        created_at: new Date(player.createdAt).toISOString(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error inserting player, saving locally:", err);
    return false;
  }
}

export async function updateRegisteredPlayer(player: RegisteredPlayer): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("players")
      .update({
        name: player.name,
        avatar: player.avatar,
        color: player.color,
      })
      .eq("id", player.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error updating player, saving locally:", err);
    return false;
  }
}

export async function deleteRegisteredPlayer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error deleting player, saving locally:", err);
    return false;
  }
}

// --- MATCHES API ---

export async function fetchMatches(): Promise<Match[]> {
  try {
    const { data, error } = await supabase
      .from("matches")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (data) {
      return data.map((m: any) => {
        const matchData = m.match_data || {};
        return {
          id: m.id,
          name: matchData.name || `Mesa`,
          date: new Date(m.created_at).toLocaleDateString("pt-BR"),
          players: matchData.players || [],
          rounds: matchData.rounds || [],
          limitScore: matchData.limitScore || 100,
          isFinished: true,
          winnerId: m.winner_id,
          duration: m.duration || 0,
        };
      });
    }
  } catch (err) {
    console.warn("[Supabase] Falling back to localStorage for matches:", err);
  }

  // Fallback
  const saved = localStorage.getItem("pontinho_matches");
  return saved ? JSON.parse(saved) : [];
}

export async function insertMatch(match: Match): Promise<boolean> {
  try {
    // 1. Insert into matches table
    const { error: matchError } = await supabase.from("matches").insert([
      {
        id: match.id,
        winner_id: match.winnerId,
        duration: match.duration,
        match_data: {
          name: match.name,
          players: match.players,
          rounds: match.rounds,
          limitScore: match.limitScore,
        },
        created_at: new Date().toISOString(),
      },
    ]);

    if (matchError) throw matchError;

    // 2. Insert into match_players table for detailed statistics
    const matchPlayersInserts = match.players.map((p, idx) => ({
      match_id: match.id,
      player_id: p.id,
      final_score: p.totalScore,
      eliminated: p.isEliminated,
      placement: p.isEliminated ? idx + 2 : 1, // Winner is 1st, others sorted
    }));

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(matchPlayersInserts);

    if (playersError) {
      console.error("[Supabase] Error inserting match players:", playersError);
    }

    return true;
  } catch (err) {
    console.error("[Supabase] Error inserting match, saving locally:", err);
    return false;
  }
}