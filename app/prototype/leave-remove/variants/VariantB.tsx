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

export const variantName = "Réglages plein écran";

type Screen = "home" | "settings" | "review";

type Review =
  | { kind: "leave"; family: Family }
  | { kind: "remove"; family: Family; operator: Operator };

export function VariantB({
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
  const [review, setReview] = useState<Review | null>(null);
  const [typed, setTyped] = useState("");
  const family = currentFamily(session);

  if (!family) {
    return (
      <div className="min-h-dvh bg-stone-100 text-stone-900">
        <ZeroFamilyStub endedName={session.lastTargetName} tone="stack" />
      </div>
    );
  }

  const last = isLastOperator(family);
  const canSwitch = session.families.length > 1;

  if (screen === "review" && review) {
    const ending = review.kind === "leave" && last;
    const nameOk = !ending || typed.trim() === review.family.name;
    const stays =
      review.kind === "leave" && !last
        ? [
            "Bébés et types de rappel",
            "Rappels partagés",
            `${others(review.family)
              .map((o) => o.name)
              .join(", ")} restent`,
          ]
        : review.kind === "remove"
          ? [
              "La famille continue",
              "Bébés et rappels partagés",
              "Vous restez opératrice",
            ]
          : [];
    const goes =
      review.kind === "leave" && !last
        ? [
            `Vos ${personalRemindersOf(review.family, session.meId).length} rappels perso`,
            "L’invitation en cours",
            "Votre accès à cette famille",
          ]
        : review.kind === "remove"
          ? [
              `${review.operator.name} (plus d’accès)`,
              `${personalRemindersOf(review.family, review.operator.id).length} rappels perso de ${review.operator.name}`,
              "L’invitation en cours",
            ]
          : [
              `${review.family.babies.length} bébés : ${review.family.babies.map((b) => b.name).join(", ")}`,
              `${review.family.reminders.length} rappels (perso et partagés)`,
              "Types de rappel et invitation",
            ];

    return (
      <div className="min-h-dvh bg-stone-50 text-stone-900">
        <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-5 pb-28 pt-8">
          <button
            type="button"
            onClick={() => {
              setScreen("settings");
              setTyped("");
            }}
            className="text-left text-sm text-stone-500"
          >
            ← Retour
          </button>
          <p className="mt-6 text-xs uppercase tracking-wide text-red-800">
            {ending ? "Dernière opératrice" : "À confirmer"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            {ending
              ? `Terminer ${review.family.name}`
              : review.kind === "leave"
                ? `Quitter ${review.family.name}`
                : `Retirer ${review.operator.name}`}
          </h1>
          {ending && (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-red-950">
              {review.family.babies.length} bébés ·{" "}
              {review.family.reminders.length} rappels — tout est supprimé.
            </p>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {stays.length > 0 && (
              <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                  Reste
                </h2>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                  {stays.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </section>
            )}
            <section className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-red-800">
                Disparaît
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">
                {goes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          </div>

          {ending && (
            <label className="mt-8 block text-sm font-medium">
              Tapez {review.family.name} pour confirmer
              <input
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2"
                placeholder={review.family.name}
              />
            </label>
          )}

          <button
            type="button"
            disabled={!nameOk}
            onClick={() => {
              if (review.kind === "leave") onLeave(review.family.id);
              else onRemove(review.family.id, review.operator.id);
              setReview(null);
              setScreen("home");
              setTyped("");
            }}
            className="mt-auto w-full rounded-xl bg-red-800 py-3 text-sm text-white disabled:bg-stone-300"
          >
            {ending
              ? "Supprimer définitivement"
              : review.kind === "leave"
                ? "Quitter"
                : `Retirer ${review.operator.name}`}
          </button>
        </div>
      </div>
    );
  }

  if (screen === "settings") {
    return (
      <div className="min-h-dvh bg-stone-50 text-stone-900">
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
                    onClick={() => {
                      setReview({ kind: "remove", family, operator: op });
                      setScreen("review");
                    }}
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
                setReview({ kind: "leave", family });
                setScreen("review");
              }}
              className="mt-4 w-full rounded-xl bg-red-800 py-2.5 text-sm text-white"
            >
              {last ? "Terminer cette famille" : "Quitter cette famille"}
            </button>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-stone-100 text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-start justify-between px-4 py-3">
          <div>
            {canSwitch ? (
              <button type="button" onClick={() => setPicker(true)} className="text-left">
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
    </div>
  );
}
