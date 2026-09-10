import {test} from 'node:test';
import assert from 'node:assert/strict';
import './public/seed.js';
import './public/core.js';
test('seed preserves six undated days and missing recovery',()=>{assert.equal(SEED.days.length,6);assert.ok(DiaryCore.valid(SEED));assert.equal(SEED.days[3].metrics.recovery,undefined);assert.equal(SEED.days[2].metrics.rhr,54);});
test('fractional servings affect all macros and exercise contributes no food',()=>{assert.deepEqual(DiaryCore.totals([{type:'Food',calories:300,protein:13,carbs:27,fat:17,servings:.25},{type:'Exercise'}]),{calories:75,protein:3.25,carbs:6.75,fat:4.25});});
test('invalid imports are rejected',()=>{const d=structuredClone(SEED);d.days[0].entries[1].servings=-1;assert.equal(DiaryCore.valid(d),false);assert.equal(DiaryCore.valid({version:1,days:[],foods:[]}),false);});
