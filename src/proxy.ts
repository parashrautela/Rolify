import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { safeNextPath } from '@/lib/redirect'

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const isAuthPage = req.nextUrl.pathname.startsWith("/auth")

  if (!session && !isAuthPage) {
    const authUrl = new URL("/auth", req.url)
    // Come back here after sign-in, e.g. a resume print link opened from the extension
    if (req.nextUrl.pathname !== "/") {
      authUrl.searchParams.set("next", req.nextUrl.pathname + req.nextUrl.search)
    }
    return NextResponse.redirect(authUrl)
  }

  if (session && isAuthPage) {
    const next = safeNextPath(req.nextUrl.searchParams.get("next"))
    return NextResponse.redirect(new URL(next ?? "/dashboard", req.url))
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
