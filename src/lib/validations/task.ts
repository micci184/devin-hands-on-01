import { z } from "zod";

export const createTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です"),
  description: z.string().optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]).default("NONE"),
  assigneeId: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).default("BACKLOG"),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1, "タイトルは必須です").optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"]).optional(),
  priority: z.enum(["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"]).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  estimatedHours: z.number().nullable().optional(),
  actualHours: z.number().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
