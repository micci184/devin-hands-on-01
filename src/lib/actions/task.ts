"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createTaskSchema } from "@/lib/validations/task";

export const createTask = async (projectId: string, formData: FormData) => {
  const session = await auth();
  if (!session?.user) {
    return { error: "認証が必要です" };
  }

  const raw = {
    title: formData.get("title") as string,
    description: (formData.get("description") as string) || undefined,
    priority: formData.get("priority") as string,
    status: formData.get("status") as string,
    assigneeId: (formData.get("assigneeId") as string) || undefined,
    dueDate: (formData.get("dueDate") as string) || undefined,
  };

  const parsed = createTaskSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  });
  if (!project) {
    return { error: "プロジェクトが見つかりません" };
  }

  const lastTask = await prisma.task.findFirst({
    where: { projectId },
    orderBy: { taskNumber: "desc" },
    select: { taskNumber: true },
  });
  const taskNumber = (lastTask?.taskNumber ?? 0) + 1;

  const task = await prisma.task.create({
    data: {
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      status: parsed.data.status,
      assigneeId: parsed.data.assigneeId || null,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
      projectId,
      reporterId: session.user.id,
      taskNumber,
    },
  });

  revalidatePath(`/projects/${projectId}/board`);
  return { data: task };
};
