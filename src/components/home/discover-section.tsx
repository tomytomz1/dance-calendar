import Link from "next/link";
import { ArrowRight, MapPin, Mail } from "lucide-react";
import { EmailSubscribe } from "@/components/home/email-subscribe";
import { cityPath } from "@/lib/seo";

interface DiscoverSectionProps { cities: string[]; }
export function DiscoverSection({ cities }: DiscoverSectionProps) {
  return (
    <section id="discover" className="relative overflow-hidden border-y border-white/10 bg-[#151220]">
      <div className="absolute inset-y-0 left-0 w-full bg-[url('/dance/detroit-skyline.webp')] bg-cover bg-center opacity-25" aria-hidden="true" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#10101D] via-[#10101D]/90 to-[#161122]/70" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:px-8 lg:grid-cols-[1fr_420px] lg:items-center lg:px-10">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.2em] text-[#FF9189]">Your city. Your dance floor.</p>
          <h2 className="mt-3 font-display text-4xl font-extrabold tracking-tight text-[#FFF1E5]">Discover by city</h2>
          <p className="mt-3 text-base text-[#E0D0DE]">Find socials, parties, and classes in communities across Michigan.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {cities.length === 0 && <Link href="/events" className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm text-white">Explore all Michigan events <ArrowRight size={14}/></Link>}
            {cities.map(city=><Link key={city} href={cityPath(city)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-[#B58EB0] bg-[#17111E]/65 px-4 py-2 text-sm font-semibold text-[#FFF1E5] hover:border-[#F46157] hover:bg-[#F46157]/20"><MapPin size={14} className="text-[#FF8179]"/>{city}</Link>)}
            <Link href="/events" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-[#F46157] px-4 py-2 text-sm font-semibold text-[#FF8179] hover:bg-[#F46157]/10">All cities <ArrowRight size={15}/></Link>
          </div>
        </div>
        <div className="rounded-2xl border border-[#925E86] bg-[linear-gradient(135deg,#6B385E,#251832)] p-6 shadow-xl">
          <div className="mb-3 flex items-center gap-3 text-[#FFF1E5]"><Mail size={28} className="text-[#FF8179]"/><h3 className="text-xl font-extrabold">Never miss a dance night.</h3></div>
          <p className="text-sm text-[#E6D4E2]">Get notified when new events are added. No account required.</p>
          <div className="[&>section]:my-4 [&>section]:border-white/15 [&>section]:bg-[#21192B]/75">
            <EmailSubscribe/>
          </div>
        </div>
      </div>
    </section>
  );
}
