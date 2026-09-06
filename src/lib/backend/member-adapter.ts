import type { MemberKind, MemberRecord } from "@/shared/gymaf/contracts";
import type { LocalData } from "@/lib/store";

/** Adapt persisted records to the original template's view model, never seed demo records. */
export function memberView(records: MemberRecord[]) {
  const preferences = records.find(r => r.kind === 'preferences');
  const factor = preferences?.data.units === 'Imperial' ? 2.2046226218 : 1;
  const weightHistory = records.filter(r => r.kind === 'weight').sort((a,b) => String(a.data.date).localeCompare(String(b.data.date)) || a.updated_at.localeCompare(b.updated_at)).map(r => ({id:r.id, date:String(r.data.date), value:String(Number((Number(r.data.valueKg)*factor).toFixed(1)))}));
  const target = records.find(r => r.kind === 'weight-target');
  return {
    privateProfile: true,
    preferences: {...Object.fromEntries(Object.entries(preferences?.data || {}).map(([key,value]) => [key,String(value)])), weightUnit: factor === 1 ? 'kg' : 'lb', targetWeight: target ? String(Number((Number(target.data.valueKg)*factor).toFixed(1))) : ''},
    weightHistory, weight: weightHistory.at(-1)?.value || '',
    events: records.filter(r => r.kind === 'event').map(r => ({id:r.id, name:String(r.data.name), date:String(r.data.startDate), endDate:String(r.data.endDate), details:String(r.data.details), type:String(r.data.type), training:String(r.data.training)})),
    locations: records.filter(r => r.kind === 'location').map(r => ({id:r.id, name:String(r.data.name), kind:String(r.data.type), equipment:r.data.equipment as string[]})),
    injuries: records.filter(r => r.kind === 'injury').map(r => ({id:r.id, description:String(r.data.description), affectsMovement:!!r.data.affectsMovement, excluded:r.data.excluded as string[]})),
  };
}

export function memberChanges(patch: Partial<LocalData>, current: LocalData, records: MemberRecord[]) {
  const changes: {action:string; payload:Record<string,unknown>}[] = [];
  const save = (kind:MemberKind, id:string, data:MemberRecord['data']) => {
    const existing = records.find(r => r.id === id && r.kind === kind);
    changes.push({action:'member.save',payload:{id,kind,data:{...existing?.data,...data},revision:existing?.revision || 0}});
  };
  for (const [key,kind] of [['locations','location'],['injuries','injury'],['events','event'],['weightHistory','weight']] as const) {
    const next = patch[key]; if (!next) continue;
    for (const previous of current[key]) if (!next.some(r => r.id === previous.id)) {
      const existing=records.find(r => r.id === previous.id && r.kind === kind);
      if (existing) changes.push({action:'member.delete',payload:{id:existing.id,kind,revision:existing.revision}});
    }
    for (const value of next) {
      if (JSON.stringify(value) === JSON.stringify(current[key].find(r => r.id === value.id))) continue;
      if ('equipment' in value) save(kind,value.id,{name:value.name,type:value.kind,equipment:value.equipment});
      else if ('excluded' in value) save(kind,value.id,{description:value.description,affectsMovement:value.affectsMovement,excluded:value.excluded});
      else if ('name' in value) save(kind,value.id,{name:value.name,startDate:value.date,endDate:value.endDate||value.date,type:value.type||'Event',details:value.details||'',training:value.training||'Normal'});
      else save(kind,value.id,{date:value.date,valueKg:Number((Number(value.value)/(current.preferences.weightUnit === 'lb'?2.2046226218:1)).toFixed(4))});
    }
  }
  return changes;
}
