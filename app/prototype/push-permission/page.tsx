import { Suspense } from "react";
import { PushPermissionPrototype } from "./push-permission-prototype";

export default function Page() {
  return (
    <Suspense fallback={<p className="p-8 text-sm">Chargement…</p>}>
      <PushPermissionPrototype />
    </Suspense>
  );
}
