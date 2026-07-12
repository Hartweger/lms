import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const admin = auth.admin;
  const { data } = await admin.from("courses").select("id, slug, title, category").order("slug");
  return NextResponse.json({ courses: data || [] });
}
