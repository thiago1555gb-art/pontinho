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
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
        className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <History className="text-zinc-400" size={18} />
          <span className="text-sm font-bold text-white uppercase tracking-wider">
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
              className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg flex items-center gap-1 text-xs font-bold transition-colors"
              title="Desfazer última rodada"
            >
              <RotateCcw size={12} />
              Desfazer
            </button>
          )}
          {isExpanded ? <ChevronUp size={18} className="text-zinc-400" /> : <ChevronDown size={18} className="text-zinc-400" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-zinc-800/50 p-4 space-y-3 max-h-60 overflow-y-auto bg-zinc-950/20">
          {!hasRounds ? (
            <p className="text-zinc-500 text-xs text-center py-4">Nenhuma rodada jogada ainda.</p>
          ) : (
            [...match.rounds].reverse().map((round, idx) => {
              const roundNum = match.rounds.length - idx;
              return (
                <div
                  key={round.id}
                  className="bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/30 space-y-2"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-400">Rodada #{roundNum}</span>
                    <span className="text-[10px] text-zinc-500">
                      {new Date(round.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {match.players.map((player) => {
                      const score = round.scores[player.id];
                      if (score === undefined) return null;

                      return (
                        <div key={player.id} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-400 flex items-center gap-1">
                            <span>{player.avatar}</span>
                            <span className="truncate max-w-[80px]">{player.name}</span>
                          </span>
                          <span className={`font-bold ${score > 0 ? "text-red-400" : score < 0 ? "text-emerald-400" : "text-zinc-500"}`}>
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