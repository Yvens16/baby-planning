"use client";

import { useState } from "react";
import {
  Banner,
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

export const variantName = "Fiches + étapes";

type Sheet =
  | { kind: "me" }
  | { kind: "them"; operator: Operator }
  | { kind: "switch" }
  | null;

type Step = 1 | 2 | 3;

type Wizard =
  | { kind: "leave"; family: Family; step: Step }
  | { kind: "remove"; family: Family; operator: Operator; step: Step };

export function VariantC({
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
  const [sheet, setSheet] = useState<Sheet>(null);
  const [wizard, setWizard] = useState<Wizard | null>(null);
  const family = currentFamily(session);

  if (!family) {
    return (
      <div className="min-h-dvh bg-[#f7f4ef] text-stone-900">
        <header className="border-b border-stone-200 px-4 py-3">
          <p className="text-xs text-stone-500">{session.email}</p>
          <p className="font-semibold">Aucune famille</p>
          <div className="mt-3">
            <FilterChips />
          </div>
        </header>
        <ZeroFamilyStub endedName={session.lastTargetName} tone="shell" />
      </div>
    );
  }

  const last = isLastOperator(family);
  const canSwitch = session.families.length > 1;

  return (
    <div className="relative min-h-dvh bg-[#f7f4ef] text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#f7f4ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            {canSwitch ? (
              <button type="button" onClick={() => setSheet({ kind: "switch" })}>
                <p className="text-xl font-semibold">{family.name} ⌄</p>
              </button>
            ) : (
              <p className="text-xl font-semibold">{family.name}</p>
            )}
          </div>
          <div className="flex -space-x-2">
            {family.operators.map((op) => (
              <button
                key={op.id}
                type="button"
                title={op.name}
                onClick={() =>
                  setSheet(
                    op.id === session.meId
                      ? { kind: "me" }
                      : { kind: "them", operator: op },
                  )
                }
                className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-[#f7f4ef] ${
                  op.id === session.meId
                    ? "bg-stone-900 text-white"
                    : "bg-rose-200 text-rose-950"
                }`}
              >
                {op.name.slice(0, 1)}
              </button>
            ))}
          </div>
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

      {sheet && !wizard && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => setSheet(null)}
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-28 pt-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
            {sheet.kind === "switch" && (
              <>
                <h2 className="text-lg font-semibold">Familles</h2>
                <ul className="mt-3 space-y-1">
                  {session.families.map((item) => (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => {
                          onSwitch(item.id);
                          setSheet(null);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left hover:bg-stone-100"
                      >
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {sheet.kind === "me" && (
              <>
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  Vous
                </p>
                <h2 className="mt-1 text-2xl font-semibold">{session.meName}</h2>
                <p className="mt-2 text-sm text-stone-600">
                  {last
                    ? "Dernière opératrice de cette famille."
                    : `${family.operators.length} opératrices ici.`}
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setWizard({ kind: "leave", family, step: 1 })
                  }
                  className="mt-6 w-full rounded-full bg-red-800 py-2.5 text-sm text-white"
                >
                  Quitter {family.name}
                </button>
              </>
            )}
            {sheet.kind === "them" && (
              <>
                <p className="text-xs uppercase tracking-wide text-stone-500">
                  Opératrice
                </p>
                <h2 className="mt-1 text-2xl font-semibold">
                  {sheet.operator.name}
                </h2>
                <p className="mt-2 text-sm text-stone-600">
                  {
                    personalRemindersOf(family, sheet.operator.id).length
                  }{" "}
                  rappel perso dans {family.name}.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setWizard({
                      kind: "remove",
                      family,
                      operator: sheet.operator,
                      step: 1,
                    })
                  }
                  className="mt-6 w-full rounded-full bg-red-800 py-2.5 text-sm text-white"
                >
                  Retirer {sheet.operator.name}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {wizard && (
        <div className="fixed inset-0 z-40 bg-[#f7f4ef]">
          <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-28 pt-8">
            <p className="text-xs uppercase tracking-wide text-stone-500">
              Étape {wizard.step} / {wizard.kind === "leave" && last ? 3 : 2}
            </p>
            {wizard.kind === "leave" && wizard.step === 1 && (
              <>
                <h1 className="mt-3 text-3xl font-semibold">
                  {last
                    ? "Vous êtes la dernière"
                    : `Quitter ${wizard.family.name}`}
                </h1>
                <p className="mt-3 text-stone-600">
                  {last
                    ? "Personne d’autre n’appartient à cette famille. La quitter, c’est la terminer."
                    : "La famille continue sans vous. Ce n’est pas un effacement."}
                </p>
              </>
            )}
            {wizard.kind === "leave" && wizard.step === 2 && last && (
              <>
                <h1 className="mt-3 text-3xl font-semibold">Ce qui part</h1>
                <p className="mt-2 text-sm text-stone-500">
                  {wizard.family.babies.length} bébés ·{" "}
                  {wizard.family.reminders.length} rappels
                </p>
                <ul className="mt-5 space-y-2 text-sm">
                  {wizard.family.babies.map((baby) => (
                    <li key={baby.id} className="rounded-xl bg-white px-3 py-2">
                      Bébé · {baby.name}
                    </li>
                  ))}
                  {wizard.family.reminders.map((reminder) => (
                    <li
                      key={reminder.id}
                      className="rounded-xl bg-white px-3 py-2"
                    >
                      {reminder.type} · {reminder.title}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {wizard.kind === "leave" &&
              wizard.step === 2 &&
              !last && (
                <>
                  <h1 className="mt-3 text-3xl font-semibold">Confirmer</h1>
                  <p className="mt-3 text-stone-600">
                    Vos{" "}
                    {personalRemindersOf(wizard.family, session.meId).length}{" "}
                    rappels perso disparaissent. L’invitation n’est plus
                    valable. Les autres restent.
                  </p>
                </>
              )}
            {wizard.kind === "leave" && wizard.step === 3 && last && (
              <>
                <h1 className="mt-3 text-3xl font-semibold">
                  Terminer {wizard.family.name} ?
                </h1>
                <p className="mt-3 text-stone-600">
                  Dernière confirmation. Tout est supprimé. Pas de tombe.
                </p>
              </>
            )}
            {wizard.kind === "remove" && wizard.step === 1 && (
              <>
                <h1 className="mt-3 text-3xl font-semibold">
                  Retirer {wizard.operator.name}
                </h1>
                <p className="mt-3 text-stone-600">
                  {wizard.operator.name} perd l’accès à {wizard.family.name}.
                  Ses rappels perso partent. Pas d’avis — elle le verra en
                  ouvrant l’app.
                </p>
              </>
            )}
            {wizard.kind === "remove" && wizard.step === 2 && (
              <>
                <h1 className="mt-3 text-3xl font-semibold">
                  Confirmer {wizard.operator.name}
                </h1>
                <ul className="mt-4 space-y-2 text-sm">
                  {personalRemindersOf(wizard.family, wizard.operator.id).map(
                    (reminder) => (
                      <li
                        key={reminder.id}
                        className="rounded-xl bg-white px-3 py-2"
                      >
                        Perso qui part · {reminder.title}
                      </li>
                    ),
                  )}
                  <li className="rounded-xl bg-white px-3 py-2">
                    Invitation invalidée
                  </li>
                </ul>
              </>
            )}

            <div className="mt-auto flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (wizard.step === 1) setWizard(null);
                  else setWizard({ ...wizard, step: (wizard.step - 1) as Step });
                }}
                className="flex-1 rounded-full border border-stone-300 py-2.5 text-sm"
              >
                {wizard.step === 1 ? "Annuler" : "Retour"}
              </button>
              <button
                type="button"
                onClick={() => {
                  const max = wizard.kind === "leave" && last ? 3 : 2;
                  if (wizard.step < max) {
                    setWizard({ ...wizard, step: (wizard.step + 1) as Step });
                    return;
                  }
                  if (wizard.kind === "leave") onLeave(wizard.family.id);
                  else onRemove(wizard.family.id, wizard.operator.id);
                  setWizard(null);
                  setSheet(null);
                }}
                className="flex-1 rounded-full bg-red-800 py-2.5 text-sm text-white"
              >
                {wizard.step < (wizard.kind === "leave" && last ? 3 : 2)
                  ? "Continuer"
                  : wizard.kind === "leave"
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
