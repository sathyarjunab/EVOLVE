import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { getUser } from './app/util/serverAuthHelper'
 
// This function can be marked `async` if using `await` inside
export async function proxy(request: NextRequest) {
  const token = await getUser()
  if(!token && request.nextUrl.pathname.startsWith('/auth')){
    return NextResponse.next()
  }
  console.log(request.nextUrl.pathname,">>>>>>>>>>>>>>")
  if(!token){
    return NextResponse.redirect(new URL('/auth/signup', request.url))
  }
}
 
export const config = {
  matcher: '/:path*',
}