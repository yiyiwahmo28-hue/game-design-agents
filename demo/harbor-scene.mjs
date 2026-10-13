// Original vector artwork. Game rules and state transitions live in src/harbor.mjs.
const escapeXml = value => String(value).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[character]));

export function renderHarborScene({ boats = [], rescuedIds = [], prepared = false, stormProgress = 0, language = 'en' } = {}) {
  const positions = [[374, 156], [607, 182], [446, 299], [681, 320], [299, 282], [738, 119]];
  const rescued = new Set(rescuedIds);
  const labels = language === 'zh' ? {harbor:'雨港',boat:'救援艇',safe:'已救援'} : {harbor:'RAIN HARBOR',boat:'RESCUE',safe:'RESCUED'};
  const vessels = boats.map((boat, index) => {
    const [x, y] = positions[index % positions.length];
    const isRescued = rescued.has(boat.id);
    const name = language === 'zh' ? (boat.nameZh || boat.name || boat.id) : (boat.name || boat.id);
    return `<g class="harbor-vessel${isRescued ? ' is-rescued' : ''}" transform="translate(${x} ${y})">
      <ellipse cy="27" rx="51" ry="6" fill="#407c78" opacity=".12"/>
      <path d="M-39 8H39L29 24H-24Z" fill="${isRescued ? '#b1cbc2' : '#f8f6e9'}" stroke="#3c625a" stroke-width="2"/>
      <path d="M-18 8V-11H16L23 8Z" fill="${index % 2 ? '#d2a168' : '#94b6ac'}" stroke="#3c625a" stroke-width="2"/>
      <path d="M-10-5H-3V2H-10ZM3-5H10V2H3Z" fill="#fff7d4"/>
      <path d="M-28 13H26M-5-11V-24M-5-24H11L-5-16" fill="none" stroke="#3c625a" stroke-width="2"/>
      ${isRescued ? '<circle cx="33" cy="-17" r="13" fill="#1d6655"/><path d="m27-17 4 4 7-8" fill="none" stroke="#fff" stroke-width="2.4"/>' : '<circle cx="33" cy="-17" r="5" fill="#c88454" class="boat-beacon"/>'}
      <rect x="-66" y="36" width="132" height="24" rx="12" fill="#fbfaf3" opacity=".95"/>
      <text y="52" text-anchor="middle" fill="#39574f" font-family="system-ui,sans-serif" font-size="11" font-weight="650">${escapeXml(isRescued ? labels.safe : name)}</text>
    </g>`;
  }).join('');
  const front = 826 - Math.max(0, Math.min(1, stormProgress)) * 330;
  return `<svg class="harbor-art" viewBox="0 0 840 430" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id="harbor-water" x2="0" y2="1"><stop stop-color="#dae8df"/><stop offset="1" stop-color="#aacdc3"/></linearGradient>
      <linearGradient id="harbor-storm" x2="1" y2="0"><stop stop-color="#596e70" stop-opacity="0"/><stop offset="1" stop-color="#596e70" stop-opacity=".2"/></linearGradient>
      <pattern id="harbor-rain" width="58" height="56" patternUnits="userSpaceOnUse"><path d="m16 0-6 14m30 18-6 14" stroke="#5d8c81" stroke-width="1" opacity=".13"/></pattern>
    </defs>
    <rect width="840" height="430" fill="url(#harbor-water)"/>
    <path d="M0 112 77 63 133 91 214 45 298 97 384 54 470 98 568 57 664 88 733 46 840 104V0H0Z" fill="#e6ebe1"/>
    <path d="M0 126 77 92 161 126 242 83 322 126 401 101 487 130 569 100 669 134 741 108 840 127" fill="none" stroke="#c0d4c7" stroke-width="2"/>
    <path d="M0 0H141L151 69 205 91 220 150 178 184 199 228 159 275 115 279 91 328 0 341Z" fill="#bfccb5"/>
    <path d="M0 0H119L123 81 174 106 180 151 142 186 160 230 117 255 76 274 59 310 0 318Z" fill="#e3dfc5"/>
    <path d="M157 197H258V212H167M258 192V227M234 196V222M204 199V220" fill="none" stroke="#897f61" stroke-width="8"/>
    <path d="M67 134V91H107V135M60 91l27-21 27 21" fill="#f8f5e7" stroke="#697e67" stroke-width="2"/>
    <path d="M74 103H83V114H74M92 103H100V114H92" fill="#d9b973"/>
    <path d="m125 156 7-43h24l7 43M127 113h35l-17-17Z" fill="#f4f1da" stroke="#637864" stroke-width="2"/>
    <path d="M135 125H153V135H135" fill="#e4c279"/>
    <path d="m144 124 144-40-4 14-140 36Z" fill="#f8e7ab" opacity=".26"/>
    <path d="M23 167h23M29 160v15M20 228h25M26 220v16M104 35h22M110 27v17" stroke="#7d9976" stroke-width="3"/>
    <text x="24" y="49" fill="#697d63" font-family="system-ui,sans-serif" font-size="12" font-weight="700" letter-spacing="2">${labels.harbor}</text>
    <path d="M259 217C287 142 295 136 351 145M258 216C362 223 367 260 417 279M270 222C415 204 454 156 577 171" fill="none" stroke="#749b8e" stroke-width="1.5" stroke-dasharray="5 8" opacity=".5"/>
    <g transform="translate(248 239)"><ellipse cy="16" rx="33" ry="6" fill="#356c61" opacity=".16"/><path d="M-31 2H29L19 17H-22Z" fill="#1d6655"/><path d="M-15 2V-17H11L18 2Z" fill="#f4f2d8" stroke="#1d6655" stroke-width="2"/><path d="M-8-11H3V-3H-8" fill="#94b4a4"/>${prepared ? '<path d="M-19 3H22" stroke="#e5b974" stroke-width="5"/>' : ''}<text x="-2" y="38" text-anchor="middle" font-family="system-ui,sans-serif" font-size="10" letter-spacing="1.4" font-weight="700" fill="#356454">${labels.boat}</text></g>
    ${vessels}
    <g fill="none" stroke="#eaf4eb" stroke-width="2" opacity=".55" class="harbor-waves"><path d="M329 370h62m123-130h35m186 147h74M40 371h50m479 38h72m-298-30h22m420-133h40"/></g>
    <path d="M${front} 0H840V430H${front - 52}Z" fill="url(#harbor-storm)"/>
    <rect width="840" height="430" fill="url(#harbor-rain)"/>
  </svg>`;
}
