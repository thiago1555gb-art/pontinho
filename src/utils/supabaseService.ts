import { supabase } from "@/integrations/supabase/client";
import { RegisteredPlayer, Match, Player } from "../types/pontinho";

// Helper to generate a valid UUID v4
export function generateUUID(): string {
  if (typeof window !== "undefined" && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// Helper to check if Supabase is reachable and tables exist
export async function checkSupabaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").select("id").limit(1);
    return !error;
  } catch {
    return false;
  }
}

// --- STORAGE API ---

/**
 * Uploads a player avatar file to Supabase Storage 'avatars' bucket.
 * Returns the public URL of the uploaded image, or null if failed.
 */
export async function uploadPlayerAvatar(playerId: string, file: File): Promise<string | null> {
  try {
    // Clean file name to avoid issues
    const fileExt = file.name.split('.').pop();
    const fileName = `${playerId}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // Upload file using standard fetch to Supabase Storage API
    // since our custom client supports standard fetch, we can construct the upload request
    const SUPABASE_URL = "https://czwcdqkxmkaofmolknvt.supabase.co";
    const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6d2NkcWt4bWthb2Ztb2xrbnZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0Nzc2NDUsImV4cCI6MjA5NTA1MzY0NX0.EvPgrG9_y0SR0KEqv1Aj5a4H-cT4pPYdcn2rbFuQxnw";

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/avatars/${filePath}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_PUBLISHABLE_KEY,
        'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: file
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(errText);
    }

    // Return the public URL
    return `${SUPABASE_URL}/storage/v1/object/public/avatars/${filePath}`;
  } catch (err) {
    console.error("[Supabase Storage] Error uploading avatar:", err);
    return null;
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
        avatarUrl: p.avatar_url || undefined,
        color: p.color || "#EF4444",
        createdAt: new Date(p.created_at).getTime(),
        gamesPlayed: p.matches_played || 0,
        wins: p.victories || 0,
        winRate: p.win_rate || 0,
      }));
    }
  } catch (err) {
    console.warn("[Supabase] Falling back to localStorage for players:", err);
  }

  // Fallback
  const saved = localStorage.getItem("pontinho_registered_players");
  return saved ? JSON.parse(saved) : [];
}

export async function isPlayerNameDuplicate(name: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase.from("players").select("id").eq("name", name);
    if (excludeId) {
      query = query.eq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data && data.length > 0;
  } catch (err) {
    console.warn("[Supabase] Error checking duplicate name, checking locally:", err);
    const saved = localStorage.getItem("pontinho_registered_players");
    if (saved) {
      const players: RegisteredPlayer[] = JSON.parse(saved);
      return players.some((p) => p.name.toLowerCase() === name.toLowerCase() && p.id !== excludeId);
    }
    return false;
  }
}

export async function insertRegisteredPlayer(player: RegisteredPlayer): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").insert([
      {
        id: player.id,
        name: player.name,
        avatar: player.avatar,
        avatar_url: player.avatarUrl || null,
        color: player.color,
        matches_played: player.gamesPlayed || 0,
        victories: player.wins || 0,
        win_rate: player.winRate || 0,
        created_at: new Date(player.createdAt).toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error inserting player:", err);
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
        avatar_url: player.avatarUrl || null,
        color: player.color,
        updated_at: new Date().toISOString(),
      })
      .eq("id", player.id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error updating player:", err);
    return false;
  }
}

export async function deleteRegisteredPlayer(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error("[Supabase] Error deleting player:", err);
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
        winner_id: match.winnerId || null,
        total_players: match.players.length,
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

    // 2. Insert into match_participants table
    const participantsInserts = match.players.map((p, idx) => ({
      id: generateUUID(),
      match_id: match.id,
      player_id: p.id,
      final_score: p.totalScore,
      eliminated: p.isEliminated,
      placement: p.isEliminated ? idx + 2 : 1, // Winner is 1st, others sorted
    }));

    const { error: participantsError } = await supabase
      .from("match_participants")
      .insert(participantsInserts);

    if (participantsError) {
      console.error("[Supabase] Error inserting match participants:", participantsError);
    }

    // 3. Automatically update player statistics in Supabase
    for (const p of match.players) {
      const isWinner = match.winnerId === p.id;
      
      // Fetch current stats to increment correctly
      const { data: currentPlayerData } = await supabase
        .from("players")
        .select("matches_played, victories")
        .eq("id", p.id)
        .single();

      if (currentPlayerData) {
        const newMatchesPlayed = (currentPlayerData.matches_played || 0) + 1;
        const newVictories = (currentPlayerData.victories || 0) + (isWinner ? 1 : 0);
        const newWinRate = newMatchesPlayed > 0 ? Math.round((newVictories / newMatchesPlayed) * 100) : 0;

        await supabase
          .from("players")
          .update({
            matches_played: newMatchesPlayed,
            victories: newVictories,
            win_rate: newWinRate,
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.id);
      }
    }

    return true;
  } catch (err) {
    console.error("[Supabase] Error inserting match:", err);
    return false;
  }
}