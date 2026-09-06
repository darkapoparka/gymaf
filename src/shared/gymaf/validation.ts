import type { Command, ProgramPlan, PlanSet } from "./contracts";
export const shirtSizes=['XS','S','M','L','XL','XXL'] as const;
export const usStates=['AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'] as const;
export const coachExpertise = [
  "Sports Performance",
  "General Strength Training",
  "Nutrition",
  "Bodybuilding",
  "Weight Loss",
  "Adaptive Exercise",
  "Orthopedic Limitations",
  "Injury Prevention",
  "Tactical Performance",
  "Sports Psychology",
  "Olympic Weightlifting",
  "Powerlifting",
  "Running",
  "Kettlebells",
  "Prenatal and Postpartum",
  "Hiking",
  "Crossfit",
  "Combat Sports",
  "Triathlon",
  "Metabolic Syndromes and Heart Conditions",
  "Yoga",
  "Cycling",
  "Swimming",
  "Gymnastics",
  "Rowing",
  "Pilates and Barre",
  "Dance",
  "Obstacle Races",
];
export const coachStyles=['Detail Oriented','Even Keeled','High Energy','Laid Back','Motivating','Results Oriented','Supportive'];
export const coachSports=['Basketball','Football','Soccer','Baseball','Group Fitness and Bootcamps','Running','Cycling','Swimming','Tennis','Hiking'];
export const coachLanguages=['English','Bulgarian','Spanish','French','German','Italian','Portuguese'];
export const flagReasons = ['Dislike', 'Too Hard', 'Too Easy', 'Injured', 'Mix It Up', 'Traveling', 'Equipment Busy', 'Uncomfortable', 'Missing Equipment'] as const;

export class InputError extends Error { constructor(message: string) { super(message); this.name = "InputError"; } }
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new InputError("Expected an object.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, label: string, max = 2000, min = 0): string {
  if (typeof value !== "string") throw new InputError(`${label} must be text.`);
  const result = value.trim();
  if (result.length < min || result.length > max) throw new InputError(`${label} must contain ${min}–${max} characters.`);
  return result;
}
export function uuid(value: unknown): string {
  const result = text(value, "ID", 36, 36);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result)) throw new InputError("Invalid ID.");
  return result;
}
export function integer(value: unknown, label: string, min: number, max: number): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) throw new InputError(`${label} must be an integer between ${min} and ${max}.`);
  return value;
}
export function decimal(value: unknown, label: string, max: number): number | null {
  if (value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > max) throw new InputError(`Invalid ${label}.`);
  return value;
}
export function dateOnly(value: unknown): string {
  const result = text(value, "Date", 10, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result)) throw new InputError("Use YYYY-MM-DD.");
  const parsed = new Date(result + "T00:00:00Z");
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== result) throw new InputError("Invalid calendar date.");
  return result;
}
export function instant(value: unknown): string {
  const result = text(value, "Timestamp", 40, 20);
  if (!/^\d{4}-\d{2}-\d{2}T.*(?:Z|[+-]\d{2}:\d{2})$/.test(result) || !Number.isFinite(Date.parse(result))) throw new InputError("A timestamp with timezone is required.");
  return new Date(result).toISOString();
}
export function email(value: unknown): string {
  const result = text(value, "Email", 254, 3).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) throw new InputError("Enter a valid email address.");
  return result;
}
function oneOf(value: unknown, options: readonly string[]): string {
  if (typeof value !== "string" || !options.includes(value)) throw new InputError("Invalid selection.");
  return value;
}
function boolean(value: unknown): boolean { if (typeof value !== "boolean") throw new InputError("Expected true or false."); return value; }
function keys(value: Record<string, unknown>, allowed: string[]) {
  if (Object.keys(value).some(key => !allowed.includes(key))) throw new InputError("Unexpected field.");
}
function list(value: unknown, label: string, max: number): unknown[] {
  if (!Array.isArray(value) || !value.length || value.length > max) throw new InputError(`${label} requires 1–${max} entries.`);
  return value;
}
export function validatePlan(value: unknown): ProgramPlan {
  const p = object(value); keys(p, ["workouts"]); const ids = new Set<string>();
  function newId(value: unknown) { const id = uuid(value); if (ids.has(id)) throw new InputError("Plan IDs must be unique."); ids.add(id); return id; }
  return { workouts: list(p.workouts, "Workouts", 56).map(raw => {
    const w = object(raw); keys(w, ["id", "title", "dayOffset", "exercises"]);
    return { id: newId(w.id), title: text(w.title, "Workout title", 120, 1), dayOffset: integer(w.dayOffset, "Day offset", 0, 365), exercises: list(w.exercises, "Exercises", 30).map(rawExercise => {
      const e = object(rawExercise); keys(e, ["id", "name", "instructions", "sets"]);
      return { id: newId(e.id), name: text(e.name, "Exercise", 120, 1), instructions: text(e.instructions, "Instructions", 2000), sets: list(e.sets, "Sets", 20).map(rawSet => {
        const s = object(rawSet); keys(s, ["reps", "loadKg", "durationSeconds", "distanceM", "restSeconds"]);
        const set: PlanSet = { reps: s.reps === null ? null : integer(s.reps, "Repetitions", 1, 1000), loadKg: decimal(s.loadKg, "load", 1000), durationSeconds: decimal(s.durationSeconds, "duration", 86400), distanceM: decimal(s.distanceM, "distance", 1000000), restSeconds: integer(s.restSeconds, "Rest", 0, 3600) };
        if (!set.reps && !set.durationSeconds && !set.distanceM) throw new InputError("Set a repetition, duration or distance target.");
        return set;
      }) };
    }) };
  }) };
}
export function validateCommand(value: unknown): Command {
  const c = object(value); keys(c, ["action", "commandId", "payload"]);
  const action = text(c.action, "Action", 50, 1), commandId = uuid(c.commandId), p = object(c.payload);
  let payload: Record<string, unknown>;
  const id = (name: string) => uuid(p[name]);
  const revision = () => integer(p.revision, "Revision", 0, 2147483646);
  switch (action) {
    case "guest.create": { keys(p,['relationshipId','token']);const token=text(p.token,'Guest pass',64,64);if(!/^[a-f0-9]{64}$/.test(token))throw new InputError('Invalid guest pass.');payload={relationshipId:id('relationshipId'),token};break; }
    case "guest.replace-link": { keys(p,['id','token']);const token=text(p.token,'Guest pass',64,64);if(!/^[a-f0-9]{64}$/.test(token))throw new InputError('Invalid guest pass.');payload={id:id('id'),token};break; }
    case "guest.accept": { keys(p,['token']);const token=text(p.token,'Guest pass',64,64);if(!/^[a-f0-9]{64}$/.test(token))throw new InputError('Invalid guest pass.');payload={token};break; }
    case "guest.revoke": keys(p,['id']);payload={id:id('id')};break;
    case "attachment.share": keys(p,['id']);payload={id:id('id')};break;
    case "social.invite": case "social.accept": case "social.revoke": {
      keys(p,['token']); const token=text(p.token,'Invitation',64,64); if(!/^[a-f0-9]{64}$/.test(token))throw new InputError('Invalid invitation.'); payload={token};break;
    }
    case "social.revoke-id": case "social.remove": keys(p,['id']);payload={id:id('id')};break;
    case "booking.slot-create": {
      keys(p,['workspaceId','startsAt','endsAt','cancelMinutes']);
      const instant=(value:unknown)=>{const valueText=text(value,'Time',40,1);if(!/(Z|[+-]\d{2}:\d{2})$/.test(valueText)||!Number.isFinite(Date.parse(valueText)))throw new InputError('Choose a valid time with a timezone.');return new Date(valueText).toISOString();};
      const startsAt=instant(p.startsAt),endsAt=instant(p.endsAt),duration=Date.parse(endsAt)-Date.parse(startsAt);
      if(duration<=0||duration>14400000)throw new InputError('Appointment duration must be between one minute and four hours.');
      payload={workspaceId:id('workspaceId'),startsAt,endsAt,cancelMinutes:integer(p.cancelMinutes,'Cancellation notice',0,10080)};break;
    }
    case "booking.reserve": case "booking.withdraw": case "booking.cancel": keys(p,['id']);payload={id:id('id')};break;
    case "directory.save": {
      keys(p,['workspaceId','revision','data']);const d=object(p.data);keys(d,['listed','expertise','styles','sports','languages','experience','qualifications','loves','location']);
      const tags=(value:unknown,choices:string[])=>{if(!Array.isArray(value)||value.length>choices.length)throw new InputError('Invalid choices.');const selected=value.map(item=>oneOf(item,choices));if(new Set(selected).size!==selected.length)throw new InputError('Duplicate choice.');return selected;};
      payload={workspaceId:id('workspaceId'),revision:revision(),data:{listed:boolean(d.listed),expertise:tags(d.expertise,coachExpertise),styles:tags(d.styles,coachStyles),sports:tags(d.sports,coachSports),languages:tags(d.languages,coachLanguages),experience:text(d.experience,'Experience',500),qualifications:text(d.qualifications,'Qualifications',1000),loves:text(d.loves,'Interests',500),location:text(d.location,'Location',120)}};break;
    }
    case "coach-rating.save": keys(p,["relationshipId","revision","rating"]);payload={relationshipId:id("relationshipId"),revision:revision(),rating:integer(p.rating,"Rating",1,5)};break;
    case "feedback.submit": keys(p, ["sessionId", "revision"]); payload = { sessionId: id("sessionId"), revision: revision() }; break;
    case "feedback.save": {
      keys(p, ["sessionId", "revision", "data"]);
      const d = object(p.data); keys(d, ["rating", "difficulty", "body", "flags"]);
      if (!Array.isArray(d.flags) || d.flags.length > 30) throw new InputError("Invalid flags.");
      const seen = new Set<string>();
      const flags = d.flags.map(raw => {
        const f = object(raw); keys(f, ["exerciseId", "reasons", "comment"]);
        const exerciseId = uuid(f.exerciseId), reasons = list(f.reasons, "Reasons", 9).map(v => oneOf(v, flagReasons));
        if (seen.has(exerciseId) || new Set(reasons).size !== reasons.length) throw new InputError("Duplicate flag or reason.");
        seen.add(exerciseId); return { exerciseId, reasons, comment: text(f.comment, "Flag comment", 1000) };
      });
      payload = { sessionId: id("sessionId"), revision: revision(), data: { rating: d.rating === null ? null : integer(d.rating, "Rating", 1, 5), difficulty: d.difficulty === null ? null : integer(d.difficulty, "Difficulty", 1, 5), body: text(d.body, "Feedback", 2000), flags } }; break;
    }
    case "training.favorite": keys(p, ["scheduledId", "favorite", "revision"]); payload = { scheduledId: id("scheduledId"), favorite: boolean(p.favorite), revision: revision() }; break;
    case "member.save": {
      keys(p, ["id", "kind", "data", "revision"]);
      const kind = oneOf(p.kind, ["preferences", "location", "injury", "event", "weight", "weight-target", "account", "shipping"]);
      const d = object(p.data); let data: Record<string, unknown>;
      const strings = (v: unknown, max: number) => {
        if (!Array.isArray(v) || v.length > max) throw new InputError("Invalid list.");
        const items = v.map(x => text(x, "Item", 120, 1));
        if (new Set(items).size !== items.length) throw new InputError("Duplicate list entry.");
        return items;
      };
      if (kind === "shipping") {
        keys(d,['street','apartment','city','region','postalCode','country','shirtSize']);
        const country=text(d.country,'Country',80,2),region=text(d.region,'Region',120),postalCode=text(d.postalCode,'Postal code',20);
        if(['united states','united states of america','us','usa'].includes(country.toLowerCase())){oneOf(region,usStates);if(!/^\d{5}(-\d{4})?$/.test(postalCode))throw new InputError('Enter a five-digit US ZIP code, optionally followed by four extra digits.');}
        data={street:text(d.street,'Street address',200,1),apartment:text(d.apartment,'Apartment',120),city:text(d.city,'City',120,1),region,postalCode,country,shirtSize:oneOf(d.shirtSize,shirtSizes)};
      } else if (kind === "account") {
        keys(d, ["preferredName", "firstName", "lastName", "biologicalSex", "dateOfBirth", "heightCm", "phone"]);
        const birth = text(d.dateOfBirth, "Date of birth", 10);
        if (birth && (dateOnly(birth) > new Date().toISOString().slice(0,10) || birth < "1900-01-01")) throw new InputError("Enter a valid date of birth.");
        const height = text(d.heightCm, "Height", 6);
        if (height && (!/^\d+(\.\d)?$/.test(height) || Number(height)<50 || Number(height)>300)) throw new InputError("Height must be between 50 and 300 cm.");
        const phone = text(d.phone, "Phone number", 32);
        if (phone && !/^\+?[0-9 ()-]{5,32}$/.test(phone)) throw new InputError("Enter a valid contact phone number.");
        data = {preferredName:text(d.preferredName,"Preferred name",120),firstName:text(d.firstName,"First name",120),lastName:text(d.lastName,"Last name",120),biologicalSex:oneOf(d.biologicalSex,["","Female","Male","Intersex","Prefer not to say"]),dateOfBirth:birth,heightCm:height,phone};
      } else if (kind === "preferences") {
        keys(d, ["units", "privateProfile", "instructions", "tone", "countdown", "vibration"]);
        data = { units: oneOf(d.units, ["Metric", "Imperial"]), privateProfile: boolean(d.privateProfile), instructions: oneOf(d.instructions, ["Never", "Periodic", "Every Time"]), tone: oneOf(d.tone, ["Marimba", "Beep"]), countdown: boolean(d.countdown), vibration: boolean(d.vibration) };
      } else if (kind === "location") {
        keys(d, ["name", "type", "equipment"]);
        data = { name: text(d.name, "Location name", 120, 1), type: oneOf(d.type, ["Home", "Gym", "Outdoor", "Somewhere Else"]), equipment: strings(d.equipment, 100) };
      } else if (kind === "injury") {
        keys(d, ["description", "affectsMovement", "excluded"]);
        data = { description: text(d.description, "Injury description", 500, 1), affectsMovement: boolean(d.affectsMovement), excluded: strings(d.excluded, 60) };
      } else if (kind === "event") {
        keys(d, ["name", "type", "details", "startDate", "endDate", "training"]);
        const startDate = dateOnly(d.startDate), endDate = dateOnly(d.endDate);
        if (endDate < startDate) throw new InputError("End date must follow the start date.");
        data = { name: text(d.name, "Event name", 120, 1), type: oneOf(d.type, ["Travel", "Event"]), details: text(d.details, "Event details", 2000), startDate, endDate, training: oneOf(d.training, ["Normal", "Lighter", "No Workouts"]) };
      } else {
        keys(d, kind === "weight" ? ["date", "valueKg"] : ["valueKg"]);
        const valueKg = decimal(d.valueKg, "weight", 500);
        if (valueKg === null || valueKg < 20) throw new InputError("Weight must be between 20 and 500 kg.");
        data = { valueKg, ...(kind === "weight" ? { date: dateOnly(d.date) } : {}) };
      }
      payload = { id: id("id"), kind, revision: revision(), data }; break;
    }
    case "member.delete": keys(p, ["id", "kind", "revision"]); payload = { id: id("id"), kind: oneOf(p.kind, ["location", "injury", "event", "weight", "weight-target", "shipping"]), revision: revision() }; break;
    case "profile.save": {
      keys(p, ["displayName", "locale", "timezone", "goal", "equipment", "availability", "revision", "interests"]);
      let interests:string[]|undefined;
      if (p.interests !== undefined) {
        if (!Array.isArray(p.interests) || p.interests.length>20) throw new InputError("Choose up to 20 interests.");
        interests=p.interests.map(value=>text(value,"Interest",40,1));
        if(interests.some(value=>!/^[-\p{L}\p{N}_ ]+$/u.test(value)) || new Set(interests.map(value=>value.toLowerCase())).size!==interests.length) throw new InputError("Use unique interests with letters, numbers, spaces, dashes or underscores.");
      }
      const timezone = text(p.timezone, "Timezone", 80, 1);
      try { new Intl.DateTimeFormat("en", { timeZone: timezone }); } catch { throw new InputError("Invalid timezone."); }
      payload = { ...(interests === undefined ? {} : {interests}), displayName: text(p.displayName, "Name", 120, 1), locale: oneOf(p.locale, ["bg", "en"]), timezone, goal: text(p.goal, "Goal", 500), equipment: text(p.equipment, "Equipment", 1000), availability: text(p.availability, "Availability", 1000), revision: revision() }; break;
    }
    case "workspace.create": keys(p, ["name", "slug", "coachUserId"]); payload = { name: text(p.name, "Workspace", 120, 1), slug: text(p.slug, "Slug", 80, 3), coachUserId: id("coachUserId") }; if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(payload.slug))) throw new InputError("Use lowercase letters, numbers and hyphens for the slug."); break;
    case "workspace.publish": keys(p, ["workspaceId", "publicName", "bio", "published"]); payload = { workspaceId: id("workspaceId"), publicName: text(p.publicName, "Public name", 120, 1), bio: text(p.bio, "Biography", 2000), published: boolean(p.published) }; break;
    case "invitation.create": keys(p, ["workspaceId", "email", "token"]); payload = { workspaceId: id("workspaceId"), email: email(p.email), token: text(p.token, "Invitation token", 64, 64) }; if (!/^[a-f0-9]{64}$/.test(String(payload.token))) throw new InputError("Invalid invitation token."); break;
    case "invitation.accept": keys(p, ["token"]); payload = { token: text(p.token, "Invitation token", 64, 64) }; if (!/^[a-f0-9]{64}$/.test(String(payload.token))) throw new InputError("Invalid invitation token."); break;
    case "program.create": keys(p, ["workspaceId", "title", "plan"]); payload = { workspaceId: id("workspaceId"), title: text(p.title, "Program", 120, 1), plan: validatePlan(p.plan) }; break;
    case "program.save": keys(p, ["programId", "title", "plan", "revision"]); payload = { programId: id("programId"), title: text(p.title, "Program", 120, 1), plan: validatePlan(p.plan), revision: revision() }; break;
    case "program.publish": keys(p, ["programId", "revision"]); payload = { programId: id("programId"), revision: revision() }; break;
    case "program.assign": keys(p, ["versionId", "relationshipId", "startDate"]); payload = { versionId: id("versionId"), relationshipId: id("relationshipId"), startDate: dateOnly(p.startDate) }; break;
    case "schedule.move": keys(p, ["scheduledId", "date", "revision"]); payload = { scheduledId: id("scheduledId"), date: dateOnly(p.date), revision: revision() }; break;
    case "session.start": keys(p, ["scheduledId"]); payload = { scheduledId: id("scheduledId") }; break;
    case "session.save-set": keys(p, ["sessionId", "exerciseId", "setIndex", "revision", "actualReps", "loadKg", "durationSeconds", "distanceM", "skipped"]); payload = { sessionId: id("sessionId"), exerciseId: id("exerciseId"), setIndex: integer(p.setIndex, "Set", 0, 19), revision: revision(), actualReps: p.actualReps === null ? null : integer(p.actualReps, "Actual reps", 0, 1000), loadKg: decimal(p.loadKg, "load", 1000), durationSeconds: decimal(p.durationSeconds, "duration", 86400), distanceM: decimal(p.distanceM, "distance", 1000000), skipped: boolean(p.skipped) }; break;
    case "session.transition": keys(p, ["sessionId", "revision", "state"]); payload = { sessionId: id("sessionId"), revision: revision(), state: oneOf(p.state, ["in_progress", "paused", "completed", "abandoned"]) }; break;
    case "checkin.submit": keys(p, ["relationshipId", "weekStart", "difficulty", "body"]); payload = { relationshipId: id("relationshipId"), weekStart: dateOnly(p.weekStart), difficulty: integer(p.difficulty, "Difficulty", 1, 10), body: text(p.body, "Check-in", 2000) }; if (new Date(String(payload.weekStart) + "T00:00:00Z").getUTCDay() !== 1) throw new InputError("The check-in week starts on Monday."); break;
    case "checkin.review": keys(p, ["checkinId", "body"]); payload = { checkinId: id("checkinId"), body: text(p.body, "Feedback", 4000, 1) }; break;
    case "message.send": keys(p, ["relationshipId", "body"]); payload = { relationshipId: id("relationshipId"), body: text(p.body, "Message", 4000, 1) }; break;
    case "message.read": keys(p, ["relationshipId", "messageId"]); payload = { relationshipId: id("relationshipId"), messageId: id("messageId") }; break;
    case "entitlement.grant": keys(p, ["relationshipId", "startsAt", "endsAt", "source", "reason"]); payload = { relationshipId: id("relationshipId"), startsAt: instant(p.startsAt), endsAt: instant(p.endsAt), source: oneOf(p.source, ["complimentary", "manual"]), reason: text(p.reason, "Reason", 500, 1) }; if (String(payload.startsAt) >= String(payload.endsAt)) throw new InputError("End must be after start."); break;
    case "service.cancel": case "relationship.end": keys(p, ["relationshipId"]); payload = { relationshipId: id("relationshipId") }; break;
    case "request.create": keys(p, ["kind", "body"]); payload = { kind: oneOf(p.kind, ["support", "export", "deletion"]), body: text(p.body, "Request", 2000) }; break;
    case "request.resolve": keys(p, ["requestId", "state", "resolution"]); payload = { requestId: id("requestId"), state: oneOf(p.state, ["acknowledged", "closed"]), resolution: text(p.resolution, "Resolution", 2000, 1) }; break;
    case "notification.read": keys(p, ["notificationId"]); payload = { notificationId: id("notificationId") }; break;
    default: throw new InputError("Unknown command.");
  }
  return { action, commandId, payload };
}
export function localDate(timezone: string, now = new Date()): string { return new Intl.DateTimeFormat("en-CA", { timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now); }
export function monday(date: string): string { const d = new Date(dateOnly(date) + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); }
export function elapsedSeconds(session: { elapsed_seconds: number; running_since: string | null }, now = Date.now()): number { return Math.max(0, session.elapsed_seconds + (session.running_since ? Math.floor(Math.max(0, now - Date.parse(session.running_since)) / 1000) : 0)); }
