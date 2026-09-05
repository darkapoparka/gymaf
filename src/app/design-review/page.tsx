import { notFound } from 'next/navigation';
import { DesignReview } from '@/features/gymaf/design-review';
export default async function Page({searchParams}:{searchParams:Promise<{view?:string;width?:string;frame?:string}>}) {
 if(process.env.NODE_ENV!=='development')notFound();
 const q=await searchParams, views=['home','progress','schedule','profile','workout','player','settings','location','equipment','injury','event','weight','log-weight','app-settings','workout-settings','tones','instructions'];
 const view=views.includes(q.view||'')?q.view!:'home';
 if(q.frame==='1')return <DesignReview view={view}/>;
 const width=[320,393,1440].includes(Number(q.width))?Number(q.width):393;
 return <div style={{width,minHeight:'100vh'}}><iframe title="Connected frontend comparison" width={width} height={width===1440?1000:width===320?740:852} src={`/design-review?view=${view}&frame=1`} style={{display:'block',border:0}}/><nav style={{padding:16,display:'flex',gap:16,flexWrap:'wrap'}}>{views.map(v=><a href={`/design-review?view=${v}&width=${width}`} key={v}>{v}</a>)}</nav><p style={{padding:16}}>Synthetic visual comparison. No backend requests or account writes.</p></div>;
}
