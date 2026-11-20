// Largo do Ambiente — expansão independente da cidade existente.
export function buildLargoDoAmbiente({ THREE, target, addCityCollision, cityWorldEntrances, entryMeshes }) {
  const mat = (color, roughness=0.86) => new THREE.MeshStandardMaterial({ color, roughness });
  const concrete=mat('#c8c5b9'), asphalt=mat('#5b5b55'), curb=mat('#d7d1c1'), grass=mat('#668653'), dark=mat('#263238'), glass=new THREE.MeshStandardMaterial({color:'#79b7c8',roughness:.24,metalness:.12});
  const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;target.add(o);return o};
  const sphere=(r,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.SphereGeometry(r,12,10),m);o.position.set(x,y,z);o.castShadow=true;target.add(o);return o};
  const collision=(x,z,w,d)=>addCityCollision(x,z,w,d,.35);
  const label=(text,x,y,z,w=10,h=1.2,bg='#123c35')=>{
    const c=document.createElement('canvas');c.width=1024;c.height=160;const q=c.getContext('2d');
    q.fillStyle=bg;q.fillRect(0,0,1024,160);q.strokeStyle='#e6d7a7';q.lineWidth=9;q.strokeRect(8,8,1008,144);
    q.fillStyle='#fff7df';q.font='bold 70px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText(text,512,82);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
    const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t,side:THREE.DoubleSide}));o.position.set(x,y,z);target.add(o);return o;
  };
  const tree=(x,z,s=1)=>{const trunk=mat('#68452c'),leaves=mat('#397447');const t=new THREE.Mesh(new THREE.CylinderGeometry(.16*s,.23*s,1.7*s,8),trunk);t.position.set(x,.85*s,z);target.add(t);for(let i=0;i<3;i++)sphere(.72*s,leaves,x+(i-1)*.28*s,1.75*s+i*.12*s,z);collision(x,z,.65*s,.65*s)};
  const lamp=(x,z)=>{const metal=mat('#39454a'),light=mat('#f5dfa0');const p=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,4.4,8),metal);p.position.set(x,2.2,z);target.add(p);box(.85,.16,.32,light,x+.32,4.35,z);};
  const building=(name,x,z,w,d,floors,color,opts={})=>{
    const h=floors*3.15, wall=mat(color), trim=mat('#e9e3d4'), roof=mat(opts.roof||'#77736a');
    box(w,.25,d,concrete,x,.12,z);box(w,h,d,wall,x,h/2+.25,z);box(w+.5,.28,d+.5,roof,x,h+.38,z);
    for(let f=0;f<floors;f++){
      const y=1.15+f*3.15;
      for(let c=0;c<Math.max(2,Math.floor(w/2.6));c++){
        const wx=x-w/2+1.3+c*(w-2.6)/Math.max(1,Math.floor(w/2.6)-1);
        box(1.12,1.25,.09,glass,wx,y,z-d/2-.055);
        box(1.22,.09,.13,trim,wx,y+.68,z-d/2-.06);
      }
      box(w+.08,.12,d+.08,trim,x,.55+f*3.15,z);
    }
    box(w*.42,2.25,.14,dark,x,1.25,z-d/2-.12);
    label(name,x,h+.9,z-d/2-.16,Math.min(w*1.2,18),.95,opts.sign||'#173d55');
    collision(x,z,w,d);
    if(opts.dest){const entry=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));entry.position.set(x,1.2,z-d/2-.28);entry.userData.worldEntry={dest:opts.dest,label:name,x,z,front:-1,d};target.add(entry);if(cityWorldEntrances)cityWorldEntrances.push(entry.userData.worldEntry);if(entryMeshes)entryMeshes.push(entry);}
  };
  // Quintais ajardinados com portões abertos e vedações baixas, sem bloquear acessos.
  const yard=(x,z,w,d,front=-1,green='#668653')=>{
    const lawn=mat(green),fence=mat('#d9d6ca'),post=mat('#777b78'),gate=mat('#76543b'),edge=mat('#d6d0c1');
    box(w,.10,d,lawn,x,-.025,z);
    box(Math.min(w*.72,10),.08,1.05,edge,x,z-front*(d*.28),-.0);
    const thick=.16,gap=3.2,y=.68,side=(w-gap)/2;
    box(w,.78,thick,fence,x,y,z+front*d/2);
    box(thick,.78,d,fence,x-w/2,y,z);box(thick,.78,d,fence,x+w/2,y,z);
    box(side,.78,thick,fence,x-(gap/2+side/2),y,z-front*d/2);
    box(side,.78,thick,fence,x+(gap/2+side/2),y,z-front*d/2);
    for(const px of [x-w/2,x-gap/2,x+gap/2,x+w/2])box(.22,1.02,.22,post,px,.55,z-front*d/2);
    box(gap-.18,.12,.18,gate,x,.5,z-front*d/2);
    for(const sign of [-1,1]){
      const sx=x+sign*(w/2-1.25),sz=z+front*(d/2-1.15);
      box(1.45,.12,1.1,edge,sx,.06,sz);
      const bush=new THREE.Mesh(new THREE.SphereGeometry(.48,10,8),mat('#397747'));bush.position.set(sx,.42,sz);target.add(bush);
    }
    addCityCollision(x,z+front*d/2,w,.2,.25);
    addCityCollision(x-w/2,z,.2,d,.25);addCityCollision(x+w/2,z,.2,d,.25);
    addCityCollision(x-(gap/2+side/2),z-front*d/2,side,.2,.25);
    addCityCollision(x+(gap/2+side/2),z-front*d/2,side,.2,.25);
  };
  // Terreno próprio a leste: não remove nem desloca construções já existentes.
  box(250,.22,220,mat('#b59a76'),205,-.22,12);
  // Avenida de ligação contínua ao bairro antigo, sem interrupção entre as malhas viárias.
  box(82,.12,8.2,asphalt,111,-.075,14);
  // Passeios, bermas verdes e marcação central na ligação ao Povo Grande.
  box(82,.10,1.25,curb,111,-.015,9.1);box(82,.10,1.25,curb,111,-.015,18.9);
  const roadMark=mat('#f1e5c6',.72);
  for(let dash=0;dash<9;dash++)box(2.5,.025,.13,roadMark,76+dash*8.2,.005,14);
  for(const side of [-1,1]){
    box(82,.06,.8,grass,111,-.025,14+side*6.1);
    for(let i=0;i<8;i++){
      const shrub=new THREE.Mesh(new THREE.SphereGeometry(.32,8,7),mat('#397747'));
      shrub.position.set(76+i*9.5,.24,14+side*6.1);target.add(shrub);
    }
  }
  box(150,.12,10,asphalt,175,-.08,0);box(10,.12,180,asphalt,145,-.08,12);
  box(10,.12,180,asphalt,205,-.08,12);box(10,.12,180,asphalt,265,-.08,12);
  for(const z of [-78,-48,0,48,96])box(150,.12,8,asphalt,205,-.075,z);
  for(const x of [140,150,200,210,260,270])box(.5,.08,180,curb,x,-.02,12);
  // Largo ajardinado central, com fonte, bancos, caminhos e iluminação.
  box(46,.18,42,grass,175,-.02,22);
  box(34,.08,30,curb,175,.08,22);
  box(28,.06,24,grass,175,.14,22);
  const fountain=mat('#8ba9ad'),water=mat('#4b9da9');
  const basin=new THREE.Mesh(new THREE.CylinderGeometry(5.2,5.6,.55,32),fountain);basin.position.set(175,.48,22);target.add(basin);
  const pool=new THREE.Mesh(new THREE.CylinderGeometry(4.65,4.65,.08,32),water);pool.position.set(175,.79,22);target.add(pool);
  const jet=new THREE.Mesh(new THREE.CylinderGeometry(.16,.28,2.1,12),fountain);jet.position.set(175,1.78,22);target.add(jet);
  for(const [x,z,r] of [[160,8,0],[190,8,Math.PI],[160,36,0],[190,36,Math.PI],[175,4,Math.PI/2],[175,40,-Math.PI/2]]){
    box(3.2,.18,.62,mat('#79583e'),x,.55,z);box(3.2,.12,.18,mat('#c49a68'),x,.69,z-.2);
  }
  for(const [x,z] of [[153,5],[197,5],[153,39],[197,39],[165,2],[185,42]]){tree(x,z,.9);lamp(x+2,z+1)}
  label('LARGO DO AMBIENTE',175,7,0,23,2.6,'#174b37');
  // Governo Provincial com vinte pisos.
  building('GOVERNO PROVINCIAL',210,-22,24,18,20,'#d7d6cf',{sign:'#7b2632',roof:'#555b61',dest:'government'});
  // Bancos com fachadas institucionais.
  building('BANCO BCI',155,-28,13,10,2,'#e8e5d9',{sign:'#176b48',dest:'bank-bci'});
  building('BANCO BAI',180,-28,13,10,2,'#e8e5d9',{sign:'#9a252c',dest:'bank-bai'});
  yard(155,-39,15,5.5,-1,'#668653');yard(180,-39,15,5.5,-1,'#6b8e55');
  // Restaurante Polónia, com esplanada.
  building('RESTAURANTE POLÓNIA',155,72,18,12,1,'#e5c9a2',{sign:'#8b432c',roof:'#71452f',dest:'restaurant-polonia'});
  yard(155,59,16,6,-1,'#6d9657');
  for(let i=0;i<4;i++){box(1.5,.12,1.5,mat('#754d35'),148+i*4, .35,81);box(.12,1.05,.12,mat('#f0e3c6'),148+i*4,.9,81)}
  // Paróquia Católica com torre, cruz e nave.
  box(20,.22,14,concrete,180,.12,72);box(18,7,13,mat('#e6ddc8'),180,3.7,72);box(8,10,8,mat('#ded3bd'),180,5.1,62);
  const tower=box(4,17,4,mat('#d7cbb4'),180,8.7,62);box(.45,2.6,.45,mat('#f4e8ce'),180,18.6,62);box(1.8,.4,.45,mat('#f4e8ce'),180,19.1,62);
  box(2.2,3.5,.18,mat('#563c2d'),180,1.9,65.35);label('PARÓQUIA CATÓLICA',180,8.2,64.8,12,1.1,'#704d37');collision(180,72,20,14);
  const parishEntry=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));parishEntry.position.set(180,1.2,64.65);parishEntry.userData.worldEntry={dest:'parish',label:'PARÓQUIA CATÓLICA',x:180,z:72,front:-1,d:14};target.add(parishEntry);if(cityWorldEntrances)cityWorldEntrances.push(parishEntry.userData.worldEntry);if(entryMeshes)entryMeshes.push(parishEntry);
  yard(180,59,16,5.5,-1,'#71965c');
  // Três edifícios residenciais, incluindo um bloco com dez apartamentos.
  building('RESIDENCIAL · 10 APARTAMENTOS',235,70,20,15,5,'#d8c7a8',{sign:'#345b70',dest:'residential-10'});
  building('TORRE RESIDENCIAL',235,25,18,16,12,'#c7d0d1',{sign:'#37566b',dest:'residential-tower'});
  building('RESIDENCIAL FAMILIAR',235,-22,20,15,6,'#d8cbb8',{sign:'#79543c',dest:'residential-family'});
  yard(235,54,18,5.5,-1,'#6f9658');yard(235,9,17,5.5,-1,'#6c9256');yard(235,-34,18,5.5,-1,'#78985d');
  // COMPLEXO PETROLÍFERO CHEVRON — recinto industrial amplo com sede baixa ao centro.
  // O terreno ocupa o quarteirão entre as vias existentes, sem invadir os edifícios vizinhos.
  const chevronX=235,chevronZ=-63,chevronW=48,chevronD=28;
  box(chevronW,.18,chevronD,mat('#a7a69c'),chevronX,-.08,chevronZ);
  box(chevronW-3,.06,chevronD-3,mat('#777b70'),chevronX,-.005,chevronZ);
  const chevronFence=mat('#c8c9c3'),chevronSteel=mat('#6b7478'),chevronYellow=mat('#e6b83f'),chevronRed=mat('#a52b2b');
  // Vedação industrial, portão largo para camiões e guarita.
  box(chevronW,.95,.22,chevronFence,chevronX,.48,chevronZ-chevronD/2);
  box(.22,.95,chevronD,chevronFence,chevronX-chevronW/2,.48,chevronZ);
  box(.22,.95,chevronD,chevronFence,chevronX+chevronW/2,.48,chevronZ);
  box(15,.95,.22,chevronFence,chevronX-chevronW/2+7.5,.48,chevronZ+chevronD/2);
  box(15,.95,.22,chevronFence,chevronX+chevronW/2-7.5,.48,chevronZ+chevronD/2);
  for(const px of [chevronX-chevronW/2,chevronX-7.5,chevronX+7.5,chevronX+chevronW/2])box(.32,1.5,.32,chevronSteel,px,.72,chevronZ+chevronD/2);
  box(14,.16,.28,chevronRed,chevronX,.9,chevronZ+chevronD/2);
  box(2.8,2.4,2.5,mat('#d9d8cf'),chevronX-18,1.2,chevronZ+9.5);
  box(2.9,.16,2.6,chevronSteel,chevronX-18,2.45,chevronZ+9.5);
  box(1.2,.7,.08,glass,chevronX-18,1.55,chevronZ+8.22);
  label('CHEVRON · COMPLEXO PETROLÍFERO',chevronX,5.2,chevronZ+14.1,27,1.5,'#9a2424');
  // Sede administrativa baixa, com dois pisos, no centro e à frente do parque industrial.
  building('SEDE CHEVRON',chevronX,chevronZ+7,25,9,2,'#d8d9d3',{sign:'#9a2424',roof:'#41494d',dest:'chevron'});
  // Reservatórios verticais com anéis, cobertura e escadas de acesso.
  const verticalTank=(x,z,r,h)=>{
    const shellMat=mat('#aeb8b8',.38),topMat=mat('#7f8d90',.42);
    const body=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),shellMat);body.position.set(x,h/2+.08,z);body.castShadow=true;body.receiveShadow=true;target.add(body);
    const roof=new THREE.Mesh(new THREE.CylinderGeometry(r*.98,r*.98,.22,24),topMat);roof.position.set(x,h+.19,z);target.add(roof);
    for(const yy of [h*.28,h*.58,h*.88]){const ring=new THREE.Mesh(new THREE.TorusGeometry(r+.025,.055,6,24),chevronSteel);ring.rotation.x=Math.PI/2;ring.position.set(x,yy,z);target.add(ring);}
    box(.12,h*.72,.12,chevronYellow,x+r*.72,h*.48,z+r*.72);
    for(let k=0;k<5;k++)box(.42,.07,.09,chevronYellow,x+r*.72+.18,h*.18+k*h*.13,z+r*.72);
    addCityCollision(x,z,r*2.2,r*2.2,.25);
  };
  verticalTank(218,-65,2.6,6.8);
  verticalTank(229,-65,2.6,6.8);
  verticalTank(251,-65,2.6,6.8);
  // Separadores horizontais de processo e vasos de pressão.
  const horizontalVessel=(x,z,len,r)=>{
    const vessel=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,20),mat('#9ca9aa',.34));
    vessel.rotation.z=Math.PI/2;vessel.position.set(x,r+.55,z);vessel.castShadow=true;target.add(vessel);
    for(const dx of [-len*.28,len*.28])box(.7,.7,.8,chevronSteel,x+dx,.45,z);
    addCityCollision(x,z,len+1,r*2+1,.2);
  };
  horizontalVessel(244,-73,8,1.15);
  horizontalVessel(229,-73,6,1.0);
  // Pipe-rack elevado com suportes metálicos e tubagens de vários diâmetros.
  for(let i=0;i<6;i++){
    const px=214+i*5.2;
    box(.22,2.5,.22,chevronSteel,px,1.25,-58);
    box(.22,2.5,.22,chevronSteel,px,1.25,-70);
    for(let j=0;j<3;j++){
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.12+j*.025,.12+j*.025,5.2,12),mat(['#b7c0c0','#68777c','#d1a64b'][j],.35));
      pipe.rotation.z=Math.PI/2;pipe.position.set(px+2.6,2.05+j*.28,-63);target.add(pipe);
    }
  }
  // Bombas, motores, filtros e skids industriais.
  for(const [x,z] of [[214,-62],[240,-62],[257,-61],[218,-72],[257,-72]]){
    box(3.8,.32,2.2,chevronSteel,x,.22,z);
    box(1.35,1.05,1.15,mat('#356c70'),x-.65,.9,z);
    const motor=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,1.25,16),mat('#315e69'));motor.rotation.z=Math.PI/2;motor.position.set(x+.75,.95,z);target.add(motor);
    box(.22,1.5,.22,chevronYellow,x-1.5,.95,z);
    addCityCollision(x,z,4.1,2.5,.15);
  }
  // Tubos de perfuração armazenados em suportes paralelos.
  for(let row=0;row<3;row++){
    const z=-74+row*.9;
    box(9,.28,.32,chevronSteel,238,.65,z);
    for(let j=0;j<7;j++){
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,8.2,12),mat('#9aa4a6',.32));
      tube.rotation.z=Math.PI/2;tube.position.set(238,1.05+j*.18,z);target.add(tube);
    }
  }
  // Armazém técnico e oficina de manutenção.
  building('OFICINA E ARMAZÉM',253,-60,9,7,1,'#c9d0ce',{sign:'#45575c',roof:'#697579'});
  // Área de carga, acesso de viaturas e estacionamento técnico.
  box(12,.12,5,asphalt,218,-.01,-54);
  for(let i=0;i<4;i++)box(.1,.035,4,chevronYellow,213+i*3.2,.07,-54);
  const oilTruck=(x,z)=>{
    const g=new THREE.Group();g.position.set(x,0,z);
    const body=mat('#d8d9d2'),darkMat=mat('#303a3e'),tankMat=mat('#aeb8b8',.34);
    const part=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o;};
    part(new THREE.BoxGeometry(1.8,.85,2.1),body,0,.85,-1.4);
    part(new THREE.BoxGeometry(1.65,.95,1.2),mat('#5f7d89'),0,1.3,-1.55);
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(.8,.8,3.4,20),tankMat);tank.rotation.x=Math.PI/2;tank.position.set(0,1.05,1.2);g.add(tank);
    for(const side of [-1,1])for(const zz of [-1.8,-.4,1.2,2.2]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.22,12),darkMat);wheel.rotation.z=Math.PI/2;wheel.position.set(side*.95,.4,zz);g.add(wheel);}
    target.add(g);
  };
  oilTruck(216,-53);oilTruck(253,-53);
  // Luzes de segurança, sinalização e áreas de circulação.
  for(const [x,z] of [[212,-51],[258,-51],[212,-76],[258,-76]]){lamp(x,z);}
  label('ZONA INDUSTRIAL · ACESSO RESTRITO',235,3.2,-78,22,1,'#9a2424');
  // Colisões de vedação sem bloquear o portão de entrada.
  addCityCollision(chevronX,chevronZ-chevronD/2,chevronW,.22,.2);
  addCityCollision(chevronX-chevronW/2,chevronZ,.22,chevronD,.2);
  addCityCollision(chevronX+chevronW/2,chevronZ,.22,chevronD,.2);
  addCityCollision(chevronX-15,chevronZ+chevronD/2,18,.22,.2);
  addCityCollision(chevronX+15,chevronZ+chevronD/2,18,.22,.2);

  // Parque oficial do Governo Provincial: circulação, lugares marcados e frota detalhada.
  const parkX=239, parkZ=-40;
  box(28,.16,15,asphalt,parkX,-.015,parkZ);
  box(28,.12,.28,curb,parkX,.06,parkZ-7.35);box(28,.12,.28,curb,parkX,.06,parkZ+7.35);
  const parkingLine=mat('#f3e8c7');
  for(let i=0;i<4;i++){
    const px=228.5+i*7;
    box(.12,.035,10,parkingLine,px,.085,parkZ+.2);
    box(.12,.035,1.4,parkingLine,px,.085,parkZ-6.1);
  }
  box(28,.045,.16,parkingLine,parkX,.09,parkZ-6.1);
  const fleetMaterials={body:mat('#f1f0e9',.38),blue:mat('#173d64',.38),black:mat('#20272b',.42),rubber:mat('#17191b',.82),rim:mat('#aeb9bc',.32),window:new THREE.MeshStandardMaterial({color:'#5c8390',roughness:.2,metalness:.25}),lamp:mat('#f8e6ae',.3),red:mat('#a52e31',.36)};
  const fleetCar=(x,z,type='sedan',paint=fleetMaterials.body)=>{
    const g=new THREE.Group();g.position.set(x,0,z);
    const length=type==='pickup'?4.8:4.35,width=type==='van'?1.95:1.88;
    const part=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
    part(new THREE.BoxGeometry(width,.62,length),paint,0,.68,0);
    part(new THREE.BoxGeometry(width*.91,.16,length*.82),fleetMaterials.black,0,.42,0);
    const cabin=part(new THREE.BoxGeometry(width*.82,.72,type==='pickup'?2.35:2.55),fleetMaterials.window,0,1.22,-.12);
    part(new THREE.BoxGeometry(width*.86,.13,type==='pickup'?2.45:2.7),paint,0,1.62,-.12);
    if(type==='pickup')part(new THREE.BoxGeometry(width*.9,.45,1.25),paint,0,.93,1.58);
    if(type==='van')part(new THREE.BoxGeometry(width*.92,.52,1.2),paint,0,1.18,1.52);
    for(const side of [-1,1]){
      for(const zz of [-1.35,1.35]){
        const wheel=part(new THREE.CylinderGeometry(.39,.39,.22,16),fleetMaterials.rubber,side*(width/2+.015),.43,zz);
        wheel.rotation.z=Math.PI/2;
        const rim=part(new THREE.CylinderGeometry(.2,.2,.235,14),fleetMaterials.rim,side*(width/2+.025),.43,zz);rim.rotation.z=Math.PI/2;
        part(new THREE.CylinderGeometry(.075,.075,.24,12),fleetMaterials.black,side*(width/2+.035),.43,zz).rotation.z=Math.PI/2;
      }
      part(new THREE.BoxGeometry(.055,.22,.58),fleetMaterials.black,side*(width/2+.025),.9,-.05);
      part(new THREE.BoxGeometry(.08,.12,.24),fleetMaterials.lamp,side*.57,.73,-length/2-.025);
      part(new THREE.BoxGeometry(.08,.12,.24),fleetMaterials.red,side*.57,.73,length/2+.025);
      part(new THREE.BoxGeometry(.16,.13,.28),fleetMaterials.black,side*(width/2+.07),1.2,-.78);
    }
    part(new THREE.BoxGeometry(.56,.12,.07),fleetMaterials.black,0,.55,-length/2-.035);
    part(new THREE.BoxGeometry(.56,.12,.07),fleetMaterials.black,0,.55,length/2+.035);
    target.add(g);return g;
  };
  fleetCar(231.8,-40.3,'sedan',fleetMaterials.body);
  fleetCar(239,-40.3,'pickup',fleetMaterials.blue);
  fleetCar(246.2,-40.3,'van',fleetMaterials.body);
  // Guarita, cancela e sinalização de entrada junto ao edifício público.
  box(2.6,2.35,2.4,mat('#d9d4c7'),225.8,1.2,-39.8);
  box(2.72,.16,2.52,roof,225.8,2.42,-39.8);
  box(1.1,.72,.08,glass,225.8,1.55,-38.57);
  const barrier=mat('#f1eee4');box(.18,.16,4.8,barrier,225.2,1.05,-35.6);
  for(let i=0;i<5;i++)box(.2,.18,.56,fleetMaterials.red,225.2,1.06,-37.75+i*.95);
  box(4.2,.08,.12,parkingLine,225.4,.08,-33.1);
  label('PARQUE OFICIAL · GOVERNO PROVINCIAL',239,3.8,-47.5,19,1.05,'#7b2632');
  for(const [lx,lz] of [[225,-46],[253,-46]])lamp(lx,lz);

  // Esquadra de polícia.
  building('ESQUADRA DA POLÍCIA',265,-22,18,13,2,'#dce3e8',{sign:'#123d76',dest:'largo-police'});
  box(3,.1,2,mat('#183d6d'),265,.25,-12);label('POLÍCIA',265,3.1,-28,7,.8,'#123d76');
  // Campo de futebol TAF, colocado fora das avenidas.
  box(48,.18,30,mat('#477b45'),265,.02,72);
  box(44,.04,26,mat('#4c9851'),265,.14,72);
  const white=mat('#f4f0dc');box(.12,.04,26,white,243,.18,72);box(.12,.04,26,white,287,.18,72);box(44,.04,.12,white,265,.18,59);box(44,.04,.12,white,265,.18,85);
  const circle=new THREE.Mesh(new THREE.RingGeometry(4.8,4.94,48),white);circle.rotation.x=-Math.PI/2;circle.position.set(265,.18,72);target.add(circle);
  for(const x of [243,287]){box(.12,2.4,.12,white,x,1.3,72);box(3.6,2.4,.12,white,x+(x===243?1.8:-1.8),1.3,72);box(3.6,.12,.12,white,x+(x===243?1.8:-1.8),2.5,72)}
  label('CAMPO DE FUTEBOL TAF',265,5,56,18,1.3,'#174b37');
  const tafEntry=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));tafEntry.position.set(265,1.2,54.5);tafEntry.userData.worldEntry={dest:'taf',label:'CAMPO DE FUTEBOL TAF',x:265,z:72,front:-1,d:30};target.add(tafEntry);if(cityWorldEntrances)cityWorldEntrances.push(tafEntry.userData.worldEntry);if(entryMeshes)entryMeshes.push(tafEntry);

  // CAMPUS ISCED — terreno contínuo, campus único e escala universitária.
  // A expansão ocupa o novo quarteirão a leste, sem deslocar os edifícios existentes.
  const campusX=397,campusZ=12;
  box(176,.24,190,mat('#668b4c'),campusX,-.18,campusZ);
  const campusWalk=mat('#d9d5c7'),campusGreen=mat('#397747'),campusDark=mat('#174b37');
  const campusPath=(w,d,x,z)=>box(w,.10,d,campusWalk,x,-.015,z);
  // Avenida de acesso e portão monumental.
  box(92,.13,9,asphalt,315,-.075,14);
  box(92,.08,1.1,curb,315,-.015,8.8);box(92,.08,1.1,curb,315,-.015,19.2);
  for(let i=0;i<9;i++)box(2.4,.025,.12,roadMark,277+i*9.2,.005,14);
  box(1.1,5.2,1.1,mat('#e8e2d3'),330,2.6,8.5);box(1.1,5.2,1.1,mat('#e8e2d3'),330,2.6,19.5);
  box(1.3,.5,12,mat('#174b37'),330,5.1,14);
  label('ISCED · CAMPUS UNIVERSITÁRIO',330,7.1,14,18,1.7,'#174b37');
  // Passeio principal, alameda central e praça verde.
  campusPath(12,88,397,-2);campusPath(104,10,397,12);campusPath(12,82,397,43);
  box(48,.16,38,campusGreen,397,.05,10);
  box(38,.10,28,campusWalk,397,.16,10);
  box(31,.08,21,mat('#6f9b55'),397,.23,10);
  for(const [x,z] of [[379,-3],[415,-3],[379,23],[415,23],[390,-7],[404,27]]){tree(x,z,1.25);lamp(x+2,z+1)}
  for(const [x,z] of [[384,5],[410,5],[384,15],[410,15]]){box(3.2,.18,.72,mat('#76583f'),x,.48,z);box(3.2,.1,.2,mat('#c29a6a'),x,.62,z-.22)}
  // Bloco principal monumental: administração, reitoria e secretaria.
  const campusBuilding=(name,x,z,w,d,floors,color,dest=null)=>{
    const h=floors*3.35,wallMat=mat(color),trim=mat('#e9e5d8'),roofMat=mat('#17613d');
    box(w+2,.24,d+2,mat('#c5c3b7'),x,.03,z);
    box(w,h,d,wallMat,x,h/2+.15,z);
    box(w+.65,.32,d+.65,roofMat,x,h+.34,z);
    box(w+.25,.13,d+.25,trim,x,h-.05,z);
    for(let f=0;f<floors;f++){
      const y=1.15+f*3.35;
      for(let c=0;c<Math.floor(w/3);c++){
        const wx=x-w/2+1.8+c*(w-3.6)/Math.max(1,Math.floor(w/3)-1);
        box(1.65,1.55,.11,glass,wx,y,z-d/2-.07);
        box(1.78,.1,.15,trim,wx,y+.83,z-d/2-.08);
      }
      box(w+.12,.13,d+.12,trim,x,.52+f*3.35,z);
    }
    box(w*.16,2.55,.18,dark,x,1.35,z-d/2-.14);
    label(name,x,h+.9,z-d/2-.18,Math.min(w*1.2,25),1.25,'#174b37');
    collision(x,z,w,d);
    if(dest){
      const e=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.8),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));
      e.position.set(x,1.25,z-d/2-.3);e.userData.worldEntry={dest,label:name,x,z,front:-1,d};target.add(e);
      if(cityWorldEntrances)cityWorldEntrances.push(e.userData.worldEntry);if(entryMeshes)entryMeshes.push(e);
    }
  };
  campusBuilding('ISCED · REITORIA E SECRETARIA',397,-31,42,20,4,'#dce5d5','isced-university');
  campusBuilding('FACULDADE DE EDUCAÇÃO',359,-3,28,18,3,'#d7e2d0');
  campusBuilding('FACULDADE DE CIÊNCIAS',435,-3,28,18,3,'#d7e2d0');
  campusBuilding('BIBLIOTECA CENTRAL',359,42,30,20,2,'#e0e8d9');
  campusBuilding('LABORATÓRIOS',435,42,30,20,2,'#d4e1d4');
  campusBuilding('AUDITÓRIO UNIVERSITÁRIO',397,76,42,20,2,'#dce5d5');
  // Cantina, instalações desportivas e apoio ao estudante dentro do mesmo recinto.
  campusBuilding('CANTINA UNIVERSITÁRIA',350,82,20,14,1,'#e6e2d2');
  campusBuilding('CENTRO DE ESTUDANTES',444,82,20,14,1,'#e6e2d2');
  box(32,.18,22,mat('#397747'),397,-8,70);
  box(28,.05,18,mat('#4c9851'),397,.12,70);
  const campusLine=mat('#f5f0df');box(.12,.04,18,campusLine,383,.16,70);box(.12,.04,18,campusLine,411,.16,70);box(28,.04,.12,campusLine,397,.16,61);box(28,.04,.12,campusLine,397,.16,79);
  // Parque para estudantes, professores e visitantes.
  box(46,.16,18,asphalt,397,-.02,-58);
  for(let i=0;i<7;i++){const px=376+i*7;box(.12,.035,12,campusLine,px,.075,-58)}
  for(const [x,z] of [[340,-48],[454,-48],[340,55],[454,55],[340,92],[454,92],[367,-60],[427,-60],[367,95],[427,95]]){tree(x,z,1.05);lamp(x+2,z)}
  // Jardim periférico e caminhos de ligação entre todos os edifícios.
  for(const [x,z] of [[365,-20],[429,-20],[365,28],[429,28],[365,62],[429,62],[385,95],[409,95]])tree(x,z,.95);
  campusPath(78,5,397,-49);campusPath(5,118,344,18);campusPath(5,118,450,18);
  label('ISCED · INSTITUTO SUPERIOR DE CIÊNCIAS DA EDUCAÇÃO',397,13,2,36,2.2,'#174b37');

  // Passeios, árvores e iluminação de enquadramento.
  for(const [x,z] of [[135,-45],[135,45],[135,95],[295,-45],[295,45],[295,95],[205,105],[245,105],[165,-45],[185,-45]]){tree(x,z,.82);lamp(x+2,z)}
  // Placa monumental na entrada, voltada para a avenida de ligação.
  box(1,8,1.2,mat('#777b78'),132,4,0);box(1,8,1.2,mat('#777b78'),132,4,12);
  label('BEM-VINDO AO LARGO DO AMBIENTE',132,7,6,25,2.5,'#174b37');
}
