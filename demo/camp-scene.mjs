const tree = (x, y, scale = 1) => `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M-2 0h4v14h-4z" fill="#877b5a"/><path d="m0-37-15 23h7l-13 18h42L8-14h7Z" fill="#779177"/><path d="m0-37 15 23H8L21 4H0Z" fill="#66856c"/></g>`;
const person = (x, y) => `<g transform="translate(${x} ${y})"><circle cy="-10" r="3.5" fill="#ba895c"/><path d="M-5-5h10l1 10H-6Z" fill="#d2a454"/><path d="M-3 5v6m6-6v6" stroke="#52645a" stroke-width="2.5"/></g>`;

// Decorative rendering reads real state; it does not implement game rules.
export function renderCampScene(state, config) {
  const beacon = state.modules.includes('beacon');
  const kit = state.modules.includes('survey-kit');
  const signaled = state.missions.some(mission => mission.id === 'signal');
  const earlyEnd = config.missions.signal.earlyThroughTurn;
  const boatPresent = state.turn < earlyEnd;
  return `<svg class="camp-art" viewBox="0 0 640 200" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
    <rect width="640" height="200" fill="#e7eddd"/>
    <circle cx="519" cy="31" r="25" fill="#f3e2b0"/>
    <path d="M0 84 78 27l71 46 62-35 75 48 82-63 68 55 57-24 71 41 76-42v147H0Z" fill="#c5d3bf"/>
    <path d="M0 127 81 66l64 41 88-42 99 53 83-65 75 61 150-29v115H0Z" fill="#b6c9b0"/>
    <path d="M0 129c66-38 123-40 194-8s171 11 226-4 145-23 220-12v95H0Z" fill="#9ab59a"/>
    <path d="M0 120c79-15 118 12 139 34s56 23 93 46H0Z" fill="#89b2ad"/>
    <path d="M0 138c71-13 118 16 149 45M6 169c56-7 88 12 111 31" fill="none" stroke="#b0ccc0" stroke-width="3"/>
    <path d="M128 200c27-45 106-46 152-57s90-28 149-15 120 29 211 15v57Z" fill="#d5d8b4"/>
    <path d="M153 200c42-36 85-38 127-40s80-17 100-37" fill="none" stroke="#eee0bd" stroke-width="17"/>
    ${['M420 184c43-34 77-29 117-44','M450 187c60-11 95-6 153-26','M444 181c31-47 50-52 82-74'].map((route,index) => `<path d="${route}" fill="none" stroke="${index < state.routes ? '#f4ecd0' : '#bacaa9'}" stroke-width="${index < state.routes ? 5 : 3}" stroke-dasharray="${index < state.routes ? '0' : '5 5'}"/>`).join('')}
    ${[[32,103,1],[71,96,.7],[121,118,.85],[218,94,.9],[253,104,.65],[366,87,.75],[568,93,.8],[607,101,1],[538,117,.65],[20,191,.9],[609,194,.8]].map(args => tree(...args)).join('')}
    <ellipse cx="323" cy="156" rx="65" ry="13" fill="#8eaa88" opacity=".32"/>
    <path d="m280 150 42-62 48 63Z" fill="#d7ba74"/><path d="m322 88 8 63h40Z" fill="#c4a265"/><path d="m322 110-18 41h36Z" fill="#647664"/><path d="m275 155 101 1" stroke="#927c54" stroke-width="3"/><path d="M322 83v12m-50 58 11-12m91 13-11-13" stroke="#836e4f" stroke-width="2"/>
    <g transform="translate(228 141)"><ellipse cx="0" cy="8" rx="23" ry="7" fill="#8fab87" opacity=".4"/>
      ${beacon ? '<path d="M-13 6h26L7-48H-6Z" fill="#b49364"/><path d="M-13 6 7-48M13 6-6-48M-10-8h20M-7-25H7" fill="none" stroke="#ead6a8" stroke-width="2"/><path d="M-12-52h24v10h-24Z" fill="#596f5b"/><circle cy="-48" r="5" fill="#ffdf81"/><path d="M-21-61q-10 13 0 25m42-25q10 13 0 25" fill="none" stroke="#f4df9a" stroke-width="3"/>' : '<path d="M-16 8h32m-25-3 9-10 9 10" fill="none" stroke="#9baa89" stroke-width="2" stroke-dasharray="3 3"/>'}
    </g>
    <g transform="translate(420 147)"><ellipse cx="0" cy="12" rx="28" ry="7" fill="#8fab87" opacity=".4"/>
      ${kit ? '<path d="M-19-3h38v15h-38Z" fill="#9c845d"/><path d="M-22-6h44v5h-44Z" fill="#c4aa78"/><path d="M-13-6 3-17 20-10 10-1Z" fill="#f3e4b5"/><path d="m-4-7 6-5 9 5" fill="none" stroke="#769678" stroke-width="2"/><path d="M-15 14v7m30-7v7" stroke="#7f7056" stroke-width="3"/>' : '<path d="M-18 13h36m-22-7 7-6 9 7" fill="none" stroke="#9baa89" stroke-width="2" stroke-dasharray="3 3"/>'}
    </g>
    ${boatPresent ? `<g transform="translate(${signaled ? 104 : 68} 150)"><path d="M-24 0h48l-9 11h-29Z" fill="#e6dac0"/><path d="M-12 0v-10h23V0" fill="#8e9e85"/><path d="M-5-11v-12" stroke="#6d7c66" stroke-width="2"/><path d="M-5-23 9-17H-5Z" fill="#d0ad67"/></g>` : '<path d="m55 152 18-1m-7 10 24-1" fill="none" stroke="#bed3c4" stroke-width="2"/>'}
    ${person(304,170)}${person(342,173)}${Array.from({length:state.people},(_,index) => person(161 + index * 11,176 + (index % 2) * 4)).join('')}
    <path d="M347 174h11l-5-13Z" fill="#cb854c"/><path d="M347 177h13" stroke="#9b7f50" stroke-width="3"/>
    ${[[483,155],[563,168],[506,133]].slice(0,state.routes).map(([x,y]) => `<path transform="translate(${x} ${y})" d="M0 0v-14h14l-7 6H0" fill="#d19d4c" stroke="#89784e" stroke-width="1"/>`).join('')}
  </svg>`;
}
