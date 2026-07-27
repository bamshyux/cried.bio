import fs from "fs";
import path from "path";

const files = [
  "components/profile/public/profile-layouts-extra.tsx",
  "components/profile/public/profile-layouts-premium.tsx",
];

const root = process.cwd();

for (const rel of files) {
  const file = path.join(root, rel);
  let src = fs.readFileSync(file, "utf8");

  while (src.includes("<ProfileLayoutCard")) {
    src = src.replace(/<ProfileLayoutCard[\s\S]*?>/, (tag) => {
      const classMatch = tag.match(/className="([^"]*)"/);
      const styleMatch = tag.match(/style=\{([\s\S]*?)\}\s*(?:backdropStyle|$|>)/);
      const className = classMatch?.[1] ?? "";
      const style = styleMatch?.[1]?.trim();
      const classes = ["w-full", className].filter(Boolean).join(" ");
      if (style) return `<div className="${classes}" style={${style}}>`;
      return `<div className="${classes}">`;
    });
  }

  src = src.replace(/<\/ProfileLayoutCard>/g, "</div>");
  src = src.replace(/\s*ProfileLayoutCard,?\s*/g, " ");
  src = src.replace(/import \{\s*,/g, "import {");
  src = src.replace(/,\s*,/g, ",");

  fs.writeFileSync(file, src);
  console.log("fixed", rel);
}
