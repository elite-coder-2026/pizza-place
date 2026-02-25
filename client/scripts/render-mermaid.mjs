import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

function usage(exitCode = 0) {
  // eslint-disable-next-line no-console
  console.log(`
Render Mermaid diagrams (.mmd) to SVG/PNG/PDF using mermaid-cli.

Usage:
  npm run diagram -- [options]

Options:
  --in <path>       Input file or directory (default: docs/diagrams)
  --out <dir>       Output directory (default: docs/diagrams/dist)
  --format <fmt>    svg | png | pdf (default: svg)
  --theme <name>    default | dark | forest | neutral (optional)
  -h, --help        Show help
`.trim());
  process.exit(exitCode);
}

function parseArgs(argv) {
  const args = {
    inPath: "docs/diagrams",
    outDir: "docs/diagrams/dist",
    format: "svg",
    theme: null,
  };

  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];

    if (token === "-h" || token === "--help") usage(0);
    if (token === "--in") args.inPath = argv[++i];
    else if (token === "--out") args.outDir = argv[++i];
    else if (token === "--format") args.format = argv[++i];
    else if (token === "--theme") args.theme = argv[++i];
    else usage(1);
  }

  if (!["svg", "png", "pdf"].includes(args.format)) {
    // eslint-disable-next-line no-console
    console.error(`Unsupported --format "${args.format}". Use svg|png|pdf.`);
    process.exit(1);
  }

  return args;
}

async function pathType(absolutePath) {
  try {
    const stat = await fs.stat(absolutePath);
    if (stat.isFile()) return "file";
    if (stat.isDirectory()) return "dir";
    return "other";
  } catch {
    return "missing";
  }
}

async function* walkMmdFiles(dirAbsolute) {
  const entries = await fs.readdir(dirAbsolute, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dirAbsolute, entry.name);
    if (entry.isDirectory()) {
      yield* walkMmdFiles(full);
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".mmd")) {
      yield full;
    }
  }
}

function mmdcPath() {
  const binName = process.platform === "win32" ? "mmdc.cmd" : "mmdc";
  return path.join(projectRoot, "node_modules", ".bin", binName);
}

async function runMmdc({ inputFile, outputFile, theme }) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });

  const args = ["-i", inputFile, "-o", outputFile];
  if (theme) args.push("-t", theme);

  await new Promise((resolve, reject) => {
    const child = spawn(mmdcPath(), args, {
      stdio: "inherit",
      cwd: projectRoot,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`mmdc exited with code ${code}`));
    });
  });
}

async function main() {
  const { inPath, outDir, format, theme } = parseArgs(process.argv.slice(2));

  const inputAbs = path.resolve(projectRoot, inPath);
  const outAbs = path.resolve(projectRoot, outDir);

  const type = await pathType(inputAbs);
  if (type === "missing") {
    // eslint-disable-next-line no-console
    console.error(`Input path not found: ${inputAbs}`);
    process.exit(1);
  }
  if (type === "other") {
    // eslint-disable-next-line no-console
    console.error(`Input path is not a file or directory: ${inputAbs}`);
    process.exit(1);
  }

  if (type === "file") {
    if (!inputAbs.toLowerCase().endsWith(".mmd")) {
      // eslint-disable-next-line no-console
      console.error("Input file must end with .mmd");
      process.exit(1);
    }

    const base = path.basename(inputAbs, ".mmd");
    const outputFile = path.join(outAbs, `${base}.${format}`);
    await runMmdc({ inputFile: inputAbs, outputFile, theme });
    return;
  }

  const files = [];
  for await (const file of walkMmdFiles(inputAbs)) files.push(file);

  if (files.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`No .mmd files found under ${inputAbs}`);
    return;
  }

  for (const file of files) {
    const rel = path.relative(inputAbs, file);
    const relNoExt = rel.slice(0, -".mmd".length);
    const outputFile = path.join(outAbs, `${relNoExt}.${format}`);
    await runMmdc({ inputFile: file, outputFile, theme });
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err?.message ?? err);
  process.exit(1);
});
