"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PrototypeSwitcher,
  RECIPIENT_CHIPS_VARIANTS,
  type RecipientChipsVariant,
} from "../prototype-switcher";
import { StateDump } from "./host-ui";
import {
  OPERATORS,
  labelFor,
  seedScene,
  toggleId,
  unreachableSelected,
  type Draft,
  type Scene,
  type Visibility,
} from "./mock-data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

// Three variants of Destinataires on the locked Variant B reminder sheet.
// `?variant=A|B|C`  `?scene=shared|personal|edit`

function parseScene(raw: string | null): Scene {
  if (raw === "personal" || raw === "edit") return raw;
  return "shared";
}

export function RecipientChipsPrototype() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("variant");
  const variant: RecipientChipsVariant =
    raw === "B" || raw === "C" ? raw : "A";
  const scene = parseScene(searchParams.get("scene"));

  const [draft, setDraft] = useState<Draft>(() => seedScene(scene));
  const [keptShared, setKeptShared] = useState<string[]>(() =>
    seedScene(scene).visibility === "shared"
      ? seedScene(scene).selected
      : OPERATORS.map((o) => o.id),
  );
  const [open, setOpen] = useState(true);
  const [lastAction, setLastAction] = useState("chargé");

  useEffect(() => {
    const next = seedScene(scene);
    setDraft(next);
    setKeptShared(
      next.visibility === "shared"
        ? next.selected
        : OPERATORS.map((o) => o.id),
    );
    setOpen(true);
    setLastAction(`variante ${variant} · scène ${scene}`);
  }, [variant, scene]);

  function log(msg: string) {
    setLastAction(msg);
  }

  function onVisibility(v: Visibility) {
    if (v === "personal") {
      if (draft.visibility === "shared") setKeptShared(draft.selected);
      setDraft({ ...draft, visibility: v, selected: ["marie"] });
    } else {
      setDraft({ ...draft, visibility: v, selected: keptShared });
    }
    log(
      v === "personal"
        ? "personnel · Marie seule"
        : "partagé · sélection restaurée",
    );
  }

  function onToggle(id: string) {
    if (draft.visibility === "personal") {
      log("personnel : destinataires verrouillés");
      return;
    }
    const selected = toggleId(draft.selected, id);
    setKeptShared(selected);
    setDraft({ ...draft, selected });
    log(
      draft.selected.includes(id)
        ? `retiré ${labelFor(id)}`
        : `ajouté ${labelFor(id)}`,
    );
  }

  const heading = scene === "edit" ? "Modifier le rappel" : "Nouveau rappel";
  const bad = unreachableSelected(draft.selected);
  const lines = [
    `visibilité: ${draft.visibility === "shared" ? "partagé" : "personnel"}`,
    `sélection: ${draft.selected.map(labelFor).join(" · ") || "—"}`,
    `injoignables retenus: ${bad.map((o) => o.name).join(" · ") || "aucun"}`,
    `vide: ${draft.selected.length === 0 ? "oui — reste dû" : "non"}`,
    `feuille: ${open ? "ouverte" : "fermée"}`,
    `action: ${lastAction}`,
  ];

  const props = {
    open,
    heading,
    visibility: draft.visibility,
    selected: draft.selected,
    title: draft.title,
    onTitle: (v: string) => {
      setDraft((d) => ({ ...d, title: v }));
      log("titre modifié");
    },
    onVisibility,
    onToggle,
    onClose: () => {
      setOpen(false);
      log("feuille fermée");
    },
    onAdd: () => {
      const next = seedScene("shared");
      setDraft(next);
      setKeptShared(next.selected);
      setOpen(true);
      log("ajout · tous pré-sélectionnés");
    },
    onEdit: () => {
      const next = seedScene("edit");
      setDraft(next);
      setKeptShared(next.selected);
      setOpen(true);
      log("édition · Marie + Thomas");
    },
  };

  return (
    <div className="min-h-dvh bg-stone-200 pb-40 pt-6">
      <p className="mx-auto mb-3 max-w-xl px-4 text-center text-xs text-stone-600">
        PROTOTYPE — Destinataires sans WhatsApp. ← → pour A/B/C. Scènes dans le
        dump. Thomas et Claire sont injoignables (binaire).
      </p>
      {variant === "A" && <VariantA key={`A-${scene}`} {...props} />}
      {variant === "B" && <VariantB key={`B-${scene}`} {...props} />}
      {variant === "C" && <VariantC key={`C-${scene}`} {...props} />}
      <StateDump
        lines={lines}
        scene={scene}
        onScene={(s) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("scene", s);
          router.replace(`${pathname}?${params.toString()}`);
        }}
      />
      <PrototypeSwitcher
        current={variant}
        variants={RECIPIENT_CHIPS_VARIANTS}
      />
    </div>
  );
}
