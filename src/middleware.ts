import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/profil"];
const adminRoutes = ["/admin"];
const professorRoutes = ["/profesor"];

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Redirect to login if accessing protected route without auth
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  if (isProtected && !user) {
    return NextResponse.redirect(new URL("/prijava", request.url));
  }

  // Check admin access
  const isAdmin = adminRoutes.some((route) => path.startsWith(route));
  if (isAdmin) {
    if (!user) {
      return NextResponse.redirect(new URL("/prijava", request.url));
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Check professor access
  const isProfessorRoute = professorRoutes.some((route) => path.startsWith(route));
  if (isProfessorRoute) {
    if (!user) {
      return NextResponse.redirect(new URL("/prijava", request.url));
    }
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "professor" && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect professors from /dashboard to /profesor
  if (path.startsWith("/dashboard") && user) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "professor") {
      return NextResponse.redirect(new URL("/profesor", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/profil/:path*", "/admin/:path*", "/profesor/:path*"],
};
