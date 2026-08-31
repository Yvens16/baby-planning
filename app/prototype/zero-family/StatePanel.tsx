"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { Session } from "./model";
import { STUB_INVITES } from "./model";

export function StatePanel({
  session,
  onReset,
}: {
  session: Session;
  onReset: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setScene(scene: "first" | "left") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scene", scene);
    router.replace(`${pathname}?${params.toString()}`);
    onReset();
  }

  return (
    <aside className="fixed left-3 top-3 z-40 max-w-72 rounded-lg border border-amber-300 bg-amber-50/95 p-3 font-mono text-[11px] leading-relaxed text-amber-950 shadow-sm">
      <p className="mb-1 font-sans text-[10px] font-semibold uppercase tracking-wide text-amber-800">
        Prototype state (not part of the design)
      </p>
      <pre className="whitespace-pre-wrap">
        {JSON.stringify(
          {
            email: session.email,
            scene: session.scene,
            families: session.families,
            lastAction: session.lastAction,
            pendingJoin: session.pendingJoin,
          },
          null,
          2,
        )}
      </pre>
      <p className="mt-2 font-sans text-[10px] text-amber-800">
        Invites:{" "}
        <code>…/join/{STUB_INVITES.valid.token}</code> (ok) ·{" "}
        <code>…/join/{STUB_INVITES.consumed.token}</code> (consumed)
      </p>
      <div className="mt-2 flex flex-wrap gap-1 font-sans">
        <button
          type="button"
          onClick={() => setScene("first")}
          className={`rounded px-2 py-0.5 ${session.scene === "first" ? "bg-amber-900 text-amber-50" : "bg-white"}`}
        >
          scene: first
        </button>
        <button
          type="button"
          onClick={() => setScene("left")}
          className={`rounded px-2 py-0.5 ${session.scene === "left" ? "bg-amber-900 text-amber-50" : "bg-white"}`}
        >
          scene: left
        </button>
        <button
          type="button"
          onClick={onReset}
          className="rounded bg-white px-2 py-0.5"
        >
          reset
        </button>
      </div>
    </aside>
  );
}
