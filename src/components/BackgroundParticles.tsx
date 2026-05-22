import React, { useEffect, useRef } from "react";

interface BackgroundParticlesProps {
  theme: 'casino-green' | 'poker-red' | 'midnight-blue' | 'obsidian';
}

export const BackgroundParticles: React.FC<BackgroundParticlesProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      alpha: number;
      speedY: number;
      speedX: number;
    }> = [];

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Generate particles
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        alpha: Math.random() * 0.3 + 0.1,
        speedY: -(Math.random() * 0.4 + 0.1),
        speedX: Math.random() * 0.2 - 0.1,
      });
    }

    // Get particle color based on theme
    const getParticleColor = () => {
      switch (theme) {
        case "casino-green":
          return "34, 197, 94"; // green-500
        case "poker-red":
          return "239, 68, 68"; // red-500
        case "midnight-blue":
          return "59, 130, 246"; // blue-500
        case "obsidian":
          return "168, 85, 247"; // purple-500
        default:
          return "255, 255, 255";
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const colorStr = getParticleColor();

      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y < 0) {
          p.y = canvas.height;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < 0 || p.x > canvas.width) {
          p.x = Math.random() * canvas.width;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${colorStr}, ${p.alpha})`;
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-60"
    />
  );
};