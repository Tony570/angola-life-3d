// Largo do Ambiente — expansão independente da cidade existente.
export function buildLargoDoAmbiente({ THREE, target, addCityCollision }) {
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
  };
  // Terreno próprio a leste: não remove nem desloca construções já existentes.
  box(250,.22,220,mat('#b59a76'),205,-.22,12);
  // Avenida de ligação ao bairro antigo e ruas internas.
  box(150,.12,10,asphalt,175,-.08,0);box(10,.12,180,asphalt,145,-.08,12);
  box(10,.12,180,asphalt,205,-.08,12);box(10,.12,180,asphalt,265,-.08,12);
  for(const z of [-48,0,48,96])box(150,.12,8,asphalt,205,-.075,z);
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
  building('GOVERNO PROVINCIAL',210,-22,24,18,20,'#d7d6cf',{sign:'#7b2632',roof:'#555b61'});
  // Bancos com fachadas institucionais.
  building('BANCO BCI',155,-28,13,10,2,'#e8e5d9',{sign:'#176b48'});
  building('BANCO BAI',180,-28,13,10,2,'#e8e5d9',{sign:'#9a252c'});
  // Restaurante Polónia, com esplanada.
  building('RESTAURANTE POLÓNIA',155,72,18,12,1,'#e5c9a2',{sign:'#8b432c',roof:'#71452f'});
  for(let i=0;i<4;i++){box(1.5,.12,1.5,mat('#754d35'),148+i*4, .35,81);box(.12,1.05,.12,mat('#f0e3c6'),148+i*4,.9,81)}
  // Paróquia Católica com torre, cruz e nave.
  box(20,.22,14,concrete,180,.12,72);box(18,7,13,mat('#e6ddc8'),180,3.7,72);box(8,10,8,mat('#ded3bd'),180,5.1,62);
  const tower=box(4,17,4,mat('#d7cbb4'),180,8.7,62);box(.45,2.6,.45,mat('#f4e8ce'),180,18.6,62);box(1.8,.4,.45,mat('#f4e8ce'),180,19.1,62);
  box(2.2,3.5,.18,mat('#563c2d'),180,1.9,65.35);label('PARÓQUIA CATÓLICA',180,8.2,64.8,12,1.1,'#704d37');collision(180,72,20,14);
  // Três edifícios residenciais, incluindo um bloco com dez apartamentos.
  building('RESIDENCIAL · 10 APARTAMENTOS',235,70,20,15,5,'#d8c7a8',{sign:'#345b70'});
  building('TORRE RESIDENCIAL',235,25,18,16,12,'#c7d0d1',{sign:'#37566b'});
  building('RESIDENCIAL FAMILIAR',235,-22,20,15,6,'#d8cbb8',{sign:'#79543c'});
  // Esquadra de polícia.
  building('ESQUADRA DA POLÍCIA',265,-22,18,13,2,'#dce3e8',{sign:'#123d76'});
  box(3,.1,2,mat('#183d6d'),265,.25,-12);label('POLÍCIA',265,3.1,-28,7,.8,'#123d76');
  // Campo de futebol TAF, colocado fora das avenidas.
  box(48,.18,30,mat('#477b45'),265,.02,72);
  box(44,.04,26,mat('#4c9851'),265,.14,72);
  const white=mat('#f4f0dc');box(.12,.04,26,white,243,.18,72);box(.12,.04,26,white,287,.18,72);box(44,.04,.12,white,265,.18,59);box(44,.04,.12,white,265,.18,85);
  const circle=new THREE.Mesh(new THREE.RingGeometry(4.8,4.94,48),white);circle.rotation.x=-Math.PI/2;circle.position.set(265,.18,72);target.add(circle);
  for(const x of [243,287]){box(.12,2.4,.12,white,x,1.3,72);box(3.6,2.4,.12,white,x+(x===243?1.8:-1.8),1.3,72);box(3.6,.12,.12,white,x+(x===243?1.8:-1.8),2.5,72)}
  label('CAMPO DE FUTEBOL TAF',265,5,56,18,1.3,'#174b37');
  // Passeios, árvores e iluminação de enquadramento.
  for(const [x,z] of [[135,-45],[135,45],[135,95],[295,-45],[295,45],[295,95],[205,105],[245,105],[165,-45],[185,-45]]){tree(x,z,.82);lamp(x+2,z)}
  // Placa monumental na entrada, voltada para a avenida de ligação.
  box(1,8,1.2,mat('#777b78'),132,4,0);box(1,8,1.2,mat('#777b78'),132,4,12);
  label('BEM-VINDO AO LARGO DO AMBIENTE',132,7,6,25,2.5,'#174b37');
}
