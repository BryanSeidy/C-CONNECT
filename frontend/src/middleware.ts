import { NextRequest, NextResponse } from 'next/server';

/**
 * Edge middleware — protection RBAC des routes dashboard.
 *
 * Les routes publiques n'ont pas de check cookie (marketplace, landing).
 * Les routes /dashboard/* nécessitent un user caché en localStorage →
 * impossible depuis l'edge ; on délègue la vérification au layout React.
 * Ce middleware gère uniquement :
 *   1. La redirection des routes /dashboard vers /login si AUCUN cookie de
 *      session Sanctum n'est présent (fast-fail côté serveur).
 *   2. La redirection /login et /register vers /dashboard si déjà connecté.
 *
 * La granularité par rôle (seller/buyer/admin) est gérée dans les layouts
 * React via useAuth() car le cookie httpOnly n'expose pas le rôle.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Indicateurs de session — Sanctum pose ces cookies sur le domaine
  const hasSession =
    request.cookies.has('laravel_session') ||
    request.cookies.has('XSRF-TOKEN');

  // Bloquer l'accès au dashboard sans session
  if (pathname.startsWith('/dashboard')) {
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Éviter les pages auth si déjà connecté
  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/login',
    '/register',
  ],
};
