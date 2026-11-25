import assert from 'node:assert/strict';import {refractToEye,apparentPoint,energyKWh} from './math.mjs';
for(const x of [-4,-1,0,1,4])for(const d of [.1,1,2.5])for(const e of [-3,0,3]){const ray=refractToEye({x,y:-d},{x:e,y:2.2});assert(Math.abs(ray.residual)<1e-10);assert(Math.abs(ray.airSine)+1e-9>=Math.abs(ray.waterSine));}
const normal=apparentPoint({x:0,y:-2},{x:0,y:6},4/3,.0001);assert(Math.abs(normal.y/-2-.75)<1e-5);
const oblique=apparentPoint({x:0,y:-2},{x:5,y:2});assert(Math.abs(oblique.y/-2-.75)>.05);
const same=apparentPoint({x:.2,y:-1.5},{x:2.2,y:3},1);assert(Math.hypot(same.x-.2,same.y+1.5)<1e-8);
assert.equal(energyKWh(2000,3),.1);assert.equal(energyKWh(100,120),.2);
console.log('PASS: Snell residual / ray direction, near-normal depth, view-dependent depth, no-interface identity, energy arithmetic.');
