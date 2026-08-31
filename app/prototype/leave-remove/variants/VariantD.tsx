"use client";

// Winner: Réglages chrome (B) + small modal for leave/remove (A) +
// full-screen last-Operator review with N/M counts only (B minus type-to-confirm).

import { useState } from "react";
import {
  Banner,
  FamilyMeta,
  FilterChips,
  ReminderCards,
  ZeroFamilyStub,
} from "../home";
import {
  currentFamily,
  isLastOperator,
  personalRemindersOf,
  type Family,
  type Operator,
  type Session,
} from "../model";

export const variantName = "Gagnant — réglages + modale";

type Screen = "home" | "settings" | "end";

type Confirm =
  | { kind: "leave"; family: Family }
  | { kind: "remove"; family: Family; operator: Operator };

export function VariantD({
  session,
  onLeave,
  onRemove,
  onSwitch,
  onDismissBanner,
}: {
  session: Session;
  onLeave: (familyId: string) => void;
  onRemove: (familyId: string, operatorId: string) => void;
  onSwitch: (familyId: string) => void;
  onDismissBanner: () => void;
}) {
  const [screen, setScreen] = useState<Screen>("home");
  const [picker, setPicker] = useState(false);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const family = currentFamily(session);

  if (!family) {
    return (
      <div className="min-h-dvh bg-[#f4efe6] text-[#2a2118]">
        <ZeroFamilyStub endedName={session.lastTargetName} tone="doors" />
      </div>
    );
  }

  const last = isLastOperator(family);
  const canSwitch = session.families.length > 1;

  if (screen === "end" && confirm?.kind === "leave") {
    return (
      <div className="min-h-dvh bg-stone-50 text-stone-900">
        <div className="mx-auto max-w-lg px-5 pb-28 pt-8">
          <button
            type="button"
            onClick={() => {
              setScreen("settings");
              setConfirm(null);
            }}
            className="text-left text-sm text-stone-500"
          >
            ← Retour
          </button>
          <p className="mt-6 text-xs uppercase tracking-wide text-red-800">
            Dernière opératrice
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Terminer {confirm.family.name}
          </h1>
          <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-red-950">
            {confirm.family.babies.length} bébé
            {confirm.family.babies.length > 1 ? "s" : ""} ·{" "}
            {confirm.family.reminders.length} rappel
            {confirm.family.reminders.length > 1 ? "s" : ""} — tout est
            supprimé.
          </p>
          <section className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-red-800">
              Disparaît
            </h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
              <li>
                {confirm.family.babies.length} bébé
                {confirm.family.babies.length > 1 ? "s" : ""}
              </li>
              <li>
                {confirm.family.reminders.length} rappel
                {confirm.family.reminders.length > 1 ? "s" : ""} (perso et
                partagés)
              </li>
              <li>Types de rappel et invitation</li>
            </ul>
          </section>
          <button
            type="button"
            onClick={() => {
              onLeave(confirm.family.id);
              setConfirm(null);
              setScreen("home");
            }}
            className="mt-10 w-full rounded-xl bg-red-800 py-3 text-sm text-white"
          >
            Terminer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-stone-100 text-stone-900">
      {screen === "settings" ? (
        <>
          <header className="border-b border-stone-200 bg-white">
            <div className="mx-auto flex max-w-lg items-center gap-3 px-4 py-3">
              <button type="button" onClick={() => setScreen("home")}>
                ←
              </button>
              <div>
                <p className="text-xs text-stone-500">Réglages</p>
                <p className="font-semibold">{family.name}</p>
              </div>
            </div>
          </header>
          <main className="mx-auto max-w-lg px-4 pb-32 pt-6">
            <FamilyMeta family={family} />
            <h2 className="mt-6 text-xs font-semibold uppercase tracking-wide text-stone-500">
              Opératrices
            </h2>
            <ul className="mt-2 overflow-hidden rounded-2xl bg-white ring-1 ring-stone-200">
              {family.operators.map((op) => (
                <li
                  key={op.id}
                  className="flex items-center justify-between border-b border-stone-100 px-4 py-3 last:border-0"
                >
                  <span>
                    {op.name}
                    {op.id === session.meId ? " · vous" : ""}
                  </span>
                  {op.id !== session.meId && (
                    <button
                      type="button"
                      onClick={() =>
                        setConfirm({ kind: "remove", family, operator: op })
                      }
                      className="text-sm text-red-800"
                    >
                      Retirer
                    </button>
                  )}
                </li>
              ))}
            </ul>
            <section className="mt-10 rounded-2xl border border-red-200 bg-red-50 p-4">
              <h2 className="font-semibold text-red-950">Zone sensible</h2>
              <p className="mt-1 text-sm text-red-900/80">
                {last
                  ? "Vous êtes seule ici. Quitter termine la famille."
                  : "Quitter n’efface pas la famille. Les autres restent."}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (last) {
                    setConfirm({ kind: "leave", family });
                    setScreen("end");
                  } else {
                    setConfirm({ kind: "leave", family });
                  }
                }}
                className="mt-4 w-full rounded-xl bg-red-800 py-2.5 text-sm text-white"
              >
                {last ? "Terminer cette famille" : "Quitter cette famille"}
              </button>
            </section>
          </main>
        </>
      ) : (
        <>
          <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100/90 backdrop-blur">
            <div className="mx-auto flex max-w-lg items-start justify-between px-4 py-3">
              <div>
                {canSwitch ? (
                  <button
                    type="button"
                    onClick={() => setPicker(true)}
                    className="text-left"
                  >
                    <p className="text-2xl font-semibold">{family.name} ⌄</p>
                  </button>
                ) : (
                  <p className="text-2xl font-semibold">{family.name}</p>
                )}
                <p className="mt-1 text-xs text-stone-500">{session.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setScreen("settings")}
                className="rounded-full border border-stone-300 bg-white px-3 py-1 text-sm"
              >
                Réglages
              </button>
            </div>
            <div className="mx-auto max-w-lg px-4 pb-3">
              <FilterChips />
            </div>
          </header>
          {session.banner && (
            <Banner text={session.banner} onDismiss={onDismissBanner} />
          )}
          <main className="mx-auto max-w-lg px-4 pb-32 pt-5">
            <ReminderCards reminders={family.reminders} />
          </main>
        </>
      )}

      {picker && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setPicker(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-24 pt-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
            <h2 className="text-lg font-semibold">Changer de famille</h2>
            <ul className="mt-3 space-y-1">
              {session.families.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onSwitch(item.id);
                      setPicker(false);
                    }}
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-stone-100"
                  >
                    {item.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {confirm && screen !== "end" && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5"
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {confirm.kind === "leave" ? (
              <>
                <h3 className="text-2xl font-semibold">
                  Quitter {confirm.family.name} ?
                </h3>
                <p className="mt-3 text-sm text-stone-600">
                  La famille continue. Vos rappels perso disparaissent (
                  {personalRemindersOf(confirm.family, session.meId).length}
                  ). L’invitation en cours n’est plus valable.
                </p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold">
                  Retirer {confirm.operator.name} ?
                </h3>
                <p className="mt-3 text-sm text-stone-600">
                  {confirm.operator.name} quitte {confirm.family.name}. Ses
                  rappels perso disparaissent (
                  {
                    personalRemindersOf(confirm.family, confirm.operator.id)
                      .length
                  }
                  ). L’invitation en cours n’est plus valable. Pas d’avis.
                </p>
              </>
            )}
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="flex-1 rounded-full border border-stone-300 py-2 text-sm"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm.kind === "leave") onLeave(confirm.family.id);
                  else onRemove(confirm.family.id, confirm.operator.id);
                  setConfirm(null);
                  setScreen("home");
                }}
                className="flex-1 rounded-full bg-red-800 py-2 text-sm text-white"
              >
                {confirm.kind === "leave" ? "Quitter" : "Retirer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
