#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const BASE_URL = process.env.SERC_BASE_URL || "http://127.0.0.1:8000";
const ROUTES = ["#/", "#/newList", "#/achievement", "#/studentList", "#/culture", "#/tool", "#/about"];

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
  return JSON.parse(match[1].trim());
}

const evalCode = `async () => {
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  await wait(1000);
  const whitelist = ['中文'];
  const cjk = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const text = (walker.currentNode.nodeValue || '').replace(/\\s+/g, ' ').trim();
    if (!text) continue;
    if (!/[\\u3400-\\u9fff]/.test(text)) continue;
    if (whitelist.includes(text)) continue;
    const parent = walker.currentNode.parentElement;
    if (!parent) continue;
    const style = getComputedStyle(parent);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
    cjk.push(text.slice(0, 120));
    if (cjk.length >= 30) break;
  }
  return {
    route: location.hash,
    cjkCount: cjk.length,
    cjkSample: cjk
  };
}`;

function main() {
  try {
    runPlaywright(["close"]);
  } catch {
    // ignore
  }

  runPlaywright(["open", `${BASE_URL}/?lang=en#/`]);
  runPlaywright(["resize", "390", "844"]);

  const report = [];

  for (const route of ROUTES) {
    runPlaywright(["goto", `${BASE_URL}/?lang=en${route}`]);
    const out = runPlaywright(["eval", evalCode]);
    const result = parseResultBlock(out);
    report.push(result);
  }

  runPlaywright(["close"]);

  const failing = report.filter((x) => x && x.cjkCount > 0);
  console.log(JSON.stringify({ total: report.length, failing: failing.length, report }, null, 2));

  if (failing.length > 0) {
    process.exit(1);
  }
}

main();
