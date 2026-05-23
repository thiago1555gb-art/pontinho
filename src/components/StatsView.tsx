import React from "react";
import { Match, PlayerStats, RegisteredPlayer } from "../types/pontinho";
import { Trophy, Award, TrendingUp, Users, Calendar, Percent, RefreshCw, Star } from "lucide-react";

interface StatsViewProps {
  matches: Match[];
  registeredPlayers: RegisteredPlayer[];
}

export const StatsView: React.FC<StatsViewProps> = ({ matches, registeredPlayers }) => {
  // Calculate stats dynamically
  const statsMap: { [playerId: string]: { wins: number; games: number; reentries: number; totalScore: number; roundsCount: number; lastPlayed: number } } = {};

  // Initialize stats for all registered players
  registeredPlayers.forEach((rp) => {
    statsMap[rp.id] = { wins: 0, games: 0, reentries: 0, totalScore: 0, roundsCount: 0, lastPlayed: 0 };
  });

  matches.forEach((m) => {
    const matchTime = new Date(m.date).getTime() || Date.now();
    m.players.forEach((p) => {
      // Match by ID or Name
      const rp = registeredPlayers.find((r) => r.id === p.id || r.name.toLowerCase() === p.name.toLowerCase());
      const key = rp ? rp.id : p.id;

      if (!statsMap[key]) {
        statsMap[key] = { wins: 0, games: 0, reentries: 0, totalScore: 0, roundsCount: 0, lastPlayed: 0 };
      }

      statsMap[key].games += 1;
      statsMap[key].reentries += p.reentries;
      statsMap[key].totalScore += p.totalScore;
      statsMap[key].roundsCount += p.scores.length;
      if (matchTime > statsMap[key].lastPlayed) {
        statsMap[key].lastPlayed = matchTime;
      }

      if (m.isFinished && m.winnerId === p.id) {
        statsMap[key].wins += 1;
      }
    });
  });

  const playerStats: PlayerStats[] = registeredPlayers.map((rp) => {
    const data = statsMap[rp.id] || { wins: 0, games: 0, reentries: 0, totalScore: 0, roundsCount: 0, lastPlayed: 0 };
    const winRate = data.games > 0 ? Math.round((data.wins / data.games) * 100) : 0;
    const averageScore = data.roundsCount > 0 ? Math.round(data.totalScore / data.roundsCount) : 0;

    return {
      name: rp.name,
      avatar: rp.avatar,
      avatarUrl: rp.avatarUrl,
      color: rp.color,
      gamesPlayed: data.games,
      wins: data.wins,
      winRate,
      totalReentries: data.reentries,
      averageScore,
      lastPlayed: data.lastPlayed > 0 ? new Date(data.lastPlayed).toLocaleDateString("pt-BR") : "Nunca",
    };
  }).sort((a, b) => b.wins - a.wins || b.winRate - a.winRate || a.averageScore - b.averageScore);

  const finishedMatches = matches.filter((m) => m.isFinished);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-zinc-950/80 border border-zinc-900/60 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 border border-zinc-800">
            <Trophy size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Partidas Concluídas</p>
            <h4 className="text-lg font-bold text-white mt-0.5">{finishedMatches.length}</h4>
          </div>
        </div>

        <div className="bg-zinc-950/80 border border-zinc-900/60 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-zinc-900 rounded-xl text-zinc-400 border border-zinc-800">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Jogadores Ativos</p>
            <h4 className="text-lg font-bold text-white mt-0.5">{registeredPlayers.length}</h4>
          </div>
        </div>
      </div>

      {/* Leaderboard / Best Players */}
      <div className="bg-zinc-950/80 border border-zinc-900/60 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Award className="text-zinc-400" size={16} />
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ranking Geral</h3>
        </div>

        {playerStats.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">Nenhuma estatística disponível ainda.</p>
        ) : (
          <div className="space-y-3">
            {playerStats.map((stat, idx) => (
              <div
                key={stat.name}
                className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-white text-black" :
                      idx === 1 ? "bg-zinc-800 text-zinc-300" :
                      idx === 2 ? "bg-zinc-900 text-zinc-400" : "bg-zinc-950 text-zinc-500"
                    } border border-zinc-800`}>
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-zinc-900 border border-zinc-800 relative"
                        style={{ borderColor: stat.color }}
                      >
                        {stat.avatarUrl ? (
                          <img
                            src={stat.avatarUrl}
                            alt={stat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          stat.avatar
                        )}
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm flex items-center gap-1">
                          {stat.name}
                          {idx === 0 && <Star size={12} className="text-amber-400 fill-amber-400" />}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Último jogo: {stat.lastPlayed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-white">{stat.wins} Vitórias</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{stat.gamesPlayed} partidas</p>
                  </div>
                </div>

                {/* Win Rate Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    <span>Aproveitamento</span>
                    <span className="font-bold text-white">{stat.winRate}%</span>
                  </div>
                  <div className="w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full"
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                </div>

                {/* Extra Stats Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-900/60 text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={10} className="text-zinc-600" />
                    <span>Reentradas: <strong className="text-zinc-300">{stat.totalReentries}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Percent size={10} className="text-zinc-600" />
                    <span>Média: <strong className="text-zinc-300">{stat.averageScore} pts/rodada</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match History List */}
      <div className="bg-zinc-950/80 border border-zinc-900/60 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Calendar className="text-zinc-400" size={16} />
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Histórico de Partidas</h3>
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
                  className="bg-zinc-950/40 p-3.5 rounded-xl border border-zinc-900/60 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-white font-bold text-sm">{match.name}</h4>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold block">Vencedor</span>
                    <span className="text-sm font-bold text-white mt-0.5">{winner?.name || "N/A"}</span>
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