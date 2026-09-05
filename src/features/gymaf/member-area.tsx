"use client";
import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Bootstrap, MemberKind, MemberRecord } from '@/shared/gymaf/contracts';
import { ErrorNote, Pending, useCommand, useResource } from './ui';
import { MemberViews } from './member-views';

export function MemberArea({account,path,query}:{account:Bootstrap;path:string[];query:string}) {
  const resource=useResource<MemberRecord[]>('me/details'), mutation=useCommand(), router=useRouter();
  const newIds=useRef(new Map<string,string>());
  if(!resource.data) return <Pending error={resource.error} reload={resource.reload}/>;
  async function save(kind:MemberKind,data:MemberRecord['data'],record?:MemberRecord) {
    let id=record?.id||newIds.current.get(kind);
    if(!id){id=crypto.randomUUID();newIds.current.set(kind,id);}
    const result=await mutation.run('member.save',{id,kind,data,revision:record?.revision||0});
    if(!result)return null;
    newIds.current.delete(kind);
    resource.update(records=>[...records.filter(r=>r.id!==id),{id:result.id,kind,data,revision:result.revision??((record?.revision||0)+1),updated_at:new Date().toISOString()}]);
    resource.reload();return result.id;
  }
  return <><ErrorNote message={resource.error}/><MemberViews key={path.join('/')} account={account} path={path} query={query} records={resource.data} busy={mutation.busy} error={mutation.error} save={save} remove={async record=>{if(await mutation.run('member.delete',{id:record.id,kind:record.kind,revision:record.revision})){resource.reload();return true;}return false;}} navigate={href=>router.push(href)}/></>;
}
