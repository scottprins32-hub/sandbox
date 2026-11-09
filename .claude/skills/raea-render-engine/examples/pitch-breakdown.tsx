// A 5-second pitch-breakdown graphic for raea. Illustrative numbers for a
// fictional pitcher, not real data. Uses only exports confirmed in raea's SDK
// source (sdk/raea/src/index.tsx, sdk/math, sdk/video) on 2026-11-09.
//
//   raea render pitch-breakdown.tsx -o frame.png --frame 100   # look at a still first
//   raea render pitch-breakdown.tsx -o pitch.mp4
//   raea check pitch.mp4
import {
  AbsoluteFill, Composition, Easing, Sequence, interpolate, registerRoot,
  spring, useCurrentFrame, useVideoConfig,
} from "raea";

// 60/30/10: navy ground, slate panels, one orange accent (see color-proportion-60-30-10).
const GROUND = "#0B1B2B";   // dominant
const PANEL = "#16293D";    // secondary
const ACCENT = "#FF6A3D";   // accent: the ball and the one number to look at
const INK = "#F2F5F8";
const MUTED = "#9DB0C3";

const PITCH = {
  pitcher: "Pitcher #27 (fictional)",
  type: "4-seam fastball",
  velo: 94.2,       // mph
  spin: 2410,       // rpm
  ivb: 18.3,        // induced vertical break, inches
  hb: 9.1,          // horizontal break, inches
  // Where it crosses the zone, 0..1 from the zone's left/top edge.
  plate: { x: 0.62, y: 0.18 },
};

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// raea's JS runtime has no Intl, so toLocaleString() throws at render time
// (it typechecks fine). Group thousands by hand.
const formatNumber = (n: number, decimals: number) => {
  const [int, frac] = n.toFixed(decimals).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return frac ? `${grouped}.${frac}` : grouped;
};

function Title() {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 12], [0, 1], clamp);
  const y = interpolate(f, [0, 18], [24, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  return (
    <div style={{ position: "absolute", left: 120, top: 96, opacity, transform: `translateY(${y}px)` }}>
      <div style={{ color: MUTED, fontSize: 30, letterSpacing: 4 }}>PITCH BREAKDOWN</div>
      <div style={{ color: INK, fontSize: 64, fontWeight: 700, marginTop: 8 }}>{PITCH.type}</div>
      <div style={{ color: MUTED, fontSize: 28, marginTop: 8 }}>{PITCH.pitcher} · sample data</div>
    </div>
  );
}

// Strike zone 360x450 at a fixed spot; the ball flies in from the release point.
const ZONE = { left: 1300, top: 330, w: 360, h: 450 };

function Zone() {
  const f = useCurrentFrame();
  const opacity = interpolate(f, [0, 10], [0, 1], clamp);
  const thirds = [1, 2].map((i) => (
    <div key={`v${i}`} style={{ position: "absolute", left: (ZONE.w / 3) * i, top: 0, width: 1, height: ZONE.h, background: MUTED, opacity: 0.35 }} />
  )).concat([1, 2].map((i) => (
    <div key={`h${i}`} style={{ position: "absolute", top: (ZONE.h / 3) * i, left: 0, height: 1, width: ZONE.w, background: MUTED, opacity: 0.35 }} />
  )));
  return (
    <div style={{ position: "absolute", left: ZONE.left, top: ZONE.top, width: ZONE.w, height: ZONE.h,
                  border: `3px solid ${INK}`, opacity, background: PANEL }}>
      {thirds}
    </div>
  );
}

function Ball() {
  const f = useCurrentFrame();            // relative to its Sequence
  const flight = 14;                      // ~0.47 s at 30 fps, roughly a 94 mph fastball's flight
  const t = interpolate(f, [0, flight], [0, 1], { ...clamp, easing: Easing.in(Easing.quad) });
  const endX = ZONE.left + PITCH.plate.x * ZONE.w;
  const endY = ZONE.top + PITCH.plate.y * ZONE.h;
  const x = interpolate(t, [0, 1], [760, endX]);
  const y = interpolate(t, [0, 1], [300, endY]);
  const size = interpolate(t, [0, 1], [10, 44]);     // grows as it nears the plate
  const ring = interpolate(f, [flight, flight + 12], [44, 120], clamp);
  const ringOpacity = interpolate(f, [flight, flight + 12], [0.8, 0], clamp);
  return (
    <>
      <div style={{ position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
                    borderRadius: "50%", background: ACCENT }} />
      {f >= flight && (
        <div style={{ position: "absolute", left: endX - ring / 2, top: endY - ring / 2, width: ring, height: ring,
                      borderRadius: "50%", border: `3px solid ${ACCENT}`, opacity: ringOpacity }} />
      )}
    </>
  );
}

function Stat({ label, value, unit, index, highlight }: {
  label: string; value: number; unit: string; index: number; highlight?: boolean;
}) {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const enter = spring({ frame: f, fps, delay: index * 6, config: { damping: 14 } });
  const shown = interpolate(f, [index * 6, index * 6 + 20], [0, value], clamp);
  const decimals = Number.isInteger(value) ? 0 : 1;
  return (
    <div style={{ width: 460, padding: "22px 28px", background: PANEL, borderRadius: 14, marginBottom: 18,
                  opacity: enter, transform: `translateX(${(1 - enter) * -60}px)` }}>
      <div style={{ color: MUTED, fontSize: 24, letterSpacing: 2 }}>{label}</div>
      <div style={{ color: highlight ? ACCENT : INK, fontSize: 64, fontWeight: 700 }}>
        {formatNumber(shown, decimals)}
        <span style={{ fontSize: 30, color: MUTED, marginLeft: 10 }}>{unit}</span>
      </div>
    </div>
  );
}

function PitchBreakdown() {
  return (
    <AbsoluteFill style={{ background: GROUND, fontFamily: "sans-serif" }}>
      <Title />
      <Sequence from={10} layout="none"><Zone /></Sequence>
      <Sequence from={24} layout="none"><Ball /></Sequence>
      <Sequence from={44} layout="none">
        <div style={{ position: "absolute", left: 120, top: 330 }}>
          <Stat label="VELOCITY" value={PITCH.velo} unit="mph" index={0} highlight />
          <Stat label="SPIN RATE" value={PITCH.spin} unit="rpm" index={1} />
          <Stat label="INDUCED VERT. BREAK" value={PITCH.ivb} unit="in" index={2} />
          <Stat label="HORIZONTAL BREAK" value={PITCH.hb} unit="in" index={3} />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
}

registerRoot(() => (
  <Composition id="pitch-breakdown" component={PitchBreakdown} width={1920} height={1080} fps={30} durationInFrames={150} />
));
