"use client";

// Three variants of the zero-Family home after sign-in, switchable via
// ?variant=A|B|C on throwaway /prototype/zero-family. Winner: A (two doors)
// + bottom sheet for create/join; ?scene=first|left is the same screen.

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PrototypeSwitcher } from "../PrototypeSwitcher";
import { StatePanel } from "./StatePanel";
import {
  initialSession,
  lookupInvite,
  type Scene,
  type Session,
} from "./model";
import { VariantA, variantName as nameA } from "./variants/VariantA";
import { VariantB, variantName as nameB } from "./variants/VariantB";
import { VariantC, variantName as nameC } from "./variants/VariantC";

const VARIANTS = [
  { key: "A", name: nameA },
  { key: "B", name: nameB },
  { key: "C", name: nameC },
];

export function ZeroFamilyPrototype() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";
  const scene: Scene = searchParams.get("scene") === "left" ? "left" : "first";
  const [session, setSession] = useState<Session>(() => initialSession(scene));

  useEffect(() => {
    setSession(initialSession(scene));
  }, [scene, variant]);

  function reset() {
    setSession(initialSession(scene));
  }

  function onCreate(name: string, timezone: string) {
    setSession((prev) => ({
      ...prev,
      families: [{ name, timezone }],
      lastAction: "created",
      pendingJoin: null,
    }));
  }

  function onPreviewJoin(input: string) {
    const result = lookupInvite(input);
    if (result.status !== "valid") {
      setSession((prev) => ({
        ...prev,
        lastAction: result.status === "consumed" ? "join-consumed" : "join-invalid",
        pendingJoin: null,
      }));
      return;
    }
    setSession((prev) => ({
      ...prev,
      pendingJoin: result.family,
      lastAction: "none",
    }));
  }

  function onConfirmJoin() {
    setSession((prev) => {
      if (!prev.pendingJoin) return prev;
      return {
        ...prev,
        families: [prev.pendingJoin],
        pendingJoin: null,
        lastAction: "joined",
      };
    });
  }

  function onCancelJoin() {
    setSession((prev) => ({ ...prev, pendingJoin: null }));
  }

  const props = {
    session,
    onCreate,
    onPreviewJoin,
    onConfirmJoin,
    onCancelJoin,
  };

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      {variant === "B" && <VariantB {...props} />}
      {variant === "C" && <VariantC {...props} />}
      {variant !== "B" && variant !== "C" && <VariantA {...props} />}
      <StatePanel session={session} onReset={reset} />
      <PrototypeSwitcher variants={VARIANTS} />
    </div>
  );
}
