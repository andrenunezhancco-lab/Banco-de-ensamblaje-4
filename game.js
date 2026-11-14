// ===== Datos =====
const P = {
  cpu:{n:'Procesador (CPU)',d:'Es el cerebro del equipo: ejecuta las instrucciones de los programas.'},
  cooler:{n:'Disipador / Cooler',d:'Evita el sobrecalentamiento del procesador moviendo el calor lejos de él.'},
  ram:{n:'Memoria RAM',d:'Memoria temporal y rápida donde se guardan los datos de los programas en uso.'},
  ssd:{n:'Unidad SSD M.2',d:'Almacenamiento sin partes móviles donde viven el sistema operativo y los archivos.'},
  mobo:{n:'Placa base (Motherboard)',d:'Circuito principal que conecta y comunica todos los componentes.'},
  case:{n:'Gabinete (Case)',d:'Carcasa que sostiene, protege y ventila los componentes internos.'},
  psu:{n:'Fuente de poder (PSU)',d:'Convierte la corriente alterna de la pared en voltajes que usa la PC.'},
  gpu:{n:'Tarjeta gráfica (GPU)',d:'Procesa imágenes y video para enviarlos al monitor.'},
  cables:{n:'Cables de alimentación',d:'Llevan energía desde la fuente hasta la placa, la GPU y el almacenamiento.'}
};
// Orden correcto de ensamblaje
const STEPS = [
  {id:'cpu',img:'cpu',t:'Instalar el procesador en el socket de la placa base',why:'Se hace con la placa fuera del gabinete, donde hay más espacio y visibilidad.'},
  {id:'cooler',img:'cooler',t:'Colocar el disipador con pasta térmica sobre la CPU',why:'El disipador va justo encima del procesador ya instalado.'},
  {id:'ram',img:'ram',t:'Insertar los módulos de RAM en sus ranuras',why:'Es más fácil antes de montar la placa en el gabinete.'},
  {id:'ssd',img:'ssd',t:'Instalar el SSD M.2 en su ranura de la placa',why:'El M.2 se atornilla directo a la placa, antes de montarla.'},
  {id:'mobo',img:'case',t:'Montar la placa base en el gabinete con sus separadores',why:'Con la placa ya equipada, se fija al gabinete.'},
  {id:'psu',img:'psu',t:'Instalar la fuente de poder en el gabinete',why:'La fuente se fija antes de conectar cualquier cable.'},
  {id:'gpu',img:'gpu',t:'Colocar la tarjeta gráfica en la ranura PCIe',why:'Va después de los componentes principales, para no estorbar.'},
  {id:'cables',img:'cables',t:'Conectar los cables de alimentación y de datos',why:'Es el último paso: todo debe estar instalado antes de cablear.'}
];
const LEVELS = {
  1:{name:'Principiante',desc:'Reconoce 5 piezas con su foto y ordena 5 pasos del ensamblaje.',parts:['cpu','ram','psu','gpu','case','ssd','mobo'],q:5,opts:3,mode:'img',steps:['cpu','ram','mobo','psu','cables'],time:0,showImg:true},
  2:{name:'Medio',desc:'Identifica 7 piezas entre 4 opciones y ordena 6 pasos.',parts:Object.keys(P),q:7,opts:4,mode:'img',steps:['cpu','cooler','ram','mobo','psu','cables'],time:0,showImg:true},
  3:{name:'Avanzado',desc:'Adivina la pieza por su función (sin foto), con 20 s por pregunta, y ordena los 8 pasos sin fotos.',parts:Object.keys(P),q:9,opts:5,mode:'desc',steps:STEPS.map(s=>s.id),time:20,showImg:false}
};
// ===== Utilidades =====
const $ = s => document.querySelector(s);
const app = $('#app');
const shuffle = a => { a=[...a]; for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]} return a; };
const img = k => `images/${k}.svg`;
let G = null, timer = null;
// ===== Temas =====
function setTheme(t){
  document.documentElement.dataset.theme = t;
  document.querySelectorAll('.themes button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  try{localStorage.setItem('tema',t)}catch(e){}
}
document.querySelectorAll('.themes button').forEach(b=>b.onclick=()=>setTheme(b.dataset.t));
let saved='taller'; try{saved=localStorage.getItem('tema')||'taller'}catch(e){}
setTheme(saved);
// ===== Menú =====
function menu(){
  clearInterval(timer);
  app.innerHTML = `<h2>Arma la PC como un técnico</h2>
  <p class="lead">Primero reconoce las piezas. Después ordena los pasos del ensamblaje. Elige un nivel para empezar.</p>
  <div class="levels">${Object.entries(LEVELS).map(([k,l])=>`
    <button class="lvl card" data-l="${k}"><strong>${l.name}</strong><span>${l.desc}</span><em>Jugar nivel ${k}</em></button>`).join('')}</div>`;
  app.querySelectorAll('.lvl').forEach(b=>b.onclick=()=>start(+b.dataset.l));
}
function start(n){
  const L = LEVELS[n];
  const qs = shuffle(L.parts).slice(0,L.q);
  G = {n,L,qs,i:0,score:0,miss:[],orderScore:0,orderRight:0};
  question();
}
// ===== Parte 1: reconocer piezas =====
function question(){
  clearInterval(timer);
  const {L,qs,i} = G, id = qs[i];
  const opts = shuffle([id,...shuffle(Object.keys(P).filter(k=>k!==id)).slice(0,L.opts-1)]);
  G.locked=false;
  app.innerHTML = `<div class="bar"><span>Nivel ${G.n} · ${L.name}</span><span>Pieza ${i+1} de ${qs.length}</span><span>Puntos: ${G.score}</span>${L.time?`<span id="t">⏱ ${L.time}s</span>`:''}</div>
  <div class="prog"><i style="width:${i/qs.length*100}%"></i></div>
  <div class="card">
   ${L.mode==='img'?`<div class="pic"><img src="${img(id)}" alt="Pieza de computadora a identificar"></div><p class="clue">¿Cómo se llama esta pieza?</p>`
     :`<p class="clue">${P[id].d}</p><p class="lead">¿Qué pieza es?</p>`}
   <div class="opts">${opts.map(o=>`<button data-o="${o}">${P[o].n}</button>`).join('')}</div>
   <p class="msg" id="msg" aria-live="polite"></p><div id="nx"></div></div>`;
  app.querySelectorAll('.opts button').forEach(b=>b.onclick=()=>answer(b.dataset.o,id));
  if(L.time){ let s=L.time; timer=setInterval(()=>{s--; $('#t').textContent='⏱ '+s+'s'; if(s<=0){clearInterval(timer);answer(null,id)}},1000); }
}
function answer(o,id){
  if(G.locked) return; G.locked=true; clearInterval(timer);
  const good = o===id;
  if(good) G.score+=10; else G.miss.push(id);
  app.querySelectorAll('.opts button').forEach(b=>{b.disabled=true; if(b.dataset.o===id)b.classList.add('ok'); else if(b.dataset.o===o)b.classList.add('bad')});
  $('#msg').textContent = (good?'¡Correcto! ':(o===null?'Se acabó el tiempo. ':'Casi. ')) + `Es: ${P[id].n}. ${P[id].d}`;
  const last = G.i===G.qs.length-1;
  $('#nx').innerHTML = `<button class="next">${last?'Ir al ensamblaje':'Siguiente pieza'}</button>`;
  $('.next').focus();
  $('.next').onclick=()=>{ if(last) order(); else {G.i++; question();} };
}
// ===== Parte 2: ordenar ensamblaje =====
function order(){
  clearInterval(timer);
  const steps=STEPS.filter(s=>G.L.steps.includes(s.id));
  G.steps=steps; G.pool=shuffle(steps.map(s=>s.id)); G.placed=[]; G.checked=false;
  drawOrder();
}
function stepEl(s,cls,n){ return `<button class="step ${cls||''}" data-s="${s.id}">${n?`<b>${n}</b>`:''}${G.L.showImg?`<img src="${img(s.img)}" alt="">`:''}<span>${s.t}</span></button>`; }
function drawOrder(){
  const get=id=>STEPS.find(s=>s.id===id), total=G.steps.length;
  app.innerHTML = `<div class="bar"><span>Nivel ${G.n} · ${G.L.name}</span><span>Ensamblaje: ${G.placed.length} de ${total} pasos</span></div>
  <div class="prog"><i style="width:${G.placed.length/total*100}%"></i></div>
  <p class="lead">Toca los pasos en el orden en que se hacen. Toca uno colocado para devolverlo.</p>
  <div class="cols"><div class="col card"><h3>Pasos disponibles</h3><div class="list" id="pool">${G.pool.map(id=>stepEl(get(id))).join('')}</div></div>
  <div class="col card"><h3>Tu orden</h3><div class="list" id="mine">${G.placed.map((id,i)=>stepEl(get(id),G.checked?(id===G.steps[i].id?'ok':'bad'):'',i+1)).join('')}
   ${G.placed.length<total?`<div class="step slot">Paso ${G.placed.length+1}: elige el siguiente</div>`:''}</div></div></div>
  <p class="msg" id="msg" aria-live="polite"></p>
  <div class="actions"><button id="chk" class="next" ${G.placed.length<total||G.checked?'disabled':''}>Comprobar orden</button><button id="rst">Reiniciar</button></div>`;
  if(!G.checked){
    $('#pool').querySelectorAll('.step').forEach(b=>b.onclick=()=>{G.pool=G.pool.filter(x=>x!==b.dataset.s);G.placed.push(b.dataset.s);drawOrder()});
    $('#mine').querySelectorAll('button.step').forEach(b=>b.onclick=()=>{G.placed=G.placed.filter(x=>x!==b.dataset.s);G.pool.push(b.dataset.s);drawOrder()});
  }
  $('#rst').onclick=order; $('#chk').onclick=checkOrder;
}
function checkOrder(){
  G.checked=true;
  const right=G.placed.filter((id,i)=>id===G.steps[i].id).length, total=G.steps.length;
  G.orderScore=right*10; G.orderRight=right;
  drawOrder();
  const wrong=G.placed.findIndex((id,i)=>id!==G.steps[i].id);
  $('#msg').textContent = wrong<0 ? '¡Orden perfecto!' : `${right} de ${total} en su lugar. Primer error en el paso ${wrong+1}: debía ir "${G.steps[wrong].t}". ${G.steps[wrong].why}`;
  $('.actions').innerHTML = `<button class="next" id="fin">Ver resultado</button><button id="rst">Intentar otra vez</button>`;
  $('#fin').onclick=result; $('#rst').onclick=order; $('#fin').focus();
}
// ===== Resultado =====
function result(){
  const max=(G.qs.length+G.steps.length)*10, tot=G.score+G.orderScore, pct=Math.round(tot/max*100);
  const msg = pct>=90?'Nivel técnico dominado.':pct>=60?'Buen trabajo, repasa los errores.':'Sigue practicando: repite el nivel.';
  app.innerHTML = `<div class="card"><h2>Resultado · ${G.L.name}</h2><div class="score">${tot} / ${max}</div><p class="lead">${msg}</p>
  <p>Piezas reconocidas: ${G.qs.length-G.miss.length} de ${G.qs.length}. Pasos en su lugar: ${G.orderRight} de ${G.steps.length}.</p>
  ${G.miss.length?`<p>Para repasar:</p><ul class="review">${G.miss.map(id=>`<li><b>${P[id].n}</b>: ${P[id].d}</li>`).join('')}</ul>`:''}
  <div class="actions"><button class="next" id="again">Repetir nivel</button>${G.n<3?'<button id="up">Subir de nivel</button>':''}<button id="home">Menú</button></div></div>`;
  $('#again').onclick=()=>start(G.n); $('#home').onclick=menu; if($('#up')) $('#up').onclick=()=>start(G.n+1);
}
menu();
