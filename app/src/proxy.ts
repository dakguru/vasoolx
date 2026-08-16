import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const res = NextResponse.next();

  // Skip auth check in demo mode (no env vars configured)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return res;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !request.nextUrl.pathname.startsWith("/login") && !request.nextUrl.pathname.startsWith("/signup")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api).*)",
  ],
};
