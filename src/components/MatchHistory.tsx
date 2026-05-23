import React, { useState } from "react";
import { Match } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react";

interface MatchHistoryProps {
  match: Match;
  onUndo: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ match, onUndo }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const hasRounds = match.rounds.length > 0;

  return (
    <div className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
        className="w-full p-4 flex items-center justify-between hover:bg-[#FAF8F5]/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <History className="text-[#5C5A55]" size={16} />
          <span className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider">
            Histórico de Rodadas ({match.rounds.length})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {hasRounds && !match.isFinished && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                sounds.playClick();
                onUndo();
              }}
              className="px-2.5 py-1.5 bg-[#FAF8F5] hover:bg-[#EAE5DC] text-[#1C1C1C] rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors border border-[#1C1C1C]/10"
              title="Desfazer última rodada"
            >
              <RotateCcw size={12} />
              Desfazer
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-[#5C5A55]" /> : <ChevronDown size={16} className="text-[#5C5A55]" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-[#1C1C1C]/10 p-4 space-y-3 max-h-60 overflow-y-auto bg-[#FAF8F5]/40">
          {!hasRounds ? (
            <p className="text-[#5C5A55] text-xs text-center py-4">Nenhuma rodada jogada ainda.</p>
          ) : (
            [...match.rounds].reverse().map((round, idx) => {
              const roundNum = match.rounds.length - idx;
              return (
                <div
                  key={round.id}
                  className="bg-[#FAF8F5] p-3.5 rounded-xl border border-[#1C1C1C]/10 space-y-2.5"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#1C1C1C]">Rodada #{roundNum}</span>
                    <span className="text-[10px] text-[#5C5A55] font-medium">
                      {new Date(round.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {match.players.map((player) => {
                      const score = round.scores[player.id];
                      if (score === undefined) return null;

                      return (
                        <div key={player.id} className="flex items-center justify-between text-xs">
                          <span className="text-[#5C5A55] flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold bg-[#FAF8F5] border border-[#1C1C1C]/10 relative"
                              style={{ borderColor: player.color }}
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
                            <span className="truncate max-w-[80px] font-medium">{player.name}</span>
                          </span>
                          <span className={`font-mono font-bold ${score > 0 ? "text-[#8C2D19]" : score < 0 ? "text-emerald-700" : "text-[#5C5A55]"}`}>
                            {score > 0 ? `+${score}` : score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};