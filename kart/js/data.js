// All game content lives here: drivers, karts, gliders, items, tracks, cups.
// Stats are 1-5. weight affects bumping, speed top speed, accel how fast you get there,
// handling how sharp you turn.

// Drivers are Kenney "Cube Pets" models (CC0). color is used for the minimap dot and kart trim.
export const CHARACTERS = [
  { id: 'pip',     name: 'Pip',     model: 'penguin',     color: 0x2b2f45, cls: 'light',  start: true },
  { id: 'rosa',    name: 'Rosa',    model: 'bunny',       color: 0xd9824f, cls: 'light',  start: true },
  { id: 'rufus',   name: 'Rufus',   model: 'dog',         color: 0xc7773f, cls: 'medium', start: true },
  { id: 'mia',     name: 'Mia',     model: 'cat',         color: 0x5d6270, cls: 'medium' },
  { id: 'kiki',    name: 'Kiki',    model: 'fox',         color: 0xf08a3a, cls: 'light'  },
  { id: 'leo',     name: 'Leo',     model: 'lion',        color: 0xe98e3c, cls: 'heavy'  },
  { id: 'mochi',   name: 'Mochi',   model: 'panda',       color: 0xf2f2f2, cls: 'medium' },
  { id: 'hamlet',  name: 'Hamlet',  model: 'pig',         color: 0xf28fb5, cls: 'medium' },
  { id: 'nana',    name: 'Nana',    model: 'monkey',      color: 0xc0754a, cls: 'medium' },
  { id: 'coco',    name: 'Coco',    model: 'koala',       color: 0x7c7f91, cls: 'medium' },
  { id: 'peep',    name: 'Peep',    model: 'chick',       color: 0xf7c33c, cls: 'light'  },
  { id: 'buzz',    name: 'Buzz',    model: 'bee',         color: 0xf5c02e, cls: 'light'  },
  { id: 'polly',   name: 'Polly',   model: 'parrot',      color: 0xe0402f, cls: 'light'  },
  { id: 'pinch',   name: 'Pinch',   model: 'crab',        color: 0xe8462f, cls: 'light'  },
  { id: 'daisy',   name: 'Daisy',   model: 'cow',         color: 0xf4f0ea, cls: 'heavy'  },
  { id: 'ellie',   name: 'Ellie',   model: 'elephant',    color: 0x9aa0c9, cls: 'heavy'  },
  { id: 'gigi',    name: 'Gigi',    model: 'giraffe',     color: 0xf2b53c, cls: 'medium' },
  { id: 'stripes', name: 'Stripes', model: 'tiger',       color: 0xf08a2e, cls: 'heavy'  },
  { id: 'snowy',   name: 'Snowy',   model: 'polar',       color: 0xeeeef8, cls: 'heavy'  },
  { id: 'benny',   name: 'Benny',   model: 'beaver',      color: 0xa65e34, cls: 'medium' },
  { id: 'willow',  name: 'Willow',  model: 'deer',        color: 0xb8683d, cls: 'medium' },
  { id: 'hank',    name: 'Hank',    model: 'hog',         color: 0xa8603a, cls: 'heavy'  },
  { id: 'finn',    name: 'Finn',    model: 'fish',        color: 0xf07c2e, cls: 'light'  },
  { id: 'inchy',   name: 'Inchy',   model: 'caterpillar', color: 0x3f9a4a, cls: 'medium' },
];

export const CLASS_STATS = {
  light:  { speed: 2, accel: 5, handling: 5, weight: 1 },
  medium: { speed: 3, accel: 3, handling: 3, weight: 3 },
  heavy:  { speed: 5, accel: 2, handling: 2, weight: 5 },
};

// Karts are Kenney "Toy Car Kit" models (CC0). seat: where the driver sits [height, forward offset].
export const KARTS = [
  { id: 'racer',     name: 'Racer',      model: 'racer',         seat: [0.77, -0.15], mod: { speed: 0,  accel: 0,  handling: 0 },  start: true },
  { id: 'speedster', name: 'Speedster',  model: 'speedster',     seat: [0.72, -0.25],  mod: { speed: 1,  accel: -1, handling: 0 } },
  { id: 'lowrider',  name: 'Low Rider',  model: 'racer-low',     seat: [0.72, -0.2],   mod: { speed: 0,  accel: 1,  handling: 0 } },
  { id: 'dragster',  name: 'Dragster',   model: 'drag-racer',    seat: [0.67, -0.3],  mod: { speed: 2,  accel: -1, handling: -1 } },
  { id: 'vintage',   name: 'Vintage',    model: 'vintage-racer', seat: [0.67, -0.2],  mod: { speed: -1, accel: 1,  handling: 1 } },
  { id: 'monster',   name: 'Monster Truck', model: 'monster-truck', seat: [2.05, -0.2], mod: { speed: 1,  accel: 0,  handling: -1 } },
  { id: 'suv',       name: 'Jeep',       model: 'suv',           seat: [1.40, -0.3],  mod: { speed: -1, accel: 1,  handling: 1 } },
  { id: 'truck',     name: 'Ice Cream Truck', model: 'truck',    seat: [1.55, -0.55],  mod: { speed: 1,  accel: -1, handling: 0 } },
];

// Gliders are built from simple shapes in models.js (no free glider models exist).
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

// Scenery per track theme (Kenney Nature, Holiday and Food kits, CC0): [model, height, how often]
export const DECO = {
  trees:  [['nature/tree_default.glb', 9, 3], ['nature/tree_oak.glb', 10, 3], ['nature/tree_detailed.glb', 9, 2], ['nature/tree_fat.glb', 8, 2], ['nature/plant_bushLarge.glb', 2.5, 3], ['nature/flower_redA.glb', 1.2, 2], ['nature/flower_yellowA.glb', 1.2, 2], ['nature/mushroom_redGroup.glb', 1.8, 1], ['nature/rock_largeA.glb', 3, 1]],
  palms:  [['nature/tree_palmTall.glb', 13, 4], ['nature/tree_palmBend.glb', 11, 3], ['nature/tree_palmDetailedTall.glb', 12, 3], ['nature/rock_largeC.glb', 3, 2], ['nature/plant_bushLarge.glb', 2.5, 2]],
  cactus: [['nature/cactus_tall.glb', 7, 4], ['nature/cactus_short.glb', 4, 4], ['nature/rock_largeA.glb', 4, 2], ['nature/rock_largeE.glb', 5, 2], ['nature/statue_obelisk.glb', 12, 1]],
  pines:  [['holiday/tree-snow-a.glb', 11, 3], ['holiday/tree-snow-b.glb', 9, 3], ['holiday/tree-snow-c.glb', 12, 3], ['holiday/snowman.glb', 3.2, 2], ['holiday/snowman-hat.glb', 3.2, 1], ['holiday/tree-decorated-snow.glb', 10, 1], ['holiday/present-a-cube.glb', 1.5, 1], ['holiday/rocks-large.glb', 3, 1]],
  candy:  [['food/cupcake.glb', 6, 3], ['food/donut-sprinkles.glb', 4, 3], ['food/ice-cream.glb', 8, 2], ['food/cake-birthday.glb', 6, 2], ['food/cookie-chocolate.glb', 2.5, 2], ['food/donut-chocolate.glb', 4, 2], ['holiday/candy-cane-red.glb', 7, 3], ['holiday/candy-cane-green.glb', 7, 2]],
  stars:  [['holiday/lantern.glb', 3, 2]],
};
// Start-line dressing from the Kenney Racing and Toy Car kits
export const TRACK_PROPS = ['cars/gate-finish.glb', 'race/grandStandCovered.glb', 'race/grandStand.glb', 'race/bannerTowerRed.glb', 'race/bannerTowerGreen.glb', 'race/flagCheckers.glb', 'race/tent.glb', 'race/lightPostModern.glb', 'cars/item-cone.glb'];
export const ITEM_MODELS = ['cars/item-box.glb', 'cars/item-coin-gold.glb', 'cars/item-banana.glb'];

export function allModelPaths() {
  return [
    ...CHARACTERS.map((c) => `pets/animal-${c.model}.glb`),
    ...KARTS.map((k) => `cars/vehicle-${k.model}.glb`),
    ...Object.values(DECO).flat().map((d) => d[0]),
    ...TRACK_PROPS, ...ITEM_MODELS,
  ];
}
