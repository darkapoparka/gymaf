"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, MessagePage } from "@/shared/gymaf/contracts";
import { api, command } from "./api";
import Link from "next/link";
import { takeRatingFocus } from "./rating-drafts";
import { ArrowUp, ChevronLeft, RefreshCw, Star, Plus, Images } from "lucide-react";
import { InitialAvatar } from "./client-views";
import { Empty, ErrorNote, Head, Note, useCommand, useResource } from "./ui";
import { AttachmentComposer, AttachmentPreview, type Attachment } from './conversation-media';

type ConversationState = MessagePage & { olderLoaded: boolean };
function merge(a: Message[], b: Message[]) { const byId = new Map([...a,...b].map(message => [message.id,message])); return [...byId.values()].sort((x,y) => Date.parse(y.created_at)-Date.parse(x.created_at) || y.id.localeCompare(x.id)); }
export function Messages({ relationshipId, userId, canSend, coachName = "Your coach", presentation = "embedded", initialComposer=false }: { relationshipId: string; userId: string; canSend: boolean; coachName?:string; presentation?: "client" | "embedded";initialComposer?:boolean }) {
  const [data, setData] = useState<ConversationState | null>(null), [error, setError] = useState(""), [body, setBody] = useState(""), [loadingOlder, setLoadingOlder] = useState(false);
  const ratingTrigger=useRef<HTMLAnchorElement>(null);
  const attachments=useResource<Attachment[]>(`relationships/${relationshipId}/attachments`),[adding,setAdding]=useState(initialComposer);
  const reloadAttachments=attachments.reload;
  useEffect(()=>{if(takeRatingFocus(userId,relationshipId))requestAnimationFrame(()=>ratingTrigger.current?.focus());},[userId,relationshipId]);
  const mutation = useCommand(), lastRead = useRef(""), alive = useRef(true);
  const load = useCallback(async (before?: string) => {
    const result = await api<MessagePage>(`relationships/${relationshipId}/messages${before ? `?before=${encodeURIComponent(before)}` : ""}`);
    if (!alive.current) return;
    setData(previous => ({ messages: merge(previous?.messages || [], result.messages), next_cursor: before ? result.next_cursor : previous?.olderLoaded ? previous.next_cursor : result.next_cursor, other_read_at: result.other_read_at, olderLoaded: !!before || !!previous?.olderLoaded }));
    setError("");
    reloadAttachments();
    const newest = result.messages[0];
    if (!before && newest && lastRead.current !== newest.id && document.visibilityState === "visible") {
      await command("message.read", { relationshipId, messageId: newest.id }, newest.id);
      lastRead.current = newest.id;
    }
  }, [relationshipId,reloadAttachments]);
  useEffect(() => {
    alive.current = true;
    const refresh = () => { void load().catch(failure => { if (alive.current) setError(failure instanceof Error ? failure.message : "Messages could not be loaded."); }); };
    refresh(); const timer = window.setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 15000);
    return () => { alive.current = false; window.clearInterval(timer); };
  }, [load]);
  async function send() {
    if (await mutation.run("message.send", { relationshipId, body })) {
      setBody("");
      try { await load(); } catch { setError("Your message was saved, but the conversation could not refresh. Use Refresh."); }
    }
  }
  async function older() { if (!data?.next_cursor || loadingOlder) return; setLoadingOlder(true); try { await load(data.next_cursor); } catch (failure) { setError(failure instanceof Error ? failure.message : "Older messages could not be loaded."); } finally { setLoadingOlder(false); } }
  return <section className={presentation === "client" ? "connected-conversation" : "gymaf-stack"}>{presentation === "client" ? <header className="conversation-head"><Link href={`/app?relationship=${relationshipId}`} className="icon-button" aria-label="Back"><ChevronLeft/></Link><div><InitialAvatar name={coachName}/><h1>{coachName}</h1></div><div className="conversation-actions"><Link ref={ratingTrigger} href={`/app/messages/rate?relationship=${relationshipId}`} className="icon-button" aria-label="Rate your coach"><Star size={20}/></Link><button className="icon-button" aria-label="Refresh conversation" onClick={() => void load().catch(failure => setError(failure instanceof Error ? failure.message : "Refresh failed."))}><RefreshCw size={19}/></button></div></header> : <Head title="Conversation"><button className="button" onClick={() => void load().catch(failure => setError(failure instanceof Error ? failure.message : "Refresh failed."))}>Refresh</button></Head>}
    <ErrorNote message={error || mutation.error}/><ErrorNote message={attachments.error}/>{attachments.error&&<button className="button" onClick={attachments.reload}>Retry Shared Media</button>}{presentation==="client"&&<Link className="conversation-media-link" href={`/app/messages/shared?relationship=${relationshipId}`}><Images size={18}/>Shared Media</Link>}
    {data?.next_cursor && <button className="button conversation-older" disabled={loadingOlder} onClick={() => void older()}>Load older messages</button>}
    <div className="chat-messages" role="log" aria-live="polite" aria-label="Coach conversation">{!data ? <p>Loading…</p> : !data.messages.length ? <Empty>No messages yet.</Empty> : [...data.messages].reverse().map(message => <article key={message.id} className={`gymaf-message ${message.sender_id === userId ? "mine" : ""}`}><p>{message.body}</p>{attachments.data?.filter(item=>item.message_id===message.id).map(item=><AttachmentPreview key={item.id} item={item}/>)}<time dateTime={message.created_at}>{new Date(message.created_at).toLocaleString()}</time>{message.sender_id === userId && <small>{data.other_read_at && Date.parse(data.other_read_at) >= Date.parse(message.created_at) ? "Read" : "Sent"}</small>}</article>)}</div>
    {canSend ? <form className="gymaf-compose" onSubmit={event => { event.preventDefault(); void send(); }}><button type="button" className="icon-button" aria-label="Add photo or video" disabled={mutation.busy} onClick={()=>setAdding(true)}><Plus size={20}/></button><label><span className="visually-hidden">Message</span><textarea placeholder="Message" required maxLength={4000} value={body} disabled={mutation.busy} onChange={event => setBody(event.target.value)} /></label><button className={presentation === "client" ? "send-message" : "button primary"} aria-label={mutation.busy?"Sending message":"Send message"} disabled={mutation.busy || !body.trim()}>{presentation === "client" ? <ArrowUp size={22}/> : mutation.busy ? "Sending…" : "Send"}</button></form> : <Note>This relationship is read-only. Account support is available from your profile.</Note>}
    {adding&&canSend&&<AttachmentComposer ownerId={userId} relationshipId={relationshipId} coachName={presentation==="client"?coachName:"your client"} onClose={()=>setAdding(false)} onShared={()=>{attachments.reload();void load().catch(()=>setError("Media was sent. Refresh the conversation to see it."));}}/>}
  </section>;
}
