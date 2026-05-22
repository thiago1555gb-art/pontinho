import React from "react";
import { Match, PlayerStats } from "../types/pontinho";
import { Trophy, Award, TrendingUp, Users, Calendar } from "lucide-react";

interface StatsViewProps {
  matches: Match[];
}

export const StatsView: React.FC<StatsViewProps> = ({ matches }) => {
  // Calculate stats
  const statsMap: { [name: string]: { wins: number; games: number; reentries: number; totalScore: number; roundsCount: number } } = {};

  matches.forEach((m) => {
    m.players.forEach((p) => {
      if (!statsMap[p.name]) {
        statsMap[p.name] = { wins: 0, games: 0, reentries: 0, totalScore: 0, roundsCount: 0 };
      }
      statsMap[p.name].games += 1;
      statsMap[p.name].reentries += p.reentries;
      statsMap[p.name].totalScore += p.totalScore;
      statsMap[p.name].roundsCount += p.scores.length;

      if (m.isFinished && m.winnerId === p.id) {
        statsMap[p.name].wins += 1;
      }
    });
  });

  const playerStats: PlayerStats[] = Object.entries(statsMap).map(([name, data]) => ({
    name,
    gamesPlayed: data.games,
    wins: data.wins,
    totalReentries: data.reentries,
    averageScore: data.roundsCount > 0 ? Math.round(data.totalScore / data.roundsCount) : 0,
  })).sort((a, b) => b.wins - a.wins || a.averageScore - b.averageScore);

  const finishedMatches = matches.filter((m) => m.isFinished);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400">
            <Trophy size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Partidas Concluídas</p>
            <h4 className="text-xl font-bold text-white">{finishedMatches.length}</h4>
          </div>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-4 flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400">Jogadores Ativos</p>
            <h4 className="text-xl font-bold text-white">{playerStats.length}</h4>
          </div>
        </div>
      </div>

      {/* Leaderboard / Best Players */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Award className="text-amber-400" size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Ranking Geral</h3>
        </div>

        {playerStats.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Nenhuma estatística disponível ainda.</p>
        ) : (
          <div className="space-y-3">
            {playerStats.map((stat, idx) => (
              <div
                key={stat.name}
                className="flex items-center justify-between bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/30"
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? "bg-amber-500 text-black" :
                    idx === 1 ? "bg-zinc-300 text-black" :
                    idx === 2 ? "bg-amber-700 text-white" : "bg-zinc-800 text-zinc-400"
                  }`}>
                    {idx + 1}
                  </span>
                  <div>
                    <h4 className="text-white font-bold text-sm">{stat.name}</h4>
                    <p className="text-xs text-zinc-400">
                      {stat.gamesPlayed} {stat.gamesPlayed === 1 ? "partida" : "partidas"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm font-bold text-emerald-400">{stat.wins} Vitórias</p>
                  <p className="text-[10px] text-zinc-500">Média: {stat.averageScore} pts/rodada</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match History List */}
      <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="text-zinc-400" size={18} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Partidas</h3>
        </div>

        {finishedMatches.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Nenhuma partida finalizada ainda.</p>
        ) : (
          <div className="space-y-3">
            {finishedMatches.slice(0, 5).map((match) => {
              const winner = match.players.find((p) => p.id === match.winnerId);
              return (
                <div
                  key={match.id}
                  className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/30 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-white font-bold text-sm">{match.name}</h4>
                    <p className="text-xs text-zinc-400">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-zinc-400 block">Vencedor</span>
                    <span className="text-sm font-bold text-amber-400">{winner?.name || "N/A"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};