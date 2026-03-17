const canvas=document.getElementById('gameCanvas'), ctx=canvas.getContext('2d');

let trial=0, lives=3, lastTime=0, totalTime=0, avgTime=0, level='normal', waitingStart=true;
let target=null, pathPoints=[], startTime=0, dataLog=[];

const startBlock={x:400,y:450,r:35};

const ghosts=[
  {x:200,y:200,vx:2,vy:1},
  {x:500,y:150,vx:-2,vy:1.5},
  {x:350,y:300,vx:1.5,vy:-2}
];

const distance=(x1,y1,x2,y2)=>Math.hypot(x2-x1,y2-y1);
const calcID=(D,W)=>(Math.log2(D/W+1)).toFixed(3);

function updateStats(){
  document.getElementById('livesCard').innerText='Lives: '+lives;
  document.getElementById('trialCard').innerText='Trial: '+trial;
  document.getElementById('lastTimeCard').innerText='Last Time: '+lastTime;
  document.getElementById('avgTimeCard').innerText='Avg Time: '+avgTime;
}

function setLevel(l){
  level=l;
  createObstacles();
}

// TARGET
function createTarget(){
  const shapes=['circle','square','triangle'];
  target={
    x:100+Math.random()*600,
    y:80+Math.random()*300,
    size:25+Math.random()*20,
    shape: shapes[Math.floor(Math.random()*shapes.length)]
  };
  startTime=performance.now();
  pathPoints=[];
}

// OBSTACLES
let obstacles=[];
function createObstacles(){
  obstacles=[];
  const count = level==='normal'?0 : level==='medium'?2 : 4;
  const shapes=['circle','square','triangle'];

  for(let i=0;i<count;i++){
    obstacles.push({
      x:50 + Math.random()*700,
      y:50 + Math.random()*400,
      size:20+Math.random()*30,
      shape: shapes[Math.floor(Math.random()*shapes.length)]
    });
  }
}
createObstacles();

function drawObstacles(){
  ctx.fillStyle='#ff006e';
  obstacles.forEach(o=>{
    ctx.beginPath();
    if(o.shape==='circle') ctx.arc(o.x,o.y,o.size,0,2*Math.PI);
    else if(o.shape==='square') ctx.rect(o.x-o.size,o.y-o.size,o.size*2,o.size*2);
    else {
      const s=o.size;
      ctx.moveTo(o.x,o.y-s);
      ctx.lineTo(o.x-s,o.y+s);
      ctx.lineTo(o.x+s,o.y+s);
      ctx.closePath();
    }
    ctx.fill();
  });
}

function draw(){
  ctx.fillStyle='#08152b';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // START
  ctx.beginPath();
  ctx.arc(startBlock.x,startBlock.y,startBlock.r,0,2*Math.PI);
  ctx.fillStyle='#ff4757';
  ctx.shadowColor='#ff4757';
  ctx.shadowBlur=20;
  ctx.fill();
  ctx.shadowBlur=0;

  ctx.fillStyle='white';
  ctx.font='14px Arial';
  ctx.fillText('START', startBlock.x-22,startBlock.y+5);

  drawObstacles();

  // GHOSTS
  ghosts.forEach(g=>{
    ctx.beginPath();
    ctx.arc(g.x,g.y,20,0,2*Math.PI);
    ctx.fill();

    g.x+=g.vx;
    g.y+=g.vy;

    if(g.x<20||g.x>780) g.vx*=-1;
    if(g.y<20||g.y>500) g.vy*=-1;
  });

  // PATH
  if(pathPoints.length>1){
    ctx.strokeStyle='cyan';
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x,pathPoints[0].y);
    pathPoints.forEach(p=>ctx.lineTo(p.x,p.y));
    ctx.stroke();
  }

  // TARGET
  if(target){
    ctx.fillStyle='#ffd60a';
    const {x,y,size,shape}=target;
    ctx.beginPath();

    if(shape==='circle') ctx.arc(x,y,size,0,2*Math.PI);
    else if(shape==='square') ctx.rect(x-size,y-size,size*2,size*2);
    else {
      ctx.moveTo(x,y-size);
      ctx.lineTo(x-size,y+size);
      ctx.lineTo(x+size,y+size);
      ctx.closePath();
    }

    ctx.fill();

    ctx.fillStyle='black';
    ctx.textAlign='center';
    ctx.fillText('TARGET', x, y+5);
  }

  requestAnimationFrame(draw);
}
draw();

// MOUSE
canvas.addEventListener('mousemove', e=>{
  if(target){
    const rect=canvas.getBoundingClientRect();
    pathPoints.push({
      x:e.clientX-rect.left,
      y:e.clientY-rect.top
    });
  }
});

canvas.addEventListener('click', e=>{
  const rect=canvas.getBoundingClientRect();
  const x=e.clientX-rect.left;
  const y=e.clientY-rect.top;

  if(waitingStart){
    const dx=x-startBlock.x;
    const dy=y-startBlock.y;

    if(dx*dx+dy*dy<=startBlock.r*startBlock.r){
      waitingStart=false;
      createTarget();
    }
    return;
  }

  if(!target) return;

  let hit=false;
  const dx=x-target.x;
  const dy=y-target.y;

  if(target.shape==='circle')
    hit=dx*dx+dy*dy<=target.size*target.size;
  else if(target.shape==='square')
    hit=Math.abs(dx)<=target.size && Math.abs(dy)<=target.size;
  else {
    const s=target.size;
    hit=dy<=s && dy>=-s && dx>=-s*(1+dy/s) && dx<=s*(1+dy/s);
  }

  const MT=Math.round(performance.now()-startTime);

  lastTime=MT;
  totalTime+=MT;
  trial++;

  if(trial>=3) avgTime=Math.round(totalTime/trial);
  if(!hit) lives--;

  const D=distance(startBlock.x,startBlock.y,target.x,target.y);

  const pathDist=pathPoints.reduce((sum,p,i,arr)=>
    i>0?sum+distance(p.x,p.y,arr[i-1].x,arr[i-1].y):0,0
  );

  dataLog.push([
    trial,
    Math.round(D),
    Math.round(pathDist),
    Math.round(target.size),
    calcID(D,target.size),
    calcID(pathDist,target.size),
    MT,
    hit?'Yes':'No',
    new Date().toISOString()
  ]);

  updateStats();
  target=null;
  waitingStart=true;
  createObstacles();
});

// CSV
function downloadCSV(){
  let csv="Trial,StraightDistance,PathDistance,W,ID_Straight,ID_Path,MT,Hit,Timestamp\n";

  dataLog.forEach(r=>csv+=r.join(",")+"\n");

  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([csv]));
  a.download='fitts_data.csv';
  a.click();
}