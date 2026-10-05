// Memoria Judaica - Google Sheet helper. Paste into: Extensions > Apps Script.
// 1) Edit the two lines below.  2) Store the GitHub token as script property GITHUB_TOKEN.
// 3) Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone) and copy its link into site.config.json.
//    After every change of this file: Deploy > Manage deployments > pencil > Version: New version > Deploy.
const GITHUB_OWNER = "YOUR-GITHUB-USERNAME";
const GITHUB_REPO = "memoria-judaica";
const WORKFLOW_FILE = "deploy.yml";
const CONTACT_TO = "memoriajudaica@gmail.com"; // the website contact form delivers here
const SKIP_TABS = ["How to use"];
const TYPES = ["heading", "text", "bullet", "caption", "author"];

function onOpen() {
  SpreadsheetApp.getUi().createMenu("Website")
    .addItem("1. Check my entries", "checkEntries")
    .addItem("2. Publish website now", "publishWebsite")
    .addSeparator()
    .addItem("Send a test contact e-mail", "testContactMail")
    .addItem("Set German date format (first time only)", "setupFormats")
    .addToUi();
}

// The website build reads the whole workbook through this link (public website content only).
function doGet() {
  const out = {};
  SpreadsheetApp.getActiveSpreadsheet().getSheets().forEach(function (sh) {
    if (SKIP_TABS.indexOf(sh.getName()) < 0) out[sh.getName()] = sh.getDataRange().getDisplayValues();
  });
  return ContentService.createTextOutput(JSON.stringify({ tabs: out })).setMimeType(ContentService.MimeType.JSON);
}

function setupFormats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.setSpreadsheetLocale("de_DE"); ss.setSpreadsheetTimeZone("Europe/Berlin");
  const sh = ss.getSheetByName("Termine");
  if (sh) sh.getRange("A2:B500").setNumberFormat("dd.mm.yyyy");
  SpreadsheetApp.getUi().alert("Done. Dates are shown like 25.10.2026.");
}

function rows_(name) {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(name);
  if (!sh) return null;
  const last = sh.getLastRow();
  return { sh: sh, vals: last < 2 ? [] : sh.getRange(2, 1, last - 1, sh.getLastColumn()).getDisplayValues() };
}
const empty_ = function (r) { return r.every(function (c) { return String(c).trim() === ""; }); };
const isDate_ = function (s) { return /^\d{1,2}\.\d{1,2}\.\d{4}$/.test(s) || /^\d{4}-\d{2}-\d{2}$/.test(s); };

function problems_() {
  const list = [];
  const add = function (tab, n, msg) { list.push(tab + ", row " + n + ": " + msg); };
  ["Texts", "Termine", "Projects", "Project texts", "Team", "Team texts", "Legal pages"].forEach(function (t) {
    if (!rows_(t)) list.push('The tab "' + t + '" is missing. Please do not rename or delete tabs.');
  });
  if (list.length) return list;
  const bad = {};
  const mark = function (tab, n) { (bad[tab] = bad[tab] || []).push(n); };
  rows_("Texts").vals.forEach(function (r, i) { if (String(r[0]).trim() !== "" && String(r[1]).trim() === "") { add("Texts", i + 2, "the German text is empty"); mark("Texts", i + 2); } });
  rows_("Termine").vals.forEach(function (r, i) {
    const n = i + 2; if (empty_(r)) return; const b = [];
    if (!isDate_(String(r[0]).trim())) b.push("Date from is missing or not a date");
    if (String(r[1]).trim() !== "" && !isDate_(String(r[1]).trim())) b.push("Date to is not a date");
    if (String(r[2]).trim() === "") b.push("Title is empty");
    if (String(r[4]).trim() !== "" && ["yes", "no"].indexOf(String(r[4]).trim().toLowerCase()) < 0) b.push("Show must be Yes or No");
    if (b.length) { add("Termine", n, b.join("; ")); mark("Termine", n); }
  });
  const ids = {};
  rows_("Projects").vals.forEach(function (r, i) {
    const n = i + 2; if (empty_(r)) return; const id = String(r[1]).trim(); const b = [];
    if (!/^[a-z0-9-]+$/.test(id)) b.push("ID must use small letters, digits and hyphens only");
    if (ids[id]) b.push("ID is used twice"); ids[id] = true;
    if (String(r[6]).trim() === "") b.push("German title is empty");
    if (b.length) { add("Projects", n, b.join("; ")); mark("Projects", n); }
  });
  const blocks = function (tab, c0, keyCol, keys, label) {
    rows_(tab).vals.forEach(function (r, i) {
      const n = i + 2; if (empty_(r)) return; const b = [];
      if (keys && !keys[String(r[keyCol]).trim()]) b.push(label + ' "' + r[keyCol] + '" does not exist');
      if (TYPES.indexOf(String(r[c0]).trim().toLowerCase()) < 0) b.push("Type must be Heading, Text, Bullet, Caption or Author");
      if (String(r[c0 + 1]).trim() === "") b.push("German text is empty");
      if (tab === "Team texts" && ["career", "print", "digital"].indexOf(String(r[1]).trim().toLowerCase()) < 0) b.push("Section must be Career, Print or Digital");
      if (b.length) { add(tab, n, b.join("; ")); mark(tab, n); }
    });
  };
  blocks("Project texts", 1, 0, ids, "Project ID");
  const names = {}; rows_("Team").vals.forEach(function (r) { names[String(r[1]).trim()] = true; });
  blocks("Team texts", 2, 0, names, "Person");
  rows_("Legal pages").vals.forEach(function (r, i) {
    const n = i + 2; if (empty_(r)) return; const b = [];
    if (["imprint", "privacy"].indexOf(String(r[0]).trim().toLowerCase()) < 0) b.push("Page must be imprint or privacy");
    if (TYPES.indexOf(String(r[1]).trim().toLowerCase()) < 0) b.push("Type must be Heading, Text, Bullet, Caption or Author");
    if (String(r[2]).trim() === "") b.push("German text is empty");
    if (b.length) { add("Legal pages", n, b.join("; ")); mark("Legal pages", n); }
  });
  // colour the problem rows red (and clear old marks)
  ["Texts", "Termine", "Projects", "Project texts", "Team", "Team texts", "Legal pages"].forEach(function (t) {
    const sh = rows_(t).sh, cols = sh.getLastColumn(), last = sh.getLastRow();
    if (last > 1) sh.getRange(2, 1, last - 1, cols).setBackground(null);
    (bad[t] || []).forEach(function (n) { sh.getRange(n, 1, 1, cols).setBackground("#f8d7da"); });
  });
  return list;
}

function checkEntries() {
  const p = problems_();
  SpreadsheetApp.getUi().alert(p.length ? "Please fix these rows (they are marked red):\n\n" + p.slice(0, 25).join("\n") + (p.length > 25 ? "\n... and " + (p.length - 25) + " more" : "") : "All entries look good. You can now publish the website.");
  return p.length === 0;
}

function publishWebsite() {
  const ui = SpreadsheetApp.getUi();
  const p = problems_();
  if (p.length) { ui.alert("Not published yet. Please fix these rows (marked red):\n\n" + p.slice(0, 25).join("\n")); return; }
  const token = PropertiesService.getScriptProperties().getProperty("GITHUB_TOKEN");
  if (!token) { ui.alert("The publishing key is missing. Please ask the website administrator."); return; }
  const url = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/actions/workflows/" + WORKFLOW_FILE + "/dispatches";
  const res = UrlFetchApp.fetch(url, { method: "post", contentType: "application/json", muteHttpExceptions: true,
    headers: { Authorization: "Bearer " + token, Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" },
    payload: JSON.stringify({ ref: "main" }) });
  const code = res.getResponseCode();
  if (code === 204) ui.alert("Publishing has started. Please wait about 3 minutes, then reload the website.\n\nIf a change is still missing after 10 minutes, choose Publish again.");
  else ui.alert("Publishing did not start (code " + code + "). The website is unchanged. Please tell the administrator.\n\n" + res.getContentText().substring(0, 200));
}

// ---- Website contact form: the page sends its form data here, the script e-mails it to CONTACT_TO ----
function ok_() { return ContentService.createTextOutput("ok"); }

function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.hp) return ok_();                                   // hidden field filled in = robot
    if (!d.t || Date.now() - Number(d.t) < 3000) return ok_(); // sent faster than a human can type
    const name = String(d.name || "").trim().slice(0, 200), email = String(d.email || "").trim().slice(0, 200);
    const subject = String(d.subject || "").trim().slice(0, 200), message = String(d.message || "").trim().slice(0, 5000);
    if (!name || !subject || !message || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return ok_();
    const cache = CacheService.getScriptCache(), key = "mail" + Math.floor(Date.now() / 3600000), n = Number(cache.get(key) || 0);
    if (n >= 20) return ok_();                                // at most 20 messages per hour
    cache.put(key, String(n + 1), 3600);
    MailApp.sendEmail({ to: CONTACT_TO, replyTo: email, name: name + " (website)", subject: "[Memoria Judaica website] " + subject,
      body: "From: " + name + " <" + email + ">\n\n" + message + "\n\n--\nSent through the contact form of the Memoria Judaica website." });
  } catch (err) { /* ignore: the visitor sees the normal thank-you message */ }
  return ok_();
}

function testContactMail() {
  MailApp.sendEmail({ to: CONTACT_TO, subject: "[Memoria Judaica website] Test", body: "This is a test. The website contact form will deliver messages to this inbox." });
  SpreadsheetApp.getUi().alert("A test e-mail was sent to " + CONTACT_TO + ". Please check that inbox (and the spam folder).");
}
