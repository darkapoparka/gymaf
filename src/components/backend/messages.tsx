"use client";
import { useBackend } from '@/lib/backend/context';
import { Messages } from '@/features/gymaf/messages';
import { PageHead, Row } from '../primitives';
export function BackendMessages({initialComposer=false}:{initialComposer?:boolean}) {
  const backend=useBackend()!, relationship=backend.relationship;
  return relationship ? <Messages initialComposer={initialComposer} presentation="template" relationshipId={relationship.relationship.id} userId={backend.account.user.id} coachName={relationship.relationship.coach_name} canSend={relationship.can_train}/> : <><PageHead title="Messages"/><p className="note">Connect with a coach to start your conversation.</p><Row href="/coaches">Explore Coaches</Row></>;
}
