import { NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const parsedBody = loginSchema.safeParse(await request.json().catch(() => null));

  if (!parsedBody.success) {
    return NextResponse.json(
      { success: false, message: "Enter a valid email and password." },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsedBody.data);

  if (error) {
    return NextResponse.json(
      { success: false, message: "Login failed." },
      { status: 401 },
    );
  }

  return NextResponse.json({ success: true });
}
