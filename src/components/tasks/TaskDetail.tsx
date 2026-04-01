"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Edit2,
  Check,
  X,
  User,
  Flag,
  Layers,
  Trash2,
} from "lucide-react";

import type { Priority, TaskStatus } from "@prisma/client";

interface UserRef {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface SubtaskData {
  id: string;
  taskNumber: number;
  title: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  assignee: UserRef | null;
}

interface CategoryData {
  category: {
    id: string;
    name: string;
    color: string;
  };
}

interface TaskData {
  id: string;
  taskNumber: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  projectId: string;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null;
  startDate: string | null;
  estimatedHours: number | null;
  actualHours: number | null;
  createdAt: string;
  updatedAt: string;
  assignee: UserRef | null;
  reporter: UserRef;
  project: { id: string; name: string; key: string };
  taskCategories: CategoryData[];
  subtasks: SubtaskData[];
}

interface TaskDetailProps {
  task: TaskData;
  members: UserRef[];
}

const statusConfig: Record<TaskStatus, { label: string; className: string }> = {
  BACKLOG: { label: "Backlog", className: "bg-muted text-muted-foreground" },
  TODO: { label: "Todo", className: "bg-primary/10 text-primary" },
  IN_PROGRESS: { label: "In Progress", className: "bg-warning/10 text-warning" },
  IN_REVIEW: { label: "In Review", className: "bg-accent text-accent-foreground" },
  DONE: { label: "Done", className: "bg-success/10 text-success" },
};

const priorityConfig: Record<Priority, { label: string; className: string }> = {
  URGENT: { label: "緊急", className: "bg-danger/10 text-danger" },
  HIGH: { label: "高", className: "bg-warning/10 text-warning" },
  MEDIUM: { label: "中", className: "bg-primary/10 text-primary" },
  LOW: { label: "低", className: "bg-muted text-muted-foreground" },
  NONE: { label: "なし", className: "bg-muted text-muted-foreground" },
};

const statuses: TaskStatus[] = ["BACKLOG", "TODO", "IN_PROGRESS", "IN_REVIEW", "DONE"];
const priorities: Priority[] = ["URGENT", "HIGH", "MEDIUM", "LOW", "NONE"];

export const TaskDetail = ({ task: initialTask, members }: TaskDetailProps) => {
  const router = useRouter();
  const [task, setTask] = useState(initialTask);
  const [saving, setSaving] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateField = async (field: string, value: unknown) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });

      if (res.ok) {
        const json = await res.json();
        setTask(json.data);
      }
    } catch {
      // silently fail
    } finally {
      setSaving(false);
      setEditingField(null);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/projects/${task.projectId}/board`);
      }
    } catch {
      // silently fail
    }
  };

  const startEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditValue(currentValue);
  };

  const cancelEdit = () => {
    setEditingField(null);
    setEditValue("");
  };

  const confirmEdit = (field: string) => {
    updateField(field, editValue || null);
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const isOverdue = dueDate ? dueDate < new Date() && task.status !== "DONE" : false;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${task.projectId}/board`}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {task.project.name}
          </span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium text-muted-foreground">
            {task.project.key}-{task.taskNumber}
          </span>
        </div>
        {saving && (
          <span className="ml-auto text-xs text-muted-foreground">保存中...</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="group">
            {editingField === "title" ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-xl font-bold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") confirmEdit("title");
                    if (e.key === "Escape") cancelEdit();
                  }}
                />
                <button
                  onClick={() => confirmEdit("title")}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-success hover:bg-success/10"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent"
                >
                  <X size={16} />
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <h1 className="text-2xl font-bold text-foreground">{task.title}</h1>
                <button
                  onClick={() => startEdit("title", task.title)}
                  className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100"
                >
                  <Edit2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Description */}
          <div className="group">
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              説明
              {editingField !== "description" && (
                <button
                  onClick={() => startEdit("description", task.description ?? "")}
                  className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100"
                >
                  <Edit2 size={12} />
                </button>
              )}
            </h3>
            {editingField === "description" ? (
              <div className="space-y-2">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  rows={6}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="タスクの説明を入力（Markdown対応）"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmEdit("description")}
                    className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    保存
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="cursor-pointer rounded-md border border-transparent p-3 text-sm text-foreground hover:border-border hover:bg-accent/50"
                onClick={() => startEdit("description", task.description ?? "")}
              >
                {task.description ? (
                  <p className="whitespace-pre-wrap">{task.description}</p>
                ) : (
                  <p className="text-muted-foreground">説明を追加...</p>
                )}
              </div>
            )}
          </div>

          {/* Subtasks */}
          {task.subtasks.length > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Layers size={14} />
                サブタスク ({task.subtasks.length})
              </h3>
              <div className="space-y-2">
                {task.subtasks.map((subtask) => (
                  <Link
                    key={subtask.id}
                    href={`/projects/${task.projectId}/tasks/${subtask.id}`}
                    className="flex items-center gap-3 rounded-md border border-border p-3 hover:bg-accent/50"
                  >
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusConfig[subtask.status].className}`}
                    >
                      {statusConfig[subtask.status].label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {task.project.key}-{subtask.taskNumber}
                    </span>
                    <span className="flex-1 text-sm text-foreground">
                      {subtask.title}
                    </span>
                    {subtask.assignee && (
                      <div
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary"
                        title={subtask.assignee.name}
                      >
                        {subtask.assignee.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          {task.taskCategories.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">カテゴリ</h3>
              <div className="flex flex-wrap gap-2">
                {task.taskCategories.map((tc) => (
                  <span
                    key={tc.category.id}
                    className="rounded-full px-3 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${tc.category.color}20`, color: tc.category.color }}
                  >
                    {tc.category.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 space-y-4">
            {/* Status */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                ステータス
              </label>
              <select
                value={task.status}
                onChange={(e) => updateField("status", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {statusConfig[s].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Flag size={12} />
                優先度
              </label>
              <select
                value={task.priority}
                onChange={(e) => updateField("priority", e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              >
                {priorities.map((p) => (
                  <option key={p} value={p}>
                    {priorityConfig[p].label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assignee */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <User size={12} />
                担当者
              </label>
              <select
                value={task.assigneeId ?? ""}
                onChange={(e) => updateField("assigneeId", e.target.value || null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="">未割り当て</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Calendar size={12} />
                期限
              </label>
              <input
                type="date"
                value={task.dueDate ? format(new Date(task.dueDate), "yyyy-MM-dd") : ""}
                onChange={(e) => updateField("dueDate", e.target.value || null)}
                className={`w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring ${
                  isOverdue ? "text-danger" : "text-foreground"
                }`}
              />
              {isOverdue && (
                <p className="mt-1 text-xs text-danger">期限を超過しています</p>
              )}
            </div>

            {/* Reporter */}
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                起票者
              </label>
              <div className="flex items-center gap-2 px-1">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                  {task.reporter.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground">{task.reporter.name}</span>
              </div>
            </div>

            {/* Timestamps */}
            <div className="border-t border-border pt-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>作成: {format(new Date(task.createdAt), "yyyy/MM/dd HH:mm")}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>更新: {format(new Date(task.updatedAt), "yyyy/MM/dd HH:mm")}</span>
              </div>
            </div>
          </div>

          {/* Delete button */}
          <div>
            {showDeleteConfirm ? (
              <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 space-y-3">
                <p className="text-sm text-danger">
                  このタスクを削除しますか？関連するコメント・添付ファイル・サブタスクも削除されます。
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="rounded-md bg-danger px-3 py-1.5 text-sm font-medium text-danger-foreground hover:opacity-90"
                  >
                    削除する
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/30 px-3 py-2 text-sm font-medium text-danger hover:bg-danger/5"
              >
                <Trash2 size={14} />
                タスクを削除
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
