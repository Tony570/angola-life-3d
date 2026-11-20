// Transporte público autónomo e partilhado — Angola Life 3D.
const ROAD_X=[-70,-42,-14,14,42,70],ROAD_Z=[-70,-42,-14,14,42,70];
const LARGO_X=[145,205,265],LARGO_Z=[-78,-48,0,48,96];
const num=v=>v<0?'m'+Math.abs(v):String(v);
const pg=(x,z)=>'pg_'+num(x)+'_'+num(z);
const la=(x,z)=>'la_'+num(x)+'_'+num(z);
const POVO_ROUTE=[
 pg(70,14),pg(70,-14),pg(42,-14),pg(14,-14),pg(-14,-14),pg(-42,-14),pg(-70,-14),
 pg(-70,-42),pg(-42,-42),pg(-14,-42),pg(14,-42),pg(42,-42),pg(70,-42),pg(70,-14),pg(70,14),
 pg(42,14),pg(14,14),pg(-14,14),pg(-42,14),pg(-70,14),pg(-70,42),pg(-42,42),pg(-14,42),
 pg(14,42),pg(42,42),pg(70,42),pg(70,14)
];
const FULL_ROUTE=[
 ...POVO_ROUTE,la(111,14),la(145,14),la(145,0),la(145,-48),la(145,-78),la(205,-78),
 la(265,-78),la(265,-48),la(205,-48),la(145,-48),la(145,0),la(145,48),la(205,48),
 la(205,0),la(265,0),la(265,48),la(205,48),la(205,96),la(265,96),la(145,96),
 la(145,48),la(145,0),la(145,14),la(111,14),pg(70,14)
];
const LARGO_ROUTE=[
 la(145,0),la(145,-48),la(145,-78),la(205,-78),la(265,-78),la(265,-48),la(205,-48),la(145,-48),
 la(145,0),la(145,48),la(205,48),la(205,0),la(265,0),la(265,48),la(205,48),la(205,96),
 la(265,96),la(145,96),la(145,48),la(145,0)
];
const ROUTES={full:FULL_ROUTE,povo:POVO_ROUTE,largo:LARGO_ROUTE};
const DESTINATIONS=[
 {id:'povo-grande',label:'Povo Grande',category:'Bairro',fare:200,x:0,z:0},
 {id:'hospital',label:'Hospital',category:'Saúde',fare:200,x:-28,z:-28},
 {id:'quarry',label:'Empresa da Pedreira',category:'Empresa',fare:200,x:0,z:-28},
 {id:'market',label:'Mercado de Povo Grande',category:'Comércio',fare:150,x:28,z:0},
 {id:'car-shop',label:'Loja de Carros',category:'Comércio',fare:200,x:-28,z:0},
 {id:'hotel',label:'Hotel',category:'Hotelaria',fare:200,x:0,z:0},
 {id:'police-povo',label:'Esquadra de Povo Grande',category:'Segurança',fare:200,x:28,z:-28},
 {id:'bar',label:'Bar',category:'Lazer',fare:200,x:-28,z:28},
 {id:'party',label:'Salão de Festas',category:'Lazer',fare:250,x:28,z:28},
 {id:'salon',label:'Salão de Beleza',category:'Comércio',fare:150,x:-3.9,z:28},
 {id:'clothes',label:'Loja de Roupas',category:'Comércio',fare:150,x:3.9,z:28},
 {id:'largo-ambiente',label:'Largo do Ambiente',category:'Bairro',fare:300,x:175,z:22},
 {id:'government',label:'Governo Provincial',category:'Governo',fare:250,x:210,z:-22},
 {id:'bank-bci',label:'Banco BCI',category:'Banco',fare:250,x:155,z:-28},
 {id:'bank-bai',label:'Banco BAI',category:'Banco',fare:250,x:180,z:-28},
 {id:'chevron',label:'Chevron',category:'Empresa',fare:350,x:235,z:-60},
 {id:'taf',label:'Campo de Futebol TAF',category:'Desporto',fare:300,x:265,z:72},
 {id:'restaurant-polonia',label:'Restaurante Polónia',category:'Restauração',fare:250,x:155,z:72},
 {id:'parish',label:'Paróquia Católica',category:'Religião',fare:200,x:180,z:72},
 {id:'government-park',label:'Parque do Governo',category:'Parque',fare:150,x:239,z:-40},
 {id:'residential-10',label:'Residencial · 10 Apartamentos',category:'Residencial',fare:200,x:235,z:70},
 {id:'residential-tower',label:'Torre Residencial',category:'Residencial',fare:200,x:235,z:25},
 {id:'residential-family',label:'Residencial Familiar',category:'Residencial',fare:200,x:235,z:-22},
 {id:'police-largo',label:'Esquadra do Largo do Ambiente',category:'Segurança',fare:250,x:265,z:-22}
];
const MONEY=n=>new Intl.NumberFormat('pt-PT').format(Number(n)||0)+' Kz';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function createGraph(){
 const nodes=new Map(),edges=new Map();
 const add=(id,x,z)=>{nodes.set(id,{id,x,z});if(!edges.has(id))edges.set(id,new Set())};
 const link=(a,b)=>{if(!nodes.has(a)||!nodes.has(b))return;edges.get(a).add(b);edges.get(b).add(a)};
 for(const x of ROAD_X)for(const z of ROAD_Z)add(pg(x,z),x,z);
 for(const x of ROAD_X)for(let i=0;i<ROAD_Z.length-1;i++)link(pg(x,ROAD_Z[i]),pg(x,ROAD_Z[i+1]));
 for(const z of ROAD_Z)for(let i=0;i<ROAD_X.length-1;i++)link(pg(ROAD_X[i],z),pg(ROAD_X[i+1],z));
 for(const x of LARGO_X)for(const z of LARGO_Z)add(la(x,z),x,z);
 for(const x of LARGO_X)for(let i=0;i<LARGO_Z.length-1;i++)link(la(x,LARGO_Z[i]),la(x,LARGO_Z[i+1]));
 for(const z of LARGO_Z)for(let i=0;i<LARGO_X.length-1;i++)link(la(LARGO_X[i],z),la(LARGO_X[i+1],z));
 add(la(111,14),111,14);add(la(145,14),145,14);
 link(pg(70,14),la(111,14));link(la(111,14),la(145,14));link(la(145,14),la(145,0));
 // Cortes de segurança: o Governo, o parque e o campo TAF ocupam áreas que não são vias.
 const cut=(a,b)=>{edges.get(a)?.delete(b);edges.get(b)?.delete(a)};
 cut(la(145,0),la(205,0));       // parque central do Largo do Ambiente
 cut(la(205,0),la(205,-48));     // edifício do Governo Provincial
 cut(la(265,0),la(265,-48));     // esquadra do Largo do Ambiente
 cut(la(265,48),la(265,96));     // campo de futebol TAF
 return {nodes,edges};
}
function shortestPath(graph,start,end){
 if(!graph.nodes.has(start)||!graph.nodes.has(end))return null;
 if(start===end)return [start];
 const queue=[start],previous=new Map([[start,null]]);
 for(let i=0;i<queue.length;i++){
  const node=queue[i];if(node===end)break;
  for(const next of graph.edges.get(node)||[])if(!previous.has(next)){previous.set(next,node);queue.push(next)}
 }
 if(!previous.has(end))return null;
 const path=[];let node=end;while(node){path.unshift(node);node=previous.get(node)}
 return path;
}
function nearestNode(graph,x,z){
 let best=null,distance=Infinity;
 for(const node of graph.nodes.values()){const d=Math.hypot(node.x-x,node.z-z);if(d<distance){best=node;distance=d}}
 return best?{...best,distance}:null;
}
function makeBusModel(THREE,label){
 const group=new THREE.Group(),body=new THREE.MeshStandardMaterial({color:'#e8e6d8',roughness:.58}),blue=new THREE.MeshStandardMaterial({color:'#174d77',roughness:.48}),red=new THREE.MeshStandardMaterial({color:'#b93832',roughness:.5}),glass=new THREE.MeshStandardMaterial({color:'#294754',roughness:.22,metalness:.12}),rubber=new THREE.MeshStandardMaterial({color:'#171b1e',roughness:.95}),rim=new THREE.MeshStandardMaterial({color:'#b7c1c4',roughness:.4}),lamp=new THREE.MeshStandardMaterial({color:'#fff0bb',emissive:'#6d5b2c',emissiveIntensity:.3}),dark=new THREE.MeshStandardMaterial({color:'#20282d',roughness:.8});
 const part=(geo,material,x,y,z,parent=group)=>{const m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m};
 // Autocarro de dimensões rodoviárias, com carroçaria, tejadilho, vidros e portas.
 part(new THREE.BoxGeometry(2.42,1.28,7.25),body,0,1.28,0);
 part(new THREE.BoxGeometry(2.46,.22,7.3),blue,0,.72,0);
 part(new THREE.BoxGeometry(2.35,.15,7.05),blue,0,1.96,0);
 part(new THREE.BoxGeometry(2.28,.12,6.85),body,0,2.08,0);
 part(new THREE.BoxGeometry(2.25,.12,1.05),red,0,1.02,-2.95);
 part(new THREE.BoxGeometry(2.25,.12,1.05),red,0,1.02,2.95);
 // Frente e traseira envidraçadas.
 part(new THREE.BoxGeometry(2.05,.86,.08),glass,0,1.55,3.64);
 part(new THREE.BoxGeometry(2.05,.78,.08),glass,0,1.53,-3.64);
 // Janelas laterais segmentadas, com pilares verticais reais.
 for(const side of [-1,1]){
  for(const z of [-2.65,-1.58,-.51,.56,1.63,2.70]){
   part(new THREE.BoxGeometry(.045,.78,.92),glass,side*1.225,1.57,z);
   part(new THREE.BoxGeometry(.065,.86,.055),blue,side*1.25,1.57,z+.49);
  }
  part(new THREE.BoxGeometry(.09,.95,.07),blue,side*1.25,1.55,-.05);
  // Porta de duas folhas deslizantes.
  const door=part(new THREE.BoxGeometry(.055,1.72,1.05),glass,side*1.255,1.34,.08);
  door.userData.transitDoor=true;
  part(new THREE.BoxGeometry(.075,.08,1.1),blue,side*1.27,2.2,.08);
  // Rodas duplas por eixo.
  for(const z of [-2.35,2.35]){
   const wheel=part(new THREE.CylinderGeometry(.48,.48,.22,18),rubber,side*1.23,.5,z);wheel.rotation.z=Math.PI/2;wheel.userData.transitWheel=true;
   const hub=part(new THREE.CylinderGeometry(.23,.23,.235,16),rim,side*1.245,.5,z);hub.rotation.z=Math.PI/2;hub.userData.transitWheel=true;
   const cap=part(new THREE.CylinderGeometry(.085,.085,.24,12),dark,side*1.26,.5,z);cap.rotation.z=Math.PI/2;cap.userData.transitWheel=true;
  }
  part(new THREE.BoxGeometry(.08,.19,.36),dark,side*1.27,1.08,3.18);
  part(new THREE.BoxGeometry(.12,.18,.3),lamp,side*.78,1.15,3.69);
  part(new THREE.BoxGeometry(.12,.18,.3),red,side*.78,1.12,-3.69);
  part(new THREE.BoxGeometry(.08,.06,.42),dark,side*1.31,2.18,2.95);
 }
 part(new THREE.BoxGeometry(2.15,.15,.12),dark,0,.77,3.69);
 part(new THREE.BoxGeometry(2.15,.15,.12),dark,0,.77,-3.69);
 // Letreiro frontal com identificação da transportadora.
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=96;const ctx=canvas.getContext('2d');
 ctx.fillStyle='#123c5c';ctx.fillRect(0,0,512,96);ctx.fillStyle='#fff4d6';ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TRANSPORTE VIANA',256,48);
 const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
 const sign=part(new THREE.PlaneGeometry(1.62,.3),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),0,2.13,3.705);
 sign.rotation.x=0;
 const rearSign=part(new THREE.PlaneGeometry(1.45,.25),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),0,2.12,-3.705);rearSign.rotation.y=Math.PI;
 group.userData.transitDoors=[];group.userData.transitWheels=[];
 group.traverse(o=>{if(o.userData.transitDoor)group.userData.transitDoors.push(o);if(o.userData.transitWheel)group.userData.transitWheels.push(o)});
 group.userData.label=label;return group;
}
export function createCityTransit({THREE,target,sb,user,host,getPlayerPosition,getOtherVehicles=()=>[],canUseTransit=()=>true,openLifePanel,refreshPlayerWallet,onBoard,onAlight,onPassengersChanged}){
 const graph=createGraph(),buses=new Map(),passengers=new Map(),destinations=new Map(DESTINATIONS.map(d=>[d.id,d]));
 let channel=null,alive=true,claimElapsed=0,localPassenger=null,mapButton=null,activeBusId=null;const handledArrivals=new Set();
 const panel=document.getElementById('life-panel');
 function setBusRow(row){
  if(!row?.bus_id)return;
  let state=buses.get(row.bus_id);
  if(!state){const model=makeBusModel(THREE,row.label||row.bus_id);target.add(model);state={model,data:row,lastPersist:0,pending:false,needsAlight:false,alightNode:null,lastAlightAttemptAt:0,stopClock:0};buses.set(row.bus_id,state)}
  else state.data={...state.data,...row};
  state.data=row;
  if(state.data.controller_id===user.id&&state.data.controller_until&&new Date(state.data.controller_until).getTime()>Date.now())state.isController=true;
  else if(state.isController&&state.data.controller_id!==user.id)state.isController=false;
  placeBus(state,0);
 }
 function placeBus(state,speed=0){
  const d=state.data,node=graph.nodes.get(d.current_node);
  if(!Number.isFinite(Number(d.x))||!Number.isFinite(Number(d.z)))return;
  state.model.position.set(Number(d.x),0,Number(d.z));
  state.model.rotation.y=Number(d.rotation)||0;
  state.model.userData.busId=d.bus_id;
  state.model.userData.busState=d.status;
  state.model.userData.transitSpeed=speed;
  const doors=state.model.userData.transitDoors||[];
  doors.forEach(door=>{const side=Math.sign(door.position.x)||1;door.position.z=d.doors_open ? 0.72 : 0.08;door.position.x=side*1.255});
  if(node&&d.status==='stopped')state.model.position.y=.015;
 }
 function updatePassengers(rows){
  const next=new Map();
  (rows||[]).forEach(row=>{if(row?.id)next.set(row.id,row)});
  passengers.clear();for(const [id,row] of next)passengers.set(id,row);
  const own=[...passengers.values()].find(p=>p.user_id===user.id&&p.status==='onboard')||null;
  if(own&&localPassenger?.id!==own.id){localPassenger=own;onBoard?.(own)}
  const ownArrived=[...passengers.values()].find(p=>p.user_id===user.id&&p.status==='arrived'&&!handledArrivals.has(p.id));
  if(ownArrived){handledArrivals.add(ownArrived.id);if(!localPassenger||localPassenger.id===ownArrived.id){localPassenger=null;onAlight?.({x:Number(ownArrived.drop_x),z:Number(ownArrived.drop_z),destination:destinations.get(ownArrived.destination_id)?.label||'Destino'});}}
  onPassengersChanged?.(passengers);
 }
 async function loadPassengers(){
  const {data,error}=await sb.from('city_transit_passengers').select('*').in('status',['onboard']);
  if(error){console.warn('Passageiros dos autocarros:',error.message);return}
  updatePassengers(data||[]);
 }
 async function persist(state,force=false){
  if(!state.isController||state.pending)return;
  const now=Date.now();if(!force&&now-state.lastPersist<1050)return;
  state.pending=true;state.lastPersist=now;
  const d=state.data;
  const {data,error}=await sb.rpc('city_transit_update_bus',{
   p_bus_id:d.bus_id,p_x:Number(d.x),p_z:Number(d.z),p_rotation:Number(d.rotation)||0,
   p_current_node:d.current_node,p_route_index:Number(d.route_index)||0,p_requested_node:d.requested_node||null,
   p_active_path:Array.isArray(d.active_path)?d.active_path:null,p_path_index:Number(d.path_index)||0,
   p_status:d.status,p_doors_open:!!d.doors_open,p_stop_until:d.stop_until||null
  });
  state.pending=false;
  if(error){console.warn('Sincronização do autocarro '+d.bus_id+':',error.message);state.isController=false;return}
  state.data={...state.data,...data};
  if(state.needsAlight&&state.alightNode){
   const node=state.alightNode;state.needsAlight=false;state.alightNode=null;state.lastAlightAttemptAt=Date.now();
   const {error:alightError}=await sb.rpc('city_transit_alight',{p_bus_id:d.bus_id,p_node_id:node});
   if(alightError){state.needsAlight=true;state.alightNode=node;console.warn('Desembarque:',alightError.message);}
  }
 }
 async function claimControllers(){
  if(!alive||!user)return;
  for(const [id,state] of buses){
   if(state.isController&&state.data.controller_until&&new Date(state.data.controller_until).getTime()>Date.now())continue;
   const {data,error}=await sb.rpc('city_transit_claim_bus',{p_bus_id:id});
   if(error){console.warn('Controlo do autocarro:',error.message);continue}
   if(data){setBusRow(data);const current=buses.get(id);current.isController=data.controller_id===user.id}
  }
 }
 function routeFor(state){return ROUTES[state.data.route_id]||FULL_ROUTE}
 function startDetour(state){
  const d=state.data;if(!d.requested_node||d.active_path?.length)return;
  const path=shortestPath(graph,d.current_node,d.requested_node);
  if(!path){d.requested_node=null;return}
  if(path.length<=1){d.status='stopped';d.doors_open=true;d.stop_until=new Date(Date.now()+18000).toISOString();d.requested_node=null;state.needsAlight=true;state.alightNode=d.current_node;return}
  d.active_path=path;d.path_index=1;
 }
 function destinationAtNode(nodeId){
  for(const passenger of passengers.values()){
   if(passenger.status!=='onboard')continue;
   const dest=destinations.get(passenger.destination_id);
   if(dest&&dest.stopNode===nodeId)return true;
  }
  return false;
 }
 function nextWaypoint(state){
  const d=state.data;
  if(Array.isArray(d.active_path)&&d.active_path.length){
   const index=Math.max(1,Number(d.path_index)||1);
   return d.active_path[index]||null;
  }
  const route=routeFor(state);return route[(Number(d.route_index)||0)%route.length]||route[0];
 }
 function routeIndexAfterNode(state,nodeId){
  const route=routeFor(state),current=Number(state.data.route_index)||0;let best=-1,offset=Infinity;
  for(let i=0;i<route.length;i++)if(route[i]===nodeId){const distance=(i-current+route.length)%route.length;if(distance<offset){offset=distance;best=i}}
  return best>=0?(best+1)%route.length:(current+1)%route.length;
 }
 function arriveAtNode(state,nodeId,requested=false){
  const d=state.data,node=graph.nodes.get(nodeId),wasDetour=Array.isArray(d.active_path)&&d.active_path.length>0;if(!node)return;
  d.current_node=nodeId;d.x=node.x;d.z=node.z;
  if(Array.isArray(d.active_path)&&d.active_path.length){
   const idx=Math.max(1,Number(d.path_index)||1);
   if(idx>=d.active_path.length-1){
    d.route_index=routeIndexAfterNode(state,nodeId);
    d.active_path=null;d.path_index=0;d.requested_node=null;d.status='stopped';d.doors_open=true;
    d.stop_until=new Date(Date.now()+(requested||wasDetour?18000:8000)).toISOString();
    state.needsAlight=true;state.alightNode=nodeId;
   }else d.path_index=idx+1;
  }else{
   const route=routeFor(state);d.route_index=((Number(d.route_index)||0)+1)%route.length;
   if(destinationAtNode(nodeId)){
    d.status='stopped';d.doors_open=true;d.stop_until=new Date(Date.now()+8000).toISOString();
    state.needsAlight=true;state.alightNode=nodeId;
   }
  }
 }
 function updateController(state,delta,now){
  const d=state.data;if(!state.isController)return;
  if(d.status==='stopped'&&destinationAtNode(d.current_node)&&!state.needsAlight&&Date.now()-state.lastAlightAttemptAt>5000){state.needsAlight=true;state.alightNode=d.current_node;persist(state,true)}
  if(d.status==='stopped'){
   if(d.stop_until&&Date.now()<new Date(d.stop_until).getTime()){placeBus(state,0);persist(state);return}
   d.status='moving';d.doors_open=false;d.stop_until=null;d.active_path=null;d.path_index=0;
  }
  if(d.requested_node&&!d.active_path)startDetour(state);
  if(d.status==='stopped'){placeBus(state,0);persist(state,true);return}
  const nextId=nextWaypoint(state),next=graph.nodes.get(nextId);
  if(!next){d.route_index=((Number(d.route_index)||0)+1)%routeFor(state).length;persist(state,true);return}
  const dx=next.x-Number(d.x),dz=next.z-Number(d.z),distance=Math.hypot(dx,dz);
  if(distance<.12){arriveAtNode(state,nextId,!!d.active_path?.length);persist(state,true);return}
  const speed=6.2,step=Math.min(distance,speed*delta),nx=Number(d.x)+dx/distance*step,nz=Number(d.z)+dz/distance*step;
  const traffic=[...buses.values()].some(other=>{if(other===state)return false;const ox=Number(other.data.x)-Number(d.x),oz=Number(other.data.z)-Number(d.z),gap=Math.hypot(ox,oz);if(gap>=8.4)return false;const otherNext=nextWaypoint(other),otherPoint=graph.nodes.get(otherNext);const odx=otherPoint?otherPoint.x-Number(other.data.x):0,odz=otherPoint?otherPoint.z-Number(other.data.z):0;const dot=(dx*odx+dz*odz)/Math.max(.001,distance*Math.hypot(odx,odz));if(dot<-.3)return d.bus_id>other.data.bus_id;if(Math.abs(dot)<=.3)return d.bus_id>other.data.bus_id;return ox*dx+oz*dz>0;});
  const vehicles=(getOtherVehicles?.()||[]).some(v=>v?.group&&v.group.visible!==false&&Math.hypot(v.group.position.x-nx,v.group.position.z-nz)<6.2);
  if(traffic||vehicles){placeBus(state,0);persist(state);return}
  const desiredYaw=Math.atan2(dx,dz);let turn=desiredYaw-(Number(d.rotation)||0);while(turn>Math.PI)turn-=Math.PI*2;while(turn< -Math.PI)turn+=Math.PI*2;
  d.rotation=(Number(d.rotation)||0)+turn*Math.min(1,delta*4.5);
  d.x=nx;d.z=nz;
  const wheelSpin=step/.48;for(const wheel of state.model.userData.transitWheels||[])wheel.rotation.x+=wheelSpin;
  placeBus(state,speed);persist(state);
 }
 function svgPoint(x,z){return {x:22+(x+80)/370*516,y:22+(110-z)/210*326}}
 function showMap(){
  const roads=[];
  for(const x of ROAD_X){const a=svgPoint(x,-72),b=svgPoint(x,72);roads.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'"/>')}
  for(const z of ROAD_Z){const a=svgPoint(-72,z),b=svgPoint(72,z);roads.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'"/>')}
  for(const x of LARGO_X){const a=svgPoint(x,-82),b=svgPoint(x,102);roads.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'"/>')}
  for(const z of LARGO_Z){const a=svgPoint(130,z),b=svgPoint(280,z);roads.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'"/>')}
  const a=svgPoint(70,14),b=svgPoint(145,14);roads.push('<line x1="'+a.x+'" y1="'+a.y+'" x2="'+b.x+'" y2="'+b.y+'" stroke-dasharray="5 4"/>');
  const markers=DESTINATIONS.map(d=>{const p=svgPoint(d.x,d.z);return '<g><circle cx="'+p.x+'" cy="'+p.y+'" r="4.2" fill="#e8bb5c" stroke="#fff" stroke-width="1.5"/><title>'+esc(d.label)+'</title></g>'}).join('');
  const stopNodes=new Map();DESTINATIONS.forEach(d=>{const n=graph.nodes.get(d.stopNode);if(n)stopNodes.set(n.id,n)});
  const stopMarkers=[...stopNodes.values()].map(n=>{const p=svgPoint(n.x,n.z);return '<rect x="'+(p.x-3)+'" y="'+(p.y-3)+'" width="6" height="6" rx="1" fill="#2599a4" stroke="#fff" stroke-width="1"><title>Paragem de autocarro</title></rect>'}).join('');
  const busMarkers=[...buses.values()].map((s,i)=>{const p=svgPoint(Number(s.data.x),Number(s.data.z));return '<g><circle cx="'+p.x+'" cy="'+p.y+'" r="7" fill="#d94b42" stroke="#fff" stroke-width="2"/><text x="'+p.x+'" y="'+(p.y+3)+'" text-anchor="middle" font-size="8" fill="#fff">'+(i+1)+'</text></g>'}).join('');
  const list=DESTINATIONS.map(d=>'<div class="life-row"><span><b>'+esc(d.label)+'</b><br><small>'+esc(d.category)+'</small></span><b>'+MONEY(d.fare)+'</b></div>').join('');
  openLifePanel('🗺️ Mapa da cidade e transportes','<p class="life-muted">Mapa rodoviário de Povo Grande e do Largo do Ambiente. Os bairros são áreas distintas, ligadas pela avenida.</p><div style="background:#e9e4d5;border-radius:12px;padding:7px;overflow:hidden"><svg viewBox="0 0 560 370" role="img" aria-label="Mapa de Povo Grande e Largo do Ambiente" style="width:100%;height:auto"><g stroke="#a69a85" stroke-width="5" fill="none" stroke-linecap="round">'+roads.join('')+'</g><g fill="#24553e" font-size="12" font-weight="bold"><text x="70" y="28">POVO GRANDE</text><text x="350" y="28">LARGO DO AMBIENTE</text></g>'+markers+stopMarkers+busMarkers+'</svg></div><p class="life-muted">🟡 Locais importantes · 🔷 Paragens · 🔴 Autocarros em circulação</p><h3>Destinos e preços</h3><div class="life-list" style="max-height:260px;overflow:auto">'+list+'</div><button class="secondary" data-transit-refresh-map>↻ Actualizar mapa</button>');
 }
 function showFares(busId){
  const bus=buses.get(busId),rows=DESTINATIONS.map(d=>'<div class="life-row"><span><b>'+esc(d.label)+'</b><br><small>'+esc(d.category)+'</small></span><b>'+MONEY(d.fare)+'</b></div>').join('');
  openLifePanel('🚌 Destinos e preços','<p class="life-muted">'+esc(bus?.data.label||'Autocarro')+' · Pagamento pela carteira virtual. O valor é cobrado apenas quando confirmares o embarque.</p><div class="life-list" style="max-height:360px;overflow:auto">'+rows+'</div><button class="secondary" data-transit-map>🗺️ Ver mapa da cidade</button>');
 }
 function showBoarding(busId){
  const bus=buses.get(busId);if(!bus)return;
  const rows=DESTINATIONS.map(d=>'<button class="secondary" style="width:100%;display:flex;justify-content:space-between;margin:5px 0" data-transit-destination="'+d.id+'" data-transit-bus="'+busId+'"><span>'+esc(d.label)+'</span><b>'+MONEY(d.fare)+'</b></button>').join('');
  openLifePanel('🚍 Embarcar · '+esc(bus.data.label),'<p class="life-muted">Escolhe o destino. O bilhete será debitado da tua carteira virtual uma única vez.</p><div class="life-list">'+rows+'</div><p id="transit-booking-message" class="life-muted">Capacidade máxima: 24 passageiros.</p>');
 }
 function showBusMenu(busId){
  const bus=buses.get(busId);if(!bus)return;
  const stopped=bus.data.status==='stopped'&&bus.data.doors_open;
  const actions=stopped?'<button id="transit-board" data-transit-board="'+busId+'">🚍 Embarcar e escolher destino</button>':'<button id="transit-stop" data-transit-stop="'+busId+'">🛑 Mandar parar perto de mim</button>';
  openLifePanel('🚌 '+esc(bus.data.label||'Autocarro'),' <p class="life-muted">Autocarro autónomo · '+(stopped?'Parado com as portas abertas.':'Em circulação pela rede rodoviária.')+'</p>'+actions+'<button class="secondary" data-transit-fares="'+busId+'">📋 Ver destinos e preços</button><button class="secondary" data-transit-map>🗺️ Ver mapa da cidade</button><button class="secondary" data-transit-cancel>Cancelar</button>');
 }
 function nearestPlayerRoadNode(busId){
  const pos=getPlayerPosition?.(),bus=buses.get(busId);if(!pos||!bus)return null;
  const route=new Set(routeFor(bus)),candidates=new Map();
  for(const destination of DESTINATIONS){if(!destination.stopNode||!route.has(destination.stopNode))continue;const node=graph.nodes.get(destination.stopNode);if(node)candidates.set(node.id,node)}
  let best=null,distance=Infinity;
  for(const node of candidates.values()){const d=Math.hypot(node.x-Number(pos.x),node.z-Number(pos.z));if(d<distance){best=node;distance=d}}
  return best?{...best,distance}:null;
 }
 async function requestStop(busId){
  if(!canUseTransit?.()){openLifePanel('Transporte público','<p class="life-muted">Sai do teu veículo antes de pedir a paragem do autocarro.</p>');return}
  const node=nearestPlayerRoadNode(busId);if(!node){openLifePanel('Paragem do autocarro','<p class="life-muted">Aproxima-te de uma estrada principal ou de uma paragem identificada para pedir que o autocarro se aproxime.</p>');return}
  const {data,error}=await sb.rpc('city_transit_request_stop',{p_bus_id:busId,p_node_id:node.id});
  if(error){openLifePanel('Não foi possível pedir a paragem','<p class="life-muted">'+esc(error.message)+'</p>');return}
  if(data)setBusRow(data);
  openLifePanel('🚌 Pedido enviado','<p class="life-muted">O autocarro vai seguir pelas estradas até à paragem segura mais próxima da tua posição. Aguarda junto à estrada.</p><button class="secondary" data-transit-map>🗺️ Acompanhar no mapa</button>');
 }
 async function board(busId,destinationId,button){
  if(!canUseTransit?.()){openLifePanel('Transporte público','<p class="life-muted">Sai do teu veículo antes de embarcar no autocarro.</p>');return}
  if(button){button.disabled=true;button.textContent='A confirmar…'}
  const {data,error}=await sb.rpc('city_transit_board',{p_bus_id:busId,p_destination_id:destinationId});
  if(error){const msg=document.getElementById('transit-booking-message');if(msg)msg.textContent=error.message;if(button){button.disabled=false;button.textContent='Tentar novamente'}return}
  const passenger={id:data.passenger_id,bus_id:busId,user_id:user.id,destination_id:destinationId,fare:Number(data.fare),status:'onboard'};passengers.set(passenger.id,passenger);updatePassengers([...passengers.values()]);
  await refreshPlayerWallet?.();await loadPassengers();
  openLifePanel('✅ Bilhete confirmado','<p class="life-muted">Destino: <b>'+esc(data.destination)+'</b><br>Bilhete: <b>'+MONEY(data.fare)+'</b><br>Saldo restante: <b>'+MONEY(data.balance)+'</b></p><p>Boa viagem! O autocarro vai deixar-te na paragem do destino escolhido.</p>');
 }
 function onPanelClick(e){
  const b=e.target.closest?.('[data-transit-stop],[data-transit-fares],[data-transit-map],[data-transit-refresh-map],[data-transit-board],[data-transit-destination],[data-transit-cancel]');
  if(!b)return;
  if(b.dataset.transitStop){requestStop(b.dataset.transitStop);return}
  if(b.dataset.transitFares){showFares(b.dataset.transitFares);return}
  if(b.hasAttribute('data-transit-map')||b.hasAttribute('data-transit-refresh-map')){showMap();return}
  if(b.dataset.transitBoard){showBoarding(b.dataset.transitBoard);return}
  if(b.dataset.transitDestination){board(b.dataset.transitBus,b.dataset.transitDestination,b);return}
  if(b.hasAttribute('data-transit-cancel')){document.getElementById('life-panel')?.classList.add('hidden')}
 }
 function pickBus(raycaster,pointer,camera,canvas,event){
  pointer.x=((event.clientX-canvas.getBoundingClientRect().left)/canvas.getBoundingClientRect().width)*2-1;
  pointer.y=-((event.clientY-canvas.getBoundingClientRect().top)/canvas.getBoundingClientRect().height)*2+1;
  raycaster.setFromCamera(pointer,camera);
  const roots=[...buses.values()].map(s=>s.model),hit=raycaster.intersectObjects(roots,true)[0];
  if(!hit)return false;
  let node=hit.object;while(node&&!node.userData.busId)node=node.parent;
  if(node?.userData.busId){activeBusId=node.userData.busId;showBusMenu(activeBusId);return true}
  return false;
 }
 function createMapButton(){
  mapButton=document.createElement('button');mapButton.type='button';mapButton.textContent='🗺️ MAPA / AUTOCARROS';
  mapButton.style.cssText='position:absolute;z-index:35;top:48px;right:10px;padding:9px 11px;border:1px solid #d8c28e;border-radius:11px;background:#123d32ed;color:#fff7df;font:700 11px system-ui;box-shadow:0 3px 12px #0005';
  mapButton.addEventListener('click',showMap);host.appendChild(mapButton);
 }
 async function init(){
  const {data,error}=await sb.from('city_transit_buses').select('*');
  if(error){console.warn('Autocarros:',error.message);return}
  (data||[]).forEach(setBusRow);
  const {data:destRows,error:destError}=await sb.from('city_transit_destinations').select('*');
  if(!destError&&destRows)destRows.forEach(d=>{const item=destinations.get(d.destination_id);if(item){item.stopNode=d.stop_node_id;item.fare=Number(d.fare);item.x=Number(d.x);item.z=Number(d.z)}});
  const {data:passengerRows}=await sb.from('city_transit_passengers').select('*').eq('status','onboard');
  updatePassengers(passengerRows||[]);
  channel=sb.channel('city-transit-live-'+user.id)
   .on('postgres_changes',{event:'*',schema:'public',table:'city_transit_buses'},payload=>{if(payload.new?.bus_id)setBusRow(payload.new)})
   .on('postgres_changes',{event:'*',schema:'public',table:'city_transit_passengers'},async payload=>{
    if(payload.new?.id){if(payload.new.status==='onboard'||payload.new.status==='arrived')passengers.set(payload.new.id,payload.new);else passengers.delete(payload.new.id)}
    if(payload.eventType==='DELETE'&&payload.old?.id)passengers.delete(payload.old.id);
    const rows=[...passengers.values()];updatePassengers(rows);
   }).subscribe();
  await claimControllers();
 }
 panel?.addEventListener('click',onPanelClick);
 createMapButton();init().catch(error=>console.warn('Transporte público:',error));
 return {
  update(delta,now){
   if(!alive)return;
   claimElapsed+=delta;
   if(claimElapsed>4){claimElapsed=0;claimControllers().catch(()=>{})}
   for(const state of buses.values()){
    if(state.isController)updateController(state,Math.min(delta,.05),now);
    else placeBus(state,0);
   }
  },
  pickBus,
  isPassenger:()=>!!localPassenger,
  getRidePosition(){
   if(!localPassenger)return null;
   const state=buses.get(localPassenger.bus_id);return state?{x:Number(state.data.x)||0,z:Number(state.data.z)||0}:null;
  },
  isPlayerOnboard(id){return [...passengers.values()].some(p=>p.user_id===id&&p.status==='onboard')},
  cleanup(){
   alive=false;panel?.removeEventListener('click',onPanelClick);
   if(channel)sb.removeChannel(channel);
   if(mapButton){mapButton.removeEventListener('click',showMap);mapButton.remove()}
   for(const state of buses.values())target.remove(state.model);
   buses.clear();passengers.clear();
  }
 };
}
