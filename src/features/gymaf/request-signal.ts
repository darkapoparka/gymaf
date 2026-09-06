export function requestSignal(parent:AbortSignal|undefined,timeoutMs:number){
  const deadline=AbortSignal.timeout(timeoutMs);
  return parent?AbortSignal.any([parent,deadline]):deadline;
}
