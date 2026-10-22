// Adaptado del programa de Diego Balderas para mostrar barrel.obj de GitHub.
const CONFIG = {
  kind: 'shear',
  title: 'Actividad 2 · Inclinación (shear)',
  modelURL: 'https://cdn.jsdelivr.net/gh/JED-01/Practica2@main/modelos/barrel.obj',
  backupURL: 'https://raw.githubusercontent.com/JED-01/Practica2/main/modelos/barrel.obj',
  downloadURL: 'https://github.com/JED-01/Practica2/blob/main/modelos/barrel.obj'
};

// Motor común de Diego: OBJ, matrices y proyección 3D mediante Canvas 2D.
const rad = d => d * Math.PI / 180;
const I = () => [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];
function mul(A,B) {
  return A.map(row => B[0].map((_,j) =>
    row.reduce((sum,v,k) => sum + v * B[k][j],0)));
}
function apply(M,p) {
  const q = [...p,1];
  return M.slice(0,3).map(r => r.reduce((s,v,j) => s+v*q[j],0));
}
function rotation(axis,degrees) {
  const a=rad(degrees), c=Math.cos(a), s=Math.sin(a), M=I();
  const [i,j] = [[1,2],[2,0],[0,1]][axis];
  M[i][i]=c; M[i][j]=-s; M[j][i]=s; M[j][j]=c;
  return M;
}
function affine(v) {
  const S=I(), T=I();
  for(let i=0;i<3;i++) { S[i][i]=v['s'+i]; T[i][3]=v['t'+i]; }
  return mul(T,mul(rotation(2,v.r2),mul(rotation(1,v.r1),
    mul(rotation(0,v.r0),S))));
}
function shear(target,source,degrees) {
  if(target===source) throw Error('Los ejes deben ser distintos');
  const H=I(); H[target][source]=Math.tan(rad(degrees)); return H;
}
function deform(p,type,a) {
  const [x,y,z]=p;
  if(type==='twist') {
    const t=rad(a)*y/3, c=Math.cos(t), s=Math.sin(t);
    return [c*x+s*z,y,-s*x+c*z];
  }
  if(type==='taper') { const f=1+a*y/3; return [f*x,y,f*z]; }
  const k=rad(a)/3;
  if(Math.abs(k)<1e-8) return [...p];
  const t=k*y, r=1/k-x;
  return [x+r*2*Math.sin(t/2)**2,r*Math.sin(t),z];
}
function parseOBJ(text) {
  const vertices=[], faces=[];
  for(const line of text.split(/\r?\n/)) {
    const [tag,...a]=line.replace(/#.*/,'').trim().split(/\s+/);
    if(tag==='v') {
      const p=a.slice(0,3).map(Number);
      if(p.length!==3 || !p.every(Number.isFinite))
        throw Error('Vértice OBJ inválido');
      vertices.push(p);
    }
    if(tag==='f') {
      const ids=a.map(t => {
        const n=Number(t.split('/')[0]);
        const i=n<0 ? vertices.length+n : n-1;
        if(!Number.isInteger(n)||n===0||i<0||i>=vertices.length)
          throw Error('Índice OBJ inválido');
        return i;
      });
      if(ids.length<3) throw Error('Cara con menos de 3 vértices');
      for(let j=1;j<ids.length-1;j++) faces.push([ids[0],ids[j],ids[j+1]]);
    }
  }
  if(!vertices.length||!faces.length) throw Error('OBJ sin malla poligonal');
  if(vertices.length>20000||faces.length>40000)
    throw Error('Simplifica la malla: máximo 20 000 vértices / 40 000 caras');
  const lo=[0,1,2].map(i=>Math.min(...vertices.map(p=>p[i])));
  const hi=[0,1,2].map(i=>Math.max(...vertices.map(p=>p[i])));
  const size=Math.max(...hi.map((v,i)=>v-lo[i]));
  if(size<1e-10) throw Error('Modelo de tamaño cero');
  return {vertices:vertices.map(p=>p.map((v,i)=>
    (v-(lo[i]+hi[i])/2)*3/size)),faces};
}
function demoOBJ() {
  const lines=['# Columna sólida original; unidades arbitrarias'];
  const ring=[];
  const corners=[[-.6,-.45],[.6,-.45],[.6,.45],[-.6,.45]];
  for(let e=0;e<4;e++) for(let j=0;j<8;j++) {
    const p=corners[e],q=corners[(e+1)%4],t=j/8;
    ring.push([p[0]*(1-t)+q[0]*t,p[1]*(1-t)+q[1]*t]);
  }
  for(let h=0;h<=32;h++) for(const [x,z] of ring)
    lines.push(`v ${x} ${-1.5+3*h/32} ${z}`);
  for(let h=0;h<32;h++) for(let j=0;j<32;j++) {
    const a=h*32+j+1,b=h*32+(j+1)%32+1,c=b+32,d=a+32;
    lines.push(`f ${a} ${d} ${b}`,`f ${b} ${d} ${c}`);
  }
  lines.push('v 0 -1.5 0','v 0 1.5 0');
  for(let j=0;j<32;j++) {
    const a=j+1,b=(j+1)%32+1;
    lines.push(`f 1057 ${a} ${b}`,`f 1058 ${b+1024} ${a+1024}`);
  }
  return lines.join('\n');
}
function render(canvas,mesh,points,yaw,pitch,zoom) {
  const ctx=canvas.getContext('2d'), W=canvas.width, H=canvas.height;
  ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,W,H);
  const C=mul(rotation(0,pitch),rotation(1,yaw));
  const rotated=points.map(p=>apply(C,p));
  const project=p=>[W/2+p[0]*zoom,H/2-p[1]*zoom];
  // Ejes del mundo, ajenos a la transformación del objeto.
  ['#000000','#000000','#000000'].forEach((color,i)=>{
    const p=[0,0,0];p[i]=2.1;
    const q=project(apply(C,p));
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();
    ctx.moveTo(W/2,H/2);ctx.lineTo(...q);ctx.stroke();
    ctx.fillStyle=color;ctx.font='14px sans-serif';ctx.fillText('XYZ'[i],q[0]+4,q[1]);
  });
  const tris=mesh.faces.map(f=>({f,z:f.reduce((s,i)=>s+rotated[i][2],0)/3}));
  tris.sort((a,b)=>a.z-b.z);
  for(const {f} of tris) {
    const [a,b,c]=f.map(i=>rotated[i]);
    const u=b.map((v,i)=>v-a[i]),v=c.map((n,i)=>n-a[i]);
    const n=[u[1]*v[2]-u[2]*v[1],u[2]*v[0]-u[0]*v[2],u[0]*v[1]-u[1]*v[0]];
    const norm=Math.hypot(...n); if(norm<1e-12) continue;
    const light=.28+.72*Math.abs((n[0]*.3+n[1]*.5+n[2]*.8124)/norm);
    ctx.fillStyle=`rgb(${165*light},${165*light},${165*light})`;
    ctx.beginPath(); [a,b,c].forEach((p,i)=>{
      const q=project(p); if(i===0)ctx.moveTo(...q);else ctx.lineTo(...q);
    });
    ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(0,0,0,.16)';ctx.lineWidth=.45;ctx.stroke();
  }
}
if(typeof document!=='undefined') {
  const $=id=>document.getElementById(id), values={};
  let mesh=null, generation=0;
  $('title').textContent=CONFIG.title;
  function select(id,label,options) {
    const el=document.createElement('select');el.id=id;
    for(const [value,text] of options) el.add(new Option(text,value));
    const l=document.createElement('label'); l.textContent=label;l.append(el);
    $('controls').append(l); el.onchange=draw; return el;
  }
  if(CONFIG.kind==='shear') {
    select('target','Eje desplazado',[['0','X'],['1','Y'],['2','Z']]);
    select('source','Coordenada de referencia',[['1','Y'],['2','Z'],['0','X']]);
  }
  if(CONFIG.kind==='deform') select('type','Deformación',
    [['bend','Doblado'],['twist','Torsión'],['taper','Afilado']]);
  function range(id,label,min,max,step,value) {
    values[id]=value;
    const l=document.createElement('label');l.textContent=label;
    const out=document.createElement('output');out.id=id+'Out';out.textContent=value;
    const el=document.createElement('input');el.type='range';el.id=id;
    Object.assign(el,{min,max,step,value});l.append(out,el);$('controls').append(l);
    el.oninput=()=>{values[id]=+el.value;out.textContent=el.value;draw();};
  }
  if(CONFIG.kind==='affine') {
    for(let i=0;i<3;i++) range('t'+i,'Traslación '+'XYZ'[i],-1.5,1.5,.05,0);
    for(let i=0;i<3;i++) range('r'+i,'Rotación '+'XYZ'[i]+' (grados)',-180,180,1,0);
    for(let i=0;i<3;i++) range('s'+i,'Escala '+'XYZ'[i],.25,1.75,.05,1);
  }
  if(CONFIG.kind==='shear') range('angle','Ángulo (grados)',-60,60,1,0);
  if(CONFIG.kind==='deform') range('amount','Cantidad normalizada',-1,1,.01,0);
  range('progress','Progreso (%)',0,100,1,100);
  range('yaw','Cámara: azimut (grados)',-180,180,1,32);
  range('pitch','Cámara: elevación (grados)',-80,80,1,18);
  range('zoom','Cámara: zoom',40,150,1,95);
  function draw() {
    if(!mesh) return;
    try {
      const t=values.progress/100; let f,description;
      if(CONFIG.kind==='affine') {
        const v={...values};
        for(let i=0;i<3;i++) {
          v['t'+i]*=t;v['r'+i]*=t;v['s'+i]=1+t*(v['s'+i]-1);
        }
        const M=affine(v); f=p=>apply(M,p);description='M = T Rz Ry Rx S';
      } else if(CONFIG.kind==='shear') {
        const a=+$('target').value,b=+$('source').value;
        const H=shear(a,b,values.angle*t); f=p=>apply(H,p);
        description=`${'XYZ'[a]}' = ${'XYZ'[a]} + ${H[a][b].toFixed(3)} ${'XYZ'[b]}`;
      } else {
        const type=$('type').value;
        const a=values.amount*t*(type==='bend'?90:type==='twist'?180:1.6);
        f=p=>deform(p,type,a);description=`${type}; parámetro = ${a.toFixed(3)}`;
      }
      const points=mesh.vertices.map(f);
      render($('original'),mesh,mesh.vertices,values.yaw,values.pitch,values.zoom);
      render($('result'),mesh,points,values.yaw,values.pitch,values.zoom);
      $('error').textContent='';
    } catch(e) {$('error').textContent=e.message;}
  }
  async function load(text,label) {
    const next=parseOBJ(text);mesh=next;$('model').textContent=label;draw();
  }
  async function loadBarrel() {
    const ticket=++generation;
    $('model').textContent='Cargando barrel.obj desde GitHub...';
    $('error').textContent='';
    try {
      let response;
      try { response=await fetch(CONFIG.modelURL); }
      catch(e) { response=null; }
      if(!response || !response.ok) response=await fetch(CONFIG.backupURL);
      if(!response.ok) throw Error(`No se pudo descargar el OBJ (${response.status})`);
      const text=await response.text();
      if(ticket===generation) await load(text,'Modelo: barrel.obj (GitHub)');
    } catch(e) {
      if(ticket===generation) {
        $('model').textContent='No se pudo cargar el barril';
        $('error').textContent=e.message;
      }
    }
  }
  $('file').onchange=async e=>{
    const ticket=++generation;
    try {
      const f=e.target.files[0];if(!f)return;
      if(f.size>30*1024*1024)throw Error('El archivo supera 30 MB');
      const text=await f.text();if(ticket===generation)await load(text,f.name);
    } catch(e) {$('error').textContent=e.message;}
  };
  $('reset').onclick=()=>{
    for(const id in values) {
      if(['yaw','pitch','zoom','progress'].includes(id))continue;
      const v=id.startsWith('s')?1:0;values[id]=v;$(id).value=v;$(id+'Out').textContent=v;
    }
    if(CONFIG.kind==='shear'){$('target').value='0';$('source').value='1';}
    draw();
  };
  $('demo').onclick=()=>{loadBarrel();};
  $('drive').href=CONFIG.downloadURL;
  loadBarrel();
}
if(typeof module!=='undefined') module.exports={I,mul,apply,rotation,affine,shear,
  deform,parseOBJ,demoOBJ,render};
