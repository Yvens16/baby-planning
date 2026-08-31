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
  log: (msg: string) => void;
};
