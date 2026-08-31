// PROTOTYPE — in-memory world for leave / remove / last-Operator Family-end.
// Locked rules: issue 23 + ADR 0002. This file is the stub "backend".

export type Scene = "multi" | "last-op" | "last-family";

export type Operator = {
  id: string;
  name: string;
};

export type Baby = {
  id: string;
  name: string;
};

export type Reminder = {
  id: string;
  title: string;
  type: string;
  dueLabel: string;
  babyNames: string[];
  /** Operator id if personal; omitted = shared. */
  personalOf?: string;
};

export type Family = {
  id: string;
  name: string;
  timezone: string;
  operators: Operator[];
  babies: Baby[];
  reminders: Reminder[];
  inviteValid: boolean;
};

export type LastAction =
  | "none"
  | "left"
  | "removed"
  | "ended-family"
  | "switched";

export type Session = {
  meId: string;
  meName: string;
  email: string;
  currentFamilyId: string | null;
  families: Family[];
  lastAction: LastAction;
  lastTargetName: string | null;
  banner: string | null;
};

export const ME: Operator = { id: "marie", name: "Marie" };
export const CAMILLE: Operator = { id: "camille", name: "Camille" };
export const PAUL: Operator = { id: "paul", name: "Paul" };

export function seedMoreau(operators: Operator[]): Family {
  return {
    id: "moreau",
    name: "Famille Moreau",
    timezone: "Europe/Paris",
    operators,
    babies: [
      { id: "lea", name: "Léa" },
      { id: "noah", name: "Noah" },
    ],
    reminders: [
      {
        id: "r1",
        title: "Rappel hexavalent",
        type: "Vaccin",
        dueLabel: "Demain 9:00",
        babyNames: ["Léa"],
      },
      {
        id: "r2",
        title: "Échographie T3",
        type: "Rendez-vous",
        dueLabel: "Jeudi 14:30",
        babyNames: ["Noah"],
      },
      {
        id: "r3",
        title: "Vitamine D",
        type: "Médicament",
        dueLabel: "Vendredi 8:00",
        babyNames: ["Léa"],
        personalOf: ME.id,
      },
      {
        id: "r4",
        title: "Photo de classe",
        type: "Autre",
        dueLabel: "12 sept. 10:00",
        babyNames: ["Léa", "Noah"],
      },
      {
        id: "r5",
        title: "Rotavirus",
        type: "Vaccin",
        dueLabel: "18 sept. 9:00",
        babyNames: ["Noah"],
        personalOf: CAMILLE.id,
      },
    ].filter((reminder) => {
      if (!reminder.personalOf) return true;
      return operators.some((op) => op.id === reminder.personalOf);
    }),
    inviteValid: true,
  };
}

export function seedMartin(): Family {
  return {
    id: "martin",
    name: "Famille Martin",
    timezone: "Europe/Brussels",
    operators: [ME, PAUL],
    babies: [{ id: "ines", name: "Inès" }],
    reminders: [
      {
        id: "m1",
        title: "Pédiatre 2 mois",
        type: "Rendez-vous",
        dueLabel: "Lundi 11:00",
        babyNames: ["Inès"],
      },
    ],
    inviteValid: true,
  };
}

export function initialSession(scene: Scene): Session {
  if (scene === "last-family") {
    return {
      meId: ME.id,
      meName: ME.name,
      email: "marie@example.com",
      currentFamilyId: "moreau",
      families: [seedMoreau([ME])],
      lastAction: "none",
      lastTargetName: null,
      banner: null,
    };
  }
  if (scene === "last-op") {
    return {
      meId: ME.id,
      meName: ME.name,
      email: "marie@example.com",
      currentFamilyId: "moreau",
      families: [seedMoreau([ME]), seedMartin()],
      lastAction: "none",
      lastTargetName: null,
      banner: null,
    };
  }
  return {
    meId: ME.id,
    meName: ME.name,
    email: "marie@example.com",
    currentFamilyId: "moreau",
    families: [seedMoreau([ME, CAMILLE]), seedMartin()],
    lastAction: "none",
    lastTargetName: null,
    banner: null,
  };
}

export function currentFamily(session: Session): Family | null {
  return session.families.find((f) => f.id === session.currentFamilyId) ?? null;
}

export function isLastOperator(family: Family): boolean {
  return family.operators.length === 1 && family.operators[0]?.id === ME.id;
}

export function others(family: Family): Operator[] {
  return family.operators.filter((op) => op.id !== ME.id);
}

export function personalRemindersOf(family: Family, operatorId: string): Reminder[] {
  return family.reminders.filter((r) => r.personalOf === operatorId);
}

export function applyLeave(session: Session, familyId: string): Session {
  const family = session.families.find((f) => f.id === familyId);
  if (!family) return session;

  const last = isLastOperator(family);
  const remaining = last
    ? session.families.filter((f) => f.id !== familyId)
    : session.families.map((f) => {
        if (f.id !== familyId) return f;
        return {
          ...f,
          operators: f.operators.filter((op) => op.id !== session.meId),
          reminders: f.reminders.filter((r) => r.personalOf !== session.meId),
          inviteValid: false,
        };
      });

  const nextCurrent = remaining[0]?.id ?? null;
  return {
    ...session,
    families: remaining,
    currentFamilyId: nextCurrent,
    lastAction: last ? "ended-family" : "left",
    lastTargetName: family.name,
    banner: last
      ? remaining.length === 0
        ? `${family.name} est terminée. Plus de famille.`
        : `${family.name} est terminée.`
      : `Vous avez quitté ${family.name}.`,
  };
}

export function applyRemove(
  session: Session,
  familyId: string,
  operatorId: string,
): Session {
  if (operatorId === session.meId) return session;
  const family = session.families.find((f) => f.id === familyId);
  if (!family) return session;
  const target = family.operators.find((op) => op.id === operatorId);
  if (!target) return session;

  return {
    ...session,
    families: session.families.map((f) => {
      if (f.id !== familyId) return f;
      return {
        ...f,
        operators: f.operators.filter((op) => op.id !== operatorId),
        reminders: f.reminders.filter((r) => r.personalOf !== operatorId),
        inviteValid: false,
      };
    }),
    lastAction: "removed",
    lastTargetName: target.name,
    banner: `${target.name} n’est plus dans ${family.name}.`,
  };
}

export function applySwitch(session: Session, familyId: string): Session {
  if (!session.families.some((f) => f.id === familyId)) return session;
  return {
    ...session,
    currentFamilyId: familyId,
    lastAction: "switched",
    lastTargetName: session.families.find((f) => f.id === familyId)?.name ?? null,
    banner: null,
  };
}

export function sceneFromParam(value: string | null): Scene {
  if (value === "last-op" || value === "last-family") return value;
  return "multi";
}
