"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
} from "react-icons/fi";

interface ContactFormData {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
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

      {/* Floating orbs - orange theme only */}
      <div className="absolute top-20 left-10 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl" />
      <div className="absolute top-40 right-20 w-72 h-72 bg-orange-600/8 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-orange-500/6 rounded-full blur-3xl" />

      <div className="max-w-7xl mx-auto px-6 py-16 relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
            Get In{" "}
            <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 bg-clip-text text-transparent">
              Touch
            </span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Have questions about Surabhi 2026? We'd love to hear from you. Send
            us a message and we'll respond as soon as possible.
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
              className="group relative bg-zinc-900/40 backdrop-blur-sm rounded-2xl p-8 border border-zinc-800 hover:border-orange-500/50 transition-all duration-500 overflow-hidden"
            >
              {/* Hover glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-lg shadow-orange-500/20">
                  <info.icon className="text-white" size={28} />
                </div>
                <h3 className="text-white font-semibold text-xl mb-3">
                  {info.title}
                </h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{info.details}</p>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Main Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Contact Form - Takes 3 columns */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <div className="bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-8 md:p-10 border border-zinc-800 relative overflow-hidden">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-500/10 to-transparent rounded-bl-full" />

              <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  Send us a Message
                </h2>
                <p className="text-zinc-400 mb-8">We typically respond within 24 hours</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Full Name *
                    </label>
                    <div className="relative group">
                      <FiUser className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        placeholder="Enter your name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Email Address *
                    </label>
                    <div className="relative group">
                      <FiMail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Phone Number
                    </label>
                    <div className="relative group">
                      <FiPhone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        pattern="[0-9]{10}"
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        placeholder="10-digit mobile number"
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">
                      Subject *
                    </label>
                    <div className="relative group">
                      <FiMessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-orange-500 transition-colors" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all"
                        placeholder="What is this about?"
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
                      rows={6}
                      className="w-full px-4 py-4 bg-black/50 border border-zinc-800 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all resize-none"
                      placeholder="Tell us more about your inquiry..."
                    />
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={!canSubmit() || isSubmitting}
                    whileHover={{ scale: canSubmit() && !isSubmitting ? 1.02 : 1 }}
                    whileTap={{ scale: canSubmit() && !isSubmitting ? 0.98 : 1 }}
                    className="group w-full px-8 py-5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40"
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

          {/* Info Section - Takes 2 columns */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* About Section */}
            <div className="bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-4">
                About Surabhi 2026
              </h3>
              <p className="text-zinc-400 leading-relaxed mb-6">
                Surabhi is KL University's premier international cultural fest,
                bringing together students from across the globe to celebrate
                diversity, talent, and creativity.
              </p>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium">
                  Cultural Events
                </span>
                <span className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium">
                  Competitions
                </span>
                <span className="px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full text-orange-400 text-sm font-medium">
                  Workshops
                </span>
              </div>
            </div>

            {/* Social Media */}
            <div className="bg-zinc-900/40 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800">
              <h3 className="text-2xl font-bold text-white mb-4">
                Follow Us
              </h3>
              <p className="text-zinc-400 mb-6">
                Stay updated with the latest news and announcements
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
                    className="w-14 h-14 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300"
                    aria-label={social.label}
                  >
                    <social.icon size={22} />
                  </motion.a>
                ))}
              </div>
            </div>

            {/* FAQ Teaser */}
            <div className="bg-gradient-to-br from-orange-500/10 via-orange-600/5 to-transparent backdrop-blur-sm rounded-3xl p-8 border border-orange-500/20">
              <h3 className="text-2xl font-bold text-white mb-4">
                Quick Questions?
              </h3>
              <p className="text-zinc-300 mb-6 leading-relaxed">
                Check out our FAQ section for instant answers to common
                questions about registration, events, and accommodation.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 rounded-xl text-orange-300 font-semibold transition-all"
              >
                View FAQs →
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <div className="bg-gradient-to-br from-zinc-900/60 via-zinc-900/40 to-black/40 backdrop-blur-sm rounded-3xl p-8 border border-zinc-800 overflow-hidden relative">
            {/* Decorative corner glow */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl" />

            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <FiMapPin className="text-white" size={28} />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white">Find Us Here</h3>
                  <p className="text-zinc-400 text-sm">KL University, Green Fields, Vaddeswaram</p>
                </div>
              </div>

              {/* Map Container */}
              <div className="relative group">
                <div className="aspect-video rounded-2xl overflow-hidden border-2 border-zinc-800 group-hover:border-orange-500/30 transition-all duration-500 shadow-2xl">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3825.8446789!2d80.6146415!3d16.4465408!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a35f0a2a7d81943%3A0x8ba5d78f65df94b8!2sGreen%20Fields%2C%20Vaddeswaram!5e0!3m2!1sen!2sin!4v1234567890"
                    width="100%"
                    height="100%"
                    style={{ border: 0, filter: 'grayscale(0.2) contrast(1.1)' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="w-full h-full"
                    title="KL University Location Map"
                  />
                </div>

                {/* Hover overlay hint */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl" />
              </div>

              {/* Location Details & Actions */}
              <div className="mt-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                    <FiMapPin className="text-orange-500" size={20} />
                  </div>
                  <div>
                    <p className="text-white font-medium mb-1">Address</p>
                    <p className="text-zinc-400 text-sm leading-relaxed">
                      Green Fields, Vaddeswaram<br />
                      Guntur, Andhra Pradesh 522302
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <motion.a
                    href="https://www.google.com/maps/dir//Green+Fields,+Vaddeswaram,+Andhra+Pradesh+522501/@16.4465408,80.6146415,14z/data=!4m8!4m7!1m0!1m5!1m1!1s0x3a35f0a2a7d81943:0x8ba5d78f65df94b8!2m2!1d80.6225946!2d16.4419257?entry=ttu&g_ep=EgoyMDI1MTIwOS4wIKXMDSoASAFQAw%3D%3D"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 flex items-center gap-2"
                  >
                    <FiMapPin size={18} />
                    Get Directions
                  </motion.a>

                  <motion.a
                    href="https://www.google.com/maps/place/Green+Fields,+Vaddeswaram/@16.4465408,80.6146415,14z"
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 bg-zinc-800/50 border border-zinc-700 text-zinc-300 rounded-xl font-medium hover:bg-zinc-800 hover:border-orange-500/30 transition-all flex items-center gap-2"
                  >
                    View on Maps
                  </motion.a>
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