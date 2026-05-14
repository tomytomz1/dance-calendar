import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login?callbackUrl=/organizer/events");
  if (session.user.role !== "ORGANIZER" && session.user.role !== "ADMIN") {
    redirect("/");
  }
  return <>{children}</>;
}
