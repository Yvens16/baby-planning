"use client";

// Winner D (default): Réglages chrome + modal leave/remove + last-Operator
// full-screen counts. A/B/C stay as the rejected alternatives.
// ?variant=A|B|C|D  ?scene=multi|last-op|last-family

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { PrototypeSwitcher } from "../PrototypeSwitcher";
import { StatePanel } from "./StatePanel";
import {
  applyLeave,
  applyRemove,
  applySwitch,
  initialSession,
  sceneFromParam,
  type Session,
} from "./model";
import { VariantA, variantName as nameA } from "./variants/VariantA";
import { VariantB, variantName as nameB } from "./variants/VariantB";
import { VariantC, variantName as nameC } from "./variants/VariantC";
import { VariantD, variantName as nameD } from "./variants/VariantD";

const VARIANTS = [
  { key: "D", name: nameD },
  { key: "A", name: nameA },
  { key: "B", name: nameB },
  { key: "C", name: nameC },
];

export function LeaveRemovePrototype() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "D";
  const scene = sceneFromParam(searchParams.get("scene"));
  const [session, setSession] = useState<Session>(() => initialSession(scene));

  useEffect(() => {
    setSession(initialSession(scene));
  }, [scene, variant]);

  function reset() {
    setSession(initialSession(scene));
  }

  const props = {
    session,
    onLeave: (familyId: string) =>
      setSession((prev) => applyLeave(prev, familyId)),
    onRemove: (familyId: string, operatorId: string) =>
      setSession((prev) => applyRemove(prev, familyId, operatorId)),
    onSwitch: (familyId: string) =>
      setSession((prev) => applySwitch(prev, familyId)),
    onDismissBanner: () =>
      setSession((prev) => ({ ...prev, banner: null })),
  };

  const mountKey = `${variant}-${scene}`;

  return (
    <div className="min-h-dvh bg-white text-zinc-950">
      {variant === "A" && <VariantA key={mountKey} {...props} />}
      {variant === "B" && <VariantB key={mountKey} {...props} />}
      {variant === "C" && <VariantC key={mountKey} {...props} />}
      {variant !== "A" && variant !== "B" && variant !== "C" && (
        <VariantD key={mountKey} {...props} />
      )}
      <StatePanel session={session} scene={scene} onReset={reset} />
      <PrototypeSwitcher variants={VARIANTS} />
    </div>
  );
}
