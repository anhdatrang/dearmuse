/* ══════════════════════════════════════════════════════
   DEAR MUSÉ — ARTISTIC EFFECTS JS
   Falling Tuyet Mai (White Flowers)
══════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('artistic-effects-container')) return;

  const container = document.createElement('div');
  container.id = 'artistic-effects-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  // Tuyet Mai Flower SVG template
  const createTuyetMaiSVG = () => `
    <svg viewBox="-10 -10 20 20" width="100%" height="100%" overflow="visible">
      <circle cx="0" cy="-6" r="3.5"/>
      <circle cx="5.7" cy="-1.8" r="3.5"/>
      <circle cx="3.5" cy="4.8" r="3.5"/>
      <circle cx="-3.5" cy="4.8" r="3.5"/>
      <circle cx="-5.7" cy="-1.8" r="3.5"/>
      <circle cx="0" cy="0" r="1.5" fill="#fff9e6"/>
    </svg>
  `;

  const flowerCount = window.innerWidth < 768 ? 25 : 50;

  for (let i = 0; i < flowerCount; i++) {
    const flower = document.createElement('div');
    flower.classList.add('dm-tuyet-mai');
    
    // Set inner HTML to SVG
    flower.innerHTML = createTuyetMaiSVG();
    
    // Randomize properties
    const size = Math.random() * 15 + 10; // 10px to 25px
    const leftPos = Math.random() * 100; // 0% to 100%
    const duration = Math.random() * 10 + 10; // 10s to 20s
    const delay = Math.random() * -20; // negative delay to start immediately at different positions
    const drift = (Math.random() - 0.5) * 200; // -100px to 100px
    const rotation = (Math.random() - 0.5) * 720; // random rotation
    const scale = Math.random() * 0.5 + 0.6;
    
    flower.style.width = `${size}px`;
    flower.style.height = `${size}px`;
    flower.style.left = `${leftPos}%`;
    flower.style.setProperty('--duration', `${duration}s`);
    flower.style.setProperty('--delay', `${delay}s`);
    flower.style.setProperty('--drift', `${drift}px`);
    flower.style.setProperty('--rot', `${rotation}deg`);
    flower.style.setProperty('--scale', scale);
    flower.style.setProperty('--max-opacity', `${Math.random() * 0.4 + 0.5}`);

    container.appendChild(flower);
  }
});
