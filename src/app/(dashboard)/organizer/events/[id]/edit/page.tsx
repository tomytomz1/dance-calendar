import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EventForm } from "@/components/events/event-form";

interface EditEventPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: EditEventPageProps) {
  const session = await auth();
  const { id } = await params;

  if (!session) {
    redirect(`/login?callbackUrl=/organizer/events/${id}/edit`);
  }

  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      recurrenceRule: true,
    },
  });

  if (!event) {
    notFound();
  }

  const isOwner = event.organizerId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isAdmin) {
    redirect("/organizer/events");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Edit Event</h1>
        <p className="text-muted-foreground">
          Update your event details below
        </p>
      </div>
      <EventForm event={event} mode="edit" />
    </div>
  );
}
