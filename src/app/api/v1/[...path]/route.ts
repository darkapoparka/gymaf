import type { NextRequest } from "next/server";
import { authPost } from "@/server/gymaf/auth";
import { accessToken, failure, HttpError, readBody, rpc, sameOrigin, success, verifiedUser } from "@/server/gymaf/http";
import { text, uuid, validateCommand } from "@/shared/gymaf/validation";
import { deleteMedia, readMedia, uploadMedia } from "@/server/gymaf/media";
import { deleteAttachment, readAttachment, uploadAttachment } from '@/server/gymaf/conversation-media';

import { checkout,billingPortal,configureBilling,stripeWebhook } from '@/server/gymaf/billing';

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ path: string[] }> };

export async function GET(request: NextRequest, context: Context) {
  try {
    const path = (await context.params).path;
    if(path.join('/')==='public/directory')return success(await rpc('gymaf_directory_query',{p_workspace:null}));
    if (path.length === 3 && path[0] === "public" && path[1] === "coaches") {
      const slug = text(path[2], "Coach slug", 80, 3);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new HttpError(404, "NOT_FOUND", "Coach not found.");
      return success(await rpc("gymaf_public_coach", { p_slug: slug }));
    }
    const token = accessToken(request), user = await verifiedUser(token);
    if(path.join('/')==='me/billing')return success(await rpc('gymaf_billing_query',{p_relationship:request.nextUrl.searchParams.has('relationship')?uuid(request.nextUrl.searchParams.get('relationship')):null},token));
    if(path.join('/')==='me/attachments')return success(await rpc('gymaf_attachment_query',{},token));
    if(path.length===3&&path[0]==='relationships'&&path[2]==='attachments')return success(await rpc('gymaf_attachment_query',{p_relationship:uuid(path[1])},token));
    if(path.length===3&&path[0]==='attachments'&&path[2]==='file')return await readAttachment(token,uuid(path[1]));
    if (path.join('/') === 'me/friends') return success(await rpc('gymaf_social_query',{},token));
    if (path.join('/') === 'me/appointments') return success(await rpc('gymaf_booking_query',{},token));
    if(path.length===3 && path[0]==='coaches' && path[2]==='availability')return success(await rpc('gymaf_booking_query',{p_workspace:uuid(path[1]),p_owner:false},token));
    if(path.length===3 && path[0]==='workspaces' && path[2]==='appointments')return success(await rpc('gymaf_booking_query',{p_workspace:uuid(path[1]),p_owner:true},token));
    if (path.join('/') === 'me/media') return success(await rpc('gymaf_media_query',{},token));
    if (path.length === 4 && path[0] === 'me' && path[1] === 'media' && path[3] === 'file') return await readMedia(token,uuid(path[2]));
    if(path.length===3 && path[0]==='workspaces' && path[2]==='directory')return success(await rpc('gymaf_directory_query',{p_workspace:uuid(path[1])},token));
    if(path.length===3 && path[0]==='relationships' && path[2]==='rating') return success(await rpc('gymaf_coach_rating_query',{p_id:uuid(path[1])},token));
    if (path.join('/') === 'me/account') return success({email:typeof user.email==='string'?user.email:'', records:await rpc('gymaf_member_query',{},token)});
    if (path.join("/") === "me/details") return success(await rpc("gymaf_member_query", {}, token));
    if (path.length === 3 && path[0] === "workout-sessions" && path[2] === "feedback") return success(await rpc("gymaf_feedback_query", { p_id: uuid(path[1]) }, token));
    if (path.length === 3 && path[0] === "relationships" && path[2] === "favorites") return success(await rpc("gymaf_training_query", { p_kind: "favorites", p_id: uuid(path[1]) }, token));
    if (path.length === 4 && path[0] === "workout-sessions" && path[2] === "exercise-history") return success(await rpc("gymaf_training_query", { p_kind: "exercise-history", p_id: uuid(path[1]), p_exercise_id: uuid(path[3]) }, token));
    if (path.join("/") === "auth/factors") return success({ factors: Array.isArray(user.factors) ? user.factors : [] });
    let kind: string, id: string | null = null;
    if (path.join("/") === "me") kind = "bootstrap";
    else if (path.join("/") === "me/export") kind = "export";
    else if (path.join("/") === "me/requests") kind = "requests";
    else if (path.join("/") === "operator") kind = "operator";
    else if (path.length === 2 && ["workspaces", "relationships", "programs", "workout-sessions"].includes(path[0])) { kind = ({ workspaces: "workspace", relationships: "relationship", programs: "program", "workout-sessions": "session" } as Record<string, string>)[path[0]]; id = uuid(path[1]); }
    else if (path.length === 3 && path[0] === "relationships" && path[2] === "messages") { kind = "messages"; id = uuid(path[1]); }
    else throw new HttpError(404, "NOT_FOUND", "Unknown resource.");
    const before = request.nextUrl.searchParams.get("before");
    let result = await rpc("gymaf_query", { p_kind: kind, p_id: id, p_before: before ? uuid(before) : null }, token);
    if (kind === "bootstrap") { const data=result as {user:Record<string,unknown>}; result={...data,user:{...data.user,interests:await rpc('gymaf_interests_query',{},token)}}; }
    if (kind === "export") result = { ...(result as Record<string, unknown>), billing: await rpc('gymaf_billing_query',{},token), attachments: await rpc('gymaf_attachment_query',{},token), friends: await rpc('gymaf_social_query',{},token), appointments: await rpc('gymaf_booking_query',{},token), coachDirectoryProfiles: await rpc('gymaf_directory_export',{},token), coachRatings: await rpc('gymaf_coach_rating_query',{p_id:null},token), profileInterests: await rpc('gymaf_interests_query',{},token), memberRecords: await rpc("gymaf_member_query", {}, token), workoutFavorites: await rpc("gymaf_training_query", { p_kind: "export-favorites", p_id: null }, token), sessionFeedback: await rpc("gymaf_feedback_query", { p_id: null }, token), media: await rpc('gymaf_media_query',{},token) };
    const response = success(result);
    if (kind === "export") response.headers.set("Content-Disposition", "attachment; filename=gymaf-export.json");
    return response;
  } catch (error) { return failure(error); }
}
export async function POST(request: NextRequest, context: Context) {
  try {
    const path = (await context.params).path;
    if(path.join('/')==='billing/webhook')return await stripeWebhook(request);
    if (path.length === 2 && path[0] === "auth") return await authPost(request, path[1]);
    const selecting=path.length===4 && path[0]==='me' && path[1]==='media' && path[3]==='selection';
    const billing=path[0]==='billing'&&['checkout','portal','refresh','configure','guest-preview'].includes(path[1]);
    if (!billing && !selecting && path.join('/') !== 'me/attachments' && path.join('/') !== 'me/friends/invitation' && path.join("/") !== "commands" && path.join('/') !== 'me/media') throw new HttpError(404, "NOT_FOUND", "Unknown command endpoint.");
    // Browser cookie writes require exact origin; bearer-only native requests do not use cookies.
    if (!request.headers.has("authorization")) sameOrigin(request);
    else if (request.headers.has("origin")) sameOrigin(request);
    const token = accessToken(request); await verifiedUser(token);
    if(billing){const body=await readBody(request);if(path[1]==='checkout')return await checkout(token,body);if(path[1]==='configure')return await configureBilling(token,body);if(path[1]==='portal'||path[1]==='refresh')return await billingPortal(token,body,path[1]==='refresh');if(Object.keys(body).some(k=>k!=='token')||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))throw new HttpError(422,'INVALID_PASS','Invalid guest pass.');return success(await rpc('gymaf_billing_query',{p_guest_token:body.token},token));}
    if(path.join('/')==='me/attachments')return await uploadAttachment(request,token);
    if(path.join('/')==='me/friends/invitation'){const body=await readBody(request);if(Object.keys(body).some(key=>key!=='token')||typeof body.token!=='string'||!/^[a-f0-9]{64}$/.test(body.token))throw new HttpError(422,'INVALID_INVITATION','Invalid invitation.');return success(await rpc('gymaf_social_query',{p_token:body.token},token));}
    if (path.join('/') === 'me/media') return await uploadMedia(request,token);
    if (selecting) {const body=await readBody(request);if(Object.keys(body).some(key=>key!=='commandId'))throw new HttpError(422,'INVALID_SELECTION','Invalid photo selection.');return success(await rpc('gymaf_media_command',{p_action:'media.select',p_command_id:uuid(body.commandId),p:{id:uuid(path[2])}},token));}
    const command = validateCommand(await readBody(request));
    return success(await rpc(command.action.startsWith("guest.") ? "gymaf_billing_command" : command.action.startsWith("attachment.") ? "gymaf_attachment_command" : command.action.startsWith("social.") ? "gymaf_social_command" : command.action.startsWith("booking.") ? "gymaf_booking_command" : command.action === "directory.save" ? "gymaf_directory_command" : command.action === "coach-rating.save" ? "gymaf_coach_rating_command" : command.action.startsWith("feedback.") ? "gymaf_feedback_command" : command.action.startsWith("member.") ? "gymaf_member_command" : command.action.startsWith("training.") ? "gymaf_training_command" : "gymaf_command", { p_action: command.action, p_command_id: command.commandId, p: command.payload }, token));
  } catch (error) { return failure(error); }
}

export async function DELETE(request:NextRequest,context:Context){
  try{
    const path=(await context.params).path;
    if(path.length===2&&path[0]==='attachments'){
      if(!request.headers.has('authorization')||request.headers.has('origin'))sameOrigin(request);
      const token=accessToken(request);await verifiedUser(token);return await deleteAttachment(token,uuid(path[1]));
    }
    if(path.length!==3||path[0]!=='me'||path[1]!=='media')throw new HttpError(404,'NOT_FOUND','Unknown photo.');
    if(!request.headers.has('authorization')||request.headers.has('origin'))sameOrigin(request);
    const token=accessToken(request);await verifiedUser(token);
    return await deleteMedia(token,uuid(path[2]));
  }catch(error){return failure(error);}
}
