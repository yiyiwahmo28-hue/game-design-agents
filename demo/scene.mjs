// Original SVG artwork. Movement reflects game state; it does not simulate rules.
const sceneMarkup = `<svg viewBox="0 0 840 445" role="img" aria-labelledby="scene-title scene-description">
  <title id="scene-title">Lantern Expedition</title><desc id="scene-description">A small lighthouse island and an expedition boat charting nearby routes.</desc>
  <defs><linearGradient id="sea" x2="0" y2="1"><stop stop-color="#eef6ee"/><stop offset="1" stop-color="#dceee4"/></linearGradient><linearGradient id="island-edge" x2="0" y2="1"><stop stop-color="#97b3a0"/><stop offset="1" stop-color="#6e9284"/></linearGradient><radialGradient id="lamp-halo"><stop stop-color="#efc674" stop-opacity=".8"/><stop offset="1" stop-color="#efc674" stop-opacity="0"/></radialGradient></defs>
  <rect width="840" height="445" fill="url(#sea)"/>
  <g fill="none" stroke="#afcfc0" stroke-width="2" opacity=".65" class="scene-wave"><path d="M25 140h32m-12 9h24M610 52h33m-13 9h29M682 336h30m-10 8h28M42 352h31m-8 9h29M418 69h23M574 390h37"/></g>
  <g fill="#fff" opacity=".65"><path d="M93 55c0-12 16-16 23-8 8-14 30-11 34 3 17-3 23 14 13 18H89c-8-3-6-11 4-13Z"/><path d="M607 111c0-10 11-14 17-8 6-10 24-10 28 3 13-3 19 11 10 15h-60c-7-3-3-10 5-10Z"/></g>
  <ellipse cx="284" cy="304" rx="177" ry="59" fill="#aacabc" opacity=".36"/>
  <path d="M126 260c12-35 74-62 117-66 37-5 74 10 89 19 38 2 72 20 93 46 13 17 7 40-20 55-40 23-139 26-213 10-59-14-77-36-66-64Z" fill="url(#island-edge)"/>
  <path d="M120 248c16-38 75-61 119-66 34-4 69 12 90 22 34-1 77 17 95 40 15 19 3 40-22 50-46 19-145 24-210 9-55-13-82-34-72-55Z" fill="#e5dabb"/>
  <path d="M140 243c29-32 69-40 106-44l65 26 56-8 38 26-62 27-87-5-65 18-60-23Z" fill="#bac6a0"/>
  <path d="M231 214c5 22 25 28 38 46 9 12 9 24 30 34" fill="none" stroke="#f6ebcf" stroke-width="12" stroke-linecap="round"/>
  <path d="M171 252c8-5 15-2 17 4l-7 11-18-3Z" fill="#8ea487"/><path d="m372 252 17 5-2 14-23-2-4-10Z" fill="#9dad91"/>
  <g fill="#3f7564"><path d="m195 166-17 29h9l-14 25h39l-13-25h10Z"/><path d="m169 182-13 24h7l-10 19h29l-10-19h7Z"/><path d="m374 191-14 24h7l-11 22h32l-11-22h8Z"/></g><g stroke="#577c63" stroke-width="4"><path d="M195 216v14M169 222v8M374 234v8"/></g>
  <g><path d="m236 242 76-3 15 22-105 4Z" fill="#aaa083"/><path d="m250 155 45-3 14 90-71 3Z" fill="#f9f7eb" stroke="#667a6b" stroke-width="2"/><path d="m252 152 12-58h21l8 57Z" fill="#fffdf1" stroke="#667a6b" stroke-width="2"/><path d="m248 152 48-1 6 12-58 2Z" fill="#dc8b68"/><path d="m242 234 67-2 3 11-75 2Z" fill="#dc8b68"/><path d="M268 207h12v31h-12Z" fill="#527668"/><path d="M268 171h10v16h-10Z" fill="#528876"/>
  <circle class="lantern-glow" cx="275" cy="95" r="54" fill="url(#lamp-halo)" opacity=".25"/><path id="light-beam" class="scene-light" d="m288 91 206-56v115l-206-47Z" fill="#f1c778" opacity=".18"/>
  <path d="M261 80h28v24h-28Z" fill="#f0ca7e" stroke="#597b6a" stroke-width="2"/><path d="M256 78h38l-19-17Z" fill="#3b7161"/><path d="M255 106h39M260 108l-3 10h36l-3-10" fill="none" stroke="#567e69" stroke-width="3"/><path d="M275 62V51" stroke="#567e69" stroke-width="2"/><path d="m276 51 15 3-15 6" class="finish-flag" fill="#b8cbbb"/>
  <g id="level-marks" fill="#6a9582"></g></g>
  <g transform="translate(159 272)"><path d="m0 0 28-3 17 10-32 6Z" fill="#b68756"/><path d="m3-8 29-2 9 10-35 3Z" fill="#ceaa76"/><path d="m17-9 3 12" stroke="#f7ebcd" stroke-width="3"/></g>
  <g class="gather-spark" fill="#d6a53c"><path d="m180 244 3-7 3 7 7 3-7 3-3 7-3-7-7-3Z"/><circle cx="162" cy="238" r="3"/><circle cx="194" cy="230" r="2"/></g>
  <g opacity=".8"><path d="m594 209 30-31 24 22 29 4 10 14-40 14-47-8Z" fill="#a6b89c"/><path d="m624 178 10 27 14-5Z" fill="#859d88"/><path d="m699 86 20-27 27 32-13 16-37-7Z" fill="#b1c3a5"/><path d="m719 59 2 33 25-1Z" fill="#8ea991"/><path d="m676 322 19-15 30 5 17 19-18 15-43-5Z" fill="#acbd9d"/></g>
  <path d="M400 291C488 289 489 188 559 179S675 177 711 123" fill="none" stroke="#accaba" stroke-width="1.5" stroke-dasharray="5 6"/>
  <g id="route-nodes"></g>
  <g id="expedition-boat" class="scene-boat"><ellipse cx="0" cy="14" rx="28" ry="6" fill="#9ac1b2" opacity=".5"/><path d="m-24 1 48 0-9 15h-28Z" fill="#47796a"/><path d="M-1 0v-43" stroke="#546f62" stroke-width="2"/><path d="M3-38 3-3h19Z" fill="#fff9df"/><path d="m-4-30-15 27h15Z" fill="#e2ae76"/><path d="M-24 1h48" stroke="#315d51" stroke-width="2"/></g>
</svg>`;

export function createScene(container) {
  container.innerHTML = sceneMarkup;
  const svg = container.querySelector('svg');
  const nodes = container.querySelector('#route-nodes');
  const boat = container.querySelector('#expedition-boat');
  const marks = container.querySelector('#level-marks');
  let lastGoal = null;
  let actionTimer;
  const positions = count => Array.from({ length: count }, (_, index) => {
    const fraction = count === 1 ? 1 : index / (count - 1);
    return { x: 430 + fraction * 297, y: 292 - fraction * 168 + Math.sin(fraction * Math.PI * 2) * 19 };
  });
  return {
    update(state, config, title, description) {
      container.querySelector('#scene-title').textContent = title;
      container.querySelector('#scene-description').textContent = description;
      if (lastGoal !== config.exploreGoal) {
        const points = positions(config.exploreGoal);
        nodes.innerHTML = points.map((point, index) => `<g class="scene-route-node" data-route="${index + 1}" transform="translate(${point.x} ${point.y})"><circle class="node-circle" r="10" fill="#f8faf3" stroke="#b4cabb" stroke-width="1.5"/><text class="node-number" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI, sans-serif" font-size="8" fill="#718f7d">${index + 1}</text></g>`).join('');
        lastGoal = config.exploreGoal;
      }
      for (const node of nodes.children) {
        const route = Number(node.dataset.route);
        node.classList.toggle('is-explored', route <= state.explored);
        node.classList.toggle('is-next', route === state.explored + 1);
      }
      const progress = Math.min(1, state.explored / config.exploreGoal);
      const x = 416 + progress * 296;
      const y = 313 - progress * 167 + Math.sin(progress * Math.PI * 2) * 19;
      boat.style.transform = `translate(${x}px, ${y}px)`;
      container.querySelector('#light-beam').style.opacity = String(.1 + .4 * state.level / config.upgradeCosts.length);
      marks.innerHTML = Array.from({ length: state.level }, (_, index) => `<rect x="${245 + index * 17}" y="223" width="10" height="4" rx="1"/>`).join('');
      svg.classList.toggle('scene-complete', state.completed);
    },
    showAction(action) {
      clearTimeout(actionTimer);
      delete container.dataset.action;
      // Restart only the game-action feedback, never an agent status animation.
      void container.offsetWidth;
      container.dataset.action = action;
      actionTimer = setTimeout(() => { delete container.dataset.action; }, 750);
    }
  };
}
