import React, { useState } from "react";
import { RegisteredPlayer } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { Plus, Trash2, Edit2, UserPlus, Check, X } from "lucide-react";

interface PlayersManagerProps {
  registeredPlayers: RegisteredPlayer[];
  onAddPlayer: (name: string, color: string, avatar: string) => void;
  onEditPlayer: (id: string, name: string, color: string, avatar: string) => void;
  onDeletePlayer: (id: string) => void;
}

const PRESET_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"
];

const PRESET_EMOJIS = ["🃏", "👑", "🦁", "🦊", "🐼", "🐯", "🦉", "🦄", "🦖", "🚀", "💎", "🔥"];

export const PlayersManager: React.FC<PlayersManagerProps> = ({
  registeredPlayers,
  onAddPlayer,
  onEditPlayer,
  onDeletePlayer,
}) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [avatar, setAvatar] = useState(PRESET_EMOJIS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sounds.playSuccess();
    if (editingId) {
      onEditPlayer(editingId, name.trim(), color, avatar);
      setEditingId(null);
    } else {
      onAddPlayer(name.trim(), color, avatar);
    }

    setName("");
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setAvatar(PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)]);
  };

  const handleStartEdit = (player: RegisteredPlayer) => {
    sounds.playClick();
    setEditingId(player.id);
    setName(player.name);
    setColor(player.color);
    setAvatar(player.avatar);
  };

  const handleCancelEdit = () => {
    sounds.playClick();
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setAvatar(PRESET_EMOJIS[0]);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <UserPlus size={16} className="text-amber-400" />
          {editingId ? "Editar Jogador" : "Cadastrar Novo Jogador"}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-400 mb-1">Nome do Jogador</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Thiago, Maria..."
              maxLength={16}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">Avatar / Emoji</label>
              <select
                value={avatar}
                onChange={(e) => { sounds.playClick(); setAvatar(e.target.value); }}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-amber-500"
              >
                {PRESET_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>{emoji} {emoji === avatar ? "(Selecionado)" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-zinc-400 mb-1">Cor de Destaque</label>
              <div className="flex items-center gap-1.5 h-10">
                {PRESET_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { sounds.playClick(); setColor(c); }}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      color === c ? "scale-115 border-white" : "border-transparent"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={!name.trim()}
            className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-amber-900/20 flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Check size={16} />
            {editingId ? "Salvar Alterações" : "Cadastrar Jogador"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold rounded-xl transition-colors text-sm"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Registered Players List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-1">
          Jogadores Cadastrados ({registeredPlayers.length})
        </h3>

        {registeredPlayers.length === 0 ? (
          <div className="text-center py-8 bg-zinc-900/20 border border-zinc-800/30 rounded-2xl">
            <p className="text-zinc-500 text-sm">Nenhum jogador cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {registeredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-zinc-900/40 border border-zinc-800/50 p-3.5 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner"
                    style={{ backgroundColor: `${player.color}20`, border: `1px solid ${player.color}40` }}
                  >
                    {player.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{player.name}</h4>
                    <p className="text-[10px] text-zinc-500">
                      Cadastrado em {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(player)}
                    className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => { sounds.playElimination(); onDeletePlayer(player.id); }}
                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};