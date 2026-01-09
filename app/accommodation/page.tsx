import MultiStepAccommodation from "@/components/ui/MultiStepAccommodation";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accommodation Booking - Surabhi 2026",
  description: "Book your accommodation for Surabhi International Cultural Fest at KL University",
};

const Accommodation = () => {
  return (
    <>
      <h1 className="sr-only">Accommodation Booking - Surabhi 2026</h1>
      <MultiStepAccommodation />
    </>
  );
};

export default Accommodation;
