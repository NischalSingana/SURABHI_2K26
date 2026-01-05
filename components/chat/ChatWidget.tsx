"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiMessageSquare, FiX, FiMinimize2, FiChevronLeft, FiArrowRight } from "react-icons/fi";
import { FaRobot } from "react-icons/fa";

interface FAQ {
    id: string;
    question: string;
    answer: string;
    category: string;
}

type ViewState = 'greeting' | 'categories' | 'questions' | 'answer';

export default function ChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [faqs, setFaqs] = useState<FAQ[]>([]);
    const [currentView, setCurrentView] = useState<ViewState>('greeting');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [categories, setCategories] = useState<string[]>([]);

    // Fetch FAQs and Categories on mount
    useEffect(() => {
        fetchCategories();
        fetchFAQs();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await fetch('/api/chatbot/categories');
            const data = await res.json();
            if (Array.isArray(data)) {
                setCategories(data.map((c: any) => c.name));
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    const fetchFAQs = async () => {
        try {
            const res = await fetch('/api/chatbot/faqs');
            const data = await res.json();
            if (Array.isArray(data)) {
                setFaqs(data);
            } else {
                console.warn('FAQ data is not an array:', data);
                // If data is empty object or invalid, default to empty array
                setFaqs([]);
            }
        } catch (error) {
            console.error('Error fetching FAQs:', error);
            setFaqs([]);
        }
    };

    // Get FAQs for selected category
    const categoryFAQs = selectedCategory
        ? faqs.filter(faq => faq.category === selectedCategory)
        : [];

    // Reset to greeting when opening
    useEffect(() => {
        if (isOpen) {
            setCurrentView('greeting');
            setSelectedCategory(null);
            setSelectedFAQ(null);
        }
    }, [isOpen]);

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [currentView]);

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4 pointer-events-none">
            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="w-[90vw] md:w-[380px] h-[550px] max-h-[80vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
                    >
                        {/* Header */}
                        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-orange-600 flex items-center justify-center">
                                    <FaRobot className="text-white text-2xl" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg">Surabhi Assistant</h3>
                                    <p className="text-xs text-green-500 flex items-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                        Online
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
                            >
                                <FiMinimize2 className="text-xl" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div
                            className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-4 custom-scrollbar bg-black/20"
                            onWheel={(e) => e.stopPropagation()}
                        >
                            {/* Greeting View */}
                            {currentView === 'greeting' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-6"
                                >
                                    <div className="text-center py-6">
                                        <FaRobot className="text-6xl mx-auto mb-4 text-red-500 opacity-80" />
                                        <h2 className="text-2xl font-bold text-white mb-3">
                                            Welcome to Surabhi 2026! 👋
                                        </h2>
                                        <p className="text-zinc-400 text-base leading-relaxed">
                                            I'm your official guide. I can help you with information about events, registration, accommodation, and more!
                                        </p>
                                    </div>

                                    <button
                                        onClick={() => setCurrentView('categories')}
                                        className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold text-base px-6 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg"
                                    >
                                        Get Started
                                        <FiArrowRight className="text-xl" />
                                    </button>
                                </motion.div>
                            )}

                            {/* Categories View */}
                            {currentView === 'categories' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-white mb-2">Select a Category</h3>
                                        <p className="text-zinc-400 text-sm">Choose a topic to explore</p>
                                    </div>

                                    {categories.length === 0 ? (
                                        <p className="text-center text-zinc-500 text-base py-8">
                                            No categories available yet
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {categories.map((category) => (
                                                <button
                                                    key={category}
                                                    onClick={() => {
                                                        setSelectedCategory(category);
                                                        setCurrentView('questions');
                                                    }}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-base px-5 py-4 rounded-xl transition-all border border-zinc-700 hover:border-red-600 text-left flex items-center justify-between group"
                                                >
                                                    <span>{category}</span>
                                                    <FiArrowRight className="text-zinc-500 group-hover:text-red-500 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setCurrentView('greeting')}
                                        className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-3 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                                    >
                                        <FiChevronLeft />
                                        Back to Home
                                    </button>
                                </motion.div>
                            )}

                            {/* Questions View */}
                            {currentView === 'questions' && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="mb-4">
                                        <h3 className="text-xl font-bold text-white mb-1">{selectedCategory}</h3>
                                        <p className="text-zinc-400 text-sm">Select a question</p>
                                    </div>

                                    {categoryFAQs.length === 0 ? (
                                        <p className="text-center text-zinc-500 text-base py-8">
                                            No questions in this category yet
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3">
                                            {categoryFAQs.map((faq) => (
                                                <button
                                                    key={faq.id}
                                                    onClick={() => {
                                                        setSelectedFAQ(faq);
                                                        setCurrentView('answer');
                                                    }}
                                                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-base px-5 py-4 rounded-xl transition-all border border-zinc-700 hover:border-red-600 text-left"
                                                >
                                                    {faq.question}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setCurrentView('categories')}
                                        className="w-full mt-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-3 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                                    >
                                        <FiChevronLeft />
                                        Back to Categories
                                    </button>
                                </motion.div>
                            )}

                            {/* Answer View */}
                            {currentView === 'answer' && selectedFAQ && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="space-y-4"
                                >
                                    <div className="bg-red-900 text-white p-4 rounded-xl">
                                        <p className="font-semibold text-base">{selectedFAQ.question}</p>
                                    </div>

                                    <div className="bg-zinc-800 text-zinc-200 p-5 rounded-xl border border-zinc-700">
                                        <p className="text-base leading-relaxed whitespace-pre-wrap">
                                            {selectedFAQ.answer}
                                        </p>
                                    </div>

                                    <div className="flex flex-col gap-2 pt-2">
                                        <button
                                            onClick={() => setCurrentView('questions')}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-3 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                                        >
                                            <FiChevronLeft />
                                            Back to Questions
                                        </button>
                                        <button
                                            onClick={() => setCurrentView('categories')}
                                            className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-3 rounded-lg transition-colors border border-zinc-700 flex items-center justify-center gap-2"
                                        >
                                            <FiChevronLeft />
                                            Back to Categories
                                        </button>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toggle Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-red-600 to-orange-600 text-white shadow-lg hover:shadow-xl transition-all flex items-center justify-center pointer-events-auto"
            >
                {isOpen ? <FiX className="text-2xl" /> : <FiMessageSquare className="text-2xl" />}
            </motion.button>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #52525b;
                    border-radius: 3px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #71717a;
                }
            `}</style>
        </div>
    );
}
