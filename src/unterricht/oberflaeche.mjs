/**
 * Unterrichts-Konfiguration und lokale Lernfortschritte.
 * JSX-Runtime wird injiziert, kein Build-Prozess oder DOM-Zugriff beim Import.
 */
import {normalizePracticePlan,learningSummary} from './lernplan.mjs';
import {createLessonQrSvgData} from './qr-code.mjs';

const TYPES=[
  {value:'all',label:'Alle Aufgabenarten'},
  {value:'mc',label:'Multiple Choice'},
  {value:'staff',label:'Noten praktisch setzen'},
  {value:'text',label:'Freie Texteingabe'},
];
const LEVELS=[
  {value:'beginner',label:'Anfänger · ohne Vorzeichen'},
  {value:'standard',label:'Standard'},
  {value:'advanced',label:'Fortgeschritten · mehr Enharmonik'},
];
const CLEFS=[
  {value:'mixed',label:'Gemischte Schlüssel'},
  {value:'treble',label:'Violinschlüssel'},
  {value:'bass',label:'Bassschlüssel'},
  {value:'alto',label:'Altschlüssel'},
];
function errorLabel(section,index){
  if(section==='noten')return ['Notennamen erkennen','Enharmonische Verwechslung','Noten setzen','Notennamen schreiben'][index]||'Notennamen';
  return 'Aufgabentyp '+(index+1);
}

export function createPracticeWidgets(I) {
  function select(label,value,values,onChange){
    return I.jsxs('label',{className:'flex flex-col gap-1.5 text-xs font-semibold text-slate-200',
      children:[label,I.jsx('select',{value,onChange:e=>onChange(e.target.value),
        className:'w-full p-3 bg-slate-900 border border-white/20 rounded-xl text-sm text-white focus:ring-2 focus:ring-teal-400',
        children:values.map(v=>I.jsx('option',{value:v.value,children:v.label},v.value))})]});
  }
  function PracticeSetup({section,plan,onChange,onStart,onClose,errors={},shareUrl,onCopy,onPrint,copied=false,error=''}) {
    if(!section)return null;
    const config=normalizePracticePlan(plan);
    const set=(key,value)=>onChange({...config,[key]:value});
    const weak=learningSummary(errors,section.id).filter(x=>x.weak);
    let qr=null;
    try {if(shareUrl)qr=createLessonQrSvgData(shareUrl);} catch { /* link text remains available */ }
    const lessonDetails=[
      config.count+' Aufgaben',
      TYPES.find(item=>item.value===config.mode)?.label||config.mode,
      CLEFS.find(item=>item.value===config.clef)?.label||config.clef,
      ...(section.id==='noten'?[LEVELS.find(item=>item.value===config.difficulty)?.label||config.difficulty]:[]),
      ...(config.focusErrors?['Individuelles Fehlertraining']:[]),
    ];
    return I.jsxs('section',{id:'practice-setup',className:'bg-slate-800/90 border border-teal-400/50 rounded-2xl p-4 sm:p-6 space-y-4 shadow-lg',
      children:[
        I.jsxs('div',{className:'flex justify-between gap-3 items-start',children:[
          I.jsxs('div',{children:[I.jsx('h2',{className:'text-lg font-bold text-teal-200',children:'Übungsrunde konfigurieren'}),I.jsx('p',{className:'text-sm text-slate-300',children:section.title})]}),
          I.jsx('button',{type:'button',onClick:onClose,className:'text-sm px-2 py-1 rounded-lg text-slate-200 bg-white/10',children:'Schließen'})]}),
        I.jsxs('div',{className:'grid grid-cols-1 sm:grid-cols-2 gap-3',children:[
          select('Anzahl der Fragen',String(config.count),[5,10,15,20,30].map(n=>({value:String(n),label:n+' Fragen'})),v=>set('count',Number(v))),
          select('Aufgabenart',config.mode,TYPES,v=>set('mode',v)),
          select('Notenschlüssel',config.clef,CLEFS,v=>set('clef',v)),
          section.id==='noten'?select('Schwierigkeitsgrad',config.difficulty,LEVELS,v=>set('difficulty',v)):
            I.jsx('p',{className:'text-xs text-slate-400 self-center',children:'Weitere Schwierigkeitsstufen werden für dieses Thema schrittweise ergänzt.'}),
        ]}),
        I.jsxs('div',{className:'flex flex-wrap items-center gap-3',children:[
          I.jsx('button',{type:'button','aria-pressed':config.focusErrors,onClick:()=>set('focusErrors',!config.focusErrors),
            className:'text-sm font-semibold border rounded-xl px-3 py-2 '+(config.focusErrors?'bg-amber-500/20 border-amber-300 text-amber-200':'bg-white/5 border-white/20 text-slate-200'),
            children:(config.focusErrors?'☑ ':'☐ ')+'Fehler gezielt üben'}),
          I.jsx('span',{className:'text-xs text-slate-400',children:weak.length?weak.length+' Fehlerschwerpunkte erkannt':'Fehlertraining wird nach ersten Antworten wirksam'}),
        ]}),
        error?I.jsx('p',{role:'alert',className:'text-amber-300 text-xs',children:error}):null,
        I.jsx('button',{type:'button',onClick:onStart,className:'w-full py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-base',children:'▶ Übung starten'}),
        I.jsxs('div',{className:'border-t border-white/10 pt-3 space-y-2',children:[
          I.jsx('p',{className:'text-sm font-semibold text-slate-200',children:'Unterrichtslink – direkt mit diesen Einstellungen starten'}),
          I.jsxs('div',{className:'flex flex-col sm:flex-row gap-2',children:[
            I.jsx('input',{readOnly:true,value:shareUrl,onFocus:e=>e.currentTarget.select(),onClick:e=>e.currentTarget.select(),
              'aria-label':'Unterrichtslink',className:'flex-1 min-w-0 bg-slate-900 border border-white/20 rounded-lg p-2 text-xs text-slate-200'}),
            I.jsx('button',{type:'button',onClick:onCopy,className:'px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold',children:copied?'Kopiert!':'Link kopieren'}),
          ]}),
          I.jsx('p',{className:'text-xs text-slate-400',children:'Der Link enthält nur die Übungseinstellungen, keine Ergebnisse oder persönlichen Daten.'}),
          qr&&typeof onPrint==='function'?I.jsx('button',{
            type:'button',onClick:onPrint,
            className:'w-full px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-xl border border-white/20',
            children:'Auftragskarte mit QR-Code drucken',
          }):null,
          I.jsxs('details',{className:'rounded-xl bg-white/5 border border-white/10 p-3',children:[
            I.jsx('summary',{className:'cursor-pointer text-teal-200 font-bold text-sm select-none',children:'QR-Code für Schüler-iPads anzeigen'}),
            qr?I.jsxs('div',{className:'flex flex-col items-start gap-2 mt-3',children:[
              I.jsxs('svg',{viewBox:qr.viewBox,width:232,height:232,
                xmlns:'http://www.w3.org/2000/svg',role:'img',
                'aria-label':'QR-Code für diesen Unterrichtslink',
                className:'max-w-full h-auto bg-white rounded-lg shadow p-1',
                children:[
                  I.jsx('rect',{x:0,y:0,width:qr.size,height:qr.size,fill:'#ffffff'}),
                  I.jsx('path',{d:qr.path,fill:'#111111'}),
                ]}),
              I.jsx('p',{className:'text-xs text-slate-300',children:'Mit der iPad-Kamera scannen. Der QR-Code wird direkt auf diesem Gerät erzeugt und benötigt keinen fremden Dienst.'}),
            ]}):I.jsx('p',{className:'text-xs text-amber-200 mt-2',children:'Für diesen Link kann kein QR-Code erzeugt werden. Bitte den Link kopieren.'}),
          ]}),
          qr?I.jsxs('section',{
            id:'practice-print-card',
            style:{display:'none'},
            'aria-label':'Druckbarer Übungsauftrag',
            children:[
              I.jsx('h1',{children:'Musiktheorie · Übungsauftrag'}),
              I.jsx('h2',{children:section.title}),
              I.jsx('p',{className:'lesson-print-instructions',
                children:'Öffne die Kamera auf deinem iPad, scanne den QR-Code und bearbeite die Übung.'}),
              I.jsx('p',{className:'lesson-print-details',children:lessonDetails.join(' · ')}),
              I.jsxs('div',{className:'lesson-print-qr',children:[
                I.jsxs('svg',{viewBox:qr.viewBox,width:250,height:250,
                  xmlns:'http://www.w3.org/2000/svg',role:'img',
                  'aria-label':'QR-Code zum Übungsauftrag',
                  children:[
                    I.jsx('rect',{x:0,y:0,width:qr.size,height:qr.size,fill:'#fff'}),
                    I.jsx('path',{d:qr.path,fill:'#111'}),
                  ]}),
              ]}),
              I.jsx('p',{className:'lesson-print-link',children:shareUrl}),
              I.jsx('p',{className:'lesson-print-names',children:'Name: ____________________________________  Datum: ______________'}),
            ],
          }):null,
        ]}),
      ]});
  }
  function LearningProgress({errors={},sections=[]}){
    const all=learningSummary(errors);
    if(!all.length)return null;
    const total=all.reduce((acc,e)=>({correct:acc.correct+e.correct,wrong:acc.wrong+e.wrong}),{correct:0,wrong:0});
    return I.jsxs('section',{className:'bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3',
      children:[
        I.jsx('h2',{className:'text-sm font-bold text-white',children:'Mein Lernfortschritt'}),
        I.jsx('p',{className:'text-xs text-slate-300',children:total.correct+' richtige · '+total.wrong+' falsche Antworten · Trefferquote '+Math.round(100*total.correct/Math.max(1,total.correct+total.wrong))+' %'}),
        I.jsx('div',{className:'grid grid-cols-1 sm:grid-cols-2 gap-2',children:all.slice(0,6).map(v=>{
          const index=Number(v.key.split(':').pop()),topic=v.key.slice(0,v.key.lastIndexOf(':'));
          const sec=sections.find(s=>s.id===topic);
          return I.jsxs('div',{className:'bg-white/5 rounded-lg p-2 text-xs',children:[
            I.jsx('span',{className:'font-bold text-slate-200',children:(sec?.title||topic)+' · '+errorLabel(topic,index)}),
            I.jsx('span',{className:'block mt-1 '+(v.weak?'text-amber-300':'text-teal-300'),
              children:v.correct+' richtig / '+v.wrong+' falsch'+(v.weak?' · Wiederholung empfohlen':'')}),
          ]},v.key);
        })}),
        I.jsx('p',{className:'text-xs text-slate-400',children:'Fortschritte bleiben ausschließlich in diesem Browser gespeichert.'}),
      ]});
  }
  function ProfilePicker({profiles=[],current='standard',onSelect,newName='',onName,onAdd,onRemove}) {
    return I.jsxs('section',{className:'bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3',
      children:[
        I.jsx('h2',{className:'text-sm font-bold text-slate-100',children:'Lernprofil auf diesem iPad'}),
        I.jsxs('div',{className:'flex flex-col sm:flex-row gap-2 items-stretch',children:[
          I.jsx('select',{value:current,'aria-label':'Lernprofil auswählen',onChange:e=>onSelect(e.target.value),
            className:'flex-1 p-2.5 text-sm bg-slate-900 text-white border border-white/20 rounded-lg',
            children:[
              I.jsx('option',{value:'standard',children:'Standardprofil (bisherige Fortschritte)'}),
              I.jsx('option',{value:'gast',children:'Gastmodus – nichts speichern'}),
              ...profiles.map(p=>I.jsx('option',{value:p.id,children:p.name},p.id)),
            ]}),
          current!=='standard'&&current!=='gast'?I.jsx('button',{
            type:'button',onClick:onRemove,className:'px-3 py-2 border border-rose-400/30 rounded-lg text-xs text-rose-200',
            children:'Dieses Profil löschen'}):null,
        ]}),
        I.jsxs('div',{className:'flex flex-col sm:flex-row gap-2',children:[
          I.jsx('input',{value:newName,maxLength:30,'aria-label':'Neuer Profilname',onChange:e=>onName(e.target.value),
            onKeyDown:e=>{if(e.key==='Enter')onAdd()},placeholder:'Neues Profil (z. B. Gruppe A)',
            className:'min-w-0 flex-1 p-2.5 bg-slate-900 text-white border border-white/20 rounded-lg text-sm'}),
          I.jsx('button',{type:'button',onClick:onAdd,disabled:!newName.trim(),
            className:'px-3 py-2 rounded-lg bg-teal-500 text-slate-950 font-bold text-xs disabled:opacity-40',children:'Profil anlegen'}),
        ]}),
        I.jsx('p',{className:'text-xs text-slate-400',children:'Jedes Profil führt eigene Punkte und Fehler. Im Gastmodus wird nichts gespeichert. Alles bleibt lokal auf diesem Gerät.'}),
      ]});
  }
  return {PracticeSetup,LearningProgress,ProfilePicker};
}
