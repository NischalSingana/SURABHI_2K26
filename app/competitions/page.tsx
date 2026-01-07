"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { getCategories } from "@/actions/events.action";
import Loader from "@/components/ui/Loader";

import { FiCalendar, FiClock } from "react-icons/fi";

interface CategoryData {
  name: string;
  count: number;
  image: string;
}

const Events = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const result = await getCategories();
    if (result.success && result.data) {
      const categoriesData: CategoryData[] = result.data.map((cat) => ({
        name: cat.name,
        count: cat.Event.length,
        // Use category image if available, otherwise fallback to first event image (if any), otherwise placeholder
        image: cat.image || (cat.Event.length > 0 ? cat.Event[0].image : "/placeholder.png"),
      })).sort((a, b) => a.name.localeCompare(b.name));
      setCategories(categoriesData);
    }
    setLoading(false);
  };


  if (loading) {
    return <Loader />;
  }



  // Filter categories based on search query
  const filteredCategories = categories.filter((category) =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black py-8 sm:py-10 md:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header with My Events Button */}
        <div className="text-center mb-8 sm:mb-10 md:mb-12 mt-20 sm:mt-14 md:mt-16">
          <div className="flex justify-center items-center gap-4 mb-6">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-6xl font-bold text-white"
            >
              Competition Categories
            </motion.h1>
          </div>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-400 text-sm md:text-xl mb-6"
          >
            Choose a category to explore competitions
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => router.push("/profile/competitions")}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-red-600/50"
          >
            <FiCalendar size={20} />
            My Competitions
          </motion.button>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => router.push("/schedule")}
            className="inline-flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-zinc-800/50 border border-zinc-700"
          >
            <FiClock size={20} />
            Schedule
          </motion.button>
        </div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="relative">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pl-14 bg-zinc-900 text-white rounded-xl border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all placeholder-zinc-500"
            />
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-zinc-400 text-sm mt-2 text-center">
              Found {filteredCategories.length}{" "}
              {filteredCategories.length === 1 ? "category" : "categories"}
            </p>
          )}
        </motion.div>

        {/* 3D Category Cards */}
        {filteredCategories.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-xl">
              {searchQuery
                ? `No categories found matching "${searchQuery}"`
                : "No categories available at the moment."}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="mt-4 px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{
                  y: -10,
                  rotateY: 5,
                  rotateX: 5,
                  scale: 1.05,
                  transition: { duration: 0.3 },
                }}
                onClick={() =>
                  router.push(`/competitions/${encodeURIComponent(category.name)}`)
                }
                className="cursor-pointer perspective-1000"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="relative h-60 md:h-80 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-red-600/50 transition-all duration-300 shadow-2xl hover:shadow-red-600/20">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 hover:scale-110"
                      priority={index < 3}
                      quality={75}
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-4 md:p-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 + 0.2 }}
                    >
                      <h2 className="text-2xl md:text-3xl font-bold text-white mb-2 capitalize">
                        {category.name}
                      </h2>
                      <div className="flex items-center gap-2 text-red-500">
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="text-base md:text-lg font-medium">
                          {category.count}{" "}
                          {category.count === 1 ? "Competition" : "Competitions"}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2 text-white/80 text-sm">
                        <span>Explore</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </motion.div>
                  </div>

                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
