/**
 * Unterrichtsmodus: Einstellungen, Serienbildung, lokale Fehlerschwerpunkte
 * und teilbare Übungslinks. Keine Browser-Abhängigkeiten beim Import.
 */
const VALID_MODES = new Set(['all','mc','staff','text']);
const VALID_DIFFICULTIES = new Set(['beginner','standard','advanced']);
const VALID_CLEFS = new Set(['mixed','treble','bass','alto']);

export function normalizePracticePlan(value={}, defaultClef='mixed') {
  const data=value&&typeof value==='object'?value:{};
  const amount=data.count==null||data.count===''?NaN:Number(data.count);
  return {
    count:Number.isFinite(amount)?Math.max(5,Math.min(30,Math.round(amount))):10,
    mode:VALID_MODES.has(data.mode)?data.mode:'all',
    difficulty:VALID_DIFFICULTIES.has(data.difficulty)?data.difficulty:'standard',
    clef:VALID_CLEFS.has(data.clef)?data.clef:(VALID_CLEFS.has(defaultClef)?defaultClef:'mixed'),
    focusErrors:data.focusErrors===true || data.focusErrors==='1',
  };
}

export function practiceLink(base,topic,rawPlan={}) {
  const u=new URL(base);
  const plan=normalizePracticePlan(rawPlan);
  u.search='';
  u.searchParams.set('thema',topic);
  u.searchParams.set('anzahl',String(plan.count));
  u.searchParams.set('art',plan.mode);
  u.searchParams.set('niveau',plan.difficulty);
  u.searchParams.set('schluessel',plan.clef);
  if(plan.focusErrors)u.searchParams.set('fehler','1');
  u.hash='';
  return u.toString();
}

export function readPracticeLink(search) {
  const params=new URLSearchParams(String(search||'').replace(/^\?/,''));
  const topic=params.get('thema');
  if(!topic||!/^[a-z0-9_-]{2,35}$/i.test(topic))return null;
  return {topic,plan:normalizePracticePlan({
    count:params.get('anzahl'),
    mode:params.get('art'),
    difficulty:params.get('niveau'),
    clef:params.get('schluessel'),
    focusErrors:params.get('fehler'),
  })};
}

export function kindOfTask(task) {
  return task?.mode==='mc'?'mc':task?.mode==='staff'?'staff':task?.mode==='text'?'text':null;
}

export function taskErrorKey(topic,generatorIndex) {
  return String(topic)+':'+String(generatorIndex);
}
export function updateLearningErrors(history,task,isCorrect) {
  const current=history&&typeof history==='object'?history:{};
  const meta=task?._practice||{};
  if(!meta.topic || !Number.isInteger(meta.generatorIndex))return current;
  const key=taskErrorKey(meta.topic,meta.generatorIndex);
  const before=current[key]||{correct:0,wrong:0};
  const record={
    correct:Math.max(0,Number(before.correct)||0)+(isCorrect?1:0),
    wrong:Math.max(0,Number(before.wrong)||0)+(isCorrect?0:1),
  };
  return {...current,[key]:record};
}

export function learningSummary(history,topic=null) {
  return Object.entries(history||{})
    .filter(([key])=>!topic||key.startsWith(topic+':'))
    .map(([key,v])=>({key,correct:v.correct||0,wrong:v.wrong||0,
      total:(v.correct||0)+(v.wrong||0),
      weak:(v.wrong||0)>0 && (v.wrong||0)>=(v.correct||0)}))
    .sort((a,b)=>(b.wrong-b.correct)-(a.wrong-a.correct));
}

export function generatePracticeRound({section,plan,defaultClef='mixed',errors={},
  taskSignature,random=Math.random,overrideGenerators}) {
  const config=normalizePracticePlan(plan,defaultClef);
  const generators=Array.isArray(overrideGenerators)?overrideGenerators:section?.gens;
  if(!Array.isArray(generators)||!generators.length)return [];
  const topic=section.id;
  const clef=config.clef;
  const beginner=topic==='noten'&&config.difficulty==='beginner';
  const weighted=[];
  generators.forEach((fn,index)=>{
    if(beginner&&fn.name==='Te')return;
    // Für die Anfänger-Notennamen ist die zweite Generatorfunktion Enharmonik.
    if(beginner&&!overrideGenerators&&index===1)return;
    const score=errors[taskErrorKey(topic,index)]||{};
    const wrong=Number(score.wrong)||0,correct=Number(score.correct)||0;
    const repeats=config.focusErrors?Math.max(1,Math.min(8,1+2*Math.max(0,wrong-correct))):1;
    const advanced=topic==='noten'&&config.difficulty==='advanced'&&index===1?2:1;
    for(let n=0;n<repeats*advanced;n++)weighted.push({fn,index});
  });
  if(!weighted.length)return [];
  const tasks=[],known=new Set();
  let attempts=0;
  const maxAttempts=config.count*100;
  while(tasks.length<config.count&&attempts<maxAttempts) {
    const selected=weighted[Math.min(weighted.length-1,Math.floor(random()*weighted.length))];
    attempts++;
    let task;
    try{
      task=selected.fn(clef,beginner);
      if(!task||!kindOfTask(task)||(config.mode!=='all'&&kindOfTask(task)!==config.mode))continue;
      const key=taskSignature(task);
      if(known.has(key))continue;
      known.add(key);
    }catch{continue;}
    tasks.push({...task,_practice:{topic,generatorIndex:selected.index,kind:kindOfTask(task)}});
  }
  return tasks;
}
