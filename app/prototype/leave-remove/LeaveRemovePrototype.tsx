"use client";

// Three variants of leave / remove / last-Operator Family-end confirmation,
// switchable via ?variant=A|B|C on throwaway /prototype/leave-remove.
// Scenes: ?scene=multi | last-op | last-family.

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

const VARIANTS = [
  { key: "A", name: nameA },
  { key: "B", name: nameB },
  { key: "C", name: nameC },
];

export function LeaveRemovePrototype() {
  const searchParams = useSearchParams();
  const variant = searchParams.get("variant") ?? "A";
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
      {variant === "B" && <VariantB key={mountKey} {...props} />}
      {variant === "C" && <VariantC key={mountKey} {...props} />}
      {variant !== "B" && variant !== "C" && (
        <VariantA key={mountKey} {...props} />
      )}
      <StatePanel session={session} scene={scene} onReset={reset} />
      <PrototypeSwitcher variants={VARIANTS} />
    </div>
  );
}
