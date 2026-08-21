import { BookingJourneyProvider } from "@/components/booking/BookingJourneyProvider";

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return <BookingJourneyProvider>{children}</BookingJourneyProvider>;
}
