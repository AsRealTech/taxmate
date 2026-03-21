import { Router, type IRouter } from "express";
import archiver from "archiver";
import path from "path";
import fs from "fs";

const router: IRouter = Router();

const ROOT = path.resolve(process.cwd(), "../..");

const IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  ".cache",
  "*.log",
  ".local",
  "pnpm-lock.yaml",
  "tsconfig.tsbuildinfo",
  ".replit-artifact",
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some((pattern) => {
    if (pattern.includes("*")) {
      const ext = pattern.replace("*", "");
      return filePath.endsWith(ext);
    }
    const parts = filePath.split(path.sep);
    return parts.some((part) => part === pattern);
  });
}

router.get("/", (_req, res) => {
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", 'attachment; filename="taxmate-project.zip"');

  const archive = archiver("zip", { zlib: { level: 6 } });

  archive.on("error", (err) => {
    console.error("Archive error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to create archive" });
    }
  });

  archive.pipe(res);

  function addDirectory(dirPath: string, zipPath: string) {
    if (!fs.existsSync(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(zipPath, entry.name);

      if (shouldIgnore(fullPath)) continue;

      if (entry.isDirectory()) {
        addDirectory(fullPath, relativePath);
      } else if (entry.isFile()) {
        archive.file(fullPath, { name: relativePath });
      }
    }
  }

  const includeDirs = [
    { src: path.join(ROOT, "artifacts", "taxmate"), zip: "artifacts/taxmate" },
    { src: path.join(ROOT, "artifacts", "api-server"), zip: "artifacts/api-server" },
    { src: path.join(ROOT, "lib", "api-spec"), zip: "lib/api-spec" },
    { src: path.join(ROOT, "lib", "db"), zip: "lib/db" },
    { src: path.join(ROOT, "scripts"), zip: "scripts" },
  ];

  const includeFiles = [
    { src: path.join(ROOT, "package.json"), zip: "package.json" },
    { src: path.join(ROOT, "pnpm-workspace.yaml"), zip: "pnpm-workspace.yaml" },
    { src: path.join(ROOT, "tsconfig.json"), zip: "tsconfig.json" },
    { src: path.join(ROOT, "tsconfig.base.json"), zip: "tsconfig.base.json" },
    { src: path.join(ROOT, "replit.md"), zip: "replit.md" },
  ];

  for (const { src, zip } of includeDirs) {
    addDirectory(src, zip);
  }

  for (const { src, zip } of includeFiles) {
    if (fs.existsSync(src)) {
      archive.file(src, { name: zip });
    }
  }

  archive.finalize();
});

export default router;
