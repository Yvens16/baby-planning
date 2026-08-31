"use client";

import { useState } from "react";
import type { ProtoState } from "./mock-data";
import { kindLabel } from "./mock-data";
import { OsPrompt, Phone, ReminderBackdrop } from "./host-ui";

export const variantBName = "Bandeau pied";

export function VariantB({
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
  const [sheet, setSheet] = useState(false);
  const [share, setShare] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const needsInstall = state.platform === "iphone" && !state.installed;
  const showAsk =
    state.permission === "default" && !needsInstall;
  const showIphone =
    needsInstall && state.permission !== "denied";
  const blocked = state.permission === "denied";
  const live = state.permission === "granted" && state.devices.some((d) => d.isThis);
  const dot = blocked || (!live && state.permission !== "granted");

  return (
    <Phone>
      <header className="border-b border-stone-200 bg-white px-4 pt-5 pb-3">
        <button
          type="button"
          onClick={() => setSheet(true)}
          className="flex w-full items-center gap-3 text-left"
        >
          <span className="relative grid h-10 w-10 place-items-center rounded-full bg-stone-800 text-sm font-bold text-white">
            M
            {dot && (
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-600 ring-2 ring-white" />
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Marie</span>
            <span className="block truncate text-xs text-stone-500">
              {live
                ? `${state.devices.length} appareil${state.devices.length > 1 ? "s" : ""}`
                : blocked
                  ? "Notifications bloquées"
                  : "Appareils · injoignable"}
            </span>
          </span>
          <span className="text-stone-400">⌃</span>
        </button>
        <h1 className="mt-3 text-xl font-semibold tracking-tight">
          Famille Martin
        </h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pt-3">
        <ReminderBackdrop />
      </div>

      {showAsk && (
        <div className="border-t border-stone-200 bg-white px-4 pt-3 pb-4">
          <p className="text-sm font-semibold text-stone-900">
            Recevoir les rappels ici
          </p>
          <p className="mt-1 text-sm leading-5 text-stone-600">
            Un push quand un rappel arrive à échéance. Tu peux oublier cet
            appareil plus tard.
          </p>
          <button
            type="button"
            onClick={onAsk}
            className="mt-3 w-full rounded-full bg-teal-700 py-2.5 text-sm font-medium text-white"
          >
            Autoriser les notifications
          </button>
        </div>
      )}
      {showIphone && (
        <div className="border-t border-amber-200 bg-amber-50 px-4 pt-3 pb-4">
          <p className="text-sm font-semibold text-stone-900">
            D’abord l’écran d’accueil
          </p>
          <p className="mt-1 text-sm leading-5 text-stone-600">
            Safari sur iPhone n’autorise le geste qu’après « Ajouter à
            l’écran d’accueil ».
          </p>
          <button
            type="button"
            onClick={() => setShare(true)}
            className="mt-3 w-full rounded-full bg-stone-900 py-2.5 text-sm font-medium text-white"
          >
            Voir la feuille Partager
          </button>
        </div>
      )}

      {sheet && (
        <DeviceSheet
          state={state}
          confirmId={confirmId}
          onClose={() => {
            setSheet(false);
            setConfirmId(null);
          }}
          onEnable={onEnable}
          onAskForget={(id) => setConfirmId(id)}
          onCancelForget={() => setConfirmId(null)}
          onForget={(id) => {
            onForget(id);
            setConfirmId(null);
          }}
          onSignOut={() => {
            onSignOut();
            setSheet(false);
          }}
        />
      )}
      {share && (
        <ShareTray
          onClose={() => setShare(false)}
          onAdd={() => {
            setShare(false);
            onInstall();
          }}
        />
      )}
      {promptOpen && <OsPrompt onBlock={onBlock} onAllow={onAllow} />}
    </Phone>
  );
}

function DeviceSheet({
  state,
  confirmId,
  onClose,
  onEnable,
  onAskForget,
  onCancelForget,
  onForget,
  onSignOut,
}: {
  state: ProtoState;
  confirmId: string | null;
  onClose: () => void;
  onEnable: () => void;
  onAskForget: (id: string) => void;
  onCancelForget: () => void;
  onForget: (id: string) => void;
  onSignOut: () => void;
}) {
  const blocked = state.permission === "denied";
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-stone-900/40">
      <div className="max-h-[88%] overflow-y-auto rounded-t-3xl bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Tes appareils</h2>
          <button type="button" className="text-sm text-stone-500" onClick={onClose}>
            Fermer
          </button>
        </div>
        {blocked && (
          <div className="mb-4 rounded-2xl bg-red-50 p-4 ring-1 ring-red-100">
            <p className="text-sm font-semibold text-stone-900">
              Bloquées dans le navigateur
            </p>
            <p className="mt-1 text-sm leading-5 text-stone-600">
              Le bandeau est mort. Change les réglages du site, puis Activer.
            </p>
            <button
              type="button"
              onClick={onEnable}
              className="mt-3 w-full rounded-full bg-stone-900 py-2 text-sm text-white"
            >
              Activer
            </button>
          </div>
        )}
        {state.permission === "default" && !blocked && (
          <button
            type="button"
            onClick={onEnable}
            className="mb-4 w-full rounded-full bg-teal-700 py-2.5 text-sm font-medium text-white"
          >
            Autoriser cet appareil
          </button>
        )}
        {state.devices.length === 0 ? (
          <p className="py-6 text-center text-sm text-stone-500">
            Aucun appareil enregistré.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {state.devices.map((d) => (
              <li key={d.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-stone-900">
                      {d.name}
                      {d.isThis ? (
                        <span className="ml-2 text-xs font-normal text-teal-700">
                          ici
                        </span>
                      ) : null}
                    </p>
                    <p className="text-xs text-stone-500">
                      {kindLabel(d.kind)} · {d.lastSeen}
                    </p>
                  </div>
                  {confirmId !== d.id && (
                    <button
                      type="button"
                      onClick={() => onAskForget(d.id)}
                      className="text-sm text-stone-500"
                    >
                      Oublier
                    </button>
                  )}
                </div>
                {confirmId === d.id && (
                  <div className="mt-2 flex items-center justify-end gap-2">
                    <span className="mr-auto text-xs text-stone-500">
                      Plus de rappels ici.
                    </span>
                    <button
                      type="button"
                      onClick={onCancelForget}
                      className="rounded-full px-3 py-1 text-xs text-stone-600"
                    >
                      Annuler
                    </button>
                    <button
                      type="button"
                      onClick={() => onForget(d.id)}
                      className="rounded-full bg-red-700 px-3 py-1 text-xs text-white"
                    >
                      Confirmer
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="mt-4 w-full rounded-full py-2 text-sm text-red-700 ring-1 ring-red-200"
        >
          Se déconnecter · retire cet appareil
        </button>
      </div>
    </div>
  );
}

function ShareTray({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col justify-end bg-stone-900/50">
      <div className="rounded-t-3xl bg-[#ececec] p-3 pb-6">
        <div className="mb-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white px-3 py-1 text-sm font-medium text-stone-700"
          >
            Annuler
          </button>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs text-stone-400">Safari · localhost</p>
          <button
            type="button"
            onClick={onAdd}
            className="mt-2 flex w-full items-center gap-3 py-2 text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-stone-100 text-lg">
              +
            </span>
            <span className="text-sm font-medium">
              Ajouter à l’écran d’accueil
            </span>
          </button>
        </div>
        <p className="mt-2 px-1 text-center text-[10px] text-stone-500">
          Prototype — fake feuille iOS. « Ajouter » = installé.
        </p>
      </div>
    </div>
  );
}
