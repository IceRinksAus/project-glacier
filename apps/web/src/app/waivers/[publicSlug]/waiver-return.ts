interface BookingCredential {
  bookingId: string;
  publicAccessToken: string;
}

export function buildWaiverReturnAction(
  eventSlug: string,
  bookingCredential: BookingCredential | null,
) {
  if (bookingCredential) {
    return {
      href: `/booking-access/${encodeURIComponent(bookingCredential.bookingId)}#access=${encodeURIComponent(bookingCredential.publicAccessToken)}`,
      label: "Return to your booking",
    };
  }

  return {
    href: `/event/${encodeURIComponent(eventSlug)}`,
    label: "Return to the Event website",
  };
}
