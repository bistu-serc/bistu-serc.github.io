#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const BASE_URL = process.env.SERC_BASE_URL || "http://127.0.0.1:8000";
const ROUTES = ["#/", "#/newList", "#/achievement", "#/studentList", "#/culture", "#/tool", "#/about"];
const LANGS = ["zh", "en"];
const BREAKPOINTS = [
  { key: "m360", width: 360, height: 780 },
  { key: "m390", width: 390, height: 844 },
  { key: "t768", width: 768, height: 1024 },
  { key: "t1024", width: 1024, height: 768 },
  { key: "d1280", width: 1280, height: 900 }
];

function runPlaywright(args) {
  const result = spawnSync("playwright-cli", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`playwright-cli ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout || "";
}

function parseResultBlock(output) {
  const match = output.match(/### Result\n([\s\S]*?)\n### Ran Playwright code/);
  if (!match) {
    return null;
  }
  const jsonText = match[1].trim();
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;
  }
}

function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

const evalCode = `async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(900);
  const doc = document.documentElement;
  const body = document.body;
  const overflow = Math.max((doc.scrollWidth - doc.clientWidth), (body.scrollWidth - body.clientWidth));
  const routeTitle = document.querySelector('.route-page-title, #student_list .main-title, #Introduction .features-box > h2');
  const navToggle = document.querySelector('.serc-mobile-nav-toggle');
  const navCollapse = document.querySelector('#navbarCollapse');
  const cjkNodes = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    const text = (node.nodeValue || '').replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    if (!/[\\u3400-\\u9fff]/.test(text)) continue;
    const parent = node.parentElement;
    if (!parent) continue;
    if (parent.closest('#style-switcher,.el-image-viewer__wrapper')) continue;
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    cjkNodes.push(text.slice(0, 120));
    if (cjkNodes.length >= 20) break;
  }
  return {
    url: location.href,
    hash: location.hash,
    lang: document.documentElement.lang,
    title: document.title,
    overflow,
    routeTitle: routeTitle ? routeTitle.textContent.trim() : null,
    hasMobileToggle: !!navToggle,
    navOpen: !!(navCollapse && navCollapse.classList.contains('show')),
    cjkCount: cjkNodes.length,
    cjkSample: cjkNodes
  };
}`;

function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE_URL,
    cases: []
  };

  try {
    runPlaywright(["close"]);
  } catch {
    // ignore no-open-browser error
  }

  runPlaywright(["open", `${BASE_URL}/?lang=zh#/`]);

  for (const bp of BREAKPOINTS) {
    runPlaywright(["resize", String(bp.width), String(bp.height)]);

    for (const lang of LANGS) {
      for (const route of ROUTES) {
        runPlaywright(["goto", `${BASE_URL}/?lang=${lang}${route}`]);
        const output = runPlaywright(["eval", evalCode]);
        const result = parseResultBlock(output);
        report.cases.push({
          breakpoint: bp,
          lang,
          route,
          result
        });
      }
    }
  }

  runPlaywright(["close"]);

  const summary = {
    totalCases: report.cases.length,
    overflowFailures: report.cases.filter((c) => c.result && c.result.overflow > 0).length,
    englishCjkCases: report.cases.filter(
      (c) => c.lang === "en" && c.result && c.result.cjkCount > 0
    ).length
  };

  report.summary = summary;

  const outDir = path.join(process.cwd(), "reports");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `site-audit-${nowStamp()}.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

  console.log(`Audit report written: ${outPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main();
