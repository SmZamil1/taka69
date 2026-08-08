import { NextResponse } from "next/server";
import { AuthError } from "./auth";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status });
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) return fail(e.message, e.status);
  const msg = e instanceof Error ? e.message : "Server error";
  if (msg === "Insufficient balance") return fail(msg, 400);
  console.error(e);
  return fail(msg, 500);
}
