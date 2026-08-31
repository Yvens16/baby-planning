import { Suspense } from "react";
import { LeaveRemovePrototype } from "./LeaveRemovePrototype";

export const metadata = {
  title: "PROTOTYPE — leave / remove / Family-end",
};

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-zinc-500">
          Chargement…
        </div>
      }
    >
      <LeaveRemovePrototype />
    </Suspense>
  );
}
