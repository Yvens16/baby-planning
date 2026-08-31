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
  const [door, setDoor] = useState<"create" | "join" | null>(null);
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(browserTimezone);
  const [invite, setInvite] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  const current = session.families[0];
  const first = session.scene === "first";

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
    <div className="min-h-dvh bg-[#f4efe6] px-5 py-16 text-[#2a2118] sm:px-10">
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
            onClick={() => {
              setDoor("create");
              setJoinError(null);
              onCancelJoin();
            }}
            className={`rounded-3xl border px-6 py-8 text-left transition ${
              door === "create"
                ? "border-[#2a2118] bg-[#2a2118] text-[#f4efe6]"
                : "border-[#d8cbb8] bg-[#fffaf3] hover:border-[#2a2118]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.2em] opacity-70">
              Commencer
            </span>
            <span className="mt-3 block font-serif text-3xl">
              Créer une famille
            </span>
            <span className="mt-3 block text-sm opacity-80">
              Nom + fuseau. Pas de bébé pour l’instant.
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setDoor("join");
              setNameError(null);
            }}
            className={`rounded-3xl border px-6 py-8 text-left transition ${
              door === "join"
                ? "border-[#2a2118] bg-[#2a2118] text-[#f4efe6]"
                : "border-[#d8cbb8] bg-[#fffaf3] hover:border-[#2a2118]"
            }`}
          >
            <span className="text-xs uppercase tracking-[0.2em] opacity-70">
              On m’a invitée
            </span>
            <span className="mt-3 block font-serif text-3xl">
              Coller un lien
            </span>
            <span className="mt-3 block text-sm opacity-80">
              Une invitation, un nouvel opérateur. Lien à usage unique.
            </span>
          </button>
        </div>

        {door === "create" && (
          <form
            className="mt-8 rounded-3xl bg-[#fffaf3] p-6 shadow-sm"
            onSubmit={(event) => {
              event.preventDefault();
              const error = validateFamilyName(name);
              setNameError(error);
              if (!error) onCreate(name.trim(), timezone);
            }}
          >
            <label className="block text-sm font-medium">
              Nom de la famille
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                className="mt-2 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
                placeholder="Famille Martin"
              />
            </label>
            {nameError && (
              <p className="mt-2 text-sm text-red-700">{nameError}</p>
            )}
            <label className="mt-4 block text-sm font-medium">
              Fuseau (échéances)
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
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
              className="mt-6 rounded-full bg-[#2a2118] px-5 py-2.5 text-sm text-[#f4efe6]"
            >
              Créer
            </button>
          </form>
        )}

        {door === "join" && (
          <div className="mt-8 rounded-3xl bg-[#fffaf3] p-6 shadow-sm">
            {session.pendingJoin ? (
              <div>
                <p className="font-serif text-2xl">
                  Rejoindre {session.pendingJoin.name} ?
                </p>
                <p className="mt-2 text-[#6b5848]">
                  Fuseau {session.pendingJoin.timezone}. Vous devenez
                  opératrice, au même titre que les autres.
                </p>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={onConfirmJoin}
                    className="rounded-full bg-[#2a2118] px-5 py-2.5 text-sm text-[#f4efe6]"
                  >
                    Rejoindre {session.pendingJoin.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onCancelJoin();
                      setJoinError(null);
                    }}
                    className="rounded-full px-5 py-2.5 text-sm"
                  >
                    Annuler
                  </button>
                </div>
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
                <label className="block text-sm font-medium">
                  Lien d’invitation
                  <input
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-[#d8cbb8] bg-white px-3 py-2"
                    placeholder="https://…/join/famille-martin"
                  />
                </label>
                {joinError && (
                  <p className="mt-2 text-sm text-red-700">{joinError}</p>
                )}
                <button
                  type="submit"
                  className="mt-6 rounded-full bg-[#2a2118] px-5 py-2.5 text-sm text-[#f4efe6]"
                >
                  Continuer
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
