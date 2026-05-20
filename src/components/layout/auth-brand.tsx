import Image from "next/image";
import Link from "next/link";

export function AuthBrand() {
  return (
    <Link href="/" className="flex justify-center mb-4">
      <Image
        src="/michigandancelife-header-logo.png"
        alt="MichiganDance.Life"
        width={280}
        height={65}
        className="h-14 w-auto"
        priority
      />
    </Link>
  );
}
