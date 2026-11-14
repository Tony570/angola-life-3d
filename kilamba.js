import * as THREE from 'three';

export function createKilambaDistrict(scene) {
  const world = { vehicles: [], trafficVehicles: [], npcs: [], buildings: [], colliders: [], destinations: [], updateTraffic() {} };
  const mat = (color, roughness = 0.82, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const M = {
    ground: mat(0x879078), grass: mat(0x668052), asphalt: mat(0x30363b, .96),
    sidewalk: mat(0xc8c5bc), concrete: mat(0xb7b4ac), cream: mat(0xe7dfcf),
    white: mat(0xf1eee6), sand: mat(0xc9b99d), terracotta: mat(0xa94f3e),
    red: mat(0x963f35), charcoal: mat(0x353b3e),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x55727b, roughness: .24, metalness: .12, transparent: false, opacity: 1, depthWrite: true, clearcoat: .35 }),
    darkGlass: new THREE.MeshPhysicalMaterial({ color: 0x172b34, roughness: .28, metalness: .16, transparent: false, opacity: 1, depthWrite: true, clearcoat: .25 }),
    metal: mat(0x50595c, .42, .55), rail: mat(0x343b3e, .42, .45),
    wood: mat(0x795238), leaf: mat(0x347b4a), leafLight: mat(0x559354), trunk: mat(0x755038),
    yellow: mat(0xe0bd6c), whiteLine: mat(0xe8e5d9), roadLine: mat(0xe4c76b)
  };

  const geometryCache = new Map();
  function cachedGeometry(key, create) {
    if (!geometryCache.has(key)) geometryCache.set(key, create());
    return geometryCache.get(key);
  }
  function box(parent,x,y,z,w,h,d,m,cast=true) {
    const key = `b:${w}:${h}:${d}`;
    const geometry = cachedGeometry(key, () => new THREE.BoxGeometry(w,h,d));
    const o=new THREE.Mesh(geometry,m);
    o.position.set(x,y+h/2,z); o.castShadow=cast; o.receiveShadow=true; parent.add(o); return o;
  }
  function cylinder(parent,x,y,z,rt,rb,h,m,n=10) {
    const key = `c:${rt}:${rb}:${h}:${n}`;
    const geometry = cachedGeometry(key, () => new THREE.CylinderGeometry(rt,rb,h,n));
    const o=new THREE.Mesh(geometry,m);
    o.position.set(x,y+h/2,z); o.castShadow=true; o.receiveShadow=true; parent.add(o); return o;
  }
  function windowFrame(g,x,y,z,w=1.55,h=1.42) {
    box(g,x,y,z,w,h,.075,M.glass,false);
    for(const [px,py,pw,ph] of [[x-w/2-.045,y,.09,h+.16],[x+w/2+.045,y,.09,h+.16],[x,y-h/2-.045,w+.14,.09],[x,y+h/2+.045,w+.14,.09]]) box(g,px,py,z+.07,pw,ph,.12,M.white);
    box(g,x,y,z+.135,.045,h,.045,M.rail,false);
    box(g,x,y-h/2-.2,z+.13,w+.3,.12,.38,M.concrete);
  }
  function balcony(g,x,y,z,w=2.6) {
    box(g,x,y,z+.62,w+.42,.16,1.35,M.concrete);
    box(g,x,y+.18,z+1.25,w+.42,.08,.08,M.rail);
    for(let n=0;n<=8;n++) box(g,x-(w+.42)/2+n*(w+.42)/8,y+.18,z+1.25,.045,.78,.045,M.rail);
    for(const px of [x-(w+.42)/2,x+(w+.42)/2]) box(g,px,y+.18,z+.65,.06,.78,1.18,M.rail);
  }
  function palm(parent,x,z,s=1) {
    cylinder(parent,x,0,z,.16*s,.25*s,3.2*s,M.trunk,9);
    for(let i=0;i<7;i++){ const a=Math.PI*2*i/7, leaf=new THREE.Mesh(new THREE.ConeGeometry(.22*s,2.3*s,5),i%2?M.leaf:M.leafLight); leaf.position.set(x+Math.sin(a)*.78*s,3.1*s,z+Math.cos(a)*.78*s); leaf.rotation.z=Math.cos(a)*.85; leaf.rotation.x=Math.sin(a)*.85; leaf.castShadow=true; parent.add(leaf); }
  }
  function streetLight(parent,x,z) {
    cylinder(parent,x,0,z,.055,.085,5.4,M.metal,8);
    box(parent,x,5.15,z+.42,.09,.08,.9,M.metal);
    box(parent,x,5.1,z+.82,.42,.14,.62,M.charcoal);
    const light=new THREE.Mesh(new THREE.SphereGeometry(.16,8,6),new THREE.MeshBasicMaterial({color:0xffe0ad})); light.position.set(x,5,z+.8); parent.add(light);
  }
  function roads() {
    // Terreno urbano contínuo do bairro.
    box(scene,0,-.32,0,190,.55,170,M.ground,false);

    // Avenida principal: duas faixas largas, bermas e separador ajardinado.
    box(scene,0,-.02,0,190,.12,16,M.asphalt,false);
    for (const z of [-10,10]) {
      box(scene,0,.015,z,190,.16,2.8,M.sidewalk,false);
      box(scene,0,.045,z-Math.sign(z)*1.95,190,.20,.14,M.concrete,false);
    }
    box(scene,0,.035,0,190,.025,.22,M.whiteLine,false);
    for (let x=-88;x<=88;x+=12) {
      box(scene,x,.052,-4.6,5.2,.018,.12,M.roadLine,false);
      box(scene,x,.052,4.6,5.2,.018,.12,M.roadLine,false);
    }

    // Ruas de ligação norte/sul, alinhadas com os espaços entre os blocos.
    const accessRoads=[-65,-39,-13,13,39,65];
    for (const x of accessRoads) {
      for (const segment of [[-61,-9],[9,61]]) {
        const center=(segment[0]+segment[1])/2;
        const length=segment[1]-segment[0];
        box(scene,x,-.015,center,4.8,.12,length,M.asphalt,false);
        for (const side of [-1,1]) {
          box(scene,x+side*3.25,.015,center,1.7,.16,length,M.sidewalk,false);
          box(scene,x+side*2.43,.045,center,.14,.20,length,M.concrete,false);
          box(scene,x+side*3.25,.105,center,.045,.018,length-.8,M.whiteLine,false);
        }
        for(let z=segment[0]+5;z<segment[1]-2;z+=11) {
          box(scene,x,.052,z,.12,.018,4.0,M.roadLine,false);
        }
      }
    }

    // Ruas transversais nas extremidades do bairro.
    for (const z of [-67,67]) {
      box(scene,0,-.01,z,190,.12,11,M.asphalt,false);
      box(scene,0,.015,z-6.8,190,.16,2.0,M.sidewalk,false);
      box(scene,0,.015,z+6.8,190,.16,2.0,M.sidewalk,false);
      for(let x=-88;x<=88;x+=12) box(scene,x,.052,z,5.2,.018,.12,M.roadLine,false);
    }

    // Passeios verdes entre as duas zonas residenciais.
    for (const z of [-43,43]) {
      box(scene,0,.02,z,170,.14,5.5,M.grass,false);
      for(let x=-76;x<=76;x+=22) palm(scene,x,z,.9);
    }

    // Passadeiras nos cruzamentos e marcas de cedência.
    // Reutiliza a lista de ruas de ligação definida acima.
    for (const x of accessRoads) {
      for (const z of [-67,0,67]) {
        for(let n=-3;n<=3;n++) {
          box(scene,x+n*.72,.075,z,.38,.035,4.9,M.whiteLine,false);
        }
        box(scene,x,.045,z-4.0,4.8,.025,.18,M.roadLine,false);
        box(scene,x,.045,z+4.0,4.8,.025,.18,M.roadLine,false);
      }
    }

    // Iluminação pública ao longo das avenidas e acessos.
    for(const x of [-70,70]) for(const z of [-54,-27,27,54]) streetLight(scene,x,z);
    for(const x of accessRoads) {
      for(const z of [-49,49]) streetLight(scene,x+4.2,z);
    }

    // Pequeno largo central com bancos e palmeiras.
    box(scene,0,.04,0,20,.16,8,M.grass,false);
    box(scene,0,.13,0,11,.08,2.2,M.sidewalk,false);
    for(const x of [-8,8]) palm(scene,x,0,1.05);
    for(const x of [-4.5,4.5]) {
      box(scene,x,.18,0,2.2,.45,.55,M.wood);
      box(scene,x,.62,0,2.2,.12,.55,M.rail);
    }
  }

  function apartment(index,x,z) {
    const g=new THREE.Group(), facade=index%3===0?M.cream:index%3===1?M.sand:M.white;
    const accent=index%2===0?M.terracotta:M.red;
    const w=17, d=17, floors=5, fh=3.05, h=floors*fh+.45, front=d/2;
    // Base, foundation and continuous side/rear walls: the building is a real shell, not a floating frame.
    box(g,0,-.12,0,w+.5,.34,d+.5,M.concrete);
    box(g,-w/2+.18,0,0,.36,h,d,facade);
    box(g,w/2-.18,0,0,.36,h,d,facade);
    box(g,0,0,-d/2+.18,w,.36,.36,facade);
    for(let floor=0;floor<floors;floor++) {
      const y=floor*fh;
      box(g,0,y,0,w,.18,d,M.concrete);
      box(g,0,y+.18,front-.12,w,.10,.42,M.white);
      // Front ground floor has a generous glazed entrance and two solid side bays.
      if(floor===0) {
        box(g,-5.15,.18,front,6.7,2.72,.34,facade);
        box(g,5.15,.18,front,6.7,2.72,.34,facade);
        box(g,0,2.72,front,3.65,.34,.38,facade);
        box(g,-1.72,.18,front+.04,.12,2.65,.18,M.white);
        box(g,1.72,.18,front+.04,.12,2.65,.18,M.white);
        // Double glass entrance doors, with visible frame and handles.
        box(g,-.82,.12,front+.12,1.58,2.42,.07,M.darkGlass,false);
        box(g,.82,.12,front+.12,1.58,2.42,.07,M.darkGlass,false);
        box(g,0,.12,front+.18,.055,2.42,.08,M.metal);
        for(const dx of [-.12,.12]) cylinder(g,dx,1.05,front+.27,.025,.025,.55,M.yellow,8);
        for(const wx of [-5.15,5.15]) {
          box(g,wx,.18,front+.04,2.45,2.35,.07,M.glass,false);
          for(const dx of [-1.25,1.25]) box(g,wx+dx,.18,front+.10,.08,2.45,.12,M.white);
        }
      } else {
        // Fachada preenchida: paredes reais entre vãos, vergas, peitoris e pilares.
        box(g,-7.55,y+.18,front,1.9,2.7,.38,facade);
        box(g,7.55,y+.18,front,1.9,2.7,.38,facade);
        for(const px of [-3.55,0,3.55]) box(g,px,y+.18,front,.55,2.7,.38,facade);
        for(const wx of [-5.55,-1.78,1.78,5.55]) {
          // Painéis de alvenaria abaixo e acima de cada janela.
          box(g,wx,y+.53,front,1.9,.62,.38,facade);
          box(g,wx,y+2.68,front,1.9,.48,.38,facade);
          windowFrame(g,wx,y+1.62,front+.23,1.45,1.42);
          // Peitoril saliente e acabamento superior da caixilharia.
          box(g,wx,y+.88,front+.34,1.68,.11,.22,M.concrete);
          box(g,wx,y+2.37,front+.31,1.66,.09,.16,M.white);
          // Divisão central e duas folhas de janela.
          box(g,wx,y+1.62,front+.31,.045,1.32,.045,M.rail,false);
        }
        balcony(g,-5.55,y+.2,front+.02,2.0);
        balcony(g,5.55,y+.2,front+.02,2.0);
        // Condutas e pequenas unidades de ar condicionado nas fachadas laterais.
        for(const wx of [-3.55,3.55]) {
          box(g,wx,y+1.18,front+.28,.72,.42,.48,M.white);
          box(g,wx,y+1.18,front+.54,.48,.22,.035,M.metal,false);
          for(let vent=0;vent<4;vent++) box(g,wx-.18+vent*.12,y+1.18,front+.57,.025,.15,.025,M.rail,false);
        }
      }
      // Accent band at every slab line.
      box(g,0,y+.32,front+.22,w+.1,.09,.18,accent);
    }
    // Elementos de acabamento: molduras verticais, frisos e coroamento da fachada.
    for(const px of [-8.05,8.05]) {
      box(g,px,h/2,front+.19,.16,h-.2,.18,M.white);
    }
    for(let floor=1;floor<floors;floor++) {
      const y=floor*fh;
      box(g,0,y+.42,front+.27,w+.12,.055,.12,M.white);
    }
    // Architectural entrance portal, canopy, lighting and block identification.
    box(g,-2.05,0,front+.45,.22,3.15,.28,M.white);
    box(g,2.05,0,front+.45,.22,3.15,.28,M.white);
    box(g,0,2.82,front+.65,4.55,.22,1.55,accent);
    box(g,0,2.64,front+1.42,4.2,.08,.12,M.yellow);
    box(g,0,3.18,front+.68,3.1,.18,.08,M.white);
    const plaque=box(g,0,3.22,front+.74,2.9,.24,.06,M.charcoal);
    const entranceLamp=new THREE.Mesh(new THREE.SphereGeometry(.14,8,6),new THREE.MeshBasicMaterial({color:0xffdba0})); entranceLamp.position.set(0,2.65,front+1.1); g.add(entranceLamp);
    // Side windows make the block read as a lived-in building from oblique views.
    for(let floor=0;floor<floors;floor++) for(const side of [-1,1]) {
      const y=floor*fh+1.55;
      box(g,side*(w/2-.035),y,-2.8, .08,1.35,1.8,M.glass,false);
      box(g,side*(w/2-.10),y,-2.8, .12,1.48,.09,M.white);
      box(g,side*(w/2-.10),y,-3.7, .12,.08,1.9,M.white);
      box(g,side*(w/2-.10),y,-1.9, .12,.08,1.9,M.white);
    }
    // Roof parapet, top coping and service details.
    box(g,0,h,0,w+.25,.42,d+.25,M.white);
    box(g,0,h+.35,-d/2+.2,w+.2,.7,.32,accent);
    box(g,0,h+.35,d/2-.2,w+.2,.7,.32,accent);
    box(g,-w/2+.2,h+.35,0,.32,.7,d+.2,accent);
    box(g,w/2-.2,h+.35,0,.32,.7,d+.2,accent);
    box(g,-5.9,h+.72,-4.6,1.25,.55,1.3,M.charcoal);
    box(g,5.9,h+.72,-4.6,1.25,.55,1.3,M.charcoal);
    // Raised entry landing, steps, planters and low garden lights.
    box(g,0,.08,front+2.0,5.6,.16,2.1,M.concrete);
    for(let step=0;step<3;step++) box(g,0,-.04+step*.045,front+3.1+step*.48,5.0,.12,.52,M.concrete);
    for(const px of [-7.15,7.15]) {
      box(g,px,.12,front+1.35,1.45,.34,2.15,M.concrete);
      for(let n=0;n<4;n++) {
        const leaf=new THREE.Mesh(new THREE.ConeGeometry(.22,.9,6),M.leaf);
        leaf.position.set(px+(n-1.5)*.2,.82,front+1.35+(n%2)*.3); leaf.rotation.z=(n-1.5)*.12; g.add(leaf);
      }
      const bollard=cylinder(g,px,.05,front+2.75,.07,.07,.72,M.metal,8);
      const lamp=new THREE.PointLight(0xffdca0,.18,4); lamp.position.set(px,.8,front+2.75); g.add(lamp);
    }
    g.position.set(x,0,z); scene.add(g);

    const entranceX=x, entranceZ=z+front+3.55, colliders=[];
    const wall=(cx,cz,ww,dd)=>colliders.push({minX:x+cx-ww/2,maxX:x+cx+ww/2,minZ:z+cz-dd/2,maxZ:z+cz+dd/2});
    wall(-w/2,0,.42,d); wall(w/2,0,.42,d); wall(0,-d/2,w,.42);
    // Keep the central doorway physically open.
    wall(-5.15,front,6.7,.42); wall(5.15,front,6.7,.42);
    const path=new THREE.Mesh(new THREE.BoxGeometry(4.4,.10,5.2),M.concrete);
    path.position.set(x,.04,entranceZ-1.0); scene.add(path);
    return {name:'Bloco '+String.fromCharCode(65+index),type:'apartment',propertyType:'apartamento T2',district:'Kilamba',x,z,width:w,depth:d,entranceX,entranceZ,salePrice:0,forSale:true,group:g,colliders};
  }

  roads();
  const positions=[-52,-26,0,26,52]; let index=0;
  for(const z of [-31,31]) for(const x of positions) {
    const building=apartment(index,x,z);
    world.buildings.push(building);
    world.colliders.push(...building.colliders);
    world.destinations.push({name:building.name+' · Kilamba',x:building.entranceX,z:building.entranceZ});
    index++;
  }
  return world;
}
