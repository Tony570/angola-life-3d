/* Angola Life 3D — inventário do jogador, persistente neste dispositivo. */
const KEY = 'angolaLife3D.inventory.v1';
const STARTER_ITEMS = [
  {id:'phone',name:'Telemóvel',icon:'📱',category:'essenciais',qty:1,description:'Comunicação e aplicações do jogador.'},
  {id:'identity',name:'Bilhete de identidade',icon:'🪪',category:'essenciais',qty:1,description:'Documento pessoal.'},
  {id:'house-key',name:'Chave de casa',icon:'🔑',category:'essenciais',qty:1,description:'Chave da residência.'},
  {id:'wallet',name:'Carteira',icon:'👛',category:'essenciais',qty:1,description:'Guarda dinheiro e cartões.'},
  {id:'water',name:'Água',icon:'💧',category:'comida',qty:2,kind:'water',description:'Recupera hidratação.'},
  {id:'sandwich',name:'Sanduíche',icon:'🥪',category:'comida',qty:2,kind:'food',description:'Recupera energia.'},
  {id:'shirt',name:'T-shirt azul',icon:'👕',category:'roupas',qty:1,kind:'clothes',description:'Roupa casual para o avatar.'},
  {id:'jeans',name:'Calças de ganga',icon:'👖',category:'roupas',qty:1,kind:'clothes',description:'Calças de ganga.'},
  {id:'shoes',name:'Ténis pretos',icon:'👟',category:'roupas',qty:1,kind:'clothes',description:'Calçado confortável.'},
  {id:'toolkit',name:'Caixa de ferramentas',icon:'🧰',category:'ferramentas',qty:1,description:'Ferramentas para trabalhos.'}
];
const CATEGORIES = [['todos','Tudo'],['essenciais','Essenciais'],['roupas','Roupas'],['comida','Comida'],['ferramentas','Ferramentas']];
function clone(value){return JSON.parse(JSON.stringify(value));}
function load(key,fallback){try{const value=JSON.parse(localStorage.getItem(key));return value ?? clone(fallback);}catch{return clone(fallback);}}
let items = load(KEY, STARTER_ITEMS);
if (!Array.isArray(items)) items = clone(STARTER_ITEMS);
let stats = load(KEY+'.stats',{energy:80,hydration:80});
let category = 'todos';
let selectedId = items[0]?.id || null;
function persist(){try{localStorage.setItem(KEY,JSON.stringify(items));localStorage.setItem(KEY+'.stats',JSON.stringify(stats));}catch(error){console.warn('Não foi possível guardar o inventário neste dispositivo:',error);}}
function safe(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function installStyles(){
 if(document.querySelector('#al3d-inventory-style'))return;
 const style=document.createElement('style');style.id='al3d-inventory-style';
 style.textContent=`
 #inventory-button{pointer-events:auto;min-height:38px;padding:9px 12px;border:1px solid #e9b94e88;border-radius:10px;background:#193c31;color:#ffe6a6;font-size:11px;font-weight:900;white-space:nowrap}
 #inventory-panel{position:fixed;inset:0;z-index:150;display:none;place-items:center;padding:10px;background:#050b10df;color:#fff;font-family:Arial,sans-serif}
 #inventory-panel.open{display:grid}.inv-window{width:min(920px,97vw);max-height:94vh;overflow:auto;padding:16px;border:1px solid #d7b66f88;border-radius:17px;background:linear-gradient(145deg,#182c29,#0d191d);box-shadow:0 22px 70px #000b}
 .inv-head{display:flex;justify-content:space-between;align-items:center;padding-bottom:12px;border-bottom:1px solid #ffffff25}.inv-head small{color:#e9b94e;font-size:9px;letter-spacing:2px}.inv-head h2{font-size:20px;margin-top:5px}
 #inv-close{width:38px;height:38px;border:0;border-radius:9px;background:#793d35;color:white;font-size:20px}
 .inv-stats{display:flex;gap:8px;margin:12px 0}.inv-stat{flex:1;padding:9px;border:1px solid #ffffff20;border-radius:9px;background:#ffffff09;font-size:11px}.inv-stat b{display:block;color:#f2ca72;margin-bottom:6px}.inv-bar{height:5px;background:#ffffff25;border-radius:8px;overflow:hidden}.inv-bar i{display:block;height:100%;background:#75c79b}
 .inv-cats{display:flex;gap:6px;overflow:auto;padding:4px 0 12px}.inv-cats button{white-space:nowrap;padding:9px 11px;border:1px solid #ffffff24;border-radius:8px;background:#213d34;color:#fff;font-size:10px}.inv-cats button.active{border-color:#f0c66a;background:#705326}
 .inv-layout{display:grid;grid-template-columns:1.4fr .8fr;gap:10px}.inv-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;align-content:start}
 .inv-item{min-width:0;min-height:98px;padding:8px 4px;border:1px solid #ffffff22;border-radius:10px;background:#ffffff09;color:#fff;text-align:center}.inv-item.active{border-color:#f0c66a;background:#5c4928aa}
 .inv-item .ico{display:block;font-size:27px;margin-bottom:5px}.inv-item strong{display:block;font-size:10px;overflow-wrap:anywhere}.inv-item small{display:block;color:#c2d1c8;margin-top:5px;font-size:9px}
 .inv-detail{padding:13px;border:1px solid #ffffff20;border-radius:11px;background:#ffffff08;min-width:0}.inv-detail .ico{font-size:40px}.inv-detail h3{margin:7px 0;font-size:16px}.inv-detail p{min-height:45px;color:#c2d1c0;font-size:11px;line-height:1.5}
 .inv-actions{display:grid;gap:7px;margin-top:12px}.inv-actions button{min-height:38px;border:0;border-radius:8px;background:#28634d;color:white;font-size:10px;font-weight:900}.inv-actions .secondary{background:#36454a}.inv-actions button:disabled{opacity:.4}
 #inv-message{min-height:18px;margin-top:9px;color:#a9dfb8;font-size:10px;line-height:1.5}
 @media(max-width:620px){.inv-window{padding:11px}.inv-layout{grid-template-columns:1fr}.inv-grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
 @media(max-width:380px){.inv-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.inv-stats{flex-direction:column}}
 `;
 document.head.append(style);
}
function setup(){
 const top=document.querySelector('#topbar'),game=document.querySelector('#game');
 if(!top||!game||document.querySelector('#inventory-button'))return false;
 installStyles();
 const button=document.createElement('button');button.id='inventory-button';button.type='button';button.textContent='🎒 INVENTÁRIO';top.append(button);
 const panel=document.createElement('section');panel.id='inventory-panel';panel.innerHTML=`
 <div class="inv-window"><header class="inv-head"><div><small>ANGOLA LIFE 3D · EQUIPAMENTO</small><h2>Inventário do jogador</h2></div><button id="inv-close" type="button" aria-label="Fechar">×</button></header>
 <div class="inv-stats"><div class="inv-stat"><b>⚡ Energia <span id="inv-energy-label">80%</span></b><div class="inv-bar"><i id="inv-energy" style="width:80%"></i></div></div><div class="inv-stat"><b>💧 Hidratação <span id="inv-water-label">80%</span></b><div class="inv-bar"><i id="inv-water" style="width:80%"></i></div></div></div>
 <nav class="inv-cats" aria-label="Categorias do inventário"></nav><div class="inv-layout"><div class="inv-grid"></div><aside class="inv-detail"></aside></div><p id="inv-message" role="status">Os objetos ficam guardados neste dispositivo.</p></div>`;
 game.append(panel);
 function say(message){panel.querySelector('#inv-message').textContent=message;}
 function render(){
  const shown=category==='todos'?items:items.filter(item=>item.category===category);
  const chosen=items.find(item=>item.id===selectedId)||shown[0]||null;
  if(chosen)selectedId=chosen.id;
  panel.querySelector('.inv-cats').innerHTML=CATEGORIES.map(([id,label])=>`<button type="button" data-cat="${id}" class="${category===id?'active':''}">${label}</button>`).join('');
  panel.querySelector('.inv-grid').innerHTML=shown.length?shown.map(item=>`<button type="button" class="inv-item ${item.id===selectedId?'active':''}" data-item="${safe(item.id)}"><span class="ico">${item.icon||'📦'}</span><strong>${safe(item.name)}</strong><small>Quantidade: ${Number(item.qty)||0}</small></button>`).join(''):'<p>Não há objetos nesta categoria.</p>';
  const detail=panel.querySelector('.inv-detail');
  if(!chosen){detail.innerHTML='<p>Escolhe um objeto para ver os detalhes.</p>';}
  else{
   const actionLabel=chosen.kind==='clothes'?'EQUIPAR':chosen.kind?'UTILIZAR':'SELECIONAR';
   detail.innerHTML=`<span class="ico">${chosen.icon||'📦'}</span><h3>${safe(chosen.name)}</h3><p>${safe(chosen.description||'Objeto do jogador.')}</p><small>Quantidade: ${Number(chosen.qty)||0}</small><div class="inv-actions"><button type="button" id="inv-use">${actionLabel}</button><button type="button" id="inv-drop" class="secondary">LARGAR 1 UNIDADE</button></div>`;
   detail.querySelector('#inv-use').disabled=!chosen.kind;
   detail.querySelector('#inv-use').addEventListener('click',()=>use(chosen));
   detail.querySelector('#inv-drop').addEventListener('click',()=>drop(chosen));
  }
  panel.querySelector('#inv-energy').style.width=Math.max(0,Math.min(100,Number(stats.energy)||0))+'%';
  panel.querySelector('#inv-water').style.width=Math.max(0,Math.min(100,Number(stats.hydration)||0))+'%';
  panel.querySelector('#inv-energy-label').textContent=Math.round(stats.energy)+'%';
  panel.querySelector('#inv-water-label').textContent=Math.round(stats.hydration)+'%';
 }
 function use(item){
  if(item.kind==='food')stats.energy=Math.min(100,stats.energy+25);
  else if(item.kind==='water')stats.hydration=Math.min(100,stats.hydration+30);
  else if(item.kind==='clothes'){
   const clothingName={shirt:'T-shirt azul',jeans:'Calças de ganga',shoes:'Ténis pretos'}[item.id]||item.name;
   window.dispatchEvent(new CustomEvent('angolaLife3D:clothingPurchase',{detail:{name:clothingName}}));
   say(item.name+' equipado no avatar.');return;
  }else return;
  item.qty-=1;if(item.qty<=0)items=items.filter(entry=>entry.id!==item.id);
  persist();render();say(item.name+' utilizado.');
 }
 function drop(item){
  item.qty-=1;if(item.qty<=0)items=items.filter(entry=>entry.id!==item.id);
  if(!items.some(entry=>entry.id===selectedId))selectedId=items[0]?.id||null;
  persist();render();say('Uma unidade de '+item.name+' foi removida.');
 }
 button.addEventListener('click',()=>{panel.classList.add('open');render();});
 panel.querySelector('#inv-close').addEventListener('click',()=>panel.classList.remove('open'));
 panel.addEventListener('click',event=>{
  if(event.target===panel)panel.classList.remove('open');
  const cat=event.target.closest('[data-cat]');if(cat){category=cat.dataset.cat;render();}
  const selected=event.target.closest('[data-item]');if(selected){selectedId=selected.dataset.item;render();}
 });
 render();return true;
}
if(!setup()){
 const observer=new MutationObserver(()=>{if(setup())observer.disconnect();});
 observer.observe(document.documentElement,{childList:true,subtree:true});
}
