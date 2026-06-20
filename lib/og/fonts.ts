let interRegularPromise: Promise<ArrayBuffer> | null = null;
let interBoldPromise: Promise<ArrayBuffer> | null = null;

async function loadFont(url: string): Promise<ArrayBuffer> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to load font: ${url}`);
  return response.arrayBuffer();
}

export async function getOgFonts() {
  if (!interRegularPromise) {
    interRegularPromise = loadFont(
      "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa1ZL7W0Q5nw.woff",
    );
  }
  if (!interBoldPromise) {
    interBoldPromise = loadFont(
      "https://fonts.gstatic.com/s/inter/v18/UcC73FwrK3iLTeHuS_nVMrMxCp50SjIa2ZL7W0Q5nw.woff",
    );
  }

  const [regular, bold] = await Promise.all([interRegularPromise, interBoldPromise]);
  return [
    { name: "Inter", data: regular, weight: 400 as const, style: "normal" as const },
    { name: "Inter", data: bold, weight: 700 as const, style: "normal" as const },
  ];
}
