"use server"

import { auth, ErrorCode } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";




export async function signupAction(formdata:FormData){
    const name=formdata.get("name") as string;
    if(!name){
      
      return {error:"Name is required"};
    }
    const email=formdata.get("email") as string;
    if(!email){
      
      return {error:"Email is required"};
    }
    const password=formdata.get("password") as string;
    if(!password){
      
      return {error:"Password is required"};
    }
    try {
        await auth.api.signUpEmail({
            headers:await headers(),
            body:{
                name,
                email,
                password,
               
            },
        })
        return {error:null}
    } catch (error) {
       if(error instanceof APIError){
        const errCode=error.body?(error.body.code as ErrorCode):"UNKNOWN"
        switch(errCode){
            default:
                return {error:error.message}
        }
       }
       return {error:"An unexpected error occurred"}
    }
}