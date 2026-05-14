import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getUser } from './util/serverAuthHelper'

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  const token = await getUser()
  if (!token && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }
  if (!token) {
    return NextResponse.redirect(new URL('/auth/signup', request.url))
  }

  if (token && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}