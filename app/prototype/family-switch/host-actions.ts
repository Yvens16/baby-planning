import type { Family } from "./mock-data";

export const PENDING_CREATE = "__create__";
export const PENDING_JOIN = "__join__";

export type HostActions = {
  setShowDelivered: (v: boolean) => void;
  openAdd: () => void;
  openEdit: (reminder: { id: string; title: string }) => void;
  closeSheet: () => void;
  setDraftTitle: (v: string) => void;
  switchNow: (id: string, mode: "discard" | "stash") => void;
  askDiscard: (id: string) => void;
  askStash: (id: string) => void;
  clearPending: () => void;
  createFamily: (name: string, timezone: string) => void;
  joinFamily: (family: Family) => void;
  log: (msg: string) => void;
};
