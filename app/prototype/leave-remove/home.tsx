import type { Family, Reminder } from "./model";

export function ReminderCards({ reminders }: { reminders: Reminder[] }) {
  if (reminders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-6 py-14 text-center">
        <p className="font-medium">Aucun rappel à venir</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {reminders.map((reminder) => (
        <li
          key={reminder.id}
          className="rounded-2xl border border-stone-200 bg-white px-4 py-3 shadow-sm"
        >
          <p className="text-xs uppercase tracking-wide text-stone-500">
            {reminder.type} · {reminder.babyNames.join(", ")}
            {reminder.personalOf ? " · perso" : ""}
          </p>
          <p className="mt-1 font-medium">{reminder.title}</p>
          <p className="mt-1 text-sm text-stone-500">{reminder.dueLabel}</p>
        </li>
      ))}
    </ul>
  );
}

export function FilterChips() {
  return (
    <div className="flex gap-2">
      <span className="rounded-full bg-stone-900 px-3 py-1 text-xs text-white">
        À venir
      </span>
      <span className="rounded-full bg-stone-200 px-3 py-1 text-xs text-stone-500">
        Envoyés
      </span>
    </div>
  );
}

export function ZeroFamilyStub({
  endedName,
  tone,
}: {
  endedName: string | null;
  tone: "doors" | "stack" | "shell";
}) {
  if (tone === "stack") {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <p className="text-xs uppercase tracking-wide text-stone-500">
          Après {endedName ?? "la dernière famille"}
        </p>
        <h1 className="mt-2 text-2xl font-semibold">Plus de famille</h1>
        <p className="mt-2 text-sm text-stone-600">
          Écran zéro-famille (ticket encore ouvert). Créer et coller un lien
          restent les deux portes.
        </p>
        <button
          type="button"
          className="mt-8 w-full rounded-xl bg-stone-900 py-3 text-sm text-white"
        >
          Créer une famille
        </button>
        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-stone-300 py-3 text-sm"
        >
          Coller un lien d’invitation
        </button>
      </div>
    );
  }

  if (tone === "shell") {
    return (
      <div className="mx-auto max-w-lg px-4 pb-28 pt-10">
        <div className="rounded-3xl bg-white px-6 py-14 text-center shadow-sm">
          <p className="text-xl font-semibold">Plus de famille</p>
          <p className="mt-2 text-sm text-stone-500">
            {endedName
              ? `${endedName} n’existe plus. Même écran vide qu’au premier jour.`
              : "Créer ou rejoindre."}
          </p>
          <button
            type="button"
            className="mt-6 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white"
          >
            Créer une famille
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-16">
      <p className="text-xs uppercase tracking-[0.25em] text-[#8a6d4d]">
        Plus de {endedName ?? "famille"}
      </p>
      <h1 className="mt-4 font-serif text-4xl leading-tight">
        Pas encore de famille.
      </h1>
      <p className="mt-3 max-w-lg text-[#6b5848]">
        Vous venez de quitter la dernière. Recréez-en une, ou collez un lien.
      </p>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border border-[#d8cbb8] bg-[#fffaf3] px-6 py-8">
          <p className="font-serif text-2xl">Créer une famille</p>
        </div>
        <div className="rounded-3xl border border-[#d8cbb8] bg-[#fffaf3] px-6 py-8">
          <p className="font-serif text-2xl">Coller un lien</p>
        </div>
      </div>
    </div>
  );
}

export function Banner({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  return (
    <div className="mx-auto flex max-w-lg items-start justify-between gap-3 px-4 pt-3">
      <p className="rounded-xl bg-amber-100 px-3 py-2 text-sm text-amber-950">
        {text}
      </p>
      <button type="button" onClick={onDismiss} className="text-xs text-stone-500">
        OK
      </button>
    </div>
  );
}

export function FamilyMeta({ family }: { family: Family }) {
  return (
    <p className="text-sm text-stone-500">
      {family.timezone} · {family.babies.length} bébé
      {family.babies.length > 1 ? "s" : ""} · {family.operators.length}{" "}
      opératrice{family.operators.length > 1 ? "s" : ""}
      {family.inviteValid ? "" : " · invitation invalidée"}
    </p>
  );
}
