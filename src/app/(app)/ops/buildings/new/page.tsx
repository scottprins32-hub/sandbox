import type { Metadata } from "next";
import { createBuildingAction } from "../../actions";
import { BuildingForm } from "../BuildingForm";

export const metadata: Metadata = { title: "New building · Scara" };

export default function NewBuildingPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold tracking-tight">Add building</h1>
      <div className="mt-4 rounded-xl bg-surface p-4 shadow-card">
        <BuildingForm action={createBuildingAction} submitLabel="Create building" />
      </div>
    </div>
  );
}
