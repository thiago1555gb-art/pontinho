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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto font-sans">
      <div className="relative w-full max-w-md bg-[#FFFDF9] border-2 border-[#D4AF37] rounded-3xl p-6 shadow-2xl my-8 text-zinc-900">
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-900 rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors border border-zinc-200"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <span className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200">
            Fim da Rodada
          </span>
          <h2 className="text-xl font-serif font-bold text-zinc-900 mt-3 tracking-tight">Adicionar Pontos</h2>
          <p className="text-zinc-500 text-xs mt-1">Insira os pontos acumulados nesta rodada</p>
        </div>

        {/* Players Score Inputs */}
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 mb-6">
          {players.map((player) => {
            if (player.isEliminated) return null;
            const score = roundScores[player.id] || 0;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between bg-zinc-50 p-3 rounded-2xl border border-zinc-200"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-white border border-zinc-200 relative"
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
                  <div>
                    <h4 className="text-zinc-900 font-bold text-sm">{player.name}</h4>
                    <p className="text-xs text-zinc-500">Total: {player.totalScore} pts</p>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="flex items-center gap-2">
                  {/* Minus Button */}
                  <button
                    onClick={() => handleScoreChange(player.id, -1)}
                    className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors active:scale-90 border border-zinc-200"
                  >
                    <Minus size={12} />
                  </button>

                  {/* Score Input */}
                  <input
                    type="number"
                    value={score === 0 ? "" : score}
                    onChange={(e) => handleManualInput(player.id, e.target.value)}
                    placeholder="0"
                    className="w-12 bg-white border border-zinc-300 rounded-lg py-1 text-center text-zinc-900 font-mono font-bold text-sm focus:outline-none focus:border-zinc-400"
                  />

                  {/* Plus Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleScoreChange(player.id, 1)}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors active:scale-90 text-xs font-bold border border-zinc-200"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleScoreChange(player.id, 10)}
                      className="w-10 h-8 rounded-lg bg-white hover:bg-zinc-100 text-zinc-900 flex items-center justify-center transition-colors active:scale-90 text-xs font-bold border border-zinc-200"
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
          className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
        >
          <Check size={15} />
          Confirmar Rodada
        </button>
      </div>
    </div>
  );
};