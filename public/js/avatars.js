// Profile pictures: original illustrated characters drawn as small SVGs (no photos, no animals).
// People of different looks, plus characters that suit everyone. Colours of the circle come from the student's choice.
const SKIN = ['#f7d6bd', '#eab98f', '#c98f64', '#94613f', '#603c27'];
const o = (s) => s; // readability

// pieces ---------------------------------------------------------------------------------------
const HAIR_BACK = {
  long: (c) => `<path d="M31 42C27 22 40 16 50 16C60 16 73 22 69 42L73 84C60 90 40 90 27 84Z" fill="${c}"/>`,
  bob: (c) => `<path d="M31 42C27 20 40 16 50 16C60 16 73 20 69 42L70 64C60 69 40 69 30 64Z" fill="${c}"/>`,
  afro: (c) => `<circle cx="50" cy="35" r="25" fill="${c}"/>`,
  ponytail: (c) => `<path d="M64 34C84 32 88 58 76 72C76 60 72 50 66 46Z" fill="${c}"/>`,
  curlyback: (c) => `<circle cx="32" cy="46" r="8" fill="${c}"/><circle cx="68" cy="46" r="8" fill="${c}"/><circle cx="30" cy="56" r="6" fill="${c}"/><circle cx="70" cy="56" r="6" fill="${c}"/>`,
};
const HAIR_FRONT = {
  short: (c) => `<path d="M33 42C30 24 43 19 52 20C66 20 71 31 67 42C64 34 58 31 50 31C43 31 36 34 33 42Z" fill="${c}"/>`,
  quiff: (c) => `<path d="M32 42C27 26 39 15 55 16C70 17 74 31 68 42C66 34 60 29 52 28C44 28 38 33 32 42Z" fill="${c}"/><path d="M44 21C52 12 66 14 70 22C62 18 52 18 44 21Z" fill="${c}"/>`,
  buzz: (c) => `<path d="M33 40C34 27 42 23 50 23C58 23 66 27 67 40C63 32 57 30 50 30C43 30 37 32 33 40Z" fill="${c}"/>`,
  curly: (c) => `<circle cx="35" cy="37" r="7" fill="${c}"/><circle cx="43" cy="29" r="8" fill="${c}"/><circle cx="54" cy="27" r="8" fill="${c}"/><circle cx="63" cy="32" r="7" fill="${c}"/><circle cx="67" cy="41" r="5" fill="${c}"/><circle cx="33" cy="45" r="4" fill="${c}"/>`,
  fringe: (c) => `<path d="M32 42C31 25 42 19 52 20C63 20 69 29 68 42C62 33 46 33 32 42Z" fill="${c}"/>`,
  sidepart: (c) => `<path d="M32 43C29 25 42 18 54 19C66 20 71 30 68 43C66 35 58 28 46 29C38 30 34 36 32 43Z" fill="${c}"/>`,
  bun: (c) => `<circle cx="50" cy="15" r="8" fill="${c}"/><path d="M33 42C30 24 43 19 52 20C66 20 71 31 67 42C64 34 58 31 50 31C43 31 36 34 33 42Z" fill="${c}"/>`,
  pixie: (c) => `<path d="M32 43C27 24 42 15 56 17C70 19 74 32 68 43C65 35 60 31 50 33C42 34 36 36 32 43Z" fill="${c}"/><path d="M32 43C30 36 34 30 40 28C36 33 36 38 32 43Z" fill="${c}"/>`,
};
const FACE = (skin, { brow = '#2a2140', smile = '#8a3b3b', blush = true, eyes = '#2a2140' } = {}) => `
  <rect x="44.5" y="58" width="11" height="14" rx="4" fill="${skin}"/>
  <ellipse cx="50" cy="44" rx="16.5" ry="18.5" fill="${skin}"/>
  <ellipse cx="33.6" cy="46" rx="3" ry="4.3" fill="${skin}"/><ellipse cx="66.4" cy="46" rx="3" ry="4.3" fill="${skin}"/>
  <circle cx="43" cy="45" r="1.9" fill="${eyes}"/><circle cx="57" cy="45" r="1.9" fill="${eyes}"/>
  <path d="M39.5 40.5Q43 38.7 46.5 40.3M53.5 40.3Q57 38.7 60.5 40.5" stroke="${brow}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
  <path d="M44 53Q50 58.5 56 53" stroke="${smile}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  ${blush ? `<circle cx="39" cy="51" r="2.6" fill="#ff7a6b" opacity=".22"/><circle cx="61" cy="51" r="2.6" fill="#ff7a6b" opacity=".22"/>` : ''}`;
const BODY = (c, collar = '') => `<path d="M14 100C14 77 29 69 50 69C71 69 86 77 86 100Z" fill="${c}"/>${collar}`;
const GLASSES = (c = '#2a2140') => `<g fill="none" stroke="${c}" stroke-width="1.6"><circle cx="43" cy="45" r="5.6"/><circle cx="57" cy="45" r="5.6"/><path d="M48.6 45h2.8"/></g>`;
const SHADES = `<g fill="#1d1836"><rect x="35.5" y="41" width="13" height="8" rx="3.5"/><rect x="51.5" y="41" width="13" height="8" rx="3.5"/></g><path d="M48.5 44h3" stroke="#1d1836" stroke-width="1.6"/><path d="M38 43l4-1.4" stroke="#fff" stroke-width="1" opacity=".5" stroke-linecap="round"/>`;
const HEADPHONES = (c = '#ff7a6b') => `<path d="M32 44C30 22 70 22 68 44" fill="none" stroke="${c}" stroke-width="3.4" stroke-linecap="round"/><rect x="27.5" y="41" width="7" height="12" rx="3.4" fill="${c}"/><rect x="65.5" y="41" width="7" height="12" rx="3.4" fill="${c}"/>`;
const BEARD = (c) => `<path d="M34 50C34 66 42 69 50 69C58 69 66 66 66 50C62 58 56 60 50 60C44 60 38 58 34 50Z" fill="${c}"/><path d="M44 54Q50 58.5 56 54" stroke="#8a3b3b" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
const FRECKLES = `<g fill="#b9683c" opacity=".55"><circle cx="40" cy="49" r=".8"/><circle cx="43" cy="51" r=".8"/><circle cx="38" cy="52" r=".8"/><circle cx="60" cy="49" r=".8"/><circle cx="57" cy="51" r=".8"/><circle cx="62" cy="52" r=".8"/></g>`;

const person = ({ skin = 1, back = '', front = '', hair = '#2b2233', top = '#5b6cff', collar = '', extra = '', afterFace = '', faceOpts }) =>
  `${back}${BODY(top, collar)}${FACE(SKIN[skin], faceOpts)}${afterFace}${front}${extra}`;

// the set -----------------------------------------------------------------------------------------
const LIST = [
  // ---- boys / men
  ['m1', 'Bookworm', 'men', () => person({ skin: 1, front: HAIR_FRONT.short('#1f1a2e'), top: '#3b82f6', extra: GLASSES() })],
  ['m2', 'Doppi', 'men', () => person({ skin: 1, top: '#2fb59a', collar: '<path d="M42 70L50 82L58 70Z" fill="#fff"/>',
    extra: `<path d="M32 36C32 22 68 22 68 36L68 40C60 36 40 36 32 40Z" fill="#14122b"/><path d="M32 34C40 31 60 31 68 34L68 38C60 35 40 35 32 38Z" fill="#fff"/><g fill="#fff"><circle cx="40" cy="27.5" r="1.6"/><circle cx="50" cy="26" r="1.6"/><circle cx="60" cy="27.5" r="1.6"/></g>` })],
  ['m3', 'Beat maker', 'men', () => person({ skin: 2, front: HAIR_FRONT.quiff('#3b2418'), top: '#8b5cf6', extra: HEADPHONES('#ffb84d') })],
  ['m4', 'Full beard', 'men', () => person({ skin: 0, front: HAIR_FRONT.curly('#5a3320'), top: '#f06b4d', afterFace: BEARD('#5a3320') })],
  ['m5', 'Sunny', 'men', () => person({ skin: 3, front: HAIR_FRONT.buzz('#15121f'), top: '#ffb84d', collar: '<path d="M40 70Q50 80 60 70" stroke="#fff" stroke-width="3" fill="none"/>' })],
  ['m6', 'Afro band', 'men', () => person({ skin: 4, back: HAIR_BACK.afro('#14111c'), front: HAIR_FRONT.fringe('#14111c'), top: '#2dd4bf', extra: '<path d="M26 31C40 22 60 22 74 31" stroke="#ff4d8d" stroke-width="3.4" fill="none" stroke-linecap="round"/>' })],
  ['m7', 'Gentleman', 'men', () => person({ skin: 0, front: HAIR_FRONT.sidepart('#8a5a2b'), top: '#27224d', collar: '<path d="M43 70L50 90L57 70Z" fill="#fff"/><path d="M48.4 75h3.2L53 90l-3 3-3-3Z" fill="#e0405f"/>' })],
  ['m8', 'Red cap', 'men', () => person({ skin: 0, front: HAIR_FRONT.short('#c2531f'), top: '#4b5563', afterFace: FRECKLES,
    extra: '<path d="M31 37C32 21 68 21 69 37Z" fill="#e0405f"/><path d="M62 35H80C80 40 70 40 66 38Z" fill="#b92f4a"/><circle cx="50" cy="22.5" r="1.8" fill="#fff"/>' })],
  // ---- girls / women
  ['f1', 'Long hair', 'women', () => person({ skin: 1, back: HAIR_BACK.long('#1d1530'), front: HAIR_FRONT.sidepart('#1d1530'), top: '#ec4899' })],
  ['f2', 'Scarf', 'women', () => person({ skin: 1, top: '#6d5cff',
    back: '<path d="M27 46C25 18 75 18 73 46L77 92C64 98 36 98 23 92Z" fill="#ff8fb1"/>',
    extra: '<path d="M32 45C31 26 69 26 68 45C64 36 36 36 32 45Z" fill="#ff8fb1"/><path d="M33 60C42 70 58 70 67 60L74 92C62 98 38 98 26 92Z" fill="#ff8fb1" opacity=".95"/>' })],
  ['f3', 'Scholar', 'women', () => person({ skin: 2, front: HAIR_FRONT.bun('#2a1a14'), top: '#14b8a6', extra: GLASSES('#e0405f') })],
  ['f4', 'Artist beret', 'women', () => person({ skin: 0, back: HAIR_BACK.bob('#c0392b'), front: HAIR_FRONT.fringe('#c0392b'), top: '#fbbf24',
    extra: '<ellipse cx="55" cy="25" rx="19" ry="8" fill="#1f2a5a" transform="rotate(-10 55 25)"/><circle cx="62" cy="17" r="2.2" fill="#1f2a5a"/>' })],
  ['f5', 'Curls', 'women', () => person({ skin: 3, back: HAIR_BACK.curlyback('#1a1320') + '<circle cx="50" cy="30" r="22" fill="#1a1320"/>', front: HAIR_FRONT.curly('#1a1320'), top: '#a78bfa', extra: '<g fill="#ffd166"><circle cx="31" cy="52" r="1.8"/><circle cx="69" cy="52" r="1.8"/></g>' })],
  ['f6', 'Sporty', 'women', () => person({ skin: 2, back: HAIR_BACK.ponytail('#3b2418'), front: HAIR_FRONT.short('#3b2418'), top: '#22c55e', extra: '<path d="M32 36C40 30 60 30 68 36" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round"/>' })],
  ['f7', 'Blossom', 'women', () => person({ skin: 0, back: HAIR_BACK.long('#f2c14e'), front: HAIR_FRONT.sidepart('#f2c14e'), top: '#60a5fa',
    extra: '<g transform="translate(62 28)"><g fill="#ff7a9c"><circle cx="0" cy="-4" r="3.2"/><circle cx="4" cy="0" r="3.2"/><circle cx="0" cy="4" r="3.2"/><circle cx="-4" cy="0" r="3.2"/></g><circle r="2.2" fill="#ffd166"/></g>' })],
  ['f8', 'Pixie', 'women', () => person({ skin: 1, front: HAIR_FRONT.pixie('#ff6fb5'), top: '#0ea5e9', extra: '<g fill="#fff"><circle cx="31" cy="52" r="1.6"/><circle cx="69" cy="52" r="1.6"/></g>' })],
  // ---- for everyone
  ['n1', 'Robot', 'everyone', () => `<path d="M14 100C14 78 29 70 50 70C71 70 86 78 86 100Z" fill="#7c8aa5"/><rect x="48" y="14" width="4" height="10" fill="#9aa7bf"/><circle cx="50" cy="12" r="4" fill="#ff4d6d"/><rect x="29" y="24" width="42" height="38" rx="11" fill="#b8c4dc"/><rect x="35" y="35" width="30" height="14" rx="7" fill="#1d2440"/><circle cx="43" cy="42" r="3.4" fill="#5eead4"/><circle cx="57" cy="42" r="3.4" fill="#5eead4"/><path d="M42 55h16" stroke="#1d2440" stroke-width="2.4" stroke-linecap="round"/><rect x="24" y="36" width="5" height="14" rx="2.5" fill="#7c8aa5"/><rect x="71" y="36" width="5" height="14" rx="2.5" fill="#7c8aa5"/>`],
  ['n2', 'Astronaut', 'everyone', () => `<path d="M12 100C12 76 28 68 50 68C72 68 88 76 88 100Z" fill="#e8ecf6"/><rect x="40" y="86" width="20" height="8" rx="3" fill="#ff7a6b"/><circle cx="50" cy="42" r="26" fill="#f1f4fb"/><circle cx="50" cy="42" r="20" fill="#27305c"/><path d="M36 36C40 28 52 26 60 31" stroke="#8fb4ff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><circle cx="44" cy="45" r="2" fill="#fff"/><circle cx="56" cy="45" r="2" fill="#fff"/><path d="M45 52Q50 56 55 52" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/><rect x="22" y="38" width="6" height="12" rx="3" fill="#ff7a6b"/><rect x="72" y="38" width="6" height="12" rx="3" fill="#ff7a6b"/>`],
  ['n3', 'Alien', 'everyone', () => `<path d="M16 100C16 80 30 72 50 72C70 72 84 80 84 100Z" fill="#7c3aed"/><path d="M50 14C74 14 78 40 66 56C60 64 40 64 34 56C22 40 26 14 50 14Z" fill="#7be495"/><ellipse cx="40" cy="40" rx="7.5" ry="10" fill="#14122b" transform="rotate(-18 40 40)"/><ellipse cx="60" cy="40" rx="7.5" ry="10" fill="#14122b" transform="rotate(18 60 40)"/><circle cx="37.5" cy="36" r="2" fill="#fff"/><circle cx="57.5" cy="36" r="2" fill="#fff"/><path d="M44 56Q50 60 56 56" stroke="#14122b" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M42 16L38 6M58 16L62 6" stroke="#7be495" stroke-width="2.4" stroke-linecap="round"/><circle cx="38" cy="5" r="2.6" fill="#ffd166"/><circle cx="62" cy="5" r="2.6" fill="#ffd166"/>`],
  ['n4', 'Ninja', 'everyone', () => `<path d="M14 100C14 78 29 70 50 70C71 70 86 78 86 100Z" fill="#1f2937"/><ellipse cx="50" cy="44" rx="19" ry="21" fill="#111827"/><rect x="31" y="35" width="38" height="14" rx="7" fill="${SKIN[1]}"/><circle cx="43" cy="42" r="2.2" fill="#14122b"/><circle cx="57" cy="42" r="2.2" fill="#14122b"/><path d="M38 38l5 1.4M62 38l-5 1.4" stroke="#14122b" stroke-width="1.6" stroke-linecap="round"/><path d="M69 36C80 32 86 38 90 48C82 44 76 44 70 44Z" fill="#e0405f"/><path d="M30 44H70" stroke="#e0405f" stroke-width="3" opacity="0"/>`],
  ['n5', 'Wizard', 'everyone', () => person({ skin: 2, top: '#4c1d95', front: '<path d="M34 42C40 38 60 38 66 42Z" fill="#e5e7eb"/>', afterFace: '<path d="M38 56C40 70 60 70 62 56C58 60 42 60 38 56Z" fill="#e5e7eb"/>',
    extra: '<path d="M25 36C40 34 60 34 75 36C70 32 60 8 50 6C42 12 34 30 25 36Z" fill="#4c1d95"/><path d="M26 35C44 40 56 40 74 35L74 38C56 43 44 43 26 38Z" fill="#a78bfa"/><path d="M50 14l1.6 3.4 3.6.4-2.7 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.5 3.6-.4Z" fill="#ffd166"/>' })],
  ['n6', 'Hoodie', 'everyone', () => `<path d="M12 100C12 76 28 68 50 68C72 68 88 76 88 100Z" fill="#ff8a5b"/><path d="M26 44C24 14 76 14 74 44L72 62C64 68 36 68 28 62Z" fill="#ff8a5b"/><path d="M28 24L34 8L44 20ZM72 24L66 8L56 20Z" fill="#ff8a5b"/><ellipse cx="50" cy="45" rx="17" ry="19" fill="${SKIN[2]}"/><circle cx="43" cy="45" r="1.9" fill="#2a2140"/><circle cx="57" cy="45" r="1.9" fill="#2a2140"/><path d="M44 53Q50 58.5 56 53" stroke="#8a3b3b" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M45 70v14M55 70v14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>`],
  ['n7', 'Cool shades', 'everyone', () => person({ skin: 3, front: '<path d="M30 40C28 22 72 22 70 40C66 32 60 30 50 30C40 30 34 32 30 40Z" fill="#14b8a6"/><path d="M32 38C34 26 66 26 68 38C64 30 36 30 32 38Z" fill="#0f766e"/>', top: '#111827', extra: SHADES, faceOpts: { blush: false } })],
  ['n8', 'Rainbow', 'everyone', () => person({ skin: 0, front: '<path d="M32 43C29 25 42 17 54 18C66 19 71 30 68 43C66 35 58 28 46 29C38 30 34 36 32 43Z" fill="#7c5cff"/><path d="M54 18C66 19 71 30 68 43C67 33 62 26 54 18Z" fill="#ff4d8d"/><path d="M32 43C30 31 36 23 45 20C38 26 36 34 38 40C36 40 34 41 32 43Z" fill="#2dd4bf"/>', top: '#fbbf24', extra: '<path d="M40 22l2 4M48 18l1 5M58 20l-1 4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>' })],
];

export const AVATARS = LIST.map(([id, label, group, draw]) => ({ id, label, group }));
export const AVATAR_GROUPS = [['men', 'Boys and men'], ['women', 'Girls and women'], ['everyone', 'For everyone']];
const cache = new Map();
export function avatarSvg(id) {
  const item = LIST.find((x) => x[0] === id);
  if (!item) return '';
  if (!cache.has(id)) cache.set(id, `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" role="img" aria-label="${item[1]}">${item[3]()}</svg>`);
  return cache.get(id);
}
export const hasAvatar = (id) => LIST.some((x) => x[0] === id);
export const randomAvatarId = () => LIST[Math.floor(Math.random() * LIST.length)][0];

// For the poster image: a cached <img> of the avatar, drawn once it has loaded.
const imgs = new Map();
export function avatarImage(id, onload) {
  if (!hasAvatar(id)) return null;
  if (!imgs.has(id)) { const im = new Image(); im.onload = () => onload?.(); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSvg(id).replace('width="100%" height="100%"', 'width="400" height="400"')); imgs.set(id, im); }
  const im = imgs.get(id);
  return im.complete && im.naturalWidth ? im : null;
}
