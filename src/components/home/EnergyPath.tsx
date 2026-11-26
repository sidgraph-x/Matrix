/* The energy path inside one Node, and an illustrative day: generation peaks at noon,
   the battery fills through the afternoon and drains overnight, and compute stays level.
   Ported from the redesign's EnergyFlow plate. */
const A = "#FF6B2C";

export default function EnergyPath() {
  return (
    <figure className="m-0 flex flex-col gap-3 rounded-[8px] border border-[#d3cabc] bg-clay p-[clamp(16px,2.4vw,28px)] text-ink">
      <svg viewBox="0 0 1200 540" className="block h-auto w-full" role="img" aria-label="Energy path inside a Matrix Node: a source feeds storage, storage feeds compute, compute feeds the intelligence layer, and an optional grid connection trades power with storage. Below, an illustrative day: generation peaks at midday, battery charge rises and drains overnight, compute load stays steady.">
<g fill="none" strokeLinecap="round">
<path d="M194 200H386M514 200H706M834 200H1006" stroke="#D3CABC" strokeWidth="20"/>
<path className="ef-flow" d="M194 200H386M514 194H706" stroke={A} strokeWidth="4" strokeDasharray="2 14"/>
<path className="ef-flow" d="M514 206H706" stroke="#1A1714" strokeWidth="2" strokeDasharray="2 14"/>
<path className="ef-flow" d="M834 200H1006" stroke="#B07A2E" strokeWidth="4" strokeDasharray="2 14"/>
<path d="M450 264V318" stroke="#5E554B" strokeWidth="1.3" strokeDasharray="3 5"/>
</g>
<g fontFamily="var(--font-geist-mono)" fontSize="10" fill="#5E554B" letterSpacing="1.4" textAnchor="middle"><text x="290" y="178">DC · CHARGE</text><text x="610" y="178">DC BUS · 2 FEEDS</text><text x="920" y="178">FLOPS → WEIGHTS</text></g>

{/* stations */}
<g transform="translate(130 200)">
<circle r="64" fill="#EEE8DE" stroke="#1A1714" strokeWidth="1.2"/>
<circle className="ef-ring" r="76" fill="none" stroke="#1A1714" strokeWidth="5" strokeDasharray="1 10.94" strokeOpacity=".5"/>
<circle r="15" fill="none" stroke={A} strokeWidth="2"/>
<path d="M0 -26V-21M0 21V26M-26 0H-21M21 0H26M-18 -18L-15 -15M15 15L18 18M-18 18L-15 15M15 -15L18 -18" stroke={A} strokeWidth="2"/>
</g>
<g transform="translate(450 200)">
<circle r="64" fill="#EEE8DE" stroke="#1A1714" strokeWidth="1.2"/>
<circle className="ef-ring" r="76" fill="none" stroke="#1A1714" strokeWidth="5" strokeDasharray="1 10.94" strokeOpacity=".5"/>
<rect x="-20" y="-12" width="38" height="24" rx="2" fill="none" stroke="#1A1714" strokeWidth="1.6"/><rect x="18" y="-5" width="4" height="10" fill="#1A1714"/><rect x="-16" y="-8" width="22" height="16" fill={A}/>
</g>
<g transform="translate(770 200)">
<circle r="64" fill="#EEE8DE" stroke="#1A1714" strokeWidth="1.2"/>
<circle className="ef-ring" r="76" fill="none" stroke="#1A1714" strokeWidth="5" strokeDasharray="1 10.94" strokeOpacity=".5"/>
<rect x="-15" y="-15" width="30" height="30" fill="#1A1714"/><rect x="-6" y="-6" width="12" height="12" fill={A}/>
<path d="M-9 -22V-15M0 -22V-15M9 -22V-15M-9 15V22M0 15V22M9 15V22M-22 -9H-15M-22 0H-15M-22 9H-15M15 -9H22M15 0H22M15 9H22" stroke="#1A1714" strokeWidth="1.6"/>
</g>
<g transform="translate(1070 200)">
<circle r="64" fill="#1A1714" stroke="#1A1714" strokeWidth="1.2"/>
<circle className="ef-ring" r="76" fill="none" stroke={A} strokeWidth="5" strokeDasharray="1 10.94"/>
<path d="M-18 -10L0 -20L18 -8L10 14L-12 16ZM-18 -10L10 14M0 -20L-12 16M18 -8L-12 16" fill="none" stroke="#EEE8DE" strokeWidth="1.2" strokeOpacity=".7"/>
<g fill={A}><circle cx="-18" cy="-10" r="3.5"/><circle cx="0" cy="-20" r="3.5"/><circle cx="18" cy="-8" r="3.5"/><circle cx="10" cy="14" r="3.5"/><circle cx="-12" cy="16" r="3.5"/></g>
</g>
<g transform="translate(450 340)"><rect x="-58" y="-18" width="116" height="36" fill="#EEE8DE" stroke="#5E554B" strokeDasharray="3 3"/><text y="4" textAnchor="middle" fontSize="10" fill="#5E554B" letterSpacing="1.4">GRID ⇄ OPTIONAL</text></g>

<g textAnchor="middle">
<text x="130" y="310" fontSize="10" fill="#B5440F" letterSpacing="1.6">01 / SOURCE</text><text x="130" y="334" fontSize="17" fill="#1A1714" fontFamily="var(--font-geist)">Sun · wind · grid</text>
<text x="770" y="310" fontSize="10" fill="#B5440F" letterSpacing="1.6">03 / COMPUTE</text><text x="770" y="334" fontSize="17" fill="#1A1714" fontFamily="var(--font-geist)">GPU pool</text>
<text x="1070" y="310" fontSize="10" fill="#B5440F" letterSpacing="1.6">04 / INTELLIGENCE</text><text x="1070" y="334" fontSize="17" fill="#1A1714" fontFamily="var(--font-geist)">Your model</text>
<text x="450" y="104" fontSize="10" fill="#B5440F" letterSpacing="1.6">02 / STORAGE</text><text x="450" y="84" fontSize="17" fill="#1A1714" fontFamily="var(--font-geist)">On-board battery</text>
</g>

{/* 24h strip */}
<g transform="translate(60 400)">
<path d="M0 0H1080M0 120H1080" stroke="#D3CABC"/>
<path d="M0 120L270 120C360 120 380 18 540 18C700 18 720 120 810 120L1080 120Z" fill={A} fillOpacity=".16"/>
<path d="M0 120L270 120C360 120 380 18 540 18C700 18 720 120 810 120L1080 120" fill="none" stroke={A} strokeWidth="2"/>
<path d="M0 78C110 92 190 104 270 104C390 104 470 26 660 20C760 18 860 50 1080 82" fill="none" stroke="#1A1714" strokeWidth="1.6" strokeDasharray="5 5"/>
<path d="M0 66C200 64 400 68 540 65C700 62 900 67 1080 66" fill="none" stroke="#B07A2E" strokeWidth="2.2"/>
<g stroke="#5E554B"><path d="M0 120v6M270 120v6M540 120v6M810 120v6M1080 120v6"/></g>
<g fontFamily="var(--font-geist-mono)" fontSize="10" fill="#5E554B" letterSpacing="1.2"><text x="0" y="140">00</text><text x="262" y="140">06</text><text x="532" y="140">12</text><text x="802" y="140">18</text><text x="1064" y="140">24</text></g>
</g>
      </svg>
      <figcaption className="label flex flex-wrap gap-x-6 gap-y-2 !text-[10px] text-ink-2">
        <span className="flex items-center gap-2"><span className="h-[3px] w-[18px] bg-ember" />Generation</span>
        <span className="flex items-center gap-2"><span className="w-[18px] border-t-2 border-dashed border-ink" />Battery charge</span>
        <span className="flex items-center gap-2"><span className="h-[3px] w-[18px] bg-[#b07a2e]" />Compute load</span>
        <span className="ml-auto text-mute">Illustrative day, not measured data</span>
      </figcaption>
    </figure>
  );
}
