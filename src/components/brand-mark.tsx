import Link from "next/link";
import { ActivitySquare } from "lucide-react";

export function BrandMark() {
  return (
    <Link href="/" className="flex items-center gap-3" aria-label="Leadi" title="Leadi">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-white shadow-soft">
        <ActivitySquare size={22} aria-hidden="true" />
      </span>
      <span className="text-xl font-semibold tracking-normal text-ink">
        Leadi
      </span>
    </Link>
  );
}
