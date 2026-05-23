import React, { useState, useEffect } from "react";
import { Player } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { X, Check, Plus, Minus } from "lucide-react";

interface AddScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onSaveRound: (scores: { [playerId: string]: number }) => void;
}

export const AddScoreModal: React.FC<AddScoreModalProps> = ({ isOpen, onClose, players, onSaveRound }) => {
  const [roundScores, setRoundScores] = useState<{ [playerId: string]: number }>({});

  useEffect(() => {
    if (isOpen) {
      // Initialize scores to 0 for active players
      const initial: { [playerId: string]: number } = {};
      players.forEach((p) => {
        if (!p.isEliminated) {
          initial[p.id] = 0;
        }
      });
      setRoundScores(initial);
    }
  }, [isOpen, players]);

  if (!isOpen) return null;

  const handleScoreChange = (playerId: string, amount: number) => {
    sounds.playClick();
    setRoundScores((prev) => {
      const current = prev[playerId] || 0;
      const next = Math.max(-50, Math.min(100, current + amount));
      return { ...prev, [playerId]: next };
    });
  };

  const handleManualInput = (playerId: string, val: string) => {
    const parsed = parseInt(val, 10);
    setRoundScores((prev) => ({
      ...prev,
      [playerId]: isNaN(parsed) ? 0 : parsed,
    }));
  };

  const handleSave = () => {
    sounds.playSuccess();
    onSaveRound(roundScores);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-zinc-900/95 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest text-amber-400 uppercase bg-amber-500/10 px-3 py-1 rounded-full">
            Fim da Rodada
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Adicionar Pontos</h2>
          <p className="text-zinc-400 text-sm mt-1">Insira os pontos acumulados nesta rodada</p>
        </div>

        {/* Players Score Inputs */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 mb-6">
          {players.map((player) => {
            if (player.isEliminated) return null;
            const score = roundScores[player.id] || 0;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-2xl border border-zinc-800/50"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold shadow-inner relative"
                    style={{ backgroundColor: `${player.color}20`, border: `1px solid ${player.color}40` }}
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
                  <div>
                    <h4 className="text-white font-bold text-sm">{player.name}</h4>
                    <p className="text-xs text-zinc-400">Total: {player.totalScore} pts</p>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="flex items-center gap-2">
                  {/* Minus Button */}
                  <button
                    onClick={() => handleScoreChange(player.id, -1)}
                    className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors active:scale-90"
                  >
                    <Minus size={14} />
                  </button>

                  {/* Score Input */}
                  <input
                    type="number"
                    value={score === 0 ? "" : score}
                    onChange={(e) => handleManualInput(player.id, e.target.value)}
                    placeholder="0"
                    className="w-14 bg-zinc-900 border border-zinc-800 rounded-lg py-1 text-center text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                  />

                  {/* Plus Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleScoreChange(player.id, 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 flex items-center justify-center transition-colors active:scale-90 text-xs font-bold"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleScoreChange(player.id, 10)}
                      className="w-10 h-8 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 flex items-center justify-center transition-colors active:scale-90 text-xs font-bold"
                    >
                      +10
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-2xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          <Check size={18} />
          Confirmar Rodada
        </button>
      </div>
    </div>
  );
};