import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const esbuild=require('/Users/fuhongbo/.codex/skills/dashi-ppt/project/node_modules/esbuild/lib/main.js');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const audio=path.join(root,'audio/crim-opus55-cinematic');
const result=await esbuild.build({entryPoints:[path.join(root,'app/src/promo/crim-opus55-player.js')],bundle:true,write:false,format:'iife',target:['es2022'],minify:true,legalComments:'inline',absWorkingDir:path.join(root,'app')});
const [shell,music,voice,cues,license]=await Promise.all([
 fs.readFile(path.join(root,'assets/criminology-opus55-cinematic-shell.html'),'utf8'),fs.readFile(path.join(audio,'score.mp3')),fs.readFile(path.join(audio,'narration.mp3')),fs.readFile(path.join(root,'data/crim-opus55-cinematic/narration.json'),'utf8'),fs.readFile(path.join(root,'app/node_modules/three/LICENSE'),'utf8')]);
const payload=JSON.stringify({music:music.toString('base64'),voice:voice.toString('base64'),cues:JSON.parse(cues)});
const html=shell.replace('__AUDIO_DATA__',payload).replace('__BUNDLE__',result.outputFiles[0].text.replace(/<\/script/gi,'<\\/script')).replace('__LICENSES__',('Three.js license:\n'+license+'\nScene source: Claude Code, requested model claude-opus-5-5. Integration, audio, cinematic corrections and verification: Codex.').replace(/--/g,'—'));
await fs.writeFile(path.join(root,'assets/criminology-opus55.html'),html);
console.log('Built self-contained cinematic HTML:',Buffer.byteLength(html),'bytes');
