import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.179.1/build/three.module.js';

const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x91c7d8);
scene.fog = new THREE.Fog(0x91c7d8, 120, 240);

const camera = new THREE.PerspectiveCamera(48, 1, .1, 600);
const MAP = 300;
const HALF = MAP/2;

scene.add(new THREE.HemisphereLight(0xdff6ff,0x2b3b27,2.1));
const sun = new THREE.DirectionalLight(0xfff3cf,2.2);
sun.position.set(55,85,30); sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);
sun.shadow.camera.left=-80; sun.shadow.camera.right=80; sun.shadow.camera.top=80; sun.shadow.camera.bottom=-80;
scene.add(sun);

const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(MAP,MAP),
  new THREE.MeshStandardMaterial({color:0x4d963f,roughness:.98})
);
ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

// Caminos principales para que el mundo sea fácil de recorrer en pantallas pequeñas.
const pathMat = new THREE.MeshStandardMaterial({color:0xb99865,roughness:1});
function addPath(w,h,x,z){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),pathMat);m.rotation.x=-Math.PI/2;m.position.set(x,.012,z);m.receiveShadow=true;scene.add(m)}
addPath(20,MAP,0,0); addPath(MAP,18,0,0); addPath(14,120,-72,-45); addPath(14,130,78,42);

const obstacles=[];
function box(x,z,w,d,h,color){
 const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),new THREE.MeshStandardMaterial({color,roughness:.82}));
 m.position.set(x,h/2,z);m.castShadow=true;m.receiveShadow=true;scene.add(m);obstacles.push({x,z,hw:w/2+1.2,hd:d/2+1.2});return m;
}
function tree(x,z,s=1){
 const trunk=new THREE.Mesh(new THREE.CylinderGeometry(1.0*s,1.25*s,5*s,8),new THREE.MeshStandardMaterial({color:0x74512f}));
 trunk.position.set(x,2.5*s,z);trunk.castShadow=true;scene.add(trunk);
 const crown=new THREE.Mesh(new THREE.IcosahedronGeometry(3.8*s,1),new THREE.MeshStandardMaterial({color:0x2b713b,roughness:1}));
 crown.position.set(x,7*s,z);crown.castShadow=true;scene.add(crown);obstacles.push({x,z,hw:2.1*s,hd:2.1*s});
}

// Laboratorios grandes colocados lejos del punto de inicio para incentivar exploración.
box(-105,-95,34,24,13,0xdce4e8); box(105,-92,38,26,16,0xcbd8df); box(-108,96,30,28,14,0xe2ded0); box(108,100,42,25,15,0xbcd5ca);
for(const [x,z] of [[-105,-75],[105,-70],[-108,75],[108,78]]) box(x,z,13,5,4,0x3e7184);

// Pocos obstáculos, en bordes y zonas secundarias; el centro queda amplio para celular.
const rng=mulberry32(20260813);
for(let i=0;i<85;i++){
 let x=(rng()-.5)*(MAP-24), z=(rng()-.5)*(MAP-24);
 if(Math.abs(x)<20 || Math.abs(z)<18) {i--; continue;}
 if((Math.abs(x)>88 && Math.abs(z)>70)) {i--;continue;}
 tree(x,z,.72+rng()*.55);
}
for(let i=0;i<24;i++){
 let x=(rng()-.5)*(MAP-30),z=(rng()-.5)*(MAP-30);
 if(Math.abs(x)<18 || Math.abs(z)<18){i--;continue;}
 box(x,z,2+rng()*3,2+rng()*3,1.5+rng()*2,0x71806b);
}

function mulberry32(a){return function(){let t=a+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}

let chosen='man';
const palette={man:0x3e8fe0,woman:0xa55fd1,alt:0x42a96b};
const player=new THREE.Group();
const bodyMat=new THREE.MeshStandardMaterial({color:palette[chosen],roughness:.6});
const body=new THREE.Mesh(new THREE.CapsuleGeometry(1.7,3.7,5,10),bodyMat);body.position.y=3.4;body.castShadow=true;player.add(body);
const head=new THREE.Mesh(new THREE.SphereGeometry(1.45,18,14),new THREE.MeshStandardMaterial({color:0xe5b88e}));head.position.y=7.2;head.castShadow=true;player.add(head);
const hat=new THREE.Mesh(new THREE.ConeGeometry(2.1,3.3,12),new THREE.MeshStandardMaterial({color:0x23313a}));hat.position.y=9.2;hat.rotation.z=-.08;hat.castShadow=true;player.add(hat);
scene.add(player); player.position.set(0,0,0);

const keys={};
addEventListener('keydown',e=>keys[e.code]=true); addEventListener('keyup',e=>keys[e.code]=false);
let joy={x:0,y:0};
const joyEl=document.getElementById('joy'),knob=document.getElementById('knob');
function setJoy(clientX,clientY){const r=joyEl.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=clientX-cx,dy=clientY-cy;const max=r.width*.32,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max}joy.x=dx/max;joy.y=dy/max;knob.style.transform=`translate(${dx}px,${dy}px)`}
function resetJoy(){joy.x=joy.y=0;knob.style.transform='translate(0,0)'}
joyEl.addEventListener('pointerdown',e=>{joyEl.setPointerCapture(e.pointerId);setJoy(e.clientX,e.clientY)});
joyEl.addEventListener('pointermove',e=>{if(joyEl.hasPointerCapture(e.pointerId))setJoy(e.clientX,e.clientY)});
joyEl.addEventListener('pointerup',resetJoy);joyEl.addEventListener('pointercancel',resetJoy);

document.querySelectorAll('.char').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.char').forEach(x=>x.classList.remove('sel'));btn.classList.add('sel');chosen=btn.dataset.char;bodyMat.color.setHex(palette[chosen])}));
document.getElementById('start').addEventListener('click',()=>{document.getElementById('menu').style.display='none';});

document.getElementById('action').addEventListener('click',()=>{body.scale.set(1.12,.9,1.12);setTimeout(()=>body.scale.set(1,1,1),120)});

function collides(nx,nz){
 if(nx<-HALF+3||nx>HALF-3||nz<-HALF+3||nz>HALF-3)return true;
 for(const o of obstacles) if(Math.abs(nx-o.x)<o.hw+1.2 && Math.abs(nz-o.z)<o.hd+1.2)return true;
 return false;
}

const clock=new THREE.Clock();
const coords=document.getElementById('coords');
function resize(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.fov=w<h?58:46;camera.updateProjectionMatrix()}
addEventListener('resize',resize);resize();

function animate(){
 const dt=Math.min(clock.getDelta(),.033);let ix=0,iz=0;
 if(keys.KeyA||keys.ArrowLeft)ix-=1;if(keys.KeyD||keys.ArrowRight)ix+=1;if(keys.KeyW||keys.ArrowUp)iz-=1;if(keys.KeyS||keys.ArrowDown)iz+=1;
 ix+=joy.x; iz+=joy.y;
 const len=Math.hypot(ix,iz);
 if(len>.08){ix/=Math.max(1,len);iz/=Math.max(1,len);const speed=20;const nx=player.position.x+ix*speed*dt,nz=player.position.z+iz*speed*dt;if(!collides(nx,player.position.z))player.position.x=nx;if(!collides(player.position.x,nz))player.position.z=nz;player.rotation.y=Math.atan2(ix,iz);body.position.y=3.4+Math.sin(performance.now()*.013)*.12}
 const portrait=innerWidth<innerHeight;
 const desired=new THREE.Vector3(player.position.x,portrait?31:25,player.position.z+(portrait?24:29));
 camera.position.lerp(desired,1-Math.pow(.002,dt));camera.lookAt(player.position.x,2.5,player.position.z-4);
 coords.textContent=`${Math.round(player.position.x)}, ${Math.round(player.position.z)}`;
 renderer.render(scene,camera);requestAnimationFrame(animate)
}
animate();
