"use client";

import { REMINDERS, SCENES, type Scene } from "./mock-data";

export function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative mx-auto flex h-[min(740px,calc(100dvh-16rem))] w-full max-w-[390px] flex-col overflow-hidden rounded-[2rem] bg-[#faf7f2] text-stone-900 shadow-2xl ring-1 ring-stone-300">
      {children}
    </div>
  );
}

export function ReminderBackdrop() {
  return (
    <ul className="space-y-2 px-4 pb-4">
      {REMINDERS.map((r) => (
        <li
          key={r.id}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80"
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
          <p className="mt-1 text-sm text-stone-600">{r.babyLine}</p>
        </li>
      ))}
    </ul>
  );
}

export function Confirm({
  title,
  body,
  cancel,
  confirm,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  cancel: string;
  confirm: string;
  onCancel: () => void;
  onConfirm: () => void;
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

export function OsPrompt({
  onBlock,
  onAllow,
}: {
  onBlock: () => void;
  onAllow: () => void;
}) {
  return (
    <div className="absolute inset-0 z-[60] grid place-items-center bg-stone-900/40 p-8">
      <div className="w-full max-w-[260px] overflow-hidden rounded-xl bg-white text-center shadow-2xl">
        <div className="px-4 pt-5 pb-3">
          <p className="text-sm font-semibold text-stone-900">
            localhost veut t’envoyer des notifications
          </p>
          <p className="mt-1 text-xs text-stone-500">
            Prototype — pas le vrai prompt du navigateur
          </p>
        </div>
        <div className="grid grid-cols-2 border-t border-stone-200">
          <button
            type="button"
            className="py-2.5 text-sm text-stone-600"
            onClick={onBlock}
          >
            Bloquer
          </button>
          <button
            type="button"
            className="border-l border-stone-200 py-2.5 text-sm font-semibold text-blue-600"
            onClick={onAllow}
          >
            Autoriser
          </button>
        </div>
      </div>
    </div>
  );
}

export function StateDump({
  lines,
  scene,
  onScene,
  onResetBrowser,
}: {
  lines: string[];
  scene: Scene;
  onScene: (s: Scene) => void;
  onResetBrowser: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-16 z-[70] flex justify-center px-3">
      <div className="pointer-events-auto max-w-xl rounded-xl bg-stone-900/90 px-3 py-2 font-mono text-[11px] leading-4 text-stone-100 shadow-lg">
        <div className="mb-1 flex flex-wrap items-center gap-1">
          <span className="mr-1 tracking-wide text-amber-300 uppercase">
            état
          </span>
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
          <button
            type="button"
            onClick={onResetBrowser}
            className="rounded bg-white/10 px-2 py-0.5 font-sans text-[10px] text-amber-200"
          >
            Reset navigateur
          </button>
        </div>
        {lines.map((l) => (
          <div key={l}>{l}</div>
        ))}
      </div>
    </div>
  );
}
