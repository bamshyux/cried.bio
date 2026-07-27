import fs from "fs";
import path from "path";

const files = [
  "components/profile/public/public-profile-client.tsx",
  "components/profile/public/profile-layouts-extra.tsx",
  "components/profile/public/profile-layouts-premium.tsx",
  "components/profile/public/custom-theme-layout.tsx",
];

const root = process.cwd();

for (const rel of files) {
  const file = path.join(root, rel);
  let src = fs.readFileSync(file, "utf8");

  src = src.replace(/\s*backdropStyle=\{[\s\S]*?\}\n?/g, "\n");
  src = src.replace(
    /<ProfileLayoutCard\s+settings=\{settings\}\s+style=\{\{([^}]+)\}\}\s*>/g,
    '<div className="w-full" style={{ $1 }}>',
  );
  src = src.replace(
    /<ProfileLayoutCard\s+settings=\{settings\}\s+className="([^"]*)"\s+style=\{\{([^}]+)\}\}\s*>/g,
    '<div className="w-full $1" style={{ $2 }}>',
  );
  src = src.replace(
    /<ProfileLayoutCard\s+settings=\{settings\}\s+className="([^"]*)"\s*>/g,
    '<div className="w-full $1">',
  );
  src = src.replace(
    /<ProfileLayoutCard\s+settings=\{settings\}\s+style=\{\s*\n[\s\S]*?\}\s*>/g,
    '<div className="w-full">',
  );
  src = src.replace(/<ProfileLayoutCard\s+settings=\{settings\}>/g, '<div className="w-full">');
  src = src.replace(/<\/ProfileLayoutCard>/g, "</div>");

  src = src.replace(
    /import \{([^}]*?)ProfileLayoutCard,?\s*([^}]*?)\} from "\.\/layout-primitives";/g,
    (match, before, after) => {
      const parts = [before, after]
        .join(",")
        .split(",")
        .map((p) => p.trim())
        .filter(Boolean)
        .filter((p) => p !== "ProfileLayoutCard");
      if (parts.length === 0) return "";
      return `import { ${parts.join(", ")} } from "./layout-primitives";`;
    },
  );

  src = src.replace(/\nimport \{\s*\} from "\.\/layout-primitives";\n/g, "\n");

  fs.writeFileSync(file, src);
  console.log("updated", rel);
}
