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

export const variantBName = "Sélecteur fiche";

export function VariantB({
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
  const [picker, setPicker] = useState(false);
  const canSwitch = families.length > 1;

  function requestSwitch(id: string) {
    if (id === current.id) {
      setPicker(false);
      return;
    }
    if (sheet.mode !== "closed" && dirty) {
      actions.askDiscard(id);
      return;
    }
    setPicker(false);
    actions.switchNow(id, "discard");
  }

  const pending = families.find((f) => f.id === pendingId);

  return (
    <Phone>
      <header className="relative z-40 border-b border-stone-200 bg-[#faf7f2] px-4 pt-5 pb-3">
        <p className="text-xs text-stone-500">Marie</p>
        {canSwitch ? (
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="mt-1 flex w-full items-start justify-between gap-2 text-left"
          >
            <Title current={current} />
            <span className="mt-1 text-stone-400">▾</span>
          </button>
        ) : (
          <div className="mt-1">
            <Title current={current} />
          </div>
        )}
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
      {picker && (
        <div className="absolute inset-0 z-30 flex flex-col justify-end bg-stone-900/40">
          <div className="max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Choisir une famille</h2>
              <button
                type="button"
                className="text-sm text-stone-500"
                onClick={() => setPicker(false)}
              >
                Fermer
              </button>
            </div>
            <ul className="space-y-2">
              {families.map((f) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => requestSwitch(f.id)}
                    className="w-full rounded-2xl p-4 text-left ring-1 ring-stone-200 hover:bg-stone-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900">
                        {f.name}
                      </span>
                      {f.id === current.id && (
                        <span className="text-sm text-teal-700">actuelle</span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-stone-500">
                      {f.tzLabel} · {babyLine(f)} · {f.operators.length}{" "}
                      {f.operators.length > 1 ? "opérateurs" : "opérateur"}
                      {f.inviteLive ? " · lien d’invite vivant" : ""}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {pending && (
        <Confirm
          title="Quitter le brouillon ?"
          body={`Changer pour ${pending.name} jette le rappel en cours. Rien n’est gardé.`}
          cancel="Rester"
          confirm="Changer"
          onCancel={actions.clearPending}
          onConfirm={() => {
            setPicker(false);
            actions.switchNow(pending.id, "discard");
          }}
        />
      )}
    </Phone>
  );
}

function Title({ current }: { current: Family }) {
  return (
    <div>
      <h1 className="text-2xl leading-7 font-semibold tracking-tight">
        {current.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {current.tzLabel} · {babyLine(current)}
      </p>
    </div>
  );
}
