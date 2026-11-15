import * as THREE from 'three';
const SKIN=['#8d5524','#a96b42','#6f4028','#c58a61','#e0ad83'];
const HAIR=['#17120f','#3b2418','#b9b9b9','#d6a23a','#8b3027','#e8d8bd'];
const STYLES=['curto','espetado','encaracolado','comprido','rapado','afro'];
function mat(c){return new THREE.MeshStandardMaterial({color:c,roughness:.82});}
function mesh(p,n,g,c,pos,scale){const m=new THREE.Mesh(g,mat(c));m.name=n;m.position.set(...pos);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
function ball(p,n,c,pos,s){return mesh(p,n,new THREE.SphereGeometry(1,18,14),c,pos,s);}
export function createStylizedAvatar(a={},options={}){
 const root=new THREE.Group(), skin=a.skin||SKIN[0], hair=a.hair||HAIR[0], shirt=a.outfitColor||options.outfit||'#2877a8';
 const torso=new THREE.Group();root.add(torso);
 mesh(torso,'body-shirt',new THREE.CapsuleGeometry(.36,.52,5,10),shirt,[0,1.18,0],[1,1,.78]);
 mesh(torso,'body-neck',new THREE.CylinderGeometry(.13,.16,.22,12),skin,[0,1.67,0]);
 ball(torso,'body-head',skin,[0,2.08,0],[.48,.52,.43]);
 for(const x of [-.47,.47])ball(torso,'ear',skin,[x,2.08,0],[.12,.17,.11]);
 for(const x of [-.18,.18]){ball(torso,'eye-white','#fffdf5',[x,2.16,.374],[.09,.105,.045]);ball(torso,'eye-pupil','#241a16',[x,2.15,.414],[.043,.06,.025]);mesh(torso,'eyebrow',new THREE.BoxGeometry(.15,.035,.04),hair,[x,2.31,.39]);}
 ball(torso,'nose',skin,[0,2.02,.43],[.075,.12,.09]);mesh(torso,'mouth',new THREE.BoxGeometry(.17,.025,.025),'#6e302a',[0,1.91,.405]);
 const cap=ball(torso,'hair-cap',hair,[0,2.47,-.015],[.49,.24,.45]),style=STYLES.includes(a.hairstyle)?a.hairstyle:'curto';
 if(style==='espetado'){for(let i=0;i<7;i++){const q=i*Math.PI*2/7;mesh(torso,'hair-spike',new THREE.ConeGeometry(.13,.42,7),hair,[Math.cos(q)*.28,2.68+(i%2)*.05,Math.sin(q)*.22]);}}
 else if(style==='afro'||style==='encaracolado'){for(let i=0;i<(style==='afro'?18:12);i++){const q=i*Math.PI*(3-Math.sqrt(5));ball(torso,'hair-curl',hair,[Math.cos(q)*.38,2.48+i/(style==='afro'?18:12)*.36,Math.sin(q)*.34],[.14,.14,.14]);}}
 else if(style==='comprido'){for(const x of [-.39,.39])mesh(torso,'hair-long',new THREE.CapsuleGeometry(.105,.48,4,8),hair,[x,2.12,-.02]);}
 else if(style==='rapado'){cap.scale.set(.48,.12,.44);cap.position.y=2.48;}
 const arms=[],legs=[];
 for(const side of [-1,1]){const arm=new THREE.Group();arm.position.set(side*.43,1.48,0);torso.add(arm);mesh(arm,'body-arm',new THREE.CapsuleGeometry(.115,.48,4,8),skin,[0,-.28,0]);ball(arm,'body-hand',skin,[0,-.57,.01],[.13,.14,.13]);arms.push(arm);}
 for(const side of [-1,1]){const leg=new THREE.Group();leg.position.set(side*.19,.83,0);root.add(leg);mesh(leg,'body-leg',new THREE.CapsuleGeometry(.15,.48,4,8),'#26344c',[0,-.28,0]);mesh(leg,'body-shoe',new THREE.BoxGeometry(.24,.13,.38),'#242424',[0,-.58,.1]);legs.push(leg);}
 root.userData.avatarParts={arms,legs,torso};root.userData.appearance={...a};return root;
}
export function applyStylizedAppearance(root,a={}){if(!root)return;const v={...root.userData.appearance,...a};root.userData.appearance=v;root.traverse(o=>{if(!o.isMesh||!o.material)return;const n=o.name||'';const c=/hair/.test(n)?v.hair:/head|ear|nose|neck|arm|hand/.test(n)?v.skin:/shirt/.test(n)?(v.outfitColor||'#2877a8'):/leg/.test(n)?(v.bottomColor||'#26344c'):null;if(c)o.material.color.set(c);});}
export const AVATAR_OPTIONS={skin:SKIN,hair:HAIR,hairstyles:STYLES};
