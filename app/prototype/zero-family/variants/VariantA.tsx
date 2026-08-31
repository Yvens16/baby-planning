"use client";

import { useState } from "react";
import type { Session } from "../model";
import {
  browserTimezone,
  lookupInvite,
  timezoneOptions,
  validateFamilyName,
} from "../model";

export const variantName = "Two doors";

type Sheet = "none" | "create" | "join";

export function VariantA({
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

  if (current) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-[#f4efe6] px-6 text-[#2a2118]">
        <p className="text-sm uppercase tracking-[0.2em] text-[#8a6d4d]">
          Vous y êtes
        </p>
        <h1 className="mt-3 font-serif text-4xl">{current.name}</h1>
        <p className="mt-2 text-[#6b5848]">{current.timezone}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-[#f4efe6] px-5 py-16 text-[#2a2118] sm:px-10">
      <div className="mx-auto max-w-4xl">
        <p className="text-xs uppercase tracking-[0.25em] text-[#8a6d4d]">
          {session.email}
        </p>
        <h1 className="mt-4 max-w-xl font-serif text-4xl leading-tight sm:text-5xl">
          {first
            ? "Pas encore de famille."
            : `Plus de ${session.leftFamilyName}.`}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-[#6b5848]">
          {first
            ? "Deux chemins, même écran : créer la vôtre, ou coller le lien qu’on vous a envoyé."
            : "Vous avez quitté la dernière. Recréez-en une, ou rejoignez-en une autre."}
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <button
            type="button"
            onClick={() => open("create")}
            className="rounded-3xl border border-[#d8cbb8] bg-[#fffaf3] px-6 py-8 text-left transition hover:border-[#2a2118]"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-[#8a6d4d]">
              Commencer
            </span>
            <span className="mt-3 block font-serif text-3xl">
              Créer une famille
            </span>
            <span className="mt-3 block text-sm text-[#6b5848]">
              Nom + fuseau. Pas de bébé pour l’instant.
            </span>
          </button>

          <button
            type="button"
            onClick={() => open("join")}
            className="rounded-3xl border border-[#d8cbb8] bg-[#fffaf3] px-6 py-8 text-left transition hover:border-[#2a2118]"
          >
            <span className="text-xs uppercase tracking-[0.2em] text-[#8a6d4d]">
              On m’a invitée
            </span>
            <span className="mt-3 block font-serif text-3xl">
              Coller un lien
            </span>
            <span className="mt-3 block text-sm text-[#6b5848]">
              Une invitation, un nouvel opérateur. Lien à usage unique.
            </span>
          </button>
        </div>
      </div>

      {sheet !== "none" && (
        <div
          className="fixed inset-0 z-30 bg-black/40"
          onClick={() => open("none")}
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#fffaf3] px-5 pb-28 pt-4 text-[#2a2118]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#d8cbb8]" />
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
                <h2 className="font-serif text-2xl">Nouvelle famille</h2>
                <label className="mt-4 block text-sm font-medium">
                  Nom
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={50}
                    className="mt-1 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
                    placeholder="Famille Martin"
                  />
                </label>
                {nameError && (
                  <p className="mt-2 text-sm text-red-700">{nameError}</p>
                )}
                <label className="mt-3 block text-sm font-medium">
                  Fuseau (échéances)
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
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
                  className="mt-5 w-full rounded-full bg-[#2a2118] py-2.5 text-sm text-[#f4efe6]"
                >
                  Créer
                </button>
              </form>
            ) : session.pendingJoin ? (
              <div>
                <h2 className="font-serif text-2xl">
                  Rejoindre {session.pendingJoin.name} ?
                </h2>
                <p className="mt-2 text-sm text-[#6b5848]">
                  Fuseau {session.pendingJoin.timezone}. Vous devenez
                  opératrice, au même titre que les autres.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onConfirmJoin();
                    open("none");
                  }}
                  className="mt-5 w-full rounded-full bg-[#2a2118] py-2.5 text-sm text-[#f4efe6]"
                >
                  Rejoindre {session.pendingJoin.name}
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
                      ? "Cette invitation n’est plus valide. Demandez un nouveau lien."
                      : "Lien invalide.",
                  );
                }}
              >
                <h2 className="font-serif text-2xl">Coller le lien</h2>
                <label className="mt-4 block text-sm font-medium">
                  Lien d’invitation
                  <input
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
                    placeholder="https://…/join/famille-martin"
                  />
                </label>
                {joinError && (
                  <p className="mt-2 text-sm text-red-700">{joinError}</p>
                )}
                <button
                  type="submit"
                  className="mt-5 w-full rounded-full bg-[#2a2118] py-2.5 text-sm text-[#f4efe6]"
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
