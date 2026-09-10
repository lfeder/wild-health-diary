import {cpSync,mkdirSync,rmSync} from 'node:fs';
// dist/ serves the hosted deployment; docs/ is what GitHub Pages publishes from main.
for(const out of ['dist','docs']){rmSync(out,{recursive:true,force:true});mkdirSync(out,{recursive:true});cpSync('public',out,{recursive:true});}
