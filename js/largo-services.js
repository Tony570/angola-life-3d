const money = value => new Intl.NumberFormat('pt-PT').format(Number(value)||0) + ' Kz';
const serviceRooms = {
  'bank-bci': {title:'Banco BCI',color:'#176b48',bank:'BCI'},
  'bank-bai': {title:'Banco BAI',color:'#9a252c',bank:'BAI'},
  'chevron': {title:'Chevron',color:'#c4a34d'},
  'restaurant-polonia': {title:'Restaurante Polónia',color:'#8b432c'},
  'parish': {title:'Paróquia Católica',color:'#704d37'},
  'government': {title:'Governo Provincial',color:'#7b2632'},
  'largo-police': {title:'Esquadra do Largo do Ambiente',color:'#123d76'},
  'residential-10': {title:'Residencial · 10 apartamentos',color:'#345b70'},
  'residential-tower': {title:'Torre Residencial',color:'#37566b'},
  'residential-family': {title:'Residencial Familiar',color:'#79543c'},
  'taf': {title:'Campo de Futebol TAF',color:'#174b37'},
  'isced-university': {title:'ISCED · Instituto Superior de Ciências da Educação',color:'#174b37'}
};

export function buildLargoServiceInterior({THREE,target,kind,buildCharacter,avatar,addWorkAgent}) {
  const cfg=serviceRooms[kind]||{title:'Serviços do Largo do Ambiente',color:'#24465b'};
  const mat=(color,roughness=.78,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
  const wood=mat('#80583d',.55),woodLight=mat('#b58a5d',.52),metal=mat('#59666b',.38,.55),dark=mat('#263238',.55),glass=new THREE.MeshStandardMaterial({color:'#83aab4',roughness:.2,metalness:.12}),wall=mat('#e7e3d9'),floor=mat(kind==='parish'?'#c5b69e':kind==='taf'?'#477b45':'#c8c5b9');
  const add=(geo,m,x,y,z,ry=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=true;o.receiveShadow=true;target.add(o);return o};
  const box=(w,h,d,m,x,y,z,ry=0)=>{const o=add(new THREE.BoxGeometry(w,h,d),m,x,y,z,ry);return o};
  const cylinder=(rt,rb,h,m,x,y,z,n=16)=>add(new THREE.CylinderGeometry(rt,rb,h,n),m,x,y,z);
  const sphere=(r,m,x,y,z)=>add(new THREE.SphereGeometry(r,12,10),m,x,y,z);
  const rounded=(w,h,d,r,m,x,y,z)=>add(new THREE.BoxGeometry(w,h,d),m,x,y,z);
  const desk=(x,z,rotation=0)=>{
    const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;target.add(g);
    const p=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;o.receiveShadow=true;g.add(o);return o};
    p(new THREE.BoxGeometry(1.75,.12,.82),woodLight,0,.86,0);
    for(const sx of [-.72,.72])p(new THREE.CylinderGeometry(.055,.07,.82,10),metal,sx,.43,0);
    p(new THREE.BoxGeometry(.5,.58,.7),wood,-.53,.48,0);
    p(new THREE.BoxGeometry(.82,.48,.055),dark,.12,1.22,-.22);
    p(new THREE.BoxGeometry(.74,.39,.025),glass,.12,1.22,-.185);
    p(new THREE.BoxGeometry(.9,.055,.55),metal,.15,.98,.05);
    p(new THREE.CylinderGeometry(.035,.035,.22,10),metal,.12,1.11,.04);
    p(new THREE.BoxGeometry(.32,.025,.2),dark,.12,1.25,.04);
    p(new THREE.BoxGeometry(.28,.025,.2),mat('#e8e5dc'),-.48,.94,.14);
  };
  const officeChair=(x,z,rotation=0,color='#344b5d')=>{
    const seat=mat(color,.62),g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;target.add(g);
    const p=(geo,m,px,py,pz)=>{const o=new THREE.Mesh(geo,m);o.position.set(px,py,pz);o.castShadow=true;g.add(o);return o};
    p(new THREE.CylinderGeometry(.07,.09,.55,10),metal,0,.34,0);
    p(new THREE.CylinderGeometry(.42,.42,.13,16),seat,0,.66,0);
    p(new THREE.BoxGeometry(.78,.72,.14),seat,0,1.06,-.3);
    p(new THREE.BoxGeometry(.12,.48,.12),metal,-.43,.78,-.03);p(new THREE.BoxGeometry(.12,.48,.12),metal,.43,.78,-.03);
    for(let a=0;a<5;a++){const angle=a*Math.PI*2/5;p(new THREE.CylinderGeometry(.045,.045,.5,8),metal,Math.cos(angle)*.23,.08,Math.sin(angle)*.23)}
    for(let a=0;a<5;a++){const angle=a*Math.PI*2/5;p(new THREE.SphereGeometry(.09,8,6),dark,Math.cos(angle)*.23,.045,Math.sin(angle)*.23)}
  };
  const waitingSeat=(x,z,rotation=0)=>{
    const fabric=mat('#536d7b',.9);box(1.55,.28,.62,fabric,x,.52,z,rotation);
    box(1.55,.68,.2,fabric,x,.95,z+.22*Math.cos(rotation),rotation);
    for(const sx of [-.62,.62])box(.14,.5,.68,metal,x+sx*Math.cos(rotation),.73,z-sx*Math.sin(rotation),rotation);
    for(const sx of [-.58,.58])for(const sz of [-.2,.2])cylinder(.045,.055,.42,metal,x+sx*Math.cos(rotation)+sz*Math.sin(rotation),.22,z+sx*Math.sin(rotation)-sz*Math.cos(rotation),10);
  };
  const plant=(x,z)=>{
    cylinder(.25,.32,.42,mat('#a35d3d'),x,.22,z,14);
    cylinder(.055,.075,.52,mat('#557347'),x,.65,z,8);
    for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leaf=sphere(.2,mat('#397447'),x+Math.cos(a)*.22,.76+(i%2)*.12,z+Math.sin(a)*.22);leaf.scale.set(1.6,.55,.8);leaf.rotation.y=a}
  };
  const filingCabinet=(x,z,color='#63747b')=>{
    box(.95,1.65,.72,mat(color),x,.84,z);
    for(let i=0;i<4;i++){box(.78,.025,.035,metal,x,.25+i*.39,z+.38);box(.11,.045,.04,metal,x,.31+i*.39,z+.405)}
  };
  const wallScreen=(x,z,label)=>{
    box(2.2,1.2,.09,dark,x,2.55,z);box(2.02,1.02,.035,glass,x,2.55,z+.055);
    box(.55,.08,.14,metal,x,1.91,z+.12);
  };
  box(16,.2,14,floor,0,-.14,0);
  box(16,4,.2,wall,0,1.85,-7);box(16,4,.2,wall,0,1.85,7);
  box(.2,4,14,wall,-8,1.85,0);box(.2,4,14,wall,8,1.85,0);
  // Rodapés, iluminação e janelas com molduras para dar profundidade às salas.
  const trim=mat('#c2b9a8');box(15.8,.16,.12,trim,0,.08,-6.86);box(15.8,.16,.12,trim,0,.08,6.86);
  for(const x of [-4.8,0,4.8]){box(2.2,1.3,.07,glass,x,2.35,-6.86);box(2.3,.09,.12,metal,x,3.04,-6.8)}
  for(const x of [-4.5,4.5]){box(.09,.08,1.2,mat('#f4e7c5',.35),x,3.72,0)}
  // Cada estabelecimento recebe mobiliário de acordo com a sua actividade.
  if(kind==='isced-university'){
    const green=mat('#174b37'),greenLight=mat('#dce9dc'),gold=mat('#c7a85b'),white=mat('#f5f4ed'),screen=mat('#263b45'),bookColors=['#315f48','#9a653f','#344f75','#a68a42','#8d4545'];
    // Recepção principal com balcão curvo, postos informáticos e cadeiras de atendimento.
    box(8.8,.22,1.45,wood,0,.78,-3.45);box(9,.12,1.5,gold,0,.96,-3.45);box(8.5,.82,.12,green,0,.39,-2.75);
    for(const x of [-2.7,0,2.7]){box(.9,.58,.08,screen,x,1.55,-3.2);box(1.02,.07,.55,metal,x,1.2,-2.95);box(.12,.2,.12,metal,x,1.34,-2.95);officeChair(x,-1.95,Math.PI)}
    box(5.4,1.65,.16,green,0,2.45,-6.78);box(5.05,1.3,.035,white,0,2.45,-6.68);wallScreen(0,-6.82,'ISCED · SECRETARIA ACADÉMICA');
    // Zona de espera para estudantes e encarregados.
    for(const x of [-5.6,-3.8,3.8,5.6])waitingSeat(x,4.65,Math.PI);
    for(const x of [-6.5,6.5])plant(x,5.65);
    // Balcão de informações e painel de avisos académicos.
    box(2.2,1.25,.22,woodLight,-5.7,1.15,-4.8);box(2.25,.1,.25,gold,-5.7,1.82,-4.8);
    box(2.5,1.7,.12,green,5.6,2.1,-6.78);box(2.22,1.42,.035,white,5.6,2.1,-6.69);
    for(let i=0;i<3;i++){box(.5,.06,.035,gold,5.05+i*.55,2.5,-6.64);box(.42,.06,.035,green,5.05+i*.55,2.1,-6.64);box(.36,.06,.035,metal,5.05+i*.55,1.7,-6.64)}
    // Pequena área de consulta digital com computadores e cadeiras.
    for(const x of [-5.4,-2.8,2.8,5.4]){desk(x,1.15);officeChair(x,2.55,Math.PI)}
    // Estantes de livros com lombadas visíveis e mesa de leitura.
    for(const x of [-6.8,6.8]){
      box(1.35,2.55,.5,wood,x,.1, -.15);
      for(let shelf=0;shelf<4;shelf++){
        box(1.28,.08,.55,gold,x,.48+shelf*.57,-.15);
        for(let b=0;b<6;b++){const bm=mat(bookColors[(b+shelf)%bookColors.length]);box(.13,.38,.32,bm,x-.53+b*.21,.7+shelf*.57,-.15)}
      }
    }
    box(3.6,.12,1.3,woodLight,0,.78,4.1);for(const x of [-1.4,1.4])for(const z of [3.65,4.55])box(.08,.72,.08,metal,x,.36,z);
    for(const x of [-.95,.95]){box(.72,.06,.45,white,x,.88,4.1);box(.55,.025,.34,greenLight,x,.93,4.1)}
    // Iluminação de tecto, sinalética e acabamento institucional.
    for(const x of [-4,0,4]){box(1.8,.07,.55,white,x,3.82,-1.8);box(1.8,.025,.55,gold,x,3.77,-1.8)}
    box(4.8,.08,.08,gold,0,3.15,6.65);box(4.8,.08,.08,gold,0,3.15,-6.65);
  }else if(['bank-bci','bank-bai','government','largo-police'].includes(kind)){
    box(7.2,.95,.95,wood,0,.48,-3.45);box(7.35,.12,1.02,metal,0,1.02,-3.45);
    for(let i=0;i<3;i++){const x=-4.7+i*4.7;box(1.15,.82,.09,glass,x,2.15,-6.8);box(1.3,.08,.12,metal,x,2.62,-6.76);box(.85,.08,.55,wood,x,.57,1.2);box(.07,.65,.07,metal,x-.34,.32,1.2);box(.07,.65,.07,metal,x+.34,.32,1.2);desk(x, -1.9);officeChair(x,-.72,Math.PI)}
    for(const x of [-5.5,5.5])filingCabinet(x,2.6);
    waitingSeat(-5.25,4.6);waitingSeat(-2.9,4.6);plant(6.6,5.4);
    wallScreen(0,-6.82,'ATENDIMENTO');
  }else if(kind==='chevron'){
    box(7.7,.95,1.05,wood,0,.48,-3.2);box(7.85,.12,1.1,metal,0,1.02,-3.2);
    for(const x of [-5.1,-1.7,1.7,5.1]){desk(x,-.8);officeChair(x,.35,Math.PI)}
    filingCabinet(-6,3.1);filingCabinet(6,3.1);waitingSeat(-4.5,5);plant(6.7,5.4);
    // Capacetes, ferramentas e armário técnico reconhecíveis.
    box(1.3,1.8,.72,mat('#52616a'),-6.7,.92,-1.4);
    for(let i=0;i<3;i++)sphere(.25,mat('#d7a72d'),-6.7,.9+i*.3,-.98);
    for(const x of [-2.2,2.2]){box(1.25,.08,.5,woodLight,x,.05,4.7);for(const sx of [-.5,.5])box(.08,.65,.08,metal,x+sx,.36,4.7)}
    wallScreen(0,-6.82,'RECEPÇÃO CHEVRON');
  }else if(kind==='restaurant-polonia'){
    for(const x of [-4.6,0,4.6])for(const z of [-1.5,3.3]){
      cylinder(.78,.82,.14,woodLight,x,.86,z,24);cylinder(.09,.12,.72,metal,x,.43,z,12);
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const sx=x+Math.cos(a)*1.15,sz=z+Math.sin(a)*1.15;box(.52,.13,.5,wood,sx,.52,sz);box(.5,.58,.12,wood,sx,.84,sz-Math.cos(a)*.16)}
      for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const bx=x+Math.cos(a)*.5,bz=z+Math.sin(a)*.5;cylinder(.035,.04,.42,metal,bx,.22,bz,8)}
    }
    box(5,.95,.85,wood,0,.48,-5);box(5.1,.12,.9,metal,0,1,-5);
    // Balcão de cozinha, frigorífico e equipamento de preparação.
    box(2.1,2.15,1.1,mat('#d9e0df'),-6.2,1.08,-4.8);box(1.8,.08,.85,metal,-6.2,2.2,-4.8);
    box(2.3,1.25,.85,metal,6.1,.65,-4.8);for(let i=0;i<4;i++)cylinder(.18,.18,.08,dark,5.35+(i%2)*.9,.92,-5.05+Math.floor(i/2)*.5,16);
    plant(6.6,5.6);
  }else if(kind==='parish'){
    box(1.8,6.6,1.8,mat('#e6ddc8'),0,3.25,-4.2);box(.35,2.2,.25,mat('#f4e8ce'),0,6.9,-4.2);box(1.5,.3,.25,mat('#f4e8ce'),0,7.75,-4.2);
    for(const z of [-1.2,1.3,3.8])for(const x of [-3.8,3.8]){
      box(6.3,.16,.55,wood,x,.52,z);box(6.3,.72,.14,wood,x,.92,z+.22);
      for(const sx of [-2.8,2.8])box(.12,.48,.6,wood,x+sx,.27,z);
    }
    box(1.8,.16,.9,woodLight,0,.58,2.6);box(.12,1.1,.12,wood,0,1.18,2.6);plant(-6,5.3);plant(6,5.3);
  }else if(kind.startsWith('residential')){
    // Sala doméstica: sofá estofado, mesa de centro, televisão e zona de refeições.
    waitingSeat(-3.9,1.5,Math.PI/2);waitingSeat(-3.9,3.4,Math.PI/2);
    box(1.7,.18,1.05,woodLight,-1.1,.48,2.5);for(const sx of [-.7,.7])for(const sz of [-.4,.4])cylinder(.045,.05,.45,metal,-1.1+sx,.22,2.5+sz,8);
    box(2.4,1.35,.1,dark,0,1.75,-6.78);box(2.22,1.15,.04,glass,0,1.75,-6.7);
    box(2.4,.1,.7,wood,0,.65,-6.2);plant(6.2,5.3);
    cylinder(.55,.58,.12,woodLight,4.1,.85,2.6,24);cylinder(.07,.09,.72,metal,4.1,.43,2.6,12);
    for(const x of [3,5.2])waitingSeat(x,4.1,Math.PI);
    // Cozinha e frigorífico em miniatura.
    box(1.25,2.1,.9,mat('#dce1df'),6.4,1.05,-2.5);box(1.1,.035,.08,metal,6.4,1.35,-2.02);
  }else if(kind==='taf'){
    const white=mat('#f4f0dc');box(12,.04,.12,white,0,.02,-5.5);box(12,.04,.12,white,0,.02,5.5);box(.12,.04,11,white,-6,.02,0);box(.12,.04,11,white,6,.02,0);
    for(const x of [-6,6]){box(.12,2.2,.12,white,x,1.1,0);box(2.2,.12,.12,white,x+(x<0?1.1:-1.1),2.2,0);box(2.2,2.2,.12,white,x+(x<0?1.1:-1.1),1.1,0)}
    for(const x of [-5,5]){box(2.1,1.5,.7,mat('#65747a'),x,.75,5.5);for(let i=0;i<4;i++)box(.35,.55,.08,metal,x-.7+i*.46,.72,5.12)}
  }
  // Balcão de recepção e computadores com monitor, base, teclado e cadeira.
  if(['bank-bci','bank-bai','government','chevron','largo-police'].includes(kind)){
    for(const x of [-2.3,2.3]){box(.9,.62,.08,glass,x,1.5,-3.1);box(1,.07,.55,metal,x,1.15,-2.85);box(.12,.22,.12,metal,x,1.28,-2.85)}
  }
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle=cfg.color;ctx.fillRect(0,0,768,128);ctx.fillStyle='#fff4d8';ctx.font='bold 43px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cfg.title.toUpperCase(),384,66);
  const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.5,1.25),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide}));sign.position.set(0,3.25,-6.82);target.add(sign);
  const staffLook={gender:'female',skin:'#c98962',hair:'#241b18',shirt:kind==='chevron'?'#d2b24c':'#3867a8',pants:'#26364b',hairStyle:'medio'};
  if(addWorkAgent){
    addWorkAgent(staffLook,{x:-2.4,y:0,z:-2.35},[[-2.4,-2.35],[-1.5,-2.35],[-1.5,-1.7],[-2.4,-1.7]],'Atendimento · '+cfg.title);
    if(kind==='chevron'||kind==='government'||kind==='bank-bci'||kind==='bank-bai')addWorkAgent({...staffLook,gender:'male',shirt:'#344b5d'},{x:3,y:0,z:1.5},[[3,1.5],[4,1.5],[4,2.4],[3,2.4]],'Funcionário · '+cfg.title);
  } else if(buildCharacter&&avatar) buildCharacter(target,avatar,{x:0,y:0,z:2},()=>{},false);
}

function serviceButton(label,key,price) {
  return '<div class="life-row"><span><b>'+label+'</b><br><small>'+money(price)+'</small></span><button class="secondary" data-largo-buy="'+key+'">Pagar</button></div>';
}

export async function openLargoServicePanel({kind,sb,user,openLifePanel,refreshPlayerWallet,escapeLife}) {
  const cfg=serviceRooms[kind];if(!cfg||!user)return;
  const esc=escapeLife||((v)=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])));
  await refreshPlayerWallet();
  const render=async(message='')=>{
    let html='<p class="life-muted">Atendimento do '+cfg.title+'. Os preços são apresentados em kwanzas (Kz) e o pagamento é confirmado antes de descontar o saldo.</p>';
    if(cfg.bank){
      const [{data:accounts,error:accountError},{data:txs}]=await Promise.all([
        sb.from('largo_bank_accounts').select('id,bank_code,account_type,account_number,balance,status,created_at').eq('user_id',user.id).eq('bank_code',cfg.bank).order('created_at',{ascending:false}),
        sb.from('largo_bank_transactions').select('transaction_type,amount,description,created_at').eq('user_id',user.id).order('created_at',{ascending:false}).limit(6)
      ]);
      const accountRows=accountError?'<p class="life-muted">O serviço bancário ainda não está disponível. Actualiza o jogo depois da configuração.</p>':(accounts||[]).map(a=>'<div class="life-row"><span><b>'+esc(a.account_number)+'</b><br><small>'+esc(a.account_type)+' · '+money(a.balance)+'</small></span><span class="badge">'+esc(a.status)+'</span></div>').join('')||'<p class="life-muted">Ainda não tens conta neste banco.</p>';
      html+='<h4>Tipos de conta</h4><div class="life-list"><div class="life-row"><span><b>Conta à ordem</b><br><small>Movimentações diárias</small></span><b>2.500 Kz</b></div><div class="life-row"><span><b>Conta poupança</b><br><small>Guardar dinheiro</small></span><b>2.500 Kz</b></div><div class="life-row"><span><b>Conta empresarial</b><br><small>Gestão financeira de empresa</small></span><b>2.500 Kz</b></div><div class="life-row"><span><b>Conta salário</b><br><small>Receber vencimentos</small></span><b>2.500 Kz</b></div></div>';
      html+='<h4>Abrir conta</h4><label for="largo-account-type">Escolhe o tipo de conta</label><select id="largo-account-type"><option value="ordem">Conta à ordem</option><option value="poupanca">Conta poupança</option><option value="empresarial">Conta empresarial</option><option value="salario">Conta salário</option></select><button id="largo-open-account">Abrir conta · 2.500 Kz</button>';
      html+='<h4>As minhas contas · '+cfg.bank+'</h4><div class="life-list">'+accountRows+'</div>';
      if((accounts||[]).length){
        html+='<h4>Depósitos e levantamentos</h4><label for="largo-bank-account">Conta</label><select id="largo-bank-account">'+accounts.map(a=>'<option value="'+a.id+'">'+esc(a.account_number)+' · '+esc(a.account_type)+' · '+money(a.balance)+'</option>').join('')+'</select><label for="largo-bank-amount">Valor em Kz</label><input id="largo-bank-amount" type="number" min="1" step="1" placeholder="Ex.: 10000"><div class="life-row"><button id="largo-deposit">Depositar</button><button class="secondary" id="largo-withdraw">Levantar</button></div>';
        html+='<h4>Transferência bancária · BCI / BAI</h4><label for="largo-bank-recipient">Número da conta de destino</label><input id="largo-bank-recipient" maxlength="32" placeholder="Número da conta BCI ou BAI"><label for="largo-bank-transfer-amount">Valor em Kz</label><input id="largo-bank-transfer-amount" type="number" min="1" step="1" placeholder="Ex.: 10000"><button id="largo-bank-transfer">Transferir entre contas</button><p class="life-muted">Podes transferir entre contas BCI e BAI, incluindo contas de outros jogadores.</p>';
      }
      html+='<h4>Movimentos bancários recentes</h4><div class="life-list">'+((txs||[]).filter(t=>true).map(t=>'<div class="life-row"><span>'+esc(t.description||t.transaction_type)+'<br><small>'+new Date(t.created_at).toLocaleString('pt-PT')+'</small></span><b>'+money(t.amount)+'</b></div>').join('')||'<p class="life-muted">Sem movimentos bancários.</p>')+'</div>';
    } else if(kind==='chevron'){
      const {data:petroTraining}=await sb.from('isced_enrollments').select('id').eq('user_id',user.id).eq('course_id','petrolifera').eq('status','completed').maybeSingle();
      if(!petroTraining){
        html+='<h4>Formação obrigatória para trabalhar na Chevron</h4><p class="life-muted">Ainda não tens a certificação petrolífera. Primeiro, faz a matrícula na Universidade ISCED, conclui a Formação Profissional Petrolífera com 15 presenças em 15 dias e regressa a esta recepção para te candidatares.</p><p class="life-muted">Sem aprovação nesta formação, o sistema não aceita candidaturas nem entrevistas para os postos da Chevron.</p>';
      }else{
      const {data:job,error}=await sb.from('largo_chevron_employments').select('role,salary,status,last_paid_at,applied_at').eq('user_id',user.id).maybeSingle();
      const roles=[['soldador_industrial','Soldador industrial',220000],['tecnico_instrumentacao','Técnico de instrumentação',210000],['operador_petrolifero','Operador petrolífero',190000],['electricista_industrial','Electricista industrial',205000],['mecanico_industrial','Mecânico industrial',195000],['engenheiro_petrolifero','Engenheiro petrolífero',280000],['administrativo','Administrativo',160000]];
      html+='<h4>Oportunidades de emprego</h4><p class="life-muted">Recrutamento da Chevron. Depois da entrevista, o contrato fica activo e o salário é creditado na carteira a cada 24 horas.</p>';
      if(job&&!error&&job.status==='hired'){
        html+='<div class="life-row"><span><b>Contrato activo</b><br><small>'+esc(job.role)+' · Salário: '+money(job.salary)+'</small></span><span class="badge">Contratado</span></div><button id="largo-claim-salary">Receber salário · '+money(job.salary)+'</button><p class="life-muted">Último pagamento: '+(job.last_paid_at?new Date(job.last_paid_at).toLocaleString('pt-PT'):'Ainda não recebido')+'</p>';
      }else if(job&&!error&&job.status==='pending'){
        html+='<div class="life-row"><span><b>Candidatura recebida</b><br><small>'+esc(job.role)+' · Salário previsto: '+money(job.salary)+'/dia</small></span><span class="badge">Pendente</span></div><p class="life-muted">A candidatura foi registada. Realiza a entrevista simulada para concluir a contratação.</p><button id="largo-interview-chevron">Realizar entrevista</button>';
      }else{
        html+='<label for="largo-chevron-role">Função pretendida</label><select id="largo-chevron-role">'+roles.map(r=>'<option value="'+r[0]+'">'+r[1]+' · '+money(r[2])+'/dia</option>').join('')+'</select><button id="largo-apply-chevron">Enviar candidatura</button>';
      }
      }
    } else if(kind==='restaurant-polonia'){
      html+='<h4>Menu e preços</h4><div class="life-list">'+serviceButton('Prato do dia','polonia-meal',2500)+serviceButton('Refeição familiar','polonia-family-meal',5000)+'</div><p class="life-muted">O pedido é registado e o valor sai da tua carteira quando pagares.</p>';
    } else if(kind==='taf'){
      html+='<h4>Utilização do campo</h4><div class="life-list">'+serviceButton('Aluguer do campo · 1 hora','taf-hour',5000)+'</div><p class="life-muted">O campo está disponível para jogos e treinos.</p>';
    } else if(kind==='government'){
      const {data:job}=await sb.from('largo_employment_applications').select('role,salary,status,last_paid_at,applied_at').eq('user_id',user.id).eq('employer','government').maybeSingle();
      const jobs=[['administrativo','Assistente administrativo',145000],['atendimento_publico','Atendimento público',115000],['tecnico_administrativo','Técnico administrativo',165000],['fiscal_provincial','Fiscal provincial',180000],['motorista','Motorista',105000]];
      html+='<h4>Centro de emprego provincial</h4><p class="life-muted">Consulta as vagas, candidata-te e realiza a entrevista. Os salários são pagos directamente na tua carteira virtual a cada 24 horas.</p>';
      if(job&&job.status==='hired'){
        html+='<div class="life-row"><span><b>Contrato activo</b><br><small>'+esc(job.role)+' · '+money(job.salary)+'/dia</small></span><span class="badge">Contratado</span></div><button id="largo-government-salary">Receber salário · '+money(job.salary)+'</button><p class="life-muted">Último pagamento: '+(job.last_paid_at?new Date(job.last_paid_at).toLocaleString('pt-PT'):'Ainda não recebido')+'</p>';
      }else if(job&&job.status==='pending'){
        html+='<div class="life-row"><span><b>Candidatura pendente</b><br><small>'+esc(job.role)+' · '+money(job.salary)+'/dia</small></span><span class="badge">Pendente</span></div><button id="largo-government-interview">Realizar entrevista</button>';
      }else{
        html+='<label for="largo-government-role">Vaga pretendida</label><select id="largo-government-role">'+jobs.map(j=>'<option value="'+j[0]+'">'+j[1]+' · '+money(j[2])+'/dia</option>').join('')+'</select><button id="largo-government-apply">Enviar candidatura</button>';
      }
      html+='<h4>Atendimento público e taxas</h4><div class="life-list">'+serviceButton('Emissão de certidão','government-certificate',1500)+serviceButton('Autenticação de documento','government-authentication',2500)+'</div><p class="life-muted">Os restantes pedidos de informação são gratuitos.</p>';
    } else if(kind==='residential-10'||kind==='residential-tower'||kind==='residential-family'){
      const listings=kind==='residential-10'?Array.from({length:10},(_,i)=>({code:'A'+String(i+1).padStart(2,'0'),label:'Apartamento '+(i<2?'T1':i<6?'T2':'T3')+' · Bloco de 10',price:i<2?12000000:i<6?18500000:22000000})):kind==='residential-tower'?Array.from({length:10},(_,i)=>({code:'T'+String(i+1).padStart(2,'0'),label:'Apartamento · Torre Residencial',price:28500000})):Array.from({length:6},(_,i)=>({code:'F'+String(i+1).padStart(2,'0'),label:'Apartamento T2 · Residencial Familiar',price:16000000}));
      const {data:owned}=await sb.from('largo_apartment_ownership').select('apartment_code').eq('user_id',user.id);
      const ownedCodes=new Set((owned||[]).map(x=>x.apartment_code));
      html+='<h4>Apartamentos e preços</h4><div class="life-list">'+listings.map(x=>'<div class="life-row"><span><b>'+x.code+' · '+x.label+'</b><br><small>'+money(x.price)+'</small></span><button class="secondary" data-largo-apartment="'+x.code+'" '+(ownedCodes.has(x.code)?'disabled':'')+'>'+(ownedCodes.has(x.code)?'Adquirido':'Comprar')+'</button></div>').join('')+'</div><p class="life-muted">A aquisição é registada na tua conta. Cada apartamento só pode ter um proprietário.</p>';
    } else if(kind==='isced-university'){
      const [{data:courses,error:courseError},{data:enrollments,error:enrollmentError},{data:registration}]=await Promise.all([
        sb.from('isced_courses').select('id,faculty,name,description,price,duration_days,lesson_titles').eq('active',true).order('faculty').order('name'),
        sb.from('isced_enrollments').select('id,course_id,amount_paid,start_date,status,created_at').eq('user_id',user.id).order('created_at',{ascending:false}),
        sb.from('isced_student_registrations').select('student_number,registration_fee,registered_at').eq('user_id',user.id).maybeSingle()
      ]);
      const courseList=courses||[], enrollmentList=enrollments||[],isRegistered=!!registration;
      const attendanceIds=enrollmentList.map(x=>x.id);
      let attendance=[];
      if(attendanceIds.length){const ar=await sb.from('isced_attendance').select('enrollment_id,day_number,class_date,lesson_title,attended_at').in('enrollment_id',attendanceIds).order('day_number');attendance=ar.data||[];}
      html+='<h4>Matrícula institucional</h4>'+(isRegistered?'<p class="life-muted">Matrícula confirmada · Número de estudante: <b>'+esc(registration.student_number)+'</b> · Taxa paga: '+money(registration.registration_fee)+'.</p>':'<p class="life-muted">Para frequentar qualquer curso, faz primeiro a matrícula institucional. A taxa única é de 100.000 Kz e é debitada da carteira virtual.</p><button id="isced-register-student">Pagar matrícula · 100.000 Kz</button>');
      html+='<h4>Catálogo de cursos e preços</h4><p class="life-muted">Todas as formações têm 15 dias de aulas consecutivas. Depois da matrícula, cada curso é pago uma única vez pela carteira virtual.</p>';
      if(courseError)html+='<p class="life-muted">Não foi possível carregar o catálogo de cursos.</p>';
      else {
        const faculties=[...new Set(courseList.map(c=>c.faculty))];
        for(const faculty of faculties){
          html+='<h5>'+esc(faculty)+'</h5><div class="life-list">'+courseList.filter(c=>c.faculty===faculty).map(c=>{
            const active=enrollmentList.some(e=>e.course_id===c.id&&e.status==='active');
            const completed=enrollmentList.some(e=>e.course_id===c.id&&e.status==='completed');
            return '<div class="life-row"><span><b>'+esc(c.name)+'</b><br><small>'+esc(c.description)+' · '+c.duration_days+' dias · '+money(c.price)+'</small></span><button '+(active||completed||!isRegistered?'disabled':'')+' data-isced-enroll="'+esc(c.id)+'">'+(active?'Em curso':completed?'Concluído':!isRegistered?'Matrícula obrigatória':'Inscrever-se')+'</button></div>';
          }).join('')+'</div>';
        }
      }
      html+='<h4>As minhas formações</h4>';
      if(enrollmentError)html+='<p class="life-muted">Não foi possível carregar as tuas inscrições.</p>';
      else if(!enrollmentList.length)html+='<p class="life-muted">Ainda não estás inscrito em nenhuma formação.</p>';
      else {
        html+='<div class="life-list">'+enrollmentList.map(e=>{
          const c=courseList.find(x=>x.id===e.course_id), records=attendance.filter(a=>a.enrollment_id===e.id), count=records.length;
          const today=new Date().toLocaleDateString('en-CA',{timeZone:'Africa/Luanda'}), start=String(e.start_date).slice(0,10);
          const day=Math.floor((Date.parse(today+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1;
          const nextTitle=c?.lesson_titles?.[Math.max(0,Math.min(14,day-1))]||'Aula diária';
          const status=e.status==='active'?'Em formação':e.status==='completed'?'Aprovado':'Reprovado';
          const progress=Math.round(Math.min(count/15,1)*100);
          return '<div class="life-row"><span><b>'+esc(c?.name||e.course_id)+'</b><br><small>'+status+' · '+count+'/15 presenças · '+progress+'% · Pago: '+money(e.amount_paid)+'</small><br><small>Início: '+esc(start)+' · '+(e.status==='active'?'Dia '+Math.max(1,Math.min(15,day))+' de 15: '+esc(nextTitle):'Formação encerrada')+'</small></span>'+(e.status==='active'?'<button data-isced-attend="'+e.id+'" '+(day<1?'disabled':'')+'>'+(day>15?'Verificar resultado':'Participar na aula de hoje')+'</button>':'')+'</div>';
        }).join('')+'</div>';
      }
      html+='<h4>Regras de frequência e aprovação</h4><p class="life-muted">A aula muda diariamente segundo o calendário de início da formação. O estudante deve registar a participação no próprio dia. Uma falta numa aula obrigatória reprova a formação. A aprovação exige 15 presenças em 15 dias.</p>';
      html+='<h4>Instalações do campus</h4><p class="life-muted">Reitoria e secretaria, biblioteca central, laboratórios, auditório, cantina, centro de estudantes, jardins e parque de estacionamento.</p>';
    } else if(kind==='largo-police'){
      html+='<h4>Serviços policiais</h4><div class="life-list"><div class="life-row"><span>Apresentar ocorrência ou denúncia</span><b>Gratuito</b></div><div class="life-row"><span>Pedir informações e apoio</span><b>Gratuito</b></div><div class="life-row"><span>Solicitar patrulhamento</span><b>Gratuito</b></div></div><p class="life-muted">Dirige-te ao balcão para atendimento.</p>';
    } else if(kind==='parish'){
      html+='<h4>Actividades da paróquia</h4><div class="life-list"><div class="life-row"><span>Oração e visita</span><b>Gratuito</b></div><div class="life-row"><span>Celebrações e actividades comunitárias</span><b>Gratuito</b></div></div><p class="life-muted">A paróquia está aberta aos moradores e visitantes.</p>';
    }
    if(message)html+='<p id="largo-service-message" class="life-muted">'+esc(message)+'</p>';
    openLifePanel(cfg.title,html);
    const panel=document.getElementById('life-panel');if(!panel)return;
    const run=async(button,fn,success)=>{if(!button)return;button.disabled=true;button.textContent='A processar…';const {data,error}=await fn();if(error){await render(error.message);return}await refreshPlayerWallet();await render(success(data));};
    if(cfg.bank){
      const transfer=document.getElementById('largo-bank-transfer');
      if(transfer)transfer.onclick=()=>run(transfer,()=>sb.rpc('largo_transfer_bank_account',{p_from_account:document.getElementById('largo-bank-account').value,p_to_account_number:document.getElementById('largo-bank-recipient').value.trim(),p_amount:Number(document.getElementById('largo-bank-transfer-amount').value)}),d=>'Transferência concluída: '+money(d.amount)+' para a conta '+d.to_account+'.');
      const open=document.getElementById('largo-open-account');if(open)open.onclick=()=>run(open,()=>sb.rpc('largo_open_bank_account',{p_bank_code:cfg.bank,p_account_type:document.getElementById('largo-account-type').value}),d=>'Conta '+d.account_number+' aberta com sucesso. Taxa: '+money(d.fee)+'.');
      const deposit=document.getElementById('largo-deposit'),withdraw=document.getElementById('largo-withdraw');
      const operation=op=>{const account=document.getElementById('largo-bank-account').value,amount=Number(document.getElementById('largo-bank-amount').value);return sb.rpc('largo_bank_cash_operation',{p_account_id:account,p_operation:op,p_amount:amount})};
      if(deposit)deposit.onclick=()=>run(deposit,()=>operation('deposit'),d=>'Depósito concluído. Saldo da conta: '+money(d.balance)+'.');
      if(withdraw)withdraw.onclick=()=>run(withdraw,()=>operation('withdrawal'),d=>'Levantamento concluído. Saldo da conta: '+money(d.balance)+'.');
    }
    const apply=document.getElementById('largo-apply-chevron');if(apply)apply.onclick=()=>run(apply,()=>sb.rpc('largo_apply_chevron_job',{p_role:document.getElementById('largo-chevron-role').value}),d=>'Candidatura registada. A entrevista está disponível.');
    const govApply=document.getElementById('largo-government-apply');if(govApply)govApply.onclick=()=>run(govApply,()=>sb.rpc('largo_apply_public_job',{p_employer:'government',p_role:document.getElementById('largo-government-role').value}),d=>'Candidatura ao Governo Provincial registada. Realiza a entrevista.');
    const govInterview=document.getElementById('largo-government-interview');if(govInterview)govInterview.onclick=()=>run(govInterview,()=>sb.rpc('largo_complete_public_job_interview',{p_employer:'government'}),d=>'Entrevista concluída. Contrato activo com salário diário de '+money(d.salary)+'.');
    const govSalary=document.getElementById('largo-government-salary');if(govSalary)govSalary.onclick=()=>run(govSalary,()=>sb.rpc('largo_claim_public_job_salary',{p_employer:'government'}),d=>'Salário recebido na carteira: '+money(d.salary)+'.');
    const interview=document.getElementById('largo-interview-chevron');if(interview)interview.onclick=()=>run(interview,()=>sb.rpc('largo_complete_chevron_interview'),d=>'Entrevista concluída. Contrato activo e salário diário de '+money(d.salary)+'.');
    const salary=document.getElementById('largo-claim-salary');if(salary)salary.onclick=()=>run(salary,()=>sb.rpc('largo_claim_chevron_salary'),d=>'Salário recebido: '+money(d.salary)+'.');
    panel.querySelectorAll('[data-largo-buy]').forEach(button=>button.onclick=()=>run(button,()=>sb.rpc('largo_pay_service',{p_service_key:button.dataset.largoBuy}),d=>'Pagamento concluído: '+d.label+' · '+money(d.amount)+'.'));
    panel.querySelectorAll('[data-largo-apartment]').forEach(button=>button.onclick=()=>run(button,()=>sb.rpc('largo_purchase_apartment',{p_apartment_code:button.dataset.largoApartment}),d=>'Apartamento adquirido: '+d.label+' · '+money(d.price)+'.'));
    const registerStudent=document.getElementById('isced-register-student');if(registerStudent)registerStudent.onclick=()=>run(registerStudent,()=>sb.rpc('isced_register_student'),d=>'Matrícula confirmada. Número de estudante: '+d.student_number+'. Foram descontados '+money(d.amount)+' da carteira.');
    panel.querySelectorAll('[data-isced-enroll]').forEach(button=>button.onclick=()=>run(button,()=>sb.rpc('isced_enroll',{p_course_id:button.dataset.iscedEnroll}),d=>'Inscrição confirmada em '+d.course+'. Foram descontados '+money(d.amount)+' da carteira. A primeira aula já está disponível.'));
    panel.querySelectorAll('[data-isced-attend]').forEach(button=>button.onclick=()=>run(button,()=>sb.rpc('isced_attend_today',{p_enrollment_id:button.dataset.iscedAttend}),d=>d.status==='failed'?'Frequência insuficiente. A formação foi reprovada.':d.status==='completed'?'Parabéns! Concluíste os 15 dias e foste aprovado.':d.already_attended?'A tua presença de hoje já está registada.':'Presença registada: Dia '+d.day_number+'/15 · '+d.lesson_title+'.'));
  };
  await render();
}
