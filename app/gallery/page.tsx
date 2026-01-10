import type { Metadata } from "next";
import CarouselGallery from "@/components/ui/CarouselGallery";

export const metadata: Metadata = {
  title: "Gallery - Surabhi 2026",
  description: "Explore the vibrant gallery of Surabhi Cultural Fest events and memories.",
};

const galleryImages = [
  // 2025 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Surabhi Cultural Fest 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Performance 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Stage Setup 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Competition 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Concert 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Ceremony 2025",
    year: "2025",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Parade 2025",
    year: "2025",
  },

  // 2024 Images
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Competition 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Concert 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Stage Performance 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Showcase 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Award Night 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Workshop Session 2024",
    year: "2024",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Food Festival 2024",
    year: "2024",
  },

  // 2023 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Ceremony 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Parade 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Workshop Session 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Performance 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Festival 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Closing Ceremony 2023",
    year: "2023",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Showcase 2023",
    year: "2023",
  },

  // 2022 Images
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Award Ceremony 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Traditional Dance 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Food Festival 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Night 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Events 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Art Installation 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Music Performance 2022",
    year: "2022",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Cultural Heritage 2022",
    year: "2022",
  },
];

const Gallery = () => {
  return <CarouselGallery items={galleryImages} defaultYear="2025" />;
};

export default Gallery;