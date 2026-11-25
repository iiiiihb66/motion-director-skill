export const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
export const ease=x=>{x=clamp(x);return x*x*(3-2*x)};
export function refractToEye(point,eye,n=4/3){
 if(point.y>=0||eye.y<=0||n<1)throw Error('Expected a submerged point, an eye in air and n>=1.');
 let lo=Math.min(point.x,eye.x)-100,hi=Math.max(point.x,eye.x)+100;
 for(let i=0;i<90;i++){const x=(lo+hi)/2,a=x-point.x,b=eye.x-x;const residual=n*a/Math.hypot(a,point.y)-b/Math.hypot(b,eye.y);if(residual>0)hi=x;else lo=x;}
 const surface={x:(lo+hi)/2,y:0};
 const waterSine=(surface.x-point.x)/Math.hypot(surface.x-point.x,point.y),airSine=(eye.x-surface.x)/Math.hypot(eye.x-surface.x,eye.y);
 return {point,surface,eye,waterSine,airSine,residual:n*waterSine-airSine};
}
export function apparentPoint(point,eye,n=4/3,pupil=.008){
 const a=refractToEye(point,{x:eye.x-pupil,y:eye.y},n),b=refractToEye(point,{x:eye.x+pupil,y:eye.y},n);
 const ma=(a.eye.x-a.surface.x)/a.eye.y,mb=(b.eye.x-b.surface.x)/b.eye.y;
 const y=(b.surface.x-a.surface.x)/(ma-mb),x=a.surface.x+ma*y;
 return {x,y,rays:[a,b]};
}
export function apparentIn3D(point,eye,n=4/3){
 const dx=eye.x-point.x,dz=eye.z-point.z,h=Math.hypot(dx,dz);
 const image=apparentPoint({x:0,y:point.y},{x:h,y:eye.y},n);
 return {x:point.x+(h?dx/h:0)*image.x,y:image.y,z:point.z+(h?dz/h:0)*image.x};
}
export const energyKWh=(watts,minutes)=>watts/1000*minutes/60;
export function locate(segments,time){let index=segments.findIndex(s=>time<s.end);if(index<0)index=segments.length-1;return {index,segment:segments[index],progress:clamp((time-segments[index].start)/(segments[index].end-segments[index].start))};}
