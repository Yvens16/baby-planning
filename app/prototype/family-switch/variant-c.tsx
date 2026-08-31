"use client";

import { useState } from "react";
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

export const variantCName = "Famille = pièce";

export function VariantC({
  families,
  current,
  sheet,
  draftTitle,
  dirty,
  showDelivered,
  actions,
}: {
  families: Family[];
  current: Family;
  sheet: Sheet;
  draftTitle: string;
  dirty: boolean;
  showDelivered: boolean;
  actions: HostActions;
}) {
  const [view, setView] = useState<"room" | "hub">("room");
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  function goHub() {
    if (sheet.mode !== "closed" && dirty) {
      setLeaveConfirm(true);
      return;
    }
    if (sheet.mode !== "closed") actions.closeSheet();
    setView("hub");
    actions.log("sorti vers le hall des familles");
  }

  function enter(id: string) {
    actions.switchNow(id, "discard");
    setView("room");
    actions.log(`entré dans ${families.find((f) => f.id === id)?.name}`);
  }

  if (view === "hub") {
    return (
      <Phone>
        <header className="px-5 pt-8 pb-4">
          <p className="text-xs text-stone-500">Marie</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Tes familles
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            Tu entres dans une famille pour agir. Pas de changement en cours de
            route.
          </p>
        </header>
        <ul className="flex-1 space-y-2 overflow-y-auto px-4 pb-8">
          {families.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => enter(f.id)}
                className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200"
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{f.name}</span>
                  <span className="text-stone-400">→</span>
                </div>
                <p className="mt-1 text-sm text-stone-500">
                  {f.tzLabel} · {babyLine(f)} ·{" "}
                  {f.reminders.filter((r) => !r.delivered).length} à venir
                </p>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-stone-200 px-5 py-4 text-sm text-stone-400">
          + Créer une famille · Rejoindre avec un lien (hors ticket)
        </div>
      </Phone>
    );
  }

  return (
    <Phone>
      <header className="relative z-40 border-b border-stone-200 bg-[#faf7f2] px-3 py-2.5">
        <button
          type="button"
          onClick={goHub}
          className="text-sm font-medium text-teal-800"
        >
          ← Familles
        </button>
        <h1 className="mt-1 px-1 text-xl font-semibold">{current.name}</h1>
        <p className="px-1 text-xs text-stone-500">
          {current.tzLabel} · {babyLine(current)}
        </p>
      </header>
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
      {leaveConfirm && (
        <Confirm
          title="Abandonner le brouillon ?"
          body="Pour changer de famille, il faut d’abord quitter celle-ci. Le rappel en cours sera jeté."
          cancel="Rester"
          confirm="Abandonner"
          onCancel={() => setLeaveConfirm(false)}
          onConfirm={() => {
            setLeaveConfirm(false);
            actions.closeSheet();
            setView("hub");
            actions.log("brouillon jeté, sorti vers le hall");
          }}
        />
      )}
    </Phone>
  );
}
