import React, { useState } from "react";
import { Match } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { PlayerAvatar } from "./PlayerAvatar";
import { ChevronDown, ChevronUp, RotateCcw, History } from "lucide-react";

interface MatchHistoryProps {
  match: Match;
  onUndo: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({ match, onUndo }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const hasRounds = match.rounds.length > 0;

  return (
    <div className="bg-[#FFFDF9] border-2 border-zinc-300 rounded-2xl overflow-hidden text-zinc-900 shadow-md font-sans">
      {/* Header */}
      <button
        onClick={() => { sounds.playClick(); setIsExpanded(!isExpanded); }}
        className="w-full p-4 flex items-center justify-between hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <History className="text-zinc-500" size={16} />
          <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider">
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
              className="px-2.5 py-1.5 bg-white hover:bg-zinc-100 text-zinc-800 rounded-xl flex items-center gap-1.5 text-xs font-semibold transition-colors border border-zinc-300"
              title="Desfazer última rodada"
            >
              <RotateCcw size={12} />
              Desfazer
            </button>
          )}
          {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
        </div>
      </button>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t border-zinc-200 p-4 space-y-3 max-h-60 overflow-y-auto bg-zinc-50">
          {!hasRounds ? (
            <p className="text-zinc-500 text-xs text-center py-4">Nenhuma rodada jogada ainda.</p>
          ) : (
            [...match.rounds].reverse().map((round, idx) => {
              const roundNum = match.rounds.length - idx;
              return (
                <div
                  key={round.id}
                  className="bg-white p-3.5 rounded-xl border border-zinc-200 space-y-2.5 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-zinc-800">Rodada #{roundNum}</span>
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {new Date(round.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {match.players.map((player) => {
                      const score = round.scores[player.id];
                      if (score === undefined) return null;

                      return (
                        <div key={player.id} className="flex items-center justify-between text-xs">
                          <span className="text-zinc-600 flex items-center gap-2">
                            <PlayerAvatar
                              avatarUrl={player.avatarUrl}
                              emoji={player.avatar}
                              color={player.color}
                              name={player.name}
                              size="xs"
                            />
                            <span className="truncate max-w-[80px] font-medium">{player.name}</span>
                          </span>
                          <span className={`font-mono font-bold ${score > 0 ? "text-red-600" : score < 0 ? "text-emerald-600" : "text-zinc-500"}`}>
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