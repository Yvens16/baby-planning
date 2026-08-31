"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { currentFamily, type Scene, type Session } from "./model";

export function StatePanel({
  session,
  scene,
  onReset,
}: {
  session: Session;
  scene: Scene;
  onReset: () => void;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const family = currentFamily(session);

  function setScene(next: Scene) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scene", next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  const summary = `${scene} · ${session.families.length} fam · ${session.lastAction}`;

  return (
    <aside className="fixed bottom-20 left-3 z-40 max-w-[min(22rem,calc(100vw-1.5rem))] font-sans text-[11px] text-amber-950">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1.5 font-medium shadow-sm"
      >
        State: {summary}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50/95 p-3 shadow-sm">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-amber-800">
            Prototype state (not part of the design)
          </p>
          <pre className="font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
            {JSON.stringify(
              {
                current: family?.name ?? "zero-family",
                families: session.families.map((f) => ({
                  name: f.name,
                  operators: f.operators.map((o) => o.name),
                  babies: f.babies.length,
                  reminders: f.reminders.length,
                  inviteValid: f.inviteValid,
                })),
                lastAction: session.lastAction,
                lastTargetName: session.lastTargetName,
                banner: session.banner,
              },
              null,
              2,
            )}
          </pre>
          <div className="mt-2 flex flex-wrap gap-1">
            {(
              [
                ["multi", "2 ops + 2 fam"],
                ["last-op", "dernière ici"],
                ["last-family", "dernière fam"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setScene(key)}
                className={`rounded px-2 py-0.5 ${scene === key ? "bg-amber-900 text-amber-50" : "bg-white"}`}
              >
                {label}
              </button>
            ))}
            <button
              type="button"
              onClick={onReset}
              className="rounded bg-white px-2 py-0.5"
            >
              reset
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
