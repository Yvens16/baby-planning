"use client";

import { useState } from "react";
import type { Device, ProtoState } from "./mock-data";
import { kindLabel } from "./mock-data";
import {
  Confirm,
  OsPrompt,
  Phone,
  ReminderBackdrop,
} from "./host-ui";

export const variantAName = "Bandeau haut";

export function VariantA({
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
  const [page, setPage] = useState<"feed" | "settings">("feed");
  const [coach, setCoach] = useState(false);
  const [forget, setForget] = useState<Device | null>(null);

  const showBanner =
    page === "feed" &&
    state.permission === "default" &&
    (state.platform !== "iphone" || state.installed);
  const showIphoneBanner =
    page === "feed" &&
    state.platform === "iphone" &&
    !state.installed &&
    state.permission !== "denied";

  const needsInstall = state.platform === "iphone" && !state.installed;

  function handleBannerCta() {
    if (needsInstall) setCoach(true);
    else onAsk();
  }

  return (
    <Phone>
      {page === "feed" ? (
        <>
          <header className="border-b border-stone-200 bg-[#faf7f2] px-4 pt-5 pb-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-stone-500">Marie</p>
                <h1 className="mt-1 text-2xl leading-7 font-semibold tracking-tight">
                  Famille Martin
                </h1>
                <p className="mt-1 text-sm text-stone-500">
                  Paris · Léo · Emma
                </p>
              </div>
              <button
                type="button"
                aria-label="Réglages"
                onClick={() => setPage("settings")}
                className="mt-1 grid h-9 w-9 place-items-center rounded-full bg-white text-lg text-stone-700 ring-1 ring-stone-200"
              >
                ⚙
              </button>
            </div>
          </header>
          {showIphoneBanner && (
            <div className="flex items-center gap-3 border-b border-amber-200 bg-amber-50 px-4 py-2.5">
              <p className="min-w-0 flex-1 text-sm text-stone-800">
                Sur iPhone, ajoute l’app à l’écran d’accueil.
              </p>
              <button
                type="button"
                onClick={() => setCoach(true)}
                className="shrink-0 rounded-full bg-stone-900 px-3 py-1 text-xs font-medium text-white"
              >
                Comment
              </button>
            </div>
          )}
          {showBanner && (
            <div className="flex items-center gap-3 border-b border-teal-200 bg-teal-50 px-4 py-2.5">
              <p className="min-w-0 flex-1 text-sm text-stone-800">
                Recevoir les rappels sur cet appareil
              </p>
              <button
                type="button"
                onClick={handleBannerCta}
                className="shrink-0 rounded-full bg-teal-700 px-3 py-1 text-xs font-medium text-white"
              >
                Autoriser
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto pt-3">
            <ReminderBackdrop />
          </div>
        </>
      ) : (
        <SettingsPage
          state={state}
          onBack={() => setPage("feed")}
          onEnable={onEnable}
          onForget={(d) => setForget(d)}
          onSignOut={onSignOut}
        />
      )}
      {coach && (
        <Coach
          onClose={() => setCoach(false)}
          onDone={() => {
            setCoach(false);
            onInstall();
          }}
        />
      )}
      {promptOpen && <OsPrompt onBlock={onBlock} onAllow={onAllow} />}
      {forget && (
        <Confirm
          title={`Oublier « ${forget.name} » ?`}
          body="Les rappels n’y arriveront plus. Tu pourras réautoriser plus tard sur cet appareil."
          cancel="Garder"
          confirm="Oublier"
          onCancel={() => setForget(null)}
          onConfirm={() => {
            onForget(forget.id);
            setForget(null);
          }}
        />
      )}
    </Phone>
  );
}

function SettingsPage({
  state,
  onBack,
  onEnable,
  onForget,
  onSignOut,
}: {
  state: ProtoState;
  onBack: () => void;
  onEnable: () => void;
  onForget: (d: Device) => void;
  onSignOut: () => void;
}) {
  const blocked = state.permission === "denied";
  const live = state.permission === "granted" && state.devices.some((d) => d.isThis);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-stone-100">
      <header className="flex items-center gap-3 bg-[#faf7f2] px-3 pt-5 pb-3">
        <button
          type="button"
          onClick={onBack}
          className="text-sm text-teal-800"
        >
          ← Rappels
        </button>
        <h1 className="text-lg font-semibold">Réglages</h1>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase">
          Notifications
        </p>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          {blocked ? (
            <>
              <p className="text-sm font-semibold text-stone-900">
                Bloquées dans le navigateur
              </p>
              <p className="mt-1 text-sm leading-5 text-stone-600">
                Le bandeau ne reviendra pas. Autorise ce site dans les
                réglages du navigateur, puis appuie ici.
              </p>
              <button
                type="button"
                onClick={onEnable}
                className="mt-3 w-full rounded-full bg-stone-900 py-2 text-sm text-white"
              >
                Activer
              </button>
            </>
          ) : live ? (
            <p className="text-sm text-stone-700">
              Cet appareil reçoit les rappels.
            </p>
          ) : (
            <>
              <p className="text-sm text-stone-700">
                Pas encore autorisé sur cet appareil.
              </p>
              <button
                type="button"
                onClick={onEnable}
                className="mt-3 w-full rounded-full bg-teal-700 py-2 text-sm text-white"
              >
                Autoriser
              </button>
            </>
          )}
        </div>

        <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase">
          Appareils
        </p>
        {state.devices.length === 0 ? (
          <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-stone-500 ring-1 ring-stone-200">
            Aucun appareil. Tu es injoignable pour l’envoi.
          </p>
        ) : (
          <ul className="space-y-2">
            {state.devices.map((d) => (
              <li
                key={d.id}
                className="rounded-2xl bg-white p-4 ring-1 ring-stone-200"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-stone-900">{d.name}</p>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {kindLabel(d.kind)} · {d.lastSeen}
                      {d.isThis ? " · cet appareil" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onForget(d)}
                    className="text-sm text-red-700"
                  >
                    Oublier
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-5 mb-2 text-xs font-medium tracking-wide text-stone-500 uppercase">
          Session
        </p>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-stone-200">
          <p className="text-sm text-stone-600">
            Se déconnecter retire cet appareil seulement.
          </p>
          <button
            type="button"
            onClick={onSignOut}
            className="mt-3 text-sm font-medium text-red-700"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

function Coach({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-[#faf7f2]">
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-lg font-semibold">Écran d’accueil</h2>
        <button type="button" className="text-sm text-stone-500" onClick={onClose}>
          Fermer
        </button>
      </header>
      <ol className="space-y-3 px-4">
        <Step n={1} title="Partager">
          En bas de Safari, appuie sur l’icône Partager (le carré avec la
          flèche).
        </Step>
        <Step n={2} title="Ajouter à l’écran d’accueil">
          Dans la feuille, choisis « Ajouter à l’écran d’accueil », puis
          Ajouter.
        </Step>
        <Step n={3} title="Ouvrir l’icône">
          Relance depuis l’icône. Ensuite le bandeau Autoriser fonctionne.
        </Step>
      </ol>
      <div className="mt-auto p-4">
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-full bg-stone-900 py-3 text-sm font-medium text-white"
        >
          C’est fait — j’ai l’icône
        </button>
      </div>
    </div>
  );
}

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-200">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-stone-900 text-xs font-bold text-white">
        {n}
      </span>
      <div>
        <p className="font-semibold text-stone-900">{title}</p>
        <p className="mt-1 text-sm leading-5 text-stone-600">{children}</p>
      </div>
    </li>
  );
}
