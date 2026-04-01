import { Plus } from "lucide-react";

import { TaskCard } from "@/components/tasks/TaskCard";

import type { Priority, TaskStatus } from "@prisma/client";

interface Task {
  id: string;
  taskNumber: number;
  title: string;
  priority: Priority;
  status: TaskStatus;
  dueDate: string | Date | null;
  assignee: {
    id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
}

interface KanbanColumnProps {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  projectId: string;
  projectKey: string;
  onQuickCreate: (status: TaskStatus) => void;
}

export const KanbanColumn = ({
  status,
  label,
  tasks,
  projectId,
  projectKey,
  onQuickCreate,
}: KanbanColumnProps) => {
  return (
    <div className="flex w-72 shrink-0 flex-col rounded-lg bg-muted/50">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">{label}</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onQuickCreate(status)}
          className="flex h-6 w-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground"
          aria-label={`${label}にタスクを追加`}
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} projectId={projectId} projectKey={projectKey} />
        ))}
      </div>
    </div>
  );
};
