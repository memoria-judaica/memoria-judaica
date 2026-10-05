// Reads ALL tabs of the Google Sheet (through the sheet's web-app link) and writes data/content.json.
// If anything is wrong the build STOPS, so the live website stays exactly as it was.
import fs from "node:fs";
const cfg = JSON.parse(fs.readFileSync("site.config.json", "utf8"));
const fb = JSON.parse(fs.readFileSync("data/content.fallback.json", "utf8"));
const url = (process.env.CONTENT_URL || cfg.contentUrl || "").trim();
const hideDays = Number(process.env.HIDE_AFTER_DAYS ?? cfg.hideAfterDays ?? 14);
const OUT = "data/content.json";
const fail = (m) => { console.error("\nERROR: " + m + "\nThe website was NOT changed.\n"); process.exit(1); };
const warn = (m) => console.warn("Note: " + m);
const p2 = (n) => String(n).padStart(2, "0");
const cell = (r, i) => (r && r[i] != null ? String(r[i]) : "").replace(/\r/g, "").trim();
const yes = (s) => !/^(no|nein|n|false|0)$/i.test(s.trim());
const TYPES = { heading: "h", text: "p", bullet: "li", caption: "cap", author: "au" };
const SECTIONS = { career: "career", print: "print", digital: "digital" };

function toIso(s, tab, n, col) {
  s = (s || "").trim(); if (!s) return "";
  let y, m, d, a;
  if ((a = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s))) [y, m, d] = [a[1], a[2], a[3]];
  else if ((a = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(s))) [d, m, y] = [a[1], a[2], a[3]];
  else fail(`Tab "${tab}", row ${n}: "${s}" (${col}) is not a date. Please type it like 25.10.2026.`);
  const dt = new Date(Date.UTC(+y, +m - 1, +d));
  if (dt.getUTCMonth() !== +m - 1 || dt.getUTCDate() !== +d) fail(`Tab "${tab}", row ${n}: "${s}" is not a real calendar date.`);
  return `${y}-${p2(m)}-${p2(d)}`;
}
function label(f, t) {
  const [fy, fm, fd] = f.split("-"); if (!t || t === f) return `${fd}.${fm}.${fy}`;
  const [ty, tm, td] = t.split("-");
  if (fy === ty && fm === tm) return `${fd}.–${td}.${tm}.${fy}`;
  if (fy === ty) return `${fd}.${fm}.–${td}.${tm}.${fy}`;
  return `${fd}.${fm}.${fy}–${td}.${tm}.${ty}`;
}
const limit = new Date(); limit.setDate(limit.getDate() - hideDays);
const limitIso = `${limit.getFullYear()}-${p2(limit.getMonth() + 1)}-${p2(limit.getDate())}`;
const stillCurrent = (e) => (e.to || e.from) >= limitIso;
const clean = (list) => list.sort((a, b) => a.from.localeCompare(b.from) || a.lines[0].localeCompare(b.lines[0])).map(({ date, lines, en, he }) => ({ date, lines, en, he }));

let content;
if (!url) {
  content = JSON.parse(JSON.stringify(fb));
  content.termine = clean(content.termine.filter(stillCurrent));
  console.log("No sheet link configured: using the built-in content (data/content.fallback.json).");
} else {
  let tabs;
  try {
    const text = url.startsWith("file:") ? fs.readFileSync(new URL(url), "utf8") : await (await fetch(url)).text();
    if (/^\s*</.test(text)) fail("The sheet link returned a web page, not data. Check the web-app link in site.config.json (see the admin guide, Step 6).");
    tabs = JSON.parse(text).tabs;
  } catch (e) { fail("Could not read the sheet: " + e.message); }
  if (!tabs) fail("The sheet link did not return any tabs.");
  const rowsOf = (name) => {
    const k = Object.keys(tabs).find((x) => x.toLowerCase() === name.toLowerCase());
    if (!k) fail(`The tab "${name}" is missing in the sheet.`);
    return tabs[k].slice(1).map((r, i) => ({ r, n: i + 2 })).filter(({ r }) => r.some((x) => String(x || "").trim()));
  };
  const blockRow = (r, n, tab, c0) => {
    const type = TYPES[cell(r, c0).toLowerCase()];
    if (!type) fail(`Tab "${tab}", row ${n}: Type "${cell(r, c0)}" is not valid. Use Heading, Text, Bullet, Caption or Author.`);
    const de = cell(r, c0 + 1); if (!de) fail(`Tab "${tab}", row ${n}: the German text is empty.`);
    return [type, de, cell(r, c0 + 2), cell(r, c0 + 3)];
  };
  // Texts
  const texts = JSON.parse(JSON.stringify(fb.texts));
  for (const { r, n } of rowsOf("Texts")) {
    const k = cell(r, 0); if (!k) continue;
    if (!(k in fb.texts)) { warn(`Texts row ${n}: unknown key "${k}" ignored.`); continue; }
    const de = cell(r, 1); if (!de) fail(`Tab "Texts", row ${n} (${k}): the German text is empty. Please fill it in.`);
    texts[k] = [de, cell(r, 2), cell(r, 3)];
  }
  // Termine
  const termine = [];
  for (const { r, n } of rowsOf("Termine")) {
    if (!yes(cell(r, 4))) continue;
    const title = cell(r, 2); if (!title) fail(`Tab "Termine", row ${n}: the Title is empty.`);
    const from = toIso(cell(r, 0), "Termine", n, "Date from"); if (!from) fail(`Tab "Termine", row ${n}: "Date from" is empty.`);
    const to = toIso(cell(r, 1), "Termine", n, "Date to"); if (to && to < from) fail(`Tab "Termine", row ${n}: "Date to" is before "Date from".`);
    const lines = (t, d) => [t, ...d.split(/\n/).map((x) => x.trim()).filter(Boolean)];
    const en = cell(r, 5) ? lines(cell(r, 5), cell(r, 6)) : [], he = cell(r, 7) ? lines(cell(r, 7), cell(r, 8)) : [];
    termine.push({ from, to, date: label(from, to), lines: lines(title, cell(r, 3)), en, he });
  }
  // Projects
  const projects = [], ids = new Set();
  for (const { r, n } of rowsOf("Projects")) {
    if (!yes(cell(r, 0))) continue;
    const id = cell(r, 1);
    if (!/^[a-z0-9-]+$/.test(id)) fail(`Tab "Projects", row ${n}: the ID "${id}" may only contain small letters, digits and hyphens (no spaces).`);
    if (ids.has(id)) fail(`Tab "Projects", row ${n}: the ID "${id}" is used twice.`);
    ids.add(id);
    const title = [cell(r, 6), cell(r, 7), cell(r, 8)]; if (!title[0]) fail(`Tab "Projects", row ${n}: the German title is empty.`);
    const short = [cell(r, 3) || title[0], cell(r, 4), cell(r, 5)];
    projects.push({ id, home: /^(yes|ja|y|true|1)$/i.test(cell(r, 2)), short, title, photo: cell(r, 9), credit: [cell(r, 10), cell(r, 11), cell(r, 12)], location: [cell(r, 13), cell(r, 14), cell(r, 15)], gallery: /^(yes|ja|y|true|1)$/i.test(cell(r, 16)), blocks: [] });
  }
  for (const { r, n } of rowsOf("Project texts")) {
    const id = cell(r, 0); const p = projects.find((x) => x.id === id);
    if (!p) { warn(`Project texts row ${n}: project "${id}" not found or hidden, row ignored.`); continue; }
    p.blocks.push(blockRow(r, n, "Project texts", 1));
  }
  // Team
  const people = [];
  for (const { r, n } of rowsOf("Team")) {
    if (!yes(cell(r, 0))) continue;
    const name = cell(r, 1); if (!name) fail(`Tab "Team", row ${n}: the Name is empty.`);
    people.push({ name, photo: cell(r, 2), sections: { career: [], print: [], digital: [] } });
  }
  for (const { r, n } of rowsOf("Team texts")) {
    const who = cell(r, 0); const p = people.find((x) => x.name === who);
    if (!p) { warn(`Team texts row ${n}: person "${who}" not found or hidden, row ignored.`); continue; }
    const sec = SECTIONS[cell(r, 1).toLowerCase()]; if (!sec) fail(`Tab "Team texts", row ${n}: Section "${cell(r, 1)}" is not valid. Use Career, Print or Digital.`);
    p.sections[sec].push(blockRow(r, n, "Team texts", 2));
  }
  // Legal pages
  const legal = { imprint: [], privacy: [] };
  for (const { r, n } of rowsOf("Legal pages")) {
    const pg = cell(r, 0).toLowerCase(); if (!legal[pg]) fail(`Tab "Legal pages", row ${n}: Page must be imprint or privacy.`);
    legal[pg].push(blockRow(r, n, "Legal pages", 1));
  }
  content = { texts, termine: clean(termine.filter(stillCurrent)), projects, people, legal };
}
content.contactUrl = /^https:/.test(url) ? url : "";
fs.writeFileSync(OUT, JSON.stringify(content));
console.log(`Content ready: ${Object.keys(content.texts).length} texts, ${content.termine.length} events, ${content.projects.length} projects, ${content.people.length} people.`);
