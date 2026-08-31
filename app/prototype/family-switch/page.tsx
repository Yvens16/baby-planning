import { Suspense } from "react";
import { FamilySwitchPrototype } from "./family-switch-prototype";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Chargement…</p>}>
      <FamilySwitchPrototype />
    </Suspense>
  );
}
