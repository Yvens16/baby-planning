"use client";

import { useState } from "react";
import type { Device, ProtoState } from "./mock-data";
import { kindLabel } from "./mock-data";
import { OsPrompt, Phone, ReminderBackdrop } from "./host-ui";

export const variantCName = "Carte + pièce";

export function VariantC({
  state,
  promptOpen,
  onAsk,
  onAllow,
  onBlock,
  onEnable,
  onInstall,
  onForget,
  onSignOut,
}: {
  state: ProtoState;
  promptOpen: boolean;
  onAsk: () => void;
  onAllow: () => void;
  onBlock: () => void;
  onEnable: () => void;
  onInstall: () => void;
  onForget: (id: string) => void;
  onSignOut: () => void;
}) {
  const [room, setRoom] = useState(false);
  const [forget, setForget] = useState<Device | null>(null);

  const needsInstall = state.platform === "iphone" && !state.installed;
  const showHero =
    !room &&
    state.permission !== "denied" &&
    (state.permission === "default" || needsInstall);
  const live = state.permission === "granted" && state.devices.some((d) => d.isThis);
  const blocked = state.permission === "denied";

  const pill = blocked ? "Bloqué" : live ? "Joignable" : "Injoignable";
  const pillClass = live
    ? "bg-teal-700 text-white"
    : blocked
      ? "bg-red-700 text-white"
      : "bg-stone-800 text-white";

  return (
    <Phone>
      {room ? (
        <DeviceRoom
          state={state}
          live={live}
          blocked={blocked}
          forget={forget}
          onBack={() => {
            setRoom(false);
            setForget(null);
          }}
          onEnable={onEnable}
          onAsk={onAsk}
          onInstall={onInstall}
          onAskForget={setForget}
          onCancelForget={() => setForget(null)}
          onForget={(id) => {
            onForget(id);
            setForget(null);
          }}
          onSignOut={() => {
            onSignOut();
            setRoom(false);
          }}
        />
      ) : (
        <>
          <header className="flex items-start justify-between gap-3 px-4 pt-5 pb-3">
            <div>
              <p className="text-xs text-stone-500">Marie</p>
              <h1 className="mt-1 text-2xl leading-7 font-semibold tracking-tight">
                Famille Martin
              </h1>
            </div>
            <button
              type="button"
              onClick={() => setRoom(true)}
              className={`mt-1 rounded-full px-3 py-1 text-xs font-medium ${pillClass}`}
            >
              {pill}
            </button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {showHero && (
              <div className="px-4 pb-3">
                {needsInstall ? (
                  <div className="rounded-3xl bg-stone-900 p-5 text-white">
                    <p className="text-xs tracking-wide text-amber-300 uppercase">
                      iPhone
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Ajoute l’app à l’écran d’accueil
                    </h2>
                    <ol className="mt-4 space-y-2 text-sm leading-5 text-stone-200">
                      <li>1. Partager (carré + flèche)</li>
                      <li>2. Ajouter à l’écran d’accueil</li>
                      <li>3. Ouvre l’icône, puis autorise</li>
                    </ol>
                    <button
                      type="button"
                      onClick={onInstall}
                      className="mt-5 w-full rounded-full bg-white py-2.5 text-sm font-medium text-stone-900"
                    >
                      C’est fait
                    </button>
                  </div>
                ) : (
                  <div className="rounded-3xl bg-teal-800 p-5 text-white">
                    <p className="text-xs tracking-wide text-teal-200 uppercase">
                      Envoi
                    </p>
                    <h2 className="mt-2 text-xl font-semibold">
                      Recevoir les rappels ici
                    </h2>
                    <p className="mt-2 text-sm leading-5 text-teal-50">
                      Le bandeau reste à chaque session jusqu’à Autoriser ou
                      un refus du navigateur.
                    </p>
                    <button
                      type="button"
                      onClick={onAsk}
                      className="mt-5 w-full rounded-full bg-white py-2.5 text-sm font-medium text-teal-900"
                    >
                      Autoriser
                    </button>
                  </div>
                )}
              </div>
            )}
            <ReminderBackdrop />
          </div>
        </>
      )}
      {promptOpen && <OsPrompt onBlock={onBlock} onAllow={onAllow} />}
    </Phone>
  );
}

function DeviceRoom({
  state,
  live,
  blocked,
  forget,
  onBack,
  onEnable,
  onAsk,
  onInstall,
  onAskForget,
  onCancelForget,
  onForget,
  onSignOut,
}: {
  state: ProtoState;
  live: boolean;
  blocked: boolean;
  forget: Device | null;
  onBack: () => void;
  onEnable: () => void;
  onAsk: () => void;
  onInstall: () => void;
  onAskForget: (d: Device) => void;
  onCancelForget: () => void;
  onForget: (id: string) => void;
  onSignOut: () => void;
}) {
  const others = state.devices.filter((d) => !d.isThis);
  const needsInstall = state.platform === "iphone" && !state.installed;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-stone-900 text-white">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button type="button" onClick={onBack} className="text-sm text-teal-200">
          ← Rappels
        </button>
        <h1 className="text-lg font-semibold">Cet appareil</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <div className="mt-4 text-center">
          <div
            className={`mx-auto grid h-28 w-28 place-items-center rounded-full text-sm font-semibold ${
              live
                ? "bg-teal-700"
                : blocked
                  ? "bg-red-800"
                  : "bg-stone-700"
            }`}
          >
            {live ? "Joignable" : blocked ? "Bloqué" : "Injoignable"}
          </div>
          <p className="mt-4 text-lg font-semibold">iPhone de Marie</p>
          <p className="mt-1 text-sm text-stone-400">
            {live
              ? "Les rappels arrivent ici."
              : blocked
                ? "Le navigateur a dit non. Plus de bandeau."
                : needsInstall
                  ? "Safari exige l’écran d’accueil d’abord."
                  : "Pas encore autorisé."}
          </p>
        </div>

        {blocked && (
          <button
            type="button"
            onClick={onEnable}
            className="mt-6 w-full rounded-full bg-white py-3 text-sm font-medium text-stone-900"
          >
            Activer — après reset navigateur
          </button>
        )}
        {!blocked && !live && needsInstall && (
          <button
            type="button"
            onClick={onInstall}
            className="mt-6 w-full rounded-full bg-white py-3 text-sm font-medium text-stone-900"
          >
            Marquer comme installé
          </button>
        )}
        {!blocked && !live && !needsInstall && (
          <button
            type="button"
            onClick={onAsk}
            className="mt-6 w-full rounded-full bg-teal-500 py-3 text-sm font-medium text-stone-900"
          >
            Autoriser
          </button>
        )}

        <p className="mt-8 mb-2 text-xs tracking-wide text-stone-500 uppercase">
          Autres appareils
        </p>
        {others.length === 0 ? (
          <p className="text-sm text-stone-500">Aucun autre pour l’instant.</p>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {others.map((d) => (
              <div
                key={d.id}
                className="w-40 shrink-0 rounded-2xl bg-stone-800 p-3"
              >
                <p className="font-medium">{d.name}</p>
                <p className="mt-1 text-xs text-stone-400">
                  {kindLabel(d.kind)} · {d.lastSeen}
                </p>
                {forget?.id === d.id ? (
                  <div className="mt-3 flex gap-1">
                    <button
                      type="button"
                      onClick={onCancelForget}
                      className="flex-1 rounded-full bg-stone-700 py-1 text-xs"
                    >
                      Non
                    </button>
                    <button
                      type="button"
                      onClick={() => onForget(d.id)}
                      className="flex-1 rounded-full bg-red-700 py-1 text-xs"
                    >
                      Oublier
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAskForget(d)}
                    className="mt-3 text-xs text-red-300"
                  >
                    Oublier
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onSignOut}
          className="mt-8 w-full text-sm text-stone-400"
        >
          Se déconnecter · retire cet appareil
        </button>
      </div>
    </div>
  );
}
