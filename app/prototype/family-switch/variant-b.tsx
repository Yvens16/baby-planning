"use client";

import { useState } from "react";
import {
  TIMEZONES,
  lookupInvite,
  type Family,
  type InviteLookup,
} from "./mock-data";
import {
  Confirm,
  DraftSheet,
  Phone,
  ReminderFeed,
  babyLine,
  type Sheet,
} from "./host-ui";
import {
  PENDING_CREATE,
  PENDING_JOIN,
  type HostActions,
} from "./host-actions";

export const variantBName = "Sélecteur fiche";

type Panel = "list" | "create" | "join";

export function VariantB({
  families,
  current,
  sheet,
  draftTitle,
  dirty,
  pendingId,
  showDelivered,
  actions,
}: {
  families: Family[];
  current: Family;
  sheet: Sheet;
  draftTitle: string;
  dirty: boolean;
  pendingId: string | null;
  showDelivered: boolean;
  actions: HostActions;
}) {
  const [picker, setPicker] = useState(false);
  const [panel, setPanel] = useState<Panel>("list");

  function openPicker() {
    setPanel("list");
    setPicker(true);
  }

  function closePicker() {
    setPicker(false);
    setPanel("list");
  }

  function requestSwitch(id: string) {
    if (id === current.id) {
      closePicker();
      return;
    }
    if (sheet.mode !== "closed" && dirty) {
      actions.askDiscard(id);
      return;
    }
    closePicker();
    actions.switchNow(id, "discard");
  }

  function requestPanel(next: Panel) {
    if (sheet.mode !== "closed" && dirty) {
      actions.askDiscard(next === "create" ? PENDING_CREATE : PENDING_JOIN);
      return;
    }
    setPanel(next);
  }

  const pendingFamily = families.find((f) => f.id === pendingId);
  const pendingCreate = pendingId === PENDING_CREATE;
  const pendingJoin = pendingId === PENDING_JOIN;

  return (
    <Phone>
      <header className="relative z-40 border-b border-stone-200 bg-[#faf7f2] px-4 pt-5 pb-3">
        <p className="text-xs text-stone-500">Marie</p>
        <button
          type="button"
          onClick={openPicker}
          className="mt-1 flex w-full items-start justify-between gap-2 text-left"
        >
          <Title current={current} />
          <span className="mt-1 text-stone-400">▾</span>
        </button>
      </header>
      <ReminderFeed
        family={current}
        showDelivered={showDelivered}
        onShowDelivered={actions.setShowDelivered}
        onOpenAdd={actions.openAdd}
        onOpenEdit={actions.openEdit}
      />
      <DraftSheet
        family={current}
        sheet={sheet}
        title={draftTitle}
        onTitle={actions.setDraftTitle}
        onClose={actions.closeSheet}
      />
      {picker && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end bg-stone-900/40">
          <div className="max-h-[85%] overflow-y-auto rounded-t-3xl bg-white p-5">
            {panel === "list" && (
              <FamilyList
                families={families}
                current={current}
                onClose={closePicker}
                onSwitch={requestSwitch}
                onCreate={() => requestPanel("create")}
                onJoin={() => requestPanel("join")}
              />
            )}
            {panel === "create" && (
              <CreatePanel
                onBack={() => setPanel("list")}
                onCreate={(name, timezone) => {
                  closePicker();
                  actions.createFamily(name, timezone);
                }}
              />
            )}
            {panel === "join" && (
              <JoinPanel
                families={families}
                onBack={() => setPanel("list")}
                onJoin={(family) => {
                  closePicker();
                  actions.joinFamily(family);
                }}
              />
            )}
          </div>
        </div>
      )}
      {pendingFamily && (
        <Confirm
          title="Quitter le brouillon ?"
          body={`Changer pour ${pendingFamily.name} jette le rappel en cours. Rien n’est gardé.`}
          cancel="Rester"
          confirm="Changer"
          onCancel={actions.clearPending}
          onConfirm={() => {
            closePicker();
            actions.switchNow(pendingFamily.id, "discard");
          }}
        />
      )}
      {pendingCreate && (
        <Confirm
          title="Quitter le brouillon ?"
          body="Créer une famille jette le rappel en cours. Rien n’est gardé."
          cancel="Rester"
          confirm="Continuer"
          onCancel={actions.clearPending}
          onConfirm={() => {
            actions.closeSheet();
            setPicker(true);
            setPanel("create");
          }}
        />
      )}
      {pendingJoin && (
        <Confirm
          title="Quitter le brouillon ?"
          body="Rejoindre une famille jette le rappel en cours. Rien n’est gardé."
          cancel="Rester"
          confirm="Continuer"
          onCancel={actions.clearPending}
          onConfirm={() => {
            actions.closeSheet();
            setPicker(true);
            setPanel("join");
          }}
        />
      )}
    </Phone>
  );
}

function Title({ current }: { current: Family }) {
  return (
    <div>
      <h1 className="text-2xl leading-7 font-semibold tracking-tight">
        {current.name}
      </h1>
      <p className="mt-1 text-sm text-stone-500">
        {current.tzLabel} · {babyLine(current)}
      </p>
    </div>
  );
}

function FamilyList({
  families,
  current,
  onClose,
  onSwitch,
  onCreate,
  onJoin,
}: {
  families: Family[];
  current: Family;
  onClose: () => void;
  onSwitch: (id: string) => void;
  onCreate: () => void;
  onJoin: () => void;
}) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {families.length > 1 ? "Choisir une famille" : current.name}
        </h2>
        <button
          type="button"
          className="text-sm text-stone-500"
          onClick={onClose}
        >
          Fermer
        </button>
      </div>
      <ul className="space-y-2">
        {families.map((f) => (
          <li key={f.id}>
            <button
              type="button"
              onClick={() => onSwitch(f.id)}
              className="w-full rounded-2xl p-4 text-left ring-1 ring-stone-200 hover:bg-stone-50"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900">{f.name}</span>
                {f.id === current.id && (
                  <span className="text-sm text-teal-700">actuelle</span>
                )}
              </div>
              <p className="mt-1 text-sm text-stone-500">
                {f.tzLabel} · {babyLine(f)} · {f.operators.length}{" "}
                {f.operators.length > 1 ? "opérateurs" : "opérateur"}
                {f.inviteLive ? " · lien d’invite vivant" : ""}
              </p>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-5 space-y-2 border-t border-dashed border-stone-200 pt-4">
        <button
          type="button"
          onClick={onCreate}
          className="w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white"
        >
          Créer une famille
        </button>
        <button
          type="button"
          onClick={onJoin}
          className="w-full rounded-xl py-2.5 text-sm font-medium text-stone-800 ring-1 ring-stone-300"
        >
          Rejoindre
        </button>
      </div>
    </>
  );
}

function CreatePanel({
  onBack,
  onCreate,
}: {
  onBack: () => void;
  onCreate: (name: string, timezone: string) => void;
}) {
  const [name, setName] = useState("");
  const [timezone, setTimezone] = useState("Europe/Paris");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = name.trim();
        if (trimmed.length < 1 || trimmed.length > 50) {
          setError("Nom : 1 à 50 caractères.");
          return;
        }
        onCreate(trimmed, timezone);
      }}
    >
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-stone-500"
          onClick={onBack}
        >
          Retour
        </button>
        <h2 className="text-lg font-semibold">Créer une famille</h2>
        <span className="w-12" />
      </div>
      <label className="block text-sm font-medium text-stone-700">
        Nom
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="Famille Martin"
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700"
        />
      </label>
      {error && <p className="mt-1 text-sm text-red-700">{error}</p>}
      <label className="mt-4 block text-sm font-medium text-stone-700">
        Fuseau horaire
        <select
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900"
        >
          {TIMEZONES.map((tz) => (
            <option key={tz.id} value={tz.id}>
              {tz.label}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="mt-5 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white"
      >
        Créer la famille
      </button>
    </form>
  );
}

function JoinPanel({
  families,
  onBack,
  onJoin,
}: {
  families: Family[];
  onBack: () => void;
  onJoin: (family: Family) => void;
}) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<InviteLookup | null>(null);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-stone-500"
          onClick={onBack}
        >
          Retour
        </button>
        <h2 className="text-lg font-semibold">Rejoindre</h2>
        <span className="w-12" />
      </div>
      <label className="block text-sm font-medium text-stone-700">
        Lien ou jeton
        <input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setResult(null);
          }}
          placeholder="…/join/famille-dubois"
          className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700"
        />
      </label>
      <button
        type="button"
        className="mt-3 w-full rounded-xl bg-stone-900 py-2.5 text-sm font-medium text-white"
        onClick={() => setResult(lookupInvite(input, families))}
      >
        Continuer
      </button>
      {result?.kind === "ok" && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
          <p className="font-medium">Rejoindre {result.family.name} ?</p>
          <p className="mt-1 text-sm text-stone-500">{result.family.tzLabel}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-teal-700 py-2 text-sm font-medium text-white"
            onClick={() => onJoin(result.family)}
          >
            Rejoindre {result.family.name}
          </button>
        </div>
      )}
      {result?.kind === "member" && (
        <div className="mt-4 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
          <p className="font-medium">Vous êtes déjà dans {result.family.name}</p>
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-stone-900 py-2 text-sm font-medium text-white"
            onClick={() => onJoin(result.family)}
          >
            Ouvrir {result.family.name}
          </button>
        </div>
      )}
      {result?.kind === "used" && (
        <p className="mt-3 text-sm text-red-700">
          Invitation plus valable. Demandez un nouveau lien.
        </p>
      )}
      {result?.kind === "invalid" && (
        <p className="mt-3 text-sm text-red-700">Lien ou jeton invalide.</p>
      )}
      <p className="mt-4 text-xs text-stone-400">
        Stubs : famille-dubois · used-up · famille-martin
      </p>
    </div>
  );
}
