import Link from 'next/link';
import { FaInstagram, FaEnvelope, FaMapMarkerAlt, FaGlobe } from 'react-icons/fa';

const Footer = () => {
    const currentYear = 2026;

    return (
        <footer className="relative bg-[#1a0505] border-t border-orange-500/20 pt-16 pb-8 overflow-hidden z-20">
            {/* Background decorative elements */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
                    {/* Mission Section */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Our Mission
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            To create a vibrant platform where art, culture, and innovation converge.
                            We strive to foster creativity, celebrate diversity, and provide a stage for
                            exceptional talent to shine, uniting students through the universal language of art.
                        </p>
                    </div>

                    {/* Goal Section */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Our Goal
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            To deliver an unforgettable cultural experience that resonates with every participant.
                            We aim to set new benchmarks in cultural fest excellence, creating memories that last a lifetime
                            while nurturing the next generation of artists and performers.
                        </p>
                    </div>

                    {/* Contact/Connect Section */}
                    <div className="space-y-6">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Connect With Us
                        </h3>
                        <div className="space-y-4">
                            <a
                                href="https://instagram.com/klsurabhi"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors group"
                            >
                                <div className="p-2 bg-white/5 rounded-full group-hover:bg-orange-500/10 transition-colors">
                                    <FaInstagram className="text-xl" />
                                </div>
                                <span>@klsurabhi</span>
                            </a>

                            <a
                                href="mailto:contact@surabhi.kl.ac.in"
                                className="flex items-center gap-3 text-gray-400 hover:text-orange-400 transition-colors group"
                            >
                                <div className="p-2 bg-white/5 rounded-full group-hover:bg-orange-500/10 transition-colors">
                                    <FaEnvelope className="text-xl" />
                                </div>
                                <span>contact@surabhi.kl.ac.in</span>
                            </a>

                            <div className="flex items-center gap-3 text-gray-400 group">
                                <div className="p-2 bg-white/5 rounded-full group-hover:bg-orange-500/10 transition-colors">
                                    <FaMapMarkerAlt className="text-xl" />
                                </div>
                                <span>KL University, Vijayawada</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Bottom */}
                <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-sm">
                        © {currentYear} Surabhi International Cultural Fest. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                        <Link href="/privacy" className="hover:text-orange-400 transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-orange-400 transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
