import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PROFILE_DEFAULT,PROFILE_GUEST,PROFILE_KEYS,PROFILE_INDEX_KEY,loadProfiles,
  registerProfile,removeProfile,profileStorageKey,loadProfileSnapshot,
  saveProfileValue,removeProfileValue,
} from '../src/unterricht/profile.mjs';

function fakeStorage() {
  const map=new Map();
  return {
    getItem:key=>map.has(key)?map.get(key):null,
    setItem:(key,value)=>map.set(key,String(value)),
    removeItem:key=>map.delete(key),
    map,
  };
}

test('Bisheriges Standardprofil übernimmt die vorhandenen Ergebnisse ohne Datenverlust',()=>{
  const store=fakeStorage();
  store.setItem(PROFILE_KEYS.stats,JSON.stringify({noten:{correct:8,total:10}}));
  store.setItem(PROFILE_KEYS.boss,JSON.stringify({noten:true}));
  store.setItem(PROFILE_KEYS.xp,JSON.stringify({xp:150,day:'2026-11-03',dayXp:70}));
  store.setItem(PROFILE_KEYS.clef,'bass');
  const s=loadProfileSnapshot(store,PROFILE_DEFAULT,PROFILE_KEYS,'2026-11-03');
  assert.deepEqual(s.stats,{noten:{correct:8,total:10}});
  assert.deepEqual(s.boss,{noten:true});
  assert.equal(s.xp,150);
  assert.equal(s.dayXp,70);
  assert.equal(s.clef,'bass');
});

test('Getrennte Schülerprofile sehen keine Statistiken anderer Profile',()=>{
  const store=fakeStorage();
  const a=registerProfile(store,'Gruppe A','pgroupa'),b=registerProfile(store,'Gruppe B','pgroupb');
  assert.deepEqual(loadProfiles(store).map(p=>p.name),['Gruppe A','Gruppe B']);
  saveProfileValue(store,a.id,PROFILE_KEYS.stats,JSON.stringify({noten:{correct:9,total:10}}));
  saveProfileValue(store,b.id,PROFILE_KEYS.stats,JSON.stringify({noten:{correct:1,total:10}}));
  assert.equal(loadProfileSnapshot(store,a.id).stats.noten.correct,9);
  assert.equal(loadProfileSnapshot(store,b.id).stats.noten.correct,1);
  assert.deepEqual(loadProfileSnapshot(store,PROFILE_DEFAULT).stats,{});
  assert.equal(profileStorageKey(PROFILE_KEYS.stats,a.id),PROFILE_KEYS.stats+'__pgroupa');
});

test('Gastmodus speichert weder Namen noch Ergebnisse',()=>{
  const store=fakeStorage();
  assert.equal(saveProfileValue(store,PROFILE_GUEST,PROFILE_KEYS.stats,'{}'),false);
  assert.equal(removeProfileValue(store,PROFILE_GUEST,PROFILE_KEYS.stats),false);
  assert.equal(profileStorageKey(PROFILE_KEYS.xp,PROFILE_GUEST),null);
  assert.deepEqual(loadProfileSnapshot(store,PROFILE_GUEST).stats,{});
  assert.equal(store.map.size,0);
});

test('Löschen eines Profils entfernt nur dessen lokale Daten',()=>{
  const store=fakeStorage();
  const a=registerProfile(store,'A','pusera'),b=registerProfile(store,'B','puserb');
  saveProfileValue(store,a.id,PROFILE_KEYS.errors,'{"noten:0":{"wrong":9,"correct":0}}');
  saveProfileValue(store,b.id,PROFILE_KEYS.errors,'{"noten:0":{"wrong":2,"correct":0}}');
  saveProfileValue(store,PROFILE_DEFAULT,PROFILE_KEYS.errors,'{"noten:0":{"wrong":1,"correct":0}}');
  assert.equal(removeProfile(store,a.id),true);
  assert.deepEqual(loadProfiles(store),[b]);
  assert.deepEqual(loadProfileSnapshot(store,a.id).errors,{});
  assert.equal(loadProfileSnapshot(store,b.id).errors['noten:0'].wrong,2);
  assert.equal(loadProfileSnapshot(store,PROFILE_DEFAULT).errors['noten:0'].wrong,1);
  assert.equal(removeProfile(store,PROFILE_DEFAULT),false);
  assert.equal(removeProfile(store,PROFILE_GUEST),false);
});

test('Ungültige Profildaten beeinträchtigen andere Lernende nicht',()=>{
  const store=fakeStorage();
  store.setItem(PROFILE_INDEX_KEY,'kaputt');
  assert.deepEqual(loadProfiles(store),[]);
  assert.equal(registerProfile(store,'   '),null);
  const entry=registerProfile(store,'Alice','pstudent1');
  assert.equal(entry.name,'Alice');
  assert.equal(registerProfile(store,'Bob','pstudent1').id,'pstudent1-1');
  store.setItem(profileStorageKey(PROFILE_KEYS.stats,entry.id),'keine gültigen Daten');
  assert.deepEqual(loadProfileSnapshot(store,entry.id).stats,{});
  assert.equal(loadProfileSnapshot(store,entry.id).clef,'mixed');
});
