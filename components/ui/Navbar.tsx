"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoClose } from "react-icons/io5";
import { Skiper58 } from "./skiper-ui/skiper58";
import { useSession } from "@/lib/auth-client";
import { FiUser } from "react-icons/fi";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: session } = useSession();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMenuOpen]);

  return (
    <>
      {/* Header */}
      <header className="text-white relative z-50">
        <nav className="fixed flex justify-between items-center top-0 left-0 right-0 z-50 px-6 py-4  ">
          {/* Logo */}
          <Link
            href="/"
            className="flex justify-center items-center overflow-hidden gap-2 group"
            onClick={closeMenu}
          >
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.9 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              <Image
                src="/images/surabhi_white_logo.png"
                alt="surabhi"
                width={100}
                height={100}
                loading="eager"
                className="object-contain scale-150 "
                style={{ width: "auto", height: "auto" }}
              />
            </motion.div>
          </Link>

          {/* User Info and Menu Button */}
          <div className="flex items-center gap-4">
            {/* User Info - Only show when logged in */}
            {session?.user && (
              <Link href="/profile" onClick={closeMenu}>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg transition-all cursor-pointer border border-white/10"
                >
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                    <FiUser className="text-white" size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-white text-sm font-medium leading-tight">
                      {session.user.name}
                    </p>
                    <p className="text-zinc-400 text-xs leading-tight">
                      View Profile
                    </p>
                  </div>
                </motion.div>
              </Link>
            )}

            {/* Menu Button */}
            <motion.button
              onClick={toggleMenu}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                animate={{ rotate: isMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.3 }}
              >
                <GiHamburgerMenu size={24} />
              </motion.div>
            </motion.button>
          </div>
        </nav>
      </header>

      {/* Full Screen Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop with improved animation */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={closeMenu}
            />

            {/* Sliding Menu Panel */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 120,
                mass: 0.8,
              }}
              className="fixed inset-0 w-full h-full bg-black z-50 flex flex-col overflow-hidden"
            >
              {/* Animated background gradient */}
              <motion.div
                className="absolute inset-0 opacity-20"
                animate={{
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)",
                  ],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />

              {/* Menu Header */}
              <div className="flex items-center justify-between pt-8 lg:p-12 relative z-10">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  className="flex items-center  gap-4"
                ></motion.div>

                <motion.button
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
                  onClick={closeMenu}
                  className="p-3 hover:bg-white/10 rounded-full transition-all duration-300 "
                  aria-label="Close menu"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <IoClose size={28} className="text-white" />
                </motion.button>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  delay: 0.2,
                  duration: 0.4,
                  type: "spring",
                  stiffness: 100,
                }}
                className=" p-7 flex items-center justify-start relative z-10 "
              >
                <div className="w-full max-w-3xl">
                  <Skiper58 onItemClick={closeMenu} />
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
