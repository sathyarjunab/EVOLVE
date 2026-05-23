import { NextRequest, NextResponse } from "next/server";
import getProfile from "./app/serverAction/getUser";

export type Access = {
  habit_tracker: boolean;
  budget_tracker: boolean;
};

export async function proxy(request: NextRequest) {
  const res = await getProfile();

  let user = null;

  if (res.success) {
    user = res.data;
  }

  const pathname = request.nextUrl.pathname;

  // Allow auth pages for unauthenticated users
  if (!user && pathname.startsWith("/auth")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users
  if (!user) {
    return NextResponse.redirect(new URL("/auth/signup", request.url));
  }

  const access = user.access as Access;
  // Decide target route
  let target = "/landing";

  if (access.habit_tracker && access.budget_tracker) {
    target = "/combined-tracker";
  } else if (access.habit_tracker) {
    target = "/habitTracker";
  } else if (access.budget_tracker) {
    target = "/budget-tracker";
  }

  // Prevent infinite redirect loop
  if (pathname !== target) {
    return NextResponse.redirect(new URL(target, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|redirector|.*\\..*).*)"],
};
