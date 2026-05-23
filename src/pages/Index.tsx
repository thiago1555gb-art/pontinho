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
      showSuccess("Jogador saved localmente (offline)");
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

  // Playing Card Theme Styling - Felt Table Backgrounds
  const getThemeClasses = () => {
    switch (settings.theme) {
      case "casino-green":
        return {
          bg: "bg-[#0A2F1D]", // Classic Casino Green Felt
          cardBack: "bg-[#8C1D1D]", // Classic Red Card Back
          accent: "text-[#D4AF37]", // Gold
          suit: "♠",
          suitColor: "text-zinc-900",
        };
      case "poker-red":
        return {
          bg: "bg-[#2D0A0A]", // Deep Red Felt
          cardBack: "bg-[#1B365D]", // Classic Blue Card Back
          accent: "text-[#D4AF37]",
          suit: "♥",
          suitColor: "text-red-600",
        };
      case "midnight-blue":
        return {
          bg: "bg-[#0A1D2F]", // Midnight Blue Felt
          cardBack: "bg-[#8C1D1D]",
          accent: "text-[#D4AF37]",
          suit: "♦",
          suitColor: "text-red-600",
        };
      case "obsidian":
        return {
          bg: "bg-[#1A0A2F]", // Deep Purple Felt
          cardBack: "bg-[#1B365D]",
          accent: "text-[#D4AF37]",
          suit: "♣",
          suitColor: "text-zinc-900",
        };
    }
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
    <div className={`min-h-screen ${themeStyles.bg} text-[#FFFDF9] font-serif relative overflow-x-hidden pb-28 transition-colors duration-500`}>
      {/* Confetti on Victory */}
      <Confetti active={!!(currentMatch && currentMatch.isFinished)} />

      {/* Header - Styled like a premium club scoreboard */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-[#D4AF37]/20 px-4 py-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-serif text-3xl font-bold text-[#D4AF37] select-none">♠</span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-wide text-[#FFFDF9] font-serif">The Royal Deck</h1>
                {isOnline ? (
                  <span className="flex h-1.5 w-1.5 relative" title="Sincronizado">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" title="Modo Local"></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-black/30 border border-[#D4AF37]/20 text-zinc-300 hover:text-white transition-all active:scale-95"
            >
              {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Reset Match */}
            {currentMatch && (
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(true); }}
                className="p-2 rounded-xl bg-black/30 border border-[#D4AF37]/20 text-zinc-300 hover:text-red-400 transition-all active:scale-95"
                title="Reiniciar Partida"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 pt-6 space-y-6 relative z-10">
        {/* Navigation Tabs - Styled like overlapping premium playing cards */}
        <div className="grid grid-cols-3 gap-2 bg-black/40 p-1.5 rounded-2xl border border-[#D4AF37]/30 shadow-2xl">
          <button
            onClick={() => { sounds.playClick(); setActiveTab("game"); }}
            className={`py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-300 font-serif ${
              activeTab === "game"
                ? "bg-[#FFFDF9] text-zinc-900 shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-2 border-[#D4AF37] scale-105 z-10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className={activeTab === "game" ? "text-zinc-900" : "text-zinc-500"}>♠</span>
            Mesa
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("players"); }}
            className={`py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-300 font-serif ${
              activeTab === "players"
                ? "bg-[#FFFDF9] text-zinc-900 shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-2 border-[#D4AF37] scale-105 z-10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className={activeTab === "players" ? "text-red-600" : "text-zinc-500"}>♥</span>
            Membros
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("stats"); }}
            className={`py-3 rounded-xl text-sm font-bold tracking-wide flex items-center justify-center gap-1.5 transition-all duration-300 font-serif ${
              activeTab === "stats"
                ? "bg-[#FFFDF9] text-zinc-900 shadow-[0_4px_15px_rgba(0,0,0,0.4)] border-2 border-[#D4AF37] scale-105 z-10"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            <span className={activeTab === "stats" ? "text-red-600" : "text-zinc-500"}>♦</span>
            Placar
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="animate-spin text-zinc-400" size={28} />
            <p className="text-zinc-500 text-xs tracking-wide uppercase font-sans">Sincronizando dados...</p>
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
            <div className="w-24 h-32 mx-auto rounded-2xl bg-[#FFFDF9] border-2 border-[#D4AF37] flex flex-col items-center justify-between p-3 shadow-xl text-zinc-900 relative rotate-[-6deg]">
              <div className="self-start font-bold text-lg leading-none">♠</div>
              <Sparkles size={28} className="text-[#D4AF37]" />
              <div className="self-end font-bold text-lg leading-none rotate-180">♠</div>
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-bold text-white tracking-wide">Nenhuma mesa activa</h2>
              <p className="text-zinc-300 text-sm max-w-xs mx-auto leading-relaxed font-sans">
                Abra um novo baralho e comece a registrar as rodadas com a elegância de um clube de cartas tradicional.
              </p>
            </div>
            <button
              onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
              className="px-8 py-4 bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-zinc-950 font-serif font-extrabold tracking-wider uppercase rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] flex items-center justify-center gap-2.5 mx-auto transition-all duration-300 transform hover:scale-105 active:scale-95 text-sm border border-[#D4AF37]"
            >
              <Play size={15} fill="currentColor" className="text-zinc-950" />
              Distribuir Cartas
            </button>
          </div>
        ) : (
          /* Active Match View */
          <div className="space-y-5">
            {/* Match Info Bar */}
            <div className="flex items-center justify-between bg-black/30 border border-[#D4AF37]/20 rounded-2xl p-4 font-sans">
              <div className="flex items-center gap-2.5">
                <Clock size={15} className="text-zinc-400" />
                <span className="text-sm font-mono font-medium text-zinc-300">{formatTime(timer)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Limite de Pontos</span>
                <span className="text-sm font-bold text-[#D4AF37]">{currentMatch.limitScore} pts</span>
              </div>
            </div>

            {/* Active Players Section */}
            <div className="space-y-3">
              <div className="flex justify-between items-center px-1 font-sans">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                  Jogadores Ativos ({activePlayersList.length})
                </h3>
                <span className="text-[10px] text-zinc-400 font-medium">Ordenado por menor pontuação</span>
              </div>
              
              <div className="space-y-4">
                {activePlayersList.map((player, idx) => {
                  const isLeader = leader && leader.id === player.id;
                  const progress = Math.min(100, (player.totalScore / currentMatch.limitScore) * 100);

                  return (
                    <div
                      key={player.id}
                      className={`relative overflow-hidden bg-[#FFFDF9] border-2 rounded-2xl p-5 shadow-xl text-zinc-900 transition-all duration-300 ${
                        isLeader
                          ? "border-[#D4AF37] ring-2 ring-[#D4AF37]/20"
                          : "border-zinc-300"
                      }`}
                    >
                      {/* Playing Card Corner Indices */}
                      <div className="absolute top-3 left-3 flex flex-col items-center font-serif leading-none select-none">
                        <span className="text-sm font-bold">{player.totalScore}</span>
                        <span className={`text-xs ${themeStyles.suitColor}`}>{themeStyles.suit}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex flex-col items-center font-serif leading-none rotate-180 select-none">
                        <span className="text-sm font-bold">{player.totalScore}</span>
                        <span className={`text-xs ${themeStyles.suitColor}`}>{themeStyles.suit}</span>
                      </div>

                      {/* Progress Bar Background - subtle and integrated */}
                      <div
                        className="absolute bottom-0 left-0 h-1.5 bg-red-600/20 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />

                      <div className="flex items-center justify-between relative z-10 gap-4 px-6">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          {/* Premium Avatar Container */}
                          <div className="relative flex-shrink-0">
                            {isLeader && (
                              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                                <Crown size={18} className="text-[#D4AF37] fill-[#D4AF37]" />
                              </div>
                            )}
                            
                            {/* Clean Border Ring */}
                            <div
                              className="rounded-full p-0.5 bg-white border-2 border-zinc-300"
                              style={{ borderColor: player.color }}
                            >
                              <div
                                className="rounded-full overflow-hidden flex items-center justify-center font-bold relative w-14 h-14 text-2xl bg-zinc-100"
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
                            <span className="absolute -bottom-1 -right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-zinc-900 text-white border border-white shadow-sm font-sans">
                              #{idx + 1}
                            </span>
                          </div>

                          {/* Player Info */}
                          <div className="min-w-0 flex-1 font-sans">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-base text-zinc-900 tracking-tight truncate">
                                {player.name}
                              </h3>
                              {player.reentries > 0 && (
                                <span className="text-[9px] font-semibold bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded-full border border-zinc-200">
                                  {player.reentries} Reentr.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 font-medium">
                              {isLeader ? "👑 Líder da Mesa" : `Atrás do líder por ${player.totalScore - leader!.totalScore} pts`}
                            </p>
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="text-right flex-shrink-0 bg-zinc-100 border border-zinc-200 rounded-xl px-4 py-2.5 min-w-[75px] font-sans">
                          <span className="text-2xl font-mono font-bold tracking-tight block leading-none text-zinc-900">
                            {player.totalScore}
                          </span>
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block mt-1">pontos</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eliminated Players Section */}
            {eliminatedPlayersList.length > 0 && (
              <div className="space-y-3 pt-2 font-sans">
                <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1 flex items-center gap-2">
                  <Skull size={13} />
                  Jogadores Eliminados ({eliminatedPlayersList.length})
                </h3>
                <div className="space-y-3">
                  {eliminatedPlayersList.map((player) => {
                    return (
                      <div
                        key={player.id}
                        className="relative overflow-hidden bg-black/20 border border-white/5 rounded-2xl p-4 opacity-60"
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3.5">
                            {/* Avatar */}
                            <div
                              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-black/40 border border-white/5 relative"
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
                              <span className="absolute -bottom-1 -right-1 bg-zinc-800 text-zinc-400 p-0.5 rounded-full border border-white/5">
                                <Skull size={10} />
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-sm text-zinc-400 line-through">{player.name}</h3>
                                <span className="text-[9px] font-semibold bg-black/40 text-zinc-500 border border-white/5 px-2 py-0.5 rounded-full">
                                  ELIMINADO
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500 mt-0.5">
                                Estourou com {player.totalScore} pts
                              </p>
                            </div>
                          </div>

                          {/* Reentry Button or Score */}
                          <div className="flex items-center gap-3">
                            {settings.allowReentry && !currentMatch.isFinished && (
                              <button
                                onClick={() => handleReentry(player.id)}
                                className="flex items-center gap-1.5 px-3.5 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-semibold transition-all active:scale-95"
                              >
                                <RefreshCw size={12} />
                                Reentrar
                              </button>
                            )}
                            <div className="text-right min-w-[45px]">
                              <span className="text-lg font-mono font-bold text-zinc-500">
                                {player.totalScore}
                              </span>
                              <span className="text-[9px] text-zinc-600 block">pontos</span>
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
                  className="w-full py-4 bg-[#FFFDF9] text-zinc-900 hover:bg-zinc-100 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm border-2 border-[#D4AF37] font-sans"
                >
                  <Plus size={18} />
                  Adicionar Rodada
                </button>
              </div>
            )}

            {/* Victory Screen Overlay */}
            {currentMatch.isFinished && (
              <div className="bg-[#FFFDF9] border-2 border-[#D4AF37] rounded-3xl p-6 text-center space-y-5 shadow-xl text-zinc-900">
                <div className="w-16 h-16 mx-auto rounded-full overflow-hidden border-2 border-[#D4AF37] shadow-sm relative">
                  {currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.avatarUrl ? (
                    <img
                      src={currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.avatarUrl}
                      alt="Winner"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl bg-zinc-100 text-zinc-800">
                      <Trophy size={28} />
                    </div>
                  )}
                </div>
                <div className="space-y-2 font-sans">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Vencedor da Partida</span>
                  <h2 className="text-2xl font-bold text-zinc-900 tracking-tight">
                    {currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.name || "Ninguém"}
                  </h2>
                  <p className="text-zinc-500 text-xs">Partida finalizada em {formatTime(timer)}</p>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
                  className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-xl transition-all transform active:scale-95 text-sm font-sans"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
          <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-6 max-w-xs w-full text-center space-y-5">
            <div className="w-12 h-12 mx-auto rounded-full bg-zinc-900 flex items-center justify-center text-zinc-400 border border-zinc-800">
              <AlertTriangle size={20} />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">Reiniciar Partida?</h3>
              <p className="text-zinc-400 text-xs leading-relaxed">
                Isso apagará o progresso da partida atual. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(false); }}
                className="py-2.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-semibold transition-colors border border-zinc-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetMatch}
                className="py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors"
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