// Relógio e clima dinâmicos do Angola Life 3D.
// Um dia completo dura cerca de 2h24 de tempo real (1 minuto de jogo = 6 segundos).
export function createDayNightCycle({THREE,scene,target,hemisphereLight,directionalLight,compactDevice=false,kind='city'}){
  const KEY='angola-life-world-clock-v3';
  const RATE_MS_PER_GAME_MINUTE=6000;
  let baseMinute=10*60,baseStamp=Date.now(),lastPersist=0;
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved&&Number.isFinite(saved.minute)&&Number.isFinite(saved.stamp)){baseMinute=((saved.minute%1440)+1440)%1440;baseStamp=Math.min(Date.now(),Math.max(0,saved.stamp))}
  }catch(error){console.warn('Relógio local indisponível; a usar 08:00.',error)}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
  const colors={night:new THREE.Color('#101a2a'),day:new THREE.Color('#b9e2f7'),dawn:new THREE.Color('#c98268')};
  const sky=new THREE.Color(),isCity=kind==='city';let weatherLight=1,rainOpacity=0;
  const sun=new THREE.Mesh(new THREE.SphereGeometry(4.1,20,14),new THREE.MeshBasicMaterial({color:'#fff0c7'}));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(2.1,16,12),new THREE.MeshBasicMaterial({color:'#d9e5f4'}));
  sun.name='AngolaLifeSun';moon.name='AngolaLifeMoon';if(isCity)scene.add(sun,moon);
  const starPositions=[];let seed=91371;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<(compactDevice?70:150);i++){const a=rand()*Math.PI*2,y=.16+rand()*.82,r=150+rand()*30,ring=Math.sqrt(1-y*y);starPositions.push(Math.cos(a)*ring*r,y*r,Math.sin(a)*ring*r)}
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const starMaterial=new THREE.PointsMaterial({color:'#dce9ff',size:compactDevice?1.1:1.55,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:false});
  const stars=new THREE.Points(starGeometry,starMaterial);stars.name='AngolaLifeStars';if(isCity)scene.add(stars);
  const rainCount=compactDevice?180:420,rainPositions=new Float32Array(rainCount*3);
  for(let i=0;i<rainCount;i++){rainPositions[i*3]=(rand()-.5)*190;rainPositions[i*3+1]=rand()*48+2;rainPositions[i*3+2]=(rand()-.5)*190}
  const rainGeometry=new THREE.BufferGeometry();rainGeometry.setAttribute('position',new THREE.BufferAttribute(rainPositions,3));
  const rainMaterial=new THREE.PointsMaterial({color:'#c9e4ff',size:compactDevice ? 0.11 : 0.16,transparent:true,opacity:0,depthWrite:false});
  const rain=new THREE.Points(rainGeometry,rainMaterial);rain.name='AngolaLifeRain';if(isCity)scene.add(rain);
  const puddles=[];
  if(isCity){for(let i=0;i<18;i++){const material=new THREE.MeshStandardMaterial({color:'#9bbac8',roughness:.22,metalness:.12,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});const puddle=new THREE.Mesh(new THREE.CircleGeometry(.7+(i%4)*.22,18),material);puddle.rotation.x=-Math.PI/2;puddle.scale.set(1.35,.62,1);const roads=[-70,-42,-14,14,42,70],lane=roads[i%roads.length];puddle.position.set(i%2===0?lane+(rand()-.5)*2.4:(rand()-.5)*130,.004,i%2===0?(rand()-.5)*130:lane+(rand()-.5)*2.4);puddle.name='AngolaLifeRainPuddle';target.add(puddle);puddles.push(puddle)}}
  const lightning=isCity?new THREE.PointLight(0xddeaff,0,190,1.5):null;
  if(lightning){lightning.position.set(12,58,-18);scene.add(lightning)}
  let nextLightningAt=Date.now()+18000,lightningUntil=0,lightningPower=0;
  const wetMaterials=[];
  if(isCity)target.traverse(object=>{const materials=Array.isArray(object.material)?object.material:[object.material];for(const material of materials){if(material?.name==='AngolaLifeAsphalt'&&!wetMaterials.includes(material))wetMaterials.push(material)}});
  const lampPositions=compactDevice?[[-56,-56],[56,-56],[-56,56],[56,56]]:[[-56,-56],[0,-56],[56,-56],[-56,0],[56,0],[-56,56],[0,56],[56,56]];
  const lamps=isCity?lampPositions.map(([x,z])=>{const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:'#ffd98b'}));bulb.position.set(x,4.15,z);target.add(bulb);const glow=new THREE.PointLight(0xffc978,0,18,2);glow.position.set(x,4.1,z);target.add(glow);return {bulb,glow}}):[];
  const getMinute=()=>((baseMinute+(Date.now()-baseStamp)/RATE_MS_PER_GAME_MINUTE)%1440+1440)%1440;
  const climateAt=minute=>{
    const absolute=baseMinute+(Date.now()-baseStamp)/RATE_MS_PER_GAME_MINUTE,day=Math.floor(absolute/1440),slot=Math.floor(minute/240),value=(day*7+slot*13+Math.floor(slot/3)*5)%20;
    if(value<3)return {key:'rain',label:'🌧️ CHUVA',fog:.012,light:.90};
    if(value<6)return {key:'cloud',label:'☁️ NUBLADO',fog:.004,light:.96};
    if(value===11)return {key:'fog',label:'🌫️ NEBLINA',fog:.022,light:.92};
    return {key:'sun',label:'☀️ SOL',fog:0,light:1};
  };
  const update=(delta=0)=>{
    const minute=getMinute(),hour=Math.floor(minute/60),mins=Math.floor(minute%60),angle=2*Math.PI*(minute/1440)-Math.PI/2;
    const sunHeight=Math.sin(angle),daylight=clamp(sunHeight,0,1),night=1-daylight,sunX=Math.cos(angle)*112,sunY=Math.sin(angle)*88;
    if(isCity){sun.position.set(sunX,Math.max(-20,sunY),-82);sun.visible=sunY>-4;moon.position.set(-sunX,-sunY,75);moon.visible=sunY<8}
    const dawn=smooth(-.2,.08,sunHeight)*(1-smooth(.08,.38,sunHeight));
    sky.copy(colors.night).lerp(colors.day,daylight).lerp(colors.dawn,dawn*.8);
    if(sunHeight<0)sky.copy(colors.night).lerp(colors.dawn,smooth(-.5,0,sunHeight)*.22);
    const climate=climateAt(minute);weatherLight+=(climate.light-weatherLight)*(1-Math.exp(-Math.max(delta,.033)*.22));const weatherFactor=weatherLight;
    if(isCity){scene.background=sky;if(scene.fog?.color){scene.fog.color.copy(sky);if('density'in scene.fog)scene.fog.density+=(climate.fog-scene.fog.density)*(1-Math.exp(-Math.max(delta,.033)*.2))}}
    // A iluminação global acompanha o ciclo apenas no exterior. Os interiores
    // mantêm a iluminação própria para não ficarem artificialmente escuros.
    if(isCity){
      directionalLight.intensity=(1.05+daylight*3.15)*weatherFactor;
      directionalLight.color.setRGB(.78+.22*daylight,.84+.16*daylight,.92+.08*daylight);
      directionalLight.position.set(sunX*.28,Math.max(4,sunY*.24+10),-24);
      hemisphereLight.intensity=(1.35+daylight*2.05)*weatherFactor;
      hemisphereLight.color.set('#f4f9ff');hemisphereLight.groundColor.set(daylight>.2?'#82906f':'#35445a');
    }
    if(isCity){
      starMaterial.opacity=clamp((.22-daylight)/.22,0,1)*.92;
      lamps.forEach(({bulb,glow})=>{glow.intensity=night*1.55;bulb.material.color.setRGB(1,.72+.2*daylight,.38+.48*daylight)});
      rainOpacity+=((climate.key==='rain' ? .72 : 0)-rainOpacity)*(1-Math.exp(-Math.max(delta,.033)*.55));rainMaterial.opacity=rainOpacity;rain.visible=rainOpacity>.01;
      puddles.forEach((puddle,index)=>{puddle.material.opacity=rainOpacity*.24;puddle.visible=rainOpacity>.025;puddle.scale.set(1.1+(index%3)*.22,.55+(index%2)*.12,1)});
      const wetness=rainOpacity>.04?rainOpacity:0;wetMaterials.forEach(material=>{material.roughness=.98-wetness*.48;material.metalness=wetness*.12});
      if(climate.key==='rain'){const p=rainGeometry.attributes.position.array;for(let i=0;i<rainCount;i++){p[i*3+1]-=(delta||.033)*25;p[i*3]+=Math.sin(Date.now()*.00035)*((delta||.033)*2.2);if(p[i*3+1]<0){p[i*3+1]=35+rand()*15;p[i*3]=(rand()-.5)*190;p[i*3+2]=(rand()-.5)*190}}rainGeometry.attributes.position.needsUpdate=true}
      const now=Date.now();if(climate.key==='rain'&&now>nextLightningAt){lightningUntil=now+110+rand()*100;lightningPower=.75+rand()*.85;nextLightningAt=now+16000+rand()*36000}
      if(lightning){const remaining=lightningUntil-now;lightning.intensity=remaining>0?lightningPower*(remaining<70?.45:1):0;if(remaining<=0&&lightning.intensity>0)lightning.intensity=0;}
    }
    if(Date.now()-lastPersist>15000){lastPersist=Date.now();try{localStorage.setItem(KEY,JSON.stringify({minute,stamp:Date.now()}))}catch(error){}}
    const label=(hour<10?'0':'')+hour+':'+(mins<10?'0':'')+mins+' · '+(hour>=6&&hour<18?'DIA':'NOITE')+' · '+climate.label;
    return {minute,label,weather:climate.label};
  };
  update();
  return {update,dispose(){try{localStorage.setItem(KEY,JSON.stringify({minute:getMinute(),stamp:Date.now()}))}catch(error){} }};
}
