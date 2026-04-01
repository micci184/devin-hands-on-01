import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です"),
  description: z.string().optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "プロジェクト名は必須です").optional(),
  description: z.string().optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
