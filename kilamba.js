import * as THREE from 'three';

export function createKilambaDistrict(scene) {
  const world = { vehicles: [], trafficVehicles: [], npcs: [], buildings: [], colliders: [], destinations: [], updateTraffic() {} };
  const mat = (color, roughness = 0.82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const M = {
    ground: mat(0x879078), grass: mat(0x668052), asphalt: mat(0x30363b, 0.96),
    sidewalk: mat(0xc8c5bc), concrete: mat(0xb7b4ac), cream: mat(0xe7dfcf),
    white: mat(0xf1eee6), sand: mat(0xc9b99d), terracotta: mat(0xa94f3e),
    red: mat(0x963f35), charcoal: mat(0x353b3e), glass: new THREE.MeshPhysicalMaterial({
      color: 0x8fc2cf, roughness: 0.2, metalness: 0.08, transparent: true, opacity: 0.72
    }), metal: mat(0x50595c, 0.42, 0.55), rail: mat(0x343b3e, 0.42, 0.45),
    wood: mat(0x795238), leaf: mat(0x347b4a), leafLight: mat(0x559354), trunk: mat(0x755038),
    yellow: mat(0xe0bd6c), whiteLine: mat(0xe8e5d9), roadLine: mat(0xe4c76b)
  };
  function box(parent,x,y,z,w,h,d,m,cast=true) {
    const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);
    o.position.set(x,y+h/2,z); o.castShadow=cast; o.receiveShadow=true; parent.add(o); return o;
  }
  function cylinder(parent,x,y,z,rt,rb,h,m,n=10) {
    const o=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,n),m);
    o.position.set(x,y+h/2,z); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o;
  }
  function windowFrame(g,x,y,z,w=1.65,h=1.25) {
    box(g,x,y,z,w,h,.08,M.glass,false);
    for(const [px,py,pw,ph] of [[x-w/2-.045,y,.09,h+.16],[x+w/2+.045,y,.09,h+.16],[x,y-h/2-.04,w+.12,.09],[x,y+h/2+.04,w+.12,.09]]) box(g,px,py,z+.07,pw,ph,.12,M.white);
    box(g,x,y,z+.13,.045,h,.05,M.rail,false);
    box(g,x,y-h/2-.18,z+.12,w+.35,.12,.42,M.concrete);
  }
  function balcony(g,x,y,z,w=2.65) {
    box(g,x,y,z+.75,w+.5,.18,1.65,M.concrete);
    box(g,x,y+.18,z+1.5,w+.5,.08,.08,M.rail);
    for(let n=0;n<=8;n++) box(g,x-(w+.5)/2+n*(w+.5)/8,y+.18,z+1.5,.055,.82,.055,M.rail);
    for(const px of [x-(w+.5)/2,x+(w+.5)/2]) box(g,px,y+.18,z+.78,.07,.82,1.45,M.rail);
  }
  function palm(parent,x,z,s=1) {
    cylinder(parent,x,0,z,.16*s,.25*s,3.2*s,M.trunk,9);
    for(let i=0;i<7;i++){
      const a=Math.PI*2*i/7, leaf=new THREE.Mesh(new THREE.ConeGeometry(.22*s,2.3*s,5),i%2?M.leaf:M.leafLight);
      leaf.position.set(x+Math.sin(a)*.78*s,3.1*s,z+Math.cos(a)*.78*s);
      leaf.rotation.z=Math.cos(a)*.85; leaf.rotation.x=Math.sin(a)*.85; leaf.castShadow=true; parent.add(leaf);
    }
  }
  function streetLight(parent,x,z) {
    cylinder(parent,x,0,z,.055,.085,5.4,M.metal,8);
    box(parent,x,5.15,z+.42,.09,.08,.9,M.metal);
    box(parent,x,5.1,z+.82,.42,.14,.62,M.charcoal);
    const light=new THREE.PointLight(0xffe0ad,.45,13); light.position.set(x,5,z+.8); parent.add(light);
  }
  function roads() {
    box(scene,0,-.32,0,190,.55,170,M.ground,false);
    box(scene,0,-.02,0,190,.12,16,M.asphalt,false);
    box(scene,0,-.01,-67,190,.12,11,M.asphalt,false);
    box(scene,0,-.01,67,190,.12,11,M.asphalt,false);
    box(scene,-83,-.01,0,11,.12,150,M.asphalt,false);
    box(scene,83,-.01,0,11,.12,150,M.asphalt,false);
    for(const z of [-10,10,-60,-74,60,74]) box(scene,0,.015,z,190,.16,2.2,M.sidewalk,false);
    for(const x of [-76,-90,76,90]) box(scene,x,.015,0,2.2,.16,150,M.sidewalk,false);
    for(let x=-88;x<=88;x+=8) box(scene,x,.055,0,3.4,.018,.13,M.roadLine,false);
    for(const z of [-43,43]) { box(scene,0,.02,z,170,.14,5.5,M.grass,false); for(let x=-76;x<=76;x+=22) palm(scene,x,z,.9); }
    for(const x of [-70,70]) for(const z of [-54,-27,27,54]) streetLight(scene,x,z);
    box(scene,0,.04,0,20,.16,8,M.grass,false);
    box(scene,0,.13,0,11,.08,2.2,M.sidewalk,false);
    for(const x of [-8,8]) palm(scene,x,0,1.05);
    for(const x of [-4.5,4.5]) { box(scene,x,.18,0,2.2,.45,.55,M.wood); box(scene,x,.62,0,2.2,.12,.55,M.rail); }
  }
  function apartment(index,x,z,facing) {
    const g=new THREE.Group(), facade=index%3===0?M.cream:index%3===1?M.sand:M.white;
    const accent=index%2===0?M.terracotta:M.red, w=15.5,d=12.5,floors=5,fh=3.05,h=floors*fh+.9;
    const front=facing*d/2;
    box(g,0,0,0,w,h,d,facade);
    box(g,-w/2+.28,0,front+facing*.12,.42,h,.3,accent);
    box(g,w/2-.28,0,front+facing*.12,.42,h,.3,accent);
    box(g,0,0,front+facing*.2,w+.25,.32,.38,M.white);
    box(g,0,h-.5,front+facing*.2,w+.25,.3,.38,accent);
    for(let floor=1;floor<floors;floor++){
      const y=floor*fh; box(g,0,y,0,w+.35,.16,d+.25,M.white);
      box(g,0,y+.18,front+facing*.19,w+.25,.08,.28,accent);
    }
    for(let floor=0;floor<floors;floor++){
      const y=floor*fh+1.55;
      for(const wx of [-5,-1.75,1.75,5]) windowFrame(g,wx,y,front+facing*.22,1.55,1.28);
      if(floor>0){ balcony(g,-3.35,floor*fh+.25,front+facing*.05,2.25); balcony(g,3.35,floor*fh+.25,front+facing*.05,2.25); }
      else {
        box(g,0,.15,front+facing*.25,2.2,2.55,.16,M.charcoal);
        box(g,0,.15,front+facing*.36,1.9,2.35,.08,M.glass,false);
        box(g,-4.2,.6,front+facing*.26,2.1,1.65,.14,M.glass,false);
        box(g,4.2,.6,front+facing*.26,2.1,1.65,.14,M.glass,false);
      }
    }
    box(g,-6.55,0,front+facing*.18,1.25,h-.6,.35,M.charcoal);
    for(let floor=0;floor<floors;floor++) box(g,-6.55,floor*fh+.55,front+facing*.39,.82,1.55,.08,M.glass,false);
    box(g,0,2.9,front+facing*1.15,5.5,.24,2,accent);
    for(const px of [-2.35,2.35]) box(g,px,0,front+facing*1.75,.18,2.9,.18,M.white);
    box(g,0,h,0,w+.55,.38,d+.55,M.white);
    box(g,0,h+.38,-d/2+.22,w+.45,.75,.35,accent);
    box(g,0,h+.38,d/2-.22,w+.45,.75,.35,accent);
    for(const px of [-5.8,5.8]) { box(g,px,h+.38,-3.6,1,.8,1,M.charcoal); cylinder(g,px,h+1.15,-3.6,.04,.04,1,M.metal,8); }
    for(let floor=0;floor<floors;floor++) for(const wx of [-5,5]) {
      box(g,wx,floor*fh+.58,front+facing*.5,.62,.36,.3,M.white);
      box(g,wx,floor*fh+.95,front+facing*.5,.48,.04,.28,M.metal);
    }
    g.position.set(x,0,z); if(facing<0) g.rotation.y=Math.PI; scene.add(g);
    const entranceX=x, entranceZ=z+(facing>0?d/2+1.7:-d/2-1.7), colliders=[];
    const wall=(cx,cz,ww,dd)=>colliders.push({minX:x+cx-ww/2,maxX:x+cx+ww/2,minZ:z+cz-dd/2,maxZ:z+cz+dd/2});
    wall(-w/2,0,.5,d); wall(w/2,0,.5,d); wall(0,-d/2,w,.5);
    wall(-w/4,facing*d/2,w/2-1.3,.5); wall(w/4,facing*d/2,w/2-1.3,.5);
    const path=new THREE.Mesh(new THREE.BoxGeometry(3.5,.12,4.5),M.concrete);
    path.position.set(x,.06,entranceZ-facing*.4); scene.add(path);
    return {name:'Bloco '+String.fromCharCode(65+index),type:'apartment',propertyType:'apartamento T2',district:'Kilamba',x,z,width:w,depth:d,entranceX,entranceZ,salePrice:0,forSale:true,group:g,colliders};
  }
  roads();
  const positions=[-52,-26,0,26,52]; let index=0;
  for(const z of [-31,31]) for(const x of positions) {
    const b=apartment(index,x,z,z<0?1:-1); world.buildings.push(b); world.colliders.push(...b.colliders);
    world.destinations.push({name:b.name+' · Kilamba',x:b.entranceX,z:b.entranceZ}); index++;
  }
  return world;
}
