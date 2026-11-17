import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.161.0/build/three.module.js';
const SUPABASE_URL='https://aowchqmhablulwwjexil.supabase.co';
const SUPABASE_KEY='sb_publishable_Gp7jRkTVsdvaO31Qnz23cA_kwBrR6gQ';
const sb=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY);
const $=id=>document.getElementById(id);
let socialWorldChannel=null,socialPresenceState=[],socialRemoteStates=new Map(),activeCityRemoteSync=null,activeHouseGuestSync=null,activeHouseVisit=null,socialZone='home',socialLastPositionBroadcast=0,socialLastPresenceSave=0,activePrivateConversationId=null,socialLocalPosition={x:0,z:0};
let user=null,profile=null,inventory=[],playerWalletBalance=500,playerVehicles=[],activeCategory='todos',activeWardrobe='tops',avatar={gender:'male',skin:'#b77b5c',hair:'#eef2f5',shirt:'#f2f2ee',pants:'#e6e8ee',hairStyle:'curto',eyes:'#35251f',beardStyle:'goatee',beardColor:'#332a27',browColor:'#332a27',shoe:'#e9eef2',belt:'#252b32',accessory:'#c69b45',modelVersion:4};
const CHARACTER_HEIGHT=1.72; // altura humana padrão: 1,72 m
 const characterAssets={male:{model:'https://files.innerscene.com/library/locomotion-collection-sam-3d-person-animated-dc23800f/735aec6a564c1def48e8/locomotion-collection-sam-3d-person-animated.glb'},female:{model:'https://files.innerscene.com/library/locomotion-collection-maya-3d-person-animated-1499b2fd/565cfb8a45b8a67a79c4/locomotion-collection-maya-3d-person-animated.glb'}};
const palettes={skin:['#f1c7a5','#dca77c','#c98962','#985b42','#633d32'],hair:['#171412','#38251d','#75482b','#c49a55','#9b3030','#d7d1c5'],eyes:['#35251f','#4d6b50','#4a78a8','#7893a5'],shirt:['#3867a8','#a83f43','#43866b','#d39a43','#654b91','#e6e8ee'],pants:['#26364b','#42464e','#806044','#273e35','#171a22']};
function say(id,msg){$(id).textContent=msg}
function setTab(which){$('login-form').classList.toggle('hidden',which!=='login');$('signup-form').classList.toggle('hidden',which!=='signup');$('tab-login').classList.toggle('active',which==='login');$('tab-signup').classList.toggle('active',which==='signup');$('tab-login').classList.toggle('secondary',which!=='login');$('tab-signup').classList.toggle('secondary',which!=='signup');say('auth-message','')}
$('tab-login').onclick=()=>setTab('login');$('tab-signup').onclick=()=>setTab('signup');
function identifierMode(method,prefix){const phone=method==='phone';$(prefix+'-id-label').textContent=phone?'Número de telefone (com indicativo)':'Gmail ou email';const field=$(prefix+'-identifier');field.type=phone?'tel':'email';field.autocomplete=phone?'tel':'email';field.placeholder=phone?'+244 9XX XXX XXX':'teu@gmail.com';field.inputMode=phone?'tel':'email'}
$('login-method').onchange=()=>identifierMode($('login-method').value,'login');
$('signup-method').onchange=()=>identifierMode($('signup-method').value,'signup');
let pendingPhone=null;
$('login-form').addEventListener('submit',async e=>{e.preventDefault();say('auth-message','A entrar…');const method=$('login-method').value;const value=$('login-identifier').value.trim();const credentials={password:$('login-password').value};credentials[method==='phone'?'phone':'email']=value;const {error}=await sb.auth.signInWithPassword(credentials);if(error)say('auth-message',error.message);else await boot()});
$('signup-form').addEventListener('submit',async e=>{e.preventDefault();say('auth-message','A criar a tua conta…');const method=$('signup-method').value;const value=$('signup-identifier').value.trim();const username=$('signup-name').value.trim().replace(/\s+/g,'_').toLowerCase();const options={data:{username,display_name:$('signup-name').value.trim()}};const credentials={password:$('signup-password').value,options};credentials[method==='phone'?'phone':'email']=value;if(method==='email')options.emailRedirectTo='https://tony570.github.io/angola-life-3d/';const {data,error}=await sb.auth.signUp(credentials);if(error){say('auth-message',error.message);return}if(data.session){await boot();return}if(method==='phone'){pendingPhone=value;$('login-form').classList.add('hidden');$('signup-form').classList.add('hidden');$('phone-verify').classList.remove('hidden');$('tab-login').classList.add('hidden');$('tab-signup').classList.add('hidden');say('auth-message','Aguardamos a confirmação do número.');return}say('auth-message','Conta criada. Confirma o email e depois entra no jogo. Se o código não chegar, será necessário activar o envio de email no serviço de autenticação.')});
$('verify-phone').onclick=async()=>{const token=$('phone-code').value.trim();if(!pendingPhone||!/^[0-9]{6}$/.test(token)){say('auth-message','Introduz o código SMS de 6 dígitos.');return}say('auth-message','A confirmar número…');const {data,error}=await sb.auth.verifyOtp({phone:pendingPhone,token,type:'sms'});if(error){say('auth-message',error.message);return}if(data.session)await boot()};
$('logout').onclick=async()=>{stopGameAudio();await sb.auth.signOut();user=null;$('game').classList.add('hidden');$('auth').classList.remove('hidden');$('phone-verify').classList.add('hidden');$('tab-login').classList.remove('hidden');$('tab-signup').classList.remove('hidden');setTab('login')};
function showPage(page){document.querySelectorAll('[id^="page-"]').forEach(x=>x.classList.add('hidden'));$('page-'+page).classList.remove('hidden');document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===page));if(page==='avatar'){if(disposeHome){disposeHome();disposeHome=null}if(disposeInventory){disposeInventory();disposeInventory=null}renderAvatar()}if(page==='inventory'){if(disposeHome){disposeHome();disposeHome=null}if(disposeAvatar){disposeAvatar();disposeAvatar=null}renderInventoryPage()}if(page==='home'){if(disposeAvatar){disposeAvatar();disposeAvatar=null}if(disposeInventory){disposeInventory();disposeInventory=null}renderHome()}}$('inventory-close').onclick=()=>showPage('home');
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>showPage(b.dataset.page));$('go-avatar').onclick=()=>showPage('avatar');

async function refreshPlayerWallet(){
 if(!user)return;
 const {data,error}=await sb.from('player_wallets').select('balance').eq('user_id',user.id).maybeSingle();
 if(error){console.error('Carteira:',error);return}
 if(data)playerWalletBalance=Number(data.balance)||0;
 const display=$('life-wallet-balance');
 if(display)display.textContent='💵 Dinheiro: '+new Intl.NumberFormat('pt-PT').format(playerWalletBalance)+' Kz';
}
async function loadPlayerVehicles(){
 if(!user)return;
 const {data,error}=await sb.from('player_vehicles').select('id,owner_id,model,color,purchase_price,purchased_at,is_stored,pos_x,pos_z,rotation,passenger_ids').order('purchased_at',{ascending:false});
 if(error){console.error('Garagem:',error);return}
 playerVehicles=data||[];
}
async function openPlayerGaragePanel(){
 await Promise.all([refreshPlayerWallet(),loadPlayerVehicles()]);
 const own=playerVehicles.filter(v=>v.owner_id===user?.id);
 const other=playerVehicles.filter(v=>v.owner_id!==user?.id&&!v.is_stored);
 const ownHtml=own.length?own.map(v=>{
  const occupied=1+(v.passenger_ids||[]).length;
  const action=v.is_stored?'<button class="secondary" data-garage-action="retrieve" data-vehicle-id="'+v.id+'">🚗 Retirar da garagem</button>':'<button class="secondary" data-garage-action="store" data-vehicle-id="'+v.id+'">🏠 Guardar na garagem</button>';
  return '<div class="life-row"><span><b>'+escapeLife(v.model)+'</b><br><small>'+new Intl.NumberFormat('pt-PT').format(v.purchase_price)+' Kz · '+(v.is_stored?'Na garagem':'Na cidade')+' · '+occupied+'/4 lugares</small></span>'+action+'</div>';
 }).join(''):'<p class="life-muted">Ainda não compraste nenhum veículo. Visita a loja de carros para escolher o teu primeiro.</p>';
 const otherHtml=other.length?other.map(v=>{
  const seated=(v.passenger_ids||[]).includes(user.id);
  const action=seated?'<button class="secondary" data-garage-action="leave" data-vehicle-id="'+v.id+'">Sair do veículo</button>':'<button class="secondary" data-garage-action="board" data-vehicle-id="'+v.id+'" '+((v.passenger_ids||[]).length>=3?'disabled':'')+'>Entrar como passageiro</button>';
  return '<div class="life-row"><span><b>'+escapeLife(v.model)+'</b><br><small>Veículo de outro jogador · '+(1+(v.passenger_ids||[]).length)+'/4 lugares</small></span>'+action+'</div>';
 }).join(''):'<p class="life-muted">Não há veículos de outros jogadores disponíveis neste momento.</p>';
 openLifePanel('Garagem particular','<p class="life-muted">Os teus veículos ficam associados à tua conta e continuam guardados quando sais do jogo.</p><p><b>Saldo:</b> '+new Intl.NumberFormat('pt-PT').format(playerWalletBalance)+' Kz</p><h4>Os meus veículos</h4>'+ownHtml+'<h4>Veículos na cidade</h4>'+otherHtml);
 const panel=$('life-panel');
 panel.querySelectorAll('[data-garage-action]').forEach(button=>button.onclick=async()=>{
  const action=button.dataset.garageAction,id=button.dataset.vehicleId;
  button.disabled=true;
  if(action==='store'&&window.__angolaCurrentVehicleId===id&&typeof window.__angolaExitVehicle==='function')window.__angolaExitVehicle();
  let result;
  if(action==='retrieve'){const alreadyOutside=playerVehicles.filter(v=>v.owner_id===user.id&&!v.is_stored).length;result=await sb.rpc('set_player_vehicle_state',{p_vehicle_id:id,p_action:'retrieve',p_x:17+alreadyOutside*4,p_z:-14,p_rotation:0})}
  else if(action==='store')result=await sb.rpc('set_player_vehicle_state',{p_vehicle_id:id,p_action:'store',p_x:0,p_z:0,p_rotation:0});
  else if(action==='board')result=await sb.rpc('board_player_vehicle',{p_vehicle_id:id});
  else result=await sb.rpc('leave_player_vehicle',{p_vehicle_id:id});
  if(result?.error){alert(result.error.message||'Não foi possível concluir a operação.');button.disabled=false;return}
  await loadPlayerVehicles();
  if(action==='retrieve')renderVianaCity({x:14,z:-14});
  await openPlayerGaragePanel();
 });
}

async function boot(){const {data:{user:u}}=await sb.auth.getUser();if(!u)return;user=u;$('auth').classList.add('hidden');$('game').classList.remove('hidden');$('top-username').textContent=u.email||u.phone||'';const {data:p,error}=await sb.from('profiles').select('*').eq('id',u.id).single();if(error){say('global-message','Não foi possível carregar o perfil: '+error.message);return}profile=p;await startSocialRealtime();await refreshPlayerWallet();await loadPlayerVehicles();const savedAvatar=p.avatar||{};avatar={...avatar,...savedAvatar};if((savedAvatar.modelVersion||0)<4){if(!savedAvatar.hair||['#241b18','#171412'].includes(savedAvatar.hair))avatar.hair=avatar.gender==='male'?'#eef2f5':'#38251d';if(!savedAvatar.shirt||savedAvatar.shirt==='#3867a8')avatar.shirt='#f2f2ee';if(!savedAvatar.pants||savedAvatar.pants==='#26364b')avatar.pants='#e6e8ee';avatar.beardStyle=avatar.gender==='male'?'goatee':'none';avatar.beardColor=savedAvatar.beardColor||'#332a27';avatar.browColor=savedAvatar.browColor||'#332a27';avatar.modelVersion=4;}$('life-name').textContent=p.display_name||p.username||'Residente';$('life-face').textContent=avatar.gender==='female'?'👩🏽':'👨🏽';await loadInventory();$('side-name').textContent=p.display_name||p.username;$('home-items').textContent=inventory.length;$('profile-items').textContent=inventory.length;fillProfile();showPage(profile.avatar?.completed===true?'home':'avatar')}
async function loadInventory(){const {data,error}=await sb.from('inventory_items').select('*').eq('user_id',user.id).order('category');if(error){console.error(error);inventory=[]}else inventory=data||[];renderInventory()}
function fillProfile(){$('profile-display').textContent=profile.display_name;$('profile-handle').textContent='@'+profile.username;$('profile-name').value=profile.username;$('profile-display-input').value=profile.display_name;$('profile-bio').value=profile.bio||''}
$('save-profile').onclick=async()=>{const username=$('profile-name').value.trim().toLowerCase().replace(/\s+/g,'_');const display_name=$('profile-display-input').value.trim();if(!username||!display_name){say('profile-message','Preenche os dois nomes.');return}const {data,error}=await sb.from('profiles').update({username,display_name,bio:$('profile-bio').value.trim(),updated_at:new Date().toISOString()}).eq('id',user.id).select().single();if(error){say('profile-message',error.message);return}profile=data;fillProfile();$('side-name').textContent=profile.display_name;say('profile-message','Perfil guardado com sucesso.')};
function swatches(id,key){$(id).innerHTML='';palettes[key].forEach(color=>{const b=document.createElement('button');b.className='swatch'+(avatar[key]===color?' selected':'');b.style.background=color;b.title=color;b.onclick=()=>{avatar[key]=color;swatches(id,key);renderAvatar()};$(id).append(b)})}
function renderHairChoices(){
 const labels={curto:'Curto',medio:'Médio',encaracolado:'Encaracolado',comprido:'Comprido'};
 const art={curto:'<path d="M10 25 Q12 5 24 7 Q38 6 39 25 L35 20 Q24 13 14 21Z" fill="'+avatar.hair+'"/>',medio:'<path d="M9 26 Q9 5 24 7 Q40 6 40 26 L36 33 L34 19 Q24 12 14 20 L13 33Z" fill="'+avatar.hair+'"/>',encaracolado:'<g fill="'+avatar.hair+'"><circle cx="13" cy="17" r="7"/><circle cx="22" cy="11" r="7"/><circle cx="31" cy="13" r="7"/><circle cx="37" cy="21" r="7"/><circle cx="15" cy="27" r="6"/></g>',comprido:'<path d="M9 26 Q9 5 24 7 Q40 6 40 26 L39 43 L33 43 L34 19 Q24 12 14 20 L15 43 L9 43Z" fill="'+avatar.hair+'"/>'};
 const host=$('hair-style-choices');host.innerHTML='';
 Object.keys(labels).forEach(key=>{const b=document.createElement('button');b.type='button';b.className='choice-card'+(avatar.hairStyle===key?' selected':'');b.innerHTML='<span class="choice-art"><svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="25" r="13" fill="#d9a783"/>'+art[key]+'</svg></span><span><b>'+labels[key]+'</b><small>Ver penteado</small></span>';b.onclick=()=>{avatar.hairStyle=key;$('hair-style').value=key;renderHairChoices();renderAvatar()};host.append(b)});
}
function renderEyeChoices(){
 const labels={'#35251f':'Castanho escuro','#4d6b50':'Verde','#4a78a8':'Azul','#7893a5':'Cinza azulado'};
 const host=$('eye-choice-cards');host.innerHTML='';
 Object.entries(labels).forEach(([color,label])=>{const b=document.createElement('button');b.type='button';b.className='choice-card'+(avatar.eyes===color?' selected':'');b.innerHTML='<span class="choice-art"><span class="eye-art" style="--iris:'+color+'"></span></span><span><b>'+label+'</b><small>Selecionar cor</small></span>';b.onclick=()=>{avatar.eyes=color;renderEyeChoices();renderAvatar()};host.append(b)});
}
function setupAvatarControls(){$('avatar-gender').value=avatar.gender||'male';$('avatar-gender').disabled=avatar.completed===true;$('avatar-gender').title=avatar.completed?'O género escolhido fica bloqueado depois de guardar o personagem.':'';$('avatar-gender').onchange=e=>{if(avatar.completed){e.target.value=avatar.gender;return}avatar.gender=e.target.value;renderAvatar()};swatches('skin-swatches','skin');swatches('hair-swatches','hair');swatches('shirt-swatches','shirt');swatches('pants-swatches','pants');renderHairChoices();renderEyeChoices();$('hair-style').value=avatar.hairStyle;$('hair-style').onchange=e=>{avatar.hairStyle=e.target.value;renderHairChoices();renderAvatar()}}
let animationCatalogPromise=null;
async function getWalkClipUrl(gender){
 if(!animationCatalogPromise)animationCatalogPromise=fetch('https://models.codelove.in/catalog.json').then(r=>{if(!r.ok)throw new Error('Catálogo de animações indisponível');return r.json()});
 const catalog=await animationCatalogPromise,candidates=[];
 const genderPattern=gender==='female'?/(female|woman|f[_-])/i:/(^|[^a-z])(male|man|m[_-])([^a-z]|$)/i;
 const walkPattern=/(^|[^a-z])(walk|walking)([^a-z]|$)/i;
 const visit=(node,path=[])=>{
  if(typeof node==='string'){
   const context=path.join(' ');
   if(/\.glb(?:$|[?#])/i.test(node)&&walkPattern.test(context)&&genderPattern.test(context)){
    const url=new URL(node,catalog.url||'https://models.codelove.in/').href;
    candidates.push({url,score:(/walk/i.test(path[path.length-1]||'')?10:0)+(/female|male/i.test(context)?5:0)+path.length});
   }
   return;
  }
  if(Array.isArray(node)){node.forEach((v,i)=>visit(v,[...path,String(i)]));return}
  if(!node||typeof node!=='object')return;
  for(const [key,value] of Object.entries(node)){
   const labels=[...path,key];
   if(typeof value==='string')labels.push(value);
   visit(value,labels);
  }
 };
 visit(catalog);
 candidates.sort((a,b)=>b.score-a.score);
 if(!candidates.length)throw new Error('Não encontrei um clip Walk específico para '+gender);
 return candidates[0].url;
}
function findGaitBones(model){
 const bones={},base={};
 const sideOf=n=>/(left|(^|[^a-z])l([^a-z]|$)|_l_|[-.]l$)/i.test(n)?'L':/(right|(^|[^a-z])r([^a-z]|$)|_r_|[-.]r$)/i.test(n)?'R':null;
 model.traverse(o=>{
  if(!o.isBone)return;
  const raw=o.name||'',n=raw.toLowerCase().replace(/mixamorig[:_ -]?/g,'');
  const side=sideOf(n);
  if(side){
   if(/thigh|upleg|upper.?leg|hip.?joint/.test(n))bones[side+'Thigh']=o;
   else if(/calf|shin|lower.?leg|leg.?lower/.test(n))bones[side+'Calf']=o;
   else if(/foot|ankle|toe/.test(n))bones[side+'Foot']=o;
   else if(/upper.?arm|arm$|shoulder/.test(n)&&!/forearm|lower.?arm/.test(n))bones[side+'Arm']=o;
   else if(/forearm|lower.?arm/.test(n))bones[side+'Forearm']=o;
   else if(/hand/.test(n))bones[side+'Hand']=o;
  }
  if(/hips|pelvis/.test(n))bones.Hips=o;
  else if(/spine2|spine_2|chest|upper.?spine/.test(n))bones.Chest=o;
  else if(/neck/.test(n))bones.Neck=o;
  else if(/head/.test(n))bones.Head=o;
 });
 for(const [key,bone] of Object.entries(bones))base[key]={rotation:bone.rotation.clone(),position:bone.position.clone()};
 return {bones,base,ready:!!(bones.LThigh&&bones.RThigh&&bones.LArm&&bones.RArm)};
}
function updateCharacterActionPose(root,delta=0){
 if(!root)return;
 const state=root.userData.actionState||{type:'idle',time:0};state.time=(state.time||0)+delta;
 if(state.type==='wave'&&state.time>1.9){state.type='idle';state.time=0}
 const pose=root.userData.poseRig;
 if(pose?.bones&&pose?.base){
  for(const [key,bone] of Object.entries(pose.bones)){const base=pose.base[key];if(base){bone.rotation.copy(base.rotation);bone.position.copy(base.position)}}
  const apply=(key,x=0,z=0)=>{const bone=pose.bones[key],base=pose.base[key];if(bone&&base){bone.rotation.x=base.rotation.x+x;bone.rotation.z=base.rotation.z+z}};
  if(state.type==='sit'){apply('LThigh',-1.12);apply('RThigh',-1.12);apply('LCalf',1.35);apply('RCalf',1.35);apply('LArm',-.12);apply('RArm',-.12);apply('LForearm',.22);apply('RForearm',.22);const hips=pose.bones.Hips,base=pose.base.Hips;if(hips&&base)hips.position.y=base.position.y-.035}
  else if(state.type==='wave'){apply('RArm',0,-2.1);apply('RForearm',0,-.38+Math.sin(state.time*10)*.34)}
  return;
 }
 const rig=root.userData.fallbackRig;if(!rig)return;
 if(state.type==='idle'){
  if(rig.head)rig.head.rotation.y=Math.sin(state.time*1.25)*.035;
  if(rig.torso)rig.torso.rotation.x=Math.sin(state.time*2.1)*.008;
  return;
 }
 for(const key of ['leftArm','rightArm','leftForearm','rightForearm','leftLeg','rightLeg','leftCalf','rightCalf'])if(rig[key])rig[key].rotation.set(0,0,0);
 if(rig.head)rig.head.rotation.set(0,0,0);if(rig.torso)rig.torso.rotation.set(0,0,0);
 if(state.type==='sit'){
  if(rig.leftLeg)rig.leftLeg.rotation.x=-.92;if(rig.rightLeg)rig.rightLeg.rotation.x=-.92;
  if(rig.leftCalf)rig.leftCalf.rotation.x=1.22;if(rig.rightCalf)rig.rightCalf.rotation.x=1.22;
  if(rig.leftArm)rig.leftArm.rotation.x=-.12;if(rig.rightArm)rig.rightArm.rotation.x=-.12;
  if(rig.leftForearm)rig.leftForearm.rotation.x=.22;if(rig.rightForearm)rig.rightForearm.rotation.x=.22;
 }else if(state.type==='wave'){
  if(rig.rightArm){rig.rightArm.rotation.z=-2.1;rig.rightArm.rotation.x=-.15}
  if(rig.rightForearm)rig.rightForearm.rotation.z=-.38+Math.sin(state.time*10)*.34;
 }
}

function updateFallbackHumanGait(root,delta,speed,walking){
 const rig=root?.userData?.fallbackRig,figure=root?.userData?.fallbackFigure;if(!rig||!figure)return;
 const action=root.userData.actionState?.type||'idle',blend=1-Math.exp(-10*Math.max(.001,delta));
 if(action!=='idle'){root.userData.walkBlend=0;figure.position.y+=(0-figure.position.y)*blend;return}
 const target=walking?THREE.MathUtils.clamp(speed/1.65,.08,1):0;
 root.userData.walkBlend=THREE.MathUtils.lerp(root.userData.walkBlend||0,target,blend);
 const weight=root.userData.walkBlend;root.userData.walkPhase=(root.userData.walkPhase||0)+delta*(4.2+Math.min(speed,3.5)*2.8);
 const phase=root.userData.walkPhase,swing=Math.sin(phase),opposite=-swing;
 const smooth=(part,axis,value)=>{if(part)part.rotation[axis]+=(value-part.rotation[axis])*blend};
 smooth(rig.leftLeg,'x',swing*.43*weight);smooth(rig.rightLeg,'x',opposite*.43*weight);
 smooth(rig.leftCalf,'x',Math.max(0,-swing)*.62*weight);smooth(rig.rightCalf,'x',Math.max(0,-opposite)*.62*weight);
 smooth(rig.leftArm,'x',opposite*.31*weight);smooth(rig.rightArm,'x',swing*.31*weight);
 smooth(rig.leftArm,'z',.035*weight);smooth(rig.rightArm,'z',-.035*weight);
 smooth(rig.leftForearm,'x',.07+Math.max(0,swing)*.07*weight);smooth(rig.rightForearm,'x',.07+Math.max(0,opposite)*.07*weight);
 smooth(rig.torso,'x',Math.sin(phase*2)*.014*weight);smooth(rig.torso,'z',Math.sin(phase)*.008*weight);
 smooth(rig.head,'x',Math.sin(phase*2+.4)*.006*weight);smooth(rig.head,'z',Math.sin(phase)*.004*weight);
 const bob=Math.abs(Math.sin(phase*2))*.014*weight;figure.position.y+=(bob-figure.position.y)*blend;
}

function updateProceduralGait(root,phase,weight){
 const gait=root.userData.proceduralGait;if(!gait)return;
 const {bones,base}=gait,swing=Math.sin(phase),opposite=Math.sin(phase+Math.PI);
 const apply=(key,x,z=0)=>{const b=bones[key],r=base[key]?.rotation;if(b&&r){b.rotation.x=r.x+x*weight;b.rotation.z=r.z+z*weight}};
 apply('LThigh',swing*.48);apply('RThigh',opposite*.48);
 apply('LCalf',Math.max(0,-swing)*.82);apply('RCalf',Math.max(0,-opposite)*.82);
 apply('LFoot',Math.max(0,swing)*-.20);apply('RFoot',Math.max(0,opposite)*-.20);
 apply('LArm',opposite*.38);apply('RArm',swing*.38);
 apply('LForearm',.04+Math.max(0,swing)*.08);apply('RForearm',.04+Math.max(0,opposite)*.08);
 apply('Hips',0,Math.sin(phase*2)*.025);
 apply('Chest',0,Math.sin(phase)*-.035);
 apply('Head',0,Math.sin(phase)*-.012);
}

let sharedSkinMap=null,sharedSkinBump=null;
function getHumanSkinTextures(){
 if(sharedSkinMap&&sharedSkinBump)return {map:sharedSkinMap,bump:sharedSkinBump};
 const makeTexture=(isBump=false)=>{
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d'),image=ctx.createImageData(256,256);
  for(let y=0;y<256;y++)for(let x=0;x<256;x++){
   const i=(y*256+x)*4,wave=Math.sin(x*.19+y*.07)*1.7+Math.sin(y*.31-x*.11)*1.2+Math.sin((x+y)*.47)*.8;
   const grain=Math.sin(x*12.9898+y*78.233)*43758.5453,noise=(grain-Math.floor(grain)-.5)*(isBump?7:5);
   const value=isBump?Math.max(112,Math.min(144,128+wave+noise)):Math.max(238,Math.min(255,249+wave+noise));
   image.data[i]=value;image.data[i+1]=value;image.data[i+2]=value;image.data[i+3]=255;
  }
  ctx.putImageData(image,0,0);
  if(isBump){for(let i=0;i<190;i++){const x=(i*73+19)%256,y=(i*131+47)%256,r=.45+(i%4)*.22;ctx.fillStyle=i%2?'rgba(90,90,90,.28)':'rgba(255,255,255,.2)';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill()}}
  else{for(let i=0;i<95;i++){const x=(i*67+31)%256,y=(i*113+17)%256;ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.arc(x,y,.6+(i%3)*.25,0,Math.PI*2);ctx.fill()}}
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=2;texture.needsUpdate=true;return texture;
 };
 sharedSkinMap=makeTexture(false);sharedSkinBump=makeTexture(true);return {map:sharedSkinMap,bump:sharedSkinBump};
}

function createFallbackHuman(look){
 const figure=new THREE.Group(),rig={};
 const skinTextures=getHumanSkinTextures();
 const skin=new THREE.MeshStandardMaterial({color:look.skin||'#b77b5c',map:skinTextures.map,bumpMap:skinTextures.bump,bumpScale:.012,roughness:.93,metalness:0});
 const shirt=new THREE.MeshStandardMaterial({color:look.shirt||'#f2f2ee',roughness:.82});
 const pants=new THREE.MeshStandardMaterial({color:look.pants||'#e6e8ee',roughness:.88});
 const hair=new THREE.MeshStandardMaterial({color:look.hair||'#eef2f5',roughness:.9});
 const beard=new THREE.MeshStandardMaterial({color:look.beardColor||'#332a27',roughness:.92});
 const brow=new THREE.MeshStandardMaterial({color:look.browColor||'#332a27',roughness:.88});
 const dark=new THREE.MeshStandardMaterial({color:'#292321',roughness:.8});
 const skinShade=new THREE.MeshStandardMaterial({color:'#80584b',roughness:.95});
 const blush=new THREE.MeshStandardMaterial({color:'#b96e68',roughness:1,transparent:true,opacity:.16,depthWrite:false});
 const lip=new THREE.MeshStandardMaterial({color:look.gender==='female'?'#a85e65':'#925d55',roughness:.8});
 const iris=new THREE.MeshStandardMaterial({color:look.eyes||'#35251f',roughness:.42});
 const white=new THREE.MeshStandardMaterial({color:'#f7f3ed',roughness:.55});
 const gold=new THREE.MeshStandardMaterial({color:look.accessory||'#c69b45',metalness:.62,roughness:.34});
 const belt=new THREE.MeshStandardMaterial({color:look.belt||'#252b32',roughness:.65});
 const shoe=new THREE.MeshStandardMaterial({color:look.shoe||'#e9eef2',roughness:.62});
 const sole=new THREE.MeshStandardMaterial({color:'#34383d',roughness:.9});
 const sphere=(parent,material,pos,scale,segments=20)=>{const mesh=new THREE.Mesh(new THREE.SphereGeometry(1,segments,16),material);mesh.position.set(...pos);mesh.scale.set(...scale);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const curveTube=(parent,material,points,radius,segments=18)=>{const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,6,false),material);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const capsule=(parent,material,radius,length,pos)=>{const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,5,14),material);mesh.position.set(...pos);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const box=(parent,material,size,pos,rot=0)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),material);mesh.position.set(...pos);mesh.rotation.z=rot;mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh};
 const female=look.gender==='female',hairStyle=look.hairStyle||(female?'comprido':'curto');
 // Silhueta estilizada: cabeça expressiva, ombros definidos e corpo com proporções de jogo.
 const torso=new THREE.Group();figure.add(torso);rig.torso=torso;
 sphere(torso,shirt,[0,1.13,0],[.18,.265,.125],24);
 sphere(torso,shirt,[0,1.335,-.004],[.17,.115,.12],20);
 sphere(torso,pants,[0,.895,0],[.16,.105,.12],20);
 capsule(figure,skin,.045,.065,[0,1.405,0]);
 // Cinto e fivela metálica visíveis por cima das calças.
 const beltRing=new THREE.Mesh(new THREE.TorusGeometry(.151,.014,8,32),belt);beltRing.rotation.x=Math.PI/2;beltRing.position.set(0,.91,.004);figure.add(beltRing);
 box(figure,gold,[.055,.045,.018],[0,.91,.151]);
 // Corrente dourada e pendente, inspirados no acessório da referência.
 const chain=new THREE.Mesh(new THREE.TorusGeometry(.126,.012,8,32,Math.PI*2),gold);chain.rotation.x=Math.PI/2;chain.position.set(0,1.365,0);figure.add(chain);
 box(figure,gold,[.105,.105,.025],[0,1.245,.124]);
 box(figure,gold,[.065,.025,.012],[0,1.31,.132]);
 // Cabeça com proporções suaves, maxilar definido e expressão amigável.
 const head=new THREE.Group();head.position.set(0,1.505,0);figure.add(head);rig.head=head;
 sphere(head,skin,[0,.004,0],[.139,.174,.124],32);
 sphere(head,skin,[0,-.071,.018],[.105,.094,.103],28);
 sphere(head,skin,[0,-.125,.043],[.061,.043,.071],24);
 for(const side of [-1,1]){
  sphere(head,skin,[side*.137,-.006,.002],[.026,.043,.025],18);
  sphere(head,skinShade,[side*.148,-.006,.019],[.009,.024,.008],14);
  sphere(head,blush,[side*.083,-.043,.091],[.038,.022,.008],16);
 }
 for(const side of [-1,1]){
  sphere(head,skinShade,[side*.052,.027,.105],[.034,.023,.009],20);
  sphere(head,white,[side*.052,.027,.113],[.029,.0165,.011],24);
  sphere(head,iris,[side*.052,.026,.124],[.0125,.0135,.008],20);
  sphere(head,dark,[side*.052,.026,.131],[.006,.008,.004],16);
  sphere(head,white,[side*.048,.032,.135],[.0035,.0035,.0025],12);
  curveTube(head,skin,[[side*.082,.027,.112],[side*.053,.045,.125],[side*.022,.027,.117]],.0032,16);
  curveTube(head,skinShade,[[side*.079,.014,.111],[side*.052,.006,.119],[side*.025,.014,.116]],.0018,14);
  curveTube(head,brow,[[side*.088,.071,.099],[side*.058,.086,.122],[side*.024,.076,.127]],female?.0045:.0065,18);
 }
 sphere(head,skin,[0,-.004,.111],[.014,.041,.018],20);
 sphere(head,skin,[0,-.038,.132],[.021,.015,.016],20);
 for(const side of [-1,1])sphere(head,skinShade,[side*.012,-.046,.137],[.004,.0028,.0028],12);
 curveTube(head,skinShade,[[-.027,-.078,.113],[0,-.083,.123],[.027,-.078,.113]],.0022,16);
 curveTube(head,lip,[[-.026,-.079,.115],[0,-.087,.124],[.026,-.079,.115]],.0032,16);
 curveTube(head,lip,[[-.022,-.083,.116],[0,-.091,.122],[.022,-.083,.116]],.0025,14);
 if(!female&&(look.beardStyle||'goatee')!=='none'){
  curveTube(head,beard,[[-.042,-.064,.111],[-.023,-.059,.122],[-.006,-.064,.125]],.0055,12);
  curveTube(head,beard,[[.006,-.064,.125],[.023,-.059,.122],[.042,-.064,.111]],.0055,12);
  if((look.beardStyle||'goatee')==='goatee'||look.beardStyle==='full'){
   sphere(head,beard,[0,-.125,.092],[.031,.036,.025],20);
   sphere(head,beard,[0,-.151,.078],[.019,.018,.018],16);
   if(look.beardStyle==='full'){sphere(head,beard,[-.092,-.076,.025],[.025,.061,.035],16);sphere(head,beard,[.092,-.076,.025],[.025,.061,.035],16)}
  }
 }
 sphere(head,hair,[0,.126,-.006],[.143,.078,.13],28);
 if(hairStyle==='comprido'){
  sphere(head,hair,[0,.005,-.09],[.112,.15,.064],20);
  capsule(head,hair,.036,.19,[-.119,-.078,-.012]);capsule(head,hair,.036,.19,[.119,-.078,-.012]);
  for(let i=0;i<5;i++)sphere(head,hair,[-.084+i*.042,.178+Math.sin(i*1.1)*.012,.042],[.035,.035,.048],16);
 }else if(hairStyle==='medio'){
  sphere(head,hair,[0,.166,.012],[.128,.063,.105],24);
  sphere(head,hair,[-.119,.035,-.002],[.034,.082,.047],16);sphere(head,hair,[.119,.035,-.002],[.034,.082,.047],16);
  sphere(head,hair,[-.025,.19,.055],[.065,.035,.058],18);
 }else if(hairStyle==='encaracolado'){
  for(let i=0;i<15;i++){const a=i*Math.PI*2/15;sphere(head,hair,[Math.cos(a)*.105,.15+Math.sin(i*1.7)*.012,Math.sin(a)*.082],[.039,.042,.041],14)}
  for(let i=0;i<5;i++)sphere(head,hair,[-.08+i*.04,.19,.018],[.035,.04,.038],14);
 }else{
  sphere(head,hair,[0,.17,.055],[.085,.043,.066],20);
  sphere(head,hair,[-.064,.145,.064],[.046,.038,.05],18);sphere(head,hair,[.055,.15,.066],[.045,.036,.05],18);
  curveTube(head,hair,[[-.105,.151,.042],[-.052,.199,.047],[.018,.205,.036],[.079,.17,.038]],.009,18);
 }
 // Mangas compridas, braços articulados, mãos e punhos.
 for(const side of [-1,1]){
  const arm=new THREE.Group();arm.position.set(side*.19,1.315,0);figure.add(arm);rig[side<0?'leftArm':'rightArm']=arm;
  sphere(arm,shirt,[0,-.045,0],[.067,.085,.068]);
  capsule(arm,shirt,.057,.19,[0,-.145,0]);
  const forearm=new THREE.Group();forearm.position.set(0,-.265,0);arm.add(forearm);rig[side<0?'leftForearm':'rightForearm']=forearm;
  capsule(forearm,shirt,.045,.16,[0,-.085,0]);
  const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.046,.046,.035,16),gold);cuff.position.set(0,-.177,0);forearm.add(cuff);
  sphere(forearm,skin,[0,-.22,.006],[.045,.055,.039]);
  // Pequenos dedos simplificados para dar leitura às mãos.
  for(let f=0;f<3;f++)capsule(forearm,skin,.009,.025,[(f-1)*.018,-.255,.027]);
  const leg=new THREE.Group();leg.position.set(side*.078,.925,0);figure.add(leg);rig[side<0?'leftLeg':'rightLeg']=leg;
  capsule(leg,pants,.075,.23,[0,-.145,0]);
  sphere(leg,pants,[0,-.255,.005],[.071,.075,.071]);
  const calf=new THREE.Group();calf.position.set(0,-.29,0);leg.add(calf);rig[side<0?'leftCalf':'rightCalf']=calf;
  capsule(calf,pants,.061,.24,[0,-.145,0]);
  // Ténis completos, com sola escura, biqueira e atacadores.
  box(calf,sole,[.112,.035,.205],[0,-.305,.055]);
  box(calf,shoe,[.116,.075,.215],[0,-.265,.055]);
  sphere(calf,shoe,[0,-.265,.13],[.057,.045,.075]);
  for(let lace=0;lace<3;lace++)box(calf,white,[.052,.006,.012],[0,-.238,.025+lace*.026]);
 }
 // Ombros e gola reforçam o aspecto de personagem de jogo.
 const collar=new THREE.Mesh(new THREE.TorusGeometry(.074,.012,8,24),white);collar.rotation.x=Math.PI/2;collar.position.set(0,1.36,.01);figure.add(collar);
 if(female){for(const side of [-1,1])sphere(head,gold,[side*.145,-.015,.01],[.014,.014,.014],12)}
 figure.scale.setScalar(CHARACTER_HEIGHT/1.72);figure.userData.gaitRig=rig;figure.userData.styleVersion=4;return figure;
}
function applyAvatarLook(model,look){
 model.updateMatrixWorld(true);const whole=new THREE.Box3().setFromObject(model),height=Math.max(.001,whole.max.y-whole.min.y);
 const choices=[
  {key:'eyes',pattern:/(eye|iris|pupil)/i},
  {key:'hair',pattern:/(hair|cabelo|capil)/i},
  {key:'shirt',pattern:/(shirt|t.?shirt|top|jacket|hoodie|sweater|upper.?cloth|outfit.?top)/i},
  {key:'pants',pattern:/(pant|trouser|jean|short|lower.?cloth|outfit.?bottom)/i},
  {key:'skin',pattern:/(skin|body|face|head|arm|hand|leg|neck)/i}
 ];
 model.traverse(mesh=>{
  if(!mesh.isMesh||!mesh.material)return;
  const objectLabel=(mesh.name||'')+' '+(mesh.parent?.name||'');
  const original=Array.isArray(mesh.material)?mesh.material:[mesh.material];
  const updated=original.map(source=>{
   const label=(source.name||'')+' '+objectLabel;
   let match=choices.find(item=>item.pattern.test(label));
   if(!match){const bounds=new THREE.Box3().setFromObject(mesh),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),y=(center.y-whole.min.y)/height;const small=Math.max(size.x,size.y,size.z)<height*.24;if(y>.84&&small)match=choices.find(x=>x.key==='hair');else if(y>.76&&y<.91&&small&&center.z>whole.min.z+(whole.max.z-whole.min.z)*.55)match=choices.find(x=>x.key==='eyes');else if(y>.37&&y<.76)match=choices.find(x=>x.key==='shirt');else if(y>.04&&y<.39)match=choices.find(x=>x.key==='pants');else if(y>.18&&y<.94)match=choices.find(x=>x.key==='skin')}
   if(!match||!look[match.key])return source;
   const material=source.clone();
   if(material.color)material.color.set(look[match.key]);
   material.needsUpdate=true;
   return material;
  });
  mesh.material=Array.isArray(mesh.material)?updated:updated[0];
 });
}
function buildCharacter(target,look,position={x:0,y:0,z:0},onMixer=()=>{},animateWalk=false){
 const gender=look.gender==='female'?'female':'male',styledLook={...look,gender,beardStyle:look.beardStyle||(gender==='male'?'goatee':'none')},root=new THREE.Group();
 root.userData.keepWorldScale=true;root.userData.styleVersion=4;root.userData.actionState={type:'idle',time:0};
 if(!target.userData.characters)target.userData.characters=[];target.userData.characters.push(root);
 root.position.set(position.x,position.y,position.z);target.add(root);
 const figure=createFallbackHuman(styledLook);
 root.userData.fallbackFigure=figure;root.userData.fallbackRig=figure.userData.gaitRig;root.add(figure);
 return root;
}
function makeRenderer(host,kind,roomName='sala',entrySpawn=null){
gameAudioState.currentVenue=kind==='room'&&(roomName==='bar'||roomName==='party')?roomName:null;
if(gameAudioState.currentVenue){wakeGameAudio()}else stopVenueMusic();
host.querySelectorAll('canvas').forEach(c=>c.remove());
const scene=new THREE.Scene();scene.background=new THREE.Color(kind==='room'?'#c6d0d7':kind==='avatar'?'#211b29':'#58a9ed');
const camera=new THREE.PerspectiveCamera(42,host.clientWidth/host.clientHeight,.1,100);
camera.position.set(kind==='room'?0:0,kind==='room'?2.5:1.6,kind==='room'?10.5:5.4);
const renderer=new THREE.WebGLRenderer({antialias:kind==='avatar',powerPreference:'low-power'});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,kind==='avatar'?1.5:1.25));renderer.setSize(host.clientWidth,host.clientHeight);renderer.shadowMap.enabled=false;host.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xffffff,0x6c7481,kind==='avatar'?2.35:2));const light=new THREE.DirectionalLight(0xfff1df,kind==='avatar'?2.45:2.2);light.position.set(-3,7,5);scene.add(light);
if(kind==='avatar'){const fill=new THREE.DirectionalLight(0xd9e8ff,1.05);fill.position.set(3,3,4);scene.add(fill);const rim=new THREE.DirectionalLight(0xffdca0,1.15);rim.position.set(0,4,-3);scene.add(rim)}
let target=new THREE.Group();target.userData.characters=[];scene.add(target);let mixer=null,houseAvatar=null,playerVehicleRealtimeChannel=null,barWaitressAgents=[],barDjAgent=null,workAgents=[],barSceneActions=null,barCash=500,barCashKey='';const clock=new THREE.Clock();let cityCollisionBoxes=[],cityWorldEntrances=[],cityPoliceAgents=[],cityPoliceVehicles=[],cityDrivableCars=[],sceneSeatAnchors=[],speakerMeshes=[];let nearbySeat=null;const addCityCollision=(x,z,w,d,pad=.42)=>cityCollisionBoxes.push({minX:x-w/2-pad,maxX:x+w/2+pad,minZ:z-d/2-pad,maxZ:z+d/2+pad});const cityBlocked=(x,z,radius=.38)=>cityCollisionBoxes.some(c=>{const dx=Math.max(c.minX-x,0,x-c.maxX),dz=Math.max(c.minZ-z,0,z-c.maxZ);return dx*dx+dz*dz<radius*radius});
const mat=(c,r=.8)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
function box(w,h,d,m,x,y,z,parent=target){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
function createDetailedCar(color='#a83e36',police=false){
 const g=new THREE.Group(),body=mat(color,.48),glass=new THREE.MeshStandardMaterial({color:'#263e4c',roughness:.28,transparent:true,opacity:.42,depthWrite:false}),rubber=mat('#171a1d',.96),hub=mat('#c1c8ca',.42),chrome=mat('#aeb9bf',.38);g.userData.damageLevel=0;g.userData.damageMarks=[];
 const shell=(points,depth,material,bevel=.08)=>{
  const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++){const p=points[i];if(p.length===4)shape.quadraticCurveTo(p[0],p[1],p[2],p[3]);else shape.lineTo(p[0],p[1])}
  shape.closePath();
  const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:bevel,bevelThickness:bevel,curveSegments:10});
  geo.translate(0,0,-depth/2);const mesh=new THREE.Mesh(geo,material);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);return mesh;
 };
 // Carroçaria com capô, tejadilho e traseira arredondados.
 shell([[-1.72,.27],[-1.78,.42],[-1.68,.68],[-1.48,.76],[1.42,.76],[1.68,.62],[1.76,.39],[1.68,.27]],1.34,body,.075);
 // Cabine inclinada, com vidro escuro e perfil de automóvel.
 shell([[-1.12,.72],[-.88,1.22],[-.66,1.34],[.55,1.34],[.98,.76]],.99,glass,.055);
 // Faixa inferior, para-choques, grelha e faróis.
 const addBox=(w,h,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;g.add(o);return o};
 addBox(.12,.12,1.3,chrome,1.7,.34,0);addBox(.12,.12,1.3,chrome,-1.7,.34,0);
 addBox(.035,.22,.42,mat('#202a30',.8),1.79,.52,0);
 [-1,1].forEach(side=>{addBox(.06,.16,.32,mat('#f6e9c2',.35),1.73,.64,side*.43);addBox(.045,.15,.28,mat('#b6322d',.4),-1.73,.63,side*.43)});
 // Rodas com pneus de borracha, jantes metálicas e cubos.
 [-1,1].forEach(side=>[-1,1].forEach(ax=>{
  const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.285,.285,.17,24),rubber);wheel.rotation.x=Math.PI/2;wheel.position.set(ax*1.12,.31,side*.69);wheel.castShadow=true;g.add(wheel);
  const rim=new THREE.Mesh(new THREE.CylinderGeometry(.17,.17,.18,20),hub);rim.rotation.x=Math.PI/2;rim.position.set(ax*1.12,.31,side*.69);g.add(rim);
  const hubcap=new THREE.Mesh(new THREE.CylinderGeometry(.075,.075,.19,16),chrome);hubcap.rotation.x=Math.PI/2;hubcap.position.set(ax*1.12,.31,side*.69);g.add(hubcap);
 }));
 // Janelas laterais, pilares e espelhos retrovisores.
 [-1,1].forEach(side=>{
  const windowMat=new THREE.MeshStandardMaterial({color:'#66808d',roughness:.25,metalness:.12});
  const sideWindow=new THREE.Mesh(new THREE.PlaneGeometry(.62,.34),windowMat);sideWindow.position.set(-.12,.99,side*.505);sideWindow.rotation.y=side*Math.PI/2;g.add(sideWindow);
  const rearWindow=new THREE.Mesh(new THREE.PlaneGeometry(.35,.34),windowMat);rearWindow.position.set(.66,1.0,side*.505);rearWindow.rotation.y=side*Math.PI/2;g.add(rearWindow);
  const mirror=new THREE.Mesh(new THREE.SphereGeometry(.075,12,10),chrome);mirror.scale.set(1,.65,.7);mirror.position.set(-.92,.83,side*.62);g.add(mirror);
 });
 if(police){
  const stripe=mat('#174b86',.48),red=mat('#d83b37',.38),blue=mat('#277ee8',.32);
  [-1,1].forEach(side=>{
   const panel=new THREE.Mesh(new THREE.BoxGeometry(1.85,.18,.025),stripe);panel.position.set(-.02,.68,side*.683);g.add(panel);
   const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#174b86';ctx.fillRect(0,0,512,128);ctx.fillStyle='#fff';ctx.font='bold 70px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('POLÍCIA',256,65);
   const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;
   const label=new THREE.Mesh(new THREE.PlaneGeometry(.95,.23),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide}));label.position.set(-.02,.69,side*.7);label.rotation.y=side*Math.PI/2;g.add(label);
  });
  addBox(.72,.11,.28,stripe,0,1.4,0);
  addBox(.27,.15,.25,red,-.2,1.48,0);addBox(.27,.15,.25,blue,.2,1.48,0);
  addBox(.9,.12,.06,mat('#f1f2ee',.55),-.2,.88,.69);
 }
 const damageMaterial=mat('#292b2c',.72);
 for(const side of [-1,1]){const mark=new THREE.Mesh(new THREE.BoxGeometry(.42,.055,.018),damageMaterial);mark.position.set(.15,.53,side*.685);mark.visible=false;g.add(mark);g.userData.damageMarks.push(mark)}
 return g;
}
function markVehicleCollision(vehicle){const car=vehicle?.group||vehicle;if(!car)return;car.visible=true;car.userData.damageLevel=(car.userData.damageLevel||0)+1;const marks=car.userData.damageMarks||[];const mark=marks[Math.min(car.userData.damageLevel-1,marks.length-1)];if(mark)mark.visible=true}
const roomNames={sala:'SALA',quarto:'QUARTO',cozinha:'COZINHA',banheiro:'CASA DE BANHO',garagem:'GARAGEM',esquadra:'ESQUADRA DA POLÍCIA',hospital:'HOSPITAL · RECEPÇÃO','hospital-tratamento':'SALA DE TRATAMENTO','hospital-consultorio':'CONSULTÓRIO MÉDICO',bar:'BAR DAS PUTAS',hotel:'HOTEL · RECEPÇÃO',market:'MERCADO',quarry:'EMPRESA DA PEDREIRA',cars:'LOJA DE CARROS',party:'SALÃO DE FESTAS',salon:'SALÃO DE BELEZA',clothes:'LOJA DE ROUPAS','bar-private-1':'SALA PRIVADA 1','bar-private-2':'SALA PRIVADA 2',...Object.fromEntries(Array.from({length:10},(_,i)=>['hotel-suite-'+(i+1),'HOTEL · SUÍTE '+String(i+1).padStart(2,'0')]))};
const doorDefs={
 sala:[{label:'QUARTO',dest:'quarto',side:'east',center:1.25,spawn:{x:2.55,z:1.25},face:Math.PI/2},{label:'COZINHA',dest:'cozinha',side:'west',center:1.25,spawn:{x:-2.55,z:1.25},face:-Math.PI/2}],
 quarto:[{label:'SALA',dest:'sala',side:'west',center:1.25,spawn:{x:-2.55,z:1.25},face:-Math.PI/2},{label:'CASA DE BANHO',dest:'banheiro',side:'east',center:1.25,spawn:{x:2.55,z:1.25},face:Math.PI/2}],
 cozinha:[{label:'SALA',dest:'sala',side:'east',center:1.25,spawn:{x:2.55,z:1.25},face:Math.PI/2}],
 banheiro:[{label:'QUARTO',dest:'quarto',side:'west',center:1.25,spawn:{x:-2.55,z:1.25},face:-Math.PI/2}],
 garagem:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:14,z:-17.5,face:Math.PI}}],
 esquadra:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spanX:18.4,spanZ:18.4,spawn:{x:28,z:-17.2,face:Math.PI}}],
 hospital:[{label:'SALA DE TRATAMENTO',dest:'hospital-tratamento',side:'east',center:0,spawn:{x:-2.55,z:0,face:Math.PI/2},hospitalDoor:true},{label:'CONSULTÓRIO MÉDICO',dest:'hospital-consultorio',side:'west',center:0,spawn:{x:2.55,z:0,face:-Math.PI/2},hospitalDoor:true},{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:-28,z:-22.65,face:Math.PI}}],
 'hospital-tratamento':[{label:'VOLTAR À RECEPÇÃO',dest:'hospital',side:'south',center:0,spawn:{x:2.55,z:0,face:Math.PI}}],
 'hospital-consultorio':[{label:'VOLTAR À RECEPÇÃO',dest:'hospital',side:'south',center:0,spawn:{x:-2.55,z:0,face:Math.PI}}],
 hotel:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'north',center:0,spawn:{x:0,z:-5.45,face:Math.PI}}],
 bar:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'north',center:0,spanX:36,spanZ:28,spawn:{x:-28,z:12.45,face:Math.PI}},{label:'SALA PRIVADA 1',dest:'bar-private-1',side:'west',center:0,spanX:36,spanZ:28,spawn:{x:-15.4,z:0,face:-Math.PI/2}},{label:'SALA PRIVADA 2',dest:'bar-private-2',side:'east',center:0,spanX:36,spanZ:28,spawn:{x:15.4,z:0,face:Math.PI/2}}],
 'bar-private-1':[{label:'VOLTAR AO BAR',dest:'bar',side:'east',center:0,spawn:{x:-15.4,z:0,face:Math.PI/2}}],
 'bar-private-2':[{label:'VOLTAR AO BAR',dest:'bar',side:'west',center:0,spawn:{x:15.4,z:0,face:-Math.PI/2}}],
 party:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'north',center:0,spanX:36,spanZ:28,spawn:{x:28,z:12.45,face:Math.PI}},{label:'SAÍDA DE EMERGÊNCIA',dest:'city',side:'south',center:0,spanX:36,spanZ:28,spawn:{x:28,z:43.55,face:0}}],
 market:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:28,z:-11.8,face:Math.PI}}],
 quarry:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:0,z:-16.7,face:Math.PI}}],
 cars:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:-28,z:-11.8,face:Math.PI}}],
 salon:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:-3.4,z:22.7,face:Math.PI}}],
 clothes:[{label:'SAIR PARA POVO GRANDE',dest:'city',side:'south',center:0,spawn:{x:3.4,z:22.7,face:Math.PI}}],
 ...Object.fromEntries(Array.from({length:10},(_,i)=>['hotel-suite-'+(i+1),[{label:'VOLTAR À RECEPÇÃO',dest:'hotel',side:'south',center:0,spawn:{x:0,z:2.7,face:Math.PI}}]]))
};
let roomDoorMeshes=[];let policeEntryMeshes=[];
function addRoomDoor(def){
 const g=new THREE.Group(),north=def.side==='north',south=def.side==='south',east=def.side==='east';
 const spanX=def.spanX||8,spanZ=def.spanZ||8;
 const x=north||south?def.center:(east?spanX/2-.18:-spanX/2+.18),z=north?-spanZ/2+.18:(south?spanZ/2-.18:def.center);
 g.position.set(x,0,z);g.rotation.y=(east||def.side==='west')?Math.PI/2:0;
 const frame=mat(def.hospitalDoor?'#dbe5e9':'#d2b58b'),panel=new THREE.MeshStandardMaterial({color:def.hospitalDoor?'#d8e8ed':'#76543c',roughness:.8,transparent:true,opacity:def.hospitalDoor?.32:.08,depthWrite:false,side:THREE.DoubleSide});
 let d;if(def.hospitalDoor){for(const px of [-.38,.38]){const leaf=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.82,5,14),panel);leaf.position.set(px,1.08,0);leaf.scale.set(1,.96,.22);g.add(leaf);const handle=hcyl(.025,.18,mat('#b7a56d'),px+(px<0?.2:-.2),1.05,.075,g);handle.rotation.z=Math.PI/2}for(const px of [-.78,.78])hcyl(.055,2.42,frame,px,1.2,0,g);const top=hcyl(.055,1.62,frame,0,2.42,0,g);top.rotation.z=Math.PI/2;d=new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.4),new THREE.MeshBasicMaterial({transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));d.position.set(0,1.2,.02);g.add(d)}else{d=new THREE.Mesh(new THREE.BoxGeometry(1.18,2.25,.12),panel);d.position.y=1.08;g.add(d);for(const px of [-.66,.66]){const side=new THREE.Mesh(new THREE.BoxGeometry(.12,2.45,.16),frame);side.position.set(px,1.2,0);g.add(side)}const top=new THREE.Mesh(new THREE.BoxGeometry(1.42,.13,.16),frame);top.position.set(0,2.42,0);g.add(top)}
 const marker=new THREE.Group();marker.name='doorPermissionArrow';marker.userData={roomDoor:true,door:def};marker.position.y=2.82;
 const arrow=new THREE.Mesh(new THREE.ConeGeometry(.18,.38,8),new THREE.MeshStandardMaterial({color:'#ffd34d',emissive:'#b8860b',emissiveIntensity:1}));arrow.rotation.z=Math.PI;marker.add(arrow);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(.25,.035,6,16),new THREE.MeshStandardMaterial({color:'#fff0a6',emissive:'#c58b12',emissiveIntensity:.8}));ring.rotation.x=Math.PI/2;ring.position.y=.19;marker.add(ring);g.add(marker);
 g.userData={roomDoor:true,door:def};d.userData={roomDoor:true,door:def};target.add(g);roomDoorMeshes.push(g,d);
}
function addWallWithOpening(side,center){
 const wall=makeStoneWallMaterial(),span=8,half=span/2,opening=1.55,left=center-opening/2,right=center+opening/2;
 const segmentA=Math.max(0,left+half),segmentB=Math.max(0,half-right);
 if(side==='north'||side==='south'){
  const z=side==='north'?-4:4;
  if(segmentA>.05)box(segmentA,3.6,.18,wall,(-half+left)/2,1.65,z);
  if(segmentB>.05)box(segmentB,3.6,.18,wall,(right+half)/2,1.65,z);
 }else{
  const x=side==='west'?-4:4;
  if(segmentA>.05)box(.18,3.6,segmentA,wall,x,1.65,(-half+left)/2);
  if(segmentB>.05)box(.18,3.6,segmentB,wall,x,1.65,(right+half)/2);
 }
}
function makeStoneWallMaterial(){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#b9b2a5';ctx.fillRect(0,0,512,512);
 for(let row=0;row<8;row++){const offset=row%2? -32:0;for(let col=-1;col<5;col++){const x=col*128+offset,y=row*64;const tones=['#aaa397','#c5beb1','#958f85','#b4ada1','#d0c8ba'];ctx.fillStyle=tones[(row*7+col*3+40)%tones.length];ctx.fillRect(x+3,y+3,122,58);ctx.strokeStyle='#766f66';ctx.lineWidth=4;ctx.strokeRect(x+3,y+3,122,58);ctx.strokeStyle='#ffffff35';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x+9,y+9);ctx.lineTo(x+115,y+9);ctx.stroke();}}
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1.5,1.5);
 return new THREE.MeshStandardMaterial({map:texture,color:'#ffffff',roughness:.95,transparent:true,opacity:.24,depthWrite:false,side:THREE.DoubleSide});
}
function buildPoliceStationInterior(){
 // Interior simples e funcional da esquadra: recepção, espera e atendimento.
 scene.background=new THREE.Color('#c6d5df');
 const floor=mat('#b9b5a9',.96),wall=mat('#d8dedf',.96),blue=mat('#173f70',.9),trim=mat('#f0f1ec',.9),wood=mat('#76563b',.88),metal=mat('#414b55',.78),glass=mat('#31546b',.35);
 box(8,.18,8,floor,0,-.12,0);
 box(8,3.35,.2,wall,0,1.58,-4);
 box(.2,3.35,8,wall,-4,1.58,0);
 box(.2,3.35,8,wall,4,1.58,0);
 // Parede de entrada com abertura central para a porta de saída.
 box(3.15,3.35,.2,wall,-2.42,1.58,4);
 box(3.15,3.35,.2,wall,2.42,1.58,4);
 box(1.7,.95,.2,wall,0,2.98,4);
 // Faixa azul institucional e rodapés.
 box(7.8,.32,.08,blue,0,2.45,-3.86);
 box(.08,.24,7.8,blue,-3.86,.16,0);
 box(.08,.24,7.8,blue,3.86,.16,0);
 // Balcão de recepção com frente azul, tampo e equipamento.
 furnCounter(4.7,.95,.82,blue,trim,wood,0,-.95);
 box(4.85,.12,.9,trim,0,1.13,-.95);
 box(4.55,.12,.68,wood,0,.12,-.95);
 box(.85,.62,.08,glass,-1.2,1.52,-1.2);
 box(.92,.07,.55,metal,-1.2,1.19,-1.15);
 box(.42,.06,.3,metal,.5,1.22,-1.05);
 box(.12,.24,.12,metal,.5,1.34,-1.05);
 // Placa da recepção na parede do fundo.
 const signCanvas=document.createElement('canvas');signCanvas.width=512;signCanvas.height=128;
 const signCtx=signCanvas.getContext('2d');signCtx.fillStyle='#123d70';signCtx.fillRect(0,0,512,128);signCtx.strokeStyle='#e7c86e';signCtx.lineWidth=7;signCtx.strokeRect(5,5,502,118);signCtx.fillStyle='#fff';signCtx.font='bold 48px Arial';signCtx.textAlign='center';signCtx.textBaseline='middle';signCtx.fillText('RECEPÇÃO',256,66);
 const signTex=new THREE.CanvasTexture(signCanvas);signTex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(3.3,.78,.08),new THREE.MeshStandardMaterial({map:signTex,roughness:.8}));sign.position.set(0,2.65,-3.86);target.add(sign);
 // Armários de arquivo e quadro de avisos.
 [-3.05,3.05].forEach((x,i)=>{
  box(.95,1.85,.72,blue,x,.95,-2.95);
  for(let y=0;y<3;y++){box(.78,.035,.04,trim,x,.42+y*.55,-2.56);box(.12,.07,.05,metal,x,.42+y*.55,-2.51)}
 });
 box(1.25,.9,.08,mat('#f1e9d5',.9),2.95,2.35,-3.84);
 for(let k=0;k<3;k++)box(.75,.035,.04,mat('#9b4b3d',.9),2.95,2.62-k*.23,-3.77);
 // Cadeiras para os cidadãos aguardarem atendimento.
 for(let i=0;i<3;i++){
  const x=-2.45+i*1.05;
  hchair(x,1.45,'#173f70',Math.PI);
 }
 // Duas cadeiras de trabalho, alinhadas com os computadores atrás do balcão.
 [-1.25,1.15].forEach(x=>hchair(x,-2.05,'#173f70',0));
 // Os dois agentes diante dos computadores ficam sentados, com postura de atendimento.
 addPoliceOfficer(-1.25,-2.05,0,1,true,true);
 addPoliceOfficer(1.15,-2.05,0,1,true,true);
 // Terceiro agente permanece de pé junto aos arquivos.
 addPoliceOfficer(3.05,.05,Math.PI/2,1,true,false);
 // Segundo computador para o posto de atendimento da direita.
 box(.72,.5,.07,glass,1.15,1.51,-1.2);
 box(.78,.06,.48,metal,1.15,1.2,-1.13);
 box(.1,.22,.1,metal,1.15,1.34,-1.13);
 // Bandeira de Angola num suporte discreto.
 const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.045,2.25,8),metal);pole.position.set(-3.25,1.25,-1.25);target.add(pole);
 box(.72,.42,.035,mat('#c52d35',.9),-2.88,2.02,-1.25);
 box(.72,.42,.035,mat('#171717',.9),-2.88,1.6,-1.25);
 const emblem=new THREE.Mesh(new THREE.CircleGeometry(.12,12),mat('#d6b34e',.7));emblem.position.set(-2.88,1.81,-1.22);target.add(emblem);
 // Zona administrativa reservada aos agentes, com secretária e arquivo.
 hdesk(-2.55,2.35,2.55);
 box(.95,1.5,.58,blue,-3.35,.78,-.2);box(.95,1.5,.58,blue,-3.35,.78,1.45);
 hchair(-2.55,1.35,'#173f70',Math.PI);
 // Sala de interrogatório: mesa central, duas cadeiras e iluminação própria.
 furnCounter(2.25,.82,1.05,wood,trim,metal,1.85,-1.95);
 hchair(1.05,-1.95,'#59636c',Math.PI/2);hchair(2.65,-1.95,'#59636c',-Math.PI/2);
 box(.08,1.9,.08,metal,3.35,.95,-2.8);box(.08,1.9,.08,metal,3.35,.95,-1.1);
 // Duas celas individuais no fundo direito, com grades metálicas visíveis.
 for(let cell=0;cell<2;cell++){
  const z=.35+cell*1.75;
  box(1.05,.12,1.45,mat('#858c8e'),2.75,.08,z);
  box(1.05,.12,1.45,mat('#858c8e'),2.75,.82,z);
  for(let k=0;k<7;k++){const bar=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,1.55,8),metal);bar.position.set(2.25+k*.17,.88,z-.7);target.add(bar)}
  box(1.1,.12,.08,metal,2.75,.08,z-.72);box(1.1,.12,.08,metal,2.75,.08,z+.72);
  box(.42,.16,.42,mat('#a9afb0'),2.55,.28,z+.35);
 }
 // Placas funcionais para orientar o jogador dentro da esquadra.
 const label=(text,x,z,color='#173f70')=>{const cv=document.createElement('canvas');cv.width=320;cv.height=72;const cx=cv.getContext('2d');cx.fillStyle=color;cx.fillRect(0,0,320,72);cx.fillStyle='#fff';cx.font='bold 30px Arial';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(text,160,38);const m=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.38),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),side:THREE.DoubleSide}));m.position.set(x,2.35,z);target.add(m)};
 label('ADMINISTRAÇÃO',-2.55,3.82);label('INTERROGATÓRIO',2.55,3.82);label('DETENÇÃO',3.5,.15);
}
function addLargeVenueWall(side,span,center,opening,height,material){
 const thick=.22,mid=height/2,half=span/2,z=side==='north'?-14:14,x=side==='west'?-18:18;
 if(center===null){if(side==='north'||side==='south')box(span,height,thick,material,0,mid,z);else box(thick,height,span,material,x,mid,0);return}
 const a=center-opening/2,b=center+opening/2,A=Math.max(0,a+half),B=Math.max(0,half-b);
 if(side==='north'||side==='south'){if(A>.05)box(A,height,thick,material,(-half+a)/2,mid,z);if(B>.05)box(B,height,thick,material,(b+half)/2,mid,z);box(opening,Math.max(.1,height-2.5),thick,material,center,(height+2.5)/2,z)}
 else{if(A>.05)box(thick,height,A,material,x,mid,(-half+a)/2);if(B>.05)box(thick,height,B,material,x,mid,(b+half)/2);box(thick,Math.max(.1,height-2.5),opening,material,x,(height+2.5)/2,center)}
}
function addVenueCapacitySign(title,x,z,color){
 const c=document.createElement('canvas');c.width=900;c.height=150;const q=c.getContext('2d');q.fillStyle=color;q.fillRect(0,0,900,150);q.strokeStyle='#d8b36d';q.lineWidth=7;q.strokeRect(8,8,884,134);q.fillStyle='#fff0c9';q.textAlign='center';q.textBaseline='middle';q.font='bold 46px Arial';q.fillText(title,450,55);q.font='bold 30px Arial';q.fillText('CAPACIDADE DO ESPAÇO: 500 PESSOAS',450,108);const sign=new THREE.Mesh(new THREE.PlaneGeometry(8.2,1.35),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(x,3.55,z);target.add(sign);
}
function venueTable(x,z,wood,metal,seat){
 const top=new THREE.Mesh(new THREE.CylinderGeometry(.78,.82,.13,20),wood);top.position.set(x,.82,z);target.add(top);const leg=new THREE.Mesh(new THREE.CylinderGeometry(.09,.13,.72,10),metal);leg.position.set(x,.42,z);target.add(leg);
 for(const a of [0,Math.PI/2,Math.PI,Math.PI*1.5]){const sx=x+Math.cos(a)*1.12,sz=z+Math.sin(a)*1.12;box(.48,.12,.48,seat,sx,.52,sz);box(.48,.62,.12,seat,sx,.86,sz-Math.cos(a)*.16)}
}

function buildVenueSpeaker(x,z,accent='#d7a15a'){
 const group=new THREE.Group(),cabinet=mat('#11171c',.76),cone=mat('#252c32',.58),trim=mat(accent,.38);
 group.position.set(x,0,z);box(.82,1.78,.66,cabinet,0,.91,0,group);box(.9,.08,.72,trim,0,1.78,0,group);
 for(const [y,r] of [[1.34,.25],[.72,.19]]){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(r,.025,8,24),trim);ring.rotation.x=Math.PI/2;ring.position.set(0,y,.345);group.add(ring);
  const woofer=new THREE.Mesh(new THREE.CylinderGeometry(r*.78,r*.78,.035,24),cone);woofer.rotation.x=Math.PI/2;woofer.position.set(0,y,.345);group.add(woofer);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(r*.25,14,10),trim);cap.position.set(0,y,.37);group.add(cap);
 }
 const ledMaterial=new THREE.MeshStandardMaterial({color:'#4b5357',emissive:'#111111',emissiveIntensity:.1});
 const led=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),ledMaterial);led.position.set(0,1.62,.36);group.add(led);
 const hitbox=new THREE.Mesh(new THREE.BoxGeometry(1.18,2.15,.95),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));hitbox.position.y=1.02;group.add(hitbox);
 group.userData.audioSpeaker=true;group.userData.powerLight=ledMaterial;target.add(group);speakerMeshes.push(group);venueSpeakerIndicators.push(ledMaterial);return group;
}

function getBarCashKey(){return 'angola-life-bar-cash:'+(user?.id||'guest')}
function refreshBarCash(){const display=$('bar-cash-display');if(display)display.textContent='💵 '+new Intl.NumberFormat('pt-PT').format(barCash)+' Kz'}
function installBarSceneActions(){
 barCashKey=getBarCashKey();const saved=Number(localStorage.getItem(barCashKey));barCash=Number.isFinite(saved)&&saved>=0?saved:500;
 const nav=$('room-door-nav');if(!nav)return;
 const service=document.createElement('button');service.id='bar-service-action';service.type='button';service.textContent='🍹 PEDIR À GARÇONETE';service.style.display='none';service.onclick=openBarServiceMenu;nav.appendChild(service);
 const music=document.createElement('button');music.id='bar-dj-action';music.type='button';music.textContent='🎧 VER MÚSICAS';music.onclick=()=>openBarMusicPanel('bar');nav.appendChild(music);
 const wallet=$('life-wallet');if(wallet&&!$('bar-cash-display')){const cash=document.createElement('span');cash.id='bar-cash-display';cash.className='hud-chip';wallet.appendChild(cash)}
 refreshBarCash();
}
function openBarServiceMenu(){
 if(!barWaitressAgents.length)return;
 const waiter=barWaitressAgents.find(a=>a.state==='ready'||a.state==='approach')||barWaitressAgents[0];
 const drinks=[['Cuca',300,'🍺'],['Dopel',350,'🍺'],['Wys',3000,'🥃'],['Nocal',400,'🍺'],['Amarula',2000,'🥃'],['Caipirinha',150,'🍹']];
 const rows=drinks.map((d,i)=>'<div class="life-row"><span>'+d[2]+' '+d[0]+'<br><small class="life-muted">'+new Intl.NumberFormat('pt-PT').format(d[1])+' Kz</small></span><button class="secondary" data-bar-buy="'+i+'">PEDIR</button></div>').join('');
 openLifePanel('Atendimento · Bar das Putas','<p class="life-muted" id="bar-service-status">A garçonete está pronta para receber o teu pedido.</p><div class="life-list">'+rows+'</div><p class="life-muted">Saldo: <strong id="bar-service-balance">'+new Intl.NumberFormat('pt-PT').format(barCash)+' Kz</strong></p>');
 const panel=$('life-panel');panel.querySelectorAll('[data-bar-buy]').forEach(button=>button.onclick=()=>{
  const drink=drinks[Number(button.dataset.barBuy)];if(!drink)return;
  const status=$('bar-service-status');
  if(barCash<drink[1]){status.textContent='Não tens dinheiro suficiente para '+drink[0]+'.';return}
  if(waiter.state==='serving'){status.textContent='A garçonete já está a preparar outro pedido. Aguarda um momento.';return}
  barCash-=drink[1];localStorage.setItem(barCashKey,String(barCash));refreshBarCash();
  const balance=$('bar-service-balance');if(balance)balance.textContent=new Intl.NumberFormat('pt-PT').format(barCash)+' Kz';
  waiter.order=drink[0];waiter.state='serving';waiter.serveUntil=performance.now()+1800;waiter.group.userData.actionState={type:'wave',time:0};
  status.textContent='Pedido recebido: '+drink[0]+'. A garçonete está a preparar e vai levar a bebida à tua mesa.';
  panel.querySelectorAll('[data-bar-buy]').forEach(b=>b.disabled=true);
 });
}
function updateBarServiceAI(delta,now){
 if(!barWaitressAgents.length)return;
 const player=houseAvatar,serviceButton=$('bar-service-action');
 let nearest=Infinity;
 for(const agent of barWaitressAgents){
  const npc=agent.group;if(!npc)continue;
  const dx=(player?.position.x??999)-npc.position.x,dz=(player?.position.z??999)-npc.position.z,dist=Math.hypot(dx,dz);
  if(player&&dist<nearest)nearest=dist;
  if(agent.state==='serving'){
   if(now<agent.serveUntil){if(npc.userData.actionState?.type!=='wave')npc.userData.actionState={type:'wave',time:0};continue}
   agent.state='delivering';agent.deliveryUntil=now+1250;
   const status=$('bar-service-status');if(status)status.textContent='A garçonete está a levar '+agent.order+' até à tua mesa.';
  }
  if(agent.state==='delivering'){
   if(now<agent.deliveryUntil){if(player)npc.rotation.y=Math.atan2(player.position.x-npc.position.x,player.position.z-npc.position.z);if(npc.userData.actionState?.type!=='wave')npc.userData.actionState={type:'wave',time:0};continue}
   const status=$('bar-service-status');if(status)status.textContent='Pedido entregue: '+agent.order+'. Bom proveito!';
   agent.state='patrol';agent.order=null;agent.waypoint=(agent.waypoint+1)%agent.route.length;npc.userData.actionState={type:'idle',time:0};
  }
  if(player&&dist<2.5&&agent.state==='patrol'){agent.state='approach';agent.target={x:player.position.x+(agent.side===0?-1.05:1.05),z:player.position.z-0.15}}
  if(agent.state==='approach'&&player){
   if(dist<1.45){agent.state='ready';if(npc.userData.actionState?.type!=='wave')npc.userData.actionState={type:'wave',time:0};}
   else{const tx=agent.target?.x??player.position.x,tz=agent.target?.z??player.position.z,vx=tx-npc.position.x,vz=tz-npc.position.z,len=Math.hypot(vx,vz)||1,step=Math.min(len,1.35*delta);npc.position.x+=vx/len*step;npc.position.z+=vz/len*step;npc.rotation.y=Math.atan2(vx,vz);updateFallbackHumanGait(npc,delta,1.2,true);npc.userData.actionState={type:'idle',time:0}}
  }else if(agent.state==='ready'){
   if(!player||dist>4){agent.state='patrol';agent.target=null}
   else{npc.rotation.y=Math.atan2(player.position.x-npc.position.x,player.position.z-npc.position.z);if(npc.userData.actionState?.type!=='wave')npc.userData.actionState={type:'wave',time:0}}
  }
  if(agent.state==='patrol'){
   const point=agent.route[agent.waypoint],vx=point.x-npc.position.x,vz=point.z-npc.position.z,len=Math.hypot(vx,vz);
   if(len<.28){agent.waypoint=(agent.waypoint+1)%agent.route.length}
   else{const step=Math.min(len,1.05*delta);npc.position.x+=vx/len*step;npc.position.z+=vz/len*step;npc.rotation.y=Math.atan2(vx,vz);updateFallbackHumanGait(npc,delta,1.0,true)}
  }
 }
 const canOrder=nearest<4.2&&barWaitressAgents.some(a=>a.state==='ready'||a.state==='approach');
 if(serviceButton)serviceButton.style.display=canOrder?'':'none';
 if(barDjAgent){const dj=barDjAgent;dj.rotation.y=Math.sin(now*.0012)*.08;dj.position.y=.015+Math.abs(Math.sin(now*.006))*.025;const rig=dj.userData.fallbackRig;if(rig?.leftArm){rig.leftArm.rotation.z=-.35+Math.sin(now*.012)*.28;rig.rightArm.rotation.z=.35+Math.sin(now*.012+1.3)*.28;rig.leftForearm.rotation.x=-.2+Math.sin(now*.01)*.18;rig.rightForearm.rotation.x=-.2+Math.sin(now*.01+1.3)*.18}}
}


function buildBarInterior(){
 const w=36,d=28,h=4.8,floor=mat('#342a28',.62),wall=mat('#382c2b',.9),wood=mat('#5c3428',.48),gold=mat('#c69b58',.42),metal=mat('#343b40',.4),glass=mat('#8db9c4',.18),seat=mat('#633b36',.72);
 box(w,.2,d,floor,0,-.12,0);addLargeVenueWall('north',w,0,2.6,h,wall);addLargeVenueWall('south',w,null,0,h,wall);addLargeVenueWall('west',d,0,2.6,h,wall);addLargeVenueWall('east',d,0,2.6,h,wall);(doorDefs.bar||[]).forEach(addRoomDoor);
 furnCounter(12,1.05,.95,wood,gold,metal,0,-9.1);box(12.2,1.55,.16,mat('#211d1c',.28),0,2.2,-13.25);
 for(let row=0;row<2;row++){box(11.5,.08,.52,wood,0,1.42+row*.82,-12.85);for(let i=0;i<19;i++){const bm=i%3===0?mat('#4d8b70',.22):i%3===1?mat('#b27a3c',.24):glass,b=new THREE.Mesh(new THREE.CylinderGeometry(.07,.085,.3+(i%3)*.04,10),bm);b.position.set(-5.45+i*.605,1.62+row*.82,-12.88);target.add(b)}}
 box(17,.035,11,mat('#68465e',.38),0,.015,-.1);for(let i=0;i<18;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.11,8,6),new THREE.MeshStandardMaterial({color:'#f3d6a0',emissive:i%2?'#d98eac':'#d9a54f',emissiveIntensity:.8}));b.position.set(-8.5+i,3.95,-.1);target.add(b)}
 for(const side of [-1,1])for(let row=0;row<4;row++)venueTable(side*11.8,-6.2+row*4.1,wood,metal,seat);
 for(const side of [-1,1])for(let row=0;row<3;row++){const z=-7+row*7,sofa=new THREE.Mesh(new THREE.CapsuleGeometry(.38,1.65,3,8),seat);sofa.rotation.z=Math.PI/2;sofa.position.set(side*15.1,.48,z);target.add(sofa);box(2.2,.12,1.05,wood,side*12.8,.48,z)}
 for(const x of [-7.4,7.4])buildVenueSpeaker(x,-11.95,'#d7a15a');
 for(const x of [-16,16])for(const z of [-11,11]){const c=new THREE.Mesh(new THREE.CylinderGeometry(.13,.16,h,10),gold);c.position.set(x,h/2,z);target.add(c)}
 const manager=buildCharacter(target,{gender:'female',skin:'#a86f55',hair:'#211916',eyes:'#35251f',shirt:'#7d2437',pants:'#252b35',hairStyle:'comprido'},{x:0,y:0,z:-8.2},()=>{},false);manager.rotation.y=Math.PI;
 // Cabine de DJ visível, com mesa de mistura, dois pratos e indicadores luminosos.
 const djDesk=box(4.8,.22,1.05,mat('#171b24',.35),8.8,1.05,-12.45);
 box(4.9,.12,1.12,mat('#c69b58',.32),8.8,1.22,-12.45);
 for(const x of [7.45,10.15]){
  const deck=box(1.02,.1,.78,mat('#303943',.3),x,1.31,-12.45);
  const platter=new THREE.Mesh(new THREE.CylinderGeometry(.29,.29,.045,28),mat('#11151b',.3));platter.position.set(x,1.39,-12.45);target.add(platter);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(.23,.018,8,28),mat('#d8b45f',.3));ring.rotation.x=Math.PI/2;ring.position.set(x,1.42,-12.45);target.add(ring);
 }
 for(let i=0;i<8;i++){const led=new THREE.Mesh(new THREE.BoxGeometry(.12,.08,.12),new THREE.MeshStandardMaterial({color:'#42d79b',emissive:'#1a9e69',emissiveIntensity:.55}));led.position.set(8.05+i*.22,1.34,-12.03);target.add(led)}
 const dj=buildCharacter(target,{gender:'male',skin:'#8d5c43',hair:'#171412',eyes:'#35251f',shirt:'#202d48',pants:'#171c27',hairStyle:'curto',beardStyle:'goatee'},{x:8.8,y:0,z:-13.05},()=>{},false);
 dj.rotation.y=Math.PI;dj.userData.barRole='dj';barDjAgent=dj;
 // Duas garçonetes com uniforme e rotas de atendimento entre o balcão e as mesas.
 barWaitressAgents=[];
 const waitressLooks=[
  {gender:'female',skin:'#a86f55',hair:'#211916',eyes:'#35251f',shirt:'#7d2437',pants:'#252b35',hairStyle:'comprido'},
  {gender:'female',skin:'#c98962',hair:'#38251d',eyes:'#35251f',shirt:'#7d2437',pants:'#252b35',hairStyle:'medio'}
 ];
 const routes=[
  [{x:-3.7,z:-7.1},{x:-10.5,z:-5.9},{x:-11.8,z:-2.1},{x:-10.5,z:2},{x:-3.7,z:-7.1}],
  [{x:3.7,z:-7.1},{x:10.5,z:-5.9},{x:11.8,z:-2.1},{x:10.5,z:2},{x:3.7,z:-7.1}]
 ];
 waitressLooks.forEach((look,i)=>{
  const group=buildCharacter(target,look,{x:routes[i][0].x,y:0,z:routes[i][0].z},()=>{},false);
  group.rotation.y=Math.PI;group.userData.barRole='waitress';
  // Bandeja e copo para tornar o serviço visível durante a circulação.
  box(.58,.045,.36,mat('#b8bec4',.42),0,1.08,.13,group);
  const cup=new THREE.Mesh(new THREE.CylinderGeometry(.075,.065,.2,12),mat('#d8e7ed',.2));cup.position.set(.08,1.2,.13);group.add(cup);
  const drink=new THREE.Mesh(new THREE.CylinderGeometry(.06,.06,.012,12),mat('#d7a15a',.25));drink.position.set(.08,1.305,.13);group.add(drink);
  barWaitressAgents.push({group,route:routes[i],waypoint:1,state:'patrol',busyUntil:0,serveUntil:0,order:null,side:i});
 });
 const c=document.createElement('canvas');c.width=768;c.height=150;const q=c.getContext('2d');q.fillStyle='#211716';q.fillRect(0,0,768,150);q.strokeStyle='#d7b06a';q.lineWidth=8;q.strokeRect(8,8,752,134);q.fillStyle='#f6d58b';q.font='bold 58px Georgia';q.textAlign='center';q.textBaseline='middle';q.fillText('BAR DAS PUTAS',384,75);const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.6,1.05),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(0,3.25,-13.84);target.add(sign);addVenueCapacitySign('BAR DAS PUTAS',0,13.82,'#211716');
}
function buildPartyHallInterior(){
 const w=36,d=28,h=5.2,floor=mat('#5d4d62',.94),wall=mat('#342b3c',.92),wood=mat('#76543b',.84),metal=mat('#59666b',.72),gold=mat('#c69b58',.42),seat=mat('#705b75',.88);
 box(w,.2,d,floor,0,-.12,0);addLargeVenueWall('north',w,0,3.2,h,wall);addLargeVenueWall('south',w,0,3.2,h,wall);addLargeVenueWall('west',d,null,0,h,wall);addLargeVenueWall('east',d,null,0,h,wall);(doorDefs.party||[]).forEach(addRoomDoor);
 box(15,.48,4.2,wood,0,.22,-10.4);box(14.2,2.1,.18,mat('#24202b'),0,2.35,-13.55);box(12.8,1.35,.08,mat('#6b4d79'),0,2.42,-13.42);
 for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:i%2?'#e3a9cf':'#b9a1e6',emissive:i%2?'#b75c9d':'#8263bd',emissiveIntensity:1}));b.position.set(-5.6+i*1.4,2.42,-13.25);target.add(b)}
 furnCounter(4.5,1,.8,wood,gold,metal,0,-11.4);box(20,.045,13,mat('#765b83',.42),0,.015,-.1);
 for(const x of [-10,10])for(const z of [-6.5,6.5])box(.12,.08,.12,gold,x,.07,z);
 for(const x of [-8.3,8.3]){buildVenueSpeaker(x,-9.4,'#bd8cb8');const beam=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,4.8,8),metal);beam.position.set(x,3.9,-8.7);target.add(beam)}
 for(const x of [-13,13])for(const z of [-5,1,7])venueTable(x,z,wood,metal,seat);furnCounter(7.5,1,.8,wood,gold,metal,-13,11.3);
 for(const side of [-1,1])for(let row=0;row<2;row++){const sofa=new THREE.Mesh(new THREE.CapsuleGeometry(.36,1.45,3,8),seat);sofa.rotation.z=Math.PI/2;sofa.position.set(side*15.6,.46,-1+row*5.2);target.add(sofa)}
 for(let i=0;i<12;i++){const b=new THREE.Mesh(new THREE.SphereGeometry(.13,8,6),new THREE.MeshStandardMaterial({color:'#f3d6a0',emissive:i%2?'#d98eac':'#9b7ad1',emissiveIntensity:.9}));b.position.set(-8.8+i*1.6,4.65,-3.8);target.add(b)}
 addVenueCapacitySign('SALÃO DE FESTAS',0,13.82,'#30263a');
}
function buildHotelInterior(name){
 const suite=name.startsWith('hotel-suite-'),floor=mat(suite?'#b89c7b':'#d5c4a6',.92),wall=mat('#eee5d6',.95),wood=mat('#76563e',.78),gold=mat('#c6a15a',.5),soft=mat('#f5f0e8',.9);
 box(8,.18,8,floor,0,-.12,0);for(const [x,y,z,r] of [[0,1.7,-4,0],[0,1.7,4,0],[-4,1.7,0,Math.PI/2],[4,1.7,0,Math.PI/2]]){const w=new THREE.Mesh(new THREE.PlaneGeometry(8,3.5),wall);w.position.set(x,y,z);w.rotation.y=r;w.material.side=THREE.DoubleSide;target.add(w)}
 if(!suite){
  for(const x of [-3.55,3.55]){const col=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,3.25,20),gold);col.position.set(x,1.62,-.25);target.add(col)}
  for(const side of [-1,1]){const sofa=new THREE.Mesh(new THREE.CapsuleGeometry(.34,.9,4,12),mat('#586a70',.8));sofa.rotation.z=Math.PI/2;sofa.position.set(side*2.72,.42,.9);target.add(sofa);const back=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.9,4,12),mat('#657b80',.8));back.rotation.z=Math.PI/2;back.position.set(side*2.72,.72,.54);target.add(back)}
  const coffee=new THREE.Mesh(new THREE.CylinderGeometry(.48,.52,.12,28),wood);coffee.position.set(0,.42,1.05);target.add(coffee);
  const chain=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.48,8),gold);chain.position.set(0,3.05,.15);target.add(chain);const chandelier=new THREE.Mesh(new THREE.SphereGeometry(.28,18,14),new THREE.MeshStandardMaterial({color:'#f7dfaa',emissive:'#d6a54f',emissiveIntensity:.75}));chandelier.position.set(0,2.75,.15);target.add(chandelier);
  for(const x of [-3.15,3.15]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.22,.16,.42,18),mat('#8b5940',.8));pot.position.set(x,.22,-1.15);target.add(pot);for(let k=0;k<7;k++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),mat(k%2?'#47764c':'#5d8b58',.9));leaf.scale.set(.55,1.5,.55);leaf.position.set(x+Math.cos(k*Math.PI*2/7)*.22,.72+Math.sin(k*1.7)*.12,-1.15+Math.sin(k*Math.PI*2/7)*.22);target.add(leaf)}}

  hdesk(0,-2.45,2.8);hchair(0,-3.25,'#80654b',Math.PI);buildCharacter(target,{gender:'female',skin:'#a86f55',hair:'#241b18',eyes:'#35251f',shirt:'#8a3444',pants:'#30394a',hairStyle:'curto'},{x:0,y:0,z:-1.12},()=>{},false);
  hchair(-2.65,.25,'#9a7655');hchair(-2.65,1.45,'#9a7655');hchair(2.65,.25,'#9a7655');hchair(2.65,1.45,'#9a7655');
  const c=document.createElement('canvas');c.width=768;c.height=140;const q=c.getContext('2d');q.fillStyle='#24465b';q.fillRect(0,0,768,140);q.fillStyle='#f5d88f';q.font='bold 48px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText('HOTEL · 10 SUÍTES DISPONÍVEIS',384,72);const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.3,.95),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(0,2.72,-3.86);target.add(sign);
  for(let i=0;i<10;i++){const side=i<5?-1:1,row=i%5,z=-2.7+row*1.05,x=side*3.78,d=new THREE.Mesh(new THREE.PlaneGeometry(.7,1.85),wood);d.position.set(x-side*.015,1.05,z);d.rotation.y=side<0?Math.PI/2:-Math.PI/2;target.add(d)}
 }else{
  hbed(0,-1.55,Math.PI);hchair(-2.25,1.35,'#87664c',Math.PI/2);hdesk(2.25,1.65,1.25);box(1.55,.12,2.05,mat('#d9e2e4'),2.95,-.035,-2.85);const shower=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.1,12),gold);shower.position.set(3.45,1.08,-2.85);target.add(shower);hdesk(2.85,-.55,1.15);hsph(.42,.25,.32,soft,2.85,1.1,-.55);hchair(2.9,2.15,'#d8e1e2');
  const n=Number(name.split('-').pop())||1,c=document.createElement('canvas');c.width=256;c.height=90;const q=c.getContext('2d');q.fillStyle='#24465b';q.fillRect(0,0,256,90);q.fillStyle='#f5d88f';q.font='bold 48px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText('SUÍTE '+String(n).padStart(2,'0'),128,47);const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.55),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(0,2.55,-3.86);target.add(sign);
 }
}
function addWorkAgent(look,position,route,role){
 const npc=buildCharacter(target,look,position,()=>{},false);
 npc.userData.workRole=role;
 workAgents.push({group:npc,route:route.map(p=>({x:p[0],z:p[1]})),waypoint:1,state:'working',pause:0,phase:Math.random()*Math.PI*2});
 return npc;
}
async function openCarPriceList(){
 await refreshPlayerWallet();
 const catalog=[['Toyota Corolla',12000000,'#a83e36'],['Hyundai Tucson',18500000,'#426d87'],['Toyota Land Cruiser Prado',25000000,'#d0b65b']];
 const rows=catalog.map(v=>'<div class="life-row"><span><b>'+v[0]+'</b><br><small>'+new Intl.NumberFormat('pt-PT').format(v[1])+' Kz</small></span><button class="secondary" data-buy-car="'+v[0]+'" data-car-color="'+v[2]+'">Comprar</button></div>').join('');
 openLifePanel('Loja de carros · Tabela de preços','<p class="life-muted">Escolhe o veículo. O valor será descontado da tua carteira quando a compra for confirmada.</p><p><b>Saldo disponível:</b> <span id="car-shop-balance">'+new Intl.NumberFormat('pt-PT').format(playerWalletBalance)+' Kz</span></p>'+rows);
 $('life-panel').querySelectorAll('[data-buy-car]').forEach(button=>button.onclick=async()=>{
  button.disabled=true;button.textContent='A comprar…';
  const {data,error}=await sb.rpc('buy_player_vehicle',{p_model:button.dataset.buyCar,p_color:button.dataset.carColor});
  if(error){alert(error.message);button.disabled=false;button.textContent='Comprar';return}
  await refreshPlayerWallet();await loadPlayerVehicles();
  alert('Compra concluída! '+data.model+' já pertence à tua conta e está guardado na garagem.');
  openPlayerGaragePanel();
 });
}
function buildVianaCommercialInterior(name){
 const isMarket=name==='market',isQuarry=name==='quarry',isCars=name==='cars',isParty=name==='party',isSalon=name==='salon',isClothes=name==='clothes';
 const floorColor=isMarket?'#c9b98e':isQuarry?'#92999a':isCars?'#aeb8bd':isParty?'#5d4d62':isSalon?'#ead6dc':'#c8d8d5';
 const wallColor=isMarket?'#ead9b9':isQuarry?'#c7c4b8':isCars?'#e7ecee':isParty?'#342b3c':isSalon?'#f5e7eb':'#e8f0ef';
 const floor=mat(floorColor,.94),wall=mat(wallColor,.92),wood=mat('#76543b',.84),metal=mat('#59666b',.72),glass=mat('#83aab4',.3),white=mat('#f4f1e9',.88);
 box(8,.18,8,floor,0,-.12,0);
 const exits=doorDefs[name]||[],openings={north:null,south:null,east:null,west:null};exits.forEach(d=>openings[d.side]=d.center);
 for(const side of ['north','south','east','west']){
  const center=openings[side];
  if(center===null){if(side==='north')box(8,3.6,.18,wall,0,1.65,-4);else if(side==='south')box(8,3.6,.18,wall,0,1.65,4);else if(side==='west')box(.18,3.6,8,wall,-4,1.65,0);else box(.18,3.6,8,wall,4,1.65,0)}
  else addWallWithOpening(side,center);
 }
 exits.forEach(addRoomDoor);
 // Iluminação de teto e rodapé contínuo dão leitura de espaço sem aumentar a carga.
 for(let i=-1;i<=1;i++){box(1.05,.045,.42,white,i*2.45,3.35,-.4);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.12,10,8),new THREE.MeshStandardMaterial({color:'#fff0c5',emissive:'#d9b66c',emissiveIntensity:.45}));lamp.position.set(i*2.45,3.18,-.4);target.add(lamp)}
 if(isMarket){
  // Prateleiras, balcões, caixas de fruta e produtos organizados por secção.
  for(const side of [-1,1])for(let row=0;row<2;row++){const x=side*3.15,z=-2.35+row*2.15;furnMarketRack(x,z,wood,metal);for(let level=0;level<3;level++){for(let k=0;k<4;k++){const colors=['#d84b38','#e4b83f','#57934c','#c77b38'];const fruit=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat(colors[(k+level)%4],.8));fruit.position.set(x-.22+(k%2)*.3,.63+level*.67,z-.42+Math.floor(k/2)*.55);target.add(fruit)}}}
  for(let i=0;i<3;i++){const x=-2.2+i*2.2;box(1.65,.85,.78,wood,x,.48,.75);for(let k=0;k<5;k++){const produce=new THREE.Mesh(new THREE.SphereGeometry(.17,10,8),mat(['#d94d35','#e6bd38','#4d8a43'][i],.85));produce.position.set(x-.55+k*.27,.99,.75);target.add(produce)}}
  furnCounter(2.8,1,.68,mat('#a66d42'),white,metal,0,-3.15);
  for(let i=0;i<6;i++){const bottle=new THREE.Mesh(new THREE.CylinderGeometry(.07,.09,.36,10),mat(i%2?'#4f8a73':'#c08b42'));bottle.position.set(-1.1+i*.44,1.34,-3.15);target.add(bottle)}
  buildCharacter(target,{gender:'female',skin:'#c98962',hair:'#241b18',shirt:'#7d5941',pants:'#35475b',hairStyle:'medio'},{x:0,y:0,z:-2.15},()=>{},false);
 }else if(isQuarry){
  // Balcão administrativo à entrada e armazém de materiais de construção.
  furnCounter(2.65,.95,.72,wood,white,metal,0,-2.75);
  for(const side of [-1,1]){const cabinet=new THREE.Group();box(.82,1.45,.55,mat('#a9a69c'),0,.75,0,cabinet);for(let level=0;level<3;level++){box(.72,.035,.035,metal,0,.38+level*.38,.29,cabinet);box(.12,.055,.04,metal,0,.38+level*.38,.32,cabinet)}cabinet.position.set(side*2.8,0,-2.75);target.add(cabinet);}
  const stacks=[['CIMENTO','#aaa9a1'],['AREIA','#c5ad83'],['BRITA','#77756d'],['BLOCOS','#a88e72'],['TIJOLOS','#b76c50'],['FERRO','#606d73'],['CHAPAS','#829097'],['TELHAS','#9c765a'],['TUBOS','#82979a'],['TINTAS','#8c6ca2'],['MADEIRA','#9b714d'],['FERRAMENTAS','#6b7377']];
  stacks.forEach(([label,color],i)=>{
   const x=-3+(i%4)*2,z=-.55+Math.floor(i/4)*2.35;
   box(1.55,.78,1.05,mat(color),x,.42,z);
   box(1.62,.08,1.12,metal,x,.84,z);
   const cv=document.createElement('canvas');cv.width=256;cv.height=64;const cx=cv.getContext('2d');cx.fillStyle='#26343a';cx.fillRect(0,0,256,64);cx.fillStyle='#fff';cx.font='bold 30px Arial';cx.textAlign='center';cx.textBaseline='middle';cx.fillText(label,128,34);
   const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.18,.28),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(cv),side:THREE.DoubleSide}));plaque.position.set(x,.47,z+.535);target.add(plaque);
  });
  for(let i=0;i<4;i++){const pipe=new THREE.Mesh(new THREE.CylinderGeometry(.11,.11,1.65,10),mat('#8e9ca0'));pipe.rotation.z=Math.PI/2;pipe.position.set(-2.6+i*.38,1.62,3.35);target.add(pipe)}
  addWorkAgent({gender:'male',skin:'#985b42',hair:'#171412',shirt:'#b5a15e',pants:'#35404b',hairStyle:'curto'},{x:0,y:0,z:-1.8},[[0,-1.8],[-1.7,-1.8],[-1.7,-.9],[0,-.9],[0,-1.8]],'Gerente da pedreira');
  addWorkAgent({gender:'male',skin:'#754a38',hair:'#171412',shirt:'#d0a64f',pants:'#454b4c',hairStyle:'curto'},{x:-2.4,y:0,z:.8},[[-2.4,.8],[-2.4,1.7],[-1.2,1.7],[-1.2,.8]],'Responsável pelo armazém');
  addWorkAgent({gender:'male',skin:'#a66e50',hair:'#211916',shirt:'#d17b32',pants:'#39464b',hairStyle:'curto'},{x:2.2,y:0,z:1.1},[[2.2,1.1],[2.2,2.1],[.9,2.1],[.9,1.1]],'Trabalhador da pedreira');
 }else if(isCars){
  // Exposição interior de viaturas, recepção comercial e acesso à oficina.
  furnCounter(2.6,.92,.72,wood,white,metal,0,-3.05);
  const colors=['#a83e36','#426d87','#d0b65b'];
  colors.forEach((color,i)=>{const car=createDetailedCar(color,false);car.scale.setScalar(.72);car.position.set(-2.45+i*2.45,0,.45);car.rotation.y=i===1?Math.PI:0;target.add(car)});
  box(2.6,.12,.22,metal,0,.08,2.95);box(2.6,2.2,.12,glass,0,1.2,3.82);
  for(let i=0;i<3;i++){const tyre=new THREE.Mesh(new THREE.TorusGeometry(.32,.09,8,20),mat('#25282b'));tyre.position.set(-2.5+i*2.5,.38,-2.15);target.add(tyre)}
  // Gabinete de vendas com secretária, cadeira, computador e arquivo.
  hdesk(3.0,2.55,Math.PI);
  hchair(3.0,1.25,'#344c5d',Math.PI);
  box(.72,.5,.07,glass,3.0,1.55,2.45);
  box(.88,.06,.48,metal,3.0,1.22,2.5);
  box(.72,1.65,.62,mat('#52636a',.86),-3.35,.83,2.55);
  for(let level=0;level<3;level++)box(.58,.035,.04,metal,-3.35,.45+level*.42,2.88);
  // Zona de assistência rápida: bancada e ferramentas junto à parede lateral.
  furnCounter(1.8,.9,.55,metal,white,wood,-3.05,-.15);
  for(let k=0;k<4;k++){const tool=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.48,8),metal);tool.position.set(-3.55+k*.34,1.25,-.12);target.add(tool)}
  addWorkAgent({gender:'male',skin:'#b98768',hair:'#211916',shirt:'#314d67',pants:'#252f3b',hairStyle:'curto'},{x:0,y:0,z:-2.25},[[0,-2.25],[.65,-2.25],[.65,-1.65],[0,-1.65]],'Vendedor de automóveis');
  addWorkAgent({gender:'female',skin:'#c98962',hair:'#241b18',shirt:'#7d4054',pants:'#303c4a',hairStyle:'medio'},{x:2.7,y:0,z:2.2},[[2.7,2.2],[2.7,2.85],[2.15,2.85],[2.15,2.2]],'Consultora de vendas');
 }else if(isParty){
  // Palco, pista central, mesas, cadeiras e colunas de som.
  box(4.4,.32,1.35,wood,0,.18,-3.1);box(3.8,.08,.08,mat('#d8b65d'),0,.39,-3.1);
  box(4.5,.035,3.1,mat('#9b6d91',.45),0,.015,.25);
  for(const x of [-3.25,3.25]){box(.72,1.55,.55,mat('#24272b'),x,.82,-2.9);for(let k=0;k<3;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.16,.035,6,14),mat('#bd8cb8'));ring.position.set(x,.42+k*.4,-2.58);target.add(ring)}}
  for(const x of [-2.55,2.55])for(const z of [.7,2.65]){const t=new THREE.Mesh(new THREE.CylinderGeometry(.65,.68,.12,24),wood);t.position.set(x,.83,z);target.add(t);for(let k=0;k<3;k++)hchair(x+Math.cos(k*2.1)*.85,z+Math.sin(k*2.1)*.85,'#705b75',k*2.1)}
  for(const x of [-1.2,0,1.2]){const bulb=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),new THREE.MeshStandardMaterial({color:'#f3d6a0',emissive:'#d98eac',emissiveIntensity:.7}));bulb.position.set(x,3.05,-.8);target.add(bulb)}
 }else if(isSalon){
  // Espelhos altos, cadeiras profissionais, lavatórios e bancada de produtos.
  for(const x of [-2.55,0,2.55]){box(1.18,1.75,.09,glass,x,2.05,-3.75);box(1.28,.09,.12,metal,x,2.96,-3.72);furnSalonChair(x,-2.45,mat('#292e32'),metal)}
  furnCounter(5.8,.95,.62,wood,white,metal,0,2.75);
  for(let i=0;i<3;i++){const basin=new THREE.Mesh(new THREE.SphereGeometry(.36,16,12),mat('#f3f5f3'));basin.scale.set(1,.35,.8);basin.position.set(-2+i*2,.98,2.6);target.add(basin);hcyl(.035,.42,metal,-2+i*2,.73,2.6)}
  for(let i=0;i<8;i++){const jar=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,.3,10),mat(['#c27c9c','#d5b85d','#7d9caa'][i%3]));jar.position.set(-2.5+(i%4)*1.65,1.25,2.72+Math.floor(i/4)*.18);target.add(jar)}
  buildCharacter(target,{gender:'female',skin:'#b98768',hair:'#241b18',shirt:'#9d596f',pants:'#343b48',hairStyle:'comprido'},{x:0,y:0,z:.15},()=>{},false);
 }else if(isClothes){
  // Araras de roupa, manequins e provadores separados.
  for(const x of [-2.7,0,2.7]){box(.12,1.95,.12,metal,x,1.02,-2.6);box(1.95,.08,.12,metal,x,2.05,-2.6);for(let k=0;k<4;k++){const hanger=new THREE.Mesh(new THREE.ConeGeometry(.12,.25,3),mat(['#a84f4c','#466e83','#7b6a9a','#c29a4d'][k]));hanger.position.set(x-.65+k*.43,1.75,-2.6);target.add(hanger)}}
  for(const x of [-2.5,0,2.5]){const mannequin=new THREE.Group();hsph(.19,.2,.18,mat('#d5b99d'),0,1.78,0,mannequin);box(.48,.82,.3,mat(['#9a554e','#54758c','#7e638f'][Math.abs(Math.round(x))%3]),0,1.18,0,mannequin);box(.28,.72,.25,mat('#343b48'),0,.42,0,mannequin);mannequin.position.set(x,0,.15);target.add(mannequin)}
  furnCounter(2.2,.9,.65,wood,white,metal,0,3.05);
  box(1.25,2.2,.12,mat('#b9a28c'),-3.15,1.1,1.05);box(1.25,2.2,.12,mat('#b9a28c'),3.15,1.1,1.05);
 }
}
function buildBarPrivateRoom(which){
 const wall=mat('#493536',.9),floor=mat('#4b3738',.85),wood=mat('#80513f',.78),gold=mat('#c69a5b',.55);
 box(8,.18,8,floor,0,-.12,0);
 for(const [x,z,r] of [[0,-4,0],[0,4,0],[-4,0,Math.PI/2],[4,0,Math.PI/2]]){const p=new THREE.Mesh(new THREE.PlaneGeometry(8,3.5),wall);p.position.set(x,1.7,z);p.rotation.y=r;p.material.side=THREE.DoubleSide;target.add(p)}
 // Cama estofada com colchão, almofadas e estrutura completa.
 furnPrivateBed(0,-.55,wood,mat('#d7c7b8'),gold);
 for(const x of [-1.25,1.25]){box(.12,.7,.12,gold,x,.55,-2.05);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,12,10),new THREE.MeshStandardMaterial({color:'#ffdca3',emissive:'#d89b57',emissiveIntensity:.8}));lamp.position.set(x,1.1,-2.05);target.add(lamp)}
 furnCounter(2.2,.82,.55,wood,gold,wood,0,2.55);
 buildCharacter(target,{gender:'female',skin:'#c98962',hair:'#241b18',shirt:'#8d4053',pants:'#34313b',hairStyle:'comprido'},{x:0,y:0,z:1.15},()=>{},false);
 (doorDefs[which]||[]).forEach(addRoomDoor);
}
function buildExpandedInterior(builder,scale=2.3){
 const parent=target,expanded=new THREE.Group();
 target=expanded;
 try{builder()}finally{target=parent}
 // Os edifícios crescem na horizontal, mas as personagens mantêm proporções humanas.
 expanded.traverse(object=>{if(object.userData.keepWorldScale){object.scale.x=1/scale;object.scale.z=1/scale}});
 expanded.scale.set(scale,1,scale);
 parent.add(expanded);
}
function buildPoliceSectorLayout(){
 const wall=mat('#d7dfe5',.94),blue=mat('#173f70',.86),trim=mat('#e8edf0',.9);
 const addDoorFrame=(x,z,rot,label)=>{
  const g=new THREE.Group();
  box(.12,2.35,.14,trim,-.88,1.17,0,g);box(.12,2.35,.14,trim,.88,1.17,0,g);
  box(1.88,.13,.14,trim,0,2.35,0,g);
  const leaf=box(.09,2.12,.08,blue,.78,1.06,.05,g);leaf.rotation.y=-.08;
  const plaqueCanvas=document.createElement('canvas');plaqueCanvas.width=320;plaqueCanvas.height=72;
  const ctx=plaqueCanvas.getContext('2d');ctx.fillStyle='#123d70';ctx.fillRect(0,0,320,72);
  ctx.fillStyle='#fff';ctx.font='bold 27px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,160,38);
  const plaque=new THREE.Mesh(new THREE.PlaneGeometry(1.65,.37),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(plaqueCanvas),side:THREE.DoubleSide}));
  plaque.position.set(0,2.58,.02);g.add(plaque);g.position.set(x,0,z);g.rotation.y=rot;target.add(g);
 };
 // Corredor interno com três acessos independentes aos setores.
 const wallZ=2.25,half=8.4,doorXs=[-5.5,0,5.5],gap=2.0;
 let cursor=-half;
 for(const x of doorXs){const end=x-gap/2;if(end>cursor)box(end-cursor,3.05,.18,wall,(cursor+end)/2,1.5,wallZ);cursor=x+gap/2}
 if(cursor<half)box(half-cursor,3.05,.18,wall,(cursor+half)/2,1.5,wallZ);
 addDoorFrame(-5.5,wallZ,0,'ADMINISTRAÇÃO');
 addDoorFrame(0,wallZ,0,'INTERROGATÓRIO');
 addDoorFrame(5.5,wallZ,0,'DETENÇÃO');
 // Paredes laterais curtas separam os três setores sem bloquear o corredor.
 for(const x of [-8.1,-2.9,2.9,8.1])box(.16,3.05,6.1,wall,x,1.5,-4.9);
}
function buildRoom(name){
 workAgents.length=0;target.clear();target.userData.characters=[];sceneSeatAnchors.length=0;roomDoorMeshes=[];speakerMeshes.length=0;venueSpeakerIndicators.length=0;activeRoomDoor=null;scene.background=new THREE.Color(name==='garagem'?'#aebbc7':'#c6d0d7');
 if(name==='bar'){buildBarInterior();return}
 if(name==='bar-private-1'||name==='bar-private-2'){buildBarPrivateRoom(name);(doorDefs[name]||[]).forEach(addRoomDoor);return}
 if(name==='party'){buildPartyHallInterior();return}
 if(['market','quarry','cars','salon','clothes'].includes(name)){if(['market','quarry','cars'].includes(name))buildExpandedInterior(()=>buildVianaCommercialInterior(name),2.3);else buildVianaCommercialInterior(name);return}
 if(name==='hotel'||name.startsWith('hotel-suite-')){buildHotelInterior(name);(doorDefs[name]||[]).forEach(addRoomDoor);return}
 if(name==='esquadra'){buildExpandedInterior(()=>buildPoliceStationInterior(),2.3);buildPoliceSectorLayout();(doorDefs.esquadra||[]).forEach(addRoomDoor);return}
 if(name==='hospital'||name==='hospital-tratamento'||name==='hospital-consultorio'){buildHospitalInterior(name);(doorDefs[name]||[]).forEach(addRoomDoor);return}
 const floorColor=name==='banheiro'?'#b7c7c8':name==='cozinha'?'#c5b99e':name==='garagem'?'#858d96':'#b99570';
 box(8,.18,8,mat(floorColor),0,-.12,0);
 const stoneWall=makeStoneWallMaterial();const exits=doorDefs[name]||[];
 const openings={north:null,south:null,east:null,west:null};exits.forEach(d=>openings[d.side]=d.center);
 for(const side of ['north','south','east','west']){if(openings[side]===null){if(side==='north')box(8,3.6,.18,stoneWall,0,1.65,-4);else if(side==='south')box(8,3.6,.18,stoneWall,0,1.65,4);else if(side==='west')box(.18,3.6,8,stoneWall,-4,1.65,0);else box(.18,3.6,8,stoneWall,4,1.65,0)}else addWallWithOpening(side,openings[side])}
 /* Sem tecto: a câmara mantém sempre a vista aberta sobre o interior. */
 exits.forEach(addRoomDoor);
 // Divisões vazias: sem mobília. As aberturas ficam alinhadas com as portas.
 if(name==='garagem'){box(2.1,1.35,.12,mat('#d8e2e8'),0,1.5,-3.88);const stored=playerVehicles.filter(v=>v.owner_id===user?.id&&v.is_stored);stored.slice(0,4).forEach((v,i)=>{const car=createDetailedCar(v.color,false);car.scale.setScalar(.48);car.position.set((i%2===0?-1.85:1.85),0,i<2?-.65:1.45);car.rotation.y=Math.PI;car.userData.garageVehicleId=v.id;target.add(car)})}
}




function hcap(r,l,m,x,y,z,p=target,rz=0){const o=new THREE.Mesh(new THREE.CapsuleGeometry(r,l,5,16),m);o.position.set(x,y,z);o.rotation.z=rz;o.castShadow=true;p.add(o);return o}
function hcyl(r,h,m,x,y,z,p=target){const o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,24),m);o.position.set(x,y,z);p.add(o);return o}
function hsph(a,b,c,m,x,y,z,p=target){const o=new THREE.Mesh(new THREE.SphereGeometry(1,24,18),m);o.scale.set(a,b,c);o.position.set(x,y,z);p.add(o);return o}
function hwall(w,h,m,x,y,z,rot=0){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m);o.position.set(x,y,z);o.rotation.y=rot;o.material.side=THREE.DoubleSide;target.add(o)}
function hospitalShell(n){const f=new THREE.Mesh(new THREE.PlaneGeometry(8,8),mat('#e8edf0'));f.rotation.x=-Math.PI/2;f.position.y=-.025;target.add(f);const w=mat('#f4f6f5'),ex=doorDefs[n]||[],op={north:null,south:null,east:null,west:null};ex.forEach(d=>op[d.side]=d.center);for(const side of ['north','south','east','west']){const c=op[side],hor=side==='north'||side==='south',z=side==='north'?-4:4,x=side==='west'?-4:4,rot=hor?0:Math.PI/2,wx=hor?0:x,wz=hor?z:0;if(c===null){hwall(8,3.6,w,wx,1.8,wz,rot);continue}const gap=1.55,l=c-gap/2,r=c+gap/2,a=Math.max(0,l+4),b=Math.max(0,4-r);if(a>.03)hwall(a,3.6,w,hor?(-4+l)/2:wx,1.8,hor?wz:(-4+l)/2,rot);if(b>.03)hwall(b,3.6,w,hor?(r+4)/2:wx,1.8,hor?wz:(r+4)/2,rot);hwall(gap,1.15,w,wx,3.025,wz,rot)}}
function hchair(x,z,color='#4b86a8',rot=0){const g=new THREE.Group(),f=mat(color),m=mat('#aeb9bf');hcap(.32,.12,f,0,.55,0,g,Math.PI/2).scale.set(1,.82,.72);hcap(.31,.42,f,0,.91,-.23,g).scale.set(.9,1,.5);hcyl(.045,.43,m,0,.25,0,g);for(let i=0;i<4;i++){const a=i*Math.PI/2,l=hcyl(.03,.38,m,Math.cos(a)*.2,.18,Math.sin(a)*.2,g);l.rotation.z=Math.cos(a)*-.32;l.rotation.x=Math.sin(a)*.32}g.position.set(x,0,z);g.rotation.y=rot;target.add(g);sceneSeatAnchors.push({x:x+Math.sin(rot)*.14,z:z+Math.cos(rot)*.14,y:.55,rotation:rot})}
function hbed(x,z,rot=0){const g=new THREE.Group(),w=mat('#f5f7f7'),b=mat('#8fb5c9'),m=mat('#9aa8b0'),rub=mat('#333b40');hcap(.34,1.25,w,0,.78,0,g,Math.PI/2).scale.set(1,.62,.78);hcap(.29,1.2,b,0,1,0,g,Math.PI/2).scale.set(1,.58,.76);hcap(.3,.16,w,-.82,1.02,0,g,Math.PI/2);for(const side of [-1,1]){const rail=hcyl(.035,1.55,m,0,1.23,side*.34,g);rail.rotation.z=Math.PI/2;for(const e of [-.66,.66])hcyl(.025,.42,m,e,.94,side*.34,g)}for(const px of [-.7,.7])for(const pz of [-.25,.25]){hcyl(.035,.62,m,px,.4,pz,g);hsph(.095,.07,.095,rub,px,.13,pz,g)}g.position.set(x,0,z);g.rotation.y=rot;target.add(g)}
function hdesk(x,z,w=2.4){const g=new THREE.Group(),wood=mat('#d9c8ad'),white=mat('#f6f7f5'),m=mat('#aab5bc');hcap(.34,w,wood,0,1.02,0,g,Math.PI/2).scale.set(1,.62,.72);hcap(.24,w*.92,white,0,1.24,0,g,Math.PI/2).scale.set(1,.28,.75);for(const px of [-w*.34,w*.34])hcyl(.05,.86,m,px,.52,0,g);hsph(.46,.29,.075,mat('#263b48'),0,1.65,-.12,g);const sc=new THREE.Mesh(new THREE.PlaneGeometry(.72,.4),mat('#79b8cf'));sc.position.set(0,1.66,-.047);g.add(sc);hcyl(.045,.2,m,0,1.43,-.12,g);hcap(.11,.48,m,0,1.29,.28,g,Math.PI/2);g.position.set(x,0,z);target.add(g)}

function furnCounter(w,h,d,body,top,metal,x,z){
 const g=new THREE.Group();box(w,h,d,body,0,h/2,0,g);box(w+.12,.11,d+.12,top,0,h+.045,0,g);
 box(w*.88,.045,.035,metal,0,h*.68,d/2+.018,g);
 for(const px of [-w*.38,w*.38]){hcyl(.045,.13,metal,px,.07,0,g);box(.035,h*.55,.035,metal,px,h*.34,d/2+.025,g)}
 g.position.set(x,0,z);target.add(g);return g;
}
function furnSalonChair(x,z,seatMat,metal){
 const g=new THREE.Group();hcyl(.045,.62,metal,0,.36,0,g);hcyl(.29,.09,metal,0,.08,0,g);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const leg=hcyl(.025,.44,metal,Math.cos(a)*.2,.06,Math.sin(a)*.2,g);leg.rotation.z=Math.cos(a)*-.55;leg.rotation.x=Math.sin(a)*.55}
 hcap(.27,.1,seatMat,0,.75,0,g,Math.PI/2).scale.set(1,.8,.8);hcap(.19,.26,seatMat,0,1.03,-.18,g);
 for(const px of [-.3,.3])hcyl(.025,.42,metal,px,.78,-.05,g);
 g.position.set(x,0,z);target.add(g);return g;
}
function furnPrivateBed(x,z,wood,linen,metal){
 const g=new THREE.Group();box(2.5,.38,3.1,wood,0,.32,0,g);box(2.42,.16,2.98,linen,0,.58,0,g);
 hcap(.12,1.05,mat('#f0e7dd'),0,.72,-.86,g,Math.PI/2).scale.set(1,.8,.65);hcap(.1,1.1,mat('#f0e7dd'),0,.72,.72,g,Math.PI/2).scale.set(1,.8,.65);
 box(2.58,.12,.16,wood,0,.88,-1.48,g);for(const px of [-1.12,1.12])for(const pz of [-1.35,1.35])hcyl(.045,.32,metal,px,.16,pz,g);
 g.position.set(x,0,z);target.add(g);return g;
}
function furnMarketRack(x,z,wood,metal){
 const g=new THREE.Group();
 for(const px of [-.29,.29])for(const pz of [-.69,.69]){
  box(.07,2.12,.07,metal,px,1.08,pz,g);
  box(.1,.08,.1,wood,px,.08,pz,g);
 }
 for(let level=0;level<3;level++){
  const y=.48+level*.67;
  box(.72,.075,1.62,wood,0,y,0,g);
  box(.74,.045,.055,metal,0,y+.055,.79,g);
  box(.055,.12,1.62,metal,-.34,y+.06,0,g);
  box(.055,.12,1.62,metal,.34,y+.06,0,g);
 }
 box(.64,1.95,.045,wood,0,1.08,-.72,g);
 g.position.set(x,0,z);target.add(g);return g;
}

function buildHospitalInterior(n){hospitalShell(n);const blue=mat('#3f7896'),steel=mat('#aab6bc'),pale=mat('#dce8ed');if(n==='hospital'){hdesk(0,-1.1,2.55);hchair(-.75,-2,'#537f98');hchair(.75,-2,'#537f98');hchair(-2.45,1.55);hchair(-1.25,1.55);hchair(0,1.55);hsph(1.05,.32,.07,blue,0,2.72,-3.82);const c=document.createElement('canvas');c.width=512;c.height=128;const q=c.getContext('2d');q.fillStyle='#285c78';q.fillRect(0,0,512,128);q.fillStyle='#fff';q.font='bold 48px Arial';q.textAlign='center';q.textBaseline='middle';q.fillText('RECEPÇÃO',256,66);const sign=new THREE.Mesh(new THREE.PlaneGeometry(2.7,.66),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(c),side:THREE.DoubleSide}));sign.position.set(0,2.72,-3.76);target.add(sign);const look={gender:'female',skin:'#a86f55',hair:'#241b18',eyes:'#33231f',shirt:'#e8f0f1',pants:'#38566a',hairStyle:'curto'};const p=buildCharacter(target,look,{x:0,y:0,z:-1.65},()=>{},false);p.scale.setScalar(.9);p.rotation.y=Math.PI;
 addWorkAgent({gender:'female',skin:'#9b684f',hair:'#211916',shirt:'#e8f0f1',pants:'#38566a',hairStyle:'curto'},{x:-2.1,y:0,z:1.5},[[-2.1,1.5],[-1.2,1.5],[-1.2,.65],[-2.1,.65]],'Enfermeira da recepção');}
if(n==='hospital-tratamento'){addWorkAgent({gender:'female',skin:'#a86f55',hair:'#241b18',shirt:'#e7eeee',pants:'#3e6477',hairStyle:'curto'},{x:-2.8,y:0,z:-2.7},[[-2.8,-2.7],[-1.9,-2.7],[-1.9,-.5],[-2.8,-.5]],'Enfermeira de tratamento');addWorkAgent({gender:'male',skin:'#8d604b',hair:'#25201d',shirt:'#f1f3f0',pants:'#39576a',hairStyle:'curto'},{x:2.6,y:0,z:-2.5},[[2.6,-2.5],[1.8,-2.5],[1.8,1.2],[2.6,1.2]],'Médico de serviço');hbed(-1.9,-1.55);hbed(1.65,-1.55);hbed(-1.9,1.35);hcap(.25,.62,mat('#f7f8f6'),0,.82,2.65);for(const x of [-.18,.18])hcyl(.025,1.5,steel,x,1.55,2.65);hcyl(.04,.5,steel,0,2.3,2.65);hcap(.08,.5,mat('#6d9a76'),2.85,.55,1.65);hcyl(.025,2,steel,2.85,1.35,1.65);const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.2,2.5,-.2),new THREE.Vector3(.7,2.5,-.2),new THREE.Vector3(1.6,2.5,-.2),new THREE.Vector3(2.2,2.5,.1)]);target.add(new THREE.Mesh(new THREE.TubeGeometry(curve,24,.035,8,false),steel));for(let i=0;i<5;i++)hsph(.22,.9,.025,pale,.15+i*.38,1.5,-.2)}
if(n==='hospital-consultorio'){addWorkAgent({gender:'male',skin:'#8d604b',hair:'#25201d',shirt:'#f1f3f0',pants:'#39576a',hairStyle:'curto'},{x:-2.7,y:0,z:-2.5},[[-2.7,-2.5],[-1.8,-2.5],[-1.8,-.8],[-2.7,-.8]],'Médico do consultório');hdesk(0,-1.6,2.2);hchair(-.1,-.55,'#426f88',Math.PI);hchair(1.55,.05);hchair(-1.55,.05);hbed(0,2,Math.PI/2);hsph(.62,.42,.08,blue,0,2.65,-3.82);const board=new THREE.Mesh(new THREE.PlaneGeometry(1.35,.72),mat('#d8e9e9'));board.position.set(0,2.65,-3.74);target.add(board);const look={gender:'male',skin:'#8d604b',hair:'#25201d',eyes:'#34241f',shirt:'#f1f3f0',pants:'#39576a',hairStyle:'curto'};const p=buildCharacter(target,look,{x:0,y:0,z:-2.15},()=>{},false);p.scale.setScalar(.92);p.rotation.y=Math.PI}}
function buildHospitalExterior(x,z,front,o){
 // Hospital Municipal de Viana: edifício amplo, moderno, com dois pisos e fachada curva.
 const w=15.5,d=9.5,h=6.35,face=z+front*(d/2+.04);
 const wall=mat('#edf3f4',.72),white=mat('#ffffff',.48),glass=mat('#5d8290',.2),blue=mat('#1b5876',.48),red=mat('#bd343b',.48),metal=mat('#aebdc4',.38),stone=mat('#cbd3d4',.95),green=mat('#477c4e',.95);
 const rounded=(width,depth,r)=>{
  const sh=new THREE.Shape(),a=width/2,b=depth/2;
  sh.moveTo(-a+r,-b);sh.lineTo(a-r,-b);sh.quadraticCurveTo(a,-b,a,-b+r);
  sh.lineTo(a,b-r);sh.quadraticCurveTo(a,b,a-r,b);sh.lineTo(-a+r,b);
  sh.quadraticCurveTo(-a,b,-a,b-r);sh.lineTo(-a,-b+r);sh.quadraticCurveTo(-a,-b,-a+r,-b);
  return sh;
 };
 // Corpo principal com cantos arredondados e volume de dois pisos.
 const bodyGeo=new THREE.ExtrudeGeometry(rounded(w,d,1.15),{depth:h,steps:1,bevelEnabled:true,bevelSegments:5,bevelSize:.16,bevelThickness:.16,curveSegments:16});
 bodyGeo.rotateX(Math.PI/2);const body=new THREE.Mesh(bodyGeo,wall);body.position.set(x,h,z);body.castShadow=true;body.receiveShadow=true;target.add(body);
 // Rodapé em pedra clara e cobertura elíptica de acabamento.
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64),stone);plinth.scale.set(w*.52,.18,d*.52);plinth.position.set(x,.02,z);target.add(plinth);
 const roof=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64),white);roof.scale.set(w*.535,.2,d*.535);roof.position.set(x,h+.02,z);target.add(roof);
 const roofBand=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64),blue);roofBand.scale.set(w*.49,.09,d*.49);roofBand.position.set(x,h-.16,z);target.add(roofBand);
 // Janelas panorâmicas em duas linhas, com caixilharia metálica fina.
 const windowFrame=mat('#d5e0e3',.45);
 for(const rowY of [2.05,4.35]){
  for(let col=-3;col<=3;col++){
   const wx=x+col*1.92,wy=rowY+(Math.abs(col)%2)*.04;
   const pane=new THREE.Mesh(new THREE.PlaneGeometry(1.55,1.28),glass);pane.position.set(wx,wy,face+front*.035);pane.material.side=THREE.DoubleSide;target.add(pane);
   for(const dx of [-.81,.81]){const bar=hcyl(.035,1.38,windowFrame,wx+dx,wy,face+front*.075);bar.rotation.z=Math.PI/2}
   for(const dy of [-.69,.69]){const bar=hcyl(.035,1.68,windowFrame,wx,wy+dy,face+front*.075);bar.rotation.z=0}
   const mullion=hcyl(.025,1.25,metal,wx,wy,face+front*.085);mullion.rotation.z=0;
  }
 }
 // Entrada principal en vidro, com duas folhas, puxadores e pórtico arredondado.
 const entryGlass=new THREE.Mesh(new THREE.PlaneGeometry(2.85,2.55),glass);entryGlass.position.set(x,1.48,face+front*.12);entryGlass.material.side=THREE.DoubleSide;target.add(entryGlass);
 for(const dx of [-.72,.72]){const doorLine=hcyl(.035,2.55,white,x+dx,1.48,face+front*.17);doorLine.rotation.z=0;const handle=hcyl(.025,.42,metal,x+dx*.72,1.35,face+front*.2);handle.rotation.z=0}
 for(const dx of [-1.58,1.58])hcyl(.12,2.9,white,x+dx,1.48,face+front*.2);
 const lintel=hcap(.22,3.25,blue,x,2.98,face+front*.3);lintel.rotation.z=Math.PI/2;lintel.scale.set(1,1,.72);
 const canopy=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,48),white);canopy.scale.set(2.35,.16,1.15);canopy.position.set(x,3.05,face+front*.82);target.add(canopy);
 const canopyEdge=hcap(.075,4.3,red,x,2.98,face+front*1.34);canopyEdge.rotation.z=Math.PI/2;
 // Colunas cilíndricas sustentam a entrada, sem blocos geométricos.
 for(const dx of [-1.95,1.95])hcyl(.105,2.95,white,x+dx,1.5,face+front*.86);
 // Cruz médica grande e letreiro institucional iluminado.
 const crossX=x+w*.36,crossZ=face+front*.12;
 hcap(.16,.9,red,crossX,5.48,crossZ).rotation.z=0;
 const crossBar=hcap(.16,.9,red,crossX,5.48,crossZ);crossBar.rotation.z=Math.PI/2;
 const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=180;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#164d6b';ctx.fillRect(0,0,1024,180);
 const grad=ctx.createLinearGradient(0,0,1024,180);grad.addColorStop(0,'#174d6b');grad.addColorStop(1,'#287d91');ctx.fillStyle=grad;ctx.fillRect(0,0,1024,180);
 ctx.strokeStyle='#ffffff';ctx.lineWidth=8;ctx.strokeRect(7,7,1010,166);
 ctx.fillStyle='#fff';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('HOSPITAL MUNICIPAL DE CABINDA',512,88);
 const signTex=new THREE.CanvasTexture(canvas);signTex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(7.1,1.25),new THREE.MeshBasicMaterial({map:signTex,side:THREE.DoubleSide}));sign.position.set(x,5.55,face+front*.16);target.add(sign);
 const sub=document.createElement('canvas');sub.width=512;sub.height=96;const sc=sub.getContext('2d');sc.fillStyle='#bd343b';sc.fillRect(0,0,512,96);sc.fillStyle='#fff';sc.font='bold 48px Arial';sc.textAlign='center';sc.textBaseline='middle';sc.fillText('URGÊNCIA 24 HORAS',256,49);
 const subSign=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.68),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(sub),side:THREE.DoubleSide}));subSign.position.set(x,3.65,face+front*.14);target.add(subSign);
 // Passeio frontal amplo e caminho de acesso à porta.
 const forecourt=new THREE.Mesh(new THREE.PlaneGeometry(17,7),stone);forecourt.rotation.x=-Math.PI/2;forecourt.position.set(x,-.055,face+front*3.45);target.add(forecourt);
 const path=new THREE.Mesh(new THREE.PlaneGeometry(4.4,4.4),mat('#e1e6e5',.95));path.rotation.x=-Math.PI/2;path.position.set(x,-.045,face+front*1.85);target.add(path);
 // Jardins simétricos, bancos de espera e iluminação exterior.
 for(const side of [-1,1]){
  const gx=x+side*6.15,gz=face+front*3.05;
  hsph(1.55,.13,.78,green,gx,.08,gz);
  for(let k=0;k<4;k++){hsph(.42,.48,.42,mat(k%2?'#5b985d':'#6da66a',.95),gx+side*((k%2)*.5-.25),.48,gz+front*((k-1.5)*.34))}
  hchair(gx,gz+front*.9,'#416f89',front===1?Math.PI:0);
  const lamp=hcyl(.045,3.25,metal,gx+side*.65,1.58,face+front*4.5);
  hsph(.2,.12,.2,mat('#f4e8b7',.35),gx+side*.65,3.25,face+front*4.5);
 }
 for(let i=-1;i<=1;i++)hchair(x+i*1.35,face+front*4.5,'#416f89',front===1?Math.PI:0);
 // Área de emergência lateral com ambulância identificada.
 const ambulance=createDetailedCar('#f3f5f4',false);ambulance.scale.setScalar(1.08);ambulance.position.set(x+8.2,0,face+front*2.15);ambulance.rotation.y=front===1?Math.PI/2:-Math.PI/2;target.add(ambulance);
 const ambCross=new THREE.Mesh(new THREE.PlaneGeometry(.38,.38),new THREE.MeshBasicMaterial({color:'#c8323b',side:THREE.DoubleSide}));
 ambCross.position.set(x+8.2,1.05,face+front*2.15+.72);target.add(ambCross);
 const beacon=hsph(.28,.1,.12,red,x+8.2,1.55,face+front*2.15);
 // Colisões nas quatro faces, deixando a entrada central livre.
 const opening=2.2,segment=(w-opening)/2,offset=(w+opening)/4;
 addCityCollision(x-w/2,z,.32,d,.18);addCityCollision(x+w/2,z,.32,d,.18);addCityCollision(x,z-front*d/2,w,.32,.18);
 addCityCollision(x-offset,face,segment,.32,.14);addCityCollision(x+offset,face,segment,.32,.14);
 addCityCollision(x+8.2,face+front*2.15,2.4,4.4,.2);
 const trigger=new THREE.Mesh(new THREE.PlaneGeometry(2.6,2.6),new THREE.MeshBasicMaterial({transparent:true,opacity:.01,side:THREE.DoubleSide,depthWrite:false}));
 trigger.position.set(x,1.25,face+front*.24);trigger.userData.hospitalEntry=true;target.add(trigger);policeEntryMeshes.push(trigger);
}

function buildPremiumVenueExterior(name,x,z,front,opts){
 const w=opts.w||10,d=opts.d||8,h=opts.h||4,face=z+front*(d/2+.08),hotel=opts.kind==='hotel',party=opts.kind==='party',wall=mat(hotel?'#d8c8ad':party?'#4d405e':'#8b5b43',.82),trim=mat(hotel?'#f1e6d2':party?'#d7c6eb':'#d7b38a',.58),glass=new THREE.MeshPhysicalMaterial({color:'#9eb9c0',roughness:.18,metalness:.18,transparent:true,opacity:.82,side:THREE.DoubleSide}),gold=mat('#d2ad68',.35);
 const apron=new THREE.Mesh(new THREE.PlaneGeometry(w+4,d+4),mat('#9c9789',.96));apron.rotation.x=-Math.PI/2;apron.position.set(x,-.06,z);target.add(apron);
 const s=new THREE.Shape(),r=.42,L=-w/2,R=w/2,B=-d/2,F=d/2;s.moveTo(L+r,B);s.lineTo(R-r,B);s.quadraticCurveTo(R,B,R,B+r);s.lineTo(R,F-r);s.quadraticCurveTo(R,F,R-r,F);s.lineTo(L+r,F);s.quadraticCurveTo(L,F,L,F-r);s.lineTo(L,B+r);s.quadraticCurveTo(L,B,L+r,B);
 const geo=new THREE.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.08,bevelThickness:.06,curveSegments:10});geo.rotateX(-Math.PI/2);const shell=new THREE.Mesh(geo,wall);shell.position.set(x,0,z);shell.castShadow=true;target.add(shell);
 const roof=new THREE.Mesh(new THREE.CylinderGeometry(w*.52,w*.52,.18,48),mat(party?'#453653':'#655849',.72));roof.scale.z=d/w;roof.position.set(x,h+.08,z);target.add(roof);
 for(const side of [-1,1]){const p=new THREE.Mesh(new THREE.CylinderGeometry(.14,.18,h-.45,20),trim);p.position.set(x+side*w*.39,h/2-.1,face+front*.12);target.add(p)}
 const door=new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.35),glass);door.position.set(x,1.18,face+front*.035);door.rotation.y=front===1?0:Math.PI;target.add(door);
 for(const dx of [-.82,.82]){const frame=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,2.45,10),gold);frame.position.set(x+dx,1.2,face+front*.08);target.add(frame)}
 const xs=hotel?[-3.9,-1.95,1.95,3.9]:[-w*.34,w*.34];for(const dx of xs)for(const yy of (hotel?[2.25,3.55]:[1.75])){const win=new THREE.Mesh(new THREE.PlaneGeometry(hotel?1.45:1.75,hotel?1.05:1.45),glass);win.position.set(x+dx,yy,face+front*.04);win.rotation.y=front===1?0:Math.PI;target.add(win)}
 const canopy=new THREE.Mesh(new THREE.CylinderGeometry(1.75,1.75,.16,36,1,false,Math.PI,Math.PI),hotel?gold:mat('#59372c',.65));canopy.scale.z=.62;canopy.position.set(x,2.72,face+front*.62);target.add(canopy);
 for(let i=0;i<3;i++){const step=new THREE.Mesh(new THREE.BoxGeometry(2.5,.12,.34),mat('#c6b9a4',.95));step.position.set(x,-.02+i*.02,face+front*(.48+i*.29));target.add(step)}
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=180;const ctx=canvas.getContext('2d');ctx.fillStyle=hotel?'#183b4a':party?'#30263a':'#271916';ctx.fillRect(0,0,900,180);ctx.strokeStyle='#d8b36d';ctx.lineWidth=9;ctx.strokeRect(8,8,884,164);ctx.fillStyle='#fff0c9';ctx.font='bold 64px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(name,450,90);const plaque=new THREE.Mesh(new THREE.PlaneGeometry(hotel?7.2:Math.min(13,w*.48),1.24),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide}));plaque.position.set(x,h-.72,face+front*.16);plaque.rotation.y=front===1?0:Math.PI;target.add(plaque);
 for(const side of [-1,1]){const lx=x+side*w*.34,lz=face+front*.95,pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,2.25,12),mat('#26343a',.42));pole.position.set(lx,1.08,lz);target.add(pole);const bulb=new THREE.Mesh(new THREE.SphereGeometry(.16,16,12),new THREE.MeshStandardMaterial({color:'#ffe7b2',emissive:'#ffbd62',emissiveIntensity:1.1}));bulb.position.set(lx,2.28,lz);target.add(bulb);const pot=new THREE.Mesh(new THREE.CylinderGeometry(.42,.35,.42,20),mat('#76513c',.86));pot.position.set(lx,.16,face+front*1.85);target.add(pot);for(let k=0;k<5;k++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),mat(k%2?'#4f7a4c':'#668d57',.95));leaf.scale.set(.65,1.6,.65);leaf.position.set(lx+Math.cos(k*1.25)*.24,.55,face+front*1.85+Math.sin(k*1.25)*.24);target.add(leaf)}}
 if(hotel){const balcony=new THREE.Mesh(new THREE.BoxGeometry(w*.82,.12,.72),trim);balcony.position.set(x,2.92,face+front*.38);target.add(balcony);for(let i=0;i<13;i++){const rail=new THREE.Mesh(new THREE.CylinderGeometry(.018,.018,.62,8),gold);rail.position.set(x-w*.39+i*(w*.78/12),3.25,face+front*.67);target.add(rail)}}
 else{for(const side of [-1,1]){const awning=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,.12,28,1,false,Math.PI,Math.PI),mat(party?(side<0?'#79529a':'#d7b66e'):(side<0?'#8e3335':'#d7b66e'),.72));awning.scale.set(1.25,.8,.55);awning.position.set(x+side*2.35,2.55,face+front*.42);target.add(awning)}}
}
function buildVenueYard(x,z,front,opts){
 const lotHalfW=8.9,frontZ=19.1,backZ=36.9,lotDepth=backZ-frontZ,midZ=(frontZ+backZ)/2,gateCarW=2.8,pedW=2.2;
 const concrete=mat('#858783',.98),edge=mat('#c9c5b8',.95),fence=mat('#a7a89f',.96),metal=mat('#343b40',.55),paint=mat('#eee8d4',.8),grass=mat('#58824d',.98),wood=mat('#76513c',.85);
 box(lotHalfW*2,.07,lotDepth,concrete,x,-.105,midZ);
 for(const side of [-1,1]){
  box(.18,1.25,lotDepth,fence,x+side*lotHalfW,.59,midZ);
  addCityCollision(x+side*lotHalfW,midZ,.18,lotDepth,.08);
 }
 box(lotHalfW*2,1.25,.18,fence,x,.59,backZ);
 addCityCollision(x,backZ,lotHalfW*2,.18,.08);
 const carGateCenter=lotHalfW-gateCarW/2,centralHalf=pedW/2,carInner=carGateCenter-gateCarW/2,segmentW=carInner-centralHalf;
 for(const side of [-1,1]){
  box(segmentW,1.15,.18,fence,x+side*(centralHalf+segmentW/2),.55,frontZ);
  addCityCollision(x+side*(centralHalf+segmentW/2),frontZ,segmentW,.18,.08);
 }
 const postXs=[-lotHalfW,-carInner,-centralHalf,centralHalf,carInner,lotHalfW];
 postXs.forEach(px=>{const p=new THREE.Mesh(new THREE.BoxGeometry(.28,1.55,.28),edge);p.position.set(x+px,.76,frontZ);target.add(p)});
 const buildingFront=z+front*opts.d/2;
 box(2.25,.045,Math.abs(buildingFront-frontZ),edge,x,-.025,(buildingFront+frontZ)/2);
 for(const side of [-1,1]){
  const px=x+side*6.9,pz=frontZ+1.15;
  box(1.35,.28,.9,wood,px,.12,pz);
  const bush=new THREE.Mesh(new THREE.SphereGeometry(.42,8,7),grass);bush.scale.set(1.35,.72,.85);bush.position.set(px,.55,pz);target.add(bush);
  const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.045,.065,1.8,8),metal);lamp.position.set(x+side*4.2,.9,frontZ+1.05);target.add(lamp);
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshStandardMaterial({color:'#ffe7b2',emissive:'#ffbd62',emissiveIntensity:.8}));bulb.position.set(x+side*4.2,1.85,frontZ+1.05);target.add(bulb);
 }
 const colors=['#a83e36','#d0c8b6','#426b86','#b8a13d'];let carIndex=0;
 for(const side of [-1,1]){
  const carX=x+side*(opts.w/2+1.75);
  for(const carZ of [25.15,30.85]){
   const left=carX-1.15,right=carX+1.15,near=carZ-2.12,far=carZ+2.12;
   for(const px of [left,right])box(.045,.012,4.24,paint,px,-.018,carZ);
   for(const pz of [near,far])box(2.3,.012,.045,paint,carX,-.018,pz);
   const car=createDetailedCar(colors[carIndex++],false);car.position.set(carX,0,carZ);car.rotation.y=Math.PI/2;target.add(car);
   addCityCollision(carX,carZ,1.34,3.56,.02);
  }
 }
 const canvas=document.createElement('canvas');canvas.width=640;canvas.height=120;const ctx=canvas.getContext('2d');ctx.fillStyle=opts.kind==='party'?'#30263a':'#271916';ctx.fillRect(0,0,640,120);ctx.strokeStyle='#d8b36d';ctx.lineWidth=7;ctx.strokeRect(7,7,626,106);ctx.fillStyle='#fff0c9';ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('PARQUE PRIVATIVO',320,60);
 const sign=new THREE.Mesh(new THREE.PlaneGeometry(3.8,.72),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),side:THREE.DoubleSide}));sign.position.set(x,2.05,frontZ);sign.rotation.y=front===1?0:Math.PI;target.add(sign);
}
function buildCommercialYard(x,z,front,opts){
 const half=10,frontZ=z+front*half,backZ=z-front*half;
 const ground=mat(opts.kind==='quarry'?'#8b887e':opts.kind==='market'?'#b6a17b':'#858b8d',.98),fence=mat('#7b8588',.92),paint=mat('#eee8d4',.82),metal=mat('#343b40',.65);
 box(half*2,.07,half*2,ground,x,-.11,z);
 for(const side of [-1,1]){box(.18,1.35,half*2,fence,x+side*half,.62,z);addCityCollision(x+side*half,z,.18,half*2,.08)}
 box(half*2,1.35,.18,fence,x,.62,backZ);addCityCollision(x,backZ,half*2,.18,.08);
 for(const side of [-1,1]){box(2.1,1.25,.18,fence,x+side*(half-1.05),.59,frontZ);addCityCollision(x+side*(half-1.05),frontZ,2.1,.18,.08)}
 for(const px of [-half,-2.1,2.1,half]){const p=new THREE.Mesh(new THREE.BoxGeometry(.28,1.55,.28),metal);p.position.set(x+px,.76,frontZ);target.add(p)}
 box(3.7,.08,.12,metal,x,.08,frontZ);
 box(2.2,.045,Math.max(.1,Math.abs(frontZ-(z+front*(opts.d/2+.1)))),paint,x,-.02,(frontZ+z+front*(opts.d/2+.1))/2);
 for(const side of [-1,1]){
  const px=x+side*(half-3.5),pz=z+front*(opts.d/2+2.8);
  if(opts.kind==='cars'){
   const car=createDetailedCar(side<0?'#426d87':'#b8a13d',false);
   car.position.set(px,0,pz);car.rotation.y=Math.PI/2;target.add(car);
   for(const dx of [-.76,.76])box(.045,.012,4.2,paint,px+dx,-.018,pz);
   for(const dz of [-2.1,2.1])box(1.55,.012,.045,paint,px,-.018,pz+dz);
   addCityCollision(px,pz,2.25,1.28,.08);
  }else if(opts.kind==='quarry'){
   const truck=new THREE.Group(),yellow=mat('#c28a35',.78),dark=mat('#30383b',.9),glass=mat('#8aaab3',.35);
   box(1.45,1.15,2.0,yellow,0,1.05,.35,truck);box(1.42,1.0,1.25,yellow,0,1.35,-1.25,truck);box(1.2,.62,.08,glass,0,1.55,-1.9,truck);
   for(const wz of [-1.25,.55])for(const wx of [-.78,.78]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.34,.34,.18,12),dark);wheel.rotation.z=Math.PI/2;wheel.position.set(wx,.36,wz);truck.add(wheel)}
   truck.position.set(px,0,pz);target.add(truck);addCityCollision(px,z+front*1.1,1.5,2.2,.08);
  }else{
   const van=createDetailedCar('#477c58',false);van.position.set(px,0,pz);van.rotation.y=Math.PI/2;target.add(van);addCityCollision(px,pz,2.25,1.28,.08);
  }
 }
 if(opts.kind==='market'){
  for(const side of [-1,1])for(let row=0;row<2;row++){
   const sx=x+side*(half-2.35),sz=z+(row-.5)*3.4,wood=mat('#76543b',.85),canopy=mat(side<0?'#b84e3b':'#d2b35d',.82);
   box(.95,.12,1.35,wood,sx,.78,sz);box(1.9,.12,1.8,canopy,sx,2.15,sz);
   for(const dx of [-.82,.82])for(const dz of [-.72,.72])box(.07,1.35,.07,metal,sx+dx,1.35,sz+dz);
   for(let k=0;k<5;k++){const fruit=new THREE.Mesh(new THREE.SphereGeometry(.15,10,8),mat(['#d94d35','#e6bd38','#4d8a43'][k%3],.85));fruit.position.set(sx-.34+(k%3)*.34,1.02,sz-.3+Math.floor(k/3)*.45);target.add(fruit)}
  }
 }
}
function buildVianaBuilding(name,x,z,front,opts={}){
 if(opts.kind==='hospital'){buildHospitalExterior(x,z,front,opts);return}
  const w=opts.w||9,d=opts.d||7,h=opts.h||3.35,frontFace=z+front*(d/2+.075);
 if(opts.kind==='hotel'||opts.kind==='bar'||opts.kind==='party'){
  const opening=1.9,segment=(w-opening)/2,offset=(w+opening)/4,frontWallZ=z+front*d/2;
  addCityCollision(x-w/2,z,.35,d,.08);addCityCollision(x+w/2,z,.35,d,.08);addCityCollision(x,z-front*d/2,w,.35,.22);addCityCollision(x-offset,frontWallZ,segment,.35,.18);addCityCollision(x+offset,frontWallZ,segment,.35,.18);
  const entry=new THREE.Mesh(new THREE.PlaneGeometry(2.15,2.5),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));entry.position.set(x,1.2,frontFace+front*.28);entry.userData.worldEntry={dest:opts.kind,label:name,x,z,front,d};target.add(entry);policeEntryMeshes.push(entry);cityWorldEntrances.push(entry.userData.worldEntry);
 }else{
  // Colisão apenas nas paredes: a abertura frontal permanece livre para entrar.
  const opening=1.9,segment=(w-opening)/2,offset=(w+opening)/4,frontWallZ=z+front*d/2;
  addCityCollision(x-w/2,z,.3,d,.18);addCityCollision(x+w/2,z,.3,d,.18);
  addCityCollision(x,z-front*d/2,w,.3,.18);
  addCityCollision(x-offset,frontWallZ,segment,.3,.18);
  addCityCollision(x+offset,frontWallZ,segment,.3,.18);
  const entry=new THREE.Mesh(new THREE.PlaneGeometry(1.9,2.5),new THREE.MeshBasicMaterial({transparent:true,opacity:.001,side:THREE.DoubleSide,depthWrite:false}));
  entry.position.set(x,1.2,frontFace+front*.28);
  entry.userData.worldEntry={dest:opts.kind,label:name,x,z,front,d};
  target.add(entry);policeEntryMeshes.push(entry);cityWorldEntrances.push(entry.userData.worldEntry);
 }
 if(opts.kind==='hotel'||opts.kind==='bar'||opts.kind==='party'){buildPremiumVenueExterior(name,x,z,front,opts);if(opts.kind==='bar'||opts.kind==='party')buildVenueYard(x,z,front,opts);return}
 const wall=mat(opts.wall||'#c9c0ad',.96),trim=mat(opts.trim||'#e4ddce',.9),roof=mat(opts.roof||'#77736b',.96);
 const glass=mat('#263b43',.48),door=mat('#39464a',.82),frame=mat('#e8dfcd',.9),ground=mat('#a18b70',1),metal=mat('#505657',.82);
 const face=z+front*(d/2+.075);
 // Base e edifício de construção simples, com cobertura plana.
 box(w+2,.07,d+2,ground,x,-.105,z);
 box(w,.16,d,trim,x,-.015,z);
 box(w,h,d,wall,x,h/2,z);
 box(w+.28,.18,d+.28,roof,x,h+.08,z);
 box(w+.12,.12,d+.12,trim,x,h-.04,z);
 // Entrada principal e caixilharia na fachada voltada para a rua.
 box(1.18,2.25,.13,door,x,.99,face);
 [-1,1].forEach(side=>{
  const wx=x+side*(w*.29);
  box(1.55,1.12,.13,glass,wx,1.92,face);
  box(1.72,.12,.2,frame,wx,2.52,face);
  box(1.72,.12,.2,frame,wx,1.32,face);
  box(.12,1.25,.2,frame,wx-.8,1.92,face);
  box(.12,1.25,.2,frame,wx+.8,1.92,face);
  box(.06,1.08,.22,metal,wx,1.92,face);
  box(1.58,.06,.22,metal,wx,1.92,face);
 });
 // Moldura simples da porta.
 box(1.34,.12,.18,frame,x,2.18,face);
 box(.12,2.3,.18,frame,x-.67,1.1,face);
 box(.12,2.3,.18,frame,x+.67,1.1,face);
 // Letreiro próprio para cada estabelecimento.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle=opts.sign||'#244638';ctx.fillRect(0,0,768,128);
 ctx.strokeStyle='#e7ddbd';ctx.lineWidth=8;ctx.strokeRect(5,5,758,118);
 ctx.fillStyle='#fff4d8';ctx.font='bold 43px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText(name,384,66);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(Math.min(w-1,8.4),.72,.13),new THREE.MeshStandardMaterial({map:texture,roughness:.85}));
 sign.position.set(x,h-.52,face+front*.09);target.add(sign);
 // Pequeno alpendre sobre a entrada.
 box(2.25,.14,.95,roof,x,h*.72,face+front*.45);
 // Elementos específicos, mantendo escala e aspeto de bairro.
 if(opts.kind==='hospital'){
  const cx=x+w/2-1.15,cz=face+front*.12;
  box(.28,1.05,.12,mat('#b63b35',.7),cx,3.05,cz);
  box(.95,.28,.12,mat('#b63b35',.7),cx,3.05,cz);
 }
 if(opts.kind==='hotel'){
  [-1,1].forEach(side=>[-1,1].forEach(row=>box(1.25,.95,.13,glass,x+side*2.55,3.65,z+front*(d/2+.08))));
  box(w+.6,.12,d+.5,roof,x,4.25,z);
  box(w+.3,.12,d+.2,trim,x,4.16,z);
 }
 if(opts.kind==='market'){
  [-1,1].forEach(side=>box(2.1,.16,1.15,mat(side<0?'#a34c35':'#d2b35d',.9),x+side*2.7,2.85,face+front*.55));
 }
 if(opts.kind==='cars'){
  // Parque de exposição com três viaturas completas e estacionamento marcado.
  [-1,0,1].forEach((side,i)=>{
   const car=createDetailedCar(['#a83e36','#426d87','#d0b65b'][i],false);
   car.scale.setScalar(.78);car.position.set(x+side*3.15,0,z+front*(d/2+1.85));car.rotation.y=front===1?0:Math.PI;target.add(car);
   box(2.45,.025,.08,mat('#e8dfc9'),x+side*3.15,-.005,z+front*(d/2+3.15));
  });
  // Pala moderna e fachada envidraçada do stand.
  box(w+.5,.18,1.25,mat('#394f5b'),x,3.18,face+front*.62);
  box(w*.72,1.85,.08,glass,x,1.45,face+front*.13);
 }
 if(opts.kind==='bar'){
  box(w*.72,.22,.7,mat('#8b5739',.9),x,1.2,face+front*.62);
  box(.12,.95,.12,metal,x-w*.3,.58,face+front*.62);
  box(.12,.95,.12,metal,x+w*.3,.58,face+front*.62);
 }
 if(opts.kind==='party'){
  box(1.4,.5,.12,mat('#d4b66e',.7),x,2.95,face+front*.12);
  // Palco, colunas de som e iluminação de salão comunitário.
  box(w*.62,.28,1.35,mat('#5d4a43',.8),x,.18,z-front*(d*.25));
  [-1,1].forEach(side=>{const sx=x+side*(w*.37),sz=face+front*.2;box(.72,1.45,.55,mat('#24272b',.65),sx,.85,sz);for(let k=0;k<3;k++){const sp=new THREE.Mesh(new THREE.CircleGeometry(.16,12),mat('#111518',.65));sp.position.set(sx,.45+k*.38,sz+front*.29);sp.rotation.y=front>0?0:Math.PI;target.add(sp)}const lamp=new THREE.Mesh(new THREE.SphereGeometry(.13,10,8),mat(side<0?'#d34d8c':'#4d85d3',.4));lamp.position.set(sx,3.25,face+front*.3);target.add(lamp)});
 }
 if(opts.kind==='hospital'){
  const red=mat('#b73535',.65),white=mat('#f2eee5',.8),cx=x+w/2-1.15,cz=face+front*.12;
  box(.28,1.05,.12,red,cx,3.05,cz);box(.95,.28,.12,red,cx,3.05,cz);
  box(3.1,.16,1.05,white,x,2.75,face+front*.68);box(2.7,.12,.12,red,x,2.84,face+front*.68);
  box(2.15,.62,.14,red,x-w*.28,2.45,face+front*.14);box(1.75,.24,.16,white,x-w*.28,2.45,face+front*.23);
  const ax=x+w*.31,az=face+front*2.15;box(2.45,.72,1.15,white,ax,.48,az);box(1.12,.48,1.02,white,ax,.99,az-front*.08);box(.72,.3,.06,red,ax,.98,az+front*.53);
  [-1,1].forEach(side=>{const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.13,12),metal);wheel.rotation.z=Math.PI/2;wheel.position.set(ax+side*.72,.22,az+front*.42);target.add(wheel)});
 }
 if(opts.kind==='quarry'){
  // Materiais de amostra e zona de carga frontal dentro do recinto, sem ocupar a estrada.
  const steel=mat('#596367',.82),sand=mat('#a99a7d',1),stone=mat('#77756d',1);
  box(5.8,.08,1.55,steel,x,-.02,z+front*(d/2+1.15));
  for(let i=0;i<3;i++){const pile=new THREE.Mesh(new THREE.ConeGeometry(.72,.62,7),i%2?sand:stone);pile.position.set(x-1.8+i*1.8,.35,z+front*(d/2+1.15));target.add(pile)}
 }
 if(opts.kind==='salon'){
  for(let i=-1;i<=1;i++){const sx=x+i*1.55,sz=face+front*.2;box(1.0,1.2,.1,mat('#9ab3b7',.28),sx,2.05,sz);box(1.12,.1,.14,frame,sx,2.7,sz);box(.62,.55,.62,mat('#35393d',.6),sx,.92,sz+front*.72);const seat=new THREE.Mesh(new THREE.CylinderGeometry(.28,.3,.16,12),mat('#292e32',.6));seat.position.set(sx,1.3,sz+front*.72);target.add(seat);box(.08,.55,.08,metal,sx,1.05,sz+front*.72)}
  box(2.4,.95,.65,mat('#76543f',.85),x,.52,face+front*1.45);
 }
 if(opts.kind==='clothes'){
  const looks=[{gender:'female',skin:'#b98768',hair:'#241b18',shirt:'#9c554b',pants:'#30394a',hairStyle:'comprido'},{gender:'male',skin:'#985b42',hair:'#171412',shirt:'#496e83',pants:'#26364b',hairStyle:'curto'},{gender:'female',skin:'#dca77c',hair:'#75482b',shirt:'#6f527f',pants:'#343b48',hairStyle:'medio'}];
  looks.forEach((look,i)=>buildCharacter(target,look,{x:x+(i-1)*1.55,y:0,z:face+front*.42},()=>{},false));
  box(2.8,.12,.75,mat('#76543f',.85),x,.8,face+front*1.2);
 }
 if(['market','quarry','cars'].includes(opts.kind))buildCommercialYard(x,z,front,opts);
}
function buildVianaOtherBuildings(){
 // Hospital no quarteirão esquerdo, junto à esquadra.
 buildVianaBuilding('HOSPITAL',-28,-28,1,{kind:'hospital',w:15.5,d:9.5,h:6.35,wall:'#edf3f4',trim:'#ffffff',roof:'#d9dfe2',sign:'#164d6b'});
 // Empresa da pedreira, com fachada industrial simples.
 buildVianaBuilding('EMPRESA DA PEDREIRA',0,-28,1,{kind:'quarry',w:14,d:12,h:4.8,wall:'#b7a27c',trim:'#e1d2b5',roof:'#625d52',sign:'#4b5147'});
 // Mercado de bairro amplo, com espaço de circulação e exposição exterior.
 buildVianaBuilding('MERCADO',28,0,-1,{kind:'market',w:14,d:12.5,h:4.4,wall:'#d6b77e',trim:'#f2dfb9',roof:'#9a5938',sign:'#87432c'});
 // Stand de automóveis com parque exterior e showroom interior.
 buildVianaBuilding('LOJA DE CARROS',-28,0,-1,{kind:'cars',w:14,d:9.5,h:4.8,wall:'#cbd5d9',trim:'#f0f3f2',roof:'#687b83',sign:'#344f60'});
 // Hotel com recepção e dez suítes identificadas.
 buildVianaBuilding('HOTEL · 10 SUÍTES',0,0,-1,{kind:'hotel',w:11.5,d:10.2,h:4.6,wall:'#d8c5a6',trim:'#f0e3cc',roof:'#78624e',sign:'#69513d'});
 // Bar de entretenimento para adultos, com balcão e equipa própria.
 buildVianaBuilding('BAR DAS PUTAS',-28,28,-1,{kind:'bar',w:11,d:12.5,h:5.2,wall:'#c58b62',trim:'#ead0ad',roof:'#75452f',sign:'#693b2b'});
 // Salão de festas.
 buildVianaBuilding('SALÃO DE FESTAS',28,28,-1,{kind:'party',w:11,d:12.5,h:5.6,wall:'#c5b5ce',trim:'#eee4f0',roof:'#66556e',sign:'#55405e'});
 // Dois pequenos estabelecimentos no mesmo quarteirão comercial.
 buildVianaBuilding('SALÃO DE BELEZA',-3.9,28,-1,{kind:'salon',w:5.7,d:6.8,h:3.2,wall:'#d9aebd',trim:'#f4dce4',roof:'#80566b',sign:'#864e68'});
 buildVianaBuilding('LOJA DE ROUPAS',3.9,28,-1,{kind:'clothes',w:5.7,d:6.8,h:3.2,wall:'#9bbfc0',trim:'#e0eeee',roof:'#486c70',sign:'#365960'});
}

function addPoliceOfficer(x,z,rotation=0,scale=1,armed=false,seated=false){
 // Os agentes usam o mesmo modelo humano de 1,72 m, com uniforme próprio.
 const uniformLook={gender:'male',skin:'#985b42',hair:'#171412',eyes:'#35251f',shirt:'#123b70',pants:'#102b4c',hairStyle:'curto'};
 const g=buildCharacter(target,uniformLook,{x,y:0,z},m=>{g.userData.officerMixer=m},true);
 const details=new THREE.Group();details.scale.set(2.0,CHARACTER_HEIGHT/.5,2.0);g.add(details);
 g.userData.seatedOfficer=seated;g.userData.actionState=seated?{type:'sit',time:0}:{type:'idle',time:0};if(seated){g.position.y=.55-.86;updateCharacterActionPose(g,0)}
 g.rotation.y=rotation;
 const gold=mat('#d9b24f',.55),black=mat('#151b24',.88),blue=mat('#0b2d59',.82);
 const sphere=(radius,material,px,py,pz)=>{const m=new THREE.Mesh(new THREE.SphereGeometry(radius,18,14),material);m.position.set(px,py,pz);m.castShadow=true;details.add(m);return m};
 const cylinder=(rt,rb,h,material,px,py,pz)=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,20),material);m.position.set(px,py,pz);m.castShadow=true;details.add(m);return m};
 // Boné, distintivos, cinto e rádio ajustados à escala real do avatar.
 cylinder(.075,.09,.045,blue,0,.485,0);sphere(.083,blue,0,.505,-.006);
 const brim=new THREE.Mesh(new THREE.CylinderGeometry(.095,.095,.018,24,1,false,0,Math.PI),blue);brim.rotation.x=Math.PI/2;brim.position.set(0,.49,.075);details.add(brim);
 sphere(.018,gold,-.045,.355,.073);sphere(.018,gold,.045,.355,.073);
 const belt=new THREE.Mesh(new THREE.TorusGeometry(.067,.009,8,24),black);belt.rotation.x=Math.PI/2;belt.position.set(0,.245,0);details.add(belt);
 const buckle=new THREE.Mesh(new THREE.BoxGeometry(.025,.025,.012),gold);buckle.position.set(0,.245,.073);details.add(buckle);
 const badge=new THREE.Mesh(new THREE.CylinderGeometry(.014,.014,.008,6),gold);badge.rotation.x=Math.PI/2;badge.position.set(-.045,.36,.075);details.add(badge);
 const radio=new THREE.Mesh(new THREE.BoxGeometry(.025,.055,.018),black);radio.position.set(.075,.31,.055);details.add(radio);
 if(armed){
  // Pistola de serviço na mão direita, apontada para baixo em posição de guarda.
  const gun=new THREE.Group();
  const steel=mat('#252b31',.42),grip=mat('#111820',.9);
  const slide=new THREE.Mesh(new THREE.BoxGeometry(.035,.035,.13),steel);slide.position.set(0,0,.035);gun.add(slide);
  const handle=new THREE.Mesh(new THREE.BoxGeometry(.03,.075,.035),grip);handle.position.set(0,-.047,.005);handle.rotation.x=-.18;gun.add(handle);
  const muzzle=new THREE.Mesh(new THREE.CylinderGeometry(.009,.009,.012,10),black);muzzle.rotation.x=Math.PI/2;muzzle.position.set(0,0,.105);gun.add(muzzle);
  gun.position.set(.13,.205,.105);gun.rotation.x=-.12;details.add(gun);
 }
 g.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true}});
 return g;
}
function buildVianaPoliceStation(){
  // A esquadra fica compacta para respeitar o espaço livre das ruas e dos passeios.
  const parentTarget=target,stationGroup=new THREE.Group(),collisionStart=cityCollisionBoxes.length,stationScale=.72,stationCenter={x:28,z:-28};
  target=stationGroup;
 // Recinto murado, com entrada controlada, edifício acessível e identificação policial.
 const wall=mat('#123f78',.96),trim=mat('#e4edf7',.9),roof=mat('#0b2d59',.95);
 const dark=mat('#19365b',.55),metal=mat('#aab8c7',.8),door=mat('#0b2d59',.8);
 const concrete=mat('#aeb7bd',1),yard=mat('#78966a',1);
 const fenceZ=-16,backZ=-40,leftX=16,rightX=40;
 // Pátio relvado e passeio de acesso.
 box(24,.08,24,yard,28,-.105,-28);
 box(12,.12,9.5,concrete,28,-.025,-28);
 // Muro contínuo e bem visível: os segmentos têm colisão física.
 box(.28,1.35,backZ-fenceZ,concrete,leftX,.62,(backZ+fenceZ)/2);
 box(.28,1.35,backZ-fenceZ,concrete,rightX,.62,(backZ+fenceZ)/2);
 box(rightX-leftX,1.35,.28,concrete,28,.62,backZ);
 box(5.1,1.35,.28,concrete,21.45,.62,fenceZ);
 box(5.1,1.35,.28,concrete,34.55,.62,fenceZ);
 addCityCollision(leftX,(backZ+fenceZ)/2,.28,backZ-fenceZ,.12);
 addCityCollision(rightX,(backZ+fenceZ)/2,.28,backZ-fenceZ,.12);
 addCityCollision(28,backZ,rightX-leftX,.28,.12);
 addCityCollision(21.45,fenceZ,5.1,.28,.12);
 addCityCollision(34.55,fenceZ,5.1,.28,.12);
 // Pilares de betão e remates no topo do muro.
 [leftX,rightX].forEach(x=>[-21,-27,-33.7].forEach(z=>box(.42,1.55,.42,trim,x,.72,z)));
 [18.9,37.1].forEach(x=>box(.42,1.55,.42,trim,x,.72,fenceZ));
 // Portão metálico de duas folhas, deixando passagem central.
 [-1,1].forEach(side=>{
  const gx=28+side*1.05;
  box(.055,1.55,.08,metal,gx,.78,fenceZ);
  for(let y=0;y<8;y++)box(.035,.07,.09,metal,gx,.2+y*.19,fenceZ);
 });
 box(2.95,.08,.12,metal,28,1.57,fenceZ);
 // Edifício com paredes separadas e abertura real na entrada frontal.
 box(19,.12,19,concrete,28,-.035,-28);
 box(.24,3.15,18.6,wall,18.6,1.55,-28);
 box(.24,3.15,18.6,wall,37.4,1.55,-28);
 box(18.6,3.15,.24,wall,28,1.55,-37.4);
 box(8.3,3.15,.24,wall,22.85,1.55,-18.6);
 box(8.3,3.15,.24,wall,33.15,1.55,-18.6);
 addCityCollision(18.6,-28,.24,18.6,.16);
 addCityCollision(37.4,-28,.24,18.6,.16);
 addCityCollision(28,-37.4,18.6,.24,.16);
 addCityCollision(22.85,-18.6,8.3,.24,.12);
 addCityCollision(33.15,-18.6,8.3,.24,.12);
 // Cobertura e beirais.
 box(19.2,.2,19.2,roof,28,3.22,-28);
 box(18.8,.12,18.8,trim,28,3.08,-28);
 // Moldura e folha da porta deixada aberta para o público entrar.
 box(.14,2.35,.18,trim,27.18,1.14,-18.5);
 box(.14,2.35,.18,trim,28.82,1.14,-18.5);
 box(1.75,.14,.2,trim,28,2.3,-18.5);
 const openDoor=box(.12,2.12,1.25,door,27.92,1.08,-19.15);
 openDoor.rotation.y=.08;
 const entryTrigger=new THREE.Mesh(new THREE.BoxGeometry(1.55,2.2,.08),new THREE.MeshBasicMaterial({transparent:true,opacity:.01,depthWrite:false,side:THREE.DoubleSide}));
 entryTrigger.position.set(28,1.1,-18.55);entryTrigger.userData.policeEntry=true;target.add(entryTrigger);policeEntryMeshes.push(entryTrigger);
 // Janelas frontais com vidro, caixilhos e grades.
 [-1,1].forEach(side=>{
  const x=28+side*6.2;
  box(1.55,1.05,.13,dark,x,1.95,-18.75);
  box(1.72,.12,.2,trim,x,2.52,-18.7);
  box(1.72,.12,.2,trim,x,1.38,-18.7);
  box(.12,1.18,.2,trim,x-.8,1.95,-18.7);
  box(.12,1.18,.2,trim,x+.8,1.95,-18.7);
  box(.07,1.02,.22,metal,x,1.95,-18.66);
  box(1.55,.07,.22,metal,x,1.95,-18.66);
 });
 // Pala sobre a porta e pilares de apoio.
 box(2.35,.16,1.05,roof,28,2.58,-17.95);
 box(.12,.9,.12,metal,27.05,2.08,-18.2);
 box(.12,.9,.12,metal,28.95,2.08,-18.2);
 // Placa institucional.
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;
 const ctx=canvas.getContext('2d');ctx.fillStyle='#082c5d';ctx.fillRect(0,0,768,128);
 ctx.strokeStyle='#e5dfbd';ctx.lineWidth=8;ctx.strokeRect(5,5,758,118);
 ctx.fillStyle='#fff4d6';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';
 ctx.fillText('ESQUADRA DA POLÍCIA',384,66);
 const signTex=new THREE.CanvasTexture(canvas);signTex.colorSpace=THREE.SRGBColorSpace;
 const sign=new THREE.Mesh(new THREE.BoxGeometry(5.3,.9,.13),new THREE.MeshStandardMaterial({map:signTex,roughness:.8}));
 sign.position.set(28,2.82,-18.75);target.add(sign);
 // Guardas posicionados um de cada lado do portão, à escala do avatar e armados.
 const officerLeft=addPoliceOfficer(26.25,-21.65,0,1,true,false);officerLeft.scale.setScalar(1/stationScale);
 const officerRight=addPoliceOfficer(29.75,-21.65,0,1,true,false);officerRight.scale.setScalar(1/stationScale);
 // Viatura policial estacionada no exterior, junto à entrada.
 const car=createDetailedCar('#e8ecee',true);car.scale.setScalar(1/stationScale);
 car.position.set(32.2,0,-13.2);car.rotation.y=Math.PI/2;target.add(car);
 addCityCollision(32.2,-13.2,1.8,3.8,.2);
 // Postes de iluminação no pátio.
 [-1,1].forEach(side=>{
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.045,.06,3.1,8),metal);
  pole.position.set(28+side*5.2,1.5,-29.5);target.add(pole);
  const lamp=new THREE.Mesh(new THREE.BoxGeometry(.42,.16,.3),mat('#e6d8a0',.5));
  lamp.position.set(28+side*5.2,3.08,-29.5);target.add(lamp);
  addCityCollision(28+side*5.2,-29.5,.18,.18,.08);
 });
  target=parentTarget;
  parentTarget.add(stationGroup);
  stationGroup.scale.setScalar(stationScale);
  stationGroup.position.set(stationCenter.x*(1-stationScale),0,stationCenter.z*(1-stationScale));
  cityCollisionBoxes.slice(collisionStart).forEach(c=>{
   c.minX=stationCenter.x+(c.minX-stationCenter.x)*stationScale;
   c.maxX=stationCenter.x+(c.maxX-stationCenter.x)*stationScale;
   c.minZ=stationCenter.z+(c.minZ-stationCenter.z)*stationScale;
   c.maxZ=stationCenter.z+(c.maxZ-stationCenter.z)*stationScale;
  });
}

function buildVianaStreets(){
 target.clear();target.userData.characters=[];sceneSeatAnchors.length=0;roomDoorMeshes=[];policeEntryMeshes=[];cityWorldEntrances=[];activeRoomDoor=null;cityCollisionBoxes=[];cityDrivableCars=[];scene.background=new THREE.Color('#58a9ed');
 // Viana ampliada: malha viária em grelha, novos quarteirões residenciais e avenidas de ligação.
 const groundMat=mat('#b69a75',1),shoulderMat=mat('#a47b55',1),trackMat=mat('#805638',1);
 // Textura de laterite: terra avermelhada, pó e pequenas variações naturais.
 const dirtCanvas=document.createElement('canvas');dirtCanvas.width=256;dirtCanvas.height=256;
 const dirtCtx=dirtCanvas.getContext('2d');dirtCtx.fillStyle='#a86f49';dirtCtx.fillRect(0,0,256,256);
 let noiseSeed=82417;const rand=()=>{noiseSeed=(noiseSeed*1664525+1013904223)>>>0;return noiseSeed/4294967296};
 for(let i=0;i<5200;i++){const x=rand()*256,y=rand()*256,r=.35+rand()*1.8;dirtCtx.fillStyle=rand()>.52?'rgba(82,53,34,.13)':'rgba(230,174,112,.15)';dirtCtx.beginPath();dirtCtx.arc(x,y,r,0,Math.PI*2);dirtCtx.fill()}
 for(let i=0;i<34;i++){const x=rand()*256,y=rand()*256,r=5+rand()*19;dirtCtx.fillStyle=rand()>.5?'rgba(119,72,43,.10)':'rgba(218,157,96,.10)';dirtCtx.beginPath();dirtCtx.ellipse(x,y,r,r*.55,rand()*Math.PI,0,Math.PI*2);dirtCtx.fill()}
 const dirtTexture=new THREE.CanvasTexture(dirtCanvas);dirtTexture.colorSpace=THREE.SRGBColorSpace;dirtTexture.wrapS=THREE.RepeatWrapping;dirtTexture.wrapT=THREE.RepeatWrapping;dirtTexture.repeat.set(3,3);
 const roadMat=new THREE.MeshStandardMaterial({map:dirtTexture,color:'#f4d0ad',roughness:1});
 box(200,.18,200,groundMat,0,-.22,0);
 const streets=[-70,-42,-14,14,42,70],mainRoad=14,sideWidth=6.4,mainWidth=8.2;
 const roadWidth=c=>Math.abs(c)===70||c===mainRoad?mainWidth:sideWidth;
 // Estradas contínuas de terra batida, com cruzamentos ao mesmo nível.
 streets.forEach(x=>box(roadWidth(x),.12,144,roadMat,x,-.105,0));
 streets.forEach(z=>box(144,.12,roadWidth(z),roadMat,0,-.105,z));
 // Bermas de terra solta, ligeiramente mais baixas do que o piso de circulação.
 streets.forEach(x=>[-1,1].forEach(side=>box(1.05,.055,144,shoulderMat,x+side*(roadWidth(x)/2+.52),-.145,0)));
 streets.forEach(z=>[-1,1].forEach(side=>box(144,.055,1.05,shoulderMat,0,-.145,z+side*(roadWidth(z)/2+.52))));
 // Dois rastos discretos de pneus por faixa de circulação, sem linhas pintadas.
 streets.forEach(x=>[-1,1].forEach(lane=>box(.2,.012,144,trackMat,x+lane*1.05,-.037,0)));
 streets.forEach(z=>[-1,1].forEach(lane=>box(144,.012,.2,trackMat,0,-.037,z+lane*1.05)));
 // Pequenas pedras e torrões nas bermas para quebrar o aspeto artificial.
 const stoneMat=new THREE.MeshStandardMaterial({color:'#8b7259',roughness:1});
 const stoneGeo=new THREE.DodecahedronGeometry(.095,0),stones=new THREE.InstancedMesh(stoneGeo,stoneMat,260),stoneDummy=new THREE.Object3D();
 let stoneIndex=0;noiseSeed=19431;
 for(let i=0;i<260;i++){
  const axis=i%2===0?'x':'z',street=streets[Math.floor(rand()*streets.length)],side=rand()>.5?1:-1,along=-96+rand()*192;
  const road=roadWidth(street),offset=road/2+.7+rand()*1.1;
  stoneDummy.position.set(axis==='x'?street+side*offset:along,.015,axis==='x'?along:street+side*offset);
  const scale=.35+rand()*.9;stoneDummy.scale.set(scale,scale*.45,scale);stoneDummy.rotation.set(rand()*.5,rand()*Math.PI,rand()*.5);stoneDummy.updateMatrix();stones.setMatrixAt(stoneIndex++,stoneDummy.matrix);
 }
 stones.count=stoneIndex;stones.instanceMatrix.needsUpdate=true;target.add(stones);
 // Pequeno jardim relvado ao lado do hospital, com canteiros e bancos simples.
 const lawnMat=mat('#4f963f',1),lawnEdge=mat('#c8c3a9',1),shrubMat=mat('#347a36',1);
 const benchMetal=mat('#6f777a',.82);
 box(8.2,.12,10.8,lawnEdge,-38.5,-.105,-28);
 box(7.8,.08,10.4,lawnMat,-38.5,-.025,-28);
 // Canteiros baixos nas extremidades do relvado.
 [-32.7,-38.5,-44.3].forEach(z=>{
  const bush=new THREE.Mesh(new THREE.SphereGeometry(.48,8,7),shrubMat);
  bush.position.set(-38.5,.38,z);target.add(bush);
  addCityCollision(-38.5,z,.8,.8,.08);
 });
 // Dois bancos de jardim, sem bloquear a passagem.
 [-1,1].forEach(side=>{
  box(1.45,.12,.42,mat('#805a3d',.9),-38.5+side*2.25,.48,-28);
  box(.09,.48,.09,benchMetal,-39.05+side*2.25,.25,-28);
  box(.09,.48,.09,benchMetal,-37.95+side*2.25,.25,-28);
  sceneSeatAnchors.push({x:-38.5+side*2.25,z:-27.48,y:.54,rotation:0});
 });
 // Casas populares, quintais e vegetação para dar escala e vida ao bairro.
 const addTree=(x,z,scale=1)=>{
  const trunk=mat('#765036',1),leafA=mat('#477b3e',1),leafB=mat('#5b9148',1);
  const t=new THREE.Mesh(new THREE.CylinderGeometry(.13*scale,.2*scale,1.55*scale,7),trunk);t.position.set(x,.76*scale,z);target.add(t);
  const crown=new THREE.Mesh(new THREE.SphereGeometry(.92*scale,8,7),leafA);crown.position.set(x,1.85*scale,z);target.add(crown);
  const crown2=new THREE.Mesh(new THREE.SphereGeometry(.62*scale,7,6),leafB);crown2.position.set(x+.35*scale,2.12*scale,z+.08*scale);target.add(crown2);
  addCityCollision(x,z,.48*scale,.48*scale,.12);
 };
 const addStreetLamp=(x,z)=>{
  const pole=mat('#555c5d',.82),lamp=mat('#f4df9a',.45);
  const p=new THREE.Mesh(new THREE.CylinderGeometry(.055,.085,4.4,8),pole);p.position.set(x,2.2,z);target.add(p);
  const arm=box(.85,.07,.07,pole,x+.34,4.25,z);arm.rotation.z=-.16;
  box(.48,.16,.28,lamp,x+.68,4.16,z);
  addCityCollision(x,z,.28,.28,.08);
 };
 const addHouse=(x,z,front,color,roofColor)=>{
  const w=7.4,d=6.1,h=2.9,rise=1.05;
  addCityCollision(x,z,w+1.1,d+1.2,.42);
  const wall=mat(color,.96),roof=mat(roofColor,.92),edge=mat('#e7dfcf',.9),glass=mat('#263f48',.34),door=mat('#65452f',.88),frame=mat('#eee4d2',.88),metal=mat('#515b5d',.82);
  const face=z+front*(d/2+.045),sideFace=x+w/2+.025;
  // Alicerce, paredes rebocadas e rodapé de cimento.
  box(w+1.25,.12,d+1.25,mat('#9d896e',1),x,-.105,z);
  box(w+.12,.32,d+.12,mat('#827b70',1),x,.12,z);
  box(w,h,d,wall,x,h/2+.22,z);
  // Frontões triangulares nas duas extremidades, em vez de uma cobertura cúbica.
  const gableShape=new THREE.Shape();gableShape.moveTo(-w/2,0);gableShape.lineTo(w/2,0);gableShape.lineTo(0,rise);gableShape.closePath();
  const gableGeo=new THREE.ShapeGeometry(gableShape);
  const gableFront=new THREE.Mesh(gableGeo,wall);gableFront.position.set(x,h+.22,face-front*.025);if(front<0)gableFront.rotation.y=Math.PI;target.add(gableFront);
  const gableBack=new THREE.Mesh(gableGeo,wall);gableBack.position.set(x,h+.22,z-front*(d/2+.02));if(front>0)gableBack.rotation.y=Math.PI;target.add(gableBack);
  // Telhado de duas águas com beirais e cumeeira.
  const slope=Math.atan2(rise,d/2+.42),roofLength=Math.hypot(d/2+.42,rise);
  const roofFront=box(w+.72,.18,roofLength,roof,x,h+.22+rise/2,z+front*d/4);
  roofFront.rotation.x=front*slope;
  const roofBack=box(w+.72,.18,roofLength,roof,x,h+.22+rise/2,z-front*d/4);
  roofBack.rotation.x=-front*slope;
  box(w+.9,.2,.22,roof,x,h+.22+rise,z);
  // Remates claros nas empenas e beirais.
  [-1,1].forEach(side=>box(.12,.16,d+.72,edge,x+side*(w/2+.34),h+.17,z));
  box(w+.9,.12,.14,edge,x,h+.02,face+front*.12);
  // Porta principal, degrau, puxador e pequeno alpendre.
  box(1.02,2.12,.14,door,x,.99,face);
  box(1.13,.1,.18,frame,x,2.08,face+front*.025);
  box(.1,2.18,.18,frame,x-.56,1.04,face+front*.025);
  box(.1,2.18,.18,frame,x+.56,1.04,face+front*.025);
  const handle=new THREE.Mesh(new THREE.SphereGeometry(.055,8,6),metal);handle.position.set(x+.34,1.02,face+front*.11);target.add(handle);
  box(1.5,.14,1.05,roof,x,2.35,face+front*.52);
  [-.62,.62].forEach(dx=>box(.09,.95,.09,metal,x+dx,1.9,face+front*.82));
  box(1.55,.16,.7,mat('#77736b',1),x,.12,face+front*.45);
  // Duas janelas com caixilharia, divisória central, peitoril e protecção.
  [-1,1].forEach(side=>{
   const wx=x+side*2.15,wy=1.78;
   box(1.34,1.02,.12,glass,wx,wy,face+front*.035);
   box(1.48,.1,.18,frame,wx,wy+.57,face+front*.045);
   box(1.48,.1,.18,frame,wx,wy-.57,face+front*.045);
   box(.1,1.2,.18,frame,wx-.74,wy,face+front*.045);
   box(.1,1.2,.18,frame,wx+.74,wy,face+front*.045);
   box(.07,1.02,.2,metal,wx,wy,face+front*.1);
   box(1.34,.07,.2,metal,wx,wy,face+front*.1);
   box(1.65,.13,.28,edge,wx,wy-.68,face+front*.1);
   // Pequenas portadas laterais, típicas de casas de bairro.
   [-1,1].forEach(a=>box(.16,.92,.1,mat('#8a765d',.95),wx+a*.84,wy,face+front*.015));
  });
  // Tubo de queda de água e caleira na fachada.
  box(.09,2.8,.09,metal,x+w/2-.18,1.55,face+front*.18);
  // Depósito de água no quintal, colocado atrás do telhado para não flutuar.
  const tank=new THREE.Mesh(new THREE.CylinderGeometry(.48,.48,.72,14),mat('#a9b9bc',.8));
  tank.position.set(x+w*.32,h+.48,z-front*.42);target.add(tank);
  const tankTop=new THREE.Mesh(new THREE.CylinderGeometry(.22,.22,.06,12),metal);tankTop.position.set(tank.position.x,h+.87,tank.position.z);target.add(tankTop);
  // Quintal murado baixo e portão de entrada com pilares.
  const gateZ=face+front*.95,wallMat=mat('#b7aa91',1),gateMat=mat('#505b5b',.82);
  box(.18,.82,1.05,wallMat,x-w*.48,.41,gateZ);
  box(.18,.82,1.05,wallMat,x+w*.48,.41,gateZ);
  box(w*.82,.62,.16,wallMat,x,.31,gateZ+front*1.25);
  box(1.55,.92,.1,gateMat,x,.46,gateZ);
  for(let k=0;k<7;k++)box(.035,.82,.12,metal,x-.66+k*.22,.46,gateZ+front*.06);
  box(1.68,.07,.14,metal,x,.88,gateZ+front*.06);
 };;
 [
  [-56,-56,1,'#d6b88f','#77736a'],[-28,-56,1,'#c9d0b2','#82796b'],[0,-56,1,'#d5b5a0','#77736a'],[56,-56,1,'#c6b99e','#81796c'],
  [-56,56,-1,'#d0bd9b','#77736a'],[0,56,-1,'#c7b5a0','#81796c'],[56,56,-1,'#d3c69f','#77736a'],
  [-56,-28,1,'#c5b7a0','#77736a'],[56,0,-1,'#d0b99f','#81796c'],[-56,28,1,'#c6c6a9','#77736a']
 ].forEach(([x,z,front,c,r])=>addHouse(x,z,front,c,r));
 // Novo anel residencial periférico, afastado das infraestruturas principais.
 [
  [-84,-84,1,'#d7c19b','#77736a'],[0,-84,1,'#c9d0b2','#82796b'],[84,-84,1,'#d5b5a0','#77736a'],
  [-84,0,1,'#c5b7a0','#77736a'],[84,0,-1,'#d0b99f','#81796c'],
  [-84,84,-1,'#d0bd9b','#77736a'],[0,84,-1,'#c7b5a0','#81796c'],[84,84,-1,'#d3c69f','#77736a'],
  [-28,84,-1,'#d8c7a8','#756e64'],[28,84,-1,'#c8cbb7','#77736a'],[28,-84,1,'#d4b6a1','#81796c']
 ].forEach(([x,z,front,c,r])=>addHouse(x,z,front,c,r));
 [-56,-28,0,56].forEach(x=>[-34,-6,22,50].forEach(z=>addTree(x+(x<0?-1.8:1.8),z,.78)));
 [-56,-28,0,56].forEach(x=>[-34,-6,22,50].forEach(z=>addStreetLamp(x+(x<0?2.8:-2.8),z+2)));
 const binMat=mat('#3e6655',.9),binLid=mat('#263e35',.9);
 [[9,8],[-33,8],[35,36],[-5,-34],[60,8]].forEach(([x,z])=>{box(.72,.9,.62,binMat,x,.45,z);box(.78,.09,.68,binLid,x,.94,z)});
 const addParkedCar=(x,z,color,rot=0)=>{
  const g=createDetailedCar(color,false);
  g.position.set(x,0,z);g.rotation.y=rot;target.add(g);
  cityDrivableCars.push({group:g,label:'Carro',driver:null,patrol:null});
 };
 addParkedCar(9,-9,'#a83e36',Math.PI/2);addParkedCar(-9,9,'#d0c8b6',Math.PI/2);addParkedCar(35,-8,'#426b86',Math.PI/2);addParkedCar(-35,8,'#b8a13d',Math.PI/2);
 buildVianaPoliceStation();
 // Patrulha autónoma inicial: dois agentes percorrem a rua em frente à esquadra.
 const patrolOne=addPoliceOfficer(18.5,-10.5,0,1,true,false);
 const patrolTwo=addPoliceOfficer(37.5,-10.5,Math.PI,1,true,false);
 cityPoliceAgents.push(
  {group:patrolOne,route:[{x:18.5,z:-10.5},{x:25,z:-9.2},{x:32,z:-9.2},{x:37.5,z:-10.5},{x:32,z:-11.2},{x:25,z:-11.2}],waypoint:1,mode:'patrol',phase:0},
  {group:patrolTwo,route:[{x:37.5,z:-10.5},{x:32,z:-11.2},{x:25,z:-11.2},{x:18.5,z:-10.5},{x:25,z:-9.2},{x:32,z:-9.2}],waypoint:1,mode:'patrol',phase:Math.PI}
 );
 // Viatura com agente ao volante: circuito contínuo pelas avenidas e ruas periféricas.
 const patrolCar=createDetailedCar('#e8ecee',true);
 patrolCar.position.set(42,0,-14);patrolCar.rotation.y=0;target.add(patrolCar);
 const driver=addPoliceOfficer(0,0,Math.PI/2,1,true,true);
 target.remove(driver);patrolCar.add(driver);driver.position.set(-.48,.10,0);driver.scale.setScalar(.45);
 const vehicleRoute=[
  {x:42,z:-14},{x:42,z:-42},{x:14,z:-42},{x:-14,z:-42},{x:-42,z:-42},{x:-70,z:-42},
  {x:-70,z:-14},{x:-70,z:14},{x:-42,z:14},{x:-14,z:14},{x:14,z:14},{x:42,z:14},{x:70,z:14},
  {x:70,z:42},{x:42,z:42},{x:14,z:42},{x:-14,z:42},{x:-42,z:42},{x:-70,z:42},
  {x:-70,z:70},{x:-42,z:70},{x:-14,z:70},{x:14,z:70},{x:42,z:70},{x:70,z:70},
  {x:70,z:42},{x:70,z:14},{x:70,z:-14},{x:70,z:-42},{x:70,z:-70},{x:42,z:-70},
  {x:14,z:-70},{x:-14,z:-70},{x:-42,z:-70},{x:-70,z:-70},{x:-70,z:-42}
 ];
 const policePatrol={group:patrolCar,route:vehicleRoute,waypoint:1,speed:5.8};
 cityPoliceVehicles.push(policePatrol);
 cityDrivableCars.push({group:patrolCar,label:'Viatura policial',driver,patrol:policePatrol});
 buildVianaOtherBuildings();
}

if(kind==='room'){
 const roomHouseGuests=new Map();activeHouseGuestSync=payload=>{if(!payload||payload.house_host_id!==user?.id||payload.zone!=='visiting-house'){const id=payload?.user_id;if(id&&roomHouseGuests.has(id)){const old=roomHouseGuests.get(id);target.remove(old);target.userData.characters=target.userData.characters.filter(ch=>ch!==old);roomHouseGuests.delete(id)}return}let guest=roomHouseGuests.get(payload.user_id);if(!guest){guest=buildCharacter(target,payload.avatar||{gender:'male',skin:'#b77b5c',hair:'#241b18',shirt:'#f2f2ee',pants:'#e6e8ee'},{x:Number(payload.x)||0,y:-.03,z:Number(payload.z)||0},()=>{},true);guest.userData.remotePlayerId=payload.user_id;roomHouseGuests.set(payload.user_id,guest)}guest.position.set(Number(payload.x)||0,-.03,Number(payload.z)||0);guest.rotation.y=Number(payload.rotation)||0;guest.userData.actionState={type:payload.walking?'walk':'idle',time:0}};
 // Protecção: um erro num móvel, porta ou interior especial nunca pode deixar a divisão invisível.
 try{buildRoom(roomName)}catch(roomError){
  console.error('Erro ao construir o interior '+roomName+'; a carregar interior de segurança:',roomError);
  target.clear();roomDoorMeshes=[];activeRoomDoor=null;
  const safeFloor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({color:'#c5b99e',side:THREE.DoubleSide}));
  safeFloor.rotation.x=-Math.PI/2;safeFloor.position.y=-.08;target.add(safeFloor);
  const safeWall=new THREE.MeshBasicMaterial({color:'#d8dedf',side:THREE.DoubleSide});
  const addSafeWall=(w,h,x,y,z,rot=0)=>{const wall=new THREE.Mesh(new THREE.PlaneGeometry(w,h),safeWall);wall.position.set(x,y,z);wall.rotation.y=rot;target.add(wall)};
  addSafeWall(8,3.6,0,1.65,-4);addSafeWall(8,3.6,0,1.65,4);addSafeWall(8,3.6,-4,1.65,0,Math.PI/2);addSafeWall(8,3.6,4,1.65,0,Math.PI/2);
 }
 if(target.children.length===0){
  const safeFloor=new THREE.Mesh(new THREE.PlaneGeometry(8,8),new THREE.MeshBasicMaterial({color:'#c5b99e',side:THREE.DoubleSide}));
  safeFloor.rotation.x=-Math.PI/2;safeFloor.position.y=-.08;target.add(safeFloor);
  const safeWall=new THREE.MeshBasicMaterial({color:'#d8dedf',side:THREE.DoubleSide});
  for(const [x,y,z,rot] of [[0,1.65,-4,0],[0,1.65,4,0],[-4,1.65,0,Math.PI/2],[4,1.65,0,Math.PI/2]]){const wall=new THREE.Mesh(new THREE.PlaneGeometry(8,3.6),safeWall);wall.position.set(x,y,z);wall.rotation.y=rot;target.add(wall)}
 }
 const initialSpawn=entrySpawn||{x:0,z:1.65,face:0};houseAvatar=buildCharacter(target,avatar,{x:initialSpawn.x||0,y:-.03,z:initialSpawn.z??1.65},m=>mixer=m,true);houseAvatar.position.y=-.03;houseAvatar.rotation.y=initialSpawn.face||0;camera.position.set(0,2.5,10.5);camera.lookAt(0,.12,0);
const nav=$('room-door-nav'),current=$('room-current');if(current)current.textContent=roomNames[roomName]||'CASA';if(nav){nav.innerHTML='';roomDoorMeshes.filter(o=>o.isGroup&&o.userData.roomDoor).forEach(door=>{const b=document.createElement('button');b.type='button';b.textContent='⬇ '+door.userData.door.label;b.onclick=()=>{activeRoomDoor=door.userData.door;const label=$('room-enter-label');if(label)label.textContent='Entrar em '+activeRoomDoor.label;$('room-enter-prompt').classList.remove('hidden')};nav.appendChild(b)});if(roomName==='hotel'){for(let i=1;i<=10;i++){const b=document.createElement('button');b.type='button';b.textContent='SUÍTE '+String(i).padStart(2,'0')+' · DISPONÍVEL';b.onclick=()=>renderHome('hotel-suite-'+i,{x:0,z:2.6,face:Math.PI});nav.appendChild(b)}}}if(roomName==='bar')installBarSceneActions();if(roomName==='party'&&nav){const music=document.createElement('button');music.id='party-dj-action';music.type='button';music.textContent='🎧 OUVIR MÚSICA DO DJ';music.onclick=()=>{wakeGameAudio();openBarMusicPanel('party')};nav.appendChild(music)}const prompt=$('room-enter-prompt');if(prompt)prompt.classList.add('hidden')
}else if(kind==='city'){activeHouseGuestSync=null;buildVianaStreets();const citySpawn=entrySpawn||{x:14,z:-14};houseAvatar=buildCharacter(target,avatar,{x:citySpawn.x,y:-.03,z:citySpawn.z},m=>mixer=m,true);socialLocalPosition={x:citySpawn.x,z:citySpawn.z};const remoteCityPlayers=new Map();activeCityRemoteSync=payload=>{if(!payload||payload.user_id===user?.id)return;let remote=remoteCityPlayers.get(payload.user_id);if(payload.zone!=='city'){if(remote){target.remove(remote);target.userData.characters=target.userData.characters.filter(ch=>ch!==remote);remoteCityPlayers.delete(payload.user_id)}return}if(!remote){remote=buildCharacter(target,payload.avatar||{gender:'male',skin:'#b77b5c',hair:'#241b18',shirt:'#f2f2ee',pants:'#e6e8ee'}, {x:Number(payload.x)||0,y:-.03,z:Number(payload.z)||0},()=>{},true);remote.userData.remotePlayerId=payload.user_id;remoteCityPlayers.set(payload.user_id,remote)}remote.position.set(Number(payload.x)||0,-.03,Number(payload.z)||0);remote.rotation.y=Number(payload.rotation)||0;remote.userData.actionState={type:payload.walking?'walk':'idle',time:0}};for(const state of socialRemoteStates.values())activeCityRemoteSync(state);camera.position.set(citySpawn.x+28,42,citySpawn.z+28);camera.lookAt(citySpawn.x,0,citySpawn.z);const syncCityVehicles=async()=>{const {data,error}=await sb.from('player_vehicles').select('id,owner_id,model,color,is_stored,pos_x,pos_z,rotation,passenger_ids').eq('is_stored',false);if(error){console.error('Veículos da cidade:',error);return}const rows=data||[],ids=new Set(rows.map(v=>v.id));for(const existing of [...cityDrivableCars]){if(existing.vehicleId&&!ids.has(existing.vehicleId)){if(vehicleState?.vehicle===existing)exitVehicle();target.remove(existing.group);cityDrivableCars.splice(cityDrivableCars.indexOf(existing),1)}}for(const row of rows){let vehicle=cityDrivableCars.find(v=>v.vehicleId===row.id);if(!vehicle){const car=createDetailedCar(row.color||'#a83e36',false);car.position.set(Number(row.pos_x)||0,0,Number(row.pos_z)||0);car.rotation.y=Number(row.rotation)||0;car.userData.vehicleId=row.id;target.add(car);vehicle={group:car,label:row.model,driver:null,patrol:null,ownerId:row.owner_id,vehicleId:row.id};cityDrivableCars.push(vehicle)}else{if(vehicleState?.vehicle!==vehicle){vehicle.group.position.set(Number(row.pos_x)||0,0,Number(row.pos_z)||0);vehicle.group.rotation.y=Number(row.rotation)||0}vehicle.ownerId=row.owner_id;vehicle.label=row.model}}};syncCityVehicles();playerVehicleRealtimeChannel=sb.channel('player-vehicles-city-'+user.id).on('postgres_changes',{event:'*',schema:'public',table:'player_vehicles'},()=>syncCityVehicles()).subscribe()}else{const studioFloor=new THREE.Mesh(new THREE.PlaneGeometry(12,12),mat('#382b3d',.92));studioFloor.rotation.x=-Math.PI/2;studioFloor.position.y=-.015;target.add(studioFloor);const studioWall=new THREE.Mesh(new THREE.PlaneGeometry(10,4),mat('#251d2b',1));studioWall.position.set(0,2,-1.8);target.add(studioWall);const mirror=new THREE.Mesh(new THREE.TorusGeometry(1.05,.045,12,64),mat('#d8b35f',.3));mirror.position.set(0,1,-1.55);target.add(mirror);const displayRing=new THREE.Mesh(new THREE.TorusGeometry(.82,.025,8,48),mat('#e7c66c',.28));displayRing.rotation.x=Math.PI/2;displayRing.position.y=.018;target.add(displayRing);buildCharacter(target,avatar,{x:0,y:0,z:0},m=>mixer=m);camera.position.set(0,1.12,3.65);camera.lookAt(0,.86,0)}
const isLargeVenue=kind==='room'&&(roomName==='bar'||roomName==='party'),isExpandedInterior=kind==='room'&&['market','quarry','cars','esquadra'].includes(roomName),roomLimit=isLargeVenue?17.15:isExpandedInterior?9.15:3.35;
let destination=null;const moveKeys={forward:false,backward:false,left:false,right:false};
const driveKeys={accelerate:false,brake:false,left:false,right:false};let vehicleState=null,nearbyVehicle=null;
let dragging=false,lastX=0,lastY=0,moved=false,theta=Math.PI/4,phi=.92,distance=isLargeVenue?31:isExpandedInterior?25:13.5,pinchStart=0,pinchDistance=0;
const cameraTarget=new THREE.Vector3(0,0,0);
function updateOrbit(){phi=THREE.MathUtils.clamp(phi,kind==='city'?.38:.72,kind==='city'?1.05:.98);distance=THREE.MathUtils.clamp(distance,kind==='city'?6:(isLargeVenue?16:10),kind==='city'?95:((isLargeVenue||isExpandedInterior)?48:18));camera.position.set(cameraTarget.x+Math.sin(theta)*Math.cos(phi)*distance,cameraTarget.y+Math.sin(phi)*distance,cameraTarget.z+Math.cos(theta)*Math.cos(phi)*distance);camera.lookAt(cameraTarget)}
function enterVehicle(vehicle){if(kind!=='city'||vehicleState||!houseAvatar||!vehicle?.group||vehicle.ownerId!==user?.id||!vehicle.vehicleId)return;const car=vehicle.group;vehicleState={vehicle,speed:0,originalScale:houseAvatar.scale.clone(),syncElapsed:0,syncPending:false};window.__angolaCurrentVehicleId=vehicle.vehicleId;window.__angolaExitVehicle=exitVehicle;target.remove(houseAvatar);car.add(houseAvatar);houseAvatar.position.set(-.43,.10,.18);houseAvatar.rotation.set(0,Math.PI/2,0);houseAvatar.scale.multiplyScalar(.44);houseAvatar.userData.actionState={type:'sit',time:0,vehicle:true};houseAvatar.visible=true;if(vehicle.driver)vehicle.driver.visible=false;destination=null;velocityX=0;velocityZ=0;Object.keys(driveKeys).forEach(k=>driveKeys[k]=false);$('vehicle-prompt')?.classList.add('hidden');$('vehicle-controls')?.classList.remove('hidden');$('character-actions')?.classList.add('hidden');$('move-pad')?.classList.add('hidden');$('room-enter-prompt')?.classList.add('hidden');theta=Math.atan2(-Math.cos(car.rotation.y),Math.sin(car.rotation.y));phi=.48;distance=10.5;cameraTarget.set(car.position.x,.12,car.position.z);updateOrbit()}
function exitVehicle(){if(!vehicleState||!houseAvatar)return;const {vehicle,originalScale}=vehicleState,car=vehicle.group,yaw=car.rotation.y;const offsets=[new THREE.Vector3(-.2,0,-1.22),new THREE.Vector3(-.2,0,1.22)];let exitPoint=null;for(const offset of offsets){offset.applyAxisAngle(new THREE.Vector3(0,1,0),yaw);const candidate=new THREE.Vector3(car.position.x+offset.x,-.03,car.position.z+offset.z);if(!cityBlocked(candidate.x,candidate.z,.4)){exitPoint=candidate;break}}if(!exitPoint)exitPoint=new THREE.Vector3(car.position.x,-.03,car.position.z+2.1);car.remove(houseAvatar);target.add(houseAvatar);houseAvatar.position.copy(exitPoint);houseAvatar.rotation.set(0,yaw+Math.PI/2,0);houseAvatar.scale.copy(originalScale);houseAvatar.userData.actionState={type:'idle',time:0};houseAvatar.visible=true;if(vehicle.driver)vehicle.driver.visible=true;vehicleState=null;window.__angolaCurrentVehicleId=null;window.__angolaExitVehicle=null;velocityX=0;velocityZ=0;Object.keys(driveKeys).forEach(k=>driveKeys[k]=false);$('vehicle-controls')?.classList.add('hidden');$('character-actions')?.classList.remove('hidden');$('move-pad')?.classList.remove('hidden');$('vehicle-prompt')?.classList.add('hidden');theta=Math.atan2(-Math.cos(yaw),Math.sin(yaw));cameraTarget.set(houseAvatar.position.x,0,houseAvatar.position.z);updateOrbit()}
const vehicleEnterButton=$('vehicle-enter-button'),vehicleExitButton=$('vehicle-exit-button');if(vehicleEnterButton)vehicleEnterButton.onclick=()=>{if(nearbyVehicle)enterVehicle(nearbyVehicle)};if(vehicleExitButton)vehicleExitButton.onclick=exitVehicle;
function standCharacterUp(){if(!houseAvatar||houseAvatar.userData.actionState?.type!=='sit')return;const seat=houseAvatar.userData.actionState.seat;if(seat){const offset=new THREE.Vector3(0,0,.62).applyAxisAngle(new THREE.Vector3(0,1,0),seat.rotation||0);houseAvatar.position.x+=offset.x;houseAvatar.position.z+=offset.z}houseAvatar.position.y=-.03;houseAvatar.userData.actionState={type:'idle',time:0};}
function sitCharacter(){if(!houseAvatar||!nearbySeat||vehicleState)return;destination=null;velocityX=0;velocityZ=0;houseAvatar.position.set(nearbySeat.x,(nearbySeat.y||.55)-.86,nearbySeat.z);houseAvatar.rotation.y=nearbySeat.rotation||0;houseAvatar.userData.actionState={type:'sit',time:0,seat:nearbySeat};}
function waveCharacter(){if(!houseAvatar||vehicleState)return;if(houseAvatar.userData.actionState?.type==='sit')standCharacterUp();houseAvatar.userData.actionState={type:'wave',time:0};}
const sitButton=$('character-sit-button'),waveButton=$('character-wave-button');
if(sitButton)sitButton.onclick=()=>{if(houseAvatar?.userData.actionState?.type==='sit')standCharacterUp();else sitCharacter()};
if(waveButton)waveButton.onclick=waveCharacter;
if(kind==='city'){theta=Math.PI/4;phi=.72;distance=26;if(houseAvatar)cameraTarget.set(houseAvatar.position.x,0,houseAvatar.position.z)}if(kind==='room'||kind==='city')updateOrbit();
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),.03),hit=new THREE.Vector3();
const setDestination=e=>{const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(raycaster.ray.intersectPlane(ground,hit)){const limit=kind==='city'?98:roomLimit;destination=new THREE.Vector3(THREE.MathUtils.clamp(hit.x,-limit,limit),-.03,THREE.MathUtils.clamp(hit.z,-limit,limit))}};
const onPointerDown=e=>{if(e.button!==undefined&&e.button!==0)return;wakeGameAudio();dragging=true;moved=false;lastX=e.clientX;lastY=e.clientY;};
const onPointerMove=e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>3)moved=true;lastX=e.clientX;lastY=e.clientY;if(moved){if(kind==='room'||kind==='city'){theta-=dx*.009;phi=THREE.MathUtils.clamp(phi+dy*.006,kind==='city'?.42:.62,kind==='city'?1.15:1.12);updateOrbit()}else{target.rotation.y+=dx*.008}}};
const onPointerUp=e=>{if(!dragging)return;dragging=false;if(kind==='city'&&!moved){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);const entryHit=raycaster.intersectObjects(policeEntryMeshes,true)[0];if(entryHit?.object.userData.worldEntry){const entry=entryHit.object.userData.worldEntry;destination=new THREE.Vector3(entry.x,-.03,entry.z+entry.front*(entry.d/2+1.55))}else if(entryHit?.object.userData.hospitalEntry){destination=new THREE.Vector3(-28,-.03,-23.1)}else if(entryHit){destination=new THREE.Vector3(28,-.03,-20.224)}else{setDestination(e)}}else if(kind==='room'&&!moved){const rect=renderer.domElement.getBoundingClientRect();pointer.x=((e.clientX-rect.left)/rect.width)*2-1;pointer.y=-((e.clientY-rect.top)/rect.height)*2+1;raycaster.setFromCamera(pointer,camera);if(roomName==='cars'){const staffHit=raycaster.intersectObjects(workAgents.map(agent=>agent.group).filter(Boolean),true).find(hit=>{let node=hit.object;while(node&&!node.userData.workRole)node=node.parent;return !!node?.userData.workRole});if(staffHit){openCarPriceList();return}}const speakerHit=raycaster.intersectObjects(speakerMeshes,true)[0];if(speakerHit){openBarMusicPanel(roomName);return}const hits=raycaster.intersectObjects(roomDoorMeshes,true);const doorHit=hits.find(h=>h.object.userData.roomDoor||h.object.parent?.userData.roomDoor);if(doorHit){const obj=doorHit.object.userData.roomDoor?doorHit.object:doorHit.object.parent;activeRoomDoor=obj.userData.door;const prompt=$('room-enter-prompt'),label=$('room-enter-label');if(label)label.textContent='Entrar em '+(activeRoomDoor.label||'divisão');if(prompt)prompt.classList.remove('hidden')}else{setDestination(e)}}};
const touchDistance=touches=>Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY);
const onTouchStart=e=>{if(e.touches.length===2){e.preventDefault();dragging=false;pinchStart=touchDistance(e.touches);pinchDistance=distance}};
const onTouchMove=e=>{if(e.touches.length===2&&pinchStart>0){e.preventDefault();distance=THREE.MathUtils.clamp(pinchDistance*pinchStart/touchDistance(e.touches),kind==='city'?9:5,kind==='city'?95:(isLargeVenue?48:18));updateOrbit()}};
const onTouchEnd=e=>{if(e.touches.length<2)pinchStart=0};
renderer.domElement.addEventListener('touchstart',onTouchStart,{passive:false});renderer.domElement.addEventListener('touchmove',onTouchMove,{passive:false});renderer.domElement.addEventListener('touchend',onTouchEnd);renderer.domElement.addEventListener('touchcancel',onTouchEnd);
renderer.domElement.addEventListener('pointerdown',onPointerDown);window.addEventListener('pointermove',onPointerMove);window.addEventListener('pointerup',onPointerUp);
const onKeyDown=e=>{wakeGameAudio();if((kind!=='room'&&kind!=='city')||$('page-home').classList.contains('hidden'))return;const key=e.key.toLowerCase();if(kind==='city'&&key==='e'&&!vehicleState&&nearbyVehicle){enterVehicle(nearbyVehicle);e.preventDefault();return}if(kind==='city'&&vehicleState&&(key==='f'||key==='escape')){exitVehicle();e.preventDefault();return}if(kind==='city'&&vehicleState){const dm={w:'accelerate',arrowup:'accelerate',s:'brake',arrowdown:'brake',a:'left',arrowleft:'left',d:'right',arrowright:'right'};if(dm[key]){driveKeys[dm[key]]=true;e.preventDefault()}return}const map={w:'forward',arrowup:'forward',s:'backward',arrowdown:'backward',a:'left',arrowleft:'left',d:'right',arrowright:'right'};if(map[key]){moveKeys[map[key]]=true;e.preventDefault()}};
const onKeyUp=e=>{const key=e.key.toLowerCase(),map={w:'forward',arrowup:'forward',s:'backward',arrowdown:'backward',a:'left',arrowleft:'left',d:'right',arrowright:'right'},dm={w:'accelerate',arrowup:'accelerate',s:'brake',arrowdown:'brake',a:'left',arrowleft:'left',d:'right',arrowright:'right'};if(map[key])moveKeys[map[key]]=false;if(dm[key])driveKeys[dm[key]]=false};
window.addEventListener('keydown',onKeyDown);window.addEventListener('keyup',onKeyUp);
const moveButtons=[...host.querySelectorAll('[data-move]')];let activePadKey=null;const onPadDown=e=>{const b=e.target.closest('[data-move]');if(!b)return;wakeGameAudio();e.preventDefault();activePadKey=b.dataset.move;moveKeys[activePadKey]=true};const clearPad=()=>{if(activePadKey){moveKeys[activePadKey]=false;activePadKey=null}};moveButtons.forEach(b=>b.addEventListener('pointerdown',onPadDown));const driveButtons=[...host.querySelectorAll('[data-drive]')];let activeDriveKey=null;const onDriveDown=e=>{const b=e.target.closest('[data-drive]');if(!b||!vehicleState)return;e.preventDefault();activeDriveKey=b.dataset.drive;driveKeys[activeDriveKey]=true};const clearDrive=()=>{if(activeDriveKey){driveKeys[activeDriveKey]=false;activeDriveKey=null}};driveButtons.forEach(b=>b.addEventListener('pointerdown',onDriveDown));
const blockGameBrowserMenu=e=>{if(e.target.closest?.('#vehicle-controls, #move-pad, #vehicle-prompt, canvas'))e.preventDefault()};
host.addEventListener('contextmenu',blockGameBrowserMenu);host.addEventListener('selectstart',blockGameBrowserMenu);host.addEventListener('dragstart',blockGameBrowserMenu);
const onWindowBlur=()=>{Object.keys(moveKeys).forEach(k=>moveKeys[k]=false);Object.keys(driveKeys).forEach(k=>driveKeys[k]=false);activePadKey=null;activeDriveKey=null};window.addEventListener('pointerup',clearPad);window.addEventListener('pointercancel',clearPad);window.addEventListener('pointerup',clearDrive);window.addEventListener('pointercancel',clearDrive);window.addEventListener('blur',onWindowBlur);
let velocityX=0,velocityZ=0,walkPhase=0,raf,lastFrame=0,receptionShown=false;const animate=(now=0)=>{raf=requestAnimationFrame(animate);if(document.hidden||now-lastFrame<33)return;const delta=Math.min(clock.getDelta(),.05);lastFrame=now;if(mixer)mixer.update(delta);
if(kind==='room'&&roomName==='bar')updateBarServiceAI(delta,now);
for(const agent of workAgents){
 const npc=agent.group;if(!npc)continue;
 const point=agent.route[agent.waypoint],dx=point.x-npc.position.x,dz=point.z-npc.position.z,dist=Math.hypot(dx,dz);
 if(dist<.12){agent.pause+=delta;if(agent.pause>1.8){agent.pause=0;agent.waypoint=(agent.waypoint+1)%agent.route.length;agent.state='working'}else{agent.state='working';npc.userData.actionState={type:'idle',time:(npc.userData.actionState?.time||0)+delta};continue}}
 else{const step=Math.min(dist,0.62*delta);npc.position.x+=dx/dist*step;npc.position.z+=dz/dist*step;npc.rotation.y=Math.atan2(dx,dz);agent.state='walking';updateFallbackHumanGait(npc,delta,.62,true);npc.userData.actionState={type:'idle',time:0}}
}
for(const character of target.userData.characters||[]){if(character===houseAvatar||character.userData.characterMixer===mixer)continue;const isPatrol=cityPoliceAgents.some(agent=>agent.group===character);if(!isPatrol&&character.userData.characterMixer)character.userData.characterMixer.update(delta);if(!isPatrol)updateCharacterActionPose(character,delta)}
if(kind==='city'&&cityPoliceAgents.length){
 for(const agent of cityPoliceAgents){
  const officer=agent.group,player=houseAvatar;if(!officer)continue;
  let dx=0,dz=0,playerDistance=Infinity;
  if(player){dx=player.position.x-officer.position.x;dz=player.position.z-officer.position.z;playerDistance=Math.hypot(dx,dz)}
  if(playerDistance<4.8)agent.mode='investigate';else if(playerDistance>6.5&&agent.mode==='investigate')agent.mode='patrol';
  let tx,tz,speed;
  if(agent.mode==='investigate'&&player){const distance=Math.max(.001,playerDistance);tx=player.position.x-dx/distance*1.35;tz=player.position.z-dz/distance*1.35;speed=.82;}
  else{const point=agent.route[agent.waypoint];tx=point.x;tz=point.z;speed=.58;if(Math.hypot(tx-officer.position.x,tz-officer.position.z)<.42)agent.waypoint=(agent.waypoint+1)%agent.route.length;}
  const vx=tx-officer.position.x,vz=tz-officer.position.z,dist=Math.hypot(vx,vz),walking=dist>.16;
  if(walking){const step=Math.min(dist,speed*delta);officer.position.x+=vx/dist*step;officer.position.z+=vz/dist*step;const wanted=Math.atan2(vx,vz);let turn=(wanted-officer.rotation.y+Math.PI)%(Math.PI*2);if(turn<0)turn+=Math.PI*2;turn-=Math.PI;officer.rotation.y+=turn*(1-Math.exp(-8*delta));}
  else if(agent.mode==='investigate'&&player){const wanted=Math.atan2(dx,dz);let turn=(wanted-officer.rotation.y+Math.PI)%(Math.PI*2);if(turn<0)turn+=Math.PI*2;turn-=Math.PI;officer.rotation.y+=turn*(1-Math.exp(-8*delta));}
  if(officer.userData.officerMixer)officer.userData.officerMixer.update(delta);
  const actions=officer.userData.animationActions;
  if(actions){actions.walk.setEffectiveWeight(walking?1:0);actions.idle.setEffectiveWeight(walking?0:1);actions.walk.setEffectiveTimeScale(.9);}
  else if(officer.userData.fallbackRig){updateFallbackHumanGait(officer,delta,walking?speed:0,walking);}
 }
}
if(kind==='room'&&roomName==='esquadra'&&houseAvatar&&!receptionShown){
 const receptionDistance=Math.hypot(houseAvatar.position.x,houseAvatar.position.z+0.15);
 if(receptionDistance<3.2){
  receptionShown=true;
  openLifePanel('Recepção da Esquadra','<p class="life-muted">Bom dia. Seja bem-vindo à esquadra. Em que podemos ajudar?</p><div class="life-list"><button class="secondary" id="police-reception-complaint">📝 Apresentar uma queixa</button><button class="secondary" id="police-reception-info">ℹ️ Pedir informações</button><button class="secondary" id="police-reception-security">🏠 Solicitar segurança para a minha casa</button><button class="secondary" id="police-reception-emergency">🚨 Comunicar um roubo ou perigo</button></div>');
  const bindReception=(id,title,body)=>{const b=$('life-panel').querySelector('#'+id);if(b)b.onclick=()=>openLifePanel(title,'<p class="life-muted">'+body+'</p><button class="secondary" id="police-reception-back">← Voltar à recepção</button>');};
  bindReception('police-reception-complaint','Registo de queixa','O recepcionista vai recolher o tipo de ocorrência, o local e a descrição. Este registo é uma simulação do jogo.');
  bindReception('police-reception-info','Informações da Polícia','O recepcionista pode orientar o cidadão sobre os serviços e procedimentos da esquadra.');
  bindReception('police-reception-security','Pedido de segurança residencial','O recepcionista regista a morada e o motivo do pedido para encaminhar uma patrulha. Esta função está em fase inicial.');
  bindReception('police-reception-emergency','Comunicação de emergência','Indica a ocorrência e o local. A esquadra recebe a comunicação dentro da simulação.');
  const panel=$('life-panel');panel.addEventListener('click',e=>{if(e.target?.id==='police-reception-back'){openLifePanel('Recepção da Esquadra','<p class="life-muted">Em que podemos ajudar?</p><button class="secondary" id="police-reception-complaint">📝 Apresentar uma queixa</button><button class="secondary" id="police-reception-info">ℹ️ Pedir informações</button><button class="secondary" id="police-reception-security">🏠 Solicitar segurança para a minha casa</button><button class="secondary" id="police-reception-emergency">🚨 Comunicar um roubo ou perigo</button>')}},{once:false});
 }
}
if(kind==='city')cityDrivableCars.forEach(v=>{if(v.group)v.group.visible=true});
if(kind==='city'&&cityPoliceVehicles.length){
 for(const patrol of cityPoliceVehicles){
  const car=patrol.group,point=patrol.route[patrol.waypoint];if(!car||!point||vehicleState?.vehicle?.group===car)continue;
  const dx=point.x-car.position.x,dz=point.z-car.position.z,dist=Math.hypot(dx,dz);
  if(dist<.65){patrol.waypoint=(patrol.waypoint+1)%patrol.route.length;continue}
  const step=Math.min(dist,patrol.speed*delta),nx=car.position.x+dx/dist*step,nz=car.position.z+dz/dist*step;const otherCar=cityDrivableCars.find(v=>v.group!==car&&Math.hypot(v.group.position.x-nx,v.group.position.z-nz)<2.12);if(otherCar){markVehicleCollision({group:car});markVehicleCollision(otherCar);patrol.waypoint=(patrol.waypoint+1)%patrol.route.length;car.visible=true;continue}car.position.x=nx;car.position.z=nz;car.visible=true;
  car.rotation.y=Math.atan2(-dz,dx);
 }
}
if(kind==='city'&&vehicleState){const car=vehicleState.vehicle.group;vehicleState.syncElapsed=(vehicleState.syncElapsed||0)+delta;if(vehicleState.syncElapsed>=1.5&&!vehicleState.syncPending){vehicleState.syncElapsed=0;vehicleState.syncPending=true;sb.rpc('move_player_vehicle',{p_vehicle_id:vehicleState.vehicle.vehicleId,p_x:car.position.x,p_z:car.position.z,p_rotation:car.rotation.y}).then(({error})=>{if(error)console.warn('Não foi possível sincronizar o veículo:',error);if(vehicleState)vehicleState.syncPending=false})}let speed=vehicleState.speed;if(driveKeys.accelerate)speed=Math.min(15,speed+7.2*delta);else if(driveKeys.brake){if(speed>.35)speed=Math.max(0,speed-13*delta);else speed=Math.max(-4.5,speed-5.2*delta)}else speed*=Math.exp(-1.65*delta);const steering=(driveKeys.left?1:0)-(driveKeys.right?1:0),steerAmount=Math.min(1,Math.abs(speed)/2.5);if(steering)car.rotation.y+=steering*delta*1.35*steerAmount*(speed>=0?1:-1);const nx=car.position.x+Math.cos(car.rotation.y)*speed*delta,nz=car.position.z-Math.sin(car.rotation.y)*speed*delta,axisX=Math.cos(car.rotation.y)*1.28,axisZ=-Math.sin(car.rotation.y)*1.28,blocked=[{x:nx,z:nz},{x:nx+axisX,z:nz+axisZ},{x:nx-axisX,z:nz-axisZ}].some(p=>cityBlocked(p.x,p.z,.48)),otherVehicle=cityDrivableCars.find(v=>v.group!==car&&Math.hypot(v.group.position.x-nx,v.group.position.z-nz)<2.12);if(!blocked&&!otherVehicle){car.position.x=nx;car.position.z=nz}else{speed=0;markVehicleCollision(vehicleState.vehicle);if(otherVehicle)markVehicleCollision(otherVehicle)}car.visible=true;vehicleState.speed=speed;houseAvatar.position.set(-.43,.10,.18);updateCharacterActionPose(houseAvatar,delta);cameraTarget.set(car.position.x,.12,car.position.z);theta=Math.atan2(-Math.cos(car.rotation.y),Math.sin(car.rotation.y));updateOrbit();const speedDisplay=$('vehicle-speed');if(speedDisplay)speedDisplay.textContent=Math.round(Math.abs(speed)*3.6)+' km/h'}
if((kind==='room'||kind==='city')&&houseAvatar&&!vehicleState){
 let inputX=0,inputZ=0;
 const forwardX=-Math.sin(theta),forwardZ=-Math.cos(theta),rightX=Math.cos(theta),rightZ=-Math.sin(theta);
 if(moveKeys.forward){inputX+=forwardX;inputZ+=forwardZ}if(moveKeys.backward){inputX-=forwardX;inputZ-=forwardZ}
 if(moveKeys.right){inputX+=rightX;inputZ+=rightZ}if(moveKeys.left){inputX-=rightX;inputZ-=rightZ}
 let hasInput=Math.hypot(inputX,inputZ)>.001;
 if(hasInput&&houseAvatar.userData.actionState?.type==='sit')standCharacterUp();if(hasInput&&houseAvatar.userData.actionState?.type==='wave')houseAvatar.userData.actionState={type:'idle',time:0};
 if(hasInput){const length=Math.hypot(inputX,inputZ);inputX/=length;inputZ/=length;destination=null}
 let desiredX=0,desiredZ=0;
 const speedLimit=kind==='city'?3.65:1.9;
 if(hasInput){desiredX=inputX*speedLimit;desiredZ=inputZ*speedLimit}
 else if(destination){const vx=destination.x-houseAvatar.position.x,vz=destination.z-houseAvatar.position.z,dist=Math.hypot(vx,vz);if(dist<.12){destination=null}else{desiredX=vx/dist*Math.min(speedLimit,dist/Math.max(delta,.001));desiredZ=vz/dist*Math.min(speedLimit,dist/Math.max(delta,.001))}}
 const response=1-Math.exp(-(hasInput?8:6.5)*delta);velocityX+=(desiredX-velocityX)*response;velocityZ+=(desiredZ-velocityZ)*response;
 const limit=kind==='city'?98:roomLimit;
 const oldX=houseAvatar.position.x,oldZ=houseAvatar.position.z,nextX=THREE.MathUtils.clamp(oldX+velocityX*delta,-limit,limit),nextZ=THREE.MathUtils.clamp(oldZ+velocityZ*delta,-limit,limit);
 if(kind==='city'){const radius=.38;if(!cityBlocked(nextX,oldZ,radius)){houseAvatar.position.x=nextX}else velocityX=0;if(!cityBlocked(houseAvatar.position.x,nextZ,radius)){houseAvatar.position.z=nextZ}else velocityZ=0}else{houseAvatar.position.x=nextX;houseAvatar.position.z=nextZ}
 if(Math.abs(houseAvatar.position.x)>=limit-.01)velocityX=0;if(Math.abs(houseAvatar.position.z)>=limit-.01)velocityZ=0;
 const speed=Math.hypot(velocityX,velocityZ),walking=speed>.035;
 if(walking){const wanted=Math.atan2(velocityX,velocityZ);let turn=(wanted-houseAvatar.rotation.y+Math.PI)%(Math.PI*2);if(turn<0)turn+=Math.PI*2;turn-=Math.PI;houseAvatar.rotation.y+=turn*(1-Math.exp(-8.5*delta))}
 houseAvatar.position.y=houseAvatar.userData.actionState?.type==='sit'?((houseAvatar.userData.actionState.seat?.y)||.55)-.86:-.03;
 const model=houseAvatar.userData.characterModel,actionType=houseAvatar.userData.actionState?.type||'idle';
 if(model){const actions=houseAvatar.userData.animationActions;if(actions){const walkWeight=actionType==='sit'||actionType==='wave'?0:(walking?THREE.MathUtils.clamp(speed/1.05,.0,1):0);actions.walk.setEffectiveWeight(walkWeight);actions.idle.setEffectiveWeight(1-walkWeight);actions.walk.setEffectiveTimeScale(THREE.MathUtils.clamp(speed/1.8,.85,1.15))}model.position.y=houseAvatar.userData.modelBaseY||0;model.rotation.z=0;model.rotation.x=0}
 updateCharacterActionPose(houseAvatar,delta);if(!model)updateFallbackHumanGait(houseAvatar,delta,speed,walking);
 if(kind==='city'){socialLocalPosition={x:houseAvatar.position.x,z:houseAvatar.position.z}}if(kind==='room'&&activeHouseVisit?.role==='visitor'&&socialWorldChannel&&now-socialLastPositionBroadcast>450){socialLastPositionBroadcast=now;socialWorldChannel.send({type:'broadcast',event:'player_state',payload:{user_id:user?.id,display_name:profile?.display_name||profile?.username||'Morador',avatar:{...avatar},zone:'visiting-house',house_host_id:activeHouseVisit.hostId,x:houseAvatar.position.x,z:houseAvatar.position.z,rotation:houseAvatar.rotation.y,walking:!!destination}}).catch(()=>{})}if(kind==='city'&&socialWorldChannel&&now-socialLastPresenceSave>2500){socialLastPresenceSave=now;sb.rpc('set_social_world_presence',{p_zone:'city',p_x:houseAvatar.position.x,p_z:houseAvatar.position.z}).then(({error})=>{if(error)console.warn('Posição social:',error.message)})}if(kind==='city'&&socialWorldChannel&&now-socialLastPositionBroadcast>450){socialLastPositionBroadcast=now;const payload={user_id:user?.id,display_name:profile?.display_name||profile?.username||'Morador',avatar:{...avatar},zone:'city',x:houseAvatar.position.x,z:houseAvatar.position.z,rotation:houseAvatar.rotation.y,walking};socialWorldChannel.send({type:'broadcast',event:'player_state',payload}).catch(()=>{})}
 if(kind==='city'){const nearest=cityDrivableCars.map(v=>({vehicle:v,distance:Math.hypot(houseAvatar.position.x-v.group.position.x,houseAvatar.position.z-v.group.position.z)})).sort((a,b)=>a.distance-b.distance)[0];nearbyVehicle=nearest&&nearest.distance<3.7?nearest.vehicle:null;const cp=$('vehicle-prompt'),cl=$('vehicle-prompt-label');if(cp){if(nearbyVehicle){cp.classList.remove('hidden');const canDrive=nearbyVehicle.ownerId===user?.id&&!!nearbyVehicle.vehicleId;if(cl)cl.textContent=canDrive?nearbyVehicle.label+' · Pressiona E para entrar':(nearbyVehicle.ownerId?'Veículo de outro jogador · Só o proprietário pode conduzir':'Veículo da cidade · Não disponível para condução');if(vehicleEnterButton)vehicleEnterButton.disabled=!canDrive}else{cp.classList.add('hidden');if(vehicleEnterButton)vehicleEnterButton.disabled=true}}const nearPoliceDoor=Math.hypot(houseAvatar.position.x-28,houseAvatar.position.z+21.196)<2.05,nearHospitalDoor=Math.hypot(houseAvatar.position.x+28,houseAvatar.position.z+23.8)<2.45,nearVenue=cityWorldEntrances.find(entry=>Math.hypot(houseAvatar.position.x-entry.x,houseAvatar.position.z-(entry.z+entry.front*(entry.d/2+1.15)))<2.15);const enterPrompt=$('room-enter-prompt');if(nearVenue){activeRoomDoor={label:nearVenue.label,dest:nearVenue.dest,spawn:{x:0,z:(nearVenue.dest==='bar'||nearVenue.dest==='party')?-11.5:-2.65,face:Math.PI}};const enterLabel=$('room-enter-label');if(enterLabel)enterLabel.textContent='Entrar em '+nearVenue.label;if(enterPrompt)enterPrompt.classList.remove('hidden')}else if(nearHospitalDoor){activeRoomDoor={label:'HOSPITAL',dest:'hospital',spawn:{x:0,z:2.75,face:Math.PI}};const enterLabel=$('room-enter-label');if(enterLabel)enterLabel.textContent='Entrar no hospital';if(enterPrompt)enterPrompt.classList.remove('hidden')}else if(nearPoliceDoor){activeRoomDoor={label:'ESQUADRA',dest:'esquadra',spawn:{x:0,z:2.75,face:Math.PI}};const enterLabel=$('room-enter-label');if(enterLabel)enterLabel.textContent='Entrar na esquadra';if(enterPrompt)enterPrompt.classList.remove('hidden')}else if(activeRoomDoor?.dest&&activeRoomDoor.dest!=='city'){activeRoomDoor=null;if(enterPrompt)enterPrompt.classList.add('hidden')}cameraTarget.set(houseAvatar.position.x,0,houseAvatar.position.z);updateOrbit()}else{cameraTarget.set(0,0,0)}
}
renderer.render(scene,camera)};animate();
const resize=()=>{if(!host.isConnected)return;camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};const ro=new ResizeObserver(resize);ro.observe(host);
return()=>{if(kind==='room'&&(roomName==='bar'||roomName==='party')){gameAudioState.currentVenue=null;stopVenueMusic();}if(playerVehicleRealtimeChannel){sb.removeChannel(playerVehicleRealtimeChannel);playerVehicleRealtimeChannel=null;}cityPoliceAgents.length=0;cityPoliceVehicles.length=0;cancelAnimationFrame(raf);ro.disconnect();renderer.domElement.removeEventListener('pointerdown',onPointerDown);renderer.domElement.removeEventListener('touchstart',onTouchStart);renderer.domElement.removeEventListener('touchmove',onTouchMove);renderer.domElement.removeEventListener('touchend',onTouchEnd);renderer.domElement.removeEventListener('touchcancel',onTouchEnd);window.removeEventListener('pointermove',onPointerMove);window.removeEventListener('pointerup',onPointerUp);window.removeEventListener('keydown',onKeyDown);window.removeEventListener('keyup',onKeyUp);window.removeEventListener('pointerup',clearPad);window.removeEventListener('pointercancel',clearPad);window.removeEventListener('pointerup',clearDrive);window.removeEventListener('pointercancel',clearDrive);window.removeEventListener('blur',onWindowBlur);moveButtons.forEach(b=>b.removeEventListener('pointerdown',onPadDown));driveButtons.forEach(b=>b.removeEventListener('pointerdown',onDriveDown));host.removeEventListener('contextmenu',blockGameBrowserMenu);host.removeEventListener('selectstart',blockGameBrowserMenu);host.removeEventListener('dragstart',blockGameBrowserMenu);if(vehicleEnterButton)vehicleEnterButton.onclick=null;if(vehicleExitButton)vehicleExitButton.onclick=null;$('vehicle-prompt')?.classList.add('hidden');$('vehicle-controls')?.classList.add('hidden');scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];materials.forEach(material=>{for(const value of Object.values(material)){if(value?.isTexture&&value!==sharedSkinMap&&value!==sharedSkinBump)value.dispose()}material.dispose()})}});renderer.dispose();renderer.domElement.remove()}}
let activeRoomDoor=null;let disposeHome=null,disposeAvatar=null,disposeInventory=null;function renderHome(roomName='sala',spawn={x:0,z:1.65,face:0}){activeCityRemoteSync=null;updateSocialPresence(activeHouseVisit?.role==='visitor'?'visiting-house':'home');if(disposeHome)disposeHome();const back=$('city-back-home');if(back)back.classList.add('hidden');disposeHome=makeRenderer($('home-scene'),'room',roomName,spawn);if(activeHouseVisit?.role==='visitor'){const current=$('room-current');if(current)current.textContent='CASA DE '+(activeHouseVisit.hostName||'AMIGO');const nav=$('room-door-nav');if(nav){const leave=document.createElement('button');leave.type='button';leave.textContent='🚪 SAIR DA CASA DO AMIGO';leave.onclick=()=>{activeHouseVisit=null;renderHome('sala')};nav.appendChild(leave)}}if(roomName==='garagem'){const nav=$('room-door-nav');if(nav){const b=document.createElement('button');b.type='button';b.textContent='🚗 VER OS MEUS CARROS';b.onclick=openPlayerGaragePanel;nav.appendChild(b)}}}
function renderVianaCity(spawn=null){if(activeHouseVisit?.role==='visitor')activeHouseVisit=null;activeHouseGuestSync=null;updateSocialPresence('city');if(disposeHome)disposeHome();$('life-panel').classList.add('hidden');$('room-current').textContent='POVO GRANDE';$('room-door-nav').innerHTML='';$('room-enter-prompt').classList.add('hidden');$('move-pad').classList.add('hidden');$('city-back-home').classList.remove('hidden');$('home-scene').querySelector('.scene-label').textContent='POVO GRANDE · AO AR LIVRE · Toca no chão para caminhar · Arrasta para rodar a câmara';disposeHome=makeRenderer($('home-scene'),'city','sala',spawn)}
function renderAvatar(){setupAvatarControls();if(disposeAvatar)disposeAvatar();disposeAvatar=makeRenderer($('avatar-scene'),'avatar')}
$('home-reset').onclick=renderHome;$('city-back-home').onclick=()=>{$('move-pad').classList.remove('hidden');$('home-scene').querySelector('.scene-label').textContent='Arrasta para virar a câmara · Pinça para zoom · Toca para caminhar';renderHome()};
$('room-enter-button').onclick=()=>{if(!activeRoomDoor)return;const door=activeRoomDoor;activeRoomDoor=null;$('room-enter-prompt').classList.add('hidden');if(door.dest==='map'){$('life-globe').click();return}const transition=$('room-transition');if(transition)transition.classList.add('active');setTimeout(()=>{if(door.dest==='city'){renderVianaCity(door.spawn||null)}else{renderHome(door.dest,door.spawn||{x:0,z:1.65,face:0})}requestAnimationFrame(()=>setTimeout(()=>{if(transition)transition.classList.remove('active')},80))},240)};
$('save-avatar').onclick=async()=>{say('avatar-message','A guardar…');const {error}=await sb.from('profiles').update({avatar:{...avatar,completed:true},updated_at:new Date().toISOString()}).eq('id',user.id);if(error){say('avatar-message',error.message);return}avatar.completed=true;profile.avatar=avatar;$('avatar-gender').disabled=true;say('avatar-message','Personagem guardado. A entrar na tua primeira casa…');showPage('home')}
const wardrobeCatalog={
 tops:[{label:'Regata branca',icon:'👕',look:{shirt:'#f2f2ee'}},{label:'Camiseta azul',icon:'👕',look:{shirt:'#3867a8'}},{label:'Camiseta vermelha',icon:'👕',look:{shirt:'#a83f43'}},{label:'Camiseta verde',icon:'👕',look:{shirt:'#43866b'}}],
 bottoms:[{label:'Bermuda branca',icon:'🩳',look:{pants:'#e6e8ee'}},{label:'Bermuda cinzenta',icon:'🩳',look:{pants:'#9da3a8'}},{label:'Calças escuras',icon:'👖',look:{pants:'#26364b'}},{label:'Jeans azul',icon:'👖',look:{pants:'#344e70'}}],
 outfits:[{label:'Conjunto da referência',icon:'🧍',look:{shirt:'#f2f2ee',pants:'#e6e8ee'}},{label:'Casual azul',icon:'🧍',look:{shirt:'#3867a8',pants:'#26364b'}},{label:'Verde e cinzento',icon:'🧍',look:{shirt:'#43866b',pants:'#9da3a8'}}]
};
function updateWardrobeGender(){document.querySelectorAll('[data-gender-choice]').forEach(button=>button.classList.toggle('active',button.dataset.genderChoice===avatar.gender))}
function renderWardrobe(){const host=$('wardrobe-items');if(!host)return;host.innerHTML='';const items=wardrobeCatalog[activeWardrobe]||[];items.forEach(item=>{const button=document.createElement('button');button.type='button';button.className='choice-card wardrobe-choice'+(Object.entries(item.look).every(([key,value])=>avatar[key]===value)?' selected':'');button.innerHTML='<span class="choice-art">'+item.icon+'</span><span><b></b><small>Equipar no personagem</small></span>';button.querySelector('b').textContent=item.label;button.onclick=()=>{Object.assign(avatar,item.look);renderWardrobe();if(disposeInventory){disposeInventory();disposeInventory=makeRenderer($('inventory-avatar-scene'),'avatar')}};host.append(button)})}
function renderInventoryPage(){updateWardrobeGender();renderWardrobe();if(disposeInventory)disposeInventory();disposeInventory=makeRenderer($('inventory-avatar-scene'),'avatar')}
document.querySelectorAll('[data-gender-choice]').forEach(button=>button.onclick=()=>{avatar.gender=button.dataset.genderChoice;updateWardrobeGender();renderWardrobe();if(disposeInventory){disposeInventory();disposeInventory=makeRenderer($('inventory-avatar-scene'),'avatar')}});
document.querySelectorAll('[data-wardrobe]').forEach(button=>button.onclick=()=>{activeWardrobe=button.dataset.wardrobe;document.querySelectorAll('[data-wardrobe]').forEach(b=>b.classList.toggle('active',b===button));renderWardrobe()});
$('save-wardrobe').onclick=async()=>{say('wardrobe-message','A guardar visual…');const updated={...avatar,completed:avatar.completed===true,modelVersion:4};const {error}=await sb.from('profiles').update({avatar:updated,updated_at:new Date().toISOString()}).eq('id',user.id);if(error){say('wardrobe-message',error.message);return}avatar=updated;profile.avatar=updated;$('life-face').textContent=avatar.gender==='female'?'👩🏽':'👨🏽';say('wardrobe-message','Visual guardado com sucesso.')};
const icons={cabelo:'💇',roupa:'👕',calçado:'👟',acessório:'⌚'};
function renderInventory(){const filtered=inventory.filter(x=>activeCategory==='todos'||x.category===activeCategory);$('inventory-count').textContent=inventory.length+' OBJECTOS';$('home-items').textContent=inventory.length;$('profile-items').textContent=inventory.length;$('inventory-grid').innerHTML='';if(!filtered.length){$('inventory-grid').innerHTML='<p class="muted">Ainda não tens objectos nesta categoria.</p>';return}filtered.forEach(item=>{const el=document.createElement('div');el.className='item';el.innerHTML='<div class="item-icon">'+(icons[item.category]||'📦')+'</div><strong></strong><div class="muted small"></div><button class="secondary"></button>';el.querySelector('strong').textContent=item.label;el.querySelector('.muted').textContent=item.category;const b=el.querySelector('button');b.textContent=item.equipped?'Equipado':'Equipar';b.disabled=item.equipped;b.onclick=()=>equip(item);$('inventory-grid').append(el)})}
async function equip(item){const clear=await sb.from('inventory_items').update({equipped:false}).eq('user_id',user.id).eq('category',item.category);if(clear.error){alert(clear.error.message);return}const chosen=await sb.from('inventory_items').update({equipped:true}).eq('id',item.id).eq('user_id',user.id);if(chosen.error){alert(chosen.error.message);return}inventory=inventory.map(x=>({...x,equipped:x.id===item.id?true:(x.category===item.category?false:x.equipped)}));renderInventory()}
document.querySelectorAll('#inventory-categories button').forEach(b=>b.onclick=()=>{activeCategory=b.dataset.cat;document.querySelectorAll('#inventory-categories button').forEach(x=>x.classList.toggle('secondary',x!==b));renderInventory()});


const gameAudioState={context:null,master:null,ambientBus:null,venueBus:null,noiseBuffer:null,ambientTimer:null,venueTimer:null,ambientEnabled:true,ambientVolume:.17,venueVolume:.38,venuePlaying:false,venueTrack:0,venueStep:0,venueAudio:null,venueAudioSource:null,venueAutoStarted:false};
const venueSpeakerIndicators=[];
const angolanTracks=[{name:'Anota Aí · Love Funk',artist:'DJ Guh Mix',label:'MP3 · Dropbox',url:"https://www.dropbox.com/scl/fi/n4tf3kxrpvymfkorx6lvd/mc_lipi_anota_ai_love_funk_dj_guh_mix_mp3_68453.mp3?rlkey=fkof8ne1ex3w8f2t230wkhvrj&raw=1"},{name:'Errei de Novo',artist:'DJ Boy',label:'MP3 · Dropbox',url:"https://www.dropbox.com/scl/fi/sdovl84sx5uupzof106dv/mc_kako_errei_de_novo_dj_boy_mp3_33182.mp3?rlkey=65a7onye0kps89cjik8gm31c5&raw=1"},{name:'Dime',artist:'Ayzan',label:'MP3 · Dropbox',url:"https://www.dropbox.com/scl/fi/rg04tjclbs9vt3g6k5whg/dime_ayzan_official_audio_mp3_67210.mp3?rlkey=j1cnmzc7f2h0lr7n36i57y1vq&raw=1"}];
function updateVenueSpeakerLights(){venueSpeakerIndicators.forEach(material=>{material.emissive.set(gameAudioState.venuePlaying?'#2fd68a':'#111111');material.emissiveIntensity=gameAudioState.venuePlaying?1.1:.08})}
function ensureGameAudio(){
 const AudioCtx=window.AudioContext||window.webkitAudioContext;if(!AudioCtx)return null;
 if(!gameAudioState.context){const ctx=new AudioCtx();gameAudioState.context=ctx;gameAudioState.master=ctx.createGain();gameAudioState.master.gain.value=.78;gameAudioState.master.connect(ctx.destination);gameAudioState.ambientBus=ctx.createGain();gameAudioState.ambientBus.connect(gameAudioState.master);gameAudioState.venueBus=ctx.createGain();gameAudioState.venueBus.connect(gameAudioState.master);const buffer=ctx.createBuffer(1,ctx.sampleRate,ctx.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;gameAudioState.noiseBuffer=buffer}
 if(gameAudioState.context.state==='suspended')gameAudioState.context.resume().catch(()=>{});if(!gameAudioState.ambientTimer)startAmbientMusic();return gameAudioState.context;
}
function syncGameAudioMix(){const ctx=gameAudioState.context;if(!ctx)return;const now=ctx.currentTime;if(gameAudioState.ambientBus)gameAudioState.ambientBus.gain.setTargetAtTime(gameAudioState.currentVenue && gameAudioState.ambientEnabled ? .035 : .0001,now,.45);if(gameAudioState.venueBus)gameAudioState.venueBus.gain.setTargetAtTime(gameAudioState.currentVenue&&gameAudioState.venuePlaying?gameAudioState.venueVolume:.0001,now,.18);if(gameAudioState.venueAudio)gameAudioState.venueAudio.volume=gameAudioState.currentVenue&&gameAudioState.venuePlaying?gameAudioState.venueVolume:0;updateVenueSpeakerLights()}
function playAmbientChord(index){
 const ctx=gameAudioState.context;if(!ctx||!gameAudioState.ambientEnabled)return;const chords=[[110,164.81,220,261.63],[98,146.83,196,246.94],[130.81,164.81,196,261.63],[87.31,130.81,174.61,220]],notes=chords[index%chords.length],start=ctx.currentTime+.04;
 notes.forEach((frequency,i)=>{const osc=ctx.createOscillator(),overtone=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='sine';osc.frequency.value=frequency;overtone.type='triangle';overtone.frequency.value=frequency*2.002;filter.type='lowpass';filter.frequency.value=720;gain.gain.setValueAtTime(.0001,start);gain.gain.linearRampToValueAtTime(i===0 ? .025 : .017,start+1.4);gain.gain.setTargetAtTime(.0001,start+5.3,.8);osc.connect(filter);overtone.connect(filter);filter.connect(gain);gain.connect(gameAudioState.ambientBus);osc.start(start);overtone.start(start);osc.stop(start+7);overtone.stop(start+7)});
}
function startAmbientMusic(){if(gameAudioState.ambientTimer)return;let chord=0;playAmbientChord(chord++);gameAudioState.ambientTimer=setInterval(()=>{if(gameAudioState.ambientEnabled)playAmbientChord(chord++%4)},6200);syncGameAudioMix()}
function ensureVenuePlaylistAudio(){
 if(gameAudioState.venueAudio)return gameAudioState.venueAudio;
 const audio=new Audio();audio.preload='auto';audio.loop=false;audio.volume=1;audio.src=angolanTracks[gameAudioState.venueTrack].url;
 ensureGameAudio();
 audio.addEventListener('playing',()=>{if(!gameAudioState.currentVenue){audio.pause();return}gameAudioState.venuePlaying=true;syncGameAudioMix();updateVenuePlayerStatus('A TOCAR AUTOMATICAMENTE')});
 audio.addEventListener('pause',()=>{gameAudioState.venuePlaying=false;syncGameAudioMix();if(gameAudioState.currentVenue&&document.visibilityState==='visible'){setTimeout(()=>{if(gameAudioState.currentVenue&&audio.paused)playVenueMusic()},350)}});
 audio.addEventListener('ended',()=>{if(!gameAudioState.currentVenue)return;gameAudioState.venueTrack=(gameAudioState.venueTrack+1)%angolanTracks.length;audio.src=angolanTracks[gameAudioState.venueTrack].url;audio.load();playVenueMusic()});
 audio.addEventListener('error',()=>{gameAudioState.venuePlaying=false;syncGameAudioMix();if(gameAudioState.currentVenue){gameAudioState.venueTrack=(gameAudioState.venueTrack+1)%angolanTracks.length;setTimeout(()=>{if(gameAudioState.currentVenue){audio.src=angolanTracks[gameAudioState.venueTrack].url;audio.load();playVenueMusic()}},1200)}});
 gameAudioState.venueAudio=audio;return audio;
}
function wakeGameAudio(){if(!gameAudioState.currentVenue)return;ensureGameAudio();const audio=ensureVenuePlaylistAudio();gameAudioState.venueAutoStarted=true;if(audio.paused&&document.visibilityState==='visible')playVenueMusic()}
function setAmbientEnabled(enabled){gameAudioState.ambientEnabled=!!enabled;if(gameAudioState.ambientEnabled)ensureGameAudio();syncGameAudioMix()}
function setAmbientVolume(value){gameAudioState.ambientVolume=THREE.MathUtils.clamp(Number(value)||0,0,.35);syncGameAudioMix()}
function setVenueVolume(value){gameAudioState.venueVolume=THREE.MathUtils.clamp(Number(value)||0,0,1);syncGameAudioMix()}
function audioKick(time,level=.6){const ctx=gameAudioState.context,osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.setValueAtTime(105,time);osc.frequency.exponentialRampToValueAtTime(42,time+.14);gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(level,time+.009);gain.gain.exponentialRampToValueAtTime(.0001,time+.2);osc.connect(gain);gain.connect(gameAudioState.venueBus);osc.start(time);osc.stop(time+.21)}
function audioNoise(time,duration,volume,frequency,type='highpass'){const ctx=gameAudioState.context,source=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),gain=ctx.createGain();source.buffer=gameAudioState.noiseBuffer;filter.type=type;filter.frequency.value=frequency;gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.006);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);source.connect(filter);filter.connect(gain);gain.connect(gameAudioState.venueBus);source.start(time);source.stop(time+duration+.01)}
function audioBass(time,frequency,volume=.12){const ctx=gameAudioState.context,osc=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='triangle';osc.frequency.setValueAtTime(frequency,time);filter.type='lowpass';filter.frequency.value=210;gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.025);gain.gain.exponentialRampToValueAtTime(.0001,time+.24);osc.connect(filter);filter.connect(gain);gain.connect(gameAudioState.venueBus);osc.start(time);osc.stop(time+.25)}
function audioPluck(time,frequency,volume=.045){const ctx=gameAudioState.context,osc=ctx.createOscillator(),second=ctx.createOscillator(),gain=ctx.createGain(),filter=ctx.createBiquadFilter();osc.type='triangle';second.type='sine';osc.frequency.value=frequency;second.frequency.value=frequency*2;filter.type='lowpass';filter.frequency.value=2100;gain.gain.setValueAtTime(.0001,time);gain.gain.linearRampToValueAtTime(volume,time+.012);gain.gain.exponentialRampToValueAtTime(.0001,time+.32);osc.connect(filter);second.connect(filter);filter.connect(gain);gain.connect(gameAudioState.venueBus);osc.start(time);second.start(time);osc.stop(time+.34);second.stop(time+.34)}
function scheduleAngolanMusicStep(track){
 const step=gameAudioState.venueStep,time=gameAudioState.context.currentTime+.025,bass=[55,55,65.41,49,55,73.42,65.41,49,55,55,65.41,49,73.42,65.41,55,49][step],notes=[220,261.63,293.66,329.63,392,440];
 if(track.style==='kizomba'){if(step===0||step===8)audioKick(time,.43);if(step===4||step===12)audioNoise(time,.11,.07,1500,'bandpass');if(step%2===1)audioNoise(time,.045,.018,6800);if([0,6,8,14].includes(step))audioBass(time,bass,.105);if([2,6,10,14].includes(step))audioPluck(time,notes[(step/2)%6],.034)}
 else if(track.style==='semba'){if([0,6,8,14].includes(step))audioKick(time,.52);if([4,12].includes(step))audioNoise(time,.12,.095,1300,'bandpass');if(step%2===0)audioNoise(time,.04,.026,5900);if([0,4,8,12].includes(step))audioBass(time,bass,.14);if([1,5,9,13].includes(step))audioPluck(time,notes[(step+1)%6],.052)}
 else{if([0,4,8,12].includes(step))audioKick(time,.68);if([2,6,10,14].includes(step))audioNoise(time,.1,.12,1250,'bandpass');audioNoise(time,.035,step%2 ? .025 : .012,7200);if([0,3,4,8,11,12].includes(step))audioBass(time,bass,.17);if([3,7,11,15].includes(step))audioPluck(time,notes[(step+2)%6],.04)}
 gameAudioState.venueStep=(step+1)%16;
}
function updateVenuePlayerStatus(message){const status=$('bar-track-state');if(status)status.textContent=message;const power=$('bar-power');if(power)power.textContent=gameAudioState.venuePlaying?'⏸ PAUSAR MÚSICA':'▶ RETOMAR MÚSICA';const name=$('bar-track-name'),artist=$('bar-track-artist'),label=$('bar-track-label'),select=$('bar-track-select');const track=angolanTracks[gameAudioState.venueTrack];if(name)name.textContent=track.name;if(artist)artist.textContent=track.artist;if(label)label.textContent=track.label;if(select)select.value=String(gameAudioState.venueTrack);updateVenueSpeakerLights()}
function playVenueMusic(){if(!gameAudioState.currentVenue)return;const audio=ensureVenuePlaylistAudio();audio.volume=gameAudioState.venueVolume;const result=audio.play();if(result&&typeof result.then==='function'){result.then(()=>{if(!gameAudioState.currentVenue){audio.pause();return}gameAudioState.venuePlaying=true;syncGameAudioMix();updateVenuePlayerStatus('A TOCAR')}).catch(()=>{gameAudioState.venuePlaying=false;syncGameAudioMix();updateVenuePlayerStatus('TOCA NO JOGO PARA ACTIVAR O SOM')})}else{if(!gameAudioState.currentVenue){audio.pause();return}gameAudioState.venuePlaying=true;syncGameAudioMix();updateVenuePlayerStatus('A TOCAR')}}
function stopVenueMusic(){const audio=gameAudioState.venueAudio;if(audio){audio.pause();try{audio.currentTime=0}catch(e){}}gameAudioState.venuePlaying=false;syncGameAudioMix();updateVenuePlayerStatus('FORA DO ESTABELECIMENTO')}
function toggleVenueMusic(){if(gameAudioState.currentVenue)playVenueMusic()}
function openGameAudioPanel(){wakeGameAudio();openLifePanel('Som do jogo','<p class="life-muted">Música ambiente calma para acompanhar a tua vida na cidade.</p><button class="secondary" id="ambient-toggle"></button><label for="ambient-volume">Volume do ambiente</label><input id="ambient-volume" type="range" min="0" max="0.35" step="0.01" value="'+gameAudioState.ambientVolume+'"><p class="life-muted">O som começa depois do primeiro toque no jogo.</p>');const toggle=$('ambient-toggle'),volume=$('ambient-volume');toggle.textContent=gameAudioState.ambientEnabled?'🔊 Som ambiente ligado':'🔇 Som ambiente desligado';toggle.onclick=()=>{setAmbientEnabled(!gameAudioState.ambientEnabled);toggle.textContent=gameAudioState.ambientEnabled?'🔊 Som ambiente ligado':'🔇 Som ambiente desligado'};volume.oninput=e=>setAmbientVolume(e.target.value)}
function selectVenueTrack(index){return}
function openBarMusicPanel(roomName){wakeGameAudio();const venue=roomName==='party'?'Salão de Festas':'Bar das Putas';openLifePanel('Música automática · '+venue,'<p class="life-muted">O DJ escolhe e toca as músicas automaticamente. A playlist passa de faixa sozinha. Não existem botões para ligar, desligar, mudar de música ou controlar o volume.</p><div class="life-row"><b id="bar-track-name">Playlist automática</b><span id="bar-track-state">REPRODUÇÃO AUTOMÁTICA</span></div>')}

function stopGameAudio(){if(gameAudioState.ambientTimer)clearInterval(gameAudioState.ambientTimer);gameAudioState.ambientTimer=null;stopVenueMusic();if(gameAudioState.context&&gameAudioState.context.state!=='closed')gameAudioState.context.suspend().catch(()=>{})}

function openLifePanel(title,html){const p=$('life-panel');p.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center"><h3>'+title+'</h3><button id="life-close" class="secondary">✕</button></div>'+html;p.classList.remove('hidden');$('life-close').onclick=()=>{if($('bar-audio-player'))stopVenueMusic();p.classList.add('hidden')}}
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&gameAudioState.currentVenue&&gameAudioState.venueAutoStarted){const a=ensureVenuePlaylistAudio();if(a.paused)playVenueMusic()}});
$('life-audio').onclick=openGameAudioPanel;
$('life-name').textContent=profile?.display_name||'Novo residente';
$('life-task').onclick=()=>openLifePanel('Tarefas diárias','<p class="life-muted">Personaliza o teu avatar, visita a tua casa e conhece novos moradores.</p><div class="life-row">🎯 Completar o perfil <span>Em breve</span></div><div class="life-row">🏡 Explorar a casa <span>Disponível</span></div>');
$('life-globe').onclick=()=>openLifePanel('Explorar o mundo','<p class="life-muted">Escolhe para onde queres ir no teu mapa.</p><button class="secondary" id="life-map-city">🌍 Entrar no mapa da cidade</button><button class="secondary" id="life-map-garage">🚗 Ir para a minha garagem</button><button class="secondary" id="life-back-home">🏠 Voltar à sala</button>');
$('life-panel').addEventListener('click',e=>{if(e.target.id==='life-map-city')renderVianaCity();if(e.target.id==='life-map-garage'){renderHome('garagem');openPlayerGaragePanel()}if(e.target.id==='life-back-home')renderHome()});

$('life-menu').onclick=()=>openLifePanel('Menu do jogo','<button class="secondary" id="life-open-avatar">👤 Personalizar avatar</button><button class="secondary" id="life-open-inventory">🎒 Inventário</button><button class="secondary" id="life-open-profile">⭐ Perfil</button>');



async function loadWorldChat(){const {data,error}=await sb.from('world_chat_messages').select('id,message,created_at,user_id,profiles(display_name,username)').order('created_at',{ascending:true}).limit(60);if(error){return '<p class="life-muted">Chat indisponível neste momento.</p>'}return (data||[]).map(m=>'<div class="life-row"><span><b>'+escapeLife(m.profiles?.display_name||m.profiles?.username||'Morador')+'</b><br>'+escapeLife(m.message)+'</span><small>'+new Date(m.created_at).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})+'</small></div>').join('')}
function escapeLife(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}

function getSocialOnlinePlayers(){
 const seen=new Map();
 for(const metas of Object.values(socialPresenceState||{})){
  for(const meta of metas||[]){const p=meta?.user_id;if(p&&p!==user?.id)seen.set(p,meta)}
 }
 return [...seen.values()];
}
function renderSocialOnlinePlayers(){
 const host=$('life-online-list');if(!host)return;
 const players=getSocialOnlinePlayers();
 host.innerHTML='<div class="life-row"><b>Jogadores online ('+players.length+')</b><small>Actualizado em tempo real</small></div>'+
 (players.length?players.map(p=>'<div class="life-row"><span>🟢 '+escapeLife(p.display_name||p.username||'Morador')+'<br><small>'+(p.zone==='city'?'Na cidade':'Online')+'</small></span><button data-user="'+p.user_id+'" data-name="'+escapeLife(p.display_name||p.username||'Morador')+'">Mensagem</button></div>').join(''):'<p class="life-muted">Ainda não há outros jogadores online.</p>');
}
async function loadPendingHouseVisits(autoOpen=false){
 if(!user)return;
 const {data,error}=await sb.from('house_visit_requests').select('id,visitor_id,host_id,created_at,status').eq('host_id',user.id).eq('status','pending').order('created_at',{ascending:false}).limit(20);
 if(error){console.warn('Pedidos de visita:',error.message);return}
 if(!data?.length){if(autoOpen)alert('Recebeste um pedido de visita, mas não foi possível carregá-lo.');return}
 const ids=[...new Set(data.map(x=>x.visitor_id))];
 const {data:people}=await sb.from('profiles').select('id,display_name,username').in('id',ids);
 const html=data.map(row=>{const p=(people||[]).find(x=>x.id===row.visitor_id);const name=p?.display_name||p?.username||'Morador';return '<div class="life-row"><span><b>'+escapeLife(name)+'</b><br><small>Quer visitar a tua casa</small></span><span><button data-house-accept="'+row.id+'" data-visitor-id="'+row.visitor_id+'">Aceitar</button><button class="secondary" data-house-decline="'+row.id+'">Recusar</button></span></div>'}).join('');
 openLifePanel('Pedidos de visita',html);
}
function updateSocialPresence(zone){
 socialZone=zone;
 if(!socialWorldChannel||!user)return;
 socialWorldChannel.track({user_id:user.id,display_name:profile?.display_name||profile?.username||'Morador',username:profile?.username||'',avatar:{...avatar},zone,house_host_id:zone==='visiting-house'?activeHouseVisit?.hostId:null,online:true}).catch(err=>console.warn('Presença social:',err));
 if(zone==='home'||zone==='visiting-house')sb.rpc('set_social_world_presence',{p_zone:'home',p_x:null,p_z:null}).then(({error})=>{if(error)console.warn('Estado social:',error.message)});
 socialWorldChannel.send({type:'broadcast',event:'player_state',payload:{user_id:user.id,zone,display_name:profile?.display_name||profile?.username||'Morador',avatar:{...avatar},house_host_id:zone==='visiting-house'?activeHouseVisit?.hostId:null,x:0,z:1.65,rotation:0}}).catch(()=>{});
}
async function refreshVisibleWorldChat(){
 const log=$('life-chat-log');if(!log)return;
 log.innerHTML=await loadWorldChat();log.scrollTop=log.scrollHeight;
}
async function startSocialRealtime(){
 if(!user||socialWorldChannel)return;
 const channel=sb.channel('angola-life-world',{config:{private:true}});
 channel
  .on('presence',{event:'sync'},()=>{socialPresenceState=channel.presenceState();const onlineIds=new Set(getSocialOnlinePlayers().map(p=>p.user_id));for(const id of [...socialRemoteStates.keys()])if(!onlineIds.has(id)){socialRemoteStates.delete(id);activeCityRemoteSync?.({user_id:id,zone:'offline'})}renderSocialOnlinePlayers()})
  .on('broadcast',{event:'player_state'},({payload})=>{if(!payload?.user_id||payload.user_id===user.id)return;socialRemoteStates.set(payload.user_id,payload);activeCityRemoteSync?.(payload);if(payload.zone==='visiting-house'||payload.house_host_id===user.id)activeHouseGuestSync?.(payload)})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'house_visit_requests'},payload=>{const row=payload.new;if(row.host_id===user.id)loadPendingHouseVisits(true)})
  .on('postgres_changes',{event:'UPDATE',schema:'public',table:'house_visit_requests'},async payload=>{const row=payload.new;if(row.visitor_id===user.id&&row.status==='accepted'){const {data:p}=await sb.from('profiles').select('display_name,username').eq('id',row.host_id).maybeSingle();activeHouseVisit={role:'visitor',hostId:row.host_id,hostName:p?.display_name||p?.username||'AMIGO',requestId:row.id};renderHome('sala');alert('Pedido aceite! Estás a entrar na casa de '+activeHouseVisit.hostName+'.')}else if(row.visitor_id===user.id&&row.status==='declined'){alert('O teu amigo recusou a visita.')}else if(row.host_id===user.id&&row.status==='accepted'){activeHouseVisit={role:'host',hostId:user.id,visitorId:row.visitor_id,requestId:row.id}}})
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'world_chat_messages'},()=>refreshVisibleWorldChat())
  .on('postgres_changes',{event:'INSERT',schema:'public',table:'private_messages'},payload=>{const row=payload.new;if(activePrivateConversationId&&(row.sender_id===activePrivateConversationId||row.recipient_id===activePrivateConversationId)){refreshActivePrivateConversation?.()}})
  .on('postgres_changes',{event:'*',schema:'public',table:'social_connections'},()=>{if(!$('life-panel').classList.contains('hidden')&&$('life-panel').textContent.includes('Amigos e relações'))$('life-friends').click()});
 socialWorldChannel=channel;
 channel.subscribe(async status=>{if(status==='SUBSCRIBED'){await channel.track({user_id:user.id,display_name:profile?.display_name||profile?.username||'Morador',username:profile?.username||'',avatar:{...avatar},zone:socialZone,online:true});socialPresenceState=channel.presenceState();if(socialZone==='home')sb.rpc('set_social_world_presence',{p_zone:'home',p_x:null,p_z:null});renderSocialOnlinePlayers()}});
}

$('life-chat').onclick=async()=>{openLifePanel('Chat público','<div id="life-chat-log" class="life-chatlog">A carregar mensagens…</div><div class="life-send"><input id="life-chat-input" maxlength="400" placeholder="Escreve uma mensagem…"><button id="life-chat-send">Enviar</button></div>');$('life-chat-log').innerHTML=await loadWorldChat();const log=$('life-chat-log');if(log)log.scrollTop=log.scrollHeight;$('life-chat-send').onclick=async()=>{const input=$('life-chat-input');const msg=input.value.trim();if(!msg||!user)return;const {error}=await sb.from('world_chat_messages').insert({user_id:user.id,message:msg});if(error){alert('Não foi possível enviar: '+error.message);return}input.value='';$('life-chat-log').innerHTML=await loadWorldChat();$('life-chat-log').scrollTop=$('life-chat-log').scrollHeight};$('life-chat-input').addEventListener('keydown',e=>{if(e.key==='Enter')$('life-chat-send').click()})};
$('life-phone').onclick=async()=>{openLifePanel('Telemóvel · Rede social','<div id="life-online-list" class="life-list"><p class="life-muted">A procurar jogadores online…</p></div><input id="life-user-search" placeholder="Procurar moradores pelo nome…"><div id="life-user-results" class="life-list"><p class="life-muted">Escreve um nome para procurar jogadores.</p></div><div id="life-private-area"></div><button class="secondary" id="life-house-visits">🏠 Pedidos de visita à minha casa</button>');renderSocialOnlinePlayers();await loadPendingHouseVisits(false);$('life-house-visits').onclick=()=>loadPendingHouseVisits(false)};
$('life-panel').addEventListener('input',async e=>{if(e.target.id!=='life-user-search')return;const q=e.target.value.trim();if(q.length<2){$('life-user-results').innerHTML='<p class="life-muted">Escreve pelo menos 2 letras.</p>';return}const {data,error}=await sb.from('profiles').select('id,username,display_name').ilike('display_name','%'+q+'%').neq('id',user.id).limit(12);if(error){$('life-user-results').textContent='Pesquisa indisponível.';return}$('life-user-results').innerHTML=(data||[]).map(p=>'<div class="life-row"><span>'+escapeLife(p.display_name)+' <small>@'+escapeLife(p.username)+'</small></span><span><button data-add-user="'+p.id+'">Adicionar</button><button data-user="'+p.id+'" data-name="'+escapeLife(p.display_name)+'">Mensagem</button></span></div>').join('')||'<p class="life-muted">Nenhum morador encontrado.</p>'});
$('life-panel').addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.id==='life-back-home'){$('life-panel').classList.add('hidden');showPage('home')}if(b.id==='life-map-garage'){$('life-panel').classList.add('hidden');showPage('home');renderHome('garagem')}if(b.id==='life-map-city'){renderVianaCity()}if(b.id==='life-open-avatar'){$('life-panel').classList.add('hidden');showPage('avatar')}if(b.id==='life-open-inventory'){$('life-panel').classList.add('hidden');showPage('inventory')}if(b.id==='life-open-profile'){$('life-panel').classList.add('hidden');showPage('profile')}if(b.dataset.user)openPrivateConversation(b.dataset.user,b.dataset.name||'Morador');if(b.dataset.visitHost){const {error}=await sb.from('house_visit_requests').insert({visitor_id:user.id,host_id:b.dataset.visitHost});if(error){alert(error.code==='23505'?'Já existe um pedido de visita pendente.':error.message);return}b.disabled=true;b.textContent='Pedido enviado';alert('Pedido enviado. O teu amigo precisa de aceitar a visita.')}if(b.dataset.houseAccept){const {error}=await sb.from('house_visit_requests').update({status:'accepted',updated_at:new Date().toISOString()}).eq('id',b.dataset.houseAccept);if(error){alert(error.message);return}activeHouseVisit={role:'host',hostId:user.id,visitorId:b.dataset.visitorId,requestId:b.dataset.houseAccept};alert('Visita aceite. O teu amigo já pode entrar na tua casa.');$('life-panel').classList.add('hidden')}if(b.dataset.houseDecline){const {error}=await sb.from('house_visit_requests').update({status:'declined',updated_at:new Date().toISOString()}).eq('id',b.dataset.houseDecline);if(error){alert(error.message);return}loadPendingHouseVisits()}if(b.dataset.addUser){const {error}=await sb.from('social_connections').insert({requester_id:user.id,addressee_id:b.dataset.addUser});if(error){alert(error.code==='23505'?'Já existe um pedido ou relação com este morador.':error.message);return}b.textContent='Pedido enviado';b.disabled=true}if(b.dataset.accept){const {error}=await sb.rpc('accept_friend_request',{p_connection_id:b.dataset.accept});if(error){alert(error.message);return}$('life-friends').click()}if(b.dataset.activity){const peer=socialRemoteStates.get(b.dataset.peer),distance=peer?Math.hypot(Number(peer.x)-socialLocalPosition.x,Number(peer.z)-socialLocalPosition.z):Infinity;if(socialZone!=='city'||!peer||peer.zone!=='city'||distance>8){alert('Para ganhar pontos, os dois jogadores precisam estar na cidade e a menos de 8 metros um do outro.');return}const {data,error}=await sb.rpc('record_relationship_activity',{p_connection_id:b.dataset.connection,p_activity:b.dataset.activity});if(error){alert(error.message);return}if(data?.result==='already_done')alert('Esta actividade já contou hoje para ti.');else alert('Actividade registada: +'+data.earned+' pontos. Progresso: '+data.progress+'/100.');$('life-friends').click()}if(b.dataset.propose){const {data,error}=await sb.rpc('propose_relationship',{p_connection_id:b.dataset.propose,p_level:b.dataset.level});if(error){alert(error.message);return}alert(data==='waiting'?'A tua confirmação foi registada. A outra pessoa também precisa de aceitar.':'Etapa de relacionamento confirmada pelos dois!');$('life-friends').click()}if(b.dataset.interact){const level=b.dataset.interact;openLifePanel('Interações do casal',level==='married'?'<p class="life-muted">Casados digitalmente: abraço, beijo e intimidade do casal estão desbloqueados.</p><button class="secondary">🤗 Abraço</button><button class="secondary">💋 Beijo</button><button class="secondary">❤️ Momento privado do casal</button>':'<p class="life-muted">Namorados: abraço e beijo estão desbloqueados. A intimidade do casal só será desbloqueada após o casamento digital.</p><button class="secondary">🤗 Abraço</button><button class="secondary">💋 Beijo</button>')}});
let refreshActivePrivateConversation=null;async function openPrivateConversation(otherId,otherName){activePrivateConversationId=otherId;const area=$('life-private-area');area.innerHTML='<h3>'+escapeLife(otherName)+'</h3><div id="life-private-log" class="life-chatlog">A carregar…</div><div class="life-send"><input id="life-private-input" maxlength="2000" placeholder="Mensagem privada…"><button id="life-private-send">Enviar</button></div>';const refresh=async()=>{const {data,error}=await sb.from('private_messages').select('*').or('and(sender_id.eq.'+user.id+',recipient_id.eq.'+otherId+'),and(sender_id.eq.'+otherId+',recipient_id.eq.'+user.id+')').order('created_at').limit(80);if(error)return;const el=$('life-private-log');if(el){el.innerHTML=(data||[]).map(m=>'<div class="life-row"><span>'+(m.sender_id===user.id?'Tu':'Eles')+': '+escapeLife(m.message)+'</span></div>').join('');el.scrollTop=el.scrollHeight}};refreshActivePrivateConversation=refresh;await refresh();$('life-private-send').onclick=async()=>{const input=$('life-private-input'),message=input.value.trim();if(!message)return;const {error}=await sb.from('private_messages').insert({sender_id:user.id,recipient_id:otherId,message});if(error){alert('Não foi possível enviar a mensagem.');return}input.value='';await refresh()}}
$('life-friends').onclick=async()=>{const {data,error}=await sb.from('social_connections').select('id,status,requester_id,addressee_id,requester_vote,addressee_vote,friendship_points,dating_points,marriage_points').or('requester_id.eq.'+user.id+',addressee_id.eq.'+user.id).limit(40);if(error){openLifePanel('Amigos','<p class="life-muted">Não foi possível carregar os contactos.</p>');return}const ids=[...new Set((data||[]).map(x=>x.requester_id===user.id?x.addressee_id:x.requester_id))];let people=[];if(ids.length){const r=await sb.from('profiles').select('id,display_name,username').in('id',ids);people=r.data||[]}const html=(data||[]).map(x=>{const id=x.requester_id===user.id?x.addressee_id:x.requester_id;const p=people.find(y=>y.id===id);const stage=x.status==='acquaintances'?'friendship':x.status==='friends'?'dating':x.status==='dating'?'marriage':null;const points=stage==='friendship'?x.friendship_points:stage==='dating'?x.dating_points:x.marriage_points;const next=stage==='friendship'?'friends':stage==='dating'?'dating':'married';let action='';if(x.status==='pending'&&x.addressee_id===user.id)action='<button data-accept="'+x.id+'">Aceitar pedido</button>';if(stage){const label=stage==='friendship'?'amizade':stage==='dating'?'namoro':'casamento';const activities=[['conversation','Conversar',2],['walk','Passear',5],['ride','Passear de carro',5],['meal','Comer juntos',6],['dance','Dançar',6],['event','Evento',5],['gift','Oferecer presente',5],['photo','Tirar fotografia',4],['visit','Visitar casa',7],['travel','Viajar juntos',8]];action+='<div class="life-social-progress"><b>'+label.toUpperCase()+' · '+points+'/100</b><div style="height:8px;background:#d9dfe5;border-radius:8px;overflow:hidden"><div style="height:8px;width:'+points+'%;background:#2c9b69"></div></div><small>Faz actividades com este jogador. Máximo de 30 pontos por dia por relação.</small><div class="life-list">'+activities.map(a=>'<button class="secondary" data-activity="'+a[0]+'" data-connection="'+x.id+'" data-peer="'+id+'">'+a[1]+' +'+a[2]+'</button>').join('')+'</div>'+(points>=100?'<button data-propose="'+x.id+'" data-level="'+next+'">'+(stage==='friendship'?'Propor amizade':stage==='dating'?'Propor namoro':'Propor casamento')+'</button>':'')+'</div>'}if(x.status==='dating'||x.status==='married')action+='<button data-interact="'+x.status+'">Interagir</button>';if(['friends','dating','married'].includes(x.status))action+='<button class="secondary" data-visit-host="'+id+'" data-host-name="'+escapeLife(p?.display_name||p?.username||'Morador')+'">🏠 Pedir visita</button>';return '<div class="life-row"><span><b>'+escapeLife(p?.display_name||p?.username||'Morador')+'</b><br><small>'+escapeLife(x.status)+'</small></span><span>'+action+'</span></div>'}).join('');openLifePanel('Amigos e relações',html||'<p class="life-muted">Ainda não tens contactos. Usa o telemóvel para procurar moradores.</p>')};

sb.auth.getSession().then(({data})=>{if(data.session)boot()});
