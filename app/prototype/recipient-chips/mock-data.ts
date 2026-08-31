export type Operator = {
  id: string;
  name: string;
  reachable: boolean;
  isMe: boolean;
};

export type Visibility = "shared" | "personal";

export type Scene = "shared" | "personal" | "edit";

export const SCENES: { id: Scene; label: string }[] = [
  { id: "shared", label: "Partagé" },
  { id: "personal", label: "Personnel" },
  { id: "edit", label: "Édition" },
];

export const ME = "marie";

export const OPERATORS: Operator[] = [
  { id: "marie", name: "Marie", reachable: true, isMe: true },
  { id: "thomas", name: "Thomas", reachable: false, isMe: false },
  { id: "sophie", name: "Sophie", reachable: true, isMe: false },
  { id: "claire", name: "Claire", reachable: false, isMe: false },
];

export const REMINDERS = [
  {
    id: "m1",
    title: "Vaccin 2 mois",
    type: "Vaccin",
    dueLabel: "2 sept. · 10:00",
    babyLine: "Léo · Partagé",
  },
  {
    id: "m2",
    title: "RDV pédiatre",
    type: "Rendez-vous",
    dueLabel: "4 sept. · 14:30",
    babyLine: "Emma · Partagé",
  },
];

export type Draft = {
  visibility: Visibility;
  selected: string[];
  title: string;
};

export function seedScene(scene: Scene): Draft {
  switch (scene) {
    case "personal":
      return { visibility: "personal", selected: [ME], title: "Vitamine D" };
    case "edit":
      return {
        visibility: "shared",
        selected: ["marie", "thomas"],
        title: "Vaccin 2 mois",
      };
    default:
      return {
        visibility: "shared",
        selected: OPERATORS.map((o) => o.id),
        title: "",
      };
  }
}

export function toggleId(selected: string[], id: string): string[] {
  return selected.includes(id)
    ? selected.filter((x) => x !== id)
    : [...selected, id];
}

export function unreachableSelected(selected: string[]) {
  return OPERATORS.filter((o) => selected.includes(o.id) && !o.reachable);
}

export function labelFor(id: string) {
  return OPERATORS.find((o) => o.id === id)?.name ?? id;
}
