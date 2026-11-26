"use client";

/* The Matrix Node in isometric section: battery skid, compute hall, roof deck
   (solar, dry coolers, dish) and the glass intelligence layer.
   Geometry is ported from the redesign's NodeCore plate; layer offsets are motion values,
   so the same drawing can sit assembled in a landscape or come apart on scroll. */
import { useId } from "react";
import { motion, useTransform, type MotionValue } from "framer-motion";

export type NodeLayer = "all" | "energy" | "compute" | "link" | "intelligence";

const A = "#FF6B2C";

export default function NodeIso({
  ex,
  active = "all",
  labels = true,
  intel = true,
  className,
  title = "The Matrix Node: a battery skid at the base, a compute hall, a roof deck with solar, dry coolers and a satellite dish, and a glass intelligence layer above.",
}: {
  /** 0 = assembled, 1 = fully exploded */
  ex: MotionValue<number>;
  active?: NodeLayer;
  labels?: boolean;
  intel?: boolean;
  className?: string;
  title?: string;
}) {
  const P = useId().replace(/:/g, "") + "-";
  const eY = useTransform(ex, [0, 1], [-80, 0]);
  const cY = useTransform(ex, [0, 1], [10, 0]);
  const tY = useTransform(ex, [0, 1], [90, 0]);
  const iY = useTransform(ex, [0, 1], [140, 0]);
  const guide = useTransform(ex, [0.55, 1], [0, 1]);
  const on = (k: NodeLayer) => active === "all" || active === k;
  const op = (k: NodeLayer) => (on(k) ? 1 : 0.14);
  const rOp = active === "intelligence" ? 0.14 : 1;

  return (
    <svg viewBox="0 0 1000 1010" className={className} style={{ display: "block", width: "100%", height: "auto", overflow: "visible", fontFamily: "var(--font-geist-mono)" }} role="img" aria-label={title}>
<defs>
<linearGradient id={P+"tb"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#F6F2EB"/><stop offset="1" stopColor="#DCD5C9"/></linearGradient>
<linearGradient id={P+"lb"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#DED7CB"/><stop offset="1" stopColor="#C6BEB0"/></linearGradient>
<linearGradient id={P+"rb"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ABA295"/><stop offset="1" stopColor="#8E8577"/></linearGradient>
<linearGradient id={P+"td"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4C463F"/><stop offset="1" stopColor="#35302B"/></linearGradient>
<linearGradient id={P+"ld"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3A3530"/><stop offset="1" stopColor="#27231F"/></linearGradient>
<linearGradient id={P+"rd"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#28241F"/><stop offset="1" stopColor="#1A1815"/></linearGradient>
<linearGradient id={P+"ao"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#000" stopOpacity="0"/><stop offset="1" stopColor="#000" stopOpacity=".28"/></linearGradient>
<linearGradient id={P+"pv"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#34404F"/><stop offset=".45" stopColor="#1B232E"/><stop offset="1" stopColor="#10151C"/></linearGradient>
<linearGradient id={P+"sheen"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".22"/><stop offset=".35" stopColor="#fff" stopOpacity="0"/><stop offset=".7" stopColor="#fff" stopOpacity=".06"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
<linearGradient id={P+"cu"} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E09A5E"/><stop offset="1" stopColor="#9A5A2C"/></linearGradient>
<linearGradient id={P+"gl"} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={A} stopOpacity=".16"/><stop offset="1" stopColor={A} stopOpacity=".03"/></linearGradient>
<radialGradient id={P+"dish"} cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#FBF8F2"/><stop offset="1" stopColor="#B9B1A4"/></radialGradient>
<filter id={P+"blur"} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="18"/></filter>
<filter id={P+"glow"} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id={P+"louv"} width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" fill="#B9B1A3"/><path d="M0 .75H8" stroke="#F1ECE3" strokeWidth="1.5"/><path d="M0 4.5H8" stroke="#8A8274" strokeWidth="1.5"/></pattern>
<pattern id={P+"louvd"} width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" fill="#7D7568"/><path d="M0 .75H8" stroke="#A39A8C" strokeWidth="1.5"/><path d="M0 4.5H8" stroke="#5C554B" strokeWidth="1.5"/></pattern>
<pattern id={P+"louvk"} width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" fill="#221F1B"/><path d="M0 .75H8" stroke="#45403A" strokeWidth="1.5"/><path d="M0 4.5H8" stroke="#141210" strokeWidth="1.5"/></pattern>
<pattern id={P+"door"} x="12" width="67" height="70" patternUnits="userSpaceOnUse"><rect y="10" width="60" height="46" fill="#2F2B27" stroke="#4A453E"/><rect x="52" y="27" width="3" height="12" fill="#9A9184"/><rect x="7" y="16" width="10" height="2" fill={A}/><path d="M7 46H44" stroke="#3E3934"/></pattern>
<pattern id={P+"batt"} x="14" y="14" width="56" height="40" patternUnits="userSpaceOnUse"><rect x="2" y="2" width="52" height="36" rx="2" fill="#2A2622" stroke="#47423B"/><rect x="8" y="7" width="6" height="4" fill="#C9C1B3"/><rect x="42" y="7" width="6" height="4" fill={`url(#${P}cu)`}/><path d="M8 26H48M8 31H48" stroke="#3A3530"/></pattern>
<pattern id={P+"rack"} x="24" y="24" width="31" height="36" patternUnits="userSpaceOnUse"><rect width="31" height="36" fill="#1A1815"/><rect x="1" y="1" width="29" height="34" fill="#23201C" stroke="#35302B"/><circle cx="7" cy="7" r="1.6" fill={A}/><path d="M5 16H26M5 21H26M5 26H26" stroke="#302B26"/></pattern>
<pattern id={P+"cells"} width="14.375" height="16.25" patternUnits="userSpaceOnUse"><path d="M14.375 0V16.25M0 16.25H14.375" stroke="#4A5868" strokeWidth=".6"/></pattern>
<path id={P+"blade"} d="M0 -3L21 -9C24 -6 24 -1 22 2L0 3Z" fill="#5E574D"/>
</defs>

{/* ===== L1 ENERGY SKID ===== */}
<g transform="translate(330 700)"><motion.g style={{ y: eY }} opacity={op("energy")} className="ly">
<polygon points="-40,20 400,240 250,330 -190,100" fill="#000" opacity=".7" filter={`url(#${P}blur)`}/>
<g transform="matrix(0.866 0.5 -0.866 0.5 0 -70)">
<rect width="420" height="150" fill={`url(#${P}td)`}/>
<rect x="8" y="8" width="404" height="134" fill="#1C1A17"/>
<rect x="14" y="14" width="392" height="122" fill={`url(#${P}batt)`}/>
<rect x="14" y="72" width="392" height="6" fill={`url(#${P}cu)`}/>
<path d="M0 150H420V0" fill="none" stroke="#fff" strokeOpacity=".18"/>
</g>
<g transform="matrix(0.866 0.5 0 1 -129.9 5)">
<rect width="420" height="70" fill={`url(#${P}ld)`}/>
<rect x="12" width="402" height="70" fill={`url(#${P}door)`}/>
<rect width="420" height="2" fill={A}/>
<rect y="61" width="420" height="9" fill="#181613"/>
<rect x="70" y="62" width="58" height="7" fill="#0B0A09"/><rect x="292" y="62" width="58" height="7" fill="#0B0A09"/>
<rect y="44" width="420" height="26" fill={`url(#${P}ao)`}/>
</g>
<g transform="matrix(0.866 -0.5 0 1 233.8 215)">
<rect width="150" height="70" fill={`url(#${P}rd)`}/>
<rect x="10" y="10" width="72" height="44" fill={`url(#${P}louvk)`} stroke="#3A3530"/>
<rect x="92" y="10" width="48" height="44" fill="#211E1A" stroke="#3A3530"/>
<rect x="100" y="17" width="14" height="10" fill="#D9A55B"/>
<rect width="150" height="2" fill={A} fillOpacity=".7"/>
<rect y="61" width="150" height="9" fill="#141210"/>
<rect y="44" width="150" height="26" fill={`url(#${P}ao)`}/>
</g>
{labels && (<>
<path d="M363.7 175L420 145H450" fill="none" stroke="#5A4E43"/><circle cx="363.7" cy="175" r="2.5" fill="#D9A55B"/>
<text x="458" y="135" fontSize="16" fill="#D9A55B" letterSpacing="1.6">L1 / ENERGY</text>
<text x="458" y="166" fontSize="21" fill="#EDE6DA" fontFamily="var(--font-geist)">Battery + power skid</text>
</>)}
</motion.g></g>

{/* ===== L2 COMPUTE HALL ===== */}
<g transform="translate(330 540)"><motion.g style={{ y: cY }} opacity={op("compute")} className="ly">
<motion.g style={{ opacity: guide }}><path d="M233.8 285v90" stroke="#3D352E" strokeDasharray="2 5"/><path className="flow" d="M363.7 300V210" stroke={A} strokeWidth="2" strokeDasharray="3 7"/><path className="flow" d="M-129.9 75V165" stroke="#D9A55B" strokeWidth="1.5" strokeDasharray="3 7"/></motion.g>
<g transform="matrix(0.866 0.5 -0.866 0.5 0 -130)">
<rect width="420" height="150" fill={`url(#${P}tb)`}/>
<rect x="10" y="10" width="400" height="130" fill="#15130F"/>
<rect x="16" y="14" width="388" height="4" fill={`url(#${P}cu)`}/>
<rect x="24" y="24" width="372" height="36" fill={`url(#${P}rack)`}/>
<rect x="24" y="64" width="372" height="22" fill="#2A2622"/>
<rect x="24" y="73" width="372" height="4" fill={A} fillOpacity=".85"/>
<rect x="24" y="90" width="372" height="36" fill={`url(#${P}rack)`}/>
<path d="M0 150H420V0" fill="none" stroke="#fff" strokeOpacity=".7"/>
</g>
<g transform="matrix(0.866 0.5 0 1 -129.9 -55)">
<rect width="420" height="130" fill={`url(#${P}lb)`}/>
<path d="M104 8V122M210 8V122M316 8V122" stroke="#AFA799"/><path d="M105 8V122M211 8V122M317 8V122" stroke="#EEE8DE"/>
<rect x="8" y="12" width="404" height="2" fill={A}/>
<rect x="20" y="22" width="70" height="98" fill="#D6CFC2" stroke="#A39B8D"/>
<rect x="30" y="34" width="16" height="22" fill="#3A3530"/>
<rect x="78" y="66" width="3" height="16" fill="#3A3530"/>
<rect x="116" y="30" width="80" height="50" fill={`url(#${P}louv)`} stroke="#A39B8D"/>
<text x="222" y="62" fontFamily="var(--font-geist)" fontWeight="500" fontSize="21" letterSpacing="5" fill="#2B2723">MATRIX</text>
<text x="223" y="78" fontSize="8" letterSpacing="2.2" fill="#6B6357">NODE · MX-01</text>
<rect x="223" y="84" width="84" height="2" fill={A}/>
<rect x="326" y="30" width="80" height="50" fill={`url(#${P}louv)`} stroke="#A39B8D"/>
<rect x="326" y="92" width="22" height="14" fill="#B5AD9F"/><rect x="352" y="92" width="10" height="14" fill="#D9A55B" fillOpacity=".8"/>
<rect y="96" width="420" height="34" fill={`url(#${P}ao)`}/>
<rect width="420" height="8" fill="#2B2723"/><rect y="122" width="420" height="8" fill="#2B2723"/><rect width="8" height="130" fill="#2B2723"/><rect x="412" width="8" height="130" fill="#2B2723"/>
</g>
<g transform="matrix(0.866 -0.5 0 1 233.8 155)">
<rect width="150" height="130" fill={`url(#${P}rb)`}/>
<rect x="18" y="24" width="54" height="72" fill="#9A9183" stroke="#7B7366"/>
<rect x="26" y="34" width="22" height="14" fill="#7B7366"/><circle cx="60" cy="41" r="3" fill={A}/>
<rect x="86" y="24" width="50" height="54" fill={`url(#${P}louvd)`} stroke="#7B7366"/>
<rect x="30" y="96" width="6" height="26" fill="#5E574D"/><rect x="46" y="96" width="6" height="26" fill="#5E574D"/>
<rect y="96" width="150" height="34" fill={`url(#${P}ao)`}/>
<rect width="150" height="8" fill="#211E1A"/><rect y="122" width="150" height="8" fill="#211E1A"/><rect width="8" height="130" fill="#211E1A"/><rect x="142" width="8" height="130" fill="#211E1A"/>
</g>
{labels && (<>
<path d="M363.7 145L420 115H450" fill="none" stroke="#5A4E43"/><circle cx="363.7" cy="145" r="2.5" fill="#EDE6DA"/>
<text x="458" y="105" fontSize="16" fill="#A39888" letterSpacing="1.6">L2 / COMPUTE</text>
<text x="458" y="136" fontSize="21" fill="#EDE6DA" fontFamily="var(--font-geist)">GPU hall · liquid-cooled</text>
</>)}
</motion.g></g>

{/* ===== L2 ROOF: SOLAR · COOLING · LINK ===== */}
<g transform="translate(330 330)"><motion.g style={{ y: tY }} className="ly">
<motion.g style={{ opacity: guide }}><path d="M233.8 285v80" stroke="#3D352E" strokeDasharray="2 5"/><path className="flow" d="M363.7 290V210" stroke={A} strokeWidth="2" strokeDasharray="3 7"/><path className="flow" d="M-129.9 75V155" stroke="#D9A55B" strokeWidth="1.5" strokeDasharray="3 7"/></motion.g>
<g opacity={rOp} className="gd">
<g transform="matrix(0.866 0.5 -0.866 0.5 0 -30)"><rect width="420" height="150" fill={`url(#${P}td)`}/><path d="M0 150H420V0" fill="none" stroke="#fff" strokeOpacity=".18"/></g>
<g transform="matrix(0.866 0.5 0 1 -129.9 45)"><rect width="420" height="30" fill={`url(#${P}ld)`}/><rect x="20" y="13" width="380" height="2" fill={A} fillOpacity=".6"/><rect y="16" width="420" height="14" fill={`url(#${P}ao)`}/></g>
<g transform="matrix(0.866 -0.5 0 1 233.8 255)"><rect width="150" height="30" fill={`url(#${P}rd)`}/></g>
</g>
{/* solar array */}
<g opacity={op("energy")} className="gd">
<g transform="matrix(0.866 0.5 -0.866 0.5 1.73 -29)">
<rect width="230" height="130" fill={`url(#${P}pv)`}/>
<rect width="230" height="130" fill={`url(#${P}cells)`}/>
<path d="M57.5 0V130M115 0V130M172.5 0V130M0 65H230" stroke="#CFC8BC" strokeWidth="2"/>
<rect width="230" height="130" fill={`url(#${P}sheen)`}/>
<rect width="230" height="130" fill="none" stroke="#DCD5C9" strokeWidth="2.5"/>
</g>
<g transform="matrix(0.866 0.5 0 1 -110.85 36)"><rect width="230" height="10" fill="#9A9184"/></g>
<g transform="matrix(0.866 -0.5 0 1 88.33 151)"><rect width="130" height="10" fill="#6E665A"/></g>
</g>
{/* link mast + dish */}
<g opacity={op("link")} className="gd">
<path d="M339.5 172V78" stroke="#8E8577" strokeWidth="4"/><path d="M338 172V78" stroke="#D6CFC2" strokeWidth="1"/>
<path d="M352 168L362 96" stroke="#A39888" strokeWidth="1.5"/><circle cx="362" cy="95" r="2.5" fill={A}/>
<g transform="translate(332 74) rotate(-24)"><ellipse rx="34" ry="13" fill={`url(#${P}dish)`} stroke="#8E8577"/><ellipse rx="22" ry="8" fill="none" stroke="#C9C1B3"/><path d="M0 0L-4 -26" stroke="#5E574D" strokeWidth="1.5"/><circle cx="-4" cy="-28" r="3" fill="#2B2723"/></g>
</g>
{/* dry coolers */}
<g opacity={op("compute")} className="gd">
<g transform="matrix(0.866 0.5 -0.866 0.5 218.23 84)">
<rect width="146" height="62" fill={`url(#${P}tb)`} stroke="#B5AD9F"/>
<g transform="translate(38 31)"><circle r="25" fill="#1C1A17" stroke="#8E8577" strokeWidth="1.5"/><g className="fan"><use href={`#${P}blade`}/><use href={`#${P}blade`} transform="rotate(72)"/><use href={`#${P}blade`} transform="rotate(144)"/><use href={`#${P}blade`} transform="rotate(216)"/><use href={`#${P}blade`} transform="rotate(288)"/></g><circle r="5" fill="#9A9184"/><circle r="25" fill="none" stroke="#3A3530" strokeDasharray="1 3"/></g>
<g transform="translate(108 31)"><circle r="25" fill="#1C1A17" stroke="#8E8577" strokeWidth="1.5"/><g className="fan" style={{ animationDuration: "1.7s" }}><use href={`#${P}blade`}/><use href={`#${P}blade`} transform="rotate(72)"/><use href={`#${P}blade`} transform="rotate(144)"/><use href={`#${P}blade`} transform="rotate(216)"/><use href={`#${P}blade`} transform="rotate(288)"/></g><circle r="5" fill="#9A9184"/><circle r="25" fill="none" stroke="#3A3530" strokeDasharray="1 3"/></g>
</g>
<g transform="matrix(0.866 0.5 0 1 164.54 115)"><rect width="146" height="22" fill={`url(#${P}louv)`} stroke="#A39B8D"/></g>
<g transform="matrix(0.866 -0.5 0 1 290.98 188)"><rect width="62" height="22" fill={`url(#${P}louvd)`} stroke="#7B7366"/></g>
<g transform="matrix(0.866 0.5 -0.866 0.5 157.61 119)">
<rect width="146" height="62" fill={`url(#${P}tb)`} stroke="#B5AD9F"/>
<g transform="translate(38 31)"><circle r="25" fill="#1C1A17" stroke="#8E8577" strokeWidth="1.5"/><g className="fan" style={{ animationDuration: "1.2s" }}><use href={`#${P}blade`}/><use href={`#${P}blade`} transform="rotate(72)"/><use href={`#${P}blade`} transform="rotate(144)"/><use href={`#${P}blade`} transform="rotate(216)"/><use href={`#${P}blade`} transform="rotate(288)"/></g><circle r="5" fill="#9A9184"/></g>
<g transform="translate(108 31)"><circle r="25" fill="#1C1A17" stroke="#8E8577" strokeWidth="1.5"/><g className="fan" style={{ animationDuration: "1.55s" }}><use href={`#${P}blade`}/><use href={`#${P}blade`} transform="rotate(72)"/><use href={`#${P}blade`} transform="rotate(144)"/><use href={`#${P}blade`} transform="rotate(216)"/><use href={`#${P}blade`} transform="rotate(288)"/></g><circle r="5" fill="#9A9184"/></g>
</g>
<g transform="matrix(0.866 0.5 0 1 103.92 150)"><rect width="146" height="22" fill={`url(#${P}louv)`} stroke="#A39B8D"/><rect y="12" width="146" height="10" fill={`url(#${P}ao)`}/></g>
<g transform="matrix(0.866 -0.5 0 1 230.36 223)"><rect width="62" height="22" fill={`url(#${P}louvd)`} stroke="#7B7366"/></g>
</g>
<g opacity={rOp} className="gd">
{labels && (<>
<path d="M363.7 195L420 165H450" fill="none" stroke="#5A4E43"/><circle cx="363.7" cy="195" r="2.5" fill="#EDE6DA"/>
<text x="458" y="155" fontSize="16" fill="#A39888" letterSpacing="1.6">ROOF / SOLAR · COOLING · LINK</text>
<text x="458" y="186" fontSize="21" fill="#EDE6DA" fontFamily="var(--font-geist)">PV array · dry coolers · dish</text>
</>)}
</g>
</motion.g></g>

{/* ===== L3 INTELLIGENCE (glass) ===== */}
<g transform="translate(330 130)"><motion.g style={{ y: iY, display: intel ? undefined : "none" }} opacity={op("intelligence")} className="ly">
<motion.g style={{ opacity: guide }}><path className="flow" d="M363.7 380V210M-129.9 245V75" stroke={A} strokeOpacity=".6" strokeWidth="1.3" strokeDasharray="3 7"/></motion.g>
<g transform="matrix(0.866 0.5 0 1 -129.9 70)"><rect width="420" height="5" fill={A} fillOpacity=".55"/></g>
<g transform="matrix(0.866 -0.5 0 1 233.8 280)"><rect width="150" height="5" fill={A} fillOpacity=".35"/></g>
<g transform="matrix(0.866 0.5 -0.866 0.5 0 -5)">
<rect width="420" height="150" fill={`url(#${P}gl)`} stroke={A} strokeOpacity=".8"/>
<rect x="10" y="8" width="400" height="134" fill="none" stroke={A} strokeOpacity=".25"/>
<rect width="420" height="150" fill={`url(#${P}sheen)`}/>
<g filter={`url(#${P}glow)`}>
<path d="M50 30L160 22L265 40L370 26M50 30L95 78M160 22L95 78M160 22L205 72M265 40L205 72M265 40L310 85M370 26L310 85M95 78L205 72L310 85M95 78L45 124M95 78L155 126M205 72L155 126M205 72L268 120M310 85L268 120M310 85L375 112M45 124L155 126L268 120L375 112" fill="none" stroke={A} strokeWidth="1.2" strokeOpacity=".75"/>
<g fill="#12100E" stroke={A} strokeWidth="1.4"><circle cx="50" cy="30" r="5"/><circle cx="265" cy="40" r="5"/><circle cx="370" cy="26" r="5"/><circle cx="95" cy="78" r="5"/><circle cx="45" cy="124" r="5"/><circle cx="155" cy="126" r="5"/><circle cx="375" cy="112" r="5"/></g>
<g fill={A}><circle className="breathe" cx="160" cy="22" r="6"/><circle className="breathe" cx="205" cy="72" r="8" style={{ animationDelay: ".6s" }}/><circle className="breathe" cx="310" cy="85" r="6" style={{ animationDelay: "1.2s" }}/><circle className="breathe" cx="268" cy="120" r="6" style={{ animationDelay: "1.8s" }}/></g>
</g>
</g>
{labels && (<>
<path d="M363.7 207L420 177H450" fill="none" stroke="#5A4E43"/><circle cx="363.7" cy="207" r="2.5" fill={A}/>
<text x="458" y="167" fontSize="16" fill={A} letterSpacing="1.6">L3 / INTELLIGENCE</text>
<text x="458" y="198" fontSize="21" fill="#EDE6DA" fontFamily="var(--font-geist)">Continual · sovereign model</text>
</>)}
</motion.g></g>
    </svg>
  );
}
