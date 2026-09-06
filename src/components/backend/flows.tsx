"use client";
import { useBackend } from '@/lib/backend/context';
import { ClientArea } from '@/features/gymaf/client';
import { SessionScreen } from '@/features/gymaf/session';
import { PageHead } from '../primitives';
import { BackendMessages } from './messages';
import { CoachRatingDialog } from '@/features/gymaf/coach-rating';

/** New service controllers extend the template; primary screens stay in FutureApp. */
export function serviceFlow(path:string) {
  return /^(account(?:\/|$)|checkout(?:\/|$)|coaches(?:\/|$)|appointments(?:\/|$)|friends(?:\/|$)|sessions\/|messages\/(?:videos|shared|photo|rate|gifs)|profile\/(?:avatar|cover)|progress\/photos|settings\/(?:security|service|support))/.test(path)
    || /^onboarding\//.test(path) || /^settings\/(?:app|workout|instructions|tones|about)$/.test(path)
    || /^settings\/(?:equipment|injury)\/[0-9a-f-]{36}(?:\/exclusions)?$/.test(path) || /^profile\/event\/[0-9a-f-]{36}$/.test(path);
}
export function ServiceFlow({path}:{path:string}) {
  const backend=useBackend()!;
  if (['messages/photo','messages/rate','messages/gifs'].includes(path)) return <><BackendMessages initialComposer={path!=='messages/rate'}/>{path==='messages/rate'&&backend.relationship&&<div className="gymaf-connected gymaf-client"><CoachRatingDialog ownerId={backend.account.user.id} relationshipId={backend.relationship.relationship.id} coachName={backend.relationship.relationship.coach_name}/></div>}</>;
  let route=path.split('/');
  if (path === 'account/membership' || path.startsWith('account/cancel') || path === 'account/payment' || path === 'settings/service') route=['account','plan'];
  if (path.startsWith('account/help')) route=['settings','support'];
  if (path.startsWith('onboarding/') && !['onboarding/coach','onboarding/matching'].includes(path)) route=['profile','edit'];
  const content = route[0] === 'sessions'
    ? <SessionScreen ownerId={backend.account.user.id} id={route[1]} back="/history" />
    : <ClientArea account={backend.account} path={route} selectedId={backend.relationship?.relationship.id} reloadAccount={() => void backend.reload()} />;
  return <div className={`gymaf-connected gymaf-client template-service ${route[0] === 'sessions'?'gymaf-player-shell':''}`}>
    {content}
  </div>;
}
export function UnavailableDeviceFlow({path}:{path:string}) {
  return <><PageHead title={path.includes('steps')?'Daily Steps':'Device Activity'} back="/progress"/><p className="note">No device measurements are connected to your account. Your saved workouts, weight and progress photos are available in Progress.</p></>;
}
