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
        <div className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-[#FAF8F5] rounded-xl text-[#1C1C1C] border border-[#1C1C1C]/10">
            <Trophy size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider">Partidas Concluídas</p>
            <h4 className="text-lg font-bold text-[#1C1C1C] mt-0.5">{finishedMatches.length}</h4>
          </div>
        </div>

        <div className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl p-4 flex items-center gap-3.5">
          <div className="p-2.5 bg-[#FAF8F5] rounded-xl text-[#1C1C1C] border border-[#1C1C1C]/10">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider">Jogadores Ativos</p>
            <h4 className="text-lg font-bold text-[#1C1C1C] mt-0.5">{registeredPlayers.length}</h4>
          </div>
        </div>
      </div>

      {/* Leaderboard / Best Players */}
      <div className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Award className="text-[#1C1C1C]" size={16} />
          <h3 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider">Ranking Geral</h3>
        </div>

        {playerStats.length === 0 ? (
          <p className="text-[#5C5A55] text-sm text-center py-6">Nenhuma estatística disponível ainda.</p>
        ) : (
          <div className="space-y-3">
            {playerStats.map((stat, idx) => (
              <div
                key={stat.name}
                className="bg-[#FAF8F5] p-4 rounded-2xl border border-[#1C1C1C]/10 space-y-3.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      idx === 0 ? "bg-[#1C1C1C] text-[#FAF8F5]" :
                      idx === 1 ? "bg-[#F5F1EA] text-[#1C1C1C]" :
                      idx === 2 ? "bg-[#FAF8F5] text-[#5C5A55]" : "bg-[#FAF8F5] text-[#5C5A55]"
                    } border border-[#1C1C1C]/10`}>
                      {idx + 1}
                    </span>
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-[#FAF8F5] border border-[#1C1C1C]/10 relative"
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
                        <h4 className="text-[#1C1C1C] font-bold text-sm flex items-center gap-1">
                          {stat.name}
                          {idx === 0 && <Star size={12} className="text-[#8C2D19] fill-[#8C2D19]" />}
                        </h4>
                        <p className="text-[10px] text-[#5C5A55] mt-0.5">Último jogo: {stat.lastPlayed}</p>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-[#1C1C1C]">{stat.wins} Vitórias</p>
                    <p className="text-[10px] text-[#5C5A55] mt-0.5">{stat.gamesPlayed} partidas</p>
                  </div>
                </div>

                {/* Win Rate Progress Bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[10px] text-[#5C5A55] font-semibold uppercase tracking-wider">
                    <span>Aproveitamento</span>
                    <span className="font-bold text-[#1C1C1C]">{stat.winRate}%</span>
                  </div>
                  <div className="w-full h-1 bg-[#F5F1EA] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1C1C1C] rounded-full"
                      style={{ width: `${stat.winRate}%` }}
                    />
                  </div>
                </div>

                {/* Extra Stats Grid */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1C1C1C]/10 text-[10px] text-[#5C5A55] font-semibold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw size={10} className="text-[#5C5A55]" />
                    <span>Reentradas: <strong className="text-[#1C1C1C]">{stat.totalReentries}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 justify-end">
                    <Percent size={10} className="text-[#5C5A55]" />
                    <span>Média: <strong className="text-[#1C1C1C]">{stat.averageScore} pts/rodada</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Match History List */}
      <div className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <Calendar className="text-[#1C1C1C]" size={16} />
          <h3 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider">Histórico de Partidas</h3>
        </div>

        {finishedMatches.length === 0 ? (
          <p className="text-[#5C5A55] text-sm text-center py-6">Nenhuma partida finalizada ainda.</p>
        ) : (
          <div className="space-y-3">
            {finishedMatches.slice(0, 5).map((match) => {
              const winner = match.players.find((p) => p.id === match.winnerId);
              return (
                <div
                  key={match.id}
                  className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#1C1C1C]/10 flex justify-between items-center"
                >
                  <div>
                    <h4 className="text-[#1C1C1C] font-bold text-sm">{match.name}</h4>
                    <p className="text-[10px] text-[#5C5A55] mt-0.5">{match.date}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-[#5C5A55] uppercase tracking-wider font-semibold block">Vencedor</span>
                    <span className="text-sm font-bold text-[#1C1C1C] mt-0.5">{winner?.name || "N/A"}</span>
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