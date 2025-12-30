"use server"

import { auth } from "@/lib/auth";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";




export async function signInAction(formdata:FormData){
   
    const email=formdata.get("email") as string;
    if(!email){
      
      return {error:"Email is required"};
    }
    const password=formdata.get("password") as string;
    if(!password){
      
      return {error:"Password is required"};
    }
    try {
        await auth.api.signInEmail({
            headers:await headers(),
            body:{
                email,  
                password
            },
        })
        return {error:null}
    } catch (error:any) {
        if(error instanceof APIError){
           return {error:error.message} 
        }
        return {error:error.message}
    }
}