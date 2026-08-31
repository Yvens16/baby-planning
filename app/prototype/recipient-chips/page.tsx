import { Suspense } from "react";
import { RecipientChipsPrototype } from "./recipient-chips-prototype";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Chargement…</p>}>
      <RecipientChipsPrototype />
    </Suspense>
  );
}
