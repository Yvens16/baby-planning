"use client";

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
  others,
  personalRemindersOf,
  type Family,
  type Operator,
  type Session,
} from "../model";

export const variantName = "Sélecteur + modale";

type Sheet = "none" | "picker";
type Confirm =
  | { kind: "leave"; family: Family }
  | { kind: "remove"; family: Family; operator: Operator }
  | null;

export function VariantA({
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
  const [sheet, setSheet] = useState<Sheet>("none");
  const [confirm, setConfirm] = useState<Confirm>(null);
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

  return (
    <div className="relative min-h-dvh bg-[#f4efe6] text-[#2a2118]">
      <header className="sticky top-0 z-10 border-b border-[#e6dccb] bg-[#f4efe6]/90 backdrop-blur">
        <div className="mx-auto max-w-lg px-4 py-3">
          <button
            type="button"
            onClick={() => setSheet("picker")}
            className="text-left"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-[#8a6d4d]">
              {session.email}
            </p>
            <p className="mt-0.5 font-serif text-3xl leading-tight">
              {family.name}{" "}
              <span className="text-xl text-[#8a6d4d]">⌄</span>
            </p>
          </button>
          <div className="mt-3">
            <FilterChips />
          </div>
        </div>
      </header>

      {session.banner && (
        <Banner text={session.banner} onDismiss={onDismissBanner} />
      )}

      <main className="mx-auto max-w-lg px-4 pb-32 pt-5">
        <ReminderCards reminders={family.reminders} />
      </main>

      {sheet === "picker" && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSheet("none")}
        >
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-[#fffaf3] px-5 pb-28 pt-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d8cbb8]" />
            <h2 className="font-serif text-2xl">{family.name}</h2>
            <FamilyMeta family={family} />

            {canSwitch && (
              <div className="mt-5">
                <p className="text-xs uppercase tracking-wide text-[#8a6d4d]">
                  Changer de famille
                </p>
                <ul className="mt-2 space-y-1">
                  {session.families.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitch(item.id);
                          setSheet("none");
                        }}
                        className={`w-full rounded-xl px-3 py-2 text-left ${
                          item.id === family.id ? "bg-[#efe4d4]" : "hover:bg-[#f7f0e6]"
                        }`}
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-6">
              <p className="text-xs uppercase tracking-wide text-[#8a6d4d]">
                Opératrices
              </p>
              <ul className="mt-2 divide-y divide-[#efe4d4]">
                {family.operators.map((op) => (
                  <li
                    key={op.id}
                    className="flex items-center justify-between py-3"
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
            </div>

            <button
              type="button"
              onClick={() => setConfirm({ kind: "leave", family })}
              className="mt-6 w-full py-2 text-sm text-red-800"
            >
              Quitter cette famille
            </button>
          </div>
        </div>
      )}

      {confirm && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 px-5"
          onClick={() => setConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            {confirm.kind === "leave" ? (
              last ? (
                <>
                  <h3 className="font-serif text-2xl">
                    Terminer {confirm.family.name} ?
                  </h3>
                  <p className="mt-3 text-sm text-stone-600">
                    Vous êtes la dernière opératrice. Cette action supprime la
                    famille : {confirm.family.babies.length} bébé
                    {confirm.family.babies.length > 1 ? "s" : ""} et{" "}
                    {confirm.family.reminders.length} rappel
                    {confirm.family.reminders.length > 1 ? "s" : ""}.
                  </p>
                  <p className="mt-2 text-sm text-stone-600">
                    Pas de retour. Pas d’avis aux autres — il n’y en a plus.
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-serif text-2xl">
                    Quitter {confirm.family.name} ?
                  </h3>
                  <p className="mt-3 text-sm text-stone-600">
                    La famille continue. Vos rappels perso disparaissent (
                    {personalRemindersOf(confirm.family, session.meId).length}
                    ). L’invitation en cours n’est plus valable.
                  </p>
                </>
              )
            ) : (
              <>
                <h3 className="font-serif text-2xl">
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
                  setSheet("none");
                }}
                className="flex-1 rounded-full bg-red-800 py-2 text-sm text-white"
              >
                {confirm.kind === "leave"
                  ? last
                    ? "Terminer"
                    : "Quitter"
                  : "Retirer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
