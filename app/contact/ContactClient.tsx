"use client";

import { motion } from "framer-motion";
import { FiPhone, FiMail, FiUser, FiSend, FiMapPin } from "react-icons/fi";

interface Coordinator {
    id: string;
    name: string;
    phone: string;
    email: string;
    image: string | null;
    order: number;
}

interface Category {
    id: string;
    name: string;
    order: number;
    coordinators: Coordinator[];
}

interface ContactClientProps {
    categories: Category[];
}

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
};

export default function ContactClient({ categories }: ContactClientProps) {
    return (
        <div className="w-full min-h-screen bg-black relative overflow-hidden pt-20 pb-20">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-red-900/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-red-900/5 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-red-500/20 bg-red-500/5 text-red-400 font-medium text-sm tracking-wide uppercase">
                        Surabhi 2026 Team
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                        Contact{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-red-700">
                            Coordinators
                        </span>
                    </h1>
                    <p className="text-zinc-500 text-lg max-w-2xl mx-auto leading-relaxed">
                        Connect with our dedicated team members for assistance with Events,
                        Accommodation, Hospitality, and more.
                    </p>
                </motion.div>

                {/* Categories Grid */}
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="space-y-16"
                >
                    {categories.map((category) => (
                        <motion.div key={category.id} variants={item} className="space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                                <h2 className="text-2xl font-bold text-red-500 uppercase tracking-wider px-4 py-1 border border-red-900/30 rounded-full bg-red-950/10">
                                    {category.name}
                                </h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {category.coordinators.map((coordinator) => (
                                    <motion.div
                                        key={coordinator.id}
                                        whileHover={{ scale: 1.02 }}
                                        className="group bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 hover:border-red-900/50 rounded-2xl p-6 transition-all duration-300 relative overflow-hidden"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FiUser size={60} />
                                        </div>

                                        <div className="relative z-10">
                                            <h3 className="text-xl font-bold text-white mb-1">
                                                {coordinator.name}
                                            </h3>
                                            <p className="text-red-400/80 text-xs font-medium uppercase tracking-wider mb-6">
                                                Coordinator
                                            </p>

                                            <div className="space-y-3">
                                                <a
                                                    href={`tel:${coordinator.phone}`}
                                                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group/link p-2 bg-black/20 rounded-lg hover:bg-black/40"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/link:bg-red-900/20 group-hover/link:text-red-400 transition-colors">
                                                        <FiPhone size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium">
                                                        {coordinator.phone}
                                                    </span>
                                                </a>

                                                <a
                                                    href={`mailto:${coordinator.email}`}
                                                    className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors group/link p-2 bg-black/20 rounded-lg hover:bg-black/40"
                                                >
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 group-hover/link:bg-red-900/20 group-hover/link:text-red-400 transition-colors">
                                                        <FiMail size={14} />
                                                    </div>
                                                    <span className="text-sm font-medium truncate">
                                                        {coordinator.email}
                                                    </span>
                                                </a>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Get in Touch Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mt-32"
                >
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                            Get in <span className="text-red-500">Touch</span>
                        </h2>
                        <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
                            Have questions? Reach out to us directly or visit our campus. We're here to help!
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
                        {/* Contact Form */}
                        <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-8 md:p-10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-red-900/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 transition-opacity group-hover:opacity-75" />

                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const name = formData.get("name") as string;
                                    const subject = formData.get("subject") as string;
                                    const message = formData.get("message") as string;

                                    const mailtoLink = `mailto:surabhi@kluniversity.in?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Name: ${name}\n\n${message}`)}`;
                                    window.open(mailtoLink, "_blank");
                                }}
                                className="space-y-6 relative z-10"
                            >
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">Your Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        id="name"
                                        required
                                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all autofill:bg-zinc-900"
                                        placeholder="John Doe"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-zinc-400 mb-2">Subject</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        id="subject"
                                        required
                                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all"
                                        placeholder="Event Inquiry"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-zinc-400 mb-2">Message</label>
                                    <textarea
                                        name="message"
                                        id="message"
                                        required
                                        rows={4}
                                        className="w-full bg-black/40 border border-zinc-800 rounded-xl px-5 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-all resize-none"
                                        placeholder="How can we help you?"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 shadow-lg shadow-red-900/20"
                                >
                                    <FiSend /> Send Message
                                </button>
                            </form>
                        </div>

                        {/* Map Section */}
                        <div className="space-y-8">
                            <div className="bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/50 rounded-3xl p-2 md:p-3 h-[400px] md:h-[500px] relative">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3826.664082269267!2d80.6204059751438!3d16.44192568429546!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35f0a2a7d81943%3A0x8ufc426a84d2f0!2sK%20L%20University!5e0!3m2!1sen!2sin!4v1709400000000!5m2!1sen!2sin"
                                    style={{ border: 0, borderRadius: '1.5rem', filter: 'grayscale(100%) invert(92%) contrast(83%)' }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    className="w-full h-full opacity-80 hover:opacity-100 transition-opacity duration-500"
                                ></iframe>

                                <a
                                    href="https://www.google.com/maps/search/?api=1&query=KL+University+Vaddeswaram"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-6 left-6 right-6 bg-black/80 backdrop-blur-md border border-white/10 p-4 rounded-xl flex items-start gap-4 hover:bg-black/95 hover:border-red-500/30 transition-all cursor-pointer group"
                                >
                                    <div className="w-10 h-10 rounded-full bg-red-600/20 flex items-center justify-center shrink-0 text-red-500 group-hover:bg-red-600 group-hover:text-white transition-colors">
                                        <FiMapPin />
                                    </div>
                                    <div>
                                        <h4 className="text-white font-bold group-hover:text-red-400 transition-colors">KL University</h4>
                                        <p className="text-zinc-400 text-sm mt-1">Green Fields, Vaddeswaram, Andhra Pradesh 522502</p>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {categories.length === 0 && (
                    <div className="text-center py-20 text-zinc-600">
                        <p>No contact information available yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
