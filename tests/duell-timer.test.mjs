import test from 'node:test';
import assert from 'node:assert/strict';
import {startDuelRoundTimer} from '../src/duell/timer.mjs';

function clock(initial=0) {
  let time=initial,callback=null,interval=null,serial=0;
  const events=[];
  const now=()=>time;
  const schedule=(fn,ms)=>{
    events.push(['schedule',ms]);
    callback=fn;
    interval=++serial;
    return interval;
  };
  const cancel=id=>events.push(['cancel',id]);
  const onProgress=value=>events.push(['progress',value]);
  const onExpired=()=>events.push(['expired']);
  const tick=value=>{
    time=value;
    assert.ok(callback,'Timer wurde gestartet');
    callback();
  };
  const start=seconds=>startDuelRoundTimer({
    seconds,now,schedule,cancel,onProgress,onExpired,
  });
  return {events,tick,start,now};
}

test('Rundenuhr startet exakt mit 100-ms-Tick und ohne sofortigen Fortschritts-Callback', () => {
  const c=clock(1000);
  assert.equal(c.start(15),1);
  assert.deepEqual(c.events,[['schedule',100]]);
});

test('Fortschrittsanzeige liefert unverändert 100 bis 0 Prozent', () => {
  const c=clock(500);
  c.start(10);
  c.tick(500);
  c.tick(3000);
  c.tick(5500);
  c.tick(10500);
  assert.deepEqual(c.events,[
    ['schedule',100],['progress',100],['progress',75],
    ['progress',50],['progress',0],['cancel',1],['expired'],
  ]);
});

test('Zeitablauf: erst Anzeige aktualisieren, dann Intervall abbrechen, dann Rundenende', () => {
  const c=clock(100);
  c.start(1);
  c.tick(1101);
  assert.deepEqual(c.events,[['schedule',100],['progress',0],['cancel',1],['expired']]);
});

test('Kein vorzeitiges Rundenende unmittelbar vor der Frist', () => {
  const c=clock(0);
  c.start(1);
  c.tick(999.999);
  assert.equal(c.events.some(e=>e[0]==='expired'),false);
  assert.ok(c.events[1][1]>0);
});

test('Jeder Timer besitzt seine eigene Intervall-ID und Laufzeit', () => {
  const c=clock(0);
  const first=c.start(5);
  const second=c.start(10);
  assert.notEqual(first,second);
  c.tick(6000);
  assert.deepEqual(c.events.slice(-1),[['progress',40]]);
});

test('Timer feuert auch für null Sekunden erst bei einem echten Intervall-Tick', () => {
  const c=clock(500);
  c.start(0);
  assert.equal(c.events.length,1);
  c.tick(600);
  assert.deepEqual(c.events.slice(-3),[['progress',0],['cancel',1],['expired']]);
});

test('Die Zeitquelle wird einmal beim Start und genau einmal pro Tick gelesen', () => {
  let reads=0,callback=null,cancels=0;
  const startDuel=startDuelRoundTimer({
    seconds:1,now:()=>{reads++;return reads*100;},
    schedule:(fn,delay)=>{assert.equal(delay,100);callback=fn;return 17;},
    cancel:()=>{cancels++;},onProgress:()=>{},onExpired:()=>{},
  });
  assert.equal(startDuel,17);
  assert.equal(reads,1);
  callback();
  assert.equal(reads,2);
  assert.equal(cancels,0);
});
