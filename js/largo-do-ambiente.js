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
    if(opts.doorGap){
      // Colisão com abertura central para o jogador entrar pela porta principal.
      const gap=5.2,front=z-d/2-.05,side=(w-gap)/2;
      collision(x-(gap/2+side/2),front,side,.8);
      collision(x+(gap/2+side/2),front,side,.8);
      collision(x,z+d/2-.1,w,.8);
      collision(x-w/2+.25,z,.7,d);
      collision(x+w/2-.25,z,.7,d);
    }else collision(x,z,w,d);
    if(opts.dest){const entry=new THREE.Mesh(new THREE.PlaneGeometry(2.1,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));entry.position.set(x,1.2,z-d/2-.28);entry.userData.worldEntry={dest:opts.dest,label:name,x,z,front:-1,d};target.add(entry);if(cityWorldEntrances)cityWorldEntrances.push(entry.userData.worldEntry);if(entryMeshes)entryMeshes.push(entry);}
  };
  // Bancos com arquitectura própria, fachada aberta e interior equipado.
  const bankBuilding=(name,x,z,w,d,brand,darkBrand,dest)=>{
    const geometryStart=target.children.length;
    const face=dest==='bank-bai'?1:-1;
    const front=z-d/2,back=z+d/2;
    const floor=mat('#d9d8d1'),inside=mat('#e9e7df'),brandMat=mat(brand),darkMat=mat(darkBrand),frame=mat('#34383c'),atmScreen=mat('#69c5d8',.28);
    box(w,.3,d,floor,x,.16,z);
    box(.32,3.55,d,inside,x-w/2+.16,1.95,z);box(.32,3.55,d,inside,x+w/2-.16,1.95,z);
    box(w,3.55,.32,inside,x,1.95,back-.16);
    box(w,.22,d,darkMat,x,3.82,z);
    box(w,2.55,.34,brandMat,x,5.18,front+.17);
    box(.34,2.55,d,brandMat,x-w/2+.17,5.18,z);box(.34,2.55,d,brandMat,x+w/2-.17,5.18,z);
    box(w,2.55,.34,darkMat,x,5.18,back-.17);
    box(w+.7,.28,d+.7,darkMat,x,6.62,z);box(w+.35,.18,d+.35,brandMat,x,3.98,z);
    // Fachada frontal envidraçada e entrada principal.
    box(1.1,3.5,.22,brandMat,x-w/2+.65,1.92,front);box(1.1,3.5,.22,brandMat,x+w/2-.65,1.92,front);
    box(.22,3.5,.22,brandMat,x-2.35,1.92,front);box(.22,3.5,.22,brandMat,x+2.35,1.92,front);
    box(1.95,3.1,.12,glass,x-3.65,1.95,front-.08);box(1.95,3.1,.12,glass,x+3.65,1.95,front-.08);
    box(4.15,.18,.28,brandMat,x,3.62,front-.08);
    box(1.85,2.65,.12,glass,x-.96,1.55,front-.15);box(1.85,2.65,.12,glass,x+.96,1.55,front-.15);
    box(.07,.72,.08,darkMat,x-.12,1.55,front-.24);box(.07,.72,.08,darkMat,x+.12,1.55,front-.24);
    // Interior de atendimento, balcões, terminais e área de espera.
    box(7.6,.12,1.15,brandMat,x,1.12,z-1.3);box(7.2,.82,.72,darkMat,x,1.55,z-1.3);box(7.25,.08,.78,brandMat,x,1.99,z-1.3);
    for(let i=0;i<3;i++){const px=x-2.35+i*2.35;box(.72,.08,.55,mat('#c6c4bc'),px,2.08,z-1.3);box(.55,.38,.08,atmScreen,px,2.31,z-1.62);box(.48,.08,.3,frame,px,2.08,z-1.62);}
    box(3.2,.9,.72,brandMat,x,1.48,z+1.35);box(3.35,.1,.82,darkMat,x,1.98,z+1.35);
    for(let row=0;row<2;row++)for(let col=0;col<3;col++){const px=x-3.7+col*1.45,pz=z+3.05+row*1.05;box(.95,.18,.72,darkMat,px,.68,pz);box(.95,.62,.16,brandMat,px,.99,pz+.28);}
    for(const side of [-1,1]){const ax=x+side*(w/2-1.45);box(.9,1.75,.62,darkMat,ax,1.05,front+.95);box(.62,.48,.08,atmScreen,ax,1.38,front+.61);box(.42,.18,.08,frame,ax,1.02,front+.61);box(1.2,.12,1.05,brandMat,ax,.12,front+.95);}
    for(const px of [x-w/2+.65,x+w/2-.65])box(.2,3.7,.28,darkMat,px,1.9,front-.2);
    box(w*.78,.55,.24,darkMat,x,3.2,front-.23);
    label(name,x,5.35,front-.42,Math.min(w*.9,17),1.05,brand);
    label('ATENDIMENTO · CAIXAS · MULTICAIXA',x,2.95,front-.3,Math.min(w*.82,15),.55,darkBrand);
    // Colisão em três lados e ombreiras, com entrada central livre.
    const entryFront=z+face*(d/2);
    collision(x-w/2,z,.55,d);collision(x+w/2,z,.55,d);collision(x,z-face*(d/2-.2),w,.55);
    collision(x-(w-4.2)/4,entryFront,(w-4.2)/2,.55);collision(x+(w-4.2)/4,entryFront,(w-4.2)/2,.55);
    const entry=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.8),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));
    entry.position.set(x,1.2,entryFront+face*.35);entry.userData.worldEntry={dest,label:name,x,z,front:face,d};target.add(entry);
    // O BAI roda 180° para a fachada principal ficar virada para norte, na direcção do BCI.
    if(face===1){for(let i=geometryStart;i<target.children.length;i++){const object=target.children[i];object.position.x=2*x-object.position.x;object.position.z=2*z-object.position.z;object.rotation.y+=Math.PI;}}
    if(cityWorldEntrances)cityWorldEntrances.push(entry.userData.worldEntry);if(entryMeshes)entryMeshes.push(entry);
  };
  // Enquadramento exterior do BAI: praça pavimentada, jardins, passeio acessível e parque marcado.
  const baiSurroundings=(x,z)=>{
    const paving=mat('#c9c9c2'),walk=mat('#e1ded4'),line=mat('#f5f1e4'),greenBed=mat('#638653'),curbStone=mat('#a9a79e');
    // Lote organizado entre as duas avenidas, sem avançar para a estrada nem para o Governo.
    box(34,.12,22,paving,x,-.055,z-4.5);
    box(34,.16,.28,curbStone,x,.015,z-15.35);
    box(.28,.16,22,curbStone,x-17,.015,z-4.5);box(.28,.16,22,curbStone,x+17,.015,z-4.5);
    // Passeio frontal e rampa de acesso alinhada com a porta principal.
    box(24,.10,1.25,walk,x,.055,z+6.95);
    box(4.4,.08,1.15,walk,x,.055,z+7.95);
    // Passeio lateral que liga a entrada ao estacionamento traseiro.
    box(2.2,.10,18.2,walk,x-13.1,.055,z-3.6);
    // Canteiros laterais com arbustos baixos, simétricos e sem tapar a fachada.
    for(const side of [-1,1]){
      const bx=x+side*15.2;
      box(2.1,.12,12,greenBed,bx,.035,z-3.5);
      for(const dz of [-8,-5,-2,1]){
        const shrub=new THREE.Mesh(new THREE.SphereGeometry(.48,12,9),mat('#397747'));
        shrub.position.set(bx,.48,z+dz);shrub.castShadow=true;target.add(shrub);
      }
      for(const dz of [-8,1])lamp(bx,z+dz);
    }
    // Parque com cinco lugares iguais, linhas claras e batentes de roda.
    const parkZ=z-11.55,slotDepth=5.35;
    box(27.5,.10,6.2,asphalt,x,.015,parkZ);
    for(let i=0;i<=5;i++){
      const sx=x-12.5+i*5;
      box(.11,.035,5.45,line,sx,.085,parkZ);
    }
    box(25.1,.035,.12,line,x,.085,parkZ-slotDepth/2);
    const paints=['#a83e36','#426d87','#d0b65b','#e5e5df','#47745b'];
    for(let i=0;i<5;i++){
      const cx=x-10+i*5;
      const body=mat(paints[i],.42),rubber=mat('#17191b',.9),windows=mat('#526b75',.28),chrome=mat('#c5c8c5',.35);
      const car=new THREE.Group();car.position.set(cx,.02,parkZ);
      const part=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;car.add(o);return o;};
      // Carros orientados para a saída norte, dentro de cada lugar.
      part(new THREE.BoxGeometry(1.82,.58,3.65),body,0,.66,0);
      part(new THREE.BoxGeometry(1.48,.78,1.95),windows,0,1.28,-.02);
      part(new THREE.BoxGeometry(1.68,.12,2.15),body,0,1.69,-.02);
      part(new THREE.BoxGeometry(1.55,.08,1.35),mat('#26343b',.25),0,1.68,.12);
      for(const side of [-1,1])for(const dz of [-1.18,1.18]){
        const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.18,16),rubber);
        wheel.rotation.z=Math.PI/2;wheel.position.set(side*.94,.39,dz);car.add(wheel);
      }
      for(const side of [-1,1]){
        part(new THREE.BoxGeometry(.34,.18,.08),mat('#fff1c5',.25),side*.57,.72,1.86);
        part(new THREE.BoxGeometry(.34,.18,.08),mat('#9f2828',.35),side*.57,.72,-1.86);
        part(new THREE.BoxGeometry(.06,.12,.18),chrome,side*.92,1.02,.35);
      }
      target.add(car);addCityCollision(cx,parkZ,2.05,3.9,.22);
      box(1.5,.12,.18,curbStone,cx,.13,parkZ-2.35);
    }
    label('ESTACIONAMENTO BAI',x,2.45,z-8.25,12,.72,'#063b70');
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
  // Governo Provincial transferido para um terreno independente.

  // BCI permanece sozinho no terreno original; BAI passa para um lote independente a sul.
  bankBuilding('BANCO BCI',159,-28,16,13,'#e83e8c','#17171d','bank-bci');
  yard(159,-39,19,5.5,-1,'#668653');
  // Lote independente do BAI entre o limite do Governo e a avenida, sem invadir a via.
  bankBuilding('BANCO BAI',175,-90,19,13,'#0878c9','#063b70','bank-bai');
  baiSurroundings(175,-90);
  for(const [lx,lz] of [[163,-84],[187,-84]])lamp(lx,lz);
  // Restaurante Polónia, com esplanada.
  building('RESTAURANTE POLÓNIA',160,72,18,12,1,'#e5c9a2',{sign:'#8b432c',roof:'#71452f',dest:'restaurant-polonia'});
  yard(160,59,16,6,-1,'#6d9657');
  for(let i=0;i<4;i++){box(1.5,.12,1.5,mat('#754d35'),153+i*4, .35,81);box(.12,1.05,.12,mat('#f0e3c6'),153+i*4,.9,81)}
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
  const chevronX=236,chevronZ=-65,chevronW=48,chevronD=22;
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
  // Pipe-rack elevado nas laterais, sem atravessar a sede nem os reservatórios.
  for(const px of [213.5,258]){
    for(const pz of [-58,-62,-66,-70,-74])box(.22,2.5,.22,chevronSteel,px,1.25,pz);
    for(let j=0;j<3;j++){
      const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.12+j*.025,.12+j*.025,16,12),mat(['#b7c0c0','#68777c','#d1a64b'][j],.35));
      pipe.rotation.x=Math.PI/2;pipe.position.set(px,2.05+j*.28,-66);target.add(pipe);
    }
  }
  // Bombas, motores, filtros e skids industriais.
  for(const [x,z] of [[223,-69],[240,-62],[252,-72]]){
    box(3.8,.32,2.2,chevronSteel,x,.22,z);
    box(1.35,1.05,1.15,mat('#356c70'),x-.65,.9,z);
    const motor=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,1.25,16),mat('#315e69'));motor.rotation.z=Math.PI/2;motor.position.set(x+.75,.95,z);target.add(motor);
    box(.22,1.5,.22,chevronYellow,x-1.5,.95,z);
    addCityCollision(x,z,4.1,2.5,.15);
  }
  // Tubos de perfuração armazenados em suportes paralelos.
  for(let row=0;row<3;row++){
    const z=-74+row*.9;
    box(9,.28,.32,chevronSteel,216,.65,z);
    for(let j=0;j<7;j++){
      const tube=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,8.2,12),mat('#9aa4a6',.32));
      tube.rotation.z=Math.PI/2;tube.position.set(216,1.05+j*.18,z);target.add(tube);
    }
  }
  // Armazém técnico e oficina de manutenção.
  building('OFICINA E ARMAZÉM',253,-60,9,7,1,'#c9d0ce',{sign:'#45575c',roof:'#697579'});
  // Área de carga, acesso de viaturas e estacionamento técnico.
  box(12,.12,5,asphalt,218,-.01,-57);
  for(let i=0;i<4;i++)box(.1,.035,4,chevronYellow,213+i*3.2,.07,-57);
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
  oilTruck(216,-56);oilTruck(253,-56);
  // Luzes de segurança, sinalização e áreas de circulação.
  for(const [x,z] of [[212,-56],[258,-56],[212,-81],[258,-81]]){lamp(x,z);}
  label('ZONA INDUSTRIAL · ACESSO RESTRITO',236,3.2,-80,22,1,'#9a2424');
  // Colisões de vedação sem bloquear o portão de entrada.
  addCityCollision(chevronX,chevronZ-chevronD/2,chevronW,.22,.2);
  addCityCollision(chevronX-chevronW/2,chevronZ,.22,chevronD,.2);
  addCityCollision(chevronX+chevronW/2,chevronZ,.22,chevronD,.2);
  addCityCollision(chevronX-15,chevronZ+chevronD/2,18,.22,.2);
  addCityCollision(chevronX+15,chevronZ+chevronD/2,18,.22,.2);

  // GOVERNO PROVINCIAL — complexo térreo, independente e totalmente pavimentado.
  const govX=145,govZ=-135,govW=78,govD=58;
  box(90,.24,76,mat('#b59a76'),govX,-.22,govZ);
  box(govW,.18,govD,mat('#bfc1bd'),govX,-.08,govZ);
  box(govW-3,.07,govD-3,asphalt,govX,-.005,govZ);
  const govFence=mat('#d8d7cf'),govMetal=mat('#59656a'),govGold=mat('#c8a75a');
  box(govW,.9,.2,govFence,govX,.45,govZ-govD/2);
  box(.2,.9,govD,govFence,govX-govW/2,.45,govZ);box(.2,.9,govD,govFence,govX+govW/2,.45,govZ);
  box(25,.9,.2,govFence,govX-govW/2+12.5,.45,govZ+govD/2);box(25,.9,.2,govFence,govX+govW/2-12.5,.45,govZ+govD/2);
  for(const px of [govX-govW/2,govX-12.5,govX+12.5,govX+govW/2])box(.32,1.4,.32,govMetal,px,.7,govZ+govD/2);
  box(24,.16,.28,govGold,govX,.88,govZ+govD/2);
  building('GOVERNO PROVINCIAL',govX+20,govZ-4,30,18,2,'#dedfd8',{sign:'#7b2632',roof:'#555b61',dest:'government'});
  label('GOVERNO PROVINCIAL · SERVIÇOS PÚBLICOS',govX+20,5.1,govZ+govD/2+1.2,29,1.3,'#7b2632');
  // Parque pavimentado, oito viaturas oficiais, circulação interna e guarita.
  const govLine=mat('#f4e8c8'),govPaints=['#f1f0e9','#173d64','#d8d9d2','#a52e31','#e4e0d6','#315c73','#f1f0e9','#777b7c'];
  box(62,.12,12,asphalt,govX,0,govZ+20);
  for(let i=0;i<8;i++){
    const px=govX-31+i*8.85;box(.12,.035,9,govLine,px,.08,govZ+20);
    const paint=mat(govPaints[i],.48),rubber=mat('#17191b',.9),glassCar=mat('#536d78',.28),cx=px+(i<4?-1.4:1.4);
    box(1.9,.62,4.1,paint,cx,.68,govZ+20);box(1.55,.72,2.35,glassCar,cx,1.25,govZ+19.88);box(1.82,.12,2.5,paint,cx,1.65,govZ+19.88);
    for(const side of [-1,1])for(const dz of [-1.35,1.35]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.2,14),rubber);wheel.rotation.z=Math.PI/2;wheel.position.set(cx+side*1,.4,govZ+20+dz);target.add(wheel);}
  }
  box(5,.08,5,asphalt,govX-34,0,govZ+22);box(2.6,2.25,2.4,mat('#dedbd1'),govX-34,1.12,govZ+22);
  box(2.72,.16,2.52,govMetal,govX-34,2.32,govZ+22);box(1.1,.72,.08,glass,govX-34,1.5,govZ+20.78);
  // Ligação pavimentada da estrada ao portão e à recepção.
  box(8,.12,74,asphalt,govX,-.075,-114);
  box(1.1,.08,74,curb,govX-4.5,-.015,-114);box(1.1,.08,74,curb,govX+4.5,-.015,-114);
  box(6,.12,38,asphalt,govX,-.075,-125);
  box(24,.12,6,asphalt,govX+9,-.075,govZ-13);
  for(let k=0;k<6;k++)box(2.1,.025,.13,govGold,govX,.005,-84-k*8.5);
  for(const [x,z] of [[govX-36,govZ-25],[govX+36,govZ-25],[govX-36,govZ+25],[govX+36,govZ+25]])lamp(x,z);
  label('PARQUE OFICIAL · GOVERNO PROVINCIAL',govX,3.4,govZ+govD/2-1,24,1.05,'#7b2632');

  // Esquadra de polícia — recinto murado, portão, parque e patrulhas.
  building('ESQUADRA DA POLÍCIA',295,-22,18,13,2,'#dce3e8',{sign:'#123d76',dest:'largo-police'});
  box(3,.1,2,mat('#183d6d'),295,.25,-12);label('POLÍCIA',295,3.1,-28,7,.8,'#123d76');
  // Quintal próprio da esquadra, com entrada alinhada à fachada e sem invadir a avenida.
  yard(295,-40,32,17,-1,'#6f8c5b');
  box(28,.12,14,asphalt,295,-.015,-40);
  box(7,.12,5,asphalt,295,-.01,-31.7);
  const policeLine=mat('#f4e8c8'),policeBlue=mat('#173f78'),policeWhite=mat('#e8edf0'),policeGlass=mat('#526d7b',.28),policeRubber=mat('#17191b',.9);
  for(let i=0;i<3;i++){
    const x=285+i*10,z=-40,g=new THREE.Group();g.position.set(x,.02,z);
    const part=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
    part(new THREE.BoxGeometry(1.95,.62,3.9),policeWhite,0,.68,0);
    part(new THREE.BoxGeometry(1.62,.72,2.05),policeGlass,0,1.24,-.05);
    part(new THREE.BoxGeometry(1.78,.13,2.2),policeWhite,0,1.62,-.05);
    part(new THREE.BoxGeometry(1.98,.22,1.45),policeBlue,0,.77,0);
    part(new THREE.BoxGeometry(.72,.12,.35),policeBlue,0,1.78,-.08);
    part(new THREE.BoxGeometry(.38,.16,.13),mat('#d63b36'),-.25,1.9,-.08);
    part(new THREE.BoxGeometry(.38,.16,.13),mat('#3476d2'),.25,1.9,-.08);
    part(new THREE.BoxGeometry(.55,.16,.08),mat('#fff4d8'),0,.92,1.98);
    for(const side of [-1,1])for(const dz of [-1.28,1.28]){
      const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,.2,16),policeRubber);wheel.rotation.z=Math.PI/2;wheel.position.set(side*1.02,.4,dz);g.add(wheel);
    }
    target.add(g);addCityCollision(x,z,2.25,4.25,.24);
    box(2.25,.035,4.45,policeLine,x,.085,z);
  }
  // Agentes fardados colocados na entrada e no parque de viaturas.
  const policeOfficer=(x,z,rotation=0)=>{
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;
    const uniform=mat('#173b70'),skin=mat('#9b654b'),boots=mat('#20252b'),badgeMat=mat('#d8b85f');
    const part=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o;};
    part(new THREE.CapsuleGeometry(.23,.62,4,8),uniform,0,1.02,0);
    part(new THREE.SphereGeometry(.19,14,12),skin,0,1.57,0);
    part(new THREE.CylinderGeometry(.2,.2,.1,12),uniform,0,1.78,0);
    part(new THREE.BoxGeometry(.34,.055,.34),uniform,0,1.84,0);
    part(new THREE.BoxGeometry(.09,.22,.035),badgeMat,-.12,1.22,-.205);
    for(const side of [-1,1]){
      part(new THREE.CapsuleGeometry(.075,.48,3,7),uniform,side*.29,1.02,0);
      part(new THREE.CapsuleGeometry(.085,.48,3,7),uniform,side*.13,.38,0);
      part(new THREE.BoxGeometry(.2,.12,.34),boots,side*.13,.09,.04);
    }
    target.add(g);addCityCollision(x,z,.65,.65,.25);
  };
  policeOfficer(278,-34,Math.PI/2);policeOfficer(312,-34,-Math.PI/2);policeOfficer(279,-45,Math.PI/2);policeOfficer(311,-45,-Math.PI/2);
  label('PARQUE DE VIATURAS POLICIAIS',295,3.1,-49,19,.9,'#123d76');
  for(const [x,z] of [[278,-49],[312,-49],[278,-31],[312,-31]])lamp(x,z);
  // Campo de futebol TAF, colocado fora das avenidas.
  box(48,.18,30,mat('#477b45'),295,.02,72);
  box(44,.04,26,mat('#4c9851'),295,.14,72);
  const white=mat('#f4f0dc');box(.12,.04,26,white,273,.18,72);box(.12,.04,26,white,317,.18,72);box(44,.04,.12,white,295,.18,59);box(44,.04,.12,white,295,.18,85);
  const circle=new THREE.Mesh(new THREE.RingGeometry(4.8,4.94,48),white);circle.rotation.x=-Math.PI/2;circle.position.set(295,.18,72);target.add(circle);
  for(const x of [273,317]){box(.12,2.4,.12,white,x,1.3,72);box(3.6,2.4,.12,white,x+(x===243?1.8:-1.8),1.3,72);box(3.6,.12,.12,white,x+(x===243?1.8:-1.8),2.5,72)}
  label('CAMPO DE FUTEBOL TAF',295,5,56,18,1.3,'#174b37');
  const tafEntry=new THREE.Mesh(new THREE.PlaneGeometry(2.8,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));tafEntry.position.set(295,1.2,54.5);tafEntry.userData.worldEntry={dest:'taf',label:'CAMPO DE FUTEBOL TAF',x:295,z:72,front:-1,d:30};target.add(tafEntry);if(cityWorldEntrances)cityWorldEntrances.push(tafEntry.userData.worldEntry);if(entryMeshes)entryMeshes.push(tafEntry);

  // UNIVERSIDADE ISCED — campus térreo, murado, organizado e com vinte salas de aula.
  const campusX=397,campusZ=12,campusW=176,campusD=190;
  box(campusW,.24,campusD,mat('#668b4c'),campusX,-.18,campusZ);
  // Cada edifício académico tem um ponto de entrada próprio e abre o acesso ao campus.
  const campusEntry=(name,x,z,d,front=-1,dest='isced-university')=>{
    const entry=new THREE.Mesh(new THREE.PlaneGeometry(2.5,2.8),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));
    entry.position.set(x,1.2,z+front*(d/2+.34));
    entry.userData.worldEntry={dest,label:name,x,z,front,d};
    target.add(entry);if(cityWorldEntrances)cityWorldEntrances.push(entry.userData.worldEntry);if(entryMeshes)entryMeshes.push(entry);
  };
  const campusWalk=mat('#d9d5c7'),campusGreen=mat('#397747'),campusDark=mat('#174b37'),campusFence=mat('#e0ded4');
  // Vedação do campus com portão principal a oeste.
  box(campusW,.92,.2,campusFence,campusX,.46,campusZ-campusD/2);box(campusW,.92,.2,campusFence,campusX,.46,campusZ+campusD/2);
  box(.2,.92,campusD,campusFence,campusX+campusW/2,.46,campusZ);
  box(.2,.92,78,campusFence,campusX-campusW/2,.46,campusZ-56);box(.2,.92,78,campusFence,campusX-campusW/2,.46,campusZ+56);
  for(const z of [campusZ-56,campusZ+56,campusZ])box(.28,1.5,.28,mat('#59645c'),campusX-campusW/2,.75,z);
  box(1.2,5.2,1.2,mat('#e8e2d3'),309,2.6,7.5);box(1.2,5.2,1.2,mat('#e8e2d3'),309,2.6,20.5);
  box(1.2,.5,13,campusDark,309,5.1,14);label('ISCED · ENTRADA PRINCIPAL',309,7.1,14,18,1.6,'#174b37');
  // Avenida e passeios internos pavimentados.
  box(92,.13,9,asphalt,315,-.075,14);box(92,.08,1.1,curb,315,-.015,8.8);box(92,.08,1.1,curb,315,-.015,19.2);
  for(let i=0;i<9;i++)box(2.4,.025,.12,roadMark,277+i*9.2,.005,14);
  box(142,.12,7,campusWalk,campusX,-.015,14);
  // Passeio contínuo do portão principal até à recepção, sem retirar a relva do restante campus.
  box(8,.12,68,campusWalk,397,-.015,-20);
  box(12,.12,9,campusWalk,397,-.015,-63);
  // Pequenos acessos transversais deixam a relva livre e fácil de atravessar.
  box(122,.1,5,campusWalk,campusX,-.01,-48);box(122,.1,5,campusWalk,campusX,-.01,68);
  box(5,.1,118,campusWalk,329,-.01,14);box(5,.1,118,campusWalk,465,-.01,14);
  // Recepção e secretaria com entrada acessível.
  building('RECEPÇÃO · MATRÍCULAS ISCED',397,-54,38,18,1,'#dce5d5',{sign:'#174b37',roof:'#17613d',dest:'isced-university',doorGap:true});
  box(28,.12,8,campusWalk,397,-.01,-48);
  // Dois blocos térreos, cada um com dez divisões, portas, janelas e carteiras.
  const classroomWing=(name,x,z)=>{
    const w=100,d=13,h=3.7,wallMat=mat('#dbe4d7'),trim=mat('#f0eee3'),roofMat=mat('#356d49'),doorMat=mat('#76533b'),deskMat=mat('#b58a5d'),chairMat=mat('#526d7b');
    box(w,.18,d,mat('#c7c5ba'),x,.05,z);box(w,h,d,wallMat,x,h/2+.15,z);box(w+.5,.22,d+.5,roofMat,x,h+.28,z);box(w+.1,.12,d+.1,trim,x,h-.05,z);
    for(let i=0;i<9;i++)box(.18,h-.2,d-.2,trim,x-w/2+(i+1)*w/10,h/2+.15,z);
    for(let i=0;i<10;i++){
      const cx=x-w/2+(i+.5)*w/10,front=z+d/2+.08;
      box(2.7,1.45,.09,glass,cx,2.15,front);box(1.05,2.15,.14,doorMat,cx-3.25,1.22,front);box(1.15,.1,.18,trim,cx-3.25,2.34,front);
      for(let row=0;row<2;row++)for(let col=0;col<2;col++){
        const px=cx-1.9+col*1.5,pz=z-3.4+row*2.5;
        box(.85,.1,.55,deskMat,px,.95,pz);box(.12,.7,.12,doorMat,px-.32,.45,pz);box(.12,.7,.12,doorMat,px+.32,.45,pz);box(.42,.08,.42,chairMat,px,.48,pz+.65);
      }
    }
    label(name,x,h+1.1,z-d/2-.2,25,1.15,'#174b37');collision(x,z,w,d);
    campusEntry(name,x,z,d,1,name.includes('BLOCO ACADÉMICO A')?'isced-classroom-a':'isced-classroom-b');
  };
  classroomWing('BLOCO ACADÉMICO A · 10 SALAS',397,-15);
  classroomWing('BLOCO ACADÉMICO B · 10 SALAS',397,32);
  // Biblioteca, laboratórios, auditório e serviços — edifícios de um piso.
  building('BIBLIOTECA CENTRAL',350,53,28,16,1,'#e0e8d9',{sign:'#174b37'});campusEntry('BIBLIOTECA CENTRAL',350,53,16,-1,'isced-library');
  building('LABORATÓRIOS',444,53,28,16,1,'#d4e1d4',{sign:'#356d49'});campusEntry('LABORATÓRIOS',444,53,16,-1,'isced-labs');
  building('AUDITÓRIO UNIVERSITÁRIO',397,82,38,14,1,'#dce5d5',{sign:'#174b37'});campusEntry('AUDITÓRIO UNIVERSITÁRIO',397,82,14,-1,'isced-auditorium');
  building('CANTINA UNIVERSITÁRIA',350,82,20,12,1,'#e6e2d2',{sign:'#8b6a3e'});campusEntry('CANTINA UNIVERSITÁRIA',350,82,12,-1,'isced-canteen');
  building('CENTRO DE ESTUDANTES',444,82,20,12,1,'#e6e2d2',{sign:'#356d49'});campusEntry('CENTRO DE ESTUDANTES',444,82,12,-1,'isced-students');
  // Jardim, bancos, árvores e parque de estacionamento pavimentado.
  box(38,.16,25,campusGreen,397,0,48);box(30,.08,18,campusWalk,397,.12,48);
  for(const [x,z] of [[378,42],[416,42],[378,55],[416,55]]){tree(x,z,.95);lamp(x+2,z+1)}
  for(const [x,z] of [[384,48],[410,48]])box(3.2,.18,.72,mat('#76583f'),x,.48,z);
  box(52,.16,14,asphalt,397,-.02,-74);
  const campusLine=mat('#f5f0df');for(let i=0;i<8;i++)box(.12,.035,10,campusLine,372+i*7.2,.075,-74);
  for(const [x,z] of [[340,-70],[454,-70],[340,96],[454,96],[367,96],[427,96]]){tree(x,z,1.05);lamp(x+2,z)}
  label('UNIVERSIDADE ISCED · CAMPUS ACADÉMICO',397,12,1,36,2,'#174b37');

  // Passeios, árvores e iluminação de enquadramento.
  for(const [x,z] of [[135,-45],[135,45],[135,95],[295,-45],[295,45],[295,95],[205,105],[245,105],[165,-45],[185,-45]]){tree(x,z,.82);lamp(x+2,z)}
  // Placa monumental na entrada, voltada para a avenida de ligação.
  box(1,8,1.2,mat('#777b78'),132,4,0);box(1,8,1.2,mat('#777b78'),132,4,12);
  label('BEM-VINDO AO LARGO DO AMBIENTE',132,7,6,25,2.5,'#174b37');
}
