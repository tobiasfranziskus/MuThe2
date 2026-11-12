/**
 * Aufgabenpool des Tischduells: Sammlung, Konvertierung, Duplikaterkennung,
 * Notendarstellung und Fallback. Unveränderte historische Abläufe in
 * einer eigenständig testbaren Factory ohne DOM-/React-Abhängigkeit.
 * Fachgeneratoren und Renderer werden aus dem echten Aufgabensystem injiziert.
 * Der Themenfilter akzeptiert weiterhin 'all' und Einzel-IDs sowie neu ein
 * Array ausgewählter Themen. Bei einer Auswahl werden keine themenfremden
 * Ersatzfragen eingeschleust.
 * Eine optionale Duell-Schlüsselauswahl gilt ausschließlich für Notennamen;
 * andere Themen behalten ihren bisherigen gemischten Schlüssel.
 */
export function createDuelQuestionPool({sections,shuffle,adaptQuestion,questionKey,renderGrandStaff,renderStaff,fallbackQuestions}) {
 const Et=sections,D=shuffle,Qt=adaptQuestion,Tt=questionKey,Rt=renderGrandStaff,Lt=renderStaff,Jt=fallbackQuestions;
 function $t(e,t,clefs){let noteClefs=clefs===void 0?null:(Array.isArray(clefs)?clefs.filter(e=>e===`treble`||e===`bass`):[]);let generate=(gen,section)=>{if(section!==`noten`||noteClefs===null)return gen(`mixed`);let available=noteClefs.length?noteClefs:[`treble`],level=available.length===1?available[0]:available[Math.floor(Math.random()*available.length)];return gen(level)};let n=[];Et.forEach(e=>{e.id!==`gehoer`&&e.gens.forEach(t=>{let section=e.id,r=!1;for(let attempt=0;attempt<5&&!r;attempt++)try{r=!!Qt(t,generate(t,section))}catch{}r&&n.push({secId:e.id,gen:t})})});let r=n.filter(e=>t===`all`||(Array.isArray(t)?t.includes(e.secId):e.secId===t)),i=[],a=new Set,o=[],s=0;for(;i.length<e&&r.length>0&&s<e*60;){o.length||(o=D(r));let e=o.pop();s++;let t=null;try{t=Qt(e.gen,generate(e.gen,e.secId))}catch{}if(!t)continue;let n=``;try{n=Tt(t)}catch{n=t.q+`|`+(t.options?t.options.join(`|`):``)}if(a.has(n))continue;a.add(n);let c=``;try{t.staff&&(c=t.staff.chords?Rt(t.staff):Lt(t.staff))}catch{continue}i.push({prompt:t.q,options:(t.options||[]).slice(),correct:t.correct??0,explanation:t.explanation||``,svgHtml:c})}if(i.length<e&&!Array.isArray(t)){let t=e-i.length,n=D(Jt);for(let e=0;e<Math.min(t,n.length);e++){let t=n[e];i.push({prompt:t[0],options:t[1],correct:t[2],explanation:t[3],svgHtml:``})}}return D(i)}
 return $t;
}
