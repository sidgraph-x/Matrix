/* Ported from the Illustrated Atlas (detail-new.js). */
/* Precise statements, baselines and key papers for each problem.
   B rows: [quantity, best result or baseline, source (markdown link or plain text)] */
export const DETAIL = {
A1: {
  formal: ["Reach and sustain a burning deuterium–tritium plasma whose fusion power exceeds the heating power by a large factor, long enough and reliably enough to run a power plant. Physics gain is Q = P_fus / P_heat; ignition requires the Lawson triple product to exceed a threshold near T ≈ 10–20 keV. A plant also needs disruptions to be predicted and avoided or mitigated, because a single unmitigated disruption at reactor scale can damage the wall."],
  eq: ["Q = P_fusion / P_heating", "n · T · τ_E ≳ 3 × 10²¹ keV·s·m⁻³   (D–T ignition, T ≈ 10–20 keV)", "ITER mission: Q = 10, P_fus ≈ 500 MW, 300–500 s pulses"],
  base: [
    ["Inertial fusion: record yield and gain", "8.6 MJ from 2.08 MJ of laser energy, target gain 4.13 (NIF, 7 Apr 2025)", "[LLNL Annual Report 2025](https://annual.llnl.gov/sites/annual/files/2026-02/llnlannual25-3-national-ignition-facility.pdf)"],
    ["Inertial fusion: first gain above 1", "3.15 MJ from 2.05 MJ (NIF, 5 Dec 2022)", "[Abu-Shawareb et al., PRL 132, 065102 (2024)](https://doi.org/10.1103/PhysRevLett.132.065102)"],
    ["Magnetic fusion: fusion energy in one pulse", "69.26 MJ over ≈5 s from 0.21 mg of fuel (JET pulse #104522, 3 Oct 2023, final D–T campaign)", "[EUROfusion](https://euro-fusion.org/eurofusion-news/dte3record/); [UK Gov](https://www.gov.uk/government/news/jets-final-tritium-experiments-yield-new-fusion-energy-record)"],
    ["Long-pulse triple product", "World record for long pulses, held 43 s (W7-X stellarator, 22 May 2025); 1.8 GJ energy turnover over 6 min", "[IPP](https://www.ipp.mpg.de/5532945/w7x)"],
    ["Cross-machine disruption prediction", "AUC 0.801 (C-Mod), 0.947 (DIII-D), 0.973 (EAST)", "[Zhu et al., 2020](https://arxiv.org/abs/2007.01401)"],
  ],
  papers: [["Lawson, Proc. Phys. Soc. B 70, 6 (1957): ignition criterion", "https://doi.org/10.1088/0370-1301/70/1/303"], ["Abu-Shawareb et al., PRL 2024: target gain above unity", "https://doi.org/10.1103/PhysRevLett.132.065102"], ["ITER Physics Basis, Nucl. Fusion 39 (1999)", "https://doi.org/10.1088/0029-5515/39/12/301"], ["Kates-Harbeck et al., Nature 2019: deep learning disruption prediction", "https://doi.org/10.1038/s41586-019-1116-4"], ["Degrave et al., Nature 2022: RL magnetic control of tokamak plasmas", "https://doi.org/10.1038/s41586-021-04301-9"], ["Seo et al., Nature 2024: avoiding tearing instability with RL", "https://doi.org/10.1038/s41586-024-07024-9"]],
},
A2: {
  formal: ["Find first-wall, blanket and divertor materials that keep their strength, ductility and dimensions after fusion-neutron doses of 20 dpa (DEMO first phase) to 50 dpa (second phase), while accumulating helium at roughly ten times the per-dpa rate of fission spectra, at 300–550 °C for steels and under steady heat fluxes up to about 10 MW/m² on the divertor. The blanket must also breed tritium (problem 3.4)."],
  eq: ["dose:  20 dpa_NRT (DEMO phase 1) → 50 dpa_NRT (phase 2)", "He/dpa:  ≈ 13–15 appm (fusion first wall)  vs  ≲ 1 appm (most fission spectra)", "divertor:  10 MW/m² steady, 20 MW/m² slow transients (ITER W divertor)"],
  base: [
    ["Fusion-spectrum test capability", "IFMIF-DONES (under construction): >20 dpa_NRT per full-power year, ≈13–15 appm He/dpa, 50–60 appm H/dpa, flux >5×10¹⁴ n/cm²/s", "[KIT/IFMIF-DONES HFTM](https://publikationen.bibliothek.kit.edu/1000139403/130575568)"],
    ["DONES irradiation targets", "0.3 L at 20–30 dpa in <2.5 years; 0.1 L at 50 dpa in <3 years", "[KIT](https://publikationen.bibliothek.kit.edu/1000091743/23570305)"],
    ["Surviving damage per displacement (Fe)", "≈30% of NRT displacements survive at high recoil energy (arc-dpa)", "[Nordlund et al., Nat. Commun. 2018](https://doi.org/10.1038/s41467-018-03415-5)"],
    ["Reference structural steel", "EUROFER97 reduced-activation ferritic-martensitic steel; operating window roughly 350–550 °C (embrittlement below, creep above)", "Zinkle & Snead 2014 (see papers)"],
  ],
  papers: [["Zinkle & Snead, Annu. Rev. Mater. Res. 2014: designing radiation resistance for fusion", "https://doi.org/10.1146/annurev-matsci-070813-113627"], ["Knaster, Moeslang & Muroga, Nature Physics 2016: materials research for fusion", "https://doi.org/10.1038/nphys3735"], ["Nordlund et al., Nat. Commun. 2018: improving atomic displacement and replacement calculations", "https://doi.org/10.1038/s41467-018-03415-5"], ["Abdou et al., Nucl. Fusion 2021: physics and technology considerations for tritium self-sufficiency", "https://doi.org/10.1088/1741-4326/abbf35"], ["IFMIF-DONES status, IAEA 2025 (Ibarra)", "https://conferences.iaea.org/event/406/contributions/37622/attachments/20809/35198/Angel%20Ibarra%20-%20IFMIF%20DONES.pdf"]],
},
A3: {
  formal: ["Qualify a new fuel form and its structural materials so that, with statistical confidence, coating or cladding failure stays below the design limit through the target burnup, the licensed temperature range and design-basis accidents. For TRISO that means very low particle failure fractions at high burnup and during heat-ups to about 1600 °C. Today this is demonstrated by irradiation in test reactors, post-irradiation examination and accident heating tests, which together take about a decade."],
  eq: ["burnup in % FIMA (fissions per initial metal atom)", "accident test: hold at 1600–1800 °C, measure fission-product release", "HALEU: 5–20% U-235"],
  base: [
    ["TRISO irradiation (AGR-1, ATR)", "Peak 19.6% FIMA; zero TRISO failures among ≈298,000 particles; time-averaged temperatures 955–1136 °C", "[INL AGR-1 PIE](https://inldigitallibrary.inl.gov/sites/sti/sti/6688458.pdf); [Demkowicz et al.](https://www.osti.gov/servlets/purl/1358266)"],
    ["Licensing milestone", "Kairos Hermes: first US non-light-water construction permit in about 50 years (Dec 2023)", "NRC (public record)"],
    ["Fast-spectrum irradiation capacity", "US Versatile Test Reactor cancelled; Western fast-spectrum testing is scarce", "Problem map (Tab 1)"],
  ],
  papers: [["Demkowicz et al., Key results from AGR-1 UCO TRISO irradiation and PIE (2016)", "https://www.osti.gov/servlets/purl/1358266"], ["Demkowicz et al., Irradiation performance of AGR-1, Nucl. Eng. Des. 306 (2016)", "https://doi.org/10.1016/j.nucengdes.2015.09.011"], ["Williamson et al., BISON multidimensional fuel performance, J. Nucl. Mater. 2012", "https://doi.org/10.1016/j.jnucmat.2012.01.012"], ["OpenMC (Romano et al., Ann. Nucl. Energy 2015)", "https://doi.org/10.1016/j.anucene.2014.07.048"]],
},
A4: {
  formal: ["Create and sustain an engineered fracture network in hot, low-permeability rock that circulates fluid at high rate with uniform sweep, so production temperature stays near the rock temperature for 20–30 years, while keeping induced seismicity below hazard thresholds. Electric output scales with mass flow times the temperature drop across the plant."],
  eq: ["P_th = ṁ · c_p · (T_prod − T_inj)", "thermal breakthrough: T_prod(t) falls once a dominant flow path cools", "seismic constraint: keep induced events below a site-specific magnitude"],
  base: [
    ["Field-scale EGS pilot (Project Red, Nevada, 2023)", "63 L/s in a 30-day test, 3.5 MW; horizontal laterals at ≈2,350 m true vertical depth", "[ThinkGeoEnergy](https://www.thinkgeoenergy.com/fervo-energy-reports-breakthrough-in-field-scale-egs-project-in-nevada/); [Norbeck & Latimer, EarthArXiv](https://doi.org/10.31223/X52X0B)"],
    ["First utility-scale EGS power", "Cape Station (Utah): first 33 MW GeoBlock commercial on 30 Sep 2026; Phase I ≈100 MW; 400 MW Phase II targeted for 2028", "[Energy Global](https://www.energyglobal.com/other-renewables/05102026/fervo-energy-declares-commercial-operation-at-cape-station-ahead-of-schedule/); [IEEE Spectrum](https://spectrum.ieee.org/fervo-cape-station-geothermal)"],
    ["Seismic failure cases", "Basel (2006, ML 3.4) halted; Pohang (2017, Mw 5.5) linked to EGS stimulation", "[Grigoli et al., Science 2018](https://doi.org/10.1126/science.aat2010); [Kim et al., Science 2018](https://doi.org/10.1126/science.aat6081)"],
  ],
  papers: [["Norbeck & Latimer 2023: commercial-scale EGS demonstration (preprint)", "https://doi.org/10.31223/X52X0B"], ["Grigoli et al., Science 2018: the Nov 2017 Mw 5.5 Pohang earthquake", "https://doi.org/10.1126/science.aat2010"], ["Kim et al., Science 2018: assessing whether the Pohang earthquake was induced", "https://doi.org/10.1126/science.aat6081"], ["MIT, The Future of Geothermal Energy (2006)", "https://energy.mit.edu/research/future-geothermal-energy/"], ["Utah FORGE field laboratory", "https://utahforge.com"]],
},
A5: {
  formal: ["Make perovskite and perovskite–silicon tandem modules that keep at least about 80–90% of their initial power after 25 years outdoors, a degradation rate comparable to silicon (about 0.5% per year), while keeping their efficiency advantage. Equally important is an accelerated test whose acceleration factor is validated against field data, so that a 25-year claim can be checked in months."],
  eq: ["P(t) ≈ P₀ (1 − r t),  target r ≲ 0.5–0.8 %/yr", "IEC 61215: damp heat 1000 h at 85 °C / 85% RH; 200 thermal cycles −40 ↔ +85 °C", "Shockley–Queisser single-junction limit ≈ 33.7%"],
  base: [
    ["Perovskite–silicon tandem cell record", "35.5% (LONGi, ESTI-certified, 2026); previous 34.85% (NREL-certified, Apr 2025), the first certified tandem above the single-junction limit", "[pv magazine 2026](https://www.pv-magazine-australia.com/2026/07/20/longi-sets-new-world-record-with-35-5-efficient-perovskite-silicon-tandem-cell/); [pv magazine 2025](https://www.pv-magazine.com/2025/04/18/longi-achieves-34-85-efficiency-for-two-terminal-tandem-perovskite-solar-cell/)"],
    ["Silicon field degradation (reference)", "Median ≈0.5%/yr across field studies", "[Jordan & Kurtz, Prog. Photovolt. 2013](https://doi.org/10.1002/pip.1182)"],
    ["Stability-test protocols", "ISOS consensus protocols (dark, light, outdoor, thermal cycling) for perovskites", "[Khenkin et al., Nature Energy 2020](https://doi.org/10.1038/s41560-019-0529-5)"],
  ],
  papers: [["Khenkin et al., Nature Energy 2020: ISOS consensus stability protocols", "https://doi.org/10.1038/s41560-019-0529-5"], ["Eames et al., Nat. Commun. 2015: ionic transport in hybrid lead iodide perovskites", "https://doi.org/10.1038/ncomms8497"], ["Al-Ashouri et al., Science 2020: monolithic perovskite/silicon tandem with >29% efficiency", "https://doi.org/10.1126/science.abd4016"], ["Jordan & Kurtz, Prog. Photovolt. 2013: photovoltaic degradation rates review", "https://doi.org/10.1002/pip.1182"], ["NREL best research-cell efficiency chart", "https://www.nrel.gov/pv/cell-efficiency.html"]],
},
B1: {
  formal: ["Build a lithium-metal anode, solid-electrolyte cell that cycles thousands of times at practical current density and area capacity, at stack pressures a car or rack can supply, without lithium filaments, voids or interphase growth. The governing threshold is the critical current density (CCD), above which lithium penetrates the electrolyte."],
  eq: ["σ(T) = (σ₀ / T) · exp(−E_a / k_B T)", "operate at  j < j_crit (CCD)  with area capacity ≳ 3–5 mAh/cm²", "targets: ≳1000 cycles to 80% capacity at modest stack pressure"],
  base: [
    ["Sulfide conductivity record class", "Li₉.₅₄Si₁.₇₄P₁.₄₄S₁₁.₇Cl₀.₃: 25 mS/cm; Li₁₀GeP₂S₁₂: 12 mS/cm (above liquid electrolytes at ≈10 mS/cm)", "[Kato et al., Nature Energy 2016](https://doi.org/10.1038/nenergy.2016.30); [Kamaya et al., Nat. Mater. 2011](https://doi.org/10.1038/nmat3066)"],
    ["Full-cell demonstration", "Ag–C anode, sulfide electrolyte: ≈900 Wh/L, >1000 cycles, ≈99.8% Coulombic efficiency", "[Lee et al., Nature Energy 2020](https://doi.org/10.1038/s41560-020-0575-z)"],
    ["Failure mechanism", "Void formation at the Li/garnet interface on stripping sets a critical current, often below 1 mA/cm² without pressure", "[Kasemchainan et al., Nat. Mater. 2019](https://doi.org/10.1038/s41563-019-0438-9); [Ning et al., Nature 2023](https://doi.org/10.1038/s41586-023-05970-4)"],
  ],
  papers: [["Janek & Zeier, Nature Energy 2016: a solid future for battery development", "https://doi.org/10.1038/nenergy.2016.141"], ["Kamaya et al., Nat. Mater. 2011: a lithium superionic conductor (LGPS)", "https://doi.org/10.1038/nmat3066"], ["Kato et al., Nature Energy 2016: high-power all-solid-state batteries", "https://doi.org/10.1038/nenergy.2016.30"], ["Lee et al., Nature Energy 2020: Ag–C composite anode solid-state cell", "https://doi.org/10.1038/s41560-020-0575-z"], ["Ning et al., Nature 2023: dendrite initiation and propagation in solid-state batteries", "https://doi.org/10.1038/s41586-023-05970-4"]],
},
B2: {
  formal: ["Find storage technologies whose energy-capacity cost is low enough to shift energy over 10–100+ hours economically, and prove their durability to lenders. Capacity-expansion studies find that long-duration storage meaningfully lowers system cost only when energy-capacity cost falls to roughly $20/kWh or below; efficiency matters less than that cost."],
  eq: ["system cost = C_P · P_rated + C_E · E_rated + operating cost", "Sepulveda et al. 2021: C_E ≲ $20/kWh needed for ≥10% electricity-cost reduction", "round-trip efficiency η_RT = E_out / E_in"],
  base: [
    ["Lithium-ion pack price (2025)", "$108/kWh average; stationary-storage packs $70/kWh; lowest observed LFP cell $36/kWh", "[BNEF 2025 survey](https://about.bnef.com/insights/clean-transport/lithium-ion-battery-pack-prices-fall-to-108-per-kilowatt-hour)"],
    ["First 100-hour iron-air system", "Great River Energy, Cambridge MN: 1.5 MW / 150 MWh; first modules installed Q4 2025, commercial operation targeted by end 2026", "[Great River Energy](https://greatriverenergy.com/what-we-do/cambridge-energy-storage-project); [Latitude Media](https://www.latitudemedia.com/news/forms-first-100-hour-batteries-are-hitting-the-grid/)"],
    ["US policy target", "DOE Long Duration Storage Shot: 90% cost reduction by 2030 for systems delivering 10+ hours", "[DOE](https://www.energy.gov/eere/long-duration-storage-shot)"],
  ],
  papers: [["Sepulveda et al., Nature Energy 2021: the design space for long-duration storage", "https://doi.org/10.1038/s41560-021-00796-8"], ["Albertus et al., Joule 2020: long-duration electricity storage applications and economics", "https://doi.org/10.1016/j.joule.2019.11.009"], ["Ziegler et al., Joule 2019: storage requirements and costs of shaping renewables", "https://doi.org/10.1016/j.joule.2019.06.012"]],
},
B3: {
  formal: ["Produce REBCO coated conductor in kilometre lengths with uniform critical current, at a cost per kiloamp-metre low enough for fusion magnets, cables and fault-current limiters, and protect magnets that store gigajoules against quenches. In REBCO the normal zone spreads slowly (order cm/s), so a local hot spot can burn out the conductor before it is detected."],
  eq: ["cost metric:  $ / (kA·m)  =  price per metre ÷ I_c (kA) at the operating field and temperature", "targets: ≈ $50/kA·m near term, $10–20/kA·m long term", "one compact fusion device needs ≈ 20,000 km of tape"],
  base: [
    ["Industry capacity", "≈15 manufacturers, >5,000 km/yr (12 mm equivalent)", "[Zhao et al. review, 2025](https://www.eurekalert.org/news-releases/1101339)"],
    ["Large-bore fusion magnet", "20 T REBCO toroidal-field model coil (CFS/MIT, Sept 2021)", "Hartwig et al., IEEE Trans. Appl. Supercond. 2024"],
    ["High-field record", "45.5 T with a REBCO test coil in a resistive background magnet (2019)", "[Hahn et al., Nature 2019](https://doi.org/10.1038/s41586-019-1293-1)"],
    ["Open gaps", "Cost is >10× what broad commercial use needs; neutron tolerance limits magnet lifetime", "[Selvamanickam, FNAL 2023](https://indico.fnal.gov/event/61772/attachments/172362/233757/selvamanickam%20venkat.pdf)"],
  ],
  papers: [["Hahn et al., Nature 2019: 45.5-tesla direct-current magnetic field", "https://doi.org/10.1038/s41586-019-1293-1"], ["Molodyk et al., Sci. Rep. 2021: high-Jc REBCO wire production for fusion", "https://doi.org/10.1038/s41598-021-81559-z"], ["Zhao et al. 2025: PLD-REBCO industry review", "https://www.eurekalert.org/news-releases/1101339"]],
},
B4: {
  formal: ["Find a superconductor with a critical temperature near room temperature at ambient pressure, or at least well above 77 K with useful critical current and field, and confirm it by zero resistance plus a Meissner effect (field-cooled diamagnetism), independently replicated. The theoretical goal is a predictive theory of unconventional (cuprate, nickelate) superconductivity."],
  eq: ["claim requires:  ρ(T < T_c) = 0  and  χ_FC < 0  (bulk Meissner),  replicated", "conventional bound: Allen–Dynes / Eliashberg (problem 1.4)"],
  base: [
    ["Ambient-pressure record", "HgBa₂Ca₂Cu₃O₈₊δ: ≈133–135 K (1993); ≈164 K under pressure", "[Schilling et al., Nature 1993](https://doi.org/10.1038/363056a0)"],
    ["Highest confirmed overall", "LaH₁₀: ≈250 K at ≈170 GPa (2019); H₃S: 203 K at ≈155 GPa (2015)", "[Drozdov et al., Nature 2019](https://doi.org/10.1038/s41586-019-1201-8); [Drozdov et al., Nature 2015](https://doi.org/10.1038/nature14964)"],
    ["Conventional at ambient", "MgB₂: 39 K (2001)", "[Nagamatsu et al., Nature 2001](https://doi.org/10.1038/35065039)"],
    ["Nickelates", "La₃Ni₂O₇: ≈80 K at ≈14 GPa (2023)", "[Sun et al., Nature 2023](https://doi.org/10.1038/s41586-023-06408-7)"],
    ["Theoretical ceiling (conventional)", "Room-temperature conventional superconductivity at ambient pressure judged extremely unlikely", "[Gao et al., Nat. Commun. 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12423309/)"],
  ],
  papers: [["Bednorz & Müller, Z. Phys. B 1986: possible high-Tc superconductivity in La–Ba–Cu–O", "https://doi.org/10.1007/BF01303701"], ["Drozdov et al., Nature 2019: superconductivity at 250 K in LaH₁₀", "https://doi.org/10.1038/s41586-019-1201-8"], ["Sun et al., Nature 2023: signatures of 80 K superconductivity in La₃Ni₂O₇", "https://doi.org/10.1038/s41586-023-06408-7"], ["Boeri et al., J. Phys.: Condens. Matter 2022: room-temperature superconductivity roadmap", "https://doi.org/10.1088/1361-648X/ac2864"], ["Gao et al., Nat. Commun. 2025: limits of ambient conventional Tc", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12423309/"]],
},
B5: {
  formal: ["Deliver power devices whose on-resistance approaches the material limit at 1.2–10 kV, with high wafer yield and lifetime proven in short tests, plus solid-state transformers that can stand in for scarce line-frequency transformers. The material limit follows from the critical field: ideal specific on-resistance scales as V_B² / (ε μ E_c³)."],
  eq: ["R_on,sp (ideal) = 4 V_B² / (ε · μ_n · E_c³)", "Baliga figure of merit  BFOM = ε · μ · E_c³", "E_c: Si 0.3 · 4H-SiC ≈2.5–3 · GaN ≈3.3 · β-Ga₂O₃ ≈8 · diamond ≈10 MV/cm"],
  base: [
    ["Large power transformer lead time", "128 weeks average; generator step-up 144 weeks (Q2 2025)", "[EEPower / Wood Mackenzie](https://eepower.com/tech-insights/transformer-supply-chain-woes-persist-as-energy-demand-grows/)"],
    ["US supply gap", "≈30% shortfall for power transformers in 2025; ≈80% of US power-transformer supply imported", "[Wood Mackenzie](https://www.woodmac.com/zh/press-releases/power-transformers-and-distribution-transformers-will-face-supply-deficits-of-30-and-10-in-2025/)"],
    ["Ideal drift resistance, Si vs 4H-SiC at 1.2 kV", "SiC lower by more than 100× (one-dimensional unipolar limit; see figure)", "Baliga 1982 (see papers)"],
  ],
  papers: [["Baliga, J. Appl. Phys. 1982: semiconductors for high-voltage vertical FETs", "https://doi.org/10.1063/1.331646"], ["She et al., IEEE Trans. Ind. Electron. 2017: review of SiC power devices", "https://doi.org/10.1109/TIE.2017.2652401"], ["Pearton et al., Appl. Phys. Rev. 2018: a review of Ga₂O₃ materials and devices", "https://doi.org/10.1063/1.5006941"]],
},
B6: {
  formal: ["Cut iridium and platinum loadings in water electrolysers by an order of magnitude without losing efficiency or 80,000-hour life, and find oxygen-evolution catalysts that are both active and stable in acid. At the atomic level the limit is the OER scaling relation: with ΔG(*OOH) ≈ ΔG(*OH) + 3.2 eV, the conventional mechanism cannot go below about 0.37 V of overpotential."],
  eq: ["η_OER = max(ΔG₁, ΔG₂, ΔG₃, ΔG₄)/e − 1.23 V", "scaling: ΔG(*OOH) − ΔG(*OH) ≈ 3.2 eV  ⇒  η_min ≈ 0.37 V", "DOE 2026 stack targets: 0.5 mg PGM/cm², 0.1 g/kW, 3.0 A/cm² at 1.8 V, 80,000 h"],
  base: [
    ["PEM stack PGM loading", "2022 status 3.0 mg/cm² (0.8 g/kW) → 2026 target 0.5 mg/cm² (0.1 g/kW) → ultimate 0.125 mg/cm²", "[DOE technical targets](https://www.energy.gov/eere/fuelcells/technical-targets-proton-exchange-membrane-electrolysis)"],
    ["Durability and degradation", "Lifetime 40,000 h → 80,000 h; degradation 4.8 → 2.3 mV per 1000 h", "[DOE technical targets](https://www.energy.gov/eere/fuelcells/technical-targets-proton-exchange-membrane-electrolysis)"],
    ["System cost and hydrogen price", "$1,000/kW (2022) → $250/kW (2026); $2/kg H₂ by 2026, $1/kg by 2031", "[DOE technical targets](https://www.energy.gov/eere/fuelcells/technical-targets-proton-exchange-membrane-electrolysis)"],
    ["Thermodynamic floor (conventional mechanism)", "η ≈ 0.37 V", "[Man et al., ChemCatChem 2011](https://doi.org/10.1002/cctc.201000397)"],
  ],
  papers: [["Man et al., ChemCatChem 2011: universality in OER on oxide surfaces", "https://doi.org/10.1002/cctc.201000397"], ["Seh et al., Science 2017: combining theory and experiment in electrocatalysis", "https://doi.org/10.1126/science.aad4998"], ["McCrory et al., JACS 2015: benchmarking HER and OER electrocatalysts", "https://doi.org/10.1021/ja510442p"], ["Grimaud et al., Nature Chem. 2017: lattice-oxygen activation in perovskite OER", "https://doi.org/10.1038/nchem.2695"]],
},
C1: {
  formal: ["Hold junction temperatures within limits for chips above 1 kW, with hotspot fluxes several times the die average, at rack powers of hundreds of kilowatts. Pumping power and water use must stay acceptable, and boiling systems need a safe margin to the critical heat flux. Cooling capacity is set by the total thermal resistance from junction to coolant."],
  eq: ["T_j = T_coolant + P · R_th,total,  keep T_j ≤ T_max", "q″_CHF (Zuber, pool) = 0.131 · h_fg · ρ_v^½ · [σ g (ρ_l − ρ_v)]^¼  ≈ 110 W/cm² for water at 1 atm", "pumping power  W_p = ΔP · V̇ / η_pump"],
  base: [
    ["Rack power today and planned", "≈120 kW per Blackwell NVL72 rack; Rubin Ultra NVL576 (Kyber) up to 600 kW planned for 2027; Vera Rubin NVL144 uses 45 °C liquid cooling", "[Tom's Hardware](https://www.tomshardware.com/pc-components/gpus/nvidia-shows-off-rubin-ultra-with-600-000-watt-kyber-racks-and-infrastructure-coming-in-2027); [StorageReview](https://www.storagereview.com/news/nvidia-offers-a-preview-of-whats-next-for-gigawatt-scale-ai-factories-at-the-ocp-global-summit)"],
    ["Classic microchannel result", "790 W/cm² removed with 71 °C rise in silicon microchannels (1981)", "[Tuckerman & Pease, IEEE EDL 1981](https://doi.org/10.1109/EDL.1981.25367)"],
    ["Dielectric pool-boiling CHF (reference)", "Order 15–20 W/cm² for fluorocarbons at 1 atm, far below water", "Mudawar 2011 (see papers)"],
  ],
  papers: [["Tuckerman & Pease, IEEE EDL 1981: high-performance heat sinking for VLSI", "https://doi.org/10.1109/EDL.1981.25367"], ["Mudawar, J. Electron. Packag. 2011: two-phase microchannel heat sinks, theory and limits", "https://doi.org/10.1115/1.4005300"], ["Kandlikar, J. Heat Transfer 2001: pool-boiling CHF model with contact angle", "https://doi.org/10.1115/1.1409265"]],
},
C2: {
  formal: ["Minimise the energy per useful operation of AI workloads, which is dominated by moving operands across the memory hierarchy and between chips rather than by arithmetic. Total energy is the arithmetic energy plus, for each level of the hierarchy, the bits moved times the energy per bit at that level. Problem 5.2 asks for lower bounds on the bits moved."],
  eq: ["E_total = Σ_ops E_op + Σ_levels (bits moved)_ℓ · e_ℓ", "45 nm: DRAM read 640 pJ / 32 bit  ≫  SRAM 5 pJ  >  FP32 multiply 3.7 pJ", "Landauer floor (per erased bit, 300 K): 2.87 × 10⁻²¹ J"],
  base: [
    ["Energy per operation (45 nm)", "32-bit DRAM read 640 pJ; 8 KB SRAM read 5 pJ; FP32 multiply 3.7 pJ; FP32 add 0.9 pJ; 32-bit int add 0.1 pJ", "[Horowitz, ISSCC 2014](https://doi.org/10.1109/ISSCC.2014.6757323)"],
    ["Memory bandwidth per stack", "HBM4: 2,048-bit interface, up to 8 Gb/s per pin, 2 TB/s per stack (JEDEC, Apr 2025)", "[HPCwire / JEDEC](https://www.hpcwire.com/?p=179974)"],
    ["Attention I/O optimum", "FlashAttention's I/O complexity is optimal for SRAM size M ≥ d²", "[Saha & Ye, ICML 2024](https://arxiv.org/abs/2402.07443)"],
  ],
  papers: [["Horowitz, ISSCC 2014: computing's energy problem", "https://doi.org/10.1109/ISSCC.2014.6757323"], ["Sze et al., Proc. IEEE 2017: efficient processing of deep neural networks", "https://doi.org/10.1109/JPROC.2017.2761740"], ["Dally, Turakhia & Han, CACM 2020: domain-specific hardware accelerators", "https://doi.org/10.1145/3361682"], ["Miller, J. Lightwave Technol. 2017: attojoule optoelectronics", "https://doi.org/10.1109/JLT.2017.2647779"], ["Dao et al. 2022: FlashAttention", "https://arxiv.org/abs/2205.14135"]],
},
C3: {
  formal: ["Raise the yield and capacity of stacked high-bandwidth memory and chiplet packages as stacks grow to 12–16 dies and packages pass the reticle limit. Yield compounds over every die and bond layer, so small per-layer defect rates dominate. Warpage and thermal stress from mismatched expansion must stay within assembly limits through reflow and thermal cycling."],
  eq: ["Y_stack ≈ Y_base · Y_die^N · Y_bond^(N−1)", "e.g. Y_die = Y_bond = 0.99, N = 12  ⇒  Y_stack ≈ 0.80", "warpage ∝ Δα · ΔT · L² / t  (bimetal-type scaling)"],
  base: [
    ["HBM4 standard (JESD270-4, Apr 2025)", "4- to 16-high stacks of 24 or 32 Gb dies, up to 64 GB per cube, 32 channels, 2 TB/s", "[HPCwire / JEDEC](https://www.hpcwire.com/?p=179974); [All About Circuits](https://www.allaboutcircuits.com/news/jedec-officially-releases-hbm4-memory-standard)"],
    ["Bonding technology", "Micro-bumps at tens of µm pitch; hybrid bonding at single-digit µm pitch; the HBM4 package-height spec eased pressure to adopt hybrid bonding", "[TrendForce, Apr 2025](https://www.trendforce.com/news/2025/04/21/news-jedec-finalizes-hbm4-standard-potentially-easing-pressure-on-hybrid-bonding-adoption/)"],
  ],
  papers: [["JEDEC JESD270-4 HBM4 announcement (2025)", "https://www.businesswire.com/news/home/20250416843598/en"], ["TrendForce: HBM4 standard and hybrid bonding", "https://www.trendforce.com/news/2025/04/21/news-jedec-finalizes-hbm4-standard-potentially-easing-pressure-on-hybrid-bonding-adoption/"]],
},
C4: {
  formal: ["Connect gigawatt-scale AI loads quickly while certifying that the grid stays within frequency and voltage limits for credible contingencies, including the large load itself tripping or swinging. As inverters replace synchronous machines, inertia H falls, so the same power imbalance gives a steeper rate of change of frequency and a deeper nadir. Voltage-sensitive data-centre loads that ride through faults badly create a new kind of credible contingency."],
  eq: ["(2H / f₀) · dΔf/dt = ΔP_m − ΔP_e − D · Δf   (swing equation, per unit)", "RoCoF₀ = ΔP · f₀ / (2 H S)", "certify:  |Δf| ≤ f_lim,  |V − V_nom| ≤ V_lim  for every credible contingency"],
  base: [
    ["US interconnection queue (end 2025)", "≈2,061 GW active (1,312 GW generation, 749 GW storage); median 61 months from request to operation for projects built in 2025; only 13% of 2000–2020 requests reached operation", "[LBNL Queued Up 2026](https://eta-publications.lbl.gov/sites/default/files/2026-06/queued_up_2026_edition.pdf); [emp.lbl.gov/queues](https://emp.lbl.gov/queues)"],
    ["Data-centre load-loss events", "≈1,500 MW (10 Jul 2024, 60 data centres after a 230 kV fault); ≈1,800 MW (Feb 2025); ≈3,800 MW (22 Jul 2026, largest in PJM history)", "[NERC incident review](https://nerc.com/pa/rrm/ea/Documents/Incident_Review_Large_Load_Loss.pdf); [Utility Dive](https://utilitydive.com/news/pjm-nerc-data-center-crypto-reliability-standards/827653)"],
    ["AI training power swings", "Synchronous training creates large periodic swings; limits proposed on oscillations in ranges such as 0.1–20 Hz", "[Choukse et al., 2025](https://arxiv.org/abs/2508.14318)"],
  ],
  papers: [["NERC Incident Review: large load loss (Jan 2025)", "https://nerc.com/pa/rrm/ea/Documents/Incident_Review_Large_Load_Loss.pdf"], ["Choukse et al. 2025: power stabilization for AI training datacenters", "https://arxiv.org/abs/2508.14318"], ["Milano et al., PSCC 2018: foundations and challenges of low-inertia systems", "https://doi.org/10.23919/PSCC.2018.8450880"], ["LBNL, Queued Up 2026 edition", "https://emp.lbl.gov/queues"]],
},

/* ---------------- computational ---------------- */
"1.1": {
  formal: ["Determine the ground-state phase diagram of the two-dimensional Hubbard model in the cuprate-relevant regime (U/t ≈ 6–8, hole doping δ ≈ 0–0.25, t′/t ≈ −0.3 to 0), in the thermodynamic limit. Superconductivity means long-range d-wave pair correlations; the competitor is stripe order (modulated charge and antiphase spin). Competing states differ by energies of order 10⁻³–10⁻² t per site, so the answer needs controlled error bars smaller than that."],
  eq: ["H = −t Σ_⟨ij⟩σ c†_iσ c_jσ − t′ Σ_⟨⟨ij⟩⟩σ c†_iσ c_jσ + U Σ_i n_i↑ n_i↓", "P_d(r) = ⟨Δ†_d(i) Δ_d(i + r)⟩,   Δ_d(i) = Σ_δ f(δ) c_i↑ c_(i+δ)↓,  f = ±1 (d-wave)", "superconductor ⇔ P_d(r) → const ≠ 0 as r → ∞"],
  base: [
    ["Pure model, near optimal hole doping", "No long-range superconductivity at moderate-to-strong coupling; filled stripes (DMRG + AFQMC, 2D extrapolation)", "[Qin et al., PRX 2020](https://pure.mpg.de/pubman/item/item_3246507_2/component/file_3247078/5977.pdf)"],
    ["With t′", "d-wave superconductivity in electron- and hole-doped regimes; coexists with partially filled stripes on the hole side", "[Xu et al., Science 2024](https://arxiv.org/abs/2303.08376)"],
    ["Stripe ground state at U = 8, δ = 1/8", "Vertical filled stripes, wavelength ≈8 sites; four methods agree", "[Zheng et al., Science 2017](https://doi.org/10.1126/science.aam7127)"],
    ["Largest lattices", "Neural quantum states on 32 × 32 (pure model, 2026)", "[PRX Intelligence 2026](https://journals.aps.org/prxintelligence/pdf/10.1103/2kq2-5g5q)"],
  ],
  papers: [["Zheng et al., Science 2017: stripe order in the underdoped 2D Hubbard model", "https://doi.org/10.1126/science.aam7127"], ["Arovas et al., Annu. Rev. CMP 2022: the Hubbard model", "https://doi.org/10.1146/annurev-conmatphys-031620-102024"]],
},
"1.2": {
  formal: ["Find an exchange-correlation functional E_xc[ρ] that reaches chemical accuracy (mean absolute error below 1 kcal/mol ≈ 0.043 eV) across main-group thermochemistry, kinetics and non-covalent interactions, and stays accurate for solids, transition metals and stretched bonds. It should satisfy exact constraints (piecewise linearity in fractional charge, constancy in fractional spin) at no more than hybrid cost."],
  eq: ["E[ρ] = T_s[ρ] + ∫ v_ext ρ d³r + J[ρ] + E_xc[ρ]", "exact: E(N + ω) = (1 − ω) E(N) + ω E(N + 1),  0 ≤ ω ≤ 1", "GMTKN55 WTMAD-2 = Σ_i (N_i/N) · (56.84 / |ΔE|̄_i) · MAD_i  (kcal/mol)"],
  base: [
    ["Learned functional at semi-local cost (Skala)", "Chemical accuracy on W4-17 atomization energies; GMTKN55 WTMAD-2 ≈3.46 kcal/mol in independent re-evaluation", "[Luise et al., 2025](https://arxiv.org/abs/2506.14665); [CP2K/GauXC 2026](https://arxiv.org/pdf/2608.19033)"],
    ["DM21 (2021)", "WTMAD-2 3.97 kcal/mol; fixes fractional-charge and fractional-spin errors", "[Kirkpatrick et al., Science 2021](https://doi.org/10.1126/science.abj6511)"],
    ["Best double hybrids (higher cost)", "WTMAD-2 ≈2.4 kcal/mol (e.g. DSD-BLYP-D3(BJ) 2.42)", "[arXiv 2605.06215](https://arxiv.org/pdf/2605.06215)"],
  ],
  papers: [["Kohn & Sham, Phys. Rev. 1965", "https://doi.org/10.1103/PhysRev.140.A1133"], ["Cohen, Mori-Sánchez & Yang, Science 2008: limitations of DFT", "https://doi.org/10.1126/science.1158722"], ["Goerigk et al., PCCP 2017: GMTKN55", "https://doi.org/10.1039/C7CP04913G"], ["Kirkpatrick et al., Science 2021: DM21", "https://doi.org/10.1126/science.abj6511"]],
},
"1.3": {
  formal: ["Quantum Monte Carlo writes the partition function as a sum over configurations with real weights w(c) that can be negative for fermions. Sampling |w| and reweighting by the sign s(c) gives errors that grow as the inverse average sign, which decays exponentially with inverse temperature β and system size N. The problem: find representations or transformations that make the sign problem polynomial for physically relevant fermion models (doped Hubbard, frustrated magnets, dense quark matter), or prove hardness for those classes."],
  eq: ["Z = Σ_c w(c),   ⟨O⟩ = Σ_c O(c) s(c) |w(c)| / Σ_c s(c) |w(c)|", "⟨s⟩ = Z / Z_|w| = e^(−β N Δf)", "relative error ∝ e^(β N Δf) / √M  (M samples)"],
  base: [
    ["Complexity", "Generic fermionic sign problem is NP-hard", "[Troyer & Wiese, PRL 2005](https://arxiv.org/abs/cond-mat/0408370)"],
    ["Known sign-free classes", "Half-filled Hubbard on bipartite lattices; Majorana-representable (time-reversal) models", "[Li, Jiang & Yao, PRB 2015](https://doi.org/10.1103/PhysRevB.91.241117); [Wei et al., PRL 2016](https://doi.org/10.1103/PhysRevLett.116.250601)"],
    ["Basis optimisation", "Local basis changes can ease, but not generally remove, the sign problem", "[Hangleiter et al., Sci. Adv. 2020](https://doi.org/10.1126/sciadv.abb8341)"],
  ],
  papers: [["Troyer & Wiese, PRL 2005: computational complexity of the sign problem", "https://arxiv.org/abs/cond-mat/0408370"], ["Li, Jiang & Yao, PRB 2015: Majorana QMC", "https://doi.org/10.1103/PhysRevB.91.241117"], ["Hangleiter et al., Sci. Adv. 2020: easing the sign problem", "https://doi.org/10.1126/sciadv.abb8341"]],
},
"1.4": {
  formal: ["For phonon-mediated superconductors, maximise T_c computed from Eliashberg theory, subject to dynamic stability (all phonon frequencies real) and thermodynamic stability (energy above the convex hull near zero) at ambient pressure. For unconventional superconductors, find any predictive route to T_c. Both ask how high T_c can go at ambient conditions, and whether a bound can be proved."],
  eq: ["λ = 2 ∫ α²F(ω)/ω dω,   ω_log = exp[(2/λ) ∫ ln ω · α²F(ω)/ω dω]", "T_c ≈ (ω_log / 1.2) · exp[−1.04 (1 + λ) / (λ − μ*(1 + 0.62 λ))]   (Allen–Dynes)", "constraints: ω_q,ν² > 0 ∀ q,ν;  E_hull ≲ ε"],
  base: [
    ["Conventional, ambient pressure", "MgB₂: 39 K (record since 2001)", "[Nagamatsu et al., Nature 2001](https://doi.org/10.1038/35065039)"],
    ["Conventional, high pressure", "LaH₁₀ ≈250 K at ≈170 GPa; H₃S 203 K at ≈155 GPa", "[Drozdov 2019](https://doi.org/10.1038/s41586-019-1201-8); [Drozdov 2015](https://doi.org/10.1038/nature14964)"],
    ["Large-scale ambient search (2025)", "Room-temperature conventional T_c at ambient judged extremely unlikely; Li₂AgH₆ and Li₂AuH₆ near the practical limit", "[Gao et al., 2025](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12423309/)"],
    ["Data", "3DSC: T_c with structures for 9,150 (ICSD) / 5,759 (MP) materials", "[Sommer et al., Sci. Data 2023](https://doi.org/10.1038/s41597-023-02721-y)"],
  ],
  papers: [["Allen & Dynes, PRB 1975: transition temperature of strong-coupled superconductors", "https://doi.org/10.1103/PhysRevB.12.905"], ["Boeri et al., J. Phys.: Condens. Matter 2022: room-temperature superconductivity roadmap", "https://doi.org/10.1088/1361-648X/ac2864"]],
},
"1.5": {
  formal: ["Learn a function from a candidate material, plus optionally precursors and conditions, to the probability that it can be made phase-pure, and generate recipes that succeed. Validate it prospectively, including failed syntheses. Thermodynamic stability (energy above hull) is a weak proxy, because kinetics, nucleation and precursor choice decide what forms."],
  eq: ["E_hull(x) = E(x) − E_hull(composition of x)   (stability proxy)", "goal: P(synthesisable | x, precursors, T, t, atmosphere)", "score on prospective attempts with negatives, not on known compounds"],
  base: [
    ["SynthNN (2023)", "7× higher precision than DFT formation energy; beat 20 expert chemists", "[npj Comput. Mater. 2023](https://doi.org/10.1038/s41524-023-01114-4)"],
    ["Generated candidates", "GNoME: 2.2 million new crystals predicted, ≈381,000 on the updated convex hull", "[Merchant et al., Nature 2023](https://doi.org/10.1038/s41586-023-06735-9)"],
    ["Autonomous synthesis", "A-Lab reported 41 of 58 targets in 17 days; outside analysis disputed many phase identifications", "[Szymanski et al., Nature 2023](https://doi.org/10.1038/s41586-023-06734-w); [Leeman et al., PRX Energy 2024](https://doi.org/10.1103/PRXEnergy.3.011002)"],
    ["Recipe data", "19,488 solid-state; 35,675 solution; 80,806 LLM-mined (18,869 with impurities)", "Kononova 2019; Sci. Data 2022; Lee 2025"],
  ],
  papers: [["Sun et al., Sci. Adv. 2016: thermodynamic scale of inorganic metastability", "https://doi.org/10.1126/sciadv.1600225"], ["Merchant et al., Nature 2023: GNoME", "https://doi.org/10.1038/s41586-023-06735-9"], ["Szymanski et al., Nature 2023: A-Lab", "https://doi.org/10.1038/s41586-023-06734-w"]],
},
"1.6": {
  formal: ["Find oxygen-evolution sites whose binding energies break the *OOH–*OH scaling relation, or reaction mechanisms that avoid it, while staying stable in acid at the operating potential. Activity is judged by the theoretical overpotential from computed free energies; stability by the Pourbaix decomposition energy at operating pH and potential."],
  eq: ["η = max(ΔG₁…ΔG₄)/e − 1.23 V", "ΔG(*OOH) = ΔG(*OH) + 3.2 ± 0.2 eV  (scaling)  vs  + 2.46 eV  (ideal)", "stability: ΔG_pbx(pH, U) small (commonly < ≈0.5 eV/atom)"],
  base: [
    ["Theoretical floor under scaling", "η ≈ 0.37 V", "[Man et al., ChemCatChem 2011](https://doi.org/10.1002/cctc.201000397)"],
    ["Open oxide-catalyst data", "OC22: 62,331 relaxations, ≈9.85 M single-point calculations", "[OC22](https://arxiv.org/abs/2206.08917)"],
    ["Screening with stability", "4,119 oxides screened for activity and Pourbaix stability; total-energy errors as low as 0.22 eV", "[Tran et al., Nanoscale 2024](https://arxiv.org/abs/2311.00784)"],
  ],
  papers: [["Rossmeisl et al., J. Electroanal. Chem. 2007: electrolysis of water on oxide surfaces", "https://doi.org/10.1016/j.jelechem.2006.11.008"], ["Man et al., ChemCatChem 2011", "https://doi.org/10.1002/cctc.201000397"], ["Grimaud et al., Nature Chem. 2017: lattice-oxygen mechanism", "https://doi.org/10.1038/nchem.2695"]],
},
"1.7": {
  formal: ["Find general, predictive design rules (and candidates) for solid electrolytes with room-temperature ionic conductivity at or above about 10 mS/cm, a wide electrochemical window and stable interfaces with lithium metal and high-voltage cathodes. Conductivity is thermally activated, so the barrier E_a dominates, but fast conductors move ions collectively, which single-hop pictures miss."],
  eq: ["σ T = A · exp(−E_a / k_B T)", "Nernst–Einstein: σ = n q² D / (k_B T) · (1 / H_R)", "rule of thumb: bcc anion lattice → face-sharing tet–tet hops, E_a ≈ 0.15 eV"],
  base: [
    ["Highest conductivities", "Li₉.₅₄Si₁.₇₄P₁.₄₄S₁₁.₇Cl₀.₃ 25 mS/cm; Li₁₀GeP₂S₁₂ 12 mS/cm", "[Kato 2016](https://doi.org/10.1038/nenergy.2016.30); [Kamaya 2011](https://doi.org/10.1038/nmat3066)"],
    ["Design rule", "bcc anion frameworks give ≈0.15 eV barriers vs ≈0.4 eV in fcc/hcp", "[Wang et al., Nat. Mater. 2015](https://doi.org/10.1038/nmat4369)"],
    ["Experimental benchmark", "OBELiX: ≈600 measured conductivities, ≈320 with full structures", "[Therrien et al.](https://arxiv.org/abs/2502.14234)"],
  ],
  papers: [["Wang et al., Nat. Mater. 2015: design principles for solid-state lithium superionic conductors", "https://doi.org/10.1038/nmat4369"], ["Richards et al., Chem. Mater. 2016: interface stability in solid-state batteries", "https://doi.org/10.1021/acs.chemmater.5b04082"], ["Riebesell et al., Nature Mach. Intell. 2025: Matbench Discovery", "https://perssongroup.lbl.gov/papers/Riebesell_et_al-2025-Nature_Machine_Intelligence.pdf"]],
},
"2.1": {
  formal: ["Compute rates and mechanisms of rare events (diffusion jumps, nucleation, phase transformations, interfacial reactions) whose free-energy barriers are many k_BT, without knowing the reaction coordinate in advance. The result should carry a controlled error, and be benchmarked against brute-force reference trajectories where those are affordable."],
  eq: ["k = ν · exp(−ΔF‡ / k_B T)   (transition-state theory)", "MD step ≈ 1 fs;  target processes 10⁻³ s – years  ⇒  10¹²–10²⁰ steps", "metadynamics bias:  V(s, t) = Σ_τ<t  W · exp(−|s − s(τ)|² / 2σ²)"],
  base: [
    ["Enhanced sampling", "Metadynamics (2002), OPES (2020): rates and free energies, given good collective variables", "[Laio & Parrinello, PNAS 2002](https://doi.org/10.1073/pnas.202427399); [Invernizzi & Parrinello, JPCL 2020](https://doi.org/10.1021/acs.jpclett.0c00497)"],
    ["Generative sampling", "Boltzmann generators sample equilibrium states in one shot", "[Noé et al., Science 2019](https://doi.org/10.1126/science.aaw1147)"],
    ["Cheap reference forces", "Universal ML potentials trained on OMat24 (110M+ DFT calculations) make long reference runs affordable", "[OMat24](https://arxiv.org/abs/2410.12771)"],
  ],
  papers: [["Laio & Parrinello, PNAS 2002: escaping free-energy minima", "https://doi.org/10.1073/pnas.202427399"], ["Voter, PRL 1997: hyperdynamics", "https://doi.org/10.1103/PhysRevLett.78.3908"], ["Noé et al., Science 2019: Boltzmann generators", "https://doi.org/10.1126/science.aaw1147"]],
},
"2.2": {
  formal: ["Predict how a material's microstructure and mechanical properties evolve over decades of neutron exposure, from primary damage (picoseconds) through defect clustering and helium bubbles to hardening, swelling and embrittlement (centimetres, years). Ion-beam and fission data, at much higher dose rates and different helium levels, should translate reliably to fusion conditions."],
  eq: ["N_d (NRT) = 0.8 T_d / (2 E_d)", "arc-dpa:  ξ(T_d) = [(1 − c) / (2E_d/0.8)^b] · T_d^b + c,   Fe: b = −0.568, c = 0.286, E_d = 40 eV", "dose rate: ions ≈10⁻⁴–10⁻³ dpa/s  vs  reactors ≈10⁻⁷–10⁻⁶ dpa/s"],
  base: [
    ["Surviving damage", "≈30% of NRT displacements survive in Fe at high energy", "[Nordlund et al., Nat. Commun. 2018](https://doi.org/10.1038/s41467-018-03415-5)"],
    ["Shared cascade data", "IAEA CascadesDB, curated MD collision cascades (since 2017)", "[cascadesdb.iaea.org](https://cascadesdb.iaea.org)"],
    ["Design doses to validate against", "DEMO first wall 20 → 50 dpa; DONES >20 dpa/fpy", "[KIT/IFMIF-DONES](https://publikationen.bibliothek.kit.edu/1000091743/23570305)"],
  ],
  papers: [["Norgett, Robinson & Torrens, Nucl. Eng. Des. 1975: NRT displacement model", "https://doi.org/10.1016/0029-5493(75)90035-7"], ["Nordlund et al., Nat. Commun. 2018: arc-dpa", "https://doi.org/10.1038/s41467-018-03415-5"], ["Zinkle & Was, Acta Mater. 2013: materials challenges in nuclear energy", "https://doi.org/10.1016/j.actamat.2012.11.004"]],
},
"2.3": {
  formal: ["Predict, from electrolyte and electrode chemistry plus cycling protocol, how the solid-electrolyte interphase forms and grows and when lithium plating or dendrites begin, and hence cycle life to 80% capacity, with calibrated uncertainty. Today's practical alternative is predicting life from early cycles within one chemistry."],
  eq: ["SEI growth (diffusion-limited):  L_SEI ∝ √t,   Q_loss(t) ≈ k √t", "plating onset when anode potential φ_anode < 0 V vs Li/Li⁺", "target:  N_80 = f(chemistry, protocol) ± calibrated error"],
  base: [
    ["Early-cycle life prediction", "9.1% test error predicting cycle life from the first 100 cycles (124 LFP/graphite cells, 150–2,300 cycles)", "[Severson et al., Nature Energy 2019](https://doi.org/10.1038/s41560-019-0356-8)"],
    ["Closed-loop protocol optimisation", "Fast-charging protocols optimised in 16 days instead of ≈500", "[Attia et al., Nature 2020](https://doi.org/10.1038/s41586-020-1994-5)"],
    ["Multi-chemistry data", "300 pouch cells across six cathode chemistries", "[Paulson et al.](https://www.osti.gov/pages/servlets/purl/1880134)"],
  ],
  papers: [["Peled, J. Electrochem. Soc. 1979: the SEI model", "https://doi.org/10.1149/1.2129238"], ["Pinson & Bazant, J. Electrochem. Soc. 2013: theory of SEI formation", "https://doi.org/10.1149/2.044302jes"], ["Monroe & Newman, J. Electrochem. Soc. 2005: interfacial deformation and dendrite suppression", "https://doi.org/10.1149/1.1850854"], ["Attia et al., Nature 2020: closed-loop optimisation of fast charging", "https://doi.org/10.1038/s41586-020-1994-5"]],
},
"2.4": {
  formal: ["Predict the critical heat flux, the flux at which nucleate boiling collapses into a vapour film, from first principles. The prediction should cover any fluid (including dielectric coolants), pressure, flow, geometry and surface (wettability, texture), with error bars, rather than relying on correlations fitted to water."],
  eq: ["q″_CHF = K · h_fg · ρ_v^½ · [σ g (ρ_l − ρ_v)]^¼,   K ≈ 0.131 (Zuber) – 0.149 (Lienhard)", "water, 1 atm:  q″_CHF ≈ 1.1 MW/m² (≈110 W/cm²)", "flow boiling:  q″_CHF = f(p, G, x_e, D, L, surface)"],
  base: [
    ["Largest public CHF data", "24,579 measurements in vertical, uniformly heated, water-cooled tubes (US NRC); OECD/NEA AI/ML benchmark", "[arXiv 2511.16207](https://arxiv.org/pdf/2511.16207); [NEA spec](https://one.oecd.org/document/NEA/WKP(2023)1/en/pdf)"],
    ["Industry reference", "2006 CHF look-up table (water)", "[Groeneveld et al., Nucl. Eng. Des. 2007](https://doi.org/10.1016/j.nucengdes.2007.02.014)"],
    ["Simulation data for ML", "BubbleML: 79 boiling simulations; 2.0 adds dielectrics and refrigerants", "[BubbleML](https://github.com/HPCForge/BubbleML)"],
  ],
  papers: [["Nukiyama 1934 (reprinted Int. J. Heat Mass Transfer 1966): the boiling curve", "https://doi.org/10.1016/0017-9310(66)90112-8"], ["Kandlikar, J. Heat Transfer 2001: CHF model with contact angle", "https://doi.org/10.1115/1.1409265"], ["Groeneveld et al., Nucl. Eng. Des. 2007: 2006 CHF look-up table", "https://doi.org/10.1016/j.nucengdes.2007.02.014"]],
},
"2.5": {
  formal: ["Find closures for the unresolved stresses, Reynolds stresses in RANS and subgrid stresses in LES, as functionals of the resolved flow that generalise to flows unlike the training data and respect physical constraints. Behind this sits the Navier–Stokes regularity question: whether smooth initial data in three dimensions always give a smooth solution for all time."],
  eq: ["∂ū/∂t + (ū·∇)ū = −∇p̄/ρ + ν∇²ū − ∇·τ,   ∇·ū = 0", "RANS: τ_ij = ⟨u′_i u′_j⟩;   LES: τ_ij = (u_i u_j)‾ − ū_i ū_j", "inertial range:  E(k) = C_K ε^(2/3) k^(−5/3),  C_K ≈ 1.5"],
  base: [
    ["Open data", "The Well: 15 TB, 16 simulation datasets; JHTDB serves DNS fields", "[The Well, NeurIPS 2024](https://arxiv.org/abs/2412.00568)"],
    ["Singularities (2025)", "First systematic discovery of unstable self-similar singularities (IPM, Boussinesq, 3D Euler with boundary), residuals 10⁻⁸–10⁻⁷", "[arXiv 2509.14185](https://arxiv.org/abs/2509.14185)"],
    ["Earlier blow-up evidence", "Numerical blow-up for 3D axisymmetric Euler with boundary (2014); computer-assisted proof (2022)", "[Luo & Hou, PNAS 2014](https://doi.org/10.1073/pnas.1405238111); [Chen & Hou](https://arxiv.org/abs/2210.07191)"],
  ],
  papers: [["Kolmogorov 1941: local structure of turbulence", "https://doi.org/10.1098/rspa.1991.0075"], ["Fefferman: Navier–Stokes existence and smoothness (Clay problem statement)", "https://www.claymath.org/millennium/navier-stokes-equation/"], ["Duraisamy, Iaccarino & Xiao, Annu. Rev. Fluid Mech. 2019: turbulence modeling in the age of data", "https://doi.org/10.1146/annurev-fluid-010518-040547"]],
},
"3.1": {
  formal: ["In Boozer coordinates, a magnetic field is quasisymmetric if its strength depends on the flux label and a single helical angle combination, B = B(ψ, Mθ − Nφ). That makes guiding-centre orbits integrable and confinement tokamak-like. The question is whether an exactly quasisymmetric magnetohydrostatic equilibrium exists throughout a volume, not just on one surface, for N ≠ 0, and how close real coil-produced fields can get."],
  eq: ["B = B(ψ, M θ − N φ)   (Boozer angles θ, φ)", "near-axis expansion:  r = ε r₁ + ε² r₂ + …  overdetermined beyond 2nd order (Garren–Boozer 1991)", "measure:  f_QS = Σ_(m,n) ∉ QS  |B_mn|² / B₀²"],
  base: [
    ["Precise quasisymmetry", "QA and QH configurations with symmetry-breaking cut by orders of magnitude and essentially no collisionless alpha losses", "[Landreman & Paul, PRL 2022](https://doi.org/10.1103/PhysRevLett.128.035001)"],
    ["Databases", "QUASR ≈370,000 configurations with coils; 500,000 near-axis configurations", "[QUASR](https://quasr.flatironinstitute.org); [Landreman 2022](https://arxiv.org/abs/2209.11849)"],
    ["Theory", "Existence beyond axisymmetry neither proved nor disproved; weak quasisymmetry constructed explicitly", "[Jorge et al., 2020](https://arxiv.org/abs/2003.06388); [Sato 2022](https://www.nature.com/articles/s41598-022-15594-9.pdf)"],
  ],
  papers: [["Garren & Boozer, Phys. Fluids B 1991: existence of quasihelically symmetric stellarators", "https://doi.org/10.1063/1.859916"], ["Landreman & Paul, PRL 2022: magnetic fields with precise quasisymmetry", "https://doi.org/10.1103/PhysRevLett.128.035001"], ["Rodríguez, Helander & Bhattacharjee, Phys. Plasmas 2020: conditions for quasisymmetry", "https://doi.org/10.1063/1.5144396"]],
},
"3.2": {
  formal: ["Predict the turbulent heat and particle fluxes as functions of local gradients and plasma parameters, accurately enough to compute reactor temperature and density profiles self-consistently with sources, and with uncertainty, at a cost that fits inside design loops. The difficulty is a sharp critical gradient followed by stiff growth, so small flux errors become large profile errors."],
  eq: ["Q_i = F(R/L_Ti, R/L_Te, R/L_n, q, ŝ, β, ν*, T_e/T_i, …)", "stiff transport:  Q ≈ χ₀ (R/L_T − κ_c)^α for R/L_T > κ_c", "ITER Q = 10 needs confinement H₉₈(y,2) ≈ 1"],
  base: [
    ["Cost of the reference", ">10,000 CPU-hours per nonlinear gyrokinetic evaluation at one radius", "[Ho et al.](https://www.differ.nl/sites/default/files/attachments/biblio/2021_4729.pdf)"],
    ["Neural surrogate", "QLKNN: 3–5 orders of magnitude faster, 1–15% discrepancy in profiles; trained on 300 M (10D) / ≈1 B (11D) QuaLiKiz runs", "[van de Plassche et al.](https://ar5iv.labs.arxiv.org/html/1911.05617); [Zenodo](https://zenodo.org/record/8011147)"],
    ["Known nonlinear effect", "Dimits shift: nonlinear threshold above the linear one due to zonal flows", "[Dimits et al., Phys. Plasmas 2000](https://doi.org/10.1063/1.873896)"],
  ],
  papers: [["Dimits et al., Phys. Plasmas 2000: comparisons and physics basis of tokamak transport models", "https://doi.org/10.1063/1.873896"], ["Jenko et al., Phys. Plasmas 2000: electron temperature gradient driven turbulence (GENE)", "https://doi.org/10.1063/1.874014"], ["Staebler et al., Phys. Plasmas 2007: TGLF", "https://doi.org/10.1063/1.2436852"], ["van de Plassche et al., Phys. Plasmas 2020: QLKNN", "https://doi.org/10.1063/1.5134126"]],
},
"3.3": {
  formal: ["Build an online predictor p(disruption within Δt | signals up to t) that reaches a target true-positive rate with at least the warning time the mitigation system needs (tens of milliseconds), while staying within a false-alarm budget. It must transfer to a new machine with few or no disruptive training shots, and come with guarantees rather than only average accuracy."],
  eq: ["alarm at t_a if  p(t) > θ;   warning time  Δt_w = t_disruption − t_a", "objective:  max TPR(θ) s.t. FPR(θ) ≤ α,  Δt_w ≥ Δt_min", "transfer: train on machines A, B; evaluate zero/few-shot on C"],
  base: [
    ["Cross-machine deep learning", "AUC 0.801 (C-Mod), 0.947 (DIII-D), 0.973 (EAST); disruptive data transfers, non-disruptive data is machine-specific", "[Zhu et al., 2020](https://arxiv.org/abs/2007.01401)"],
    ["Recurrent predictor (FRNN)", "Trained on DIII-D and JET, transfers across machines", "[Kates-Harbeck et al., Nature 2019](https://doi.org/10.1038/s41586-019-1116-4)"],
    ["Open benchmark", "TokaMark: 11,573 MAST shots, 39 signals, 14 tasks", "[arXiv 2602.10132](https://arxiv.org/abs/2602.10132)"],
  ],
  papers: [["de Vries et al., Nucl. Fusion 2011: survey of disruption causes at JET", "https://doi.org/10.1088/0029-5515/51/5/053018"], ["Kates-Harbeck et al., Nature 2019", "https://doi.org/10.1038/s41586-019-1116-4"], ["Seo et al., Nature 2024: avoiding tearing instability with deep RL", "https://doi.org/10.1038/s41586-024-07024-9"]],
},
"3.4": {
  formal: ["Compute the tritium breeding ratio of a blanket design with uncertainty propagated from nuclear data, geometry and materials, and design blankets whose breeding ratio exceeds the requirement with confidence. The required margin (a few per cent) is similar in size to today's nuclear-data uncertainty."],
  eq: ["TBR = ∫∫ Σ_T(r, E) φ(r, E) dE dV / S_n", "requirement:  TBR − k · σ_TBR ≥ TBR_req ≈ 1.05–1.15", "sensitivity:  S_x = (∂TBR / TBR) / (∂σ_x / σ_x)"],
  base: [
    ["Nuclear-data uncertainty (DEMO HCPB)", "±3.2% (JEFF-3.2 covariances), ±8.6% (TENDL-2014); dominated by O-16, Li-6, Li-7", "[Nunnenmann et al., EPJ 2017](https://www.epj-conferences.org/articles/epjconf/abs/2017/15/epjconf-nd2016_09025/epjconf-nd2016_09025.html)"],
    ["Covariance coverage", "ENDF/B-VIII.0 has covariances for 182 of 557 isotopes", "[LBNL presentation](https://conferences.lbl.gov/event/1403/contributions/8444/attachments/4950/4665/WANDA%20Tritium%20Talk.pdf)"],
  ],
  papers: [["Abdou et al., Nucl. Fusion 2021: tritium self-sufficiency", "https://doi.org/10.1088/1741-4326/abbf35"], ["Romano et al., Ann. Nucl. Energy 2015: OpenMC", "https://doi.org/10.1016/j.anucene.2014.07.048"]],
},
"3.5": {
  formal: ["Find coil sets that reproduce a target stellarator field (normal field error on the plasma boundary near zero) while being short, gently curved, well separated and tolerant to manufacturing and assembly errors. This is a non-convex, multi-objective optimisation whose objective should be an expectation over perturbed coils, not the nominal coil."],
  eq: ["f_B = ½ ∮ (B · n)² / |B|² dS", "min  f_B + λ₁ L + λ₂ ∫κ² + λ₃ Σ max(0, d_min − d_ij)²", "robust:  min  E_δ [ f_B(coils + δ) ]"],
  base: [
    ["Cost lesson", "NCSX was cancelled in 2008, largely on coil fabrication and assembly cost and schedule", "US DOE / PPPL record"],
    ["Coils for precise quasisymmetry", "Coil sets reproduce precise QA fields", "[Wechsung et al., PNAS 2022](https://doi.org/10.1073/pnas.2202084119)"],
    ["Benchmarks", "ConStellaration: ≈160,000 QI-like boundaries and 3 benchmarks; QUASR coil design ≈1–2 days per device on one core", "[ConStellaration](https://arxiv.org/abs/2506.19583); [Giuliani et al.](https://arxiv.org/pdf/2310.19097)"],
  ],
  papers: [["Merkel, Nucl. Fusion 1987: NESCOIL", "https://doi.org/10.1088/0029-5515/27/5/018"], ["Zhu et al., Nucl. Fusion 2018: FOCUS coil design", "https://doi.org/10.1088/1741-4326/aa8e0a"], ["Wechsung et al., PNAS 2022: precise quasisymmetry with coils", "https://doi.org/10.1073/pnas.2202084119"]],
},
"4.1": {
  formal: ["Solve alternating-current optimal power flow on realistic grids (10⁴–10⁵ buses) and certify global optimality: a lower bound within ε (say 1%) of the best feasible cost, within operational time (minutes). The problem is a non-convex quadratically constrained program and NP-hard in general."],
  eq: ["min Σ_g c_g(P_g)", "s.t.  P_i + jQ_i = V_i Σ_k Y*_ik V*_k,   V_min ≤ |V_i| ≤ V_max,   |S_ij| ≤ S_ij,max", "certificate:  (UB − LB) / UB ≤ ε"],
  base: [
    ["Largest certified instance", "1% global optimality on a 6,515-bus case (14,398 variables, 63,577 constraints)", "[Wang, Magron & Lasserre](https://arxiv.org/abs/2109.10005v3)"],
    ["Benchmark library", "PGLib-OPF, curated hard cases", "[Babaeinejadsarookolaee et al.](https://arxiv.org/abs/1908.02788)"],
    ["Learning data", "OPFData: ≈300,000 solved instances per grid, up to 13,659 buses", "[Lovett et al., 2024](https://arxiv.org/abs/2406.07234)"],
  ],
  papers: [["Lavaei & Low, IEEE TPS 2012: zero duality gap in OPF", "https://doi.org/10.1109/TPWRS.2011.2160974"], ["Coffrin, Hijazi & Van Hentenryck, IEEE TPS 2016: QC relaxation", "https://doi.org/10.1109/TPWRS.2015.2463111"], ["Bienstock & Verma, Oper. Res. Lett. 2019: strong NP-hardness of AC power flow feasibility", "https://doi.org/10.1016/j.orl.2019.08.009"]],
},
"4.2": {
  formal: ["Solve unit commitment and capacity expansion at full temporal (8,760 hours), spatial and uncertainty resolution to a proven optimality gap. Alternatively, aggregate (representative days, clustered nodes, few scenarios) with a provable bound on the error this introduces in cost and reliability."],
  eq: ["min  Σ_y Σ_g (I_g x_g) + E_ω [ Σ_t Σ_g c_g p_g,t,ω + start-ups ]", "s.t.  balance, ramping, min up/down, reserves, transmission;  u_g,t ∈ {0, 1}", "aggregation error:  |cost(full) − cost(reduced)| ≤ ε  (to be proved)"],
  base: [
    ["Market-scale benchmark", "GO Competition Challenge 3: multi-period day-ahead and real-time market instances", "[OSTI 2426334](https://www.osti.gov/biblio/2426334)"],
    ["Time-reduction studies", "Representative-period methods can misstate storage and peak needs", "[Pfenninger, Applied Energy 2017](https://doi.org/10.1016/j.apenergy.2017.03.051)"],
  ],
  papers: [["Knueven, Ostrowski & Watson, INFORMS J. Comput. 2020: MIP formulations for unit commitment", "https://doi.org/10.1287/ijoc.2019.0944"], ["Brown et al., J. Open Res. Softw. 2018: PyPSA", "https://doi.org/10.5334/jors.188"], ["Pfenninger, Applied Energy 2017: reducing time resolution in energy models", "https://doi.org/10.1016/j.apenergy.2017.03.051"]],
},
"4.3": {
  formal: ["For a multi-machine grid with inverter-based resources and large, fast-varying loads, find a Lyapunov function V that certifies a large region of attraction around the operating point, verified for every state in the region rather than for samples, at the scale of real networks."],
  eq: ["M_i δ̈_i + D_i δ̇_i = P_i − Σ_j B_ij sin(δ_i − δ_j)", "certify:  V(x) > 0,  V̇(x) < 0  ∀ x ∈ Ω \\ {x*},   Ω = {V ≤ c}", "objective:  max vol(Ω)  with formal verification"],
  base: [
    ["Learn-and-verify certificates", "LyZNet neural Lyapunov functions certify larger regions than a degree-6 SOS certificate on a test system", "[LyZNet, arXiv 2403.10013](https://arxiv.org/abs/2403.10013)"],
    ["Verifier in the loop", "CROWN-verified Lyapunov learning exposes violations that sampling missed (NeurIPS 2026)", "[NeurIPS 2026](https://neurips.cc/virtual/2026/174543)"],
    ["Synthetic grids with dynamics", "TAMU ACTIVSg2000, Texas2k Series24/25", "[TAMU](https://electricgrids.engr.tamu.edu)"],
  ],
  papers: [["Chiang, Direct Methods for Stability Analysis of Electric Power Systems (Wiley 2011)", ""], ["Chang, Roohi & Gao, NeurIPS 2019: neural Lyapunov control", "https://arxiv.org/abs/2005.00611"], ["Milano et al., PSCC 2018: low-inertia systems", "https://doi.org/10.23919/PSCC.2018.8450880"]],
},
"4.4": {
  formal: ["Find the worst set of k component failures (lines, generators, or now large-load trips) and prove that no set of size k causes worse load loss, given the operator's best response and realistic cascade dynamics, including protection and AC effects."],
  eq: ["max_{S ⊆ E, |S| ≤ k}  min_{response}  LoadShed(S)", "subject to power flow on the damaged network and protection-driven cascade rules", "N − 1 standard:  survive any single contingency (NERC TPL-001)"],
  base: [
    ["Historic scale", "2003 North American blackout: ≈50 million people, ≈61.8 GW lost", "US–Canada Power System Outage Task Force, 2004"],
    ["Blackout statistics", "Blackout sizes follow heavy-tailed (power-law-like) distributions", "[Dobson et al., Chaos 2007](https://doi.org/10.1063/1.2737822)"],
    ["New contingency class", "Data-centre load-loss events of ≈1,500–3,800 MW (2024–26)", "[NERC](https://nerc.com/pa/rrm/ea/Documents/Incident_Review_Large_Load_Loss.pdf)"],
  ],
  papers: [["Salmeron, Wood & Baldick, IEEE TPS 2004: grid security under attack", "https://doi.org/10.1109/TPWRS.2004.825888"], ["Bienstock & Verma, SIAM J. Optim. 2010: the N−k problem", "https://doi.org/10.1137/090759275"], ["Dobson et al., Chaos 2007: complex systems analysis of blackouts", "https://doi.org/10.1063/1.2737822"]],
},
"4.5": {
  formal: ["With start-up costs, minimum outputs and on/off decisions, least-cost dispatch has no supporting uniform price. Find pricing rules that minimise side payments (uplift) and give sound investment signals, compute them at market scale, and decide how to treat flexible loads such as data centres."],
  eq: ["uplift(π) = Σ_g [ max_{x ∈ X_g} profit_g(x; π) − profit_g(x*; π) ]", "convex hull price:  π_CH ∈ ∂ (conv C)(D)  =  argmax Lagrangian dual", "C(D) = min cost to serve demand D (non-convex)"],
  base: [
    ["Deployed approximation", "MISO extended LMP (ELMP)", "[Schiro et al.](https://core.ac.uk/download/357342318.pdf)"],
    ["Exact computation", "Convex hull prices for MISO instances within 20 minutes", "[arXiv 1910.12994](https://arxiv.org/abs/1910.12994)"],
    ["New convexification", "Semidefinite relaxations of market clearing (incl. AC unit commitment), often tight", "[arXiv 2602.15722](https://www.arxiv.org/pdf/2602.15722)"],
  ],
  papers: [["O'Neill et al., EJOR 2005: efficient prices in markets with nonconvexities", "https://doi.org/10.1016/j.ejor.2003.12.011"], ["Schiro et al., IEEE TPS 2016: convex hull pricing, formulation and implementation", "https://doi.org/10.1109/TPWRS.2015.2486380"], ["Hua & Baldick, IEEE TPS 2017: convex primal formulation for convex hull pricing", "https://doi.org/10.1109/TPWRS.2016.2637718"]],
},
"4.6": {
  formal: ["Design an online scheduler for an AI campus that guarantees grid commitments (power at or below a limit during curtailment events, bounded ramps and no oscillations in sensitive bands) while guaranteeing inference service levels and bounding training slowdown, under uncertainty about both grid signals and job arrivals."],
  eq: ["p(t) = Σ_j p_j(t) ≤ L_grid(t)  during events,   |dp/dt| ≤ r_max", "inference:  latency_p99 ≤ SLO;   training:  throughput loss ≤ β", "spectrum:  |P̂(f)| ≤ A(f)  for f in sensitive bands (e.g. 0.1–20 Hz)"],
  base: [
    ["Headroom unlocked by flexibility", "76–126 GW of new US load if curtailable 0.25–1% of the time", "[Norris et al., Duke 2025](https://nicholasinstitute.duke.edu/publications/rethinking-load-growth)"],
    ["Field demonstrations", "EPRI DCFlex (9 sites, early 2026); 25% cut for 3 h in Arizona; up to 40% cut in a UK trial", "Problem 4.6 sources"],
  ],
  papers: [["Norris et al. 2025: rethinking load growth", "https://nicholasinstitute.duke.edu/publications/rethinking-load-growth"], ["Choukse et al. 2025: power stabilization for AI training", "https://arxiv.org/abs/2508.14318"], ["Radovanović et al., IEEE TPS 2023: carbon-aware computing for datacenters", "https://doi.org/10.1109/TPWRS.2022.3173250"]],
},
"5.1": {
  formal: ["Find tight lower bounds on the energy that a useful computation must dissipate, covering logic, memory, communication and error correction, at a given speed and reliability. Landauer's bound applies only in the slow limit; finite time and finite error add terms that are only partly known."],
  eq: ["W_erase ≥ k_B T ln 2 ≈ 2.87 × 10⁻²¹ J  (300 K)", "finite time:  W ≥ k_B T ln 2 + B / τ + …", "finite error ε:  W ≥ k_B T [ln 2 + ε ln ε + (1 − ε) ln(1 − ε)]"],
  base: [
    ["Experimental verification", "Landauer bound approached in a colloidal particle double-well (2012) and with nanomagnets (2016)", "[Bérut et al., Nature 2012](https://doi.org/10.1038/nature10872); [Hong et al., Sci. Adv. 2016](https://doi.org/10.1126/sciadv.1501492)"],
    ["Finite-time Landauer", "Dissipation term inversely proportional to duration", "[Proesmans et al., PRL 2020](https://arxiv.org/abs/2006.03242)"],
    ["Practice", "Logic operations in real chips dissipate many orders of magnitude above k_B T ln 2", "Horowitz 2014 (problem C2)"],
  ],
  papers: [["Landauer, IBM J. Res. Dev. 1961: irreversibility and heat generation", "https://doi.org/10.1147/rd.53.0183"], ["Bennett, IBM J. Res. Dev. 1973: logical reversibility of computation", "https://doi.org/10.1147/rd.176.0525"], ["Wolpert, J. Phys. A 2019: stochastic thermodynamics of computation", "https://doi.org/10.1088/1751-8121/ab0850"]],
},
"5.2": {
  formal: ["In the red-blue pebble game, Q(G, M) is the minimum number of transfers between slow and fast memory (size M) needed to compute the computation graph G. The problem: tight bounds on Q, and on inter-chip communication, for training and inference of whole transformer models across P devices, allowing parallelism and recomputation."],
  eq: ["matrix multiply:  Q = Θ(n³ / √M)   (Hong & Kung 1981)", "attention (forward):  Q = Θ(N² d² / M)  for  M ≥ d²   (Saha & Ye 2024)", "parallel:  W_comm = Ω(n³ / (P √M))  per processor"],
  base: [
    ["Attention", "FlashAttention's I/O complexity proven optimal for M ≥ d²; matching backward-pass bounds", "[Saha & Ye, ICML 2024](https://arxiv.org/abs/2402.07443); [arXiv 2410.09397](https://arxiv.org/abs/2410.09397)"],
    ["Practical kernels", "FlashAttention-2 and -3 approach hardware peak on modern GPUs", "[Dao 2023](https://arxiv.org/abs/2307.08691); [Shah et al. 2024](https://arxiv.org/abs/2407.08608)"],
  ],
  papers: [["Hong & Kung, STOC 1981: I/O complexity, the red-blue pebble game", "https://doi.org/10.1145/800076.802486"], ["Ballard et al., SIAM J. Matrix Anal. Appl. 2011: minimising communication in linear algebra", "https://doi.org/10.1137/090769156"], ["Dao et al. 2022: FlashAttention", "https://arxiv.org/abs/2205.14135"]],
},
"5.3": {
  formal: ["Place blocks across stacked dies to minimise wirelength and vertical interconnect count while capping peak temperature and IR drop, with provable quality at full-chip scale. The problem is NP-hard, and the thermal coupling makes it non-separable: two hot blocks stacked vertically create a hot spot."],
  eq: ["min  W(x) + α · max_i T_i(x) + β · IR(x) + γ · N_vertical", "T = G⁻¹ P   (thermal resistance network),   z_b ∈ {top, bottom}", "legality: no overlap, utilisation per die ≤ u_max"],
  base: [
    ["Contest benchmark", "ICCAD 2022 Problem B: 3D placement with die-to-die connections", "[ICCAD contest](http://iccad-contest.org/Problems.html)"],
    ["Best published", "Analytical GPU placer beats the contest winner by up to 6.1% (4.1% average) wirelength with fewer vertical interconnects", "[Liao et al.](https://arxiv.org/abs/2310.07424)"],
    ["Open flow with thermal", "Open3DBench: open 3D-IC backend with PPA and thermal evaluation", "[arXiv 2503.12946](https://arxiv.org/abs/2503.12946)"],
  ],
  papers: [["Lin et al., DAC 2019: DREAMPlace, GPU-accelerated placement", "https://doi.org/10.1145/3316781.3317803"], ["Liao et al.: analytical 3D placement", "https://arxiv.org/abs/2310.07424"]],
},
"5.4": {
  formal: ["Decide whether quantum phase estimation gives an exponential speedup for ground-state energies of chemically relevant molecules, to chemical accuracy (1.6 mHa ≈ 1 kcal/mol), compared with the best classical heuristics. The quantum cost depends on Hamiltonian norm and on preparing an initial state with non-negligible overlap; the classical cost depends on how hard the electronic structure actually is."],
  eq: ["H = Σ_pq h_pq a†_p a_q + ½ Σ_pqrs h_pqrs a†_p a†_q a_r a_s", "QPE cost ∝ λ / ε (Toffoli gates) × 1 / |⟨ψ₀|Φ₀⟩|²", "advantage needs: overlap not exponentially small  and  classical heuristics failing"],
  base: [
    ["FeMoco resource estimates", "≈4 million physical qubits, <4 days (2021, tensor hypercontraction) → 4.5 million qubits, 8.6 hours for a 76-orbital model (2025)", "[Lee et al., PRX Quantum 2021](https://doi.org/10.1103/PRXQuantum.2.030305); [arXiv 2502.15882](https://arxiv.org/abs/2502.15882)"],
    ["First FeMoco estimate", "Reiher et al. 2017 established the benchmark problem", "[Reiher et al., PNAS 2017](https://doi.org/10.1073/pnas.1619152114)"],
    ["Evidence for exponential advantage", "None yet found across chemical space; polynomial speedups possible", "[Lee et al., Nat. Commun. 2023](https://www.nature.com/articles/s41467-023-37587-6)"],
  ],
  papers: [["Reiher et al., PNAS 2017: elucidating reaction mechanisms on quantum computers", "https://doi.org/10.1073/pnas.1619152114"], ["von Burg et al., Phys. Rev. Research 2021: quantum computing enhanced catalysis", "https://doi.org/10.1103/PhysRevResearch.3.033055"], ["Lee et al., Nat. Commun. 2023: evaluating evidence for exponential quantum advantage", "https://www.nature.com/articles/s41467-023-37587-6"]],
},
};
