import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { updateTaskSchema } from "@/lib/validations/task";

import type { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";

export const GET = async (
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { taskId } = await params;

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

    if (!task) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "タスクが見つかりません" } },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("[GET /api/tasks/[taskId]]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 },
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { taskId } = await params;

    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!existingTask) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "タスクが見つかりません" } },
        { status: 404 },
      );
    }

    const memberRole = existingTask.project.projectMembers[0]?.role;
    if (memberRole === "VIEWER") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "VIEWER はタスクを編集できません" } },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0].message,
          },
        },
        { status: 400 },
      );
    }

    const updateData: Prisma.TaskUpdateInput = {};
    const oldValues: Record<string, unknown> = {};
    const newValues: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) {
      oldValues.title = existingTask.title;
      newValues.title = parsed.data.title;
      updateData.title = parsed.data.title;
    }
    if (parsed.data.description !== undefined) {
      oldValues.description = existingTask.description;
      newValues.description = parsed.data.description;
      updateData.description = parsed.data.description;
    }
    if (parsed.data.status !== undefined) {
      oldValues.status = existingTask.status;
      newValues.status = parsed.data.status;
      updateData.status = parsed.data.status;
    }
    if (parsed.data.priority !== undefined) {
      oldValues.priority = existingTask.priority;
      newValues.priority = parsed.data.priority;
      updateData.priority = parsed.data.priority;
    }
    if (parsed.data.assigneeId !== undefined) {
      oldValues.assigneeId = existingTask.assigneeId;
      newValues.assigneeId = parsed.data.assigneeId;
      updateData.assignee = parsed.data.assigneeId
        ? { connect: { id: parsed.data.assigneeId } }
        : { disconnect: true };
    }
    if (parsed.data.dueDate !== undefined) {
      oldValues.dueDate = existingTask.dueDate?.toISOString() ?? null;
      newValues.dueDate = parsed.data.dueDate;
      updateData.dueDate = parsed.data.dueDate ? new Date(parsed.data.dueDate) : null;
    }
    if (parsed.data.startDate !== undefined) {
      oldValues.startDate = existingTask.startDate?.toISOString() ?? null;
      newValues.startDate = parsed.data.startDate;
      updateData.startDate = parsed.data.startDate ? new Date(parsed.data.startDate) : null;
    }
    if (parsed.data.estimatedHours !== undefined) {
      oldValues.estimatedHours = existingTask.estimatedHours;
      newValues.estimatedHours = parsed.data.estimatedHours;
      updateData.estimatedHours = parsed.data.estimatedHours;
    }
    if (parsed.data.actualHours !== undefined) {
      oldValues.actualHours = existingTask.actualHours;
      newValues.actualHours = parsed.data.actualHours;
      updateData.actualHours = parsed.data.actualHours;
    }

    const activityAction = parsed.data.status !== undefined ? "STATUS_CHANGED"
      : parsed.data.assigneeId !== undefined ? "ASSIGNED"
      : "UPDATED";

    const [task] = await prisma.$transaction([
      prisma.task.update({
        where: { id: taskId },
        data: updateData,
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
      }),
      prisma.activityLog.create({
        data: {
          action: activityAction,
          entityType: "task",
          entityId: taskId,
          userId: session.user.id,
          projectId: existingTask.projectId,
          oldValue: oldValues,
          newValue: newValues,
        },
      }),
    ]);

    return NextResponse.json({ data: task });
  } catch (error) {
    console.error("[PATCH /api/tasks/[taskId]]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 },
    );
  }
};

export const DELETE = async (
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> },
) => {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 },
      );
    }

    const { taskId } = await params;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            projectMembers: {
              where: { userId: session.user.id },
              select: { role: true },
            },
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "タスクが見つかりません" } },
        { status: 404 },
      );
    }

    const memberRole = task.project.projectMembers[0]?.role;
    if (memberRole === "VIEWER") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "VIEWER はタスクを削除できません" } },
        { status: 403 },
      );
    }

    await prisma.task.delete({ where: { id: taskId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[DELETE /api/tasks/[taskId]]", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "サーバーエラーが発生しました" } },
      { status: 500 },
    );
  }
};
