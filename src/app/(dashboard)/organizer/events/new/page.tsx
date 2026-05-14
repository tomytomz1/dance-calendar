import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage() {
  const session = await auth();

  if (!session) {
    redirect("/login?callbackUrl=/organizer/events/new");
  }

  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  if (!session.user.verified && session.user.role !== "ADMIN") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold mb-4">Account Pending Approval</h1>
        <p className="text-muted-foreground">
          Your organizer account is pending admin approval. You&apos;ll be able to
          create events once approved.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Create New Event</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new dance event
        </p>
      </div>
      <EventForm mode="create" />
    </div>
  );
}
