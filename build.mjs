// Bouwt dist/: gebundelde code, statische bestanden en manifest.xml met het juiste domein.
// Gebruik: ADDIN_HOST=<adres van de static website in Azure Storage, zonder https://> node build.mjs
import { build } from "esbuild";
import { cpSync, readFileSync, writeFileSync, rmSync, mkdirSync } from "node:fs";

const host = process.env.ADDIN_HOST || "localhost:3000";
rmSync("dist", { recursive: true, force: true });
mkdirSync("dist");
cpSync("public", "dist", { recursive: true });
const common = { bundle: true, minify: true, format: "iife", target: "es2017" };
// Panelen (lezen en opstellen)
await build({ ...common, entryPoints: ["src/taskpane.js", "src/compose.js"], outdir: "dist" });
// Controle bij versturen: niet bundelen of verkleinen, gewoon kopiëren. Klassieke Outlook laadt dit direct
// en de functie moet globaal blijven (Outlook op het web zoekt hem op naam).
cpSync("src/commands.js", "dist/commands.js");
// Versie achter de eigen scripts en css, zodat Outlook na een upload de nieuwe versie laadt (Azure Storage stuurt geen no-cache mee).
const ver = readFileSync("src/config.js", "utf8").match(/version: "([^"]+)"/)[1];
for (const f of ["taskpane.html", "compose.html", "commands.html"]) {
  const p = `dist/${f}`;
  writeFileSync(p, readFileSync(p, "utf8").replace(/(src|href)="(taskpane|compose|commands)\.(js|css)"/g, `$1="$2.$3?v=${ver}"`));
}
writeFileSync("dist/manifest.xml", readFileSync("manifest.template.xml", "utf8").replaceAll("{{HOST}}", host));
console.log(`dist/ klaar voor https://${host}`);
