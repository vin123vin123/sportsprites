// GitHub Copilot Chat Assistant — script.js
// Pixel-style sprite generator using DiceBear + client-side composition and PNG download

const seedEl = document.getElementById('seed');
const colorEl = document.getElementById('teamColor');
const sportEl = document.getElementById('sport');
const genBtn = document.getElementById('generate');
const dlBtn = document.getElementById('download');
const canvas = document.getElementById('spriteCanvas');
const ctx = canvas.getContext('2d');

// Pixel-friendly drawing
ctx.imageSmoothingEnabled = false;

function dicebearUrl(seed) {
  const s = encodeURIComponent(seed);
  // DiceBear pixel-art SVG (no API key required)
  return `https://avatars.dicebear.com/api/pixel-art/${s}.svg`;
}

function getSportSvgString(sport, color) {
  // color is like "#rrggbb"
  const c = color || '#ffffff';
  if (sport === 'soccer') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="30" fill="${c}" stroke="#000" stroke-width="1.8"/><g transform="translate(6,6) scale(0.88)"><path d="M20 5 L26 11 L22 18 L14 18 L10 11 Z" fill="#fff" opacity="0.85"/></g></svg>`;
  } else if (sport === 'basketball') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="${c}" stroke="#000" stroke-width="1.8"/><path d="M12 32a20 20 0 0 0 40 0M32 12a20 20 0 0 1 0 40" stroke="#000" stroke-width="1.6" fill="none"/></svg>`;
  } else if (sport === 'baseball') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="26" fill="${c}" stroke="#fff" stroke-width="1.6"/><path d="M20 20c6 6 18 6 24 0" stroke="#fff" stroke-width="1.6" fill="none"/><path d="M20 44c6-6 18-6 24 0" stroke="#fff" stroke-width="1.6" fill="none"/></svg>`;
  } else if (sport === 'tennis') {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><circle cx="32" cy="32" r="28" fill="${c}" stroke="#0b0b0b" stroke-width="1.3"/><path d="M16 32a16 16 0 0 0 32 0" stroke="#0b0b0b" stroke-width="1.4" fill="none"/></svg>`;
  } else {
    // default simple badge
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect x="8" y="8" width="48" height="48" rx="8" fill="${c}"/></svg>`;
  }
}

// Draws the DiceBear avatar SVG (fetched) and overlays jersey and sport icon into the canvas
async function generate() {
  const seed = (seedEl.value || 'player').trim();
  const teamColor = colorEl.value || '#ff3b30';
  const sport = sportEl.value || 'soccer';

  const url = dicebearUrl(`${seed}-${sport}`);

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Avatar fetch failed: ${res.status}`);
    const svgText = await res.text();

    // Create avatar image from SVG blob
    const avatarBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
    const avatarURL = URL.createObjectURL(avatarBlob);
    const avatarImg = await loadImage(avatarURL);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // background (subtle)
    ctx.fillStyle = '#0f1724';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw faint jersey color block near lower third for context
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = teamColor;
    ctx.fillRect(0, canvas.height * 0.58, canvas.width, canvas.height * 0.42);
    ctx.globalAlpha = 1;

    // Draw avatar centered and scaled up for pixel look
    const scale = Math.min(canvas.width / avatarImg.width, canvas.height / avatarImg.height) * 0.95;
    const w = Math.round(avatarImg.width * scale);
    const h = Math.round(avatarImg.height * scale);
    const x = Math.round((canvas.width - w) / 2);
    const y = Math.round((canvas.height - h) / 2) - 6;
    // ensure pixelated upscale: draw to an offscreen small canvas then scale? DiceBear pixel-art SVG is already blocky,
    // using ctx.imageSmoothingEnabled = false gives pixelated scaling.
    ctx.drawImage(avatarImg, x, y, w, h);

    // Draw a simple chest band/jersey stripe
    ctx.fillStyle = teamColor;
    const bandW = Math.round(canvas.width * 0.46);
    const bandH = Math.round(canvas.height * 0.06);
    const bandX = Math.round((canvas.width - bandW) / 2);
    const bandY = Math.round(canvas.height * 0.62);
    ctx.fillRect(bandX, bandY, bandW, bandH);

    // Draw sport icon onto canvas (bottom-right)
    const iconSvg = getSportSvgString(sport, '#ffffff'); // draw icon white so it contrasts with jersey
    const iconDataUrl = 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg);
    const iconImg = await loadImage(iconDataUrl);
    const iconSize = Math.round(canvas.width * 0.22); // e.g., ~56px on 256 canvas
    const iconPadding = Math.round(canvas.width * 0.06);
    const iconX = canvas.width - iconSize - iconPadding;
    const iconY = canvas.height - iconSize - iconPadding;
    // optionally draw a small circular background using team color for contrast
    ctx.fillStyle = teamColor;
    ctx.globalAlpha = 0.92;
    const bgSize = Math.round(iconSize * 1.06);
    ctx.beginPath();
    ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, bgSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

    // cleanup
    URL.revokeObjectURL(avatarURL);
  } catch (err) {
    console.error(err);
    alert('Failed to generate sprite: ' + (err.message || err));
  }
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // For data URLs and blob URLs, crossOrigin not needed; kept unset to avoid CORS issues.
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Image load error: ' + src));
    img.src = src;
  });
}

function downloadPNG() {
  const filenameSeed = (seedEl.value && seedEl.value.trim()) ? seedEl.value.trim() : 'sprite';
  canvas.toBlob((blob) => {
    if (!blob) {
      alert('Unable to create image.');
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filenameSeed}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

// Wire up events
genBtn.addEventListener('click', generate);
dlBtn.addEventListener('click', downloadPNG);

// generate initial sprite on load
generate();
