import React from "react";

interface PlayerAvatarProps {
  avatarUrl?: string;
  emoji: string;
  color: string;
  name: string;
  size?: "xs" | "sm" | "md" | "ml" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
}

export const PlayerAvatar: React.FC<PlayerAvatarProps> = ({
  avatarUrl,
  emoji,
  color,
  name,
  size = "md",
  className = "",
}) => {
  const sizeClasses = {
    xs: "w-5 h-5 text-[10px]",
    sm: "w-6 h-6 text-xs",
    md: "w-10 h-10 text-base",
    ml: "w-11 h-11 text-lg",
    lg: "w-12 h-12 text-xl",
    xl: "w-14 h-14 text-2xl",
    "2xl": "w-16 h-16 text-3xl",
    "3xl": "w-20 h-20 text-4xl",
  };

  return (
    <div
      className={`relative rounded-full overflow-hidden flex items-center justify-center font-bold bg-zinc-100 border-2 transition-all duration-300 ${sizeClasses[size]} ${className}`}
      style={{ 
        borderColor: color,
        boxShadow: `0 0 0 2px rgba(255, 255, 255, 0.95), 0 4px 10px rgba(0, 0, 0, 0.12)`,
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={name}
          decoding="async"
          loading="eager"
          className="w-full h-full object-cover object-center select-none"
          style={{
            imageRendering: "auto",
            transform: "translateZ(0)", // Force GPU acceleration for sharper scaling
            backfaceVisibility: "hidden",
            WebkitFontSmoothing: "antialiased",
          }}
        />
      ) : (
        <span className="select-none transform scale-110 leading-none">{emoji}</span>
      )}
      {/* Premium inner shadow overlay for depth and crisp edges */}
      <div className="absolute inset-0 rounded-full ring-1 ring-black/10 pointer-events-none" />
    </div>
  );
};