import fs from 'node:fs';

const ROOT = 's7'; // GameRoot created in batch 1
const out = { b1: [], b2: [], b3: [] };

const C_TRANSPARENT = { r: 1, g: 1, b: 1, a: 1 };
const GOLD = { r: 1.0, g: 0.82, b: 0.25, a: 1 };
const WHITE = { r: 1, g: 1, b: 1, a: 1 };
const DARKRED = { r: 0.35, g: 0.05, b: 0.05, a: 1 };

function img(batch, name, parent, x, y, w, h, tex, color, opacity) {
  out[batch].push({
    commandType: 'add_builtin_object',
    params: { object_type: 'Screen Image', name, parent: { $ref: parent } },
    alias: name,
  });
  out[batch].push({
    commandType: 'set_component',
    params: {
      guid: { $ref: name, componentType: 'ScreenTransform' },
      properties: { anchoredPosition: { x, y }, sizeDelta: { x: w, y: h } },
    },
  });
  const props = { texture: { guid: tex }, stretchMode: 'Fit' };
  if (color) props.color = color;
  if (opacity !== undefined) props.opacity = opacity;
  out[batch].push({
    commandType: 'set_component',
    params: { guid: { $ref: name, componentType: 'Image' }, properties: props },
  });
}

function txt(batch, name, parent, x, y, w, h, text, size, color) {
  out[batch].push({
    commandType: 'add_builtin_object',
    params: { object_type: '2D Text', name, parent: { $ref: parent } },
    alias: name,
  });
  out[batch].push({
    commandType: 'set_component',
    params: {
      guid: { $ref: name, componentType: 'ScreenTransform' },
      properties: { anchoredPosition: { x, y }, sizeDelta: { x: w, y: h } },
    },
  });
  out[batch].push({
    commandType: 'set_component',
    params: {
      guid: { $ref: name, componentType: 'Text' },
      properties: {
        text,
        fontSize: size,
        color,
        horizontalAlignment: 'CENTER',
        verticalAlignment: 'CENTER',
      },
    },
  });
}

// ---------------- batch 1: skeleton ----------------
out.b1.push({
  commandType: 'add_builtin_object',
  params: { object_type: 'Empty Object', name: 'GameManager' },
  alias: 'gm',
});
out.b1.push({
  commandType: 'add_builtin_object',
  params: { object_type: 'Head Tracker', name: 'HeadTracker' },
  alias: 'ht',
});
out.b1.push({
  commandType: 'add_builtin_object',
  params: { object_type: '2D Scene Object', name: 'GameRoot' },
  alias: 'root',
});
out.b1.push({
  commandType: 'move_object',
  params: { guid: { $ref: 'gm' }, position: 'back' },
});

// ---------------- batch 2: snow + calibration + gameplay ----------------
out.b2.push({ commandType: 'log', params: { message: 'building snow', level: 'info' } });

img('b2', 'Snow0', ROOT, -240, 300, 44, 44, 'r6', null, 0.7);
img('b2', 'Snow1', ROOT, 180, 460, 32, 32, 'r6', null, 0.55);
img('b2', 'Snow2', ROOT, 260, 90, 26, 26, 'r6', null, 0.5);
img('b2', 'Snow3', ROOT, -150, 520, 22, 22, 'r6', null, 0.45);

// calibration
img('b2', 'CalibDim', ROOT, 0, 0, 720, 1280, 'r12', { r: 0.02, g: 0.02, b: 0.06, a: 0.62 }, 1);
img('b2', 'CalibRing', ROOT, 0, 120, 320, 320, 'r5', null, 0.95);
txt('b2', 'CalibTitle', ROOT, 0, -140, 660, 100, '把脸对准金圈', 56, WHITE);
txt('b2', 'CalibSub', ROOT, 0, -230, 660, 70, '头在圈内 · 帽子会从天上掉下来', 30, { r: 1, g: 0.88, b: 0.6, a: 1 });
img('b2', 'CalibBtn', ROOT, 0, -400, 320, 110, 'r10', null, 1);
txt('b2', 'CalibBtnText', ROOT, 0, -400, 320, 110, '开始挑战', 44, WHITE);

// gameplay
img('b2', 'PlayRing', ROOT, 0, 120, 250, 250, 'r5', null, 0.95);
img('b2', 'Item0', ROOT, 0, 600, 150, 150, 'r2', null, 1);
img('b2', 'Item1', ROOT, 0, 600, 150, 150, 'r2', null, 1);
img('b2', 'Item2', ROOT, 0, 600, 150, 150, 'r2', null, 1);
img('b2', 'Item3', ROOT, 0, 600, 150, 150, 'r2', null, 1);
img('b2', 'Item4', ROOT, 0, 600, 150, 150, 'r3', null, 1);
img('b2', 'Item5', ROOT, 0, 600, 150, 150, 'r4', null, 1);
img('b2', 'Burst', ROOT, 0, 200, 340, 340, 'r7', null, 0);
img('b2', 'HudPlate', ROOT, 0, 440, 660, 216, 'r8', null, 1);
txt('b2', 'HudScore', ROOT, -110, 470, 320, 70, '得分 0', 46, GOLD);
txt('b2', 'HudLife', ROOT, 140, 470, 340, 70, '未接 0/10', 32, WHITE);
img('b2', 'BarBg', ROOT, 0, 400, 560, 20, 'r12', { r: 0.15, g: 0.06, b: 0.06, a: 0.9 }, 1);
img('b2', 'BarFill', ROOT, 0, 400, 560, 20, 'r12', { r: 0.49, g: 0.86, b: 0.42, a: 1 }, 1);
txt('b2', 'CountText', ROOT, 0, 60, 400, 300, '', 190, GOLD);
img('b2', 'Flash', ROOT, 0, 0, 720, 1280, 'r12', { r: 1, g: 0.1, b: 0.1, a: 0 }, 1);

// ---------------- batch 3: result + audio ----------------
img('b3', 'ResCard', ROOT, 0, 40, 620, 900, 'r9', null, 1);
txt('b3', 'ResTitle', ROOT, 0, 370, 560, 80, '圣诞帽大作战', 46, GOLD);
txt('b3', 'ResScore', ROOT, 0, 262, 560, 90, '本局得分 0', 58, WHITE);
txt('b3', 'ResRank', ROOT, 0, 150, 560, 100, '灵活的圣诞小精灵', 58, { r: 1, g: 0.93, b: 0.55, a: 1 });
txt('b3', 'ResShare1', ROOT, 0, -30, 560, 60, '@你最手残的朋友来挑战！', 34, WHITE);
txt('b3', 'ResShare2', ROOT, 0, -105, 560, 60, '点击下方按钮，使用同款特效合拍！', 28, { r: 1, g: 0.88, b: 0.6, a: 1 });
img('b3', 'ResBtn', ROOT, 0, -270, 400, 130, 'r10', null, 1);
txt('b3', 'ResBtnText', ROOT, 0, -270, 400, 130, '再玩一次', 46, WHITE);

const audioDefs = [
  ['BgmPlayer', 'r15', 'Infinity', 45, true],
  ['SfxClick', 'r16', 'Once', 90, false],
  ['SfxPop', 'r17', 'Once', 90, false],
  ['SfxSuccess', 'r18', 'Once', 90, false],
  ['SfxFail', 'r19', 'Once', 90, false],
];
for (const [name, asset, mode, vol, auto] of audioDefs) {
  out.b3.push({
    commandType: 'add_builtin_object',
    params: { object_type: 'Audio Player', name },
    alias: name,
  });
  out.b3.push({
    commandType: 'set_component',
    params: {
      guid: { $ref: name, componentType: 'AudioComponent' },
      properties: {
        audioRef: { guid: asset, type: 'AudioAsset' },
        playMode: mode,
        volume: vol,
        autoPlay: auto,
      },
    },
  });
}

for (const batch of Object.keys(out)) {
  fs.writeFileSync(
    `tools/dsl_${batch}.json`,
    JSON.stringify({ intention: 'Build the Santa Cap Catcher game scene (' + batch + ')', commands: out[batch] }, null, 1),
    'utf8'
  );
  console.log(batch, out[batch].length, 'commands');
}
