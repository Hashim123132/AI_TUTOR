import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import {
  isSupabaseConfigured,
  supabaseAnonKey,
  supabaseUrl,
} from "@/lib/supabase/config"

const PUBLIC_PATHS = ["/", "/login", "/signup", "/auth/callback"]
const AUTH_PAGE_PATHS = ["/login", "/signup"]

function pathMatches(pathname: string, paths: string[]): boolean {
  return paths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  )
}

function isPublicPath(pathname: string): boolean {
  return pathMatches(pathname, PUBLIC_PATHS)
}

function isAuthPagePath(pathname: string): boolean {
  return pathMatches(pathname, AUTH_PAGE_PATHS)
}

function redirectWithCookies(
  request: NextRequest,
  refreshed: NextResponse,
  url: URL
): NextResponse {
  const redirect = NextResponse.redirect(url)
  refreshed.cookies.getAll().forEach((cookie) => {
    redirect.cookies.set(cookie)
  })
  return redirect
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next({ request })

  if (!isSupabaseConfigured) {
    if (!isPublicPath(pathname)) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.search = ""
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value)
        })
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone()
    url.pathname = "/login"
    url.search = ""
    return redirectWithCookies(request, response, url)
  }

  if (user && (pathname === "/" || isAuthPagePath(pathname))) {
    const url = request.nextUrl.clone()
    url.pathname = "/dashboard"
    url.search = ""
    return redirectWithCookies(request, response, url)
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
}
