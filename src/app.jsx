import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import CONTENT from "../data/content.json";
const img = f => (typeof window !== "undefined" && window.__IMG__ && window.__IMG__[f]) || "images/" + f;
const LOGO = img("logo.png");
const COOKBG = img("cookbook-background.jpg");
const PHOTO = img("photo.jpg");
const Ic = (d, extra) => ({ size = 20, className = "" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{d}{extra}</svg>;
const ArrowLeft = Ic(<path d="M19 12H5M12 19l-7-7 7-7" />);
const Search = Ic(<><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.3-4.3" /></>);
const ChevL = Ic(<path d="M15 18l-6-6 6-6" />);
const ChevR = Ic(<path d="M9 18l6-6-6-6" />);
const CloseX = Ic(<path d="M18 6L6 18M6 6l12 12" />);
const PauseI = Ic(<><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></>);
const PlayI = Ic(<path d="M7 4.5v15l12-7.5z" />);
const PhotoIcon = Ic(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="M21 16l-5-5-8 8" /></>);
const ArrowRight = Ic(<path d="M5 12h14M12 5l7 7-7 7" />);
const ExternalLink = Ic(<path d="M15 3h6v6M10 14L21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />);
const Mail = Ic(<><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M22 7l-10 6L2 7" /></>);
const MapPin = Ic(<><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" /><circle cx="12" cy="10" r="3" /></>);

const LANGS = [{ code: "de", label: "DE" }, { code: "en", label: "EN" }, { code: "he", label: "עברית" }];
const ROUTES = ["home", "projects", "team", "news", "contact"];

const LK = { de: 0, en: 1, he: 2 };
const HEBR = /[\u0590-\u05FF]/, LATN = /[A-Za-zÄÖÜäöüß]/;
// Hebrew text: keep Latin names in brackets or quotes together as one left-to-right block, so brackets do not jump around
const iso = s => { if (!s || !HEBR.test(s)) return s; let out = "", i = 0;
  while (i < s.length) { const c = s[i];
    if (c === "(" && s[i - 1] !== "]") { let d = 0, j = i; for (; j < s.length; j++) { if (s[j] === "(") d++; else if (s[j] === ")") { d--; if (!d) break; } }
      if (j < s.length) { const seg = s.slice(i, j + 1); if (!HEBR.test(seg) && LATN.test(seg)) { out += "\u2066" + seg + "\u2069"; i = j + 1; continue; } } }
    if (c === "“") { const j = s.indexOf("”", i + 1); if (j > 0) { const seg = s.slice(i, j + 1); if (!HEBR.test(seg) && LATN.test(seg)) { out += "\u2066" + seg + "\u2069"; i = j + 1; continue; } } }
    out += c; i++; }
  return out; };
const dirFor = s => (typeof s === "string" && !HEBR.test(s) && LATN.test(s)) ? "ltr" : undefined;
const TEXT = {}; for (const l of Object.keys(LK)) { const o = {}; for (const [k, v] of Object.entries(CONTENT.texts)) o[k] = l === "he" ? iso(v[LK[l]] || v[0] || "") : (v[LK[l]] || v[0] || ""); o.nav = [o.nav1, o.nav2, o.nav3, o.nav4, o.nav5]; TEXT[l] = o; }
const EMAIL = CONTENT.texts.emailAddress[0], WEBSITE = CONTENT.texts.websiteAddress[0];
const PROJECTS = CONTENT.projects, PEOPLE = CONTENT.people, NEWS = CONTENT.termine, LEGAL = CONTENT.legal;
const CONTACT_URL = CONTENT.contactUrl || "";
const FEATURED = PROJECTS.find(p => p.home) || PROJECTS[0];
const L = (arr, lang) => lang === "he" ? iso(arr[LK[lang]] || arr[0]) : (arr[LK[lang]] || arr[0]);
const pick = (b, lang) => lang === "he" ? iso(b[1 + LK[lang]] || b[1]) : (b[1 + LK[lang]] || b[1]);
const paras = x => x.split(/\n+/).filter(Boolean);
const tl = (n, lang) => (lang !== "de" && n[lang] && n[lang].length ? (lang === "he" ? n[lang].map(iso) : n[lang]) : n.lines);

const inline = (txt) => { const out = []; const re = /\[([^\]]+)\]\((https?:[^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g; let last = 0, m, i = 0;
  const plain = x => x.replace(/\*/g, "");
  while ((m = re.exec(txt))) { if (m.index > last) out.push(plain(txt.slice(last, m.index)));
    if (m[1]) out.push(<a key={i++} href={m[2]} target="_blank" rel="noreferrer" className="text-[#8b6b2e] underline [overflow-wrap:anywhere]">{m[1]}</a>);
    else if (m[3]) out.push(<b key={i++}>{m[3]}</b>); else out.push(<i key={i++}>{m[4]}</i>);
    last = re.lastIndex; }
  out.push(plain(txt.slice(last))); return out; };
const Lines = ({ x }) => x.split("\n").map((l, i) => <span key={i}>{i > 0 && <br />}{inline(l)}</span>);
function Blocks({ blocks, lang, wide, big, rows }) { const out = []; let list = []; let first = "";
  const side = lang === "he" && !wide && !big && !rows; // Hebrew profile pages: English text sits on the left, Hebrew on the right
  const ec = x => side ? " max-w-[75ch]" + (dirFor(x) === "ltr" ? " mr-auto" : "") : "";
  const flush = () => { if (list.length) { out.push(<ul key={"u" + out.length} dir={dirFor(first)} className={"mt-4 list-disc space-y-3 ps-6 leading-7" + ec(first)}>{list}</ul>); list = []; first = ""; } };
  blocks.forEach((raw, i) => { const b = [raw[0], pick(raw, lang).replace(/\{EMAIL\}/g, EMAIL)]; if (b[0] === "li") { if (!list.length) first = b[1]; list.push(<li key={i} dir={dirFor(b[1])}><Lines x={b[1]} /></li>); } else { flush();
    if (b[0] === "h") out.push(<h3 key={i} dir={dirFor(b[1])} className={"mt-8 break-after-avoid text-xl text-[#142843] sm:text-2xl" + ec(b[1])}>{b[1]}</h3>);
    else if (b[0] === "au") out.push(<p key={i} dir={dirFor(b[1])} className={"mt-8 break-inside-avoid border-s-4 border-[#b99a56] bg-[#f0e4c6]/60 py-3 ps-5 pe-4 font-semibold leading-7 text-[#8b6b2e]" + ((wide || big) ? " xl:text-lg" : "") + ec(b[1])}>{b[1]}</p>);
    else if (b[0] === "cap") out.push(<p key={i} dir={dirFor(b[1])} className={"mt-4 text-sm text-[#6b6257]" + ec(b[1])}>{b[1]}</p>);
    else out.push(<p key={i} dir={dirFor(b[1])} className={(rows ? "mt-2 text-[0.95rem] leading-7 text-[#332b23]" : "mt-3 leading-7 text-[#332b23]") + ((wide || big) ? " xl:text-lg xl:leading-9" : "") + ec(b[1])}><Lines x={b[1]} /></p>); } });
  flush(); return <div className={wide ? "lg:columns-2 lg:gap-16 xl:gap-24" : (side || big || rows) ? "" : "max-w-[75ch]"}>{out}</div>; }


const Shell = ({ children, className = "", dir }) => <div dir={dir} className={`mx-auto w-full max-w-[1920px] px-[clamp(1.25rem,5vw,7rem)] ${className}`}>{children}</div>;
const Tombstone = () => <span aria-hidden="true" className="relative block h-8 w-6 rounded-t-full border-2 border-[#efd994] after:absolute after:-bottom-1 after:left-[-5px] after:h-1 after:w-8 after:bg-[#efd994]" />;
const PageHeader = ({ title, intro, mid, dir }) => <section className="relative border-b-[3px] border-[#b99a56] bg-[#142843] py-12 sm:py-20 text-white"><Shell dir={dir}><h1 dir={dir} className="max-w-[32ch] text-4xl break-words sm:text-6xl lg:text-7xl">{title}</h1><div dir={dir} className={mid ? "mt-6 max-w-[90ch] space-y-2 text-xl text-white/85 sm:text-2xl" : "mt-6 max-w-[60ch] text-lg text-white/75"}>{intro}</div></Shell></section>;
const Back = ({ to, go, t }) => <button onClick={() => go(to)} className="mb-8 flex gap-2 text-[#8b6b2e]"><ArrowLeft size={18} />{t.back}</button>;

const strip = x => x.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/\*+/g, "").replace(/\{EMAIL\}/g, EMAIL);
const norm = x => x.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
function buildIndex(lang) {
  const t = TEXT[lang], pages = [];
  const add = (route, detail, title, texts) => pages.push({ route, detail, title, texts: [title, ...texts].map(strip).filter(Boolean) });
  add("home", null, t.nav[0], [t.hero, t.kicker, t.about1, t.about2, t.about3]);
  add("projects", null, t.nav[1], [t.projectsTitle, t.projectsIntro, t.cemeteries, t.further]);
  add("cemeteries", null, t.cemeteries, paras(t.cemIntro));
  PROJECTS.forEach(p => add("project", p.id, L(p.title, lang), [L(p.title, lang), L(p.short, lang), ...p.blocks.map(b => pick(b, lang))]));
  add("further", null, t.further, [...paras(t.furtherText), t.cbTileTitle, t.cbTileSub1, t.cbTileSub2]);
  add("cookbook", null, t.cbTitle, [t.cbTitle, t.cbIntro, t.cbIntro2, ...paras(t.cbText), t.cbSource]);
  PEOPLE.forEach(P => add("profile", P.name, P.name, [P.name, ...["career", "print", "digital"].flatMap(k => P.sections[k].map(b => pick(b, lang)))]));
  add("news", null, t.nav[3], [t.newsIntro, ...NEWS.flatMap(n => [n.date, ...tl(n, lang)])]);
  add("contact", null, t.nav[4], [t.contactTitle, t.contactIntro, EMAIL]);
  ["imprint", "privacy"].forEach(k => add(k, null, k === "imprint" ? t.imprint : t.privacy, LEGAL[k].map(b => pick(b, lang))));
  return pages;
}
function runSearch(pages, q) {
  const words = norm(q).split(/\s+/).filter(w => w.length > 1 || /\d/.test(w)); if (!words.length) return [];
  return pages.map(pg => {
    if (!words.every(w => norm(pg.texts.join(" \n ")).includes(w))) return null;
    const ti = norm(pg.title), hay = norm(pg.texts.join(" \n ")), score = words.reduce((n, w) => n + (ti.includes(w) ? 20 : 0) + Math.min(10, hay.split(w).length - 1), 0);
    const txt = pg.texts.find(x => norm(x).includes(words[0])) || pg.texts[0], i = Math.max(0, norm(txt).indexOf(words[0]));
    return { ...pg, score, snip: (i > 50 ? "… " : "") + txt.slice(Math.max(0, i - 50), i + 110) + (txt.length > i + 110 ? " …" : "") };
  }).filter(Boolean).sort((a, b) => b.score - a.score).slice(0, 8);
}
function SearchBox({ lang, go, onDone, big, className = "" }) {
  const t = TEXT[lang]; const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
  const pages = React.useMemo(() => buildIndex(lang), [lang]); const res = React.useMemo(() => runSearch(pages, q), [pages, q]);
  const choose = r => { setQ(""); setOpen(false); if (onDone) onDone(); go(r.route, r.detail); };
  return <div className={"relative " + className}><label className="relative block"><span className="sr-only">{t.searchPlaceholder}</span><Search size={16} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-[#8b6b2e]" />
    <input type="search" value={q} onChange={e => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)} onKeyDown={e => { if (e.key === "Escape") { setOpen(false); e.target.blur(); } if (e.key === "Enter" && res[0]) { e.preventDefault(); choose(res[0]); } }} placeholder={t.searchPlaceholder} className={"w-full rounded-full border border-[#b99a56]/70 bg-white/70 pe-3 ps-9 text-[#142843] outline-none focus:border-[#8b6b2e] " + (big ? "py-3 text-base" : lang === "he" ? "py-1.5 text-sm" : "py-1.5 text-xs")} /></label>
    {open && q.trim().length > 1 && <div className="absolute end-0 top-full z-50 mt-2 max-h-[70vh] w-[min(92vw,26rem)] overflow-auto border border-[#b99a56] bg-[#fffdf8] shadow-lg">{res.length ? res.map((r, i) => <button key={i} onMouseDown={e => e.preventDefault()} onClick={() => choose(r)} className="block w-full border-b border-[#eadfca] px-4 py-3 text-start hover:bg-white"><b className="block text-sm text-[#142843]">{r.title}</b><span className="mt-1 block text-xs leading-5 text-[#5f584e]">{r.snip}</span></button>) : <p className="px-4 py-3 text-sm text-[#5f584e]">{t.noResults}</p>}</div>}</div>;
}

function Header({ lang, setLang, route, go }) {
  const t = TEXT[lang]; const [open, setOpen] = useState(false);
  const nav = r => { setOpen(false); go(r); };
  const Lang = <div className="flex items-center gap-2">{LANGS.map(l => <button key={l.code} onClick={() => setLang(l.code)} className={`rounded-full px-3 py-1.5 ${l.code === "he" ? "text-[0.95rem] leading-none" : "text-xs"} ${lang === l.code ? "bg-[#142843] text-white" : "text-[#142843]"}`}>{l.label}</button>)}</div>;
  return <header className="sticky z-50 border-b border-[#b99a56]/70 bg-[#f6f1e7]/95 backdrop-blur" style={{ top: "env(safe-area-inset-top, 0px)" }}><Shell className="flex min-h-20 items-center justify-between gap-4 py-2">
    <button onClick={() => nav("home")} className="flex min-w-0 items-center gap-3 text-left text-[#142843]"><img src={LOGO} alt={t.brand} className="h-12 w-auto shrink-0 sm:h-14" /><span className="min-w-0"><b className="block text-sm tracking-wide sm:text-base">{t.brand}</b><small className={"hidden text-[#7b6b55] sm:block " + (lang === "he" ? "text-xs tracking-normal" : "text-[10px] uppercase tracking-[.18em]")}>{t.strap}</small></span></button>
    <nav className="hidden items-center gap-4 xl:flex 2xl:gap-6">{ROUTES.map((r, i) => <button key={r} onClick={() => nav(r)} className={`border-b-2 py-2 ${lang === "he" ? "text-[0.95rem] tracking-normal" : "text-xs uppercase tracking-[.12em]"} ${route === r ? "border-[#b99a56] font-bold text-[#8b6b2e]" : "border-transparent text-[#142843]"}`}>{t.nav[i]}</button>)}</nav>
    <SearchBox lang={lang} go={go} className="hidden w-36 shrink-0 xl:block 2xl:w-56" /><div className="hidden xl:block">{Lang}</div>
    <button aria-label={t.menuLabel} aria-expanded={open} onClick={() => setOpen(!open)} className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#b99a56] text-[#142843] xl:hidden"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">{open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}</svg></button>
  </Shell>
  {open && <div className="border-t border-[#b99a56]/50 bg-[#f6f1e7] xl:hidden"><Shell className="flex flex-col py-3"><div className="pb-3"><SearchBox lang={lang} go={go} big onDone={() => setOpen(false)} className="w-full" /></div>{ROUTES.map((r, i) => <button key={r} onClick={() => nav(r)} className={`border-b border-[#d7ccbb] py-3.5 text-start text-sm uppercase tracking-[.12em] ${route === r ? "font-bold text-[#8b6b2e]" : "text-[#142843]"}`}>{t.nav[i]}</button>)}<div className="pt-4">{Lang}</div></Shell></div>}
  </header>;
}

function Home({ lang, go }) { const t = TEXT[lang]; return <>
  <section className="bg-[#142843] py-16 sm:py-28 text-white"><Shell><p className="text-xs uppercase tracking-[.28em] text-[#d8bf7b]">{t.kicker}</p><h1 className="mt-7 text-5xl leading-[.95] sm:text-7xl md:text-8xl lg:text-[108px]">{t.heroTitle.split("\n").map((x, i) => <React.Fragment key={i}>{i > 0 && <br />}{x}</React.Fragment>)}</h1><p className="mt-9 max-w-[60ch] border-s border-[#efd994]/60 ps-6 text-lg leading-8 text-white/80">{t.hero}</p></Shell></section>
  <section className="relative bg-[#142843]"><img src={PHOTO} alt={t.photoAlt} className="h-56 w-full object-cover sm:h-72 lg:h-80" /><div className="absolute inset-0 bg-[#142843]/25" /></section>
  <section className="py-14 sm:py-24"><Shell><div className="lg:columns-2 lg:gap-16 xl:gap-24">{[t.about1, t.about2, t.about3].map(x => <p key={x} className="mb-6 break-inside-avoid text-lg leading-8 text-[#5f584e] xl:text-xl xl:leading-9">{x}</p>)}</div></Shell></section>
  <section className="bg-white/45 py-14 sm:py-24"><Shell><div className="flex flex-wrap items-end justify-between gap-3"><h2 dir={dirFor(t.newsHome)} className="text-3xl text-[#142843] sm:text-5xl">{t.newsHome}</h2><button dir={dirFor(t.allNews)} onClick={() => go("news")} className="font-semibold text-[#8b6b2e]">{t.allNews} →</button></div><div className="mt-10 grid gap-5 md:grid-cols-2">{[NEWS[0] && { k: "n", n: NEWS[0] }, FEATURED && { k: "p", p: FEATURED }].filter(Boolean).map((x, i) => x.k === "p" ? <button key={i} onClick={() => go("project", x.p.id)} className="border border-[#d7ccbb] bg-[#fffdf8] p-5 text-start sm:p-7"><time dir={dirFor(t.currentProject)} className="text-xs tracking-[.18em] text-[#8b6b2e]">{t.currentProject}</time><p dir={dirFor(t.currentProject)} className="mt-5 text-xl text-[#142843]">{L(x.p.title, lang === "he" ? "en" : lang)}</p></button> : <button key={i} onClick={() => go("news")} className="border border-[#d7ccbb] bg-[#fffdf8] p-5 text-start sm:p-7"><time className="text-xs tracking-[.18em] text-[#8b6b2e]">{x.n.date}</time><p dir={dirFor(tl(x.n, lang)[0])} className="mt-5 text-xl text-[#142843]">{inline(tl(x.n, lang)[0])}</p></button>)}</div></Shell></section>
</>; }

function Projects({ lang, go }) { const t = TEXT[lang]; return <><PageHeader title={t.projectsTitle} intro={t.projectsIntro} /><Shell className="grid gap-6 py-12 sm:py-20 md:grid-cols-2">{[[t.cemeteries, "cemeteries"], [t.further, "further"]].map(([x, id]) => <button key={id} onClick={() => go(id)} className="min-h-48 border border-[#b99a56] bg-[#fffdf8] p-6 text-start text-3xl sm:min-h-72 sm:p-10 sm:text-4xl text-[#142843] hover:bg-white">{x}<ArrowRight size={28} className="mt-8 rtl:rotate-180" /></button>)}</Shell></>; }

function Cemeteries({ lang, go }) { const t = TEXT[lang]; return <><PageHeader title={t.cemeteries} intro={t.projectsIntro} /><Shell className="py-10 sm:py-16"><Back to="projects" go={go} t={t} /><div className="lg:columns-2 lg:gap-16 xl:gap-24">{paras(t.cemIntro).map((p, i) => <p key={i} className="mb-5 leading-8 text-[#5f584e] xl:text-lg xl:leading-9">{p}</p>)}</div><div className="mt-14 grid auto-rows-fr gap-5 md:grid-cols-2 xl:grid-cols-3">{PROJECTS.map((p, i) => <button key={p.id} onClick={() => go("project", p.id)} className="flex flex-col items-start justify-start border bg-white/60 p-7 text-start"><span className="flex items-center gap-2"><MapPin className="shrink-0 text-[#b99a56]" />{L(p.location, lang) && <span className="text-sm uppercase tracking-[.14em] text-[#8b6b2e]">{L(p.location, lang)}</span>}</span><h2 className="mt-8 text-2xl text-[#142843]">{L(p.title, lang)}</h2></button>)}</div></Shell></>; }
const SLIDE_MS = 5500;
function Carousel({ photos, alt, credit, lang }) {
  const t = TEXT[lang]; const n = photos.length; const box = React.useRef(null); const start = React.useRef(null);
  const [i, setI] = useState(0); const [open, setOpen] = useState(false); const [paused, setPaused] = useState(false); const [hover, setHover] = useState(false); const [seen, setSeen] = useState(true);
  const reduce = typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const playing = n > 1 && !paused && !hover && !open && seen && !reduce;
  const step = d => setI(x => (x + d + n) % n);
  useEffect(() => { if (!playing) return; const id = setTimeout(() => step(1), SLIDE_MS); return () => clearTimeout(id); }, [playing, i, n]);
  useEffect(() => { if (!box.current || !window.IntersectionObserver) return; const o = new IntersectionObserver(([e]) => setSeen(e.isIntersecting), { threshold: 0.25 }); o.observe(box.current); return () => o.disconnect(); }, []);
  useEffect(() => { if (!open) return; const k = e => { if (e.key === "Escape") setOpen(false); if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, [open, n]);
  const down = e => { start.current = e.clientX; };
  const up = e => { if (start.current == null) return; const dx = e.clientX - start.current; start.current = null; if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1); else setOpen(true); };
  const btn = "absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-[#142843]/70 text-white backdrop-blur transition hover:bg-[#142843] focus-visible:opacity-100 md:opacity-0 md:group-hover:opacity-100";
  return <figure ref={box} className="group" dir="ltr" tabIndex={0} aria-roledescription="carousel" onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onFocus={() => setHover(true)} onBlur={() => setHover(false)} onKeyDown={e => { if (e.key === "ArrowLeft") step(-1); if (e.key === "ArrowRight") step(1); }}>
    <div className="relative select-none overflow-hidden rounded-xl bg-[#142843] shadow-[0_18px_40px_-18px_rgba(20,40,67,.55)] ring-1 ring-[#b99a56]/40">
      <div className="relative aspect-[5/4] w-full" style={{ touchAction: "pan-y" }} onPointerDown={down} onPointerUp={up} onPointerCancel={() => { start.current = null; }}>
        {photos.map((f, k) => <img key={f} src={img(f)} alt={`${alt} (${k + 1}/${n})`} draggable={false} loading={k ? "lazy" : "eager"} aria-hidden={k !== i} className={"absolute inset-0 h-full w-full cursor-zoom-in object-cover [transition:opacity_700ms_ease,transform_1600ms_ease-out] motion-reduce:transition-none " + (k === i ? "z-10 scale-100 opacity-100" : "pointer-events-none z-0 scale-[1.045] opacity-0")} />)}
      </div>
      {n > 1 && <>
        <button type="button" aria-label="‹" onClick={() => step(-1)} className={btn + " left-3 z-20"}><ChevL size={22} /></button>
        <button type="button" aria-label="›" onClick={() => step(1)} className={btn + " right-3 z-20"}><ChevR size={22} /></button>
        <button type="button" aria-label={paused ? t.carouselPlay : t.carouselPause} title={paused ? t.carouselPlay : t.carouselPause} onClick={() => setPaused(p => !p)} className="absolute left-3 top-3 z-20 grid h-9 w-9 place-items-center rounded-full bg-[#142843]/70 text-white backdrop-blur transition hover:bg-[#142843]">{paused ? <PlayI size={16} /> : <PauseI size={16} />}</button>
        <span className="absolute right-3 top-3 z-20 rounded-full bg-[#142843]/70 px-3 py-1 text-xs tracking-wider text-white backdrop-blur">{i + 1} / {n}</span>
        <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-2">{photos.map((f, k) => <button key={f} type="button" aria-label={String(k + 1)} onClick={() => setI(k)} className={"h-2 rounded-full transition-all " + (k === i ? "w-6 bg-[#e8cf8f]" : "w-2 bg-white/60 hover:bg-white")} />)}</div>
        {playing && <div className="absolute inset-x-0 bottom-0 z-20 h-1 bg-white/15"><div key={i} className="h-full bg-[#e8cf8f]/90" style={{ animation: `cgrow ${SLIDE_MS}ms linear forwards` }} /></div>}
      </>}
    </div>
    {credit && <figcaption className="mt-3 text-sm text-[#6b6257]" dir={HEBR.test(credit) ? "rtl" : "ltr"}>{credit}</figcaption>}
    {open && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#0b1626]/95 p-4" onClick={() => setOpen(false)} role="dialog" aria-modal="true">
      <img src={img(photos[i])} alt={alt} className="max-h-[88vh] max-w-[92vw] object-contain" onClick={e => e.stopPropagation()} />
      <button type="button" aria-label="×" onClick={() => setOpen(false)} className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><CloseX size={22} /></button>
      {n > 1 && <><button type="button" aria-label="‹" onClick={e => { e.stopPropagation(); step(-1); }} className="absolute left-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevL size={26} /></button>
      <button type="button" aria-label="›" onClick={e => { e.stopPropagation(); step(1); }} className="absolute right-4 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25"><ChevR size={26} /></button></>}
    </div>}
  </figure>;
}

function ProjectDetail({ lang, id, go }) { const t = TEXT[lang]; const p = PROJECTS.find(x => x.id === id); const has = p && p.blocks.length;
  const photos = (p && p.photo ? p.photo : "").split(/[,;\n]/).map(x => x.trim()).filter(Boolean); const credit = p ? L(p.credit, lang) : "";
  const side = photos.length > 1 ? <Carousel photos={photos} alt={L(p.title, lang)} credit={credit} lang={lang} />
    : photos.length === 1 ? <figure><img src={img(photos[0])} alt={L(p.title, lang)} className="w-full" />{credit && <figcaption dir={HEBR.test(credit) ? "rtl" : "ltr"} className="mt-2 text-sm text-[#6b6257]">{credit}</figcaption>}</figure>
    : p && p.gallery ? <figure><div className="grid aspect-[5/4] place-items-center rounded-xl bg-gradient-to-br from-[#142843] to-[#31567a] text-center text-white/80 ring-1 ring-[#b99a56]/40"><div><PhotoIcon size={40} className="mx-auto" /><p className="mt-3 text-lg">{t.galleryComing}</p></div></div>{credit && <figcaption dir={HEBR.test(credit) ? "rtl" : "ltr"} className="mt-3 text-sm text-[#6b6257]">{credit}</figcaption>}</figure> : null;
  const galleryMode = !!side && (photos.length > 1 || (p.gallery && !photos.length));
  const body = has ? <Blocks blocks={p.blocks} lang={lang} wide={!side} big={!!side} /> : <div className="grid min-h-[16rem] place-items-center py-10 text-center"><p dir="ltr" className="text-3xl italic tracking-wide text-[#8b6b2e] sm:text-4xl xl:text-5xl">{t.projectPlaceholder}</p></div>;
  return <><PageHeader title={p ? L(p.title, lang) : t.projectsTitle} intro={t.projectsIntro} /><Shell dir={dirFor(has ? pick(p.blocks[0], lang) : t.projectPlaceholder)} className="py-12 sm:py-20"><Back to="cemeteries" go={go} t={t} />{side ? (galleryMode ? <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:gap-14 xl:gap-20 2xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]"><div>{body}</div><div className="order-first lg:sticky lg:top-32 lg:order-none lg:self-start lg:[margin-inline-end:calc((min(100vw,1920px)-100vw)/2)]">{side}</div></div> : <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16 xl:gap-24"><div>{body}</div><div className="order-first lg:sticky lg:top-32 lg:order-none lg:self-start">{side}</div></div>) : body}</Shell></>; }

function Further({ lang, go }) { const t = TEXT[lang]; return <><PageHeader title={t.further} intro={t.projectsIntro} dir={dirFor(t.further)} /><Shell dir={dirFor(t.furtherText)} className="py-12 sm:py-20"><Back to="projects" go={go} t={t} />{paras(t.furtherText).map((x, i) => <p key={i} className={"max-w-[75ch] text-lg leading-8" + (i ? " mt-5" : "")}>{x}</p>)}<button onClick={() => go("cookbook")} className="mt-10 border border-[#b99a56] bg-white/60 p-8 text-start"><i className="text-2xl text-[#142843]">{t.cbTileTitle}</i><p className="mt-2">{t.cbTileSub1}</p><p>{t.cbTileSub2}</p></button></Shell></>; }
function Cookbook({ lang, go }) { const t = TEXT[lang]; return <><PageHeader title={t.cbTitle} intro={<><p>{t.cbIntro}</p><p>{t.cbIntro2}</p></>} mid dir={dirFor(t.cbIntro)} /><Shell dir={dirFor(t.cbText)} className="relative py-12 sm:py-20"><Back to="further" go={go} t={t} />{paras(t.cbText).map((x, i) => <p key={i} className="mt-4 max-w-[75ch] text-xl leading-9 text-[#1b1611] xl:text-[1.4rem] xl:leading-10"><Lines x={x} /></p>)}<p className="mt-10 w-fit max-w-full border-s-4 border-[#b99a56] bg-[#f0e4c6]/70 py-4 ps-5 pe-5 text-base leading-8 text-[#332b23] lg:whitespace-nowrap lg:text-[0.95rem] xl:text-lg xl:leading-9 2xl:text-xl"><Lines x={t.cbSource} /></p></Shell></>; }

function Team({ lang, go }) { const t = TEXT[lang]; return <><PageHeader title={t.teamTitle} intro={t.teamIntro} /><Shell className="grid gap-6 py-12 sm:py-20 md:grid-cols-3">{PEOPLE.map(({ name, photo }) => <button key={name} onClick={() => go("profile", name)} className="border bg-white/60 p-7 text-start">{photo ? <img src={img(photo)} alt={name} className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-[#142843] text-5xl text-[#efd994]">{name.split(" ").map(x => x[0]).slice(0, 2).join("")}</div>}<h2 dir={dirFor(name)} className="mt-5 text-2xl text-[#142843]">{name}</h2><p dir={dirFor(t.profile)} className="mt-2 font-semibold text-[#8b6b2e]">{t.profile}</p></button>)}</Shell></>; }
function Profile({ lang, person, go }) {
  const t = TEXT[lang]; const P = PEOPLE.find(x => x.name === person); const [tab, setTab] = useState("print"); if (!P) return null;
  return <><PageHeader title={person} intro={t.teamIntro} /><Shell className="py-12 sm:py-20"><Back to="team" go={go} t={t} />
    <h2 className="text-3xl text-[#142843]">{t.career}</h2><Blocks blocks={P.sections.career} lang={lang} />
    <h2 className="mt-14 text-3xl text-[#142843]">{t.pubBy} {person}</h2>{lang === "he" && t.listNote && <p className="mt-3 text-sm text-[#6b6257]">{t.listNote}</p>}
    <div className="mt-6 grid max-w-[75ch] grid-cols-2 gap-4">{[["print", t.print], ["digital", t.digital]].map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`border border-[#b99a56] py-3 text-xl ${tab === k ? "bg-[#142843] text-white" : "bg-white/60 text-[#142843]"}`}>{l}</button>)}</div>
    <Blocks blocks={P.sections[tab]} lang={lang} rows={tab === "digital"} /></Shell></>;
}

function News({ lang, go }) { const t = TEXT[lang];
  const list = [...PROJECTS.map(p => [L(p.short, lang), "project", p.id]), [t.cbShort, "cookbook", null]];
  return <><PageHeader title={t.newsTitle} intro={t.newsIntro} dir={dirFor(t.newsTitle)} /><Shell className="py-12 sm:py-20">
    <h2 dir={dirFor(t.projHeading)} className="text-3xl text-[#142843]">{t.projHeading}</h2>
    <ul className="mt-6 grid gap-3 sm:grid-cols-2">{list.map(([label, route, id]) => <li key={route + id}><button onClick={() => go(route, id)} dir={dirFor(label)} className="w-full border border-[#d7ccbb] bg-[#fffdf8] p-5 text-start text-[#142843] hover:bg-white">{label}</button></li>)}</ul>
    <h2 dir={dirFor(t.termHeading)} className="mt-14 text-3xl text-[#142843]">{t.termHeading}</h2>
    <div className="mt-6 divide-y border-y">{NEWS.map(n => <article key={n.date + n.lines[0]} className="grid gap-4 py-8 sm:grid-cols-[180px_1fr]"><time className="text-[#8b6b2e]">{n.date}</time><div>{tl(n, lang).map((l, i) => <p key={i} dir={dirFor(l)} className={(i ? "mt-2 " : "") + "text-lg leading-8 text-[#142843]"}>{inline(l)}</p>)}</div></article>)}</div>
  </Shell></>; }
const Req = () => <span aria-hidden="true" className="ms-1 text-[#b3261e]">*</span>;
function Contact({ lang, go }) {
  const t = TEXT[lang]; const [status, setStatus] = useState(""); const [t0] = useState(Date.now());
  return <><PageHeader title={t.contactTitle} intro={t.contactIntro} /><Shell className="py-12 sm:py-20"><div className="mb-8 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2 rounded border border-[#b99a56]/50 bg-white/60 p-5 sm:px-8"><a className="text-lg font-semibold text-[#142843] underline" href={"mailto:" + EMAIL}>{EMAIL}</a><p className="text-sm">{WEBSITE}</p></div><form onSubmit={async e => { e.preventDefault(); const form = e.target; const f = new FormData(form); const d = { name: f.get("name"), email: f.get("email"), subject: f.get("subject"), message: f.get("message"), hp: f.get("website"), t: t0 };
    // The form always sends through the Google Apps Script (no e-mail program). Only the e-mail link above opens the visitor's e-mail program.
    if (!CONTACT_URL) { setStatus("error"); return; }
    setStatus("sending"); try { await fetch(CONTACT_URL, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(d) }); setStatus("sent"); form.reset(); } catch (err) { setStatus("error"); } }} className="grid gap-5 rounded-2xl border bg-white/60 p-5 sm:p-8 md:grid-cols-2 md:gap-x-8"><p className="text-sm text-[#5f5244] md:col-span-2">{t.requiredNote}</p>{[[t.name, "text", "name", false], [t.email, "email", "email", true], [t.subject, "text", "subject", true]].map(([l, type, nm, req]) => <label key={nm} className={"grid gap-2 " + (nm === "subject" ? "md:col-span-2" : "")}><span>{l}{req && <Req />}</span><input required={req} name={nm} type={type} className="rounded border bg-[#fffdf8] p-3" /></label>)}<label className="grid gap-2 md:col-span-2"><span>{t.message}<Req /></span><textarea required name="message" rows={9} className="rounded border bg-[#fffdf8] p-3" /></label><label className="flex gap-3 text-sm md:col-span-2"><input required type="checkbox" /><span>{t.privacyConsent} <button type="button" onClick={() => go("privacy")} className="underline">{t.privacy}</button></span></label><input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: "absolute", width: 1, height: 1, opacity: 0, overflow: "hidden", pointerEvents: "none" }} /><button disabled={status === "sending"} className="inline-flex w-fit items-center gap-2 rounded-full bg-[#142843] px-6 py-3 text-white disabled:opacity-60 md:col-span-2"><Mail size={17} />{t.send}</button>{status === "sent" && <p role="status" className="rounded border border-emerald-300 bg-emerald-50 p-4 font-semibold text-emerald-800 md:col-span-2">✓ {t.contactThanks}</p>}{status === "error" && <p role="alert" className="rounded border border-red-300 bg-red-50 p-4 text-red-800 md:col-span-2">{t.contactError.replace("{EMAIL}", EMAIL)}</p>}</form></Shell></>;
}
function Legal({ lang, kind }) { const t = TEXT[lang]; const privacy = kind === "privacy";
  return <><PageHeader title={privacy ? t.privacy : t.imprint} intro={privacy ? t.privacyIntro : t.imprintIntro} /><Shell className="py-12 sm:py-20"><Blocks blocks={LEGAL[kind]} lang={lang} /></Shell></>; }

function MemoriaJudaica() {
  const [route, setRoute] = useState("home"); const [lang, setLang] = useState("de"); const [detail, setDetail] = useState(null); const t = TEXT[lang];
  useEffect(() => { document.title = TEXT[lang].siteTitle; document.documentElement.lang = lang; document.documentElement.dir = lang === "he" ? "rtl" : "ltr"; }, [lang]);
  const go = (r, d = null) => { setRoute(r); setDetail(d); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const p = { lang, go };
  const page = route === "home" ? <Home {...p} /> : route === "projects" ? <Projects {...p} /> : route === "cemeteries" ? <Cemeteries {...p} /> : route === "further" ? <Further {...p} /> : route === "cookbook" ? <Cookbook {...p} /> : route === "project" ? <ProjectDetail {...p} id={detail} /> : route === "team" ? <Team {...p} /> : route === "profile" ? <Profile {...p} person={detail} /> : route === "news" ? <News {...p} /> : route === "privacy" ? <Legal lang={lang} kind="privacy" /> : route === "imprint" ? <Legal lang={lang} kind="imprint" /> : <Contact {...p} />;
  return <div dir={lang === "he" ? "rtl" : "ltr"} className="flex min-h-screen flex-col bg-[#f6f1e7] font-serif text-[#332b23]"><Header lang={lang} setLang={setLang} route={route} go={go} /><main className="relative flex flex-grow flex-col">{route === "cookbook" && <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.17] mix-blend-multiply" style={{ backgroundImage: `url("${COOKBG}")` }} />}{page}</main><footer className="mt-auto border-t border-[#b99a56] bg-[#142843] py-12 text-white"><Shell className="flex flex-col justify-between gap-8 md:flex-row md:items-center"><div className="flex items-center gap-3"><img src={LOGO} alt={t.brand} className="h-14 w-auto" /><div><h3 className="tracking-wide">{t.brand}</h3><p className="mt-2 text-[10px] uppercase tracking-[.18em] text-[#d8bf7b]">{t.strap}</p></div></div><div className="flex flex-wrap gap-5"><button onClick={() => go("imprint")} className="text-[#efd994]">{t.imprint}</button><button onClick={() => go("privacy")} className="text-[#efd994]">{t.privacy}</button><a href={"mailto:" + EMAIL} className="text-[#efd994]">{EMAIL}</a></div></Shell>{route === "contact" && <Shell><p dir="ltr" className="mt-8 border-t border-white/10 pt-5 text-xs tracking-wide text-white/55">{t.credit}</p></Shell>}</footer></div>;
}
createRoot(document.getElementById("root")).render(<MemoriaJudaica />);
