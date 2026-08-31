"use client";

import { useEffect, useRef, useState } from "react";
import type { Family } from "./mock-data";
import {
  Confirm,
  DraftSheet,
  Phone,
  ReminderFeed,
  babyLine,
  type Sheet,
} from "./host-ui";
import type { HostActions } from "./host-actions";

export const variantAName = "En-tête persistant";

export function VariantA({
  families,
  current,
  sheet,
  draftTitle,
  dirty,
  pendingId,
  showDelivered,
  actions,
}: {
  families: Family[];
  current: Family;
  sheet: Sheet;
  draftTitle: string;
  dirty: boolean;
  pendingId: string | null;
  showDelivered: boolean;
  actions: HostActions;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (wrap.current && !wrap.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function requestSwitch(id: string) {
    setOpen(false);
    if (id === current.id) return;
    if (sheet.mode !== "closed" && dirty) {
      actions.askDiscard(id);
      return;
    }
    actions.switchNow(id, "discard");
  }

  const pending = families.find((f) => f.id === pendingId);

  return (
    <Phone>
      <header className="relative z-40 flex items-center justify-between gap-3 border-b border-stone-200 bg-white px-3 py-2.5">
        <div className="relative min-w-0" ref={wrap}>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex max-w-[16rem] items-center gap-1 truncate rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold text-stone-900"
          >
            <span className="truncate">{current.name}</span>
            <span className="text-stone-400">▾</span>
          </button>
          {open && (
            <div className="absolute top-full left-0 mt-1 w-64 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-stone-200">
              {families.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => requestSwitch(f.id)}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span
                    className={
                      f.id === current.id
                        ? "font-semibold text-stone-900"
                        : "text-stone-700"
                    }
                  >
                    {f.name}
                  </span>
                  {f.id === current.id && (
                    <span className="text-teal-700">●</span>
                  )}
                </button>
              ))}
              <div className="mt-1 border-t border-stone-100 px-3 py-2 text-xs text-stone-400">
                + Nouvelle famille (hors ticket)
              </div>
            </div>
          )}
        </div>
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-stone-800 text-xs font-bold text-white">
          M
        </span>
      </header>
      <p className="px-4 pt-2 text-xs text-stone-500">
        {current.tzLabel} · {babyLine(current)}
      </p>
      <ReminderFeed
        family={current}
        showDelivered={showDelivered}
        onShowDelivered={actions.setShowDelivered}
        onOpenAdd={actions.openAdd}
        onOpenEdit={actions.openEdit}
      />
      <DraftSheet
        family={current}
        sheet={sheet}
        title={draftTitle}
        onTitle={actions.setDraftTitle}
        onClose={actions.closeSheet}
      />
      {pending && (
        <Confirm
          title="Quitter le brouillon ?"
          body={`Changer pour ${pending.name} jette le rappel en cours. Rien n’est gardé.`}
          cancel="Rester"
          confirm="Changer"
          onCancel={actions.clearPending}
          onConfirm={() => actions.switchNow(pending.id, "discard")}
        />
      )}
    </Phone>
  );
}
