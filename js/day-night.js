// Ciclo de dia e noite do Angola Life 3D.
// O relógio avança de forma contínua e fica guardado neste dispositivo.
export function createDayNightCycle({THREE,scene,target,hemisphereLight,directionalLight,compactDevice=false}){
  const KEY='angola-life-world-clock-v1';
  const RATE_MS_PER_GAME_MINUTE=1500;
  let baseMinute=8*60,baseStamp=Date.now(),lastPersist=0;
  try{
    const saved=JSON.parse(localStorage.getItem(KEY)||'null');
    if(saved&&Number.isFinite(saved.minute)&&Number.isFinite(saved.stamp)){
      baseMinute=((saved.minute%1440)+1440)%1440;baseStamp=saved.stamp;
    }
  }catch(error){console.warn('Relógio local indisponível; a usar hora inicial.',error)}
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a),0,1);return t*t*(3-2*t)};
  const colors={night:new THREE.Color('#101a2a'),dawn:new THREE.Color('#c98268'),day:new THREE.Color('#9fc9e3'),sunset:new THREE.Color('#d98969')};
  const sky=new THREE.Color();
  const sun=new THREE.Mesh(new THREE.SphereGeometry(3.2,16,12),new THREE.MeshBasicMaterial({color:'#fff0c7'}));
  const moon=new THREE.Mesh(new THREE.SphereGeometry(2.1,16,12),new THREE.MeshBasicMaterial({color:'#d9e5f4'}));
  sun.name='AngolaLifeSun';moon.name='AngolaLifeMoon';scene.add(sun,moon);
  const starPositions=[];let seed=91371;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let i=0;i<(compactDevice?70:150);i++){
    const a=rand()*Math.PI*2,y=.16+rand()*.82,r=150+rand()*30;
    const ring=Math.sqrt(1-y*y);starPositions.push(Math.cos(a)*ring*r,y*r,Math.sin(a)*ring*r);
  }
  const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
  const starMaterial=new THREE.PointsMaterial({color:'#dce9ff',size:compactDevice?1.1:1.55,transparent:true,opacity:0,depthWrite:false,sizeAttenuation:false});
  const stars=new THREE.Points(starGeometry,starMaterial);stars.name='AngolaLifeStars';scene.add(stars);
  const lampPositions=compactDevice?[[-56,-56],[56,-56],[-56,56],[56,56]]:[[-56,-56],[0,-56],[56,-56],[-56,0],[56,0],[-56,56],[0,56],[56,56]];
  const lamps=lampPositions.map(([x,z])=>{
    const bulb=new THREE.Mesh(new THREE.SphereGeometry(.18,8,6),new THREE.MeshBasicMaterial({color:'#ffd98b'}));bulb.position.set(x,4.15,z);target.add(bulb);
    const glow=new THREE.PointLight(0xffc978,0,18,2);glow.position.set(x,4.1,z);target.add(glow);return {bulb,glow};
  });
  const getMinute=()=>((baseMinute+(Date.now()-baseStamp)/RATE_MS_PER_GAME_MINUTE)%1440+1440)%1440;
  const update=()=>{
    const minute=getMinute(),hour=Math.floor(minute/60),mins=Math.floor(minute%60),angle=2*Math.PI*(minute/1440)-Math.PI/2;
    const sunHeight=Math.sin(angle),daylight=clamp(sunHeight,0,1),twilight=Math.max(smooth(-.18,.12,sunHeight)*(1-smooth(.12,.32,sunHeight)),smooth(.12,-.18,sunHeight));
    const sunX=Math.cos(angle)*112,sunY=Math.sin(angle)*88;
    sun.position.set(sunX,Math.max(-20,sunY),-82);sun.visible=sunY>-4;
    moon.position.set(-sunX,-sunY,75);moon.visible=sunY<8;
    const dawnMix=smooth(-.22,.12,sunHeight)*(1-smooth(.12,.38,sunHeight));
    sky.copy(colors.night).lerp(colors.day,daylight).lerp(colors.dawn,Math.max(dawnMix,twilight*.72));
    if(sunHeight<0)sky.copy(colors.night).lerp(colors.dawn,smooth(-.5,0,sunHeight)*.28);
    scene.background=sky;
    if(scene.fog&&scene.fog.color)scene.fog.color.copy(sky);
    directionalLight.intensity=.12+daylight*2.08;
    directionalLight.color.setRGB(.58+.42*daylight,.66+.34*daylight,.82+.18*daylight);
    directionalLight.position.set(sunX*.28,Math.max(4,sunY*.24+10),-24);
    hemisphereLight.intensity=.28+daylight*1.72;
    hemisphereLight.color.set('#eaf4ff');hemisphereLight.groundColor.set(daylight>.2?'#68745d':'#202b3d');
    starMaterial.opacity=clamp((.22-daylight)/.22,0,1)*.92;
    const night=1-daylight;
    lamps.forEach(({bulb,glow})=>{glow.intensity=night*1.55;bulb.material.color.setRGB(1,.72+.2*daylight,.38+.48*daylight)});
    if(Date.now()-lastPersist>15000){lastPersist=Date.now();try{localStorage.setItem(KEY,JSON.stringify({minute,stamp:Date.now()}))}catch(error){/* armazenamento opcional */}}
    const label=(hour<10?'0':'')+hour+':'+(mins<10?'0':'')+mins+' · '+(hour>=6&&hour<18?'DIA':'NOITE');
    return {minute,label};
  };
  update();
  return {update,dispose(){try{localStorage.setItem(KEY,JSON.stringify({minute:getMinute(),stamp:Date.now()}))}catch(error){}}};
}
