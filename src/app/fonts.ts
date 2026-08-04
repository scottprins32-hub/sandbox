// The design-system typefaces, served from the repo via next/font/local so
// builds stay hermetic (no network fetch). Same TTFs the PDFs embed.

import localFont from "next/font/local";

export const instrumentSans = localFont({
  src: [
    { path: "../assets/fonts/InstrumentSans_400Regular.ttf", weight: "400", style: "normal" },
    { path: "../assets/fonts/InstrumentSans_500Medium.ttf", weight: "500", style: "normal" },
    { path: "../assets/fonts/InstrumentSans_600SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../assets/fonts/InstrumentSans_700Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-instrument",
  display: "swap",
});

export const spaceGrotesk = localFont({
  src: [
    { path: "../assets/fonts/SpaceGrotesk_500Medium.ttf", weight: "500", style: "normal" },
    { path: "../assets/fonts/SpaceGrotesk_700Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-grotesk",
  display: "swap",
});

/** className for the <html> element of every route-group root. */
export const fontVars = `${instrumentSans.variable} ${spaceGrotesk.variable}`;
