import React, { useState, useEffect, useRef } from "react";
import { Player, Match, GameSettings } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { Confetti } from "../components/Confetti";
import { BackgroundParticles } from "../components/BackgroundParticles";
import { NewMatchModal } from "../components/NewMatchModal";
import { AddScoreModal } from "../components/AddScoreModal";
import { StatsView } from "../components/StatsView";
import { MatchHistory } from "../components/MatchHistory";
import { MadeWithDyad } from "@/components/made-with-dyad";
import {
  Trophy,
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
  AlertTriangle
} from "lucide-react";

export default function Index() {
  // State
  const [matches, setMatches] = useState<Match[]>([]);
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [settings, setSettings] = useState<GameSettings>({
    limitScore: 100,
    soundEnabled: true,
    theme: "casino-green",
    allowReentry: true,
  });

  // Modals
  const [isNewMatchOpen, setIsNewMatchOpen] = useState<boolean>(false);
  const [isAddScoreOpen, setIsAddScoreOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"game" | "stats">("game");
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Timer
  const [timer, setTimer] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load data from LocalStorage
  useEffect(() => {
    const savedMatches = localStorage.getItem("pontinho_matches");
    const savedSettings = localStorage.getItem("pontinho_settings");
    const savedCurrentMatch = localStorage.getItem("pontinho_current_match");

    if (savedMatches) setMatches(JSON.parse(savedMatches));
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(parsedSettings);
      sounds.setEnabled(parsedSettings.soundEnabled);
    }
    if (savedCurrentMatch) {
      const parsedCurrent = JSON.parse(savedCurrentMatch);
      setCurrentMatch(parsedCurrent);
      if (!parsedCurrent.isFinished) {
        setTimer(parsedCurrent.duration || 0);
      }
    }
  }, []);

  // Save data to LocalStorage
  const saveMatches = (updatedMatches: Match[]) => {
    setMatches(updatedMatches);
    localStorage.setItem("pontinho_matches", JSON.stringify(updatedMatches));
  };

  const saveCurrentMatch = (match: Match | null) => {
    setCurrentMatch(match);
    if (match) {
      localStorage.setItem("pontinho_current_match", JSON.stringify(match));
    } else {
      localStorage.removeItem("pontinho_current_match");
    }
  };

  // Timer Effect
  useEffect(() => {
    if (currentMatch && !currentMatch.isFinished && activeTab === "game") {
      timerRef.current = setInterval(() => {
        setTimer((prev) => {
          const next = prev + 1;
          // Periodically save duration
          if (next % 5 === 0 && currentMatch) {
            saveCurrentMatch({ ...currentMatch, duration: next });
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
      id: `match-${Date.now()}`,
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
    saveCurrentMatch(newMatch);
    setIsNewMatchOpen(false);
  };

  // Add Round Score
  const handleSaveRound = (roundScores: { [playerId: string]: number }) => {
    if (!currentMatch) return;

    const updatedPlayers = currentMatch.players.map((player) => {
      if (player.isEliminated) return player;

      const addedPoints = roundScores[player.id] || 0;
      const newScores = [...player.scores, addedPoints];
      const newTotal = player.totalScore + addedPoints;

      // Check if player burst (estourou)
      let isEliminated = newTotal > currentMatch.limitScore;
      let reentries = player.reentries;

      if (isEliminated && settings.allowReentry) {
        // Find the highest score among active players who haven't burst
        const activeScores = currentMatch.players
          .filter((p) => p.id !== player.id && p.totalScore <= currentMatch.limitScore)
          .map((p) => p.totalScore);

        const highestActiveScore = activeScores.length > 0 ? Math.max(...activeScores) : currentMatch.limitScore;

        // Allow reentry with the highest active score
        isEliminated = false;
        reentries += 1;
        sounds.playCrown(); // Play a special sound for reentry
        return {
          ...player,
          scores: [...player.scores, highestActiveScore - player.totalScore],
          totalScore: highestActiveScore,
          reentries,
        };
      }

      if (isEliminated) {
        sounds.playElimination();
      }

      return {
        ...player,
        scores: newScores,
        totalScore: newTotal,
        isEliminated,
        reentries,
      };
    });

    // Check if match is finished (only 1 player remains active)
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

    saveCurrentMatch(updatedMatch);

    if (isFinished) {
      sounds.playSuccess();
      // Save to matches history
      saveMatches([updatedMatch, ...matches]);
    }

    setIsAddScoreOpen(false);
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
        isEliminated: false, // Reset elimination on undo
      };
    });

    const updatedMatch: Match = {
      ...currentMatch,
      players: updatedPlayers,
      rounds: updatedRounds,
      isFinished: false,
      winnerId: undefined,
    };

    saveCurrentMatch(updatedMatch);
  };

  // Reset Match
  const handleResetMatch = () => {
    sounds.playClick();
    saveCurrentMatch(null);
    setTimer(0);
    setShowResetConfirm(false);
  };

  // Get Leader (Player with lowest score)
  const getLeader = () => {
    if (!currentMatch) return null;
    const activePlayers = currentMatch.players.filter((p) => !p.isEliminated);
    if (activePlayers.length === 0) return null;
    return activePlayers.reduce((min, p) => (p.totalScore < min.totalScore ? p : min), activePlayers[0]);
  };

  const leader = getLeader();

  // Theme styling helper
  const getThemeClasses = () => {
    switch (settings.theme) {
      case "casino-green":
        return {
          bg: "bg-gradient-to-b from-emerald-950 via-zinc-950 to-black",
          accent: "text-emerald-400",
          border: "border-emerald-500/20",
          button: "bg-emerald-500 hover:bg-emerald-400 text-black",
          glow: "shadow-emerald-500/10",
        };
      case "poker-red":
        return {
          bg: "bg-gradient-to-b from-red-950 via-zinc-950 to-black",
          accent: "text-red-400",
          border: "border-red-500/20",
          button: "bg-red-500 hover:bg-red-400 text-white",
          glow: "shadow-red-500/10",
        };
      case "midnight-blue":
        return {
          bg: "bg-gradient-to-b from-blue-950 via-zinc-950 to-black",
          accent: "text-blue-400",
          border: "border-blue-500/20",
          button: "bg-blue-500 hover:bg-blue-400 text-white",
          glow: "shadow-blue-500/10",
        };
      case "obsidian":
        return {
          bg: "bg-gradient-to-b from-purple-950 via-zinc-950 to-black",
          accent: "text-purple-400",
          border: "border-purple-500/20",
          button: "bg-purple-500 hover:bg-purple-400 text-white",
          glow: "shadow-purple-500/10",
        };
    }
  };

  const themeStyles = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeStyles.bg} text-white font-sans relative overflow-x-hidden pb-24`}>
      {/* Background Particles */}
      <BackgroundParticles theme={settings.theme} />

      {/* Confetti on Victory */}
      <Confetti active={!!(currentMatch && currentMatch.isFinished)} />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/40 backdrop-blur-md border-b border-zinc-800/50 px-4 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Gamepad2 size={18} className="text-black" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">PONTINHO</h1>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Marcador Premium</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-400 hover:text-white transition-colors"
            >
              {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* Reset Match */}
            {currentMatch && (
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(true); }}
                className="p-2 rounded-xl bg-zinc-900/80 border border-zinc-800 text-red-400 hover:text-red-300 transition-colors"
                title="Reiniciar Partida"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-md mx-auto px-4 pt-4 space-y-4 relative z-10">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-900/60 p-1 rounded-2xl border border-zinc-800/50">
          <button
            onClick={() => { sounds.playClick(); setActiveTab("game"); }}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "game"
                ? "bg-zinc-800 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Gamepad2 size={14} />
            Partida
          </button>
          <button
            onClick={() => { sounds.playClick(); setActiveTab("stats"); }}
            className={`py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              activeTab === "stats"
                ? "bg-zinc-800 text-white shadow-md"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <BarChart3 size={14} />
            Estatísticas
          </button>
        </div>

        {activeTab === "stats" ? (
          <StatsView matches={matches} />
        ) : !currentMatch ? (
          /* Empty State / Start Match */
          <div className="text-center py-12 space-y-6">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-zinc-900/50 border border-zinc-800 flex items-center justify-center shadow-2xl">
              <Sparkles size={36} className={themeStyles.accent} />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-extrabold">Nenhuma partida ativa</h2>
              <p className="text-zinc-400 text-sm max-w-xs mx-auto">
                Comece uma nova partida de Pontinho e acompanhe os pontos em tempo real com estilo.
              </p>
            </div>
            <button
              onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
              className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 mx-auto transition-all transform active:scale-95"
            >
              <Play size={16} fill="currentColor" />
              Nova Partida
            </button>
          </div>
        ) : (
          /* Active Match View */
          <div className="space-y-4">
            {/* Match Info Bar */}
            <div className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-3">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-zinc-400" />
                <span className="text-xs font-mono text-zinc-300">{formatTime(timer)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-zinc-400 block">Limite de Pontos</span>
                <span className="text-xs font-bold text-amber-400">{currentMatch.limitScore} pts</span>
              </div>
            </div>

            {/* Leaderboard / Players List */}
            <div className="space-y-2.5">
              {currentMatch.players
                .sort((a, b) => {
                  if (a.isEliminated && !b.isEliminated) return 1;
                  if (!a.isEliminated && b.isEliminated) return -1;
                  return a.totalScore - b.totalScore;
                })
                .map((player, idx) => {
                  const isLeader = leader && leader.id === player.id && !player.isEliminated;
                  const progress = Math.min(100, (player.totalScore / currentMatch.limitScore) * 100);

                  return (
                    <div
                      key={player.id}
                      className={`relative overflow-hidden bg-zinc-900/40 border rounded-2xl p-4 transition-all ${
                        player.isEliminated
                          ? "border-zinc-900 opacity-50"
                          : isLeader
                          ? "border-amber-500/30 shadow-lg shadow-amber-500/5"
                          : "border-zinc-800/50"
                      }`}
                    >
                      {/* Progress Bar Background */}
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-500 to-red-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />

                      <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl font-bold shadow-inner relative"
                            style={{ backgroundColor: `${player.color}20`, border: `1px solid ${player.color}40` }}
                          >
                            {player.avatar}
                            {isLeader && (
                              <span className="absolute -top-2 -right-2 bg-amber-500 text-black p-0.5 rounded-full shadow-md">
                                <Trophy size={10} fill="currentColor" />
                              </span>
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="font-bold text-sm text-white">{player.name}</h3>
                              {player.reentries > 0 && (
                                <span className="text-[9px] font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded-full">
                                  {player.reentries} Reentr.
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-zinc-400">
                              {player.isEliminated ? "Eliminado" : `Posição #${idx + 1}`}
                            </p>
                          </div>
                        </div>

                        {/* Score Display */}
                        <div className="text-right">
                          <span className="text-2xl font-black tracking-tight text-white">
                            {player.totalScore}
                          </span>
                          <span className="text-[10px] text-zinc-500 block">pontos</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Match History Panel */}
            <MatchHistory match={currentMatch} onUndo={handleUndo} />

            {/* Floating Action Button to Add Score */}
            {!currentMatch.isFinished && (
              <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-xs px-4">
                <button
                  onClick={() => { sounds.playClick(); setIsAddScoreOpen(true); }}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl shadow-xl shadow-amber-900/30 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <Plus size={20} />
                  Adicionar Rodada
                </button>
              </div>
            )}

            {/* Victory Screen Overlay */}
            {currentMatch.isFinished && (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
                <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/10 flex items-center justify-center text-amber-400">
                  <Trophy size={32} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Vencedor da Partida</span>
                  <h2 className="text-2xl font-black text-white">
                    {currentMatch.players.find((p) => p.id === currentMatch.winnerId)?.name || "Ninguém"}
                  </h2>
                  <p className="text-zinc-400 text-xs">Partida finalizada em {formatTime(timer)}</p>
                </div>
                <button
                  onClick={() => { sounds.playClick(); setIsNewMatchOpen(true); }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl transition-all transform active:scale-95"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-xs w-full text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Reiniciar Partida?</h3>
              <p className="text-zinc-400 text-xs mt-1">
                Isso apagará o progresso da partida atual. Esta ação não pode ser desfeita.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => { sounds.playClick(); setShowResetConfirm(false); }}
                className="py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetMatch}
                className="py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-colors"
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