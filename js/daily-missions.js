// Metas diárias e experiência do jogador.
// Até existir sincronização própria no servidor, o progresso fica guardado neste dispositivo.
const MISSIONS=[
 {id:'city',action:'city',title:'Explora a cidade',detail:'Entra na cidade e conhece o bairro.',reward:30},
 {id:'shower',action:'shower',title:'Cuida da higiene',detail:'Toma banho na casa de banho da tua casa.',reward:20},
 {id:'sleep',action:'sleep',title:'Recupera energia',detail:'Descansa no teu quarto.',reward:20},
 {id:'cook',action:'cook',title:'Prepara uma refeição',detail:'Cozinha uma receita na tua cozinha.',reward:25},
 {id:'bus',action:'bus',title:'Viaja de autocarro',detail:'Apanha um autocarro numa paragem.',reward:30},
 {id:'social',action:'social',title:'Participa na comunidade',detail:'Envia uma mensagem no chat público.',reward:25}
];
const dateKey=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
export function createDailyMissions(userId){
 const key='angola-life-daily-missions-v1:'+String(userId||'guest');
 let state={day:dateKey(),completed:{},xp:0};
 try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved&&typeof saved==='object'){state={...state,...saved};if(state.day!==dateKey()){state.day=dateKey();state.completed={}}if(!state.completed||typeof state.completed!=='object')state.completed={};state.xp=Math.max(0,Number(state.xp)||0)}}catch(error){console.warn('Metas diárias: armazenamento local indisponível.',error)}
 const save=()=>{try{localStorage.setItem(key,JSON.stringify(state))}catch(error){console.warn('Não foi possível guardar as metas diárias.',error)}};
 const level=()=>Math.floor(state.xp/250)+1;
 const updateHud=()=>{const el=document.getElementById('life-level');if(el){el.textContent=String(level());el.title=state.xp+' pontos de experiência';}};
 const record=action=>{const mission=MISSIONS.find(x=>x.action===action);if(!mission||state.completed[mission.id])return false;state.completed[mission.id]=true;state.xp+=mission.reward;save();updateHud();return true};
 const renderHtml=()=>{
  if(state.day!==dateKey()){state.day=dateKey();state.completed={};save()}
  const done=MISSIONS.filter(x=>state.completed[x.id]).length,percent=Math.round(done/MISSIONS.length*100);
  const rows=MISSIONS.map(x=>'<div class="daily-mission-row"><div class="daily-mission-icon">'+(state.completed[x.id]?'✓':'☆')+'</div><div class="daily-mission-copy"><b>'+x.title+'</b><small>'+x.detail+'</small></div><span class="daily-mission-reward">'+(state.completed[x.id]?'Concluída':'+'+x.reward+' XP')+'</span></div>').join('');
  return '<div class="daily-mission-summary"><div><b>Metas de hoje</b><strong>'+done+'/'+MISSIONS.length+'</strong></div><div class="daily-mission-track"><i style="width:'+percent+'%"></i></div><p>Nível '+level()+' · '+state.xp+' XP acumulados</p></div><div class="daily-mission-list">'+rows+'</div><p class="life-muted">As metas renovam diariamente. O progresso e os pontos XP ficam guardados neste dispositivo e ainda não são sincronizados entre aparelhos.</p>';
 };
 updateHud();
 return {record,renderHtml,updateHud,getLevel:level,getXp:()=>state.xp};
}
