import Link from "next/link";
import { CalendarDays } from "lucide-react";

/** Empty state under the phone calendar grid when the visible month/week has no events. */
export function MobileAgendaEmpty({
  label,
  period = "month",
}: {
  label: string;
  period?: "month" | "week";
}) {
  return (
    <div className="rounded-xl border border-[#694E65] bg-[#1C1623] p-5 text-center">
      <CalendarDays className="mx-auto mb-2 text-[#FF8179]" size={26} aria-hidden="true" />
      <p className="font-semibold text-[#FFF1E5]">{label}</p>
      <p className="mt-1 text-sm text-[#D2C0D0]">
        Swipe to another {period}, or{" "}
        <Link href="/events" className="font-semibold text-[#FF8179] underline underline-offset-4">
          see all upcoming events
        </Link>
        .
      </p>
    </div>
  );
}
