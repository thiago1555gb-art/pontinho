import React, { useState } from "react";
import { Player, GameSettings, RegisteredPlayer } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { Plus, Trash2, Play, X, UserPlus, Check } from "lucide-react";

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  registeredPlayers: RegisteredPlayer[];
  onStartMatch: (players: Omit<Player, "scores" | "totalScore" | "isEliminated" | "reentries">[], settings: GameSettings) => void;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  registeredPlayers,
  onStartMatch,
}) => {
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [limitScore, setLimitScore] = useState<number>(100);
  const [allowReentry, setAllowReentry] = useState<boolean>(true);
  const [theme, setTheme] = useState<GameSettings["theme"]>("casino-green");

  if (!isOpen) return null;

  const handleTogglePlayer = (id: string) => {
    sounds.playClick();
    setSelectedPlayerIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((pId) => pId !== id);
      }
      if (prev.length >= 10) return prev; // Max 10 players
      return [...prev, id];
    });
  };

  const handleStart = () => {
    if (selectedPlayerIds.length < 2) return;

    sounds.playSuccess();
    const formattedPlayers = selectedPlayerIds.map((id) => {
      const rp = registeredPlayers.find((p) => p.id === id)!;
      return {
        id: rp.id,
        name: rp.name,
        color: rp.color,
        avatar: rp.avatar,
        avatarUrl: rp.avatarUrl,
      };
    });

    onStartMatch(formattedPlayers, {
      limitScore,
      soundEnabled: true,
      theme,
      allowReentry,
    });
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
            Configuração
          </span>
          <h2 className="text-xl font-serif font-bold text-[#1C1C1C] mt-3 tracking-tight">Nova Partida</h2>
          <p className="text-[#5C5A55] text-xs mt-1">Defina as regras e selecione os jogadores</p>
        </div>

        {/* Game Rules */}
        <div className="space-y-4 mb-6 bg-[#F5F1EA] p-4 rounded-2xl border border-[#1C1C1C]/10">
          <h3 className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider">Regras do Jogo</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Pontuação Limite</label>
              <select
                value={limitScore}
                onChange={(e) => { sounds.playClick(); setLimitScore(Number(e.target.value)); }}
                className="w-full bg-[#FAF8F5] border border-[#1C1C1C]/10 rounded-xl px-3 py-2.5 text-[#1C1C1C] text-xs focus:outline-none focus:border-[#1C1C1C]/30"
              >
                <option value={50}>50 Pontos</option>
                <option value={100}>100 Pontos</option>
                <option value={150}>150 Pontos</option>
                <option value={200}>200 Pontos</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Reentrada (Buy-back)</label>
              <div className="flex items-center h-10">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setAllowReentry(!allowReentry); }}
                  className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    allowReentry
                      ? "bg-[#1C1C1C] border-[#1C1C1C] text-[#FAF8F5]"
                      : "bg-[#FAF8F5] border-[#1C1C1C]/10 text-[#5C5A55]"
                  }`}
                >
                  {allowReentry ? "Permitido" : "Desativado"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Tema da Mesa</label>
            <div className="grid grid-cols-4 gap-2">
              {(["casino-green", "poker-red", "midnight-blue", "obsidian"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { sounds.playClick(); setTheme(t); }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-semibold border capitalize transition-all ${
                    theme === t
                      ? "bg-[#1C1C1C] border-[#1C1C1C] text-[#FAF8F5]"
                      : "bg-[#FAF8F5] border-[#1C1C1C]/10 text-[#5C5A55]"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1.5 py-1">
                    <span className={`w-2.5 h-2.5 rounded-full ${
                      t === "casino-green" ? "bg-emerald-600" :
                      t === "poker-red" ? "bg-red-600" :
                      t === "midnight-blue" ? "bg-blue-600" : "bg-purple-600"
                    }`} />
                    {t.split("-")[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Players Selection */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider">
              Selecionar Jogadores ({selectedPlayerIds.length}/10)
            </h3>
            <span className="text-[10px] text-[#5C5A55]">Mínimo 2</span>
          </div>

          {registeredPlayers.length === 0 ? (
            <div className="text-center py-8 bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl">
              <p className="text-[#5C5A55] text-xs">Nenhum jogador cadastrado.</p>
              <p className="text-[10px] text-[#5C5A55] mt-1">Cadastre jogadores na aba "Jogadores" primeiro.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
              {registeredPlayers.map((player) => {
                const isSelected = selectedPlayerIds.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => handleTogglePlayer(player.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-[#1C1C1C] border-[#1C1C1C] text-[#FAF8F5]"
                        : "bg-[#FAF8F5] border-[#1C1C1C]/10 text-[#5C5A55] hover:border-[#1C1C1C]/30"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div
                        className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-xs font-bold bg-[#FAF8F5] border border-[#1C1C1C]/10 relative"
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
                      <span className="text-xs font-semibold truncate">{player.name}</span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#1C1C1C]">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={selectedPlayerIds.length < 2}
          className="w-full py-4 bg-[#1C1C1C] hover:bg-[#2D2D2D] disabled:opacity-50 disabled:pointer-events-none text-[#FAF8F5] font-bold rounded-2xl shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm"
        >
          <Play size={15} fill="currentColor" />
          Começar Partida
        </button>
      </div>
    </div>
  );
};