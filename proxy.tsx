import { NextRequest, NextResponse } from 'next/server';
import getProfile from './app/serverAction/getUser';

export type Access = {
  habit_tracker: boolean;
  budget_tracker: boolean;
}

// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  const res = await getProfile()
  let user = null
  if (res.success) {
    user = res.data
  }
  if (!user && request.nextUrl.pathname.startsWith('/auth')) {
    return NextResponse.next()
  }
  if (!user) {
    return NextResponse.redirect(new URL('/auth/signup', request.url))
  }

  const access = user.access as Access

  if (access.habit_tracker && access.budget_tracker) {
    return NextResponse.redirect(new URL('/combined-tracker', request.url))
  }

  if (access.habit_tracker) {
    return NextResponse.redirect(new URL('/habit-tracker', request.url))
  }

  if (access.budget_tracker) {
    return NextResponse.redirect(new URL('/budget-tracker', request.url))
  }

  return NextResponse.redirect(new URL("/landing?email=" + encodeURIComponent(user.email), request.url))
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}