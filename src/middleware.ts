import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  // Usamos una respuesta base donde se irán aplicando cookies de refresh
  const baseRes = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return req.cookies.get(name)?.value
        },
        set(name, value, options) {
          baseRes.cookies.set(name, value, options)
        },
        remove(name, options) {
          baseRes.cookies.delete(name)
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  const protectedRoutes = ['/dashboard', '/trips', '/expenses', '/budget', '/notes', '/planning', '/analytics', '/alerts']
  const authRoutes = [
    '/signin',
    '/signup',
    '/forgot-password',
    '/reset-password'
  ]
  const isProtectedRoute = protectedRoutes.some(route => req.nextUrl.pathname.startsWith(route))
  const isAuthRoute = authRoutes.some(route => req.nextUrl.pathname.startsWith(route))

  // Si necesitamos redirigir, creamos una nueva respuesta de redirect
  // y transferimos las cookies que se hayan seteado en baseRes (p.ej. refresh de sesión)
  const withTransferredCookies = (res: NextResponse) => {
    baseRes.cookies.getAll().forEach((cookie) => {
      res.cookies.set(cookie.name, cookie.value)
    })
    return res
  }

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/signin', req.url)
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
    const redirectRes = NextResponse.redirect(redirectUrl)
    return withTransferredCookies(redirectRes)
  }

  if (session && isAuthRoute) {
    const redirectTo = req.nextUrl.searchParams.get('redirectTo') || '/dashboard'
    // Asegurar que redirectTo es una ruta relativa válida
    const safePath = redirectTo.startsWith('/') ? redirectTo : '/dashboard'
    const redirectRes = NextResponse.redirect(new URL(safePath, req.url))
    return withTransferredCookies(redirectRes)
  }

  return baseRes
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}