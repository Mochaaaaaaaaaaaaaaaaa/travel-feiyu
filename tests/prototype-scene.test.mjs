import test from 'node:test';
import assert from 'node:assert/strict';
import { sceneLayout, homeArt } from '../src/scene.js';

for (const [width,height] of [[1440,900],[1050,930],[1920,991],[1920,1080],[844,390],[390,844],[320,740],[768,1024]]) {
  test(`all scene objects remain on screen at ${width}×${height}`, () => {
    const layout = sceneLayout(width,height);
    const {worldWidth:w,worldHeight:h,offsetX:dx,offsetY:dy} = layout;
    assert.ok(Math.abs(w/h-width/height)<.0001);
    for (const [id,[x,y,ow,oh]] of Object.entries(layout.objects)) {
      assert.ok(x+dx>=0 && y+dy>=0 && x+dx+ow<=w && y+dy+oh<=h, `${id} would be clipped`);
      assert.ok(ow>0 && oh>0);
    }
    const objects = Object.entries(layout.objects);
    for (let i=0;i<objects.length;i++) for (let j=i+1;j<objects.length;j++) {
      const [id,a]=objects[i], [other,b]=objects[j];
      assert.ok(a[0]+a[2]<=b[0] || b[0]+b[2]<=a[0] || a[1]+a[3]<=b[1] || b[1]+b[3]<=a[1], `${id} overlaps ${other}`);
    }
  });
}

test('mobile repositions the yard below the interior and keeps all state illustrations unique', () => {
  const mobile=sceneLayout(390,844), desktop=sceneLayout(1440,900);
  assert.equal(mobile.portrait,true); assert.equal(desktop.portrait,false);
  assert.ok(mobile.objects.garden[1]>mobile.house.y+650*mobile.house.scale);
  const svg=homeArt(mobile);
  for (const id of ['frog-at-home','frog-away','bag-at-home','board-empty','board-memories','mail-envelope','grown-clovers','growing-clovers']) {
    assert.equal(svg.split(`id="${id}"`).length-1,1,`${id} must appear once`);
  }
  assert.doesNotMatch(svg,/NaN|Infinity|undefined/);
});
