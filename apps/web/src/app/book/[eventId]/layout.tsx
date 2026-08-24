import { BookingJourneyProvider } from "@/components/booking/BookingJourneyProvider";

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;

  return (
    <BookingJourneyProvider eventId={eventId}>
      {children}
    </BookingJourneyProvider>
  );
}
