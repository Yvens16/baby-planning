"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type VariantMeta = { key: string; name: string };

export function PrototypeSwitcher({ variants }: { variants: VariantMeta[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get("variant") ?? variants[0]?.key ?? "A";
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );
  const label = variants[index];

  function go(nextIndex: number) {
    const wrapped = (nextIndex + variants.length) % variants.length;
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", variants[wrapped].key);
    router.replace(`${pathname}?${params.toString()}`);
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") go(index - 1);
      if (event.key === "ArrowRight") go(index + 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, searchParams, pathname]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-violet-700 px-2 py-1.5 text-sm text-white shadow-lg shadow-violet-900/40">
        <button
          type="button"
          onClick={() => go(index - 1)}
          className="rounded-full px-2 py-1 hover:bg-white/15"
          aria-label="Variante précédente"
        >
          ←
        </button>
        <span className="min-w-52 text-center font-medium">
          {label?.key} ({label?.name})
        </span>
        <button
          type="button"
          onClick={() => go(index + 1)}
          className="rounded-full px-2 py-1 hover:bg-white/15"
          aria-label="Variante suivante"
        >
          →
        </button>
      </div>
    </div>
  );
}
