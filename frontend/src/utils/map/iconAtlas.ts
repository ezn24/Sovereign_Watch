export const createIconAtlas = () => {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128; // Expanded to accommodate halo sprite
  const ctx = canvas.getContext("2d")!;

  // 1. Simple chevron/triangle for aircraft (at 32, 32)
  ctx.save();
  ctx.translate(32, 32);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, -16); // Top point
  ctx.lineTo(12, 8); // Bottom right
  ctx.lineTo(0, 4); // Bottom center (notch)
  ctx.lineTo(-12, 8); // Bottom left
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 2. Same chevron for vessels (at 96, 32)
  ctx.save();
  ctx.translate(96, 32);
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(12, 8);
  ctx.lineTo(0, 4);
  ctx.lineTo(-12, 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 3. Tactical Halo Sprite (at 32, 96) - A soft circular glow
  ctx.save();
  ctx.translate(32, 96);
  // Radial gradient for a soft tactical glow
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 30);
  gradient.addColorStop(0, "rgba(255, 255, 255, 1.0)"); // Core
  gradient.addColorStop(0.3, "rgba(255, 255, 255, 0.6)"); // Inner glow
  gradient.addColorStop(0.7, "rgba(255, 255, 255, 0.2)"); // Outer fade
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)"); // Edge
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, 30, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  return {
    url: canvas.toDataURL(),
    width: 128,
    height: 128,
    mapping: {
      aircraft: { x: 0, y: 0, width: 64, height: 64, anchorY: 32, mask: true },
      vessel: { x: 64, y: 0, width: 64, height: 64, anchorY: 32, mask: true },
      halo: { x: 0, y: 64, width: 64, height: 64, anchorY: 32, mask: true },
    },
  };
};

export const ICON_ATLAS = createIconAtlas();
