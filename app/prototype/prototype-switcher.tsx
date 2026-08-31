"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export const FAMILY_SWITCH_VARIANTS = {
  A: "En-tête persistant",
  B: "Sélecteur fiche",
  C: "Famille = pièce",
} as const;

export type FamilySwitchVariant = keyof typeof FAMILY_SWITCH_VARIANTS;

export const PUSH_PERMISSION_VARIANTS = {
  A: "Bandeau haut",
  B: "Bandeau pied",
  C: "Carte + pièce",
} as const;

export type PushPermissionVariant = keyof typeof PUSH_PERMISSION_VARIANTS;

export function PrototypeSwitcher({
  current,
  variants,
}: {
  current: string;
  variants: Record<string, string>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const keys = Object.keys(variants);
  const i = Math.max(0, keys.indexOf(current));
  const prev = keys[(i - 1 + keys.length) % keys.length];
  const next = keys[(i + 1) % keys.length];

  function hrefFor(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", v);
    return `${pathname}?${params.toString()}`;
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target;
      if (
        t instanceof HTMLElement &&
        (t.tagName === "INPUT" ||
          t.tagName === "TEXTAREA" ||
          t.tagName === "SELECT" ||
          t.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") router.replace(hrefFor(prev));
      if (e.key === "ArrowRight") router.replace(hrefFor(next));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-[80] flex justify-center px-3">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-violet-700 px-2 py-1.5 text-white shadow-lg shadow-violet-900/40">
        <Link
          href={hrefFor(prev)}
          aria-label="Variante précédente"
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          ←
        </Link>
        <div className="min-w-[11rem] text-center text-xs font-medium tracking-wide">
          {current} ({variants[current]})
        </div>
        <Link
          href={hrefFor(next)}
          aria-label="Variante suivante"
          className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
        >
          →
        </Link>
      </div>
    </div>
  );
}
