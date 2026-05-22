import React, { useState } from "react";
import { Player, GameSettings } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { Plus, Trash2, Play, X, UserPlus } from "lucide-react";

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartMatch: (players: Omit<Player, "scores" | "totalScore" | "isEliminated" | "reentries">[], settings: GameSettings) => void;
}

const PRESET_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
];

const PRESET_EMOJIS = ["🃏", "👑", "🦁", "🦊", "🐼", "🐯", "🦉", "🦄", "🦖", "🚀", "💎", "🔥"];

export const NewMatchModal: React.FC<NewMatchModalProps> = ({ isOpen, onClose, onStartMatch }) => {
  const [playerInputs, setPlayerInputs] = useState<Array<{ name: string; color: string; avatar: string }>>([
    { name: "Jogador 1", color: PRESET_COLORS[0], avatar: PRESET_EMOJIS[0] },
    { name: "Jogador 2", color: PRESET_COLORS[1], avatar: PRESET_EMOJIS[1] },
  ]);

  const [limitScore, setLimitScore] = useState<number>(100);
  const [allowReentry, setAllowReentry] = useState<boolean>(true);
  const [theme, setTheme] = useState<GameSettings["theme"]>("casino-green");

  if (!isOpen) return null;

  const handleAddPlayer = () => {
    sounds.playClick();
    if (playerInputs.length >= 10) return;
    const nextIndex = playerInputs.length;
    setPlayerInputs([
      ...playerInputs,
      {
        name: `Jogador ${nextIndex + 1}`,
        color: PRESET_COLORS[nextIndex % PRESET_COLORS.length],
        avatar: PRESET_EMOJIS[nextIndex % PRESET_EMOJIS.length],
      },
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    sounds.playClick();
    if (playerInputs.length <= 2) return;
    setPlayerInputs(playerInputs.filter((_, i) => i !== index));
  };

  const handlePlayerChange = (index: number, field: "name" | "color" | "avatar", value: string) => {
    const updated = [...playerInputs];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerInputs(updated);
  };

  const handleStart = () => {
    sounds.playSuccess();
    const formattedPlayers = playerInputs.map((p, idx) => ({
      id: `player-${Date.now()}-${idx}`,
      name: p.name.trim() || `Jogador ${idx + 1}`,
      color: p.color,
      avatar: p.avatar,
    }));

    onStartMatch(formattedPlayers, {
      limitScore,
      soundEnabled: true,
      theme,
      allowReentry,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={() => { sounds.playClick(); onClose(); }}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-6">
          <span className="text-xs font-bold tracking-widest text-emerald-400 uppercase bg-emerald-500/10 px-3 py-1 rounded-full">
            Novo Jogo
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-2">Configurar Partida</h2>
          <p className="text-zinc-400 text-sm mt-1">Defina as regras e adicione os jogadores</p>
        </div>

        {/* Game Rules */}
        <div className="space-y-4 mb-6 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Regras do Jogo</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Pontuação Limite</label>
              <select
                value={limitScore}
                onChange={(e) => { sounds.playClick(); setLimitScore(Number(e.target.value)); }}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              >
                <option value={50}>50 Pontos</option>
                <option value={100}>100 Pontos</option>
                <option value={150}>150 Pontos</option>
                <option value={200}>200 Pontos</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Reentrada (Buy-back)</label>
              <div className="flex items-center h-10">
                <button
                  type="button"
                  onClick={() => { sounds.playClick(); setAllowReentry(!allowReentry); }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                    allowReentry
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  }`}
                >
                  {allowReentry ? "Permitido" : "Desativado"}
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs text-zinc-400 mb-1.5">Tema da Mesa</label>
            <div className="grid grid-cols-4 gap-2">
              {(["casino-green", "poker-red", "midnight-blue", "obsidian"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { sounds.playClick(); setTheme(t); }}
                  className={`py-2 px-1 rounded-xl text-[10px] font-bold border capitalize transition-all ${
                    theme === t
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-zinc-900 border-zinc-800 text-zinc-500"
                  }`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`w-3 h-3 rounded-full ${
                      t === "casino-green" ? "bg-emerald-500" :
                      t === "poker-red" ? "bg-red-500" :
                      t === "midnight-blue" ? "bg-blue-500" : "bg-purple-500"
                    }`} />
                    {t.split("-")[0]}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-3 mb-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Jogadores ({playerInputs.length}/10)
            </h3>
            {playerInputs.length < 10 && (
              <button
                onClick={handleAddPlayer}
                className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <UserPlus size={14} />
                Adicionar
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {playerInputs.map((player, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-zinc-950/40 p-2 rounded-xl border border-zinc-800/40"
              >
                {/* Emoji Selector */}
                <select
                  value={player.avatar}
                  onChange={(e) => handlePlayerChange(index, "avatar", e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-lg focus:outline-none"
                >
                  {PRESET_EMOJIS.map((emoji) => (
                    <option key={emoji} value={emoji}>{emoji}</option>
                  ))}
                </select>

                {/* Name Input */}
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => handlePlayerChange(index, "name", e.target.value)}
                  placeholder={`Jogador ${index + 1}`}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-white text-sm focus:outline-none focus:border-emerald-500"
                />

                {/* Color Picker */}
                <div className="flex gap-1">
                  {PRESET_COLORS.slice(0, 4).map((color) => (
                    <button
                      key={color}
                      onClick={() => handlePlayerChange(index, "color", color)}
                      className={`w-5 h-5 rounded-full border transition-transform ${
                        player.color === color ? "scale-110 border-white" : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Delete Button */}
                {playerInputs.length > 2 && (
                  <button
                    onClick={() => handleRemovePlayer(index)}
                    className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
        >
          <Play size={18} fill="currentColor" />
          Começar Partida
        </button>
      </div>
    </div>
  );
};