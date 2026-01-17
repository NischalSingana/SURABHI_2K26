import type { Metadata } from "next";
import CarouselGallery from "@/components/ui/CarouselGallery";

export const metadata: Metadata = {
  title: "Gallery - Surabhi 2026",
  description: "Explore the vibrant gallery of Surabhi Cultural Fest events and memories.",
};

const CDN_URL = process.env.NEXT_PUBLIC_GALLERY_CDN_URL || "";

// TODO: Update these filenames to match what you uploaded to your DigitalOcean bucket
const galleryImages = [
  // 2025 Images
  {
    image: `${CDN_URL}/2024/WhatsApp%20Image%202026-01-15%20at%2014.36.33%203.05.14%E2%80%AFPM.jpeg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/DSC09230%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI0326%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI0126%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI9664%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI9924%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI9543%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI9583%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI9615%20(1).jpg`,
    year: "2025",
  },
  {
    image: `${CDN_URL}/2024/RAVI0390%20(1).jpg`,
    year: "2025",
  },
  // 2024 Images
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.48%20(2).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.49%20(3).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.49%20(4).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.50%20(4).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.50%20(5).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.50%20(6).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.51%20(2).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.34.51%20(3).jpeg`,
    year: "2024",
  },
  {
    image: `${CDN_URL}/2025/WhatsApp%20Image%202026-01-10%20at%2013.38.37.jpeg`,
    year: "2024",
  },
];

const Gallery = () => {
  return <CarouselGallery items={galleryImages} defaultYear="2025" />;
};

export default Gallery;