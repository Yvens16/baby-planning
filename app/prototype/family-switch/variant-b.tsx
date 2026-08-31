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
  draftsByFamily,
  showDelivered,
  actions,
}: {
  families: Family[];
  current: Family;
  sheet: Sheet;
  draftTitle: string;
  dirty: boolean;
  pendingId: string | null;
  draftsByFamily: Record<string, string>;
  showDelivered: boolean;
  actions: HostActions;
}) {
  const [picker, setPicker] = useState(false);

  function requestSwitch(id: string) {
    if (id === current.id) {
      setPicker(false);
      return;
    }
    if (sheet.mode !== "closed" && dirty) {
      actions.askStash(id);
      return;
    }
    setPicker(false);
    actions.switchNow(id, "stash");
  }

  const pending = families.find((f) => f.id === pendingId);

  return (
    <Phone>
      <header className="relative z-40 border-b border-stone-200 bg-[#faf7f2] px-4 pt-5 pb-3">
        <p className="text-xs text-stone-500">Marie</p>
        <button
          type="button"
          onClick={() => setPicker(true)}
          className="mt-1 flex w-full items-start justify-between gap-2 text-left"
        >
          <div>
            <h1 className="text-2xl leading-7 font-semibold tracking-tight">
              {current.name}
            </h1>
            <p className="mt-1 text-sm text-stone-500">
              {current.tzLabel} · {babyLine(current)}
            </p>
          </div>
          <span className="mt-1 text-stone-400">▾</span>
        </button>
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
              {families.map((f) => {
                const draft = draftsByFamily[f.id];
                return (
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
                      {draft ? (
                        <p className="mt-2 text-xs text-amber-800">
                          Brouillon gardé : « {draft} »
                        </p>
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 space-y-1 border-t border-stone-100 pt-3 text-sm text-stone-400">
              <p>+ Créer une famille (hors ticket)</p>
              <p>Rejoindre avec un lien (hors ticket)</p>
            </div>
          </div>
        </div>
      )}
      {pending && (
        <Confirm
          title="Garder le brouillon ?"
          body={`« ${draftTitle || "sans titre"} » peut rester sur ${current.name}. Tu le retrouves en revenant.`}
          cancel="Rester"
          confirm="Garder"
          onCancel={actions.clearPending}
          onConfirm={() => {
            setPicker(false);
            actions.switchNow(pending.id, "stash");
          }}
          tertiary={{
            label: "Jeter",
            onClick: () => {
              setPicker(false);
              actions.switchNow(pending.id, "discard");
            },
          }}
        />
      )}
    </Phone>
  );
}
