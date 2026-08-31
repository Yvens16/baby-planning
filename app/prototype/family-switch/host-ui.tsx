"use client";

import type { Family, Reminder } from "./mock-data";

export type Sheet =
  | { mode: "closed" }
  | { mode: "add" }
  | { mode: "edit"; reminderId: string };

export function babyLine(family: Family) {
  if (family.babies.length === 0) return "Aucun bébé";
  return family.babies.map((b) => b.name).join(" · ");
}

export function ReminderFeed({
  family,
  showDelivered,
  onShowDelivered,
  onOpenAdd,
  onOpenEdit,
}: {
  family: Family;
  showDelivered: boolean;
  onShowDelivered: (v: boolean) => void;
  onOpenAdd: () => void;
  onOpenEdit: (reminder: Reminder) => void;
}) {
  const list = family.reminders.filter((r) =>
    showDelivered ? r.delivered : !r.delivered,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-2 px-4 pb-3">
        <FilterChip
          active={!showDelivered}
          onClick={() => onShowDelivered(false)}
          label="À venir"
        />
        <FilterChip
          active={showDelivered}
          onClick={() => onShowDelivered(true)}
          label="Envoyés"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-28">
        {list.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-5 py-10 text-center">
            <p className="text-sm font-medium text-stone-800">
              {showDelivered ? "Aucun envoi pour l’instant" : "Aucun rappel"}
            </p>
            {!showDelivered && (
              <button
                type="button"
                className="mt-4 rounded-full bg-stone-900 px-4 py-2 text-sm text-white"
                onClick={onOpenAdd}
              >
                + Ajouter un rappel
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-2">
            {list.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onOpenEdit(r)}
                  className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200/80"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                      {r.type}
                    </span>
                    <span className="text-xs text-stone-500">{r.dueLabel}</span>
                  </div>
                  <p className="mt-1 text-base font-semibold text-stone-900">
                    {r.title}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">
                    {r.babyNames.join(" · ")} ·{" "}
                    {r.visibility === "shared" ? "Partagé" : "Personnel"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        aria-label="Ajouter un rappel"
        onClick={onOpenAdd}
        className="absolute right-5 bottom-24 grid h-14 w-14 place-items-center rounded-full bg-teal-700 text-2xl text-white shadow-lg"
      >
        +
      </button>
    </div>
  );
}

function FilterChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "rounded-full bg-stone-900 px-3 py-1 text-sm text-white"
          : "rounded-full bg-white px-3 py-1 text-sm text-stone-600 ring-1 ring-stone-200"
      }
    >
      {label}
    </button>
  );
}

export function DraftSheet({
  family,
  sheet,
  title,
  onTitle,
  onClose,
}: {
  family: Family;
  sheet: Sheet;
  title: string;
  onTitle: (v: string) => void;
  onClose: () => void;
}) {
  if (sheet.mode === "closed") return null;
  const heading = sheet.mode === "add" ? "Nouveau rappel" : "Modifier le rappel";
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-stone-900/40">
      <div className="rounded-t-3xl bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">{heading}</h2>
          <button
            type="button"
            className="text-sm text-stone-500"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
        <p className="mb-3 text-xs text-stone-500">
          Dans {family.name} · échéance en TZ {family.tzLabel}
        </p>
        <label className="block text-sm font-medium text-stone-700">
          Titre
          <input
            value={title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="ex. Vaccin 2 mois"
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 text-base text-stone-900 outline-none focus:border-teal-700"
          />
        </label>
        <p className="mt-3 text-xs text-stone-400">
          Prototype : le titre suffit à salir le brouillon. Le vrai formulaire
          (type → bébés → échéance…) reste celui déjà décidé.
        </p>
      </div>
    </div>
  );
}

export function Confirm({
  title,
  body,
  cancel,
  confirm,
  onCancel,
  onConfirm,
  tertiary,
}: {
  title: string;
  body: string;
  cancel: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
  tertiary?: { label: string; onClick: () => void };
}) {
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-stone-900/50 p-6">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-stone-900">{title}</h3>
        <p className="mt-2 text-sm leading-5 text-stone-600">{body}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="rounded-full px-3 py-1.5 text-sm text-stone-600"
            onClick={onCancel}
          >
            {cancel}
          </button>
          {tertiary && (
            <button
              type="button"
              className="rounded-full px-3 py-1.5 text-sm text-stone-600 ring-1 ring-stone-300"
              onClick={tertiary.onClick}
            >
              {tertiary.label}
            </button>
          )}
          <button
            type="button"
            className="rounded-full bg-stone-900 px-3 py-1.5 text-sm text-white"
            onClick={onConfirm}
          >
            {confirm}
          </button>
        </div>
      </div>
    </div>
  );
}

export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[min(740px,calc(100dvh-14rem))] w-full max-w-[390px] flex-col overflow-hidden rounded-[2rem] bg-[#faf7f2] text-stone-900 shadow-2xl ring-1 ring-stone-300">
      {children}
    </div>
  );
}

export function StateDump({
  lines,
  onSeedDraft,
}: {
  lines: string[];
  onSeedDraft: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[70] flex justify-center px-3">
      <div className="pointer-events-auto max-w-xl rounded-xl bg-stone-900/90 px-3 py-2 font-mono text-[11px] leading-4 text-stone-100 shadow-lg">
        <div className="mb-1 flex items-center justify-between gap-3">
          <span className="tracking-wide text-amber-300 uppercase">
            état prototype
          </span>
          <button
            type="button"
            className="rounded bg-amber-300 px-2 py-0.5 text-[10px] font-sans font-semibold text-stone-900"
            onClick={onSeedDraft}
          >
            Ouvrir un brouillon
          </button>
        </div>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}
