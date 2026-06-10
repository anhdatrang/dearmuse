/* ══════════════════════════════════════════════════════
   DEAR MUSÉ — ARTISTIC EFFECTS JS
   Initializes background bubbles and blooming branches
══════════════════════════════════════════════════════ */

function createFlower(x, y, scale) {
  // Add a continuous sway wrapper with random duration, delay and rotation degree
  const swayDelay = Math.random() * 5;
  const swayDur = Math.random() * 2 + 3; // 3s to 5s
  const swayDeg = Math.random() * 15 + 5; // 5deg to 20deg
  
  // Variables for the bloom and fall cycle
  const cycleDur = Math.random() * 8 + 12; // 12s to 20s
  const cycleDelay = Math.random() * 10; // 0s to 10s
  const fallDist = Math.random() * 200 + 150; // 150px to 350px
  const fallDrift = (Math.random() - 0.5) * 150; // -75px to 75px

  return `
    <g transform="translate(${x}, ${y})">
      <g class="dm-sway" style="--sway-delay: ${swayDelay}s; --sway-dur: ${swayDur}s; --sway-deg: ${swayDeg}deg;">
        <g class="dm-flower" style="--base-scale: ${scale}; --cycle-dur: ${cycleDur}s; --cycle-delay: ${cycleDelay}s; --fall-dist: ${fallDist}px; --fall-drift: ${fallDrift}px;">
          <!-- Cherry blossom shape -->
          <circle cx="0" cy="-6" r="6"/>
          <circle cx="5.7" cy="-1.8" r="6"/>
          <circle cx="3.5" cy="4.8" r="6"/>
          <circle cx="-3.5" cy="4.8" r="6"/>
          <circle cx="-5.7" cy="-1.8" r="6"/>
          <circle cx="0" cy="0" r="3" fill="#D4DB74"/>
        </g>
      </g>
    </g>
  `;
}

function createLeaf(x, y, scale, rotation) {
  const swayDelay = Math.random() * 5;
  const swayDur = Math.random() * 2 + 3;
  const swayDeg = Math.random() * 10 + 5; // 5deg to 15deg

  return `
    <g transform="translate(${x}, ${y})">
      <g class="dm-sway" style="--sway-delay: ${swayDelay}s; --sway-dur: ${swayDur}s; --sway-deg: ${swayDeg}deg;">
        <g class="dm-leaf" style="--base-scale: ${scale}; animation-delay: ${Math.random() * 2 + 2}s">
          <path d="M0,0 Q-15,-15 -20,-30 Q-5,-25 0,0" transform="rotate(${rotation})" />
        </g>
      </g>
    </g>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('artistic-effects-container')) return;

  const container = document.createElement('div');
  container.id = 'artistic-effects-container';
  container.setAttribute('aria-hidden', 'true');
  document.body.appendChild(container);

  /* --- 1. Bubbles Effect --- */
  const bubbleCount = window.innerWidth < 768 ? 15 : 30;

  for (let i = 0; i < bubbleCount; i++) {
    const bubble = document.createElement('div');
    bubble.classList.add('dm-bubble');
    
    const size = Math.random() * 40 + 15;
    const leftPos = Math.random() > 0.5 ? (Math.random() * 25) : (75 + Math.random() * 25);
    
    bubble.style.width = `${size}px`;
    bubble.style.height = `${size}px`;
    bubble.style.left = `${leftPos}%`;
    bubble.style.setProperty('--duration', `${Math.random() * 12 + 8}s`);
    bubble.style.setProperty('--delay', `${Math.random() * 10}s`);
    bubble.style.setProperty('--drift', `${(Math.random() - 0.5) * 80}px`);
    bubble.style.setProperty('--max-opacity', `${Math.random() * 0.4 + 0.3}`);

    container.appendChild(bubble);
  }

  /* --- 2. Blooming Branch SVG --- */
  
  // Left branch definition
  const leftBranchHTML = `
    <div class="dm-branch-container dm-branch-left">
      <svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMax meet" width="100%" height="100%" overflow="visible">
        <!-- Paths -->
        <path class="dm-branch-path" d="M0,600 Q80,500 40,350 T120,150" />
        <path class="dm-branch-path sub-1" d="M60,450 Q150,400 120,320" />
        <path class="dm-branch-path sub-2" d="M40,350 Q100,280 180,220" />
        <path class="dm-branch-path sub-1" d="M100,200 Q150,120 220,100" />
        <path class="dm-branch-path sub-2" d="M120,320 Q200,300 250,250" />
        <path class="dm-branch-path sub-2" d="M220,100 Q260,60 280,20" />

        <!-- Leaves -->
        ${createLeaf(80, 500, 1, 45)}
        ${createLeaf(60, 450, 0.8, -20)}
        ${createLeaf(150, 400, 1.2, 60)}
        ${createLeaf(100, 280, 0.9, -40)}
        ${createLeaf(200, 300, 1, 80)}
        ${createLeaf(150, 120, 1.1, -10)}

        <!-- Lots of Flowers -->
        ${createFlower(80, 500, 1.2)}
        ${createFlower(40, 350, 1)}
        ${createFlower(120, 150, 1.3)}
        ${createFlower(150, 400, 0.8)}
        ${createFlower(120, 320, 1.1)}
        ${createFlower(100, 280, 1)}
        ${createFlower(180, 220, 1.2)}
        ${createFlower(150, 120, 0.9)}
        ${createFlower(220, 100, 1.4)}
        ${createFlower(200, 300, 1)}
        ${createFlower(250, 250, 1.2)}
        ${createFlower(260, 240, 0.8)}
        ${createFlower(280, 20, 1)}
        ${createFlower(60, 400, 1.1)}
        ${createFlower(90, 300, 0.8)}
        ${createFlower(160, 200, 1.3)}
      </svg>
    </div>`;

  // Right branch definition
  const rightBranchHTML = `
    <div class="dm-branch-container dm-branch-right">
      <svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMaxYMax meet" width="100%" height="100%" overflow="visible">
        <!-- Paths -->
        <path class="dm-branch-path" d="M300,600 Q200,480 260,350 T180,150" />
        <path class="dm-branch-path sub-1" d="M250,450 Q160,400 180,300" />
        <path class="dm-branch-path sub-2" d="M260,350 Q200,280 120,250" />
        <path class="dm-branch-path sub-1" d="M200,200 Q120,150 80,100" />
        <path class="dm-branch-path sub-2" d="M120,250 Q100,180 50,150" />

        <!-- Leaves -->
        ${createLeaf(200, 480, 1, -45)}
        ${createLeaf(250, 450, 0.8, 20)}
        ${createLeaf(160, 400, 1.2, -60)}
        ${createLeaf(200, 280, 0.9, 40)}
        ${createLeaf(120, 150, 1.1, 10)}

        <!-- Lots of Flowers -->
        ${createFlower(200, 480, 1.1)}
        ${createFlower(260, 350, 1)}
        ${createFlower(180, 150, 1.3)}
        ${createFlower(160, 400, 0.8)}
        ${createFlower(180, 300, 1.2)}
        ${createFlower(200, 280, 1)}
        ${createFlower(120, 250, 1.4)}
        ${createFlower(120, 150, 0.9)}
        ${createFlower(80, 100, 1.2)}
        ${createFlower(100, 180, 1.1)}
        ${createFlower(50, 150, 1.3)}
        ${createFlower(220, 420, 0.9)}
        ${createFlower(240, 320, 1)}
        ${createFlower(150, 220, 1.1)}
        ${createFlower(90, 120, 1)}
      </svg>
    </div>
  `;

  container.insertAdjacentHTML('beforeend', leftBranchHTML);
  container.insertAdjacentHTML('beforeend', rightBranchHTML);
});
