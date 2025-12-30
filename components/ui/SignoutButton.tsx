"use client"
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/auth-client'
import { toast } from 'sonner'
import { useState } from 'react'

const SignoutButton = () => {
  const [loading,setLoading]=useState(false);
    const router = useRouter()
    async function signout(){
       await signOut({
        fetchOptions:{
            onRequest:()=>{
              setLoading(true);
            },
            onSuccess:()=>{
              setLoading(false);
              toast.success("User signed out successfully");
                router.push('/login')
            },
            onError:(ctx:any)=>{
              setLoading(false);
                toast.error(ctx.error.message)
            }

        }
       })
    }
  return (

    <button className=' p-5 bg-red-500 text-white cursor-pointer' onClick={signout} disabled={loading}>Signout</button>
  )
}

export default SignoutButton