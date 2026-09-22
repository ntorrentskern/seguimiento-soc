"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUser } from "@/db/users";
import { verifyPassword } from "@/lib/password";
import { readSession, sessionCookieName, sessionMaxAge, signSession } from "@/lib/session";

export async function login(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const user = username ? await findUser(username) : null;
  const valid = user ? verifyPassword(password, user.passwordHash) : false;

  if (!user || !valid) {
    redirect("/acceso?error=1");
  }

  const token = signSession(user.username);
  if (!token) redirect("/acceso?error=config");

  const jar = await cookies();
  jar.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionMaxAge(),
  });

  redirect(safeNext(formData.get("from")));
}

export async function logout() {
  const jar = await cookies();
  jar.delete(sessionCookieName());
  redirect("/acceso");
}

export async function currentSession() {
  const jar = await cookies();
  return readSession(jar.get(sessionCookieName())?.value);
}

function safeNext(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.startsWith("/acceso")) return "/";
  return value;
}
