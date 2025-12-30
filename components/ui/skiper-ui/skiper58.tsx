"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import React from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

import { cn } from "@/lib/utils";
import { navigationItems } from "@/lib/constants";

interface Skiper58Props {
  onItemClick?: () => void;
}

export const Skiper58 = ({ onItemClick }: Skiper58Props) => {
  const { data: session } = useSession();
  const router = useRouter();

  // Filter navigation items based on session
  const filteredItems = navigationItems.filter((item) => {
    if (session?.user) {
      // Hide Register and Login if user is logged in
      return item.name !== "Register" && item.name !== "Login";
    }
    return true;
  });

  // Add Profile link if user is logged in
  const items = session?.user
    ? [
        ...filteredItems,
        {
          name: "Profile",
          href: "/profile",
          description: "[6]",
        },
      ]
    : filteredItems;

  const handleLogout = async () => {
    await signOut();
    // Clear any registration-related localStorage data
    localStorage.removeItem("selectedCollege");
    localStorage.removeItem("selectedCollegeName");
    if (onItemClick) onItemClick();
    router.push("/");
  };

  return (
    <ul className="flex min-h-full w-full flex-1 flex-col items-center justify-center gap-4 lg:gap-6 xl:gap-8">
      {items.map((item, index) => {
        // Check if this is Register or Login for special red styling
        const isSpecialItem = item.name === "Register" || item.name === "Login";
        const isProfile = item.name === "Profile";

        return (
          <motion.li
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1 * index + 0.4,
              duration: 0.6,
              ease: "easeOut",
            }}
            className="relative flex cursor-pointer flex-col items-center overflow-visible"
            key={index}
          >
            <div className="relative flex items-start">
              <Link
                href={item.href}
                className="block w-full text-center"
                onClick={onItemClick}
              >
                <TextRoll
                  center
                  className={cn(
                    "text-4xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold uppercase leading-[0.8] tracking-[-0.03em] transition-colors",
                    isSpecialItem
                      ? "text-red-500 hover:text-red-300"
                      : isProfile
                      ? "text-orange-500 hover:text-orange-300"
                      : "text-white hover:text-blue-400"
                  )}
                >
                  {item.name}
                </TextRoll>
              </Link>
            </div>
          </motion.li>
        );
      })}

      {/* Logout Button if logged in */}
      {session?.user && (
        <motion.li
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.1 * items.length + 0.4,
            duration: 0.6,
            ease: "easeOut",
          }}
          className="relative flex cursor-pointer flex-col items-center overflow-visible"
        >
          <div className="relative flex items-start">
            <button
              onClick={handleLogout}
              className="block w-full text-center"
            >
              <TextRoll
                center
                className="text-4xl lg:text-6xl xl:text-7xl 2xl:text-8xl font-extrabold uppercase leading-[0.8] tracking-[-0.03em] transition-colors text-red-500 hover:text-red-300"
              >
                Logout
              </TextRoll>
            </button>
          </div>
        </motion.li>
      )}
    </ul>
  );
};

const STAGGER = 0.035;

const TextRoll: React.FC<{
  children: string;
  className?: string;
  center?: boolean;
}> = ({ children, className, center = false }) => {
  return (
    <motion.span
      initial="initial"
      whileHover="hovered"
      className={cn("relative block overflow-hidden", className)}
      style={{
        lineHeight: 0.75,
      }}
    >
      <div>
        {children.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: 0,
                },
                hovered: {
                  y: "-100%",
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
      <div className="absolute inset-0">
        {children.split("").map((l, i) => {
          const delay = center
            ? STAGGER * Math.abs(i - (children.length - 1) / 2)
            : STAGGER * i;

          return (
            <motion.span
              variants={{
                initial: {
                  y: "100%",
                },
                hovered: {
                  y: 0,
                },
              }}
              transition={{
                ease: "easeInOut",
                delay,
              }}
              className="inline-block"
              key={i}
            >
              {l}
            </motion.span>
          );
        })}
      </div>
    </motion.span>
  );
};

export { TextRoll };
