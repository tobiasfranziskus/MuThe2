'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname,'..');
const sw = fs.readFileSync(path.join(root,'sw.js'),'utf8');
const index = fs.readFileSync(path.join(root,'index.html'),'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
const scope = 'https://tobiasfranziskus.github.io/Musik-Theorie/';

function staticFiles(dir,base='src') {
  const results = [];
  for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const relative = base + '/' + entry.name;
    if(entry.isDirectory()) results.push(...staticFiles(path.join(dir,entry.name),relative));
    else if(/\.(?:js|mjs|css)$/.test(entry.name)) results.push('./'+relative);
  }
  return results.sort();
}

function setupWorker({missing=null}={}) {
  const handlers = new Map();
  const stores = new Map();
  const network = new Map();
  let online = true,skipWaiting = 0,claimed = 0;
  const fetched = [];
  function requestUrl(request) {return typeof request==='string'?request:request.url;}
  async function responseFor(request) {
    const url = requestUrl(request);
    fetched.push(url);
    if(!online)throw new TypeError('Network offline');
    if(missing && url.endsWith(missing))return new Response('Not found',{status:404});
    const parsed = new URL(url);
    const key = parsed.origin + parsed.pathname;
    return new Response(network.get(url)??network.get(key)??('Resource '+parsed.pathname),{status:200});
  }
  const caches = {
    async open(name) {
      if(!stores.has(name)) {
        const values = new Map();
        stores.set(name,{
          async addAll(urls){
            for(const url of urls) {
              const response = await responseFor(url);
              if(!response.ok)throw Error('Precache failed: '+url);
              values.set(url,response);
            }
          },
          async put(request,response){values.set(requestUrl(request),response.clone());},
          async match(request){
            const existing=values.get(requestUrl(request));
            return existing?existing.clone():undefined;
          },
          values,
        });
      }
      return stores.get(name);
    },
    async keys(){return [...stores.keys()];},
    async delete(name){return stores.delete(name);},
  };
  const self={
    registration:{scope},
    location:{origin:new URL(scope).origin},
    addEventListener(name,listener){handlers.set(name,listener);},
    async skipWaiting(){skipWaiting++;},
    clients:{async claim(){claimed++;}},
  };
  vm.runInNewContext(sw,{self,caches,fetch:responseFor,URL,Response,console},{filename:'sw.js'});
  async function dispatch(type,request=null) {
    let pending,responded;
    const event={
      request,
      waitUntil(promise){pending=promise;},
      respondWith(promise){responded=promise;},
    };
    const handler=handlers.get(type);
    assert.ok(handler,'Handler exists for '+type);
    handler(event);
    if(pending) await pending;
    return responded?responded:undefined;
  }
  return {dispatch,caches,stores,fetched,network,
    setOnline(value){online=value;},
    state(){return {skipWaiting,claimed};},
  };
}

test('Offline-Inventar deckt alle von der Anwendung benötigten CSS-/JS-Module ab',()=>{
  const match=/const APP_FILES = (\[[\s\S]*?\]);/.exec(sw);
  assert.ok(match,'statische App-Dateiliste vorhanden');
  const files=JSON.parse(match[1]);
  assert.deepEqual(files.slice(0,2),['./','./manifest.webmanifest']);
  assert.deepEqual(files.slice(2),staticFiles(path.join(root,'src')));
  assert.equal(new Set(files).size,files.length,'keine mehrfachen Cache-Einträge');
  assert.ok(!files.some(f=>f.startsWith('http')),'keine Drittanbieter-Ressourcen');
  assert.match(sw,/CACHE_PREFIX = 'musiktheorie-offline-'/);
});

test('Installation speichert die komplette App; parametrisierte Links starten offline',async()=>{
  const worker=setupWorker();
  await worker.dispatch('install');
  assert.equal(worker.state().skipWaiting,1);
  const names=await worker.caches.keys();
  assert.equal(names.length,1);
  const storage=worker.stores.get(names[0]);
  assert.ok(storage.values.size>=30,'sämtliche Fachmodule im Cache');
  await worker.dispatch('activate');
  assert.equal(worker.state().claimed,1);

  worker.setOnline(false);
  const query=scope+'?thema=noten&anzahl=15&art=staff&schluessel=bass';
  const result=await worker.dispatch('fetch',{url:query,method:'GET',mode:'navigate'});
  assert.ok(result);
  const response=await result;
  assert.equal(response.ok,true);
  assert.match(await response.text(),/Resource \/Musik-Theorie\//);

  const moduleResult=await worker.dispatch('fetch',{
    url:scope+'src/unterricht/qr-code.mjs',method:'GET',mode:'cors'});
  assert.equal((await moduleResult).ok,true);
  assert.equal(storage.values.has(query),false,'individuelle Unterrichtslinks werden nicht separat gespeichert');
});

test('Online-Updates ersetzen zwischengespeicherte Module und bleiben offline sichtbar',async()=>{
  const worker=setupWorker();
  await worker.dispatch('install');
  await worker.dispatch('activate');
  const moduleURL=scope+'src/aufgaben/notennamen.mjs';
  worker.network.set(moduleURL,'Aktualisierter Generator');
  const response=await worker.dispatch('fetch',{url:moduleURL+'?v=2',method:'GET',mode:'cors'});
  assert.ok(response);
  assert.equal(await (await response).text(),'Aktualisierter Generator');
  // Fetch mit Query bleibt zulässig; das Caching nutzt den kanonischen Asset-Pfad.
  worker.setOnline(false);
  const fallback=await worker.dispatch('fetch',{url:moduleURL,method:'GET',mode:'cors'});
  assert.equal(await (await fallback).text(),'Aktualisierter Generator');

  const external=await worker.dispatch('fetch',{
    url:'https://example.com/api/student',method:'GET',mode:'cors'});
  assert.equal(external,undefined,'Fremdorigin wird vom Offline-Worker ignoriert');
  const foreignRepo=await worker.dispatch('fetch',{
    url:'https://tobiasfranziskus.github.io/Anderes-Projekt/app.js',method:'GET',mode:'cors'});
  assert.equal(foreignRepo,undefined,'Nachbarprojekt bleibt unangetastet');
  const post=await worker.dispatch('fetch',{
    url:scope+'api/result',method:'POST',mode:'cors'});
  assert.equal(post,undefined,'Schülerdaten-POSTs werden nicht abgefangen');
});

test('Eine unvollständige Aktualisierung aktiviert keinen defekten Offline-Worker',async()=>{
  const worker=setupWorker({missing:'/src/music/akkorde.mjs'});
  const old=await worker.caches.open('musiktheorie-offline-alte-version');
  await old.put(scope,new Response('Alte Offline-Version',{status:200}));
  await assert.rejects(worker.dispatch('install'),/Precache failed/);
  assert.equal(worker.state().skipWaiting,0,'Installation nicht aktiviert');
  assert.ok((await worker.caches.keys()).includes('musiktheorie-offline-alte-version'));
});

test('Aktivierung entfernt nur alte Musiktheorie-Caches, keine anderen Apps',async()=>{
  const worker=setupWorker();
  await worker.caches.open('musiktheorie-offline-2025');
  await worker.caches.open('andere-app-daten');
  await worker.dispatch('install');
  await worker.dispatch('activate');
  const keys=await worker.caches.keys();
  assert.equal(keys.includes('musiktheorie-offline-2025'),false);
  assert.equal(keys.includes('andere-app-daten'),true);
});

test('Manifest und Registrierung sind auf GitHub Pages-Unterverzeichnis begrenzt',()=>{
  assert.equal(manifest.start_url,'./');
  assert.equal(manifest.scope,'./');
  assert.equal(manifest.display,'standalone');
  assert.equal(manifest.lang,'de');
  assert.match(index,/<link rel="manifest" href="\.\/manifest\.webmanifest"/);
  assert.match(index,/navigator\.serviceWorker\.register\('\.\/sw\.js', \{ scope: '\.\/' \}\)/);
  assert.match(index,/apple-mobile-web-app-capable/);
});

test('Abgabe- und Lehrerseite sind offline als eigene Seiten verfügbar',async()=>{
  const match=/const PAGE_FILES = (\[[^\]]*\]);/.exec(sw);
  assert.ok(match,'Seitenliste vorhanden');
  const pages=JSON.parse(match[1]);
  assert.deepEqual(pages,['./ergebnis.html','./lehrer.html']);
  for(const page of pages)assert.ok(fs.existsSync(path.join(root,page)),page+' existiert');

  const worker=setupWorker();
  worker.network.set(scope+'lehrer.html','Lehrerseite');
  worker.network.set(scope+'ergebnis.html','Abgabeseite');
  await worker.dispatch('install');
  await worker.dispatch('activate');
  worker.setOnline(false);

  const teacher=await worker.dispatch('fetch',{url:scope+'lehrer.html',method:'GET',mode:'navigate'});
  assert.equal(await (await teacher).text(),'Lehrerseite','nicht die App-Shell');
  const student=await worker.dispatch('fetch',{url:scope+'ergebnis.html?gruppe=7b',method:'GET',mode:'navigate'});
  assert.equal(await (await student).text(),'Abgabeseite');
  const storage=worker.stores.get((await worker.caches.keys())[0]);
  assert.equal([...storage.values.keys()].some(k=>k.includes('?')||k.includes('#')),false,
    'keine Gruppen- oder Abgabedaten als Cache-Schlüssel');

  const other=await worker.dispatch('fetch',{url:scope+'?thema=noten',method:'GET',mode:'navigate'});
  assert.match(await (await other).text(),/Resource \/Musik-Theorie\//,'App-Links nutzen weiterhin die Shell');
});
