"use client";

import { useState } from "react";
import type { Session } from "../model";
import {
  browserTimezone,
  lookupInvite,
  timezoneOptions,
  validateFamilyName,
} from "../model";

export const variantName = "Create is the page";

export function VariantB({
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
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState(browserTimezone);
  const [invite, setInvite] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);
  const current = session.families[0];
  const first = session.scene === "first";

  if (current) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8">
          <p className="text-sm text-zinc-500">Famille créée</p>
          <h1 className="mt-2 text-2xl font-semibold">{current.name}</h1>
          <p className="mt-1 text-zinc-500">{current.timezone}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <span className="text-sm font-semibold">Baby planning</span>
          <span className="text-xs text-zinc-500">{session.email}</span>
        </div>
      </header>

      <main className="mx-auto max-w-lg px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">
          Créer une famille
        </h1>
        <p className="mt-2 text-zinc-600">
          {first
            ? "Premier passage : une famille, un fuseau. Les bébés et les rappels viennent après."
            : `Vous n’appartenez plus à ${session.leftFamilyName}. Recréez-en une ici.`}
        </p>

        <form
          className="mt-8 space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            const error = validateFamilyName(name);
            setNameError(error);
            if (!error) onCreate(name.trim(), timezone);
          }}
        >
          <label className="block text-sm font-medium">
            Nom
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
              placeholder="Famille Martin"
            />
          </label>
          {nameError && <p className="text-sm text-red-700">{nameError}</p>}
          <label className="block text-sm font-medium">
            Fuseau horaire
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2"
            >
              {timezoneOptions().map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs font-normal text-zinc-500">
              Prérempli avec celui du navigateur. Les échéances suivent ce
              fuseau.
            </span>
          </label>
          <button
            type="submit"
            className="w-full rounded-lg bg-zinc-950 py-2.5 text-sm font-medium text-white"
          >
            Créer la famille
          </button>
        </form>

        <div className="mt-12 border-t border-dashed border-zinc-300 pt-8">
          <p className="text-sm font-medium text-zinc-800">
            Vous avez un lien d’invitation ?
          </p>
          {session.pendingJoin ? (
            <div className="mt-3 rounded-lg bg-white p-4 ring-1 ring-zinc-200">
              <p className="font-medium">
                Rejoindre {session.pendingJoin.name} ?
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={onConfirmJoin}
                  className="rounded-md bg-zinc-950 px-3 py-1.5 text-sm text-white"
                >
                  Rejoindre
                </button>
                <button
                  type="button"
                  onClick={onCancelJoin}
                  className="rounded-md px-3 py-1.5 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          ) : (
            <form
              className="mt-3 flex gap-2"
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
                    ? "Invitation déjà utilisée."
                    : "Lien invalide.",
                );
              }}
            >
              <input
                value={invite}
                onChange={(e) => setInvite(e.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm"
                placeholder="Coller https://…/join/…"
              />
              <button
                type="submit"
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
              >
                Joindre
              </button>
            </form>
          )}
          {joinError && (
            <p className="mt-2 text-sm text-red-700">{joinError}</p>
          )}
        </div>
      </main>
    </div>
  );
}
