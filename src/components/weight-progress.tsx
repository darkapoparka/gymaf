"use client";
import { useState } from "react";
import { ChevronRight, Minus, Plus } from "lucide-react";
import { useCapture } from "@/lib/capture-context";
import { useLocalData } from "@/lib/store";
import Link, { useAppRouter } from "./capture-link";
import { Back, Sheet } from "./primitives";
import { CaptureStatus } from "./capture-status";

export function WeightProgress({mode}:{mode?:'target'|'log'}) {
  const {data,update}=useLocalData();
  const capture=useCapture();
  const router=useAppRouter();
  const target=Number(data.preferences.targetWeight)||0;
  const [value,setValue]=useState(mode==='target'?String(target||0):data.preferences.loggedWeight||'0');
  const history=data.weightHistory;
  const recent=history.at(-1),previous=history.at(-2),first=history[0];
  const max=history.length?Math.max(target,...history.map(h=>Number(h.value)))+2:target+18;
  const min=history.length?Math.min(target,...history.map(h=>Number(h.value)))-1:target-18;
  const y=(n:number)=>12+(max-n)/(max-min||1)*120;
  function save() {
    const number=Number(value);
    if(!Number.isFinite(number)||number<=0)return;
    if(mode==='target')update(s=>({preferences:{...s.preferences,targetWeight:value}}));
    else update(s=>({weight:value,weightHistory:[...s.weightHistory,{id:crypto.randomUUID(),value,date:capture?'2026-07-03':new Date().toISOString().slice(0,10)}]}));
    router.push('/progress/weight');
  }
  return <section className="weight-progress-page">
    <header><Back href="/progress"/><Link href="/progress/log-weight" className="icon-button" aria-label="Log weight"><Plus size={27}/></Link></header><h1>Weight</h1>
    {target||history.length?<><div className="weight-reference-plot"><svg viewBox="0 0 345 155" role="img" aria-label={`Weight trend${target?', target '+target+' pounds':''}`} preserveAspectRatio="none">
      {target>0&&<><line x1="0" x2="322" y1={y(target)} y2={y(target)} stroke="#ba42e6" strokeDasharray="3 3"/><text x="328" y={y(target)+4} fill="#b342d2">{target}</text></>}
      <text x="328" y="16">{max}</text><text x="328" y="136">{min}</text>
      {recent&&<><polyline points={history.length===1?`0,${y(Number(recent.value))} 325,${y(Number(recent.value))}`:history.map((h,i)=>`${i*325/(history.length-1)},${y(Number(h.value))}`).join(" ")} fill="none" stroke="#ac39f2" strokeWidth="2"/><text x="90" y="150">Mar</text><text x="198" y="150">May</text><text x="313" y="150">Jul</text></>}
    </svg></div><div className="weight-reference-stats"><div><small>Most Recent</small><b>{recent?recent.value+' lbs':'—'}</b></div><div><small>Vs. Previous</small><b>{recent&&previous?(Number(recent.value)-Number(previous.value)).toFixed(1)+' lbs':'—'}</b></div><div><small>Vs. First</small><b>{recent&&history.length>1?(Number(recent.value)-Number(first.value)).toFixed(1)+' lbs':'—'}</b></div></div></>:<div className="weight-first-entry">Add your first measurement now to<br/>start tracking progress</div>}
    <Link className="weight-target-row" href="/progress/target"><span>Target Weight</span><small>{target?target+' lb':'Not Set'}</small><ChevronRight size={19}/></Link>
    <table className="weight-reference-table"><thead><tr><th>Date</th><th>Weight</th></tr></thead><tbody>{history.map(h=><tr key={h.id}><td>{new Date(h.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</td><td>{Number(h.value).toFixed(1)} lb</td></tr>)}</tbody></table>
    {mode&&<Sheet title={mode==='target'?'GOAL ENTRY':'WEIGHT ENTRY'} className={`weight-entry-dialog ${mode}`} onClose={()=>router.push('/progress/weight')}><CaptureStatus light/>{mode==='target'&&<h2>Target Weight</h2>}<p>{mode==='target'?'Set your target weight.':'Add your latest measurement.'}</p><div className="weight-stepper"><button aria-label="Decrease weight" onClick={()=>setValue(String(Math.max(0,Number(value)-1)))}><Minus/></button><label><input aria-label={mode==='target'?'Target Weight':'Weight'} inputMode="decimal" value={value} onChange={e=>setValue(e.target.value.replace(/[^\d.]/g,''))}/><span>lb</span></label><button aria-label="Increase weight" onClick={()=>setValue(String(Number(value)+1))}><Plus/></button></div><button className="goal-photo-save" disabled={!Number(value)} onClick={save}>{mode==='target'?'SET':'SAVE'}</button></Sheet>}
  </section>;
}
