export type Reminder = {
  id: string;
  title: string;
  type: string;
  dueLabel: string;
  babyLine: string;
};

export type Device = {
  id: string;
  name: string;
  kind: "phone" | "laptop" | "tablet";
  lastSeen: string;
  isThis: boolean;
};

export type Permission = "default" | "granted" | "denied";
export type Platform = "generic" | "iphone";
export type Scene = "ask" | "denied" | "iphone" | "granted";

export const SCENES: { id: Scene; label: string }[] = [
  { id: "ask", label: "Demander" },
  { id: "denied", label: "Refusé" },
  { id: "iphone", label: "iPhone" },
  { id: "granted", label: "Accordé" },
];

export const REMINDERS: Reminder[] = [
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

const THIS_PHONE: Device = {
  id: "this",
  name: "iPhone de Marie",
  kind: "phone",
  lastSeen: "maintenant",
  isThis: true,
};

const LAPTOP: Device = {
  id: "mac",
  name: "MacBook",
  kind: "laptop",
  lastSeen: "il y a 2 jours",
  isThis: false,
};

const TABLET: Device = {
  id: "ipad",
  name: "iPad salon",
  kind: "tablet",
  lastSeen: "il y a 3 semaines",
  isThis: false,
};

export type ProtoState = {
  permission: Permission;
  platform: Platform;
  installed: boolean;
  devices: Device[];
};

export function seedScene(scene: Scene): ProtoState {
  switch (scene) {
    case "denied":
      return {
        permission: "denied",
        platform: "generic",
        installed: true,
        devices: [],
      };
    case "iphone":
      return {
        permission: "default",
        platform: "iphone",
        installed: false,
        devices: [],
      };
    case "granted":
      return {
        permission: "granted",
        platform: "generic",
        installed: true,
        devices: [THIS_PHONE, LAPTOP, TABLET],
      };
    default:
      return {
        permission: "default",
        platform: "generic",
        installed: true,
        devices: [],
      };
  }
}

export function thisDevice(): Device {
  return { ...THIS_PHONE };
}

export function kindLabel(kind: Device["kind"]) {
  if (kind === "laptop") return "Ordinateur";
  if (kind === "tablet") return "Tablette";
  return "Téléphone";
}
