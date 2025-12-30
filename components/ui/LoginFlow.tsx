"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiChevronRight } from "react-icons/fi";
import SignInOAuthButton from "./signInOAuthButton";

type College = "KL_UNIVERSITY" | "OTHER" | "";

const LoginFlow = () => {
  const [step, setStep] = useState(1);
  const [selectedCollege, setSelectedCollege] = useState<College>("");

  const handleCollegeSelect = (college: College) => {
    setSelectedCollege(college);
    setStep(2);
  };

  const pageVariants = {
    initial: { opacity: 0, x: 100 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -100 },
  };

  return (
    <div className="w-full max-w-md">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">
                Welcome Back
              </h1>
              <p className="text-zinc-400">
                Select your institution to sign in
              </p>
            </div>

            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("KL_UNIVERSITY")}
                className="w-full p-6 rounded-xl border-2 border-orange-500 bg-orange-500/10 hover:bg-orange-500/20 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-white block">
                      KL University
                    </span>
                    <p className="text-sm text-orange-300 mt-1">
                      Sign in with Microsoft
                    </p>
                  </div>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </div>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleCollegeSelect("OTHER")}
                className="w-full p-6 rounded-xl border-2 border-zinc-700 bg-zinc-800/50 hover:bg-zinc-800 transition-all text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-semibold text-white block">
                      Other College
                    </span>
                    <p className="text-sm text-zinc-400 mt-1">
                      Sign in with Google
                    </p>
                  </div>
                  <FiChevronRight className="text-zinc-400 text-xl" />
                </div>
              </motion.button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.3 }}
          >
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">Sign In</h1>
              <p className="text-zinc-400">
                {selectedCollege === "KL_UNIVERSITY"
                  ? "KL University - Sign in with Microsoft"
                  : "Other College - Sign in with Google"}
              </p>
            </div>

            {selectedCollege === "KL_UNIVERSITY" && (
              <div className="space-y-6">
                <div className="  rounded-lg p-4">
                  <p className="text-red-500 text-center text-sm font-medium">
                    Important: KL University students must sign in with their
                    official college email ID (@kluniversity.in)
                  </p>
                </div>
                <SignInOAuthButton provider="microsoft" />
              </div>
            )}

            {selectedCollege === "OTHER" && (
              <div className="space-y-6">
                <SignInOAuthButton provider="google" />
              </div>
            )}

            <button
              onClick={() => setStep(1)}
              className="w-full mt-6 px-6 py-3 bg-zinc-800 text-white rounded-lg hover:bg-zinc-700 transition-all font-medium"
            >
              ← Back to College Selection
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginFlow;
