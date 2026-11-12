/**
 * React-Zustand und Ereignissteuerung des Tischduells.
 *
 * Der bisherige Hook-Block bleibt in Reihenfolge und Logik unverändert.
 * Die React-Funktionen und der Fragenpool/Audiofeedback werden injiziert,
 * sodass Darstellung und Sitzungssteuerung getrennt überprüfbar sind.
 *
 * Der Hook muss wie zuvor bei jedem Duell-Render aufgerufen werden,
 * unabhängig davon, ob der Dialog geöffnet ist.
 *
 * Ergänzung Lehrer-Auswertung: Nach jeder gewerteten Runde und am Duellende
 * wird eine lokale Bilanz je Spielername geschrieben (fehlertolerant, ohne
 * Einfluss auf Zustand, Timer oder Wertung).
 */
import {createDuelPlayers,prepareDuelRoundPlayers,scoreDuelRound} from './spielregeln.mjs';
import {recordDuelAnswer,allDuelPlayersAnswered,nextDuelRoundIndex} from './rundensteuerung.mjs';
import {startDuelRoundTimer} from './timer.mjs';
import {duellRundeErfassen,duellEndeErfassen} from '../auswertung/duell-protokoll.mjs';

export function createDuelSessionHook({React,generateQuestions,playFeedback}) {
  const _=React,$t=generateQuestions,qt=playFeedback;
  return function useDuelSession(e,noteClefs,selectedTopics) {
    let[n,r]=(0,_.useState)(!1),[i,a]=(0,_.useState)(2),[o,s]=(0,_.useState)(15),[c,l]=(0,_.useState)(15),[u,d]=(0,_.useState)(`all`),[f,p]=(0,_.useState)([`Spieler 1`,`Spieler 2`,`Spieler 3`,`Spieler 4`]),[m,h]=(0,_.useState)([]),[g,v]=(0,_.useState)(0),[y,b]=(0,_.useState)([]),[x,ee]=(0,_.useState)(!1),[te,ne]=(0,_.useState)(``),[S,re]=(0,_.useState)(100),[C,w]=(0,_.useState)(!1),T=(0,_.useRef)(null),E=(0,_.useRef)([]),D=(0,_.useRef)(!1),ie=e=>{E.current=e,b(e)};(0,_.useEffect)(()=>{(!e||!n)&&T.current&&clearInterval(T.current)},[e,n]),(0,_.useEffect)(()=>()=>{T.current&&clearInterval(T.current)},[]);let ae=()=>{let e=$t(o,u===`custom`?selectedTopics:u,noteClefs);if(!e.length)return;let t=createDuelPlayers(i,f);h(e),v(0),ie(t),D.current=!1,ee(!1),w(!1),r(!0),oe(e[0],t)},oe=(e,t)=>{T.current&&clearInterval(T.current),D.current=!1,ee(!1),ne(``),re(100);let n=prepareDuelRoundPlayers(t,e.options);ie(n);T.current=c===0?null:startDuelRoundTimer({seconds:c,now:()=>performance.now(),schedule:(tick,ms)=>window.setInterval(tick,ms),cancel:id=>clearInterval(id),onProgress:percent=>re(percent),onExpired:()=>se(E.current,`Zeit abgelaufen!`,e)})},O=(e,t)=>{if(D.current)return;let n=E.current[e];if(n.answer!==null)return;let i=recordDuelAnswer(E.current,e,t,()=>performance.now());ie(i),allDuelPlayersAnswered(i)&&(T.current&&clearInterval(T.current),se(i,`Alle haben geantwortet!`,m[g]))},se=(e,t,n)=>{if(D.current)return;D.current=!0,ee(!0),ne(t),T.current&&clearInterval(T.current);let a=scoreDuelRound(e,n.correct);ie(a.players),qt(a.anyCorrect),duellRundeErfassen(a.players,n.correct)},ce=()=>{let e=nextDuelRoundIndex(g,m.length);if(e===null){duellEndeErfassen(E.current),w(!0);return}v(e),oe(m[e],E.current)};
    return {n,r,i,a,o,s,c,l,u,d,f,p,m,h,g,v,y,b,x,ee,te,ne,S,re,C,w,T,E,D,ie,ae,oe,O,se,ce};
  };
}
