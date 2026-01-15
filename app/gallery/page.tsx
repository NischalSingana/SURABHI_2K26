import type { Metadata } from "next";
import CarouselGallery from "@/components/ui/CarouselGallery";

export const metadata: Metadata = {
  title: "Gallery - Surabhi 2026",
  description: "Explore the vibrant gallery of Surabhi Cultural Fest events and memories.",
};

const galleryImages = [
  // 2025 Images
  {
    image: "https://i.imghippo.com/files/HEK3855M.jpeg",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/idTS8828AfQ.JPG",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/DLI1046HmA.JPG",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/mIod6172jf.JPG",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/BzCV7186HTo.JPG",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/NOJT5960c.jpg",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/XzpS9511jpo.jpg",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/fu8100vp.jpg",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/xnT9207vuw.jpg",
    year: "2025",
  },
  {
    image: "https://i.imghippo.com/files/aX2170ug.jpg",
    year: "2025",
  },

  // 2024 Images
  {
    image: "https://i.imghippo.com/files/Xcy8735KmY.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/eLgR9932Ys.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/ZGYX2812fw.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/ZsZc3437eaA.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/zjnN6551OS.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/Cna2701dzA.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/oyUo9101rMY.jpeg",
    year: "2024",
  },
  {
    image: "https://i.imghippo.com/files/wNGp6741GNk.jpeg",
    year: "2024",
  },

  // 2023 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2023",
  },

  // 2022 Images
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    year: "2022",
  },
];

const Gallery = () => {
  return <CarouselGallery items={galleryImages} defaultYear="2025" />;
};

export default Gallery;