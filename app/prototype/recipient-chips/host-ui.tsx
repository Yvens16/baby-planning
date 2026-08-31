"use client";

import { OPERATORS, REMINDERS, SCENES, type Scene, type Visibility } from "./mock-data";

export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[min(740px,calc(100dvh-16rem))] w-full max-w-[390px] flex-col overflow-hidden rounded-[2rem] bg-[#faf7f2] text-stone-900 shadow-2xl ring-1 ring-stone-300">
      {children}
    </div>
  );
}

export function Feed({ onAdd, onEdit }: { onAdd: () => void; onEdit: () => void }) {
  return (
    <>
      <header className="px-4 pt-5 pb-3">
        <p className="text-xs text-stone-500">Marie</p>
        <h1 className="mt-1 text-2xl leading-7 font-semibold tracking-tight">
          Famille Martin
        </h1>
      </header>
      <div className="flex gap-2 px-4 pb-3">
        <span className="rounded-full bg-stone-900 px-3 py-1 text-sm text-white">
          À venir
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-sm text-stone-600 ring-1 ring-stone-200">
          Envoyés
        </span>
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 pb-28">
        {REMINDERS.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={onEdit}
              className="w-full rounded-2xl bg-white p-4 text-left shadow-sm ring-1 ring-stone-200/80"
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs font-medium tracking-wide text-stone-500 uppercase">
                  {r.type}
                </span>
                <span className="text-xs text-stone-500">{r.dueLabel}</span>
              </div>
              <p className="mt-1 text-base font-semibold">{r.title}</p>
              <p className="mt-1 text-sm text-stone-600">{r.babyLine}</p>
            </button>
          </li>
        ))}
      </ul>
      <button
        type="button"
        aria-label="Ajouter un rappel"
        onClick={onAdd}
        className="absolute right-5 bottom-6 grid h-14 w-14 place-items-center rounded-full bg-teal-700 text-2xl text-white shadow-lg"
      >
        +
      </button>
    </>
  );
}

export function Sheet({
  heading,
  visibility,
  title,
  onTitle,
  onVisibility,
  onClose,
  children,
}: {
  heading: string;
  visibility: Visibility;
  title: string;
  onTitle: (v: string) => void;
  onVisibility: (v: Visibility) => void;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-stone-900/40">
      <div className="flex max-h-[92%] flex-col rounded-t-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <h2 className="text-lg font-semibold">{heading}</h2>
          <button type="button" className="text-sm text-stone-500" onClick={onClose}>
            Fermer
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 pb-6">
          <Field label="Type">
            <div className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
              Vaccin
            </div>
          </Field>
          <Field label="Bébé(s)">
            <div className="flex gap-2">
              <span className="rounded-full bg-stone-900 px-3 py-1 text-sm text-white">
                Léo
              </span>
              <span className="rounded-full bg-white px-3 py-1 text-sm ring-1 ring-stone-300">
                Emma
              </span>
            </div>
          </Field>
          <Field label="Échéance">
            <div className="rounded-xl border border-stone-300 px-3 py-2 text-sm">
              2 sept. · 10:00 · Paris
            </div>
          </Field>
          <Field label="Visibilité">
            <div className="flex gap-2">
              <VisChip
                active={visibility === "shared"}
                onClick={() => onVisibility("shared")}
                label="Partagé"
              />
              <VisChip
                active={visibility === "personal"}
                onClick={() => onVisibility("personal")}
                label="Personnel"
              />
            </div>
          </Field>
          <Field label="Destinataires">{children}</Field>
          <Field label="Titre (optionnel)">
            <input
              value={title}
              onChange={(e) => onTitle(e.target.value)}
              placeholder="ex. Vaccin 2 mois"
              className="w-full rounded-xl border border-stone-300 px-3 py-2 text-base outline-none focus:border-teal-700"
            />
          </Field>
          <Field label="Notes (optionnel)">
            <div className="h-16 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-400">
              —
            </div>
          </Field>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-stone-700">{label}</p>
      {children}
    </div>
  );
}

function VisChip({
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
          : "rounded-full bg-white px-3 py-1 text-sm text-stone-600 ring-1 ring-stone-300"
      }
    >
      {label}
    </button>
  );
}

export function StateDump({
  lines,
  scene,
  onScene,
}: {
  lines: string[];
  scene: Scene;
  onScene: (s: Scene) => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[70] flex justify-center px-3">
      <div className="pointer-events-auto max-w-xl rounded-xl bg-stone-900/90 px-3 py-2 font-mono text-[11px] leading-4 text-stone-100 shadow-lg">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="mr-1 tracking-wide text-amber-300 uppercase">état</span>
          {SCENES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onScene(s.id)}
              className={
                scene === s.id
                  ? "rounded bg-amber-300 px-2 py-0.5 font-sans text-[10px] font-semibold text-stone-900"
                  : "rounded bg-white/10 px-2 py-0.5 font-sans text-[10px] text-stone-100"
              }
            >
              {s.label}
            </button>
          ))}
        </div>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
        <p className="mt-1 font-sans text-[10px] text-stone-400">
          {OPERATORS.filter((o) => !o.reachable)
            .map((o) => o.name)
            .join(" · ")}{" "}
          = injoignable
        </p>
      </div>
    </div>
  );
}
