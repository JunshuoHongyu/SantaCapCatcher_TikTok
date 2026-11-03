import fs from 'node:fs';

const code = fs.readFileSync('build/GameManager.ts', 'utf8');
const body = {
  intention:
    'Add the single GameManager script that drives calibration, countdown, playback, scoring, miss handling, speed ramp, result ranking and retry for Santa Cap Catcher.',
  commands: [
    {
      commandType: 'add_script',
      params: { script_name: 'Managers/GameManager.ts', code },
      alias: 'gmScript',
    },
    {
      commandType: 'add_component',
      params: { scene_object_guid: 's8', component_type: 'GameManager' },
    },
  ],
};
fs.writeFileSync('tools/dsl_script.json', JSON.stringify(body, null, 1), 'utf8');
console.log('written', code.length, 'chars');
