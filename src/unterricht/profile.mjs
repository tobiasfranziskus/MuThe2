/**
 * Getrennte lokale Lernprofile für gemeinsame Schul-iPads.
 * 'standard' verwendet die bisherigen Speicherschlüssel (Migration ohne Verlust).
 * 'gast' speichert ausdrücklich nichts; alle weiteren Profile sind getrennt.
 */
export const PROFILE_INDEX_KEY='musiktheorie_profile_names_v1';
export const PROFILE_DEFAULT='standard';
export const PROFILE_GUEST='gast';

export const PROFILE_KEYS={
  stats:'musiktheorie_stats_v5',
  boss:'musiktheorie_boss_v2',
  xp:'musiktheorie_xp_v2',
  clef:'musiktheorie_clef_v2',
  errors:'musiktheorie_learning_errors_v1',
};

export function profileStorageKey(base,profile=PROFILE_DEFAULT) {
  if(profile===PROFILE_GUEST)return null;
  return profile===PROFILE_DEFAULT?base:base+'__'+profile;
}

export function loadProfiles(storage) {
  try {
    const data=JSON.parse(storage.getItem(PROFILE_INDEX_KEY)||'[]');
    return Array.isArray(data)?data.filter(p=>p && /^p[a-z0-9-]{3,45}$/i.test(p.id) &&
      typeof p.name==='string'&&p.name.trim().length>0)
      .slice(0,40).map(p=>({id:p.id,name:p.name.slice(0,30)})):[];
  }catch{return []}
}

export function registerProfile(storage,name,idCandidate='p'+Date.now().toString(36)) {
  const label=String(name||'').trim().slice(0,30);
  if(!label)return null;
  const existing=loadProfiles(storage);
  if(existing.length>=40)return null;
  let id=String(idCandidate).replace(/[^a-z0-9-]/gi,'');
  if(!/^p[a-z0-9-]{3,45}$/i.test(id))id='p'+Date.now().toString(36);
  let index=1,base=id;
  while(existing.some(p=>p.id===id)){id=base+'-'+index;index++}
  const next=[...existing,{id,name:label}];
  try{storage.setItem(PROFILE_INDEX_KEY,JSON.stringify(next));}catch{return null}
  return {id,name:label};
}

export function removeProfile(storage,id) {
  if(id===PROFILE_DEFAULT||id===PROFILE_GUEST)return false;
  const current=loadProfiles(storage);
  if(!current.some(p=>p.id===id))return false;
  try{
    for(const base of Object.values(PROFILE_KEYS))storage.removeItem(profileStorageKey(base,id));
    storage.setItem(PROFILE_INDEX_KEY,JSON.stringify(current.filter(p=>p.id!==id)));
    return true;
  }catch{return false}
}

function parseObject(raw,fallback={}){
  try{const data=JSON.parse(raw||'null');return data&&typeof data==='object'&&!Array.isArray(data)?data:fallback}
  catch{return fallback}
}
export function loadProfileSnapshot(storage,profile=PROFILE_DEFAULT,keys=PROFILE_KEYS,today=new Date().toISOString().slice(0,10)) {
  const get=base=>{
    const key=profileStorageKey(base,profile);
    if(!key)return null;
    try{return storage.getItem(key)}catch{return null}
  };
  const xp=parseObject(get(keys.xp));
  const clef=get(keys.clef);
  return {
    stats:parseObject(get(keys.stats)),
    boss:parseObject(get(keys.boss)),
    xp:Number(xp.xp)||0,
    dayXp:xp.day===today?(Number(xp.dayXp)||0):0,
    clef:['treble','bass','alto','mixed'].includes(clef)?clef:'mixed',
    errors:parseObject(get(keys.errors)),
  };
}
export function saveProfileValue(storage,profile,base,value){
  const key=profileStorageKey(base,profile);
  if(!key)return false;
  try{storage.setItem(key,String(value));return true}catch{return false}
}
export function removeProfileValue(storage,profile,base) {
  const key=profileStorageKey(base,profile);
  if(!key)return false;
  try{storage.removeItem(key);return true}catch{return false}
}
