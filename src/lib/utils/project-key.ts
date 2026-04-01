import { prisma } from "@/lib/prisma";

/**
 * プロジェクト名からキーを自動生成する。
 * 例: "Devin Task Board" → "DTB"
 * 重複がある場合は末尾に連番を付与する（DTB1, DTB2...）。
 */
export const generateProjectKey = async (name: string): Promise<string> => {
  const words = name.trim().split(/\s+/);
  let baseKey: string;

  if (words.length >= 2) {
    baseKey = words
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  } else {
    baseKey = name.trim().slice(0, 3).toUpperCase();
  }

  baseKey = baseKey.replace(/[^A-Z0-9]/g, "");
  if (baseKey.length === 0) {
    baseKey = "PRJ";
  }

  let candidate = baseKey;
  let suffix = 1;

  while (true) {
    const existing = await prisma.project.findUnique({
      where: { key: candidate },
    });
    if (!existing) break;
    candidate = `${baseKey}${suffix}`;
    suffix++;
  }

  return candidate;
};
