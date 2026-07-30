import type { Metadata } from "next";
import { Simulator } from "./Simulator";

export const metadata: Metadata = { title: "Simulator — Scara" };

export default function SimPage() {
  return (
    <>
      <h1 className="sr-only">Simulator</h1>
      <Simulator />
    </>
  );
}
