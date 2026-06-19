'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiRequest } from '../../../lib/api';
import { useSessionStore } from '../../../store/session.store';

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const session = useSessionStore((s) => s.session);
  const [event, setEvent] = useState<any>();
  useEffect(() => {
    if (session)
      apiRequest(`/events/${eventId}`, {}, session.accessToken).then(setEvent);
  }, [eventId, session]);
  return (
    <main className="mx-auto max-w-4xl px-5 py-12">
      {event ? (
        <>
          <h1 className="text-3xl font-semibold">
            {event.eventName || 'Catering event'}
          </h1>
          <p className="mt-3 text-muted-foreground">
            {new Date(event.eventDate).toLocaleDateString()} ·{' '}
            {event.guestCount} guests · {event.status}
          </p>
        </>
      ) : (
        'Loading event...'
      )}
    </main>
  );
}
