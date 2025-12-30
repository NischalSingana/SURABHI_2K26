"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FiUser, FiMail, FiLock } from "react-icons/fi";
import { signUp } from "@/lib/auth-client";
import { signupAction } from "@/actions/signup-action";

const RegisterForm = () => {
  

  const router=useRouter();
  const [loading,setLoading]=useState(false);
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formdata=new FormData(e.currentTarget);

    const {error}= await signupAction(formdata);
    
    if(error){
      setLoading(false);
      toast.error(error);
      return;
    }
    else{
    setLoading(false);
       toast.success("User registered successfully");
       router.push("/profile");
    }
    
   
  };

  return (
    <div className="w-full max-w-md mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-linear-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
      >
    
        <div className="bg-linear-to-r from-orange-600 to-orange-500 p-6">
          <h2 className="text-3xl font-bold text-white mb-2">
            Register for Surabhi 2025
          </h2>
          <p className="text-orange-100">
            Join us for the biggest cultural fest
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="email"
                id="email"
                name="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="your.email@example.com"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password *
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="password"
                id="password"
                name="password"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                placeholder="Create a strong password"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              Minimum 8 characters
            </p>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full px-8 py-3 bg-linear-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
           
            Create Account
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
};

export default RegisterForm;