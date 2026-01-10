import CarouselGallery from "@/components/ui/CarouselGallery";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gallery - Surabhi 2026",
  description: "Explore the vibrant gallery of Surabhi International Cultural Fest events and memories.",
};
// Sample gallery images - Replace with your actual images
// You can fetch this from your database or API
// Duplicate photos for each year for demo purposes
const galleryImages = [
  // 2025 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2025",
  },
  // 2024 Images
  {
    image: "https://i.imghippo.com/files/eLgR9932Ys.jpeg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
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
  // Add more images as needed
  // You can also fetch from your database:
  // const galleryImages = await fetchGalleryImages();
];

const Gallery = () => {
  return <CarouselGallery items={galleryImages} defaultYear="2025" />;
};

export default Gallery;