"use client"

import { useSession } from "@/lib/auth-client"

const GetStartedButton = () => {
  const {data:session,isPending}=useSession();
  return (
    <div className="text-white">
      {isPending && <p>Loading...</p>}

      {!session && <button className="bg-orange-500 p-2 rounded-lg">Get Started</button>}
      {session && <button> welcome {session.user.name} {session.user.role}</button>}
    </div>
  )
}

export default GetStartedButton