"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  PrototypeSwitcher,
  PUSH_PERMISSION_VARIANTS,
  type PushPermissionVariant,
} from "../prototype-switcher";
import {
  deny,
  dropDevice,
  grant,
  install,
  resetBrowser,
  signOutThis,
} from "./actions";
import { StateDump } from "./host-ui";
import { seedScene, type ProtoState, type Scene } from "./mock-data";
import { VariantA } from "./variant-a";
import { VariantB } from "./variant-b";
import { VariantC } from "./variant-c";

// Winner: C — fat card in the feed, status pill → Device room, iPhone steps in the card.
// `?variant=A|B|C` keeps the rejected takes. `?scene=ask|denied|iphone|granted`

function parseScene(raw: string | null): Scene {
  if (raw === "denied" || raw === "iphone" || raw === "granted") return raw;
  return "ask";
}

export function PushPermissionPrototype() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const raw = searchParams.get("variant");
  const variant: PushPermissionVariant =
    raw === "A" || raw === "B" ? raw : "C";
  const scene = parseScene(searchParams.get("scene"));

  const [state, setState] = useState<ProtoState>(() => seedScene(scene));
  const [promptOpen, setPromptOpen] = useState(false);
  const [enableBlocked, setEnableBlocked] = useState(false);
  const [lastAction, setLastAction] = useState("chargé");

  useEffect(() => {
    setState(seedScene(scene));
    setPromptOpen(false);
    setEnableBlocked(false);
    setLastAction(`variante ${variant} · scène ${scene}`);
  }, [variant, scene]);

  function log(msg: string) {
    setLastAction(msg);
  }

  function onAsk() {
    if (state.platform === "iphone" && !state.installed) {
      setEnableBlocked(false);
      log("geste bloqué — écran d’accueil d’abord");
      return;
    }
    if (state.permission === "denied") {
      setEnableBlocked(true);
      log("Activer : toujours bloqué (reset navigateur d’abord)");
      return;
    }
    setEnableBlocked(false);
    setPromptOpen(true);
    log("prompt navigateur ouvert");
  }

  function onAllow() {
    setPromptOpen(false);
    setEnableBlocked(false);
    setState(grant);
    log("permission accordée · cet appareil enregistré");
  }

  function onBlock() {
    setPromptOpen(false);
    setEnableBlocked(false);
    setState(deny);
    log("permission refusée · bandeau mort");
  }

  function onEnable() {
    onAsk();
  }

  function onInstall() {
    setState(install);
    log("installé sur l’écran d’accueil · bandeau Autoriser débloqué");
  }

  function onForget(id: string) {
    const name = state.devices.find((d) => d.id === id)?.name ?? id;
    setState((s) => dropDevice(s, id));
    log(`oublié : ${name}`);
  }

  function onSignOut() {
    setState(signOutThis);
    log("déconnexion · cet appareil retiré");
  }

  function onResetBrowser() {
    setState(resetBrowser);
    setEnableBlocked(false);
    log("navigateur réinitialisé · Activer peut aboutir");
  }

  const lines = [
    `permission: ${state.permission}`,
    `plateforme: ${state.platform}${state.installed ? " · installé" : " · pas installé"}`,
    `appareils: ${state.devices.map((d) => (d.isThis ? `${d.name}*` : d.name)).join(" · ") || "—"}`,
    `prompt: ${promptOpen ? "ouvert" : "fermé"}`,
    enableBlocked ? "Activer: TOUJOURS BLOQUÉ" : null,
    `action: ${lastAction}`,
  ].filter(Boolean) as string[];

  const props = {
    state,
    promptOpen,
    onAsk,
    onAllow,
    onBlock,
    onEnable,
    onInstall,
    onForget,
    onSignOut,
  };

  return (
    <div className="min-h-dvh bg-stone-200 pb-40 pt-6">
      <p className="mx-auto mb-3 max-w-xl px-4 text-center text-xs text-stone-600">
        PROTOTYPE — gagnant: C (carte dans le fil + pièce cet appareil). ← →
        pour A/B. Scènes dans le dump. « Reset navigateur » = tu as débloqué
        Safari/Chrome.
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
        onResetBrowser={onResetBrowser}
      />
      <PrototypeSwitcher
        current={variant}
        variants={PUSH_PERMISSION_VARIANTS}
      />
    </div>
  );
}
