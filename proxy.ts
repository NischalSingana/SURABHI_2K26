import { NextRequest, NextResponse } from "next/server";

import {getSessionCookie} from "better-auth/cookies"

const protectedRoutes=["/profile","/admin/dashboard"]
const authRoutes=["/login", "/signup"]

export async function proxy(req:NextRequest){
    const {nextUrl}=req;
    const sessionCookie =getSessionCookie(req)
    const res=NextResponse.next()

    const isLoggedIn=!!sessionCookie

    const isOnProtectedRoute=protectedRoutes.includes(nextUrl.pathname)
    const isOnAuthRoute=authRoutes.includes(nextUrl.pathname)

    // If logged in and trying to access auth pages, redirect to profile
    if(isLoggedIn && isOnAuthRoute){
        return NextResponse.redirect(new URL("/profile",nextUrl))
    }

    // If not logged in and trying to access protected route, redirect to login
    if(!isLoggedIn && isOnProtectedRoute){
        return NextResponse.redirect(new URL("/login",nextUrl))
    }
   
    return res
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
    
