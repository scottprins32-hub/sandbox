// All game content lives here: drivers, karts, gliders, items, tracks, cups.
// Stats are 1-5. weight affects bumping, speed top speed, accel how fast you get there,
// handling how sharp you turn.

export const CHARACTERS = [
  { id: 'pip',    name: 'Pip',    species: 'penguin', color: 0x2f6fde, accent: 0xffffff, cls: 'light',  start: true },
  { id: 'rosa',   name: 'Rosa',   species: 'bunny',   color: 0xff8fc4, accent: 0xffffff, cls: 'light',  start: true },
  { id: 'bruno',  name: 'Bruno',  species: 'bear',    color: 0x8a5a33, accent: 0xe8c89a, cls: 'heavy',  start: true },
  { id: 'mia',    name: 'Mia',    species: 'cat',     color: 0xff9a2e, accent: 0xfff1dc, cls: 'medium' },
  { id: 'kiki',   name: 'Kiki',   species: 'fox',     color: 0xe8541c, accent: 0xffffff, cls: 'light'  },
  { id: 'ribbit', name: 'Ribbit', species: 'frog',    color: 0x4cc23a, accent: 0xd9f7a6, cls: 'medium' },
  { id: 'hoot',   name: 'Hoot',   species: 'owl',     color: 0x7a4fc4, accent: 0xf2e4ff, cls: 'medium' },
  { id: 'rex',    name: 'Rex',    species: 'dino',    color: 0xf2a33a, accent: 0xfff0c2, cls: 'heavy'  },
  { id: 'bolt',   name: 'Bolt',   species: 'robot',   color: 0xa9b6c8, accent: 0x3ad1ff, cls: 'heavy'  },
  { id: 'mochi',  name: 'Mochi',  species: 'panda',   color: 0xf7f7f7, accent: 0x222222, cls: 'medium' },
  { id: 'duke',   name: 'Duke',   species: 'duck',    color: 0xffd23a, accent: 0xff8a1e, cls: 'light'  },
  { id: 'hamlet', name: 'Hamlet', species: 'pig',     color: 0xffa8b8, accent: 0xff7f98, cls: 'medium' },
  { id: 'luna',   name: 'Luna',   species: 'unicorn', color: 0xfaf4ff, accent: 0xc77dff, cls: 'light'  },
  { id: 'nana',   name: 'Nana',   species: 'monkey',  color: 0x9a6338, accent: 0xf0c9a0, cls: 'medium' },
  { id: 'coco',   name: 'Coco',   species: 'koala',   color: 0x9aa3ad, accent: 0xf0f0f0, cls: 'medium' },
  { id: 'leo',    name: 'Leo',    species: 'lion',    color: 0xf2c14e, accent: 0xb5651d, cls: 'heavy'  },
];

export const CLASS_STATS = {
  light:  { speed: 2, accel: 5, handling: 5, weight: 1 },
  medium: { speed: 3, accel: 3, handling: 3, weight: 3 },
  heavy:  { speed: 5, accel: 2, handling: 2, weight: 5 },
};

export const KARTS = [
  { id: 'classic',   name: 'Classic',    style: 'classic',   mod: { speed: 0,  accel: 0,  handling: 0 },  start: true },
  { id: 'buggy',     name: 'Buggy',      style: 'buggy',     mod: { speed: -1, accel: 1,  handling: 1 } },
  { id: 'bubble',    name: 'Bubble',     style: 'bubble',    mod: { speed: 0,  accel: 1,  handling: 0 } },
  { id: 'rocket',    name: 'Rocket',     style: 'rocket',    mod: { speed: 1,  accel: -1, handling: 0 } },
  { id: 'teacup',    name: 'Teacup',     style: 'teacup',    mod: { speed: -1, accel: 0,  handling: 2 } },
  { id: 'monster',   name: 'Big Wheels', style: 'monster',   mod: { speed: 1,  accel: 0,  handling: -1 } },
];

export const GLIDERS = [
  { id: 'wing',      name: 'Paper Wing', style: 'wing',      color: 0xffffff, start: true },
  { id: 'parasol',   name: 'Parasol',    style: 'parasol',   color: 0xff6fae },
  { id: 'leaf',      name: 'Big Leaf',   style: 'leaf',      color: 0x55c94a },
  { id: 'kite',      name: 'Kite',       style: 'kite',      color: 0xffb02e },
  { id: 'butterfly', name: 'Butterfly',  style: 'butterfly', color: 0x7b6cff },
  { id: 'cloud',     name: 'Cloud',      style: 'cloud',     color: 0xf4f8ff },
];

// Items. weight arrays are chances by race position group: [front, middle, back]
export const ITEMS = {
  peel:    { name: 'Peel',        icon: '🍌', w: [40, 15, 5]  },
  shell:   { name: 'Bounce Shell', icon: '🟢', w: [30, 20, 10] },
  seeker:  { name: 'Seeker',      icon: '🔴', w: [5, 25, 20]  },
  boost:   { name: 'Boost',       icon: '🚀', w: [15, 20, 20] },
  triple:  { name: 'Triple Boost', icon: '⏩', w: [0, 10, 20]  },
  star:    { name: 'Super Star',  icon: '⭐', w: [0, 5, 15]   },
  zap:     { name: 'Zap',         icon: '⚡', w: [0, 2, 8]    },
  coin:    { name: 'Coins',       icon: '🪙', w: [10, 3, 2]   },
};

// Tracks. Points are [x, z, y]. The road is a smooth loop through them.
// glide: [from, to] in point-index units (3.1 = just past point 3) where the road is missing and you glide.
// boxes / coins: fractions of the lap where rows are placed.
export const TRACKS = [
  {
    id: 'meadow', name: 'Meadow Loop', width: 16, laps: 3,
    theme: { sky: 0x8fd3ff, fog: 0xbfe6ff, ground: 0x6ccf5a, road: 0x5b5f6b, edgeA: 0xffffff, edgeB: 0xe8423f, wall: 0xffffff, deco: 'trees' },
    points: [[0,0,0],[90,-10,0],[160,30,0],[170,120,0],[110,170,0],[30,150,0],[-20,190,0],[-110,170,0],[-150,90,0],[-100,30,0]],
    boxes: [0.12, 0.42, 0.72], coins: [0.06, 0.25, 0.33, 0.55, 0.62, 0.85, 0.92],
  },
  {
    id: 'beach', name: 'Sunny Beach', width: 15, laps: 3,
    theme: { sky: 0x7fdcff, fog: 0xd6f4ff, ground: 0xf2dc9b, road: 0x6d6a73, edgeA: 0xffffff, edgeB: 0x18b5c9, wall: 0x2ec4b6, deco: 'palms', water: 0x2fb7e8 },
    points: [[0,0,2],[100,0,2],[170,-40,6],[230,20,14],[230,90,14],[160,130,4],[80,100,2],[20,160,2],[-70,140,2],[-110,60,2],[-80,10,2]],
    glide: [3.12, 3.88], boxes: [0.1, 0.45, 0.75], coins: [0.05, 0.18, 0.4, 0.52, 0.62, 0.82, 0.9],
  },
  {
    id: 'desert', name: 'Dusty Dunes', width: 16, laps: 3,
    theme: { sky: 0xffc98a, fog: 0xffe2b8, ground: 0xe8b46a, road: 0x8c6a4f, edgeA: 0xfff3d6, edgeB: 0xc0522a, wall: 0xd88b4a, deco: 'cactus' },
    points: [[0,0,0],[80,20,4],[150,0,0],[200,70,8],[160,150,2],[70,140,0],[30,200,6],[-60,190,0],[-120,120,0],[-150,40,4],[-80,-20,0]],
    boxes: [0.15, 0.48, 0.8], coins: [0.08, 0.3, 0.38, 0.58, 0.66, 0.9],
  },
  {
    id: 'snow', name: 'Frosty Peaks', width: 15, laps: 3,
    theme: { sky: 0xbcd7ef, fog: 0xe9f2fb, ground: 0xf4f8fc, road: 0x7a8597, edgeA: 0xffffff, edgeB: 0x3d7be0, wall: 0xcfe7ff, deco: 'pines', water: 0x9ccff0 },
    points: [[0,0,4],[90,-20,8],[170,10,18],[190,90,18],[130,150,6],[50,120,4],[-10,170,10],[-100,160,12],[-150,80,6],[-90,20,4]],
    glide: [2.12, 2.88], boxes: [0.1, 0.42, 0.74], coins: [0.05, 0.18, 0.36, 0.5, 0.64, 0.86],
  },
  {
    id: 'candy', name: 'Candy Castle', width: 15, laps: 3,
    theme: { sky: 0xffc2e2, fog: 0xffe0f0, ground: 0xb8f0d0, road: 0xc7a0d8, edgeA: 0xffffff, edgeB: 0xff5fa2, wall: 0xffe36e, deco: 'candy' },
    points: [[0,0,0],[70,-30,0],[140,-10,6],[180,60,10],[140,130,4],[160,200,0],[80,230,0],[10,180,6],[-70,210,0],[-140,150,0],[-120,60,4],[-60,30,0]],
    boxes: [0.1, 0.38, 0.66, 0.88], coins: [0.05, 0.2, 0.3, 0.5, 0.58, 0.78, 0.94],
  },
  {
    id: 'starlight', name: 'Starlight Road', width: 14, laps: 3,
    theme: { sky: 0x1a1446, fog: 0x2a2163, ground: 0x241b55, road: 0x3a3170, edgeA: 0xfff36b, edgeB: 0x6bf3ff, wall: 0xff6bd6, deco: 'stars', night: true, water: 0x120c33 },
    points: [[0,0,10],[90,10,14],[160,-30,20],[220,30,24],[200,110,24],[120,140,14],[60,200,12],[-30,200,16],[-110,150,12],[-130,60,10],[-70,0,10]],
    glide: [3.12, 3.88], boxes: [0.1, 0.45, 0.72], coins: [0.05, 0.2, 0.28, 0.55, 0.62, 0.85, 0.92],
  },
];

export const CUPS = [
  { id: 'sunshine', name: 'Sunshine Cup', icon: '🌞', tracks: ['meadow', 'beach', 'desert'] },
  { id: 'moonlight', name: 'Moonlight Cup', icon: '🌙', tracks: ['snow', 'candy', 'starlight'] },
];

export const DIFFICULTY = {
  easy:   { label: 'Easy',   speed: 24, ai: 0.82 },
  normal: { label: 'Normal', speed: 30, ai: 0.93 },
  fast:   { label: 'Fast',   speed: 37, ai: 1.0 },
};

export const POINTS = [15, 12, 10, 8, 6, 4, 2, 1];
export const PLACE_COINS = [50, 35, 25, 18, 12, 10, 8, 6];
export const GIFT_COST = 100;
