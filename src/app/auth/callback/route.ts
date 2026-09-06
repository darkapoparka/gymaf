import type { NextRequest } from "next/server";
import { completeEmailLink } from "@/server/gymaf/email-link";

export const runtime = "nodejs";
export async function GET(request: NextRequest) { return completeEmailLink(request); }
