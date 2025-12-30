import CarouselGallery from "@/components/ui/CarouselGallery";

// Sample gallery images - Replace with your actual images
// You can fetch this from your database or API
// Duplicate photos for each year for demo purposes
const galleryImages = [
  // 2025 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Surabhi Cultural Fest 2025",
    description: "Experience the vibrant celebrations and cultural performances from our latest festival.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Performance 2025",
    description: "Witness stunning performances from talented artists across the globe.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Stage Setup 2025",
    description: "Beautifully designed stages that showcase the essence of cultural diversity.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2025",
    description: "Explore breathtaking artworks from renowned artists and emerging talents.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Competition 2025",
    description: "Mesmerizing dance performances that celebrate diverse cultural traditions.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Concert 2025",
    description: "Enjoy soulful melodies and energetic performances from world-class musicians.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Ceremony 2025",
    description: "The grand opening ceremony that marked the beginning of an unforgettable cultural journey.",
    year: "2025",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Parade 2025",
    description: "A vibrant parade showcasing the rich cultural heritage of our community.",
    year: "2025",
    buttonText: "See More",
  },
  // 2024 Images
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2024",
    description: "Explore breathtaking artworks from renowned artists and emerging talents.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Competition 2024",
    description: "Mesmerizing dance performances that celebrate diverse cultural traditions.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Concert 2024",
    description: "Enjoy soulful melodies and energetic performances from world-class musicians.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Stage Performance 2024",
    description: "Stunning stage performances that captivated audiences throughout the festival.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Showcase 2024",
    description: "A diverse showcase of cultural performances from around the world.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Award Night 2024",
    description: "Celebrating excellence and recognizing outstanding contributions to the arts.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Workshop Session 2024",
    description: "Engaging workshops that brought together artists and enthusiasts from around the world.",
    year: "2024",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Food Festival 2024",
    description: "A culinary journey featuring diverse flavors and traditional delicacies.",
    year: "2024",
    buttonText: "See More",
  },
  // 2023 Images
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Ceremony 2023",
    description: "The grand opening ceremony that marked the beginning of an unforgettable cultural journey.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Parade 2023",
    description: "A vibrant parade showcasing the rich cultural heritage of our community.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Workshop Session 2023",
    description: "Engaging workshops that brought together artists and enthusiasts from around the world.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Art Exhibition 2023",
    description: "Explore breathtaking artworks from renowned artists and emerging talents.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Dance Performance 2023",
    description: "Mesmerizing dance performances that celebrate diverse cultural traditions.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Music Festival 2023",
    description: "Enjoy soulful melodies and energetic performances from world-class musicians.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Closing Ceremony 2023",
    description: "A grand finale that celebrated the success of an amazing cultural festival.",
    year: "2023",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Showcase 2023",
    description: "A diverse showcase of cultural performances from around the world.",
    year: "2023",
    buttonText: "See More",
  },
  // 2022 Images
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Award Ceremony 2022",
    description: "Celebrating excellence and recognizing outstanding contributions to the arts.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Traditional Dance 2022",
    description: "Traditional dance performances that honored our cultural roots and heritage.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/RNkk6L0/img6.jpg",
    name: "Food Festival 2022",
    description: "A culinary journey featuring diverse flavors and traditional delicacies.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/qCkd9jS/img1.jpg",
    name: "Opening Night 2022",
    description: "The spectacular opening night that set the tone for an amazing festival.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jrRb11q/img2.jpg",
    name: "Cultural Events 2022",
    description: "A series of cultural events that showcased the diversity of our community.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/NSwVv8D/img3.jpg",
    name: "Art Installation 2022",
    description: "Stunning art installations that transformed the festival venue.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/Bq4Q0M8/img4.jpg",
    name: "Music Performance 2022",
    description: "Memorable music performances that resonated with audiences.",
    year: "2022",
    buttonText: "See More",
  },
  {
    image: "https://i.ibb.co/jTQfmTq/img5.jpg",
    name: "Cultural Heritage 2022",
    description: "Celebrating our rich cultural heritage through various performances and exhibitions.",
    year: "2022",
    buttonText: "See More",
  },
  // Add more images as needed
  // You can also fetch from your database:
  // const galleryImages = await fetchGalleryImages();
];

const Gallery = () => {
  return <CarouselGallery items={galleryImages} defaultYear="2025" />;
};

export default Gallery;