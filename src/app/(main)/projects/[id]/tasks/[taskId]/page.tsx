import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { TaskDetail } from "@/components/tasks/TaskDetail";

interface TaskDetailPageProps {
  params: Promise<{ id: string; taskId: string }>;
}

const TaskDetailPage = async ({ params }: TaskDetailPageProps) => {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id: projectId, taskId } = await params;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      assignee: { select: { id: true, name: true, avatarUrl: true } },
      reporter: { select: { id: true, name: true, avatarUrl: true } },
      project: { select: { id: true, name: true, key: true } },
      taskCategories: { include: { category: true } },
      subtasks: {
        include: {
          assignee: { select: { id: true, name: true, avatarUrl: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task || task.projectId !== projectId) {
    redirect(`/projects/${projectId}/board`);
  }

  const members = await prisma.projectMember.findMany({
    where: { projectId },
    include: { user: { select: { id: true, name: true, avatarUrl: true } } },
  });
  const projectMembers = members.map((m) => m.user);

  const serializedTask = {
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    startDate: task.startDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
    subtasks: task.subtasks.map((st) => ({
      ...st,
      dueDate: st.dueDate?.toISOString() ?? null,
      startDate: st.startDate?.toISOString() ?? null,
      createdAt: st.createdAt.toISOString(),
      updatedAt: st.updatedAt.toISOString(),
    })),
    taskCategories: task.taskCategories.map((tc) => ({
      ...tc,
      createdAt: tc.createdAt.toISOString(),
      updatedAt: tc.updatedAt.toISOString(),
      category: {
        ...tc.category,
        createdAt: tc.category.createdAt.toISOString(),
        updatedAt: tc.category.updatedAt.toISOString(),
      },
    })),
  };

  return (
    <TaskDetail
      task={serializedTask}
      members={projectMembers}
    />
  );
};
export default TaskDetailPage;
