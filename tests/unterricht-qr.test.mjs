import test from 'node:test';
import assert from 'node:assert/strict';
import {createLessonQrSvgData} from '../src/unterricht/qr-code.mjs';
import {practiceLink,readPracticeLink} from '../src/unterricht/lernplan.mjs';
import {createPracticeWidgets} from '../src/unterricht/oberflaeche.mjs';

const base='https://tobiasfranziskus.github.io/Musik-Theorie/';
const classroomLink=practiceLink(base,'noten',{
  count:15,mode:'staff',difficulty:'beginner',clef:'bass',focusErrors:false,
});

function reconstruct(qr) {
  const rows=Array.from({length:qr.size},()=>Array(qr.size).fill(false));
  const segment=/M(\d+) (\d+)h(\d+)v1h-\3z/g;
  let match,count=0;
  while((match=segment.exec(qr.path))) {
    const x=Number(match[1]),y=Number(match[2]),length=Number(match[3]);
    assert.ok(x>=4 && y>=4 && x+length<=qr.size-4 && y<qr.size-4);
    for(let col=x;col<x+length;col++)rows[y][col]=true;
    count++;
  }
  assert.ok(count>0);
  assert.equal(rows.reduce((n,r)=>n+r.filter(Boolean).length,0)>100,true);
  return rows;
}

function finderPattern(rows,originX,originY) {
  const offsets=[0,1,2,3,4,5,6];
  for(const y of offsets)for(const x of offsets){
    const expected=x===0||x===6||y===0||y===6||
      (x>=2&&x<=4&&y>=2&&y<=4);
    assert.equal(rows[originY+y][originX+x],expected,
      'Finder-Pattern bei '+originX+','+originY+' und '+x+','+y);
  }
}

test('Unterrichtslink ergibt einen QR-Code mit korrekten Finder-Mustern und Ruhezone',()=>{
  const qr=createLessonQrSvgData(classroomLink);
  assert.ok(qr.moduleCount>=21 && qr.moduleCount<=177);
  assert.equal(qr.size,qr.moduleCount+8);
  assert.equal(qr.viewBox,'0 0 '+qr.size+' '+qr.size);
  const rows=reconstruct(qr);
  for(let i=0;i<qr.size;i++)for(let margin=0;margin<4;margin++){
    assert.equal(rows[i][margin],false);
    assert.equal(rows[i][qr.size-1-margin],false);
    assert.equal(rows[margin][i],false);
    assert.equal(rows[qr.size-1-margin][i],false);
  }
  finderPattern(rows,4,4);
  finderPattern(rows,qr.size-11,4);
  finderPattern(rows,4,qr.size-11);
});

test('QR-Kodierung bleibt deterministisch und ist für andere Unterrichtslinks verschieden',()=>{
  const same=createLessonQrSvgData(classroomLink);
  const again=createLessonQrSvgData(classroomLink);
  assert.deepEqual(same,again);
  const different=createLessonQrSvgData(practiceLink(base,'noten',{
    count:20,mode:'mc',difficulty:'standard',clef:'treble',
  }));
  assert.notEqual(same.path,different.path);
  assert.notDeepEqual(readPracticeLink(new URL(classroomLink).search),
    readPracticeLink(new URL(practiceLink(base,'noten',{count:20,mode:'mc'})).search));
});

test('Keine lokalen Lernstände oder Profilangaben im Unterrichtslink',()=>{
  const link=new URL(classroomLink);
  assert.deepEqual([...link.searchParams.keys()].sort(),
    ['anzahl','art','niveau','schluessel','thema'].sort());
  const data=createLessonQrSvgData(link.toString());
  assert.ok(data.path.length>800,'QR enthält ausreichend Module');
});

test('Ungültige und unsichere URLs werden abgewiesen',()=>{
  for(const url of ['','kein Link','javascript:alert(1)','data:text/html,hello','ftp://example.org/test']){
    assert.throws(()=>createLessonQrSvgData(url));
  }
  assert.throws(()=>createLessonQrSvgData('https://example.org/'+ 'a'.repeat(3000)),RangeError);
});

function walk(node,callback) {
  if(Array.isArray(node)){node.forEach(c=>walk(c,callback));return}
  if(!node||typeof node!=='object')return;
  if(node.type)callback(node);
  walk(node.props?.children,callback);
}

test('Unterrichtsoberfläche zeigt lokalen QR-Code einklappbar samt Unterrichtslink',()=>{
  const I={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
  const {PracticeSetup}=createPracticeWidgets(I);
  const view=PracticeSetup({
    section:{id:'noten',title:'Notennamen'},
    plan:{count:15,mode:'staff',difficulty:'beginner',clef:'bass'},
    onChange:()=>{},onStart:()=>{},onClose:()=>{},
    errors:{},shareUrl:classroomLink,onCopy:()=>{},copied:false,error:'',
  });
  const nodes=[];
  walk(view,node=>nodes.push(node));
  const details=nodes.find(x=>x.type==='details');
  const summary=nodes.find(x=>x.type==='summary');
  const svg=nodes.find(x=>x.type==='svg');
  const path=nodes.find(x=>x.type==='path');
  assert.ok(details && summary && svg && path);
  assert.match(summary.props.children,/QR-Code/);
  assert.equal(svg.props.role,'img');
  assert.equal(svg.props['aria-label'],'QR-Code für diesen Unterrichtslink');
  assert.equal(path.props.d,createLessonQrSvgData(classroomLink).path);
  assert.ok(nodes.some(x=>x.type==='input'&&x.props.value===classroomLink));
  assert.ok(!JSON.stringify(view).includes('api.qrserver.com'),'keine externe QR-Anfrage');
});

test('Wenn ein QR-Link ungültig ist, bleibt die Kopierfunktion sichtbar',()=>{
  const I={jsx:(type,props)=>({type,props}),jsxs:(type,props)=>({type,props})};
  const {PracticeSetup}=createPracticeWidgets(I);
  const view=PracticeSetup({
    section:{id:'noten',title:'Notennamen'},
    plan:{},onChange:()=>{},onStart:()=>{},onClose:()=>{},
    errors:{},shareUrl:'defekte URL',onCopy:()=>{},copied:false,error:'',
  });
  const nodes=[];walk(view,node=>nodes.push(node));
  assert.ok(nodes.some(x=>x.type==='details'));
  assert.ok(!nodes.some(x=>x.type==='svg'));
  assert.ok(nodes.some(x=>x.type==='button'&&x.props.children==='Link kopieren'));
});

test('Druckauftrag enthält den aktuellen Unterrichtsplan und nutzt die Browser-Druckaktion',()=>{
  const I={jsx:(type,props,key)=>({type,props,key}),jsxs:(type,props,key)=>({type,props,key})};
  const {PracticeSetup}=createPracticeWidgets(I);
  let calls=0;
  const view=PracticeSetup({
    section:{id:'noten',title:'Notennamen'},
    plan:{count:15,mode:'staff',difficulty:'beginner',clef:'bass'},
    onChange:()=>{},onStart:()=>{},onClose:()=>{},errors:{},
    shareUrl:classroomLink,onCopy:()=>{},onPrint:()=>{calls++;},copied:false,error:'',
  });
  const nodes=[];
  walk(view,node=>nodes.push(node));
  const card=nodes.find(node=>node.props.id==='practice-print-card');
  const button=nodes.find(node=>node.type==='button'&&node.props.children==='Auftragskarte mit QR-Code drucken');
  assert.ok(card&&button,'Druckkarte und Aktion müssen vorhanden sein');
  assert.equal(card.props.style.display,'none','Karte bleibt außerhalb des Drucks unsichtbar');
  const texts=nodes.filter(node=>typeof node.props.children==='string').map(node=>node.props.children);
  assert.ok(texts.includes('Musiktheorie · Übungsauftrag'));
  assert.ok(texts.includes('Notennamen'));
  assert.ok(texts.includes('15 Aufgaben · Noten praktisch setzen · Bassschlüssel · Anfänger · ohne Vorzeichen'));
  assert.ok(texts.includes(classroomLink));
  const svgs=nodes.filter(node=>node.type==='svg');
  assert.equal(svgs.length,2,'Anzeige- und Druck-QR mit identischer Geometrie');
  assert.equal(svgs[0].props.children[1].props.d,svgs[1].props.children[1].props.d);
  button.props.onClick();
  assert.equal(calls,1,'Drucken erfolgt ausschließlich auf direkten Knopfdruck');
});
