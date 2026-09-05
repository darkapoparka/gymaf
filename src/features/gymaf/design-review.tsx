"use client";
import { useState } from 'react';
import { SessionView } from './session-view';
import type { Bootstrap, RelationshipDetail, SessionState } from '@/shared/gymaf/contracts';
import { ClientHome, ProgressView, ProfileOverview, ScheduleView, WorkoutDetailView } from './client-views';
import { Navigation } from './ui';
const profile={id:'visual-client',display_name:'Alex Smith',locale:'en' as const,timezone:'Europe/Sofia',goal:'Increase Muscle Mass',equipment:'Dumbbells, Yoga Mat',availability:'Monday, Wednesday, Friday',revision:1};
const relationship={id:'visual-relationship',workspace_id:'visual-workspace',client_user_id:profile.id,coach_user_id:'visual-coach',state:'active' as const,client_name:profile.display_name,coach_name:'Your Coach'};
const account:Bootstrap={user:profile,relationships:[relationship],workspaces:[],operator:false,requires_mfa:false,local_mode:true,notifications:[]};
const prescription={id:'visual-workout',title:'Morning Yoga Flow',dayOffset:0,exercises:[{id:'visual-exercise',name:'Modified Plyo Push-Up',instructions:'Follow the instructions provided by your coach.',sets:[{reps:15,loadKg:null,durationSeconds:60,distanceM:null,restSeconds:30}]}]};
const today=new Date().toLocaleDateString('en-CA',{timeZone:'Europe/Sofia'});
const initial:RelationshipDetail={relationship,client:profile,workouts:[{id:'visual-scheduled',relationship_id:relationship.id,scheduled_date:today,timezone:profile.timezone,state:'assigned',revision:1,prescription}],sessions:[],check_ins:[],entitlements:[],can_train:true};
/** Development-only, presentation-level fixtures. Never imported by ConnectedApp or its API hooks. */
export function DesignReview({view}:{view:string}) {
 const [data,setData]=useState(initial),[user,setUser]=useState(profile),[sessionState,setSessionState]=useState<SessionState>("in_progress");
 return <div className="gymaf-connected gymaf-client"><main id="main" className={`app-shell connected-route-${view==='home'?'home':view==='progress'?'history':view==='workout'?'workouts':view==='player'?'sessions':view} ${view==='home'?'home-page':''}`}>
 {view==='home'?<ClientHome account={{...account,user}} data={data} query=""/>:view==='progress'?<ProgressView data={data} query="" user={user} onGoal={async goal=>{setUser({...user,goal});return true;}}/>:view==='schedule'?<ScheduleView data={data} query="" onMove={async(w,date)=>{setData({...data,workouts:data.workouts.map(x=>x.id===w.id?{...x,scheduled_date:date}:x)});return true;}}/>:view==='player'?<SessionView detail={{editable:sessionState==='in_progress'||sessionState==='paused',sets:[],session:{id:'visual-session',relationship_id:relationship.id,scheduled_workout_id:'visual-scheduled',prescription,state:sessionState,revision:1,started_at:today+'T08:00:00Z',running_since:null,elapsed_seconds:19,completed_at:null}}} elapsed={19} back='/design-review?view=home&frame=1' dirty={false} busy={false} onTransition={setSessionState} renderSets={()=> <p>Set entry uses the connected server in the account view. This visual page makes no server requests.</p>}/>:view==='profile'?<ProfileOverview account={{...account,user}} data={data} query=""/>:<WorkoutDetailView workout={data.workouts[0]} query=""><button className="button primary full" disabled title="Starting a workout requires a connected account">Start</button></WorkoutDetailView>}
 </main>{view!=='workout'&&view!=='schedule'&&view!=='player'&&<Navigation area="app" active={view==='home'?'':view==='progress'?'history':view} locale="en"/>}</div>;
}
