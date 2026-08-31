"use client";

import { useState } from "react";
import type { Session } from "../model";
import {
  browserTimezone,
  lookupInvite,
  timezoneOptions,
  validateFamilyName,
} from "../model";

export const variantName = "Empty app shell";

type Sheet = "none" | "create" | "join";

export function VariantC({
  session,
  onCreate,
  onPreviewJoin,
  onConfirmJoin,
  onCancelJoin,
}: {
  session: Session;
  onCreate: (name: string, timezone: string) => void;
  onPreviewJoin: (input: string) => void;
  onConfirmJoin: () => void;
  onCancelJoin: () => void;
}) {
  const [sheet, setSheet] = useState<Sheet>("none");
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(browserTimezone);
  const [invite, setInvite] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const current = session.families[0];
  const first = session.scene === "first";

  function open(next: Sheet) {
    setSheet(next);
    setNameError(null);
    setJoinError(null);
    if (next !== "join") onCancelJoin();
  }

  return (
    <div className="relative min-h-dvh bg-[#f7f4ef] text-stone-900">
      <header className="sticky top-0 z-10 border-b border-stone-200 bg-[#f7f4ef]/90 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-between px-4 py-3">
          <div>
            <p className="text-xs text-stone-500">{session.email}</p>
            <p className="text-base font-semibold">
              {current ? current.name : "Aucune famille"}
            </p>
          </div>
          {!current && (
            <button
              type="button"
              onClick={() => open("join")}
              className="rounded-full border border-stone-300 px-3 py-1 text-sm"
            >
              Rejoindre
            </button>
          )}
        </div>
        <div className="mx-auto flex max-w-lg gap-2 px-4 pb-3">
          <span className="rounded-full bg-stone-900 px-3 py-1 text-xs text-white">
            À venir
          </span>
          <span className="rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-500">
            Envoyés
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-4 pb-28 pt-10">
        {current ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center">
            <p className="text-lg font-medium">Aucun rappel</p>
            <p className="mt-2 text-sm text-stone-500">
              Famille prête. Les rappels s’ajoutent ici.
            </p>
          </div>
        ) : (
          <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-2xl">
              ⌂
            </div>
            <h1 className="text-xl font-semibold">
              {first ? "Chez vous, il manque une famille" : "Plus de famille"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500">
              {first
                ? "L’écran des rappels est vide tant qu’aucune famille n’existe. Créez-en une, ou collez un lien."
                : `Après ${session.leftFamilyName}, même écran : créer ou rejoindre.`}
            </p>
            <button
              type="button"
              onClick={() => open("create")}
              className="mt-6 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white"
            >
              Créer une famille
            </button>
            <button
              type="button"
              onClick={() => open("join")}
              className="mt-3 block w-full text-sm text-stone-600 underline"
            >
              J’ai un lien d’invitation
            </button>
          </div>
        )}
      </main>

      {!current && (
        <button
          type="button"
          onClick={() => open("create")}
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-stone-900 text-2xl text-white shadow-lg"
          aria-label="Créer une famille"
        >
          +
        </button>
      )}

      {sheet !== "none" && (
        <div className="fixed inset-0 z-30 bg-black/40" onClick={() => open("none")}>
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-5 pb-28 pt-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-stone-200" />
            {sheet === "create" ? (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const error = validateFamilyName(name);
                  setNameError(error);
                  if (!error) {
                    onCreate(name.trim(), timezone);
                    open("none");
                  }
                }}
              >
                <h2 className="text-lg font-semibold">Nouvelle famille</h2>
                <label className="mt-4 block text-sm">
                  Nom
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
                  />
                </label>
                {nameError && (
                  <p className="mt-2 text-sm text-red-700">{nameError}</p>
                )}
                <label className="mt-3 block text-sm">
                  Fuseau
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2"
                  >
                    {timezoneOptions().map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="submit"
                  className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-sm text-white"
                >
                  Créer
                </button>
              </form>
            ) : session.pendingJoin ? (
              <div>
                <h2 className="text-lg font-semibold">
                  Rejoindre {session.pendingJoin.name} ?
                </h2>
                <p className="mt-2 text-sm text-stone-500">
                  {session.pendingJoin.timezone}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmJoin();
                    open("none");
                  }}
                  className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-sm text-white"
                >
                  Rejoindre
                </button>
                <button
                  type="button"
                  onClick={onCancelJoin}
                  className="mt-2 w-full py-2 text-sm"
                >
                  Annuler
                </button>
              </div>
            ) : (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  const result = lookupInvite(invite);
                  if (result.status === "valid") {
                    setJoinError(null);
                    onPreviewJoin(invite);
                    return;
                  }
                  setJoinError(
                    result.status === "consumed"
                      ? "Invitation déjà utilisée. Demandez un nouveau lien."
                      : "Lien invalide.",
                  );
                }}
              >
                <h2 className="text-lg font-semibold">Coller le lien</h2>
                <input
                  value={invite}
                  onChange={(e) => setInvite(e.target.value)}
                  className="mt-4 w-full rounded-xl border border-stone-300 px-3 py-2"
                  placeholder="/join/famille-martin"
                />
                {joinError && (
                  <p className="mt-2 text-sm text-red-700">{joinError}</p>
                )}
                <button
                  type="submit"
                  className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-sm text-white"
                >
                  Continuer
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
