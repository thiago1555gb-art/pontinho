import React, { useState, useRef } from "react";
import { RegisteredPlayer } from "../types/pontinho";
import { sounds } from "../utils/audio";
import { uploadPlayerAvatar } from "../utils/supabaseService";
import { Plus, Trash2, Edit2, UserPlus, Check, X, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { showSuccess, showError } from "../utils/toast";

interface PlayersManagerProps {
  registeredPlayers: RegisteredPlayer[];
  onAddPlayer: (name: string, color: string, avatar: string, avatarUrl?: string) => void;
  onEditPlayer: (id: string, name: string, color: string, avatar: string, avatarUrl?: string) => void;
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
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Image Upload States
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showError("Formato inválido! Use JPG, PNG ou WEBP.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showError("A imagem deve ter no máximo 2MB.");
      return;
    }

    setIsUploading(true);
    sounds.playClick();

    try {
      // Generate a temporary ID if creating a new player
      const tempId = editingId || `temp-${Date.now()}`;
      const uploadedUrl = await uploadPlayerAvatar(tempId, file);

      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        showSuccess("Foto carregada com sucesso!");
      } else {
        showError("Erro ao enviar imagem. Tente novamente.");
      }
    } catch (err) {
      showError("Erro ao enviar imagem.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    sounds.playSuccess();
    if (editingId) {
      onEditPlayer(editingId, name.trim(), color, avatar, avatarUrl);
      setEditingId(null);
    } else {
      onAddPlayer(name.trim(), color, avatar, avatarUrl);
    }

    setName("");
    setColor(PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)]);
    setAvatar(PRESET_EMOJIS[Math.floor(Math.random() * PRESET_EMOJIS.length)]);
    setAvatarUrl(undefined);
  };

  const handleStartEdit = (player: RegisteredPlayer) => {
    sounds.playClick();
    setEditingId(player.id);
    setName(player.name);
    setColor(player.color);
    setAvatar(player.avatar);
    setAvatarUrl(player.avatarUrl);
  };

  const handleCancelEdit = () => {
    sounds.playClick();
    setEditingId(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setAvatar(PRESET_EMOJIS[0]);
    setAvatarUrl(undefined);
  };

  const removePhoto = () => {
    sounds.playClick();
    setAvatarUrl(undefined);
  };

  return (
    <div className="space-y-6">
      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="bg-[#F5F1EA] border border-[#1C1C1C]/10 rounded-2xl p-5 space-y-5">
        <h3 className="text-xs font-bold text-[#1C1C1C] uppercase tracking-wider flex items-center gap-2">
          <UserPlus size={14} className="text-[#1C1C1C]" />
          {editingId ? "Editar Jogador" : "Cadastrar Novo Jogador"}
        </h3>

        <div className="space-y-4">
          {/* Photo Upload Area */}
          <div>
            <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Foto de Perfil (Opcional)</label>
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative border border-dashed rounded-2xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                dragActive
                  ? "border-[#1C1C1C] bg-[#FAF8F5]"
                  : "border-[#1C1C1C]/10 hover:border-[#1C1C1C]/30 bg-[#FAF8F5]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {isUploading ? (
                <div className="flex flex-col items-center gap-2 py-2">
                  <Loader2 className="animate-spin text-[#1C1C1C]" size={20} />
                  <span className="text-xs text-[#5C5A55]">Enviando imagem...</span>
                </div>
              ) : avatarUrl ? (
                <div className="flex items-center gap-4 w-full" onClick={(e) => e.stopPropagation()}>
                  <div className="relative w-14 h-14 rounded-full overflow-hidden border border-[#1C1C1C]/10 shadow-sm">
                    <img
                      src={avatarUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-[#1C1C1C]">Foto carregada!</p>
                    <p className="text-[10px] text-[#5C5A55]">Pronta para salvar</p>
                  </div>
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="px-3 py-1.5 bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#5C5A55] hover:text-[#1C1C1C] border border-[#1C1C1C]/10 rounded-xl transition-colors text-xs font-semibold"
                  >
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2 text-center">
                  <div className="w-9 h-9 rounded-full bg-[#FAF8F5] flex items-center justify-center text-[#5C5A55] border border-[#1C1C1C]/10">
                    <Upload size={15} />
                  </div>
                  <span className="text-xs font-semibold text-[#1C1C1C]">Arraste ou clique para enviar</span>
                  <span className="text-[10px] text-[#5C5A55]">JPG, PNG ou WEBP (Máx. 2MB)</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Nome do Jogador</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Thiago, Maria..."
              maxLength={16}
              className="w-full bg-[#FAF8F5] border border-[#1C1C1C]/10 rounded-xl px-4 py-3 text-[#1C1C1C] text-sm focus:outline-none focus:border-[#1C1C1C]/30 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Avatar / Emoji</label>
              <select
                value={avatar}
                onChange={(e) => { sounds.playClick(); setAvatar(e.target.value); }}
                className="w-full bg-[#FAF8F5] border border-[#1C1C1C]/10 rounded-xl px-3 py-3 text-[#1C1C1C] text-sm focus:outline-none focus:border-[#1C1C1C]/30"
              >
                {PRESET_EMOJIS.map((emoji) => (
                  <option key={emoji} value={emoji}>{emoji} {emoji === avatar ? "(Selecionado)" : ""}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#5C5A55] uppercase tracking-wider mb-2">Cor de Destaque</label>
              <div className="flex items-center gap-1.5 h-11">
                {PRESET_COLORS.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { sounds.playClick(); setColor(c); }}
                    className={`w-6 h-6 rounded-full border transition-transform ${
                      color === c ? "scale-110 border-[#1C1C1C]" : "border-transparent"
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
            disabled={!name.trim() || isUploading}
            className="flex-1 py-3.5 bg-[#1C1C1C] hover:bg-[#2D2D2D] disabled:opacity-50 text-[#FAF8F5] font-bold rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
          >
            <Check size={15} />
            {editingId ? "Salvar Alterações" : "Cadastrar Jogador"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-3.5 bg-[#FAF8F5] hover:bg-[#F5F1EA] text-[#5C5A55] font-semibold rounded-xl transition-colors text-sm border border-[#1C1C1C]/10"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>

      {/* Registered Players List */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-[#5C5A55] uppercase tracking-wider px-1">
          Jogadores Cadastrados ({registeredPlayers.length})
        </h3>

        {registeredPlayers.length === 0 ? (
          <div className="text-center py-10 bg-[#F5F1EA]/40 border border-[#1C1C1C]/10 rounded-2xl">
            <p className="text-[#5C5A55] text-sm">Nenhum jogador cadastrado ainda.</p>
          </div>
        ) : (
          <div className="grid gap-2.5">
            {registeredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between bg-[#F5F1EA] border border-[#1C1C1C]/10 p-3.5 rounded-2xl"
              >
                <div className="flex items-center gap-3.5">
                  {/* Circular Avatar with Fallback */}
                  <div
                    className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold bg-[#FAF8F5] border border-[#1C1C1C]/10 relative"
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
                    <p className="text-[10px] text-[#5C5A55] mt-0.5">
                      Cadastrado em {new Date(player.createdAt).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStartEdit(player)}
                    className="p-2 text-[#5C5A55] hover:text-[#1C1C1C] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => { sounds.playElimination(); onDeletePlayer(player.id); }}
                    className="p-2 text-[#5C5A55] hover:text-[#8C2D19] hover:bg-[#8C2D19]/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 size={14} />
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