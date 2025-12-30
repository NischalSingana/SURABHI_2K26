import MultiStepAccommodation from "@/components/ui/MultiStepAccommodation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accommodation Booking - Surabhi 2026",
  description: "Book your accommodation for Surabhi International Cultural Fest at KL University",
};

const Accommodation = () => {
  return <MultiStepAccommodation />;
};

export default Accommodation;
