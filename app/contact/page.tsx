"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiUser,
  FiMessageSquare,
  FiInstagram,
  FiTwitter,
  FiLinkedin,
  FiFacebook,
  FiPlus,
  FiMinus,
} from "react-icons/fi";
import { getFaqs } from "@/actions/faq.action";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const Contact = () => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [isLoadingFaqs, setIsLoadingFaqs] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const { success, data } = await getFaqs();
        if (success && data) {
          // Transform dates to strings if necessary or just use the data if compatible
          // The data from server action has Date objects, but for display we just need strings for text
          // However, JSON serialization might happen if passed to props, but here we set state directly.
          // State expects FAQ interface which matches except date types if defined.
          // Let's ensure the local FAQ interface matches or casts.
          setFaqs(data as unknown as FAQ[]);
        }
      } catch (error) {
        console.error("Failed to fetch FAQs", error);
      } finally {
        setIsLoadingFaqs(false);
      }
    };

    fetchFaqs();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success("Message sent successfully! We'll get back to you soon.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setIsSubmitting(false);
  };

  const canSubmit = () => {
    return (
      formData.name &&
      formData.email &&
      formData.subject &&
      formData.message
    );
  };

  const toggleAccordion = (id: string) => {
    setActiveAccordion(activeAccordion === id ? null : id);
  };

  const contactInfo = [
    {
      icon: FiMail,
      title: "Email Us",
      details: "surabhi@kluniversity.in",
      link: "mailto:surabhi@kluniversity.in",
    },
    {
      icon: FiPhone,
      title: "Call Us",
      details: "+91 1234567890",
      link: "tel:+911234567890",
    },
    {
      icon: FiMapPin,
      title: "Visit Us",
      details: "KL University, Vaddeswaram, Guntur, AP 522302",
      link: "https://www.google.com/maps/dir//Green+Fields,+Vaddeswaram,+Andhra+Pradesh+522501/@16.4465408,80.6146415,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a35f0a2a7d81943:0x8ba5d78f65df94b8!2m2!1d80.6225946!2d16.4419257?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D",
    },
  ];

  const socialLinks = [
    { icon: FiInstagram, link: "#", label: "Instagram" },
    { icon: FiTwitter, link: "#", label: "Twitter" },
    { icon: FiFacebook, link: "#", label: "Facebook" },
    { icon: FiLinkedin, link: "#", label: "LinkedIn" },
  ];

  return (
    <div className="w-full min-h-screen bg-black relative overflow-hidden pt-20">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-zinc-950 via-black to-black" />

      {/* Fiery Red Ambient Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-red-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute top-40 right-20 w-80 h-80 bg-red-600/10 rounded-full blur-[100px] animate-pulse delay-700" />
        <div className="absolute bottom-20 left-1/3 w-[500px] h-[500px] bg-red-800/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <div className="inline-block mb-4 px-4 py-1.5 rounded-full border border-red-500/30 bg-red-500/10 text-red-400 font-medium text-sm tracking-wide uppercase">
            Surabhi 2026
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
            Get In{" "}
            <span className="bg-gradient-to-r from-red-500 via-red-400 to-red-600 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Have questions about Surabhi 2026? We would love to hear from you.
            Reach out to us for any queries regarding events, accommodation, or
            sponsorships.
          </p>
        </motion.div>

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {contactInfo.map((info, index) => (
            <motion.a
              key={index}
              href={info.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="group relative bg-zinc-900/40 backdrop-blur-md rounded-2xl p-8 border border-zinc-800 hover:border-red-500/50 transition-all duration-500 overflow-hidden"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/5 to-red-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-red-500/20">
                  <info.icon className="text-white" size={28} />
                </div>
                <h3 className="text-white font-semibold text-xl mb-3">
                  {info.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {info.details}
                </p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Main Content Grid: Form + FAQ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          {/* Contact Form - 7 Cols */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-7"
          >
            <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-8 md:p-10 border border-zinc-800 relative overflow-hidden h-full">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-red-500/10 to-transparent rounded-bl-full pointer-events-none" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-3xl font-bold text-white mb-2">
                  Send us a Message
                </h2>
                <p className="text-zinc-400 mb-8">
                  We typically respond within 24 hours
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name & Phone Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Full Name *
                      </label>
                      <div className="relative group">
                        <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Phone Number
                      </label>
                      <div className="relative group">
                        <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          pattern="[0-9]{10}"
                          className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                          placeholder="9876543210"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="john@example.com"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Subject *
                    </label>
                    <div className="relative group">
                      <FiMessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-red-500 transition-colors" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all"
                        placeholder="How can we help?"
                      />
                    </div>
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Message *
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      required
                      rows={5}
                      className="w-full px-4 py-3.5 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 transition-all resize-none"
                      placeholder="Your message here..."
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={!canSubmit() || isSubmitting}
                    whileHover={{
                      scale: canSubmit() && !isSubmitting ? 1.02 : 1,
                    }}
                    whileTap={{
                      scale: canSubmit() && !isSubmitting ? 0.98 : 1,
                    }}
                    className="group w-full px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden shadow-lg shadow-red-600/25 hover:shadow-red-600/40"
                  >
                    <span className="relative z-10 flex items-center gap-3">
                      {isSubmitting ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <FiSend className="group-hover:translate-x-1 transition-transform" />
                          Send Message
                        </>
                      )}
                    </span>
                  </motion.button>
                </form>
              </div>
            </div>
          </motion.div>

          {/* FAQs & Social - 5 Cols */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* FAQ Section */}
            <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-8 border border-zinc-800 h-fit">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                <span className="w-2 h-8 bg-red-500 rounded-full" />
                Common Questions
              </h3>

              {isLoadingFaqs ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-16 bg-zinc-800/50 rounded-xl animate-pulse"
                    />
                  ))}
                </div>
              ) : faqs.length > 0 ? (
                <div className="space-y-3">
                  {faqs.map((faq) => (
                    <div
                      key={faq.id}
                      className="border border-zinc-800 rounded-xl overflow-hidden bg-black/20"
                    >
                      <button
                        onClick={() => toggleAccordion(faq.id)}
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-zinc-800/30 transition-colors"
                      >
                        <span className="text-zinc-200 font-medium pr-4">
                          {faq.question}
                        </span>
                        <span className="text-red-500 shrink-0">
                          {activeAccordion === faq.id ? (
                            <FiMinus size={20} />
                          ) : (
                            <FiPlus size={20} />
                          )}
                        </span>
                      </button>
                      <AnimatePresence>
                        {activeAccordion === faq.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                          >
                            <div className="px-4 pb-4 pt-0 text-zinc-400 text-sm leading-relaxed border-t border-zinc-800/50 mt-2 whitespace-pre-line">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-500 text-center py-6">
                  No FAQs available at the moment.
                </div>
              )}
            </div>

            {/* Social Media */}
            <div className="bg-zinc-900/40 backdrop-blur-md rounded-3xl p-8 border border-zinc-800">
              <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
              <p className="text-zinc-400 mb-6 text-sm">
                Stay updated with the latest news, announcements, and
                behind-the-scenes action.
              </p>
              <div className="flex gap-4">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.1, y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white hover:shadow-lg hover:shadow-red-600/30 transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon size={20} />
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <div className="bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-black/40 backdrop-blur-md rounded-3xl p-8 border border-zinc-800 overflow-hidden relative">
            {/* Decorative corner glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-red-600/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row gap-8 items-center">
                {/* Text Info - Adjusted width and spacing */}
                <div className="lg:w-1/3 space-y-8">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center shadow-lg shadow-red-600/20 shrink-0">
                      <FiMapPin className="text-white" size={28} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-bold text-white mb-1">
                        Find Us Here
                      </h3>
                      <p className="text-zinc-400 font-medium">KL University</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="text-zinc-300 leading-relaxed text-lg">
                      Green Fields, Vaddeswaram, <br />
                      Guntur, Andhra Pradesh 522302
                    </p>
                    <div className="flex flex-col gap-3">
                      <motion.a
                        href="https://www.google.com/maps/dir//Green+Fields,+Vaddeswaram,+Andhra+Pradesh+522501"
                        target="_blank"
                        rel="noopener noreferrer"
                        whileHover={{ x: 5 }}
                        className="flex items-center gap-3 text-red-500 hover:text-red-400 font-semibold transition-colors text-lg"
                      >
                        <FiSend size={20} /> Get Directions
                      </motion.a>
                    </div>
                  </div>
                </div>

                {/* Map Iframe - Larger and Colorful */}
                <div className="lg:w-2/3 w-full">
                  <div className="aspect-video w-full h-[400px] rounded-2xl overflow-hidden border-2 border-zinc-800 shadow-2xl relative group hover:border-red-500/30 transition-all duration-300">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.8446789!2d80.6146415!3d16.4465408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35f0a2a7d81943%3A0x8ba5d78f65df94b8!2sGreen%20Fields%2C%20Vaddeswaram!5e0!3m2!1sen!2sin!4v1234567890"
                      width="100%"
                      height="100%"
                      style={{
                        border: 0,
                      }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="w-full h-full"
                      title="KL University Location Map"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;