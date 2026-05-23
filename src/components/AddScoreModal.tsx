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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#FAF8F5] border border-[#1C1C1C]/20 rounded-3xl p-6 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-[#5C5A55] hover:text-[#1C1C1C] rounded-full bg-[#F5F1EA] hover:bg-[#EAE5DC] transition-colors border border-[#1C1C1C]/10"
        >
          <X size={16} />
        </button>

        <div className="text-center mb-6">
          <span className="text-[10px] font-bold tracking-wider text-[#5C5A55] uppercase bg-[#F5F1EA] px-3 py-1 rounded-full border border-[#1C1C1C]/10">
            Fim da Rodada
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1C1C1C] mt-3 tracking-tight">Adicionar Pontos</h2>
          <p className="text-[#5C5A55] text-xs mt-1">Insira os pontos acumulados nesta rodada</p>
        </div>

        {/* Players Score Inputs */}
        <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-1 mb-6">
          {players.map((player) => {
            if (player.isEliminated) return null;
            const score = roundScores[player.id] || 0;

            return (
              <div
                key={player.id}
                className="flex items-center justify-between bg-[#F5F1EA] p-3 rounded-2xl border border-[#1C1C1C]/10"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-[#FAF8F5] border border-[#1C1C1C]/10 relative"
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
                    <h4 className="text-[#1C1C1C] font-bold text-sm">{player.name}</h4>
                    <p className="text-xs text-[#5C5A55]">Total: {player.totalScore} pts</p>
                  </div>
                </div>

                {/* Score Controls */}
                <div className="flex items-center gap-2">
                  {/* Minus Button */}
                  <button
                    onClick={() => handleScoreChange(player.id, -1)}
                    className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#1C1C1C] flex items-center justify-center transition-colors active:scale-90 border border-[#1C1C1C]/10"
                  >
                    <Minus size={12} />
                  </button>

                  {/* Score Input */}
                  <input
                    type="number"
                    value={score === 0 ? "" : score}
                    onChange={(e) => handleManualInput(player.id, e.target.value)}
                    placeholder="0"
                    className="w-12 bg-[#FAF8F5] border border-[#1C1C1C]/10 rounded-lg py-1 text-center text-[#1C1C1C] font-mono font-bold text-sm focus:outline-none focus:border-[#1C1C1C]/30"
                  />

                  {/* Plus Buttons */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleScoreChange(player.id, 1)}
                      className="w-8 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#1C1C1C] flex items-center justify-center transition-colors active:scale-90 text-xs font-bold border border-[#1C1C1C]/10"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => handleScoreChange(player.id, 10)}
                      className="w-10 h-8 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#1C1C1C] flex items-center justify-center transition-colors active:scale-90 text-xs font-bold border border-[#1C1C1C]/10"
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
          className="w-full py-4 bg-[#1C1C1C] hover:bg-[#2D2D2D] text-[#FAF8F5] font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
        >
          <Check size={15} />
          Confirmar Rodada
        </button>
      </div>
    </div>
  );
};