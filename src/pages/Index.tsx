import React, { useState, useEffect, useRef } from "react";
import { Player, Match, GameSettings, RegisteredPlayer } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { Confetti } from "../components/Confetti";
import { BackgroundParticles } from "../components/BackgroundParticles";
import { NewMatchModal } from "../components/NewMatchModal";
import { AddScoreModal } from "../components/AddScoreModal";
import { StatsView } from "../components/StatsView";
import { MatchHistory } from "../components/MatchHistory";
import { PlayersManager } from "../components/PlayersManager";
import { MadeWithDyad } from "@/components/made-with-dyad";
import { showSuccess, showError } from "../utils/toast";
import {
  fetchRegisteredPlayers,
  insertRegisteredPlayer,
  updateRegisteredPlayer,
  deleteRegisteredPlayer,
  fetchMatches,
  insertMatch,
  checkSupabaseConnection,
  isPlayerNameDuplicate,
  generateUUID
} from "../utils/supabaseService";
import {
  Trophy,
  Crown,
  Volume2,
  VolumeX,
  RotateCcw,
  Plus,
  Play,
  Award,
  Clock,
  UserPlus,
  Settings,
  Sparkles,
  ChevronRight,
  BarChart3,
  Gamepad2,
  AlertTriangle,
  Skull,
  RefreshCw,
  Users,
  Cloud,
  CloudOff,
  Loader2
} from "lucide-react";

export default function Index() {
  // State
  const [matches, setMatches] = useState<Match[]>([]);
  const [registeredPlayers, setRegisteredPlayers] = useState<RegisteredPlayer[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [settings, setSettings] = useState<GameSettings>({
    limitScore: 100,
    soundEnabled: true,
    theme: "casino-green",
    allowReentry: true,
  });

  // Supabase Sync Status
  const [isOnline, setIsOnline] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals & Navigation
  const [isNewMatchOpen, setIsNewMatchOpen] = useState<boolean>(false);
  const [isAddScoreOpen, setIsAddScoreOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"game" | "players" | "stats">("game");
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Timer
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from Supabase & LocalStorage
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Check connection
      const connected = await checkSupabaseConnection();
      setIsOnline(connected);

      // Fetch players
      const players = await fetchRegisteredPlayers();
      setRegisteredPlayers(players);
      localStorage.setItem("pontinho_registered_players", JSON.stringify(players));

      // Fetch matches
      const history = await fetchMatches();
      setMatches(history);
      localStorage.setItem("pontinho_matches", JSON.stringify(history));

      // Load current active match from localStorage
      const savedCurrentMatch = localStorage.getItem("pontinho_current_match");
      if (savedCurrentMatch) {
        const parsedCurrent = JSON.parse(savedCurrentMatch);
        setCurrentMatch(parsedCurrent);
        if (!parsedCurrent.isFinished) {
          setTimer(parsedCurrent.duration || 0);
        }
      }

      // Load settings
      const savedSettings = localStorage.getItem("pontinho_settings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        sounds.setEnabled(parsedSettings.soundEnabled);
      }

      setIsLoading(false);
    }

    loadData();
  }, []);

  // Player Database Actions
  const handleAddPlayer = async (name: string, color: string, avatar: string, avatarUrl?: string) => {
    const isDuplicate = await isPlayerNameDuplicate(name);
    if (isDuplicate) {
      showError("Já existe um jogador cadastrado com este nome!");
      sounds.playElimination();
      return;
    }

    const newPlayer: RegisteredPlayer = {
      id: generateUUID(),
      name,
      color,
      avatar,
      avatarUrl,
      createdAt: Date.now(),
      gamesPlayed: 0,
      wins: 0,
      winRate: 0,
    };

    const updated = [...registeredPlayers, newPlayer];
    setRegisteredPlayers(updated);
    localStorage.setItem("pontinho_registered_players", JSON.stringify(updated));

    const success = await insertRegisteredPlayer(newPlayer);
    if (success) {
      setIsOnline(true);
      showSuccess("Jogador cadastrado com sucesso!");
    } else {
      showSuccess("Jogador salvo localmente (offline)");
    }
  };

  const handleEditPlayer = async (id: string, name: string, color: string, avatar: string, avatarUrl?: string) => {
    const isDuplicate = await isPlayerNameDuplicate(name, id);
    if (isDuplicate) {
      showError("Já existe outro jogador com este nome!");
      sounds.playElimination();
      return;
    }

    const existing = registeredPlayers.find((p) => p.id === id);
    const updatedPlayer = {
      id,
      name,
      color,
      avatar,
      avatarUrl,
      createdAt: existing?.createdAt || Date.now(),
      gamesPlayed: existing?.gamesPlayed || 0,
      wins: existing?.wins || 0,
      winRate: existing?.winRate || 0,
    };
    const updated = registeredPlayers.map((p) => (p.id === id ? updatedPlayer : p));
    
    setRegisteredPlayers(updated);
    localStorage.setItem("pontinho_registered_players", JSON.stringify(updated));

    const success = await updateRegisteredPlayer(updatedPlayer);
    if (success) {
      setIsOnline(true);
      showSuccess("Jogador atualizado com sucesso!");
    } else {
      showSuccess("Alterações salvas localmente");
    }
  };

  const handleDeletePlayer = async (id: string) => {
    const updated = registeredPlayers.filter((p) => p.id !== id);
    setRegisteredPlayers(updated);
    localStorage.setItem("pontinho_registered_players", JSON.stringify(updated));

    const success = await deleteRegisteredPlayer(id);
    if (success) {
      setIsOnline(true);
      showSuccess("Jogador removido com sucesso!");
    } else {
      showSuccess("Jogador removido localmente");
    }
  };

  // Timer Effect
  useEffect(() => {
    if (currentMatch && !currentMatch.isFinished && activeTab === "game") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1;
          if (next % 5 === 0 && currentMatch) {
            const updated = { ...currentMatch, duration: next };
            setCurrentMatch(updated);
            localStorage.setItem("pontinho_current_match", JSON.stringify(updated));
          }
          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentMatch, activeTab]);

  // Format Timer
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Sound Toggle
  const toggleSound = () => {
    const next = !settings.soundEnabled;
    sounds.setEnabled(next);
    const updatedSettings = { ...settings, soundEnabled: next };
    setSettings(updatedSettings);
    localStorage.setItem("pontinho_settings", JSON.stringify(updatedSettings));
    sounds.playClick();
  };

  // Start Match
  const handleStartMatch = (
    playersData: Omit<Player, "scores" | "totalScore" | "isEliminated" | "reentries">[],
    matchSettings: GameSettings
  ) => {
    const newPlayers: Player[] = playersData.map((p) => ({
      ...p,
      scores: [],
      totalScore: 0,
      isEliminated: false,
      reentries: 0,
    }));

    const newMatch: Match = {
      id: generateUUID(),
      name: `Mesa ${matches.length + 1}`,
      date: new Date().toLocaleDateString("pt-BR"),
      players: newPlayers,
      rounds: [],
      limitScore: matchSettings.limitScore,
      isFinished: false,
      duration: 0,
    };

    setTimer(0);
    setSettings(matchSettings);
    localStorage.setItem("pontinho_settings", JSON.stringify(matchSettings));
    setCurrentMatch(newMatch);
    localStorage.setItem("pontinho_current_match", JSON.stringify(newMatch));
    setIsNewMatchOpen(false);
    showSuccess("Partida iniciada!");
  };

  // Add Round Score
  const handleSaveRound = async (roundScores: { [playerId: string]: number }) => {
    if (!currentMatch) return;

    const updatedPlayers = currentMatch.players.map((player) => {
      if (player.isEliminated) return player;

      const addedPoints = roundScores[player.id] || 0;
      const newScores = [...player.scores, addedPoints];
      const newTotal = player.totalScore + addedPoints;

      const isEliminated = newTotal >= currentMatch.limitScore;

      if (isEliminated) {
        sounds.playElimination();
      }

      return {
        ...player,
        scores: newScores,
        totalScore: newTotal,
        isEliminated,
      };
    });

    const activePlayers = updatedPlayers.filter((p) => !p.isEliminated);
    const isFinished = activePlayers.length <= 1;
    const winnerId = isFinished && activePlayers.length === 1 ? activePlayers[0].id : undefined;

    const newRound = {
      id: currentMatch.rounds.length + 1,
      scores: roundScores,
      timestamp: Date.now(),
    };

    const updatedMatch: Match = {
      ...currentMatch,
      players: updatedPlayers,
      rounds: [...currentMatch.rounds, newRound],
      isFinished,
      winnerId,
      duration: timer,
    };

    setCurrentMatch(updatedMatch);
    if (updatedMatch) {
      localStorage.setItem("pontinho_current_match", JSON.stringify(updatedMatch));
    }

    if (isFinished) {
      sounds.playSuccess();
      const updatedMatches = [updatedMatch, ...matches];
      setMatches(updatedMatches);
      localStorage.setItem("pontinho_matches", JSON.stringify(updatedMatches));

      const success = await insertMatch(updatedMatch);
      if (success) {
        setIsOnline(true);
        showSuccess("Partida finalizada e salva na nuvem!");
        
        const players = await fetchRegisteredPlayers();
        setRegisteredPlayers(players);
        localStorage.setItem("pontinho_registered_players", JSON.stringify(players));
      } else {
        showSuccess("Partida finalizada e salva localmente");
      }
    }

    setIsAddScoreOpen(false);
  };

  // Manual Reentry (Buy-back)
  const handleReentry = (playerId: string) => {
    if (!currentMatch) return;
    sounds.playCrown();

    const activeScores = currentMatch.players
      .filter((p) => !p.isEliminated)
      .map((p) => p.totalScore);

    const highestActiveScore = activeScores.length > 0 ? Math.max(...activeScores) : currentMatch.limitScore;

    const updatedPlayers = currentMatch.players.map((player) => {
      if (player.id === playerId) {
        const addedPoints = highestActiveScore - player.totalScore;
        return {
          ...player,
          scores: [...player.scores, addedPoints],
          totalScore: highestActiveScore,
          isEliminated: false,
          reentries: player.reentries + 1,
        };
      }
      return player;
    });

    const updatedMatch: Match = {
      ...currentMatch,
      players: updatedPlayers,
      isFinished: false,
      winnerId: undefined,
    };

    setCurrentMatch(updatedMatch);
    localStorage.setItem("pontinho_current_match", JSON.stringify(updatedMatch));
    showSuccess("Jogador reentrou na partida!");
  };

  // Undo Last Round
  const handleUndo = () => {
    if (!currentMatch || currentMatch.rounds.length === 0) return;

    const updatedRounds = currentMatch.rounds.slice(0, -1);
    const updatedPlayers = currentMatch.players.map((player) => {
      const newScores = player.scores.slice(0, -1);
      const newTotal = newScores.reduce((sum, val) => sum + val, 0);
      return {
        ...player,
        scores: newScores,
        totalScore: newTotal,
        isEliminated: newTotal >= currentMatch.limitScore,
      };
    });

    const updatedMatch: Match = {
      ...currentMatch,
      players: updatedPlayers,
      rounds: updatedRounds,
      isFinished: false,
      winnerId: undefined,
    };

    setCurrentMatch(updatedMatch);
    localStorage.setItem("pontinho_current_match", JSON.stringify(updatedMatch));
    showSuccess("Última rodada desfeita!");
  };

  // Reset Match
  const handleResetMatch = () => {
    sounds.playClick();
    setCurrentMatch(null);
    localStorage.removeItem("pontinho_current_match");
    setTimer(0);
    setShowResetConfirm(false);
    showSuccess("Partida cancelada.");
  };

  // Get Leader (Player with lowest score)
  const getLeader = () => {
    if (!currentMatch) return null;
    const activePlayers = currentMatch.players.filter((p) => !p.isEliminated);
    if (activePlayers.length === 0) return null;
    return activePlayers.reduce((min, p) => (p.totalScore < min.totalScore ? p : min), activePlayers[0]);
  };

  const leader = getLeader();

  // Bespoke Theme Styling - "The Cardroom" (Luxury Editorial Light Theme)
  const getThemeClasses = () => {
    return {
      bg: "bg-[#FAF8F5]", // Warm, textured ivory/cream
      card: "bg-[#F5F1EA] border border-[#1C1C1C]", // Tactile paper card
      border: "border-[#1C1C1C]",
      accent: "text-[#8C2D19]", // Rich Crimson
      button: "bg-[#1C1C1C] text-[#FAF8F5] hover:bg-[#2D2D2D]",
      textMuted: "text-[#5C5A55]",
    };
  };

  const themeStyles = getThemeClasses();

  // Split players into active and eliminated
  const activePlayersList = currentMatch
    ? currentMatch.players
        .filter((p) => !p.isEliminated)
        .sort((a, b) => a.totalScore - b.totalScore)
    : [];

  const eliminatedPlayersList = currentMatch
    ? currentMatch.players
        .filter((p) => p.isEliminated)
        .sort((a, b) => a.totalScore - b.totalScore)
    : [];

  return (
    <div className={`min-h-screen ${themeStyles.bg} text-[#1C1C1C] font-sans relative overflow-x-hidden pb-28 transition-colors duration-500`}>
      {/* Confetti on Victory */}
      <Confetti active={!!(currentMatch && currentMatch.isFinished)} />

      {/* Header - Styled like a premium club scoreboard */}
      <header className="sticky top-0 z-40 bg-[#FAF8F5]/90 backdrop-blur-md border-b border-[#1C1C1C]/10 px-4 py-5">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1C1C1C] flex items-center justify-center shadow-sm">
              <span className="font-serif text-base font-bold text-[#FAF8F5]">♠</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-serif font-bold tracking-tight text-[#1C1C1C]">The Cardroom</h1>
                {isOnline ? (
                  <span className="flex h-1.5 w-1.5 relative" title="Sincronizado">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8C2D19] opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#8C2D19]"></span>
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" title="Modo Local"></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg border border-[#1C1C1C]/10 text-[#1C1C1C]/60 hover:text-[#1C1C1C] transition-all active:scale-95"
            >
              {settings.soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Reset Match */}
            {currentMatch && (
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(true); }}
                className="p-2 rounded-lg border border-[#1C1C1C]/10 text-[#1C1C1C]/60 hover:text-[#8C2D19] transition-all active:scale-95"
                title="Reiniciar Partida"
              >
                <RotateCcw size={15} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Navigation Tabs - Custom leather/felt toggle style */}
        <div className="grid grid-cols-3 gap-1 bg-[#F5F1EA] p-1 rounded-xl border border-[#1C1C1C]/10">
          <button
            onClick={() => { sounds.playClick(); setActiveTab("game"); }}
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
              activeTab === "game"
                ? "bg-[#1C1C1C] text-[#FAF8F5] shadow-sm"
                : "text-[#5C5A55] hover:text-[#1C1C1C]"
            }`}
          >
            <Gamepad2 size={13} />
            Mesa
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("players"); }}
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
              activeTab === "players"
                ? "bg-[#1C1C1C] text-[#FAF8F5] shadow-sm"
                : "text-[#5C5A55] hover:text-[#1C1C1C]"
            }`}
          >
            <Users size={13} />
            Membros
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("stats"); }}
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all ${
              activeTab === "stats"
                ? "bg-[#1C1C1C] text-[#FAF8F5] shadow-sm"
                : "text-[#5C5A55] hover:text-[#1C1C1C]"
            }`}
          >
            <BarChart3 size={13} />
            Placar
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-[#1C1C1C]" size={24} />
            <p className="text-[#5C5A55] text-xs tracking-wide uppercase">Sincronizando dados...</p>
          </div>
        ) : activeTab === "stats" ? (
          <StatsView matches={matches} registeredPlayers={registeredPlayers} />
        ) : activeTab === "players" ? (
          <PlayersManager
            registeredPlayers={registeredPlayers}
            onAddPlayer={handleAddPlayer}
            onEditPlayer={handleEditPlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        ) : !currentMatch ? (
          /* Empty State / Start Match */
          <div className="text-center py-16 space-y-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#F5F1EA] border border-[#1C1C1C]/10 flex items-center justify-center shadow-sm">
              <Sparkles size={24} className="text-[#5C5A55]" />
            </div>
            <div className="space-y-3">
              <h2 className="text-xl font-serif font-bold text-[#1C1C1C] tracking-tight">Nenhuma mesa ativa</h2>
              <p className="text-[#5C5A55] text-sm max-w-xs mx-auto leading-relaxed">
                Abra uma nova mesa de Pontinho para começar a registrar as rodadas com a elegância de um clube privado tradicional.
              </p>
            </div>
            <button
              onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
              className={`px-8 py-3.5 ${themeStyles.button} font-bold rounded-xl shadow-sm flex items-center justify-center gap-2.5 mx-auto transition-all transform active:scale-95 text-sm`}
            >
              <Play size={14} fill="currentColor" />
              Abrir Mesa
            </button>
          </div>
        ) : (
          /* Active Match View */
          <div className="space-y-5">
            {/* Match Info Bar - Styled like a luxury watch face / dashboard */}
            <div className="flex items-center justify-between bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-xl p-4">
              <div className="flex items-center gap-2.5">
                <Clock size={14} className="text-[#5C5A55]" />
                <span className="text-sm font-mono font-semibold text-[#1C1C1C]">{formatTime(timer)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-[#5C5A55] uppercase tracking-wider font-bold block">Limite de Pontos</span>
                <span className={`text-sm font-bold ${themeStyles.accent}`}>{currentMatch.limitScore} pts</span>
              </div>
            </div>

            {/* Active Players Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                <h3 className="text-xs font-bold text-[#5C5A55] uppercase tracking-wider">
                  Jogadores Ativos ({activePlayersList.length})
                </h3>
                <span className="text-[10px] text-[#5C5A55] font-medium">Ordenado por menor pontuação</span>
              </div>
              
              <div className="space-y-3">
                {activePlayersList.map((player, idx) => {
                  const isLeader = leader && leader.id === player.id;
                  const progress = Math.min(100, (player.totalScore / currentMatch.limitScore) * 100);

                  return (
                    <div
                      key={player.id}
                      className={`relative overflow-hidden ${themeStyles.card} rounded-xl p-4 transition-all duration-300 ${
                        isLeader
                          ? "border-[#1C1C1C] bg-[#FAF8F5]"
                          : "border-[#1C1C1C]/10 bg-[#F5F1EA]"
                      }`}
                    >
                      {/* Progress Bar Background - subtle and integrated */}
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-[#1C1C1C]/10 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />

                      <div className="flex items-center justify-between relative z-10 gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Premium Avatar Container */}
                          <div className="relative flex-shrink-0">
                            {isLeader && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                                <Crown size={14} className="text-[#8C2D19] fill-[#8C2D19]" />
                              </div>
                            )}
                            
                            {/* Clean Border Ring */}
                            <div
                              className="rounded-full p-0.5 bg-[#FAF8F5] border border-[#1C1C1C]/20"
                              style={{ borderColor: player.color }}
                            >
                              <div
                                className="rounded-full overflow-hidden flex items-center justify-center font-bold relative w-12 h-12 text-xl bg-[#F5F1EA]"
                              >
                                {player.avatarUrl ? (
                                  <img
                                    src={player.avatarUrl}
                                    alt={player.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  player.avatar
                                )}
                              </div>
                            </div>

                            {/* Position Badge */}
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#1C1C1C] text-[#FAF8F5] border border-[#FAF8F5] shadow-sm">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Player Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-sm text-[#1C1C1C] tracking-tight truncate">
                                {player.name}
                              </h3>
                              {player.reentries > 0 && (
                                <span className="text-[9px] font-semibold bg-[#1C1C1C]/5 text-[#5C5A55] px-2 py-0.5 rounded-full border border-[#1C1C1C]/10">
                                  {player.reentries} Reentr.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#5C5A55] mt-1 font-medium">
                              {isLeader ? "👑 Líder da Mesa" : `Atrás do líder por ${player.totalScore - leader!.totalScore} pts`}
                            </p>
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="text-right flex-shrink-0 bg-[#FAF8F5] border border-[#1C1C1C]/10 rounded-lg px-3 py-2 min-w-[65px]">
                          <span className="text-xl font-mono font-bold tracking-tight block leading-none text-[#1C1C1C]">
                            {player.totalScore}
                          </span>
                          <span className="text-[9px] font-bold text-[#5C5A55] uppercase tracking-wider block mt-1">pontos</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eliminated Players Section */}
            {eliminatedPlayersList.length > 0 && (
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-[#5C5A55] uppercase tracking-wider px-1 flex items-center gap-2">
                  <Skull size={12} />
                  Jogadores Eliminados ({eliminatedPlayersList.length})
                </h3>
                <div className="space-y-3">
                  {eliminatedPlayersList.map((player) => {
                    return (
                      <div
                        key={player.id}
                        className="relative overflow-hidden bg-[#F5F1EA]/40 border border-[#1C1C1C]/10 rounded-xl p-4 opacity-60"
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3.5">
                            {/* Avatar */}
                            <div
                              className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-lg font-bold bg-[#F5F1EA] border border-[#1C1C1C]/10 relative"
                            >
                              {player.avatarUrl ? (
                                <img
                                  src={player.avatarUrl}
                                  alt={player.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                player.avatar
                              )}
                              <span className="absolute -bottom-1 -right-1 bg-[#5C5A55] text-[#FAF8F5] p-0.5 rounded-full border border-[#FAF8F5]">
                                <Skull size={8} />
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-[#5C5A55] line-through">{player.name}</h3>
                                <span className="text-[9px] font-semibold bg-[#1C1C1C]/5 text-[#5C5A55] border border-[#1C1C1C]/10 px-2 py-0.5 rounded-full">
                                  ELIMINADO
                                </span>
                              </div>
                              <p className="text-xs text-[#5C5A55] mt-0.5">
                                Estourou com {player.totalScore} pts
                              </p>
                            </div>
                          </div>

                          {/* Reentry Button or Score */}
                          <div className="flex items-center gap-3">
                            {settings.allowReentry && !currentMatch.isFinished && (
                              <button
                                onClick={() => handleReentry(player.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#1C1C1C] border border-[#1C1C1C]/20 rounded-lg text-xs font-semibold transition-all active:scale-95"
                              >
                                <RefreshCw size={11} />
                                Reentrar
                              </button>
                            )}
                            <div className="text-right min-w-[45px]">
                              <span className="text-lg font-mono font-bold text-[#5C5A55]">
                                {player.totalScore}
                              </span>
                              <span className="text-[9px] text-[#5C5A55] block">pontos</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Match History Panel */}
            <MatchHistory match={currentMatch} onUndo={handleUndo} />

            {/* Floating Action Button to Add Score */}
            {!currentMatch.isFinished && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-xs px-4">
                <button
                  onClick={() => { sounds.playClick(); setIsAddScoreOpen(true); }}
                  className="w-full py-3.5 bg-[#1C1C1C] text-[#FAF8F5] hover:bg-[#2D2D2D] font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
                >
                  <Plus size={16} />
                  Adicionar Rodada
                </button>
              </div>
            )}

            {/* Victory Screen Overlay */}
            {currentMatch.isFinished && (
              <div className="bg-[#F5F1EA] border border-[#1C1C1C]/20 rounded-2xl p-6 text-center space-y-5 shadow-sm">
                <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border border-[#1C1C1C]/10 shadow-sm relative">
                  {currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.avatarUrl ? (
                    <img
                      src={currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.avatarUrl}
                      alt="Winner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl bg-[#FAF8F5] text-[#1C1C1C]">
                      <Trophy size={24} />
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider">Vencedor da Partida</span>
                  <h2 className="text-xl font-serif font-bold text-[#1C1C1C] tracking-tight">
                    {currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.name || "Ninguém"}
                  </h2>
                  <p className="text-[#5C5A55] text-xs">Partida finalizada em {formatTime(timer)}</p>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
                  className="w-full py-3 bg-[#1C1C1C] text-[#FAF8F5] hover:bg-[#2D2D2D] font-bold rounded-xl transition-all transform active:scale-95 text-sm"
                >
                  Jogar Novamente
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      <NewMatchModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        registeredPlayers={registeredPlayers}
        onStartMatch={handleStartMatch}
      />

      {currentMatch && (
        <AddScoreModal
          isOpen={isAddScoreOpen}
          onClose={() => setIsAddScoreOpen(false)}
          players={currentMatch.players}
          onSaveRound={handleSaveRound}
        />
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#FAF8F5] border border-[#1C1C1C]/20 rounded-2xl p-6 max-w-xs w-full text-center space-y-5">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#F5F1EA] flex items-center justify-center text-[#1C1C1C] border border-[#1C1C1C]/10">
              <AlertTriangle size={18} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-serif font-bold text-[#1C1C1C]">Reiniciar Partida?</h3>
              <p className="text-[#5C5A55] text-xs leading-relaxed">
                Isso apagará o progresso da partida atual. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(false); }}
                className="py-2 bg-[#F5F1EA] hover:bg-[#EAE5DC] text-[#1C1C1C] rounded-lg text-xs font-bold transition-colors border border-[#1C1C1C]/10"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetMatch}
                className="py-2 bg-[#8C2D19] hover:bg-[#732414] text-white rounded-lg text-xs font-bold transition-colors"
              >
                Reiniciar
              </button>
            </div>
          </div>
        </div>
      )}

      <MadeWithDyad />
    </div>
  );
}