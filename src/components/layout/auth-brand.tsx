import Image from "next/image";
import Link from "next/link";

export function AuthBrand() {
  return (
    <Link href="/" className="mb-4 flex justify-center" aria-label="Michigan Dance Life home">
      <Image
        src="/brand/logo-on-dark.svg"
        alt="Michigan Dance Life"
        width={233}
        height={41}
        className="h-10 w-auto"
        priority
      />
    </Link>
  );
}
