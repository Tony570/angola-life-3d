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
  'taf': {title:'Campo de Futebol TAF',color:'#174b37'}
};

export function buildLargoServiceInterior({THREE,target,kind,buildCharacter,avatar,addWorkAgent}) {
  const cfg=serviceRooms[kind]||{title:'Serviços do Largo do Ambiente',color:'#24465b'};
  const mat=(color,roughness=.86)=>new THREE.MeshStandardMaterial({color,roughness});
  const box=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;target.add(o);return o};
  const floor=mat(kind==='parish'?'#c5b69e':kind==='taf'?'#477b45':'#c8c5b9'),wall=mat('#e7e3d9'),wood=mat('#80583d'),metal=mat('#59666b'),glass=new THREE.MeshStandardMaterial({color:'#83aab4',roughness:.28,metalness:.08});
  box(16,.2,14,floor,0,-.14,0);
  box(16,4,.2,wall,0,1.85,-7);box(16,4,.2,wall,0,1.85,7);
  box(.2,4,14,wall,-8,1.85,0);box(.2,4,14,wall,8,1.85,0);
  // Balcão de atendimento e zonas próprias de cada actividade.
  if(kind==='bank-bci'||kind==='bank-bai'||kind==='government'||kind==='restaurant-polonia'||kind==='largo-police'){
    box(7,.95,.95,wood,0,.48,-3.4);box(7,.12,1.02,metal,0,1.02,-3.4);
    for(let i=0;i<3;i++){box(1.45,1.05,.08,glass,-4.7+i*4.7,2.1,-6.82);box(1.55,.08,.12,metal,-4.7+i*4.7,2.68,-6.8)}
    for(let i=0;i<3;i++){box(1.1,.08,.9,wood,-4.7+i*4.7,.55,1.3);box(.12,1.05,.12,metal,-5.1+i*4.7,1.05,1.3)}
  } else if(kind==='chevron'){
    box(8,.95,1.05,wood,0,.48,-3.2);box(8,.12,1.1,metal,0,1.02,-3.2);
    for(let i=0;i<3;i++){box(2.1,1.25,.12,glass,-4.8+i*4.8,2.05,-6.8);box(2.2,.1,.14,metal,-4.8+i*4.8,2.75,-6.8)}
    for(let i=0;i<4;i++){box(1.8,.08,1.1,wood,-5.2+(i%2)*10,.8,1.4+Math.floor(i/2)*2.1);box(.08,1.1,.08,metal,-5.8+(i%2)*10,1.3,1.4+Math.floor(i/2)*2.1)}
  } else if(kind==='restaurant-polonia'){
    for(const x of [-4,0,4])for(const z of [-1.2,3.2]){const table=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.12,20),wood);table.position.set(x,.85,z);target.add(table);for(let a=0;a<3;a++){const chair=box(.62,.78,.62,metal,x+Math.cos(a*2.1)*1.25,.42,z+Math.sin(a*2.1)*1.25);chair.rotation.y=a*2.1}}
    box(5,.95,.85,wood,0,.48,-5);box(5,.12,.9,metal,0,1,-5);
  } else if(kind==='parish'){
    box(7,7,6,mat('#e6ddc8'),0,3.4,-.2);box(2.4,4,2.4,mat('#ded3bd'),0,2.1,-3.2);
    box(.28,2.4,.28,mat('#f4e8ce'),0,7.2,-3.2);box(1.5,.28,.28,mat('#f4e8ce'),0,7.5,-3.2);
    for(let i=0;i<4;i++){box(1.6,.55,.55,wood,-5+i*3.3,.35,3.4)}
  } else if(kind.startsWith('residential')){
    for(let i=0;i<10;i++){const x=-5.8+(i%5)*2.9,z=-2.2+Math.floor(i/5)*4.4;box(1.8,2.2,.12,glass,x,1.15,z);box(1.95,.12,.16,metal,x,2.3,z)}
  } else if(kind==='taf'){
    const white=mat('#f4f0dc');box(12,.04,.12,white,0,.02,-5.5);box(12,.04,.12,white,0,.02,5.5);box(.12,.04,11,white,-6,.02,0);box(.12,.04,11,white,6,.02,0);
    for(const x of [-6,6]){box(.12,2.2,.12,white,x,1.1,0);box(2.2,.12,.12,white,x+(x<0?1.1:-1.1),2.2,0);box(2.2,2.2,.12,white,x+(x<0?1.1:-1.1),1.1,0)}
  }
  // Letreiro interno do estabelecimento.
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
  };
  await render();
}
