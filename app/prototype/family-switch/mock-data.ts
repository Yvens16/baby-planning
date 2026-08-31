export type Baby = {
  id: string;
  name: string;
  mark: "due" | "born";
};

export type Operator = { id: string; name: string };

export type Reminder = {
  id: string;
  title: string;
  type: string;
  dueLabel: string;
  babyNames: string[];
  visibility: "shared" | "personal";
  delivered: boolean;
};

export type Family = {
  id: string;
  name: string;
  timezone: string;
  tzLabel: string;
  babies: Baby[];
  operators: Operator[];
  reminders: Reminder[];
  inviteLive: boolean;
};

export const ME: Operator = { id: "marie", name: "Marie" };

export const FAMILIES: Family[] = [
  {
    id: "martin",
    name: "Famille Martin",
    timezone: "Europe/Paris",
    tzLabel: "Paris",
    babies: [
      { id: "leo", name: "Léo", mark: "due" },
      { id: "emma", name: "Emma", mark: "born" },
    ],
    operators: [ME, { id: "thomas", name: "Thomas" }],
    inviteLive: true,
    reminders: [
      {
        id: "m1",
        title: "Vaccin 2 mois",
        type: "Vaccin",
        dueLabel: "2 sept. · 10:00",
        babyNames: ["Léo"],
        visibility: "shared",
        delivered: false,
      },
      {
        id: "m2",
        title: "RDV pédiatre",
        type: "Rendez-vous",
        dueLabel: "4 sept. · 14:30",
        babyNames: ["Emma"],
        visibility: "shared",
        delivered: false,
      },
      {
        id: "m3",
        title: "Vitamine D",
        type: "Médicament",
        dueLabel: "28 août · 08:00",
        babyNames: ["Léo", "Emma"],
        visibility: "personal",
        delivered: true,
      },
    ],
  },
  {
    id: "chen",
    name: "Famille Chen",
    timezone: "America/Martinique",
    tzLabel: "Martinique",
    babies: [{ id: "mei", name: "Mei", mark: "born" }],
    operators: [ME, { id: "li", name: "Li" }],
    inviteLive: false,
    reminders: [
      {
        id: "c1",
        title: "Passeport",
        type: "Autre",
        dueLabel: "8 sept. · 09:00",
        babyNames: ["Mei"],
        visibility: "shared",
        delivered: false,
      },
      {
        id: "c2",
        title: "Bilan allaitement",
        type: "Rendez-vous",
        dueLabel: "3 sept. · 16:00",
        babyNames: ["Mei"],
        visibility: "personal",
        delivered: false,
      },
    ],
  },
  {
    id: "moreau",
    name: "Famille Moreau",
    timezone: "Europe/Paris",
    tzLabel: "Paris",
    babies: [],
    operators: [ME],
    inviteLive: true,
    reminders: [],
  },
];
