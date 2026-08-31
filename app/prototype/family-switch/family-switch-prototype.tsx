"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  PrototypeSwitcher,
  type FamilySwitchVariant,
} from "../prototype-switcher";
import { FAMILIES } from "./mock-data";
import { StateDump, type Sheet } from "./host-ui";
import type { HostActions } from "./host-actions";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

// Three variants of Family switching (persistent header / picker sheet /
// family-as-room), via ?variant=, on throwaway /prototype/family-switch.
// Host is a cheap sketch of the reminder list already decided (cards + sheet).

export function FamilySwitchPrototype() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("variant");
  const variant: FamilySwitchVariant =
    raw === "B" || raw === "C" || raw === "A" ? raw : "A";

  const [familyId, setFamilyId] = useState("martin");
  const [sheet, setSheet] = useState<Sheet>({ mode: "closed" });
  const [draftTitle, setDraftTitle] = useState("");
  const [initialTitle, setInitialTitle] = useState("");
  const [draftsByFamily, setDraftsByFamily] = useState<Record<string, string>>(
    {},
  );
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [showDelivered, setShowDelivered] = useState(false);
  const [lastAction, setLastAction] = useState("chargé sur Famille Martin");

  useEffect(() => {
    setFamilyId("martin");
    setSheet({ mode: "closed" });
    setDraftTitle("");
    setInitialTitle("");
    setDraftsByFamily({});
    setPendingId(null);
    setShowDelivered(false);
    setLastAction(`variante ${variant} · Famille Martin`);
  }, [variant]);

  const current = FAMILIES.find((f) => f.id === familyId) ?? FAMILIES[0];
  const dirty = sheet.mode !== "closed" && draftTitle !== initialTitle;

  function log(msg: string) {
    setLastAction(msg);
  }

  const actions: HostActions = useMemo(
    () => ({
      setShowDelivered: (v) => {
        setShowDelivered(v);
        log(v ? "filtre Envoyés" : "filtre À venir");
      },
      openAdd: () => {
        const stashed = draftsByFamily[familyId];
        setSheet({ mode: "add" });
        setDraftTitle(stashed ?? "");
        setInitialTitle("");
        log("feuille ajout ouverte");
      },
      openEdit: (reminder) => {
        setSheet({ mode: "edit", reminderId: reminder.id });
        setDraftTitle(reminder.title);
        setInitialTitle(reminder.title);
        log(`feuille édition « ${reminder.title} »`);
      },
      closeSheet: () => {
        setDraftsByFamily((d) => {
          const copy = { ...d };
          delete copy[familyId];
          return copy;
        });
        setSheet({ mode: "closed" });
        setDraftTitle("");
        setInitialTitle("");
        setPendingId(null);
        log("feuille fermée");
      },
      setDraftTitle: (v) => setDraftTitle(v),
      switchNow: (id, mode) => {
        const next = FAMILIES.find((f) => f.id === id);
        if (!next) return;
        setPendingId(null);
        if (mode === "stash" && dirty) {
          setDraftsByFamily((d) => ({ ...d, [familyId]: draftTitle }));
        }
        if (mode === "discard") {
          setDraftsByFamily((d) => {
            const copy = { ...d };
            delete copy[familyId];
            return copy;
          });
        }
        setFamilyId(id);
        const restored = mode === "stash" ? draftsByFamily[id] : undefined;
        if (restored) {
          setSheet({ mode: "add" });
          setDraftTitle(restored);
          setInitialTitle("");
        } else {
          setSheet({ mode: "closed" });
          setDraftTitle("");
          setInitialTitle("");
        }
        setShowDelivered(false);
        log(
          mode === "stash"
            ? `passé à ${next.name} (brouillon gardé)`
            : `passé à ${next.name} (brouillon jeté)`,
        );
      },
      askDiscard: (id) => {
        setPendingId(id);
        log("confirm jeter le brouillon");
      },
      askStash: (id) => {
        setPendingId(id);
        log("confirm garder le brouillon");
      },
      clearPending: () => {
        setPendingId(null);
        log("confirm annulé");
      },
      log,
    }),
    [dirty, draftTitle, draftsByFamily, familyId],
  );

  function seedDraft() {
    actions.openAdd();
    actions.setDraftTitle("Vaccin 2 mois");
    log("brouillon semé : « Vaccin 2 mois »");
  }

  const lines = [
    `famille: ${current.name} (${current.timezone})`,
    `bébés: ${current.babies.map((b) => b.name).join(", ") || "—"}`,
    `feuille: ${sheet.mode}${dirty ? " · SALE" : ""}`,
    `titre: ${sheet.mode === "closed" ? "—" : `"${draftTitle}"`}`,
    `stashed: ${
      Object.keys(draftsByFamily).length
        ? Object.entries(draftsByFamily)
            .map(([k, v]) => `${k}=" ${v}"`)
            .join(" · ")
        : "—"
    }`,
    `action: ${lastAction}`,
  ];

  return (
    <div className="min-h-dvh bg-stone-200 pb-36 pt-6">
      <p className="mx-auto mb-3 max-w-xl px-4 text-center text-xs text-stone-600">
        PROTOTYPE — comment un opérateur change de famille. ← → ou la barre
        violette. « Ouvrir un brouillon » puis change de famille.
      </p>
      {variant === "A" && (
        <VariantA
          families={FAMILIES}
          current={current}
          sheet={sheet}
          draftTitle={draftTitle}
          dirty={dirty}
          pendingId={pendingId}
          showDelivered={showDelivered}
          actions={actions}
        />
      )}
      {variant === "B" && (
        <VariantB
          families={FAMILIES}
          current={current}
          sheet={sheet}
          draftTitle={draftTitle}
          dirty={dirty}
          pendingId={pendingId}
          draftsByFamily={draftsByFamily}
          showDelivered={showDelivered}
          actions={actions}
        />
      )}
      {variant === "C" && (
        <VariantC
          families={FAMILIES}
          current={current}
          sheet={sheet}
          draftTitle={draftTitle}
          dirty={dirty}
          showDelivered={showDelivered}
          actions={actions}
        />
      )}
      <StateDump lines={lines} onSeedDraft={seedDraft} />
      <PrototypeSwitcher current={variant} />
    </div>
  );
}
