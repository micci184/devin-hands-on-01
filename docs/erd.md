# ER図（Entity Relationship Diagram）

Prisma スキーマ（`prisma/schema.prisma`）に基づく全11テーブルのER図。

```mermaid
erDiagram
    users {
        String id PK "cuid"
        String email UK "ユニーク"
        String name
        String password "bcrypt ハッシュ"
        String avatarUrl "nullable"
        Role role "ADMIN | MEMBER"
        String locale "default: ja"
        Theme theme "LIGHT | DARK | SYSTEM"
        DateTime createdAt
        DateTime updatedAt
    }

    projects {
        String id PK "cuid"
        String name
        String description "nullable"
        String key UK "例: DTB"
        String ownerId FK "users.id"
        DateTime createdAt
        DateTime updatedAt
    }

    project_members {
        String id PK "cuid"
        String projectId FK "projects.id"
        String userId FK "users.id"
        ProjectRole role "OWNER | ADMIN | MEMBER | VIEWER"
        DateTime createdAt
        DateTime updatedAt
    }

    tasks {
        String id PK "cuid"
        Int taskNumber "プロジェクト内連番"
        String title
        String description "nullable, Markdown"
        TaskStatus status "BACKLOG | TODO | IN_PROGRESS | IN_REVIEW | DONE"
        Priority priority "URGENT | HIGH | MEDIUM | LOW | NONE"
        String projectId FK "projects.id"
        String assigneeId FK "nullable, users.id"
        String reporterId FK "users.id"
        String parentTaskId FK "nullable, tasks.id"
        DateTime dueDate "nullable"
        DateTime startDate "nullable"
        Float estimatedHours "nullable"
        Float actualHours "nullable"
        Int sortOrder "default: 0"
        DateTime createdAt
        DateTime updatedAt
    }

    categories {
        String id PK "cuid"
        String name
        String color "OKLCH"
        String projectId FK "projects.id"
        DateTime createdAt
        DateTime updatedAt
    }

    task_categories {
        String id PK "cuid"
        String taskId FK "tasks.id"
        String categoryId FK "categories.id"
        DateTime createdAt
        DateTime updatedAt
    }

    comments {
        String id PK "cuid"
        String content "Markdown"
        String taskId FK "tasks.id"
        String authorId FK "users.id"
        DateTime createdAt
        DateTime updatedAt
    }

    attachments {
        String id PK "cuid"
        String fileName
        String fileUrl
        Int fileSize "bytes"
        String mimeType
        String taskId FK "tasks.id"
        String uploaderId FK "users.id"
        DateTime createdAt
        DateTime updatedAt
    }

    activity_logs {
        String id PK "cuid"
        ActivityAction action "CREATED | UPDATED | DELETED | ..."
        String entityType "task | comment | project 等"
        String entityId
        String userId FK "users.id"
        String projectId FK "projects.id"
        Json oldValue "nullable"
        Json newValue "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    notifications {
        String id PK "cuid"
        NotificationType type "TASK_ASSIGNED | TASK_COMMENTED | ..."
        String title
        String message
        Boolean isRead "default: false"
        String userId FK "users.id"
        String linkUrl "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    audit_logs {
        String id PK "cuid"
        String action
        String userId FK "users.id"
        String ipAddress "nullable"
        String userAgent "nullable"
        String resource
        String resourceId
        Json details "nullable"
        DateTime createdAt
        DateTime updatedAt
    }

    %% === リレーション ===

    %% users - projects (1:N, owner)
    users ||--o{ projects : "owns"

    %% users - project_members (1:N)
    users ||--o{ project_members : "has"
    %% projects - project_members (1:N)
    projects ||--o{ project_members : "has"

    %% projects - tasks (1:N)
    projects ||--o{ tasks : "contains"
    %% users - tasks (1:N, assignee, nullable)
    users ||--o{ tasks : "assigned to"
    %% users - tasks (1:N, reporter)
    users ||--o{ tasks : "reported by"
    %% tasks - tasks (self 1:N, subtasks)
    tasks ||--o{ tasks : "subtasks"

    %% projects - categories (1:N)
    projects ||--o{ categories : "has"

    %% tasks - task_categories (1:N)
    tasks ||--o{ task_categories : "has"
    %% categories - task_categories (1:N)
    categories ||--o{ task_categories : "has"

    %% tasks - comments (1:N)
    tasks ||--o{ comments : "has"
    %% users - comments (1:N)
    users ||--o{ comments : "authored"

    %% tasks - attachments (1:N)
    tasks ||--o{ attachments : "has"
    %% users - attachments (1:N)
    users ||--o{ attachments : "uploaded"

    %% users - activity_logs (1:N)
    users ||--o{ activity_logs : "performed"
    %% projects - activity_logs (1:N)
    projects ||--o{ activity_logs : "logged in"

    %% users - notifications (1:N)
    users ||--o{ notifications : "receives"

    %% users - audit_logs (1:N)
    users ||--o{ audit_logs : "tracked"
```

## テーブル一覧

| # | テーブル名 | Prisma モデル | 説明 |
|---|-----------|--------------|------|
| 1 | users | User | ユーザー |
| 2 | projects | Project | プロジェクト |
| 3 | project_members | ProjectMember | プロジェクトメンバー（多対多） |
| 4 | tasks | Task | タスク |
| 5 | categories | Category | カテゴリ |
| 6 | task_categories | TaskCategory | タスク-カテゴリ（多対多） |
| 7 | comments | Comment | コメント |
| 8 | attachments | Attachment | 添付ファイル |
| 9 | activity_logs | ActivityLog | アクティビティログ |
| 10 | notifications | Notification | 通知 |
| 11 | audit_logs | AuditLog | 監査ログ |

## リレーション一覧

| 親テーブル | 子テーブル | 関係 | 外部キー | ON DELETE |
|-----------|-----------|------|---------|-----------|
| users | projects | 1:N | ownerId | CASCADE |
| users | project_members | 1:N | userId | CASCADE |
| projects | project_members | 1:N | projectId | CASCADE |
| projects | tasks | 1:N | projectId | CASCADE |
| users | tasks | 1:N | assigneeId | SET NULL |
| users | tasks | 1:N | reporterId | CASCADE |
| tasks | tasks | 1:N (self) | parentTaskId | CASCADE |
| projects | categories | 1:N | projectId | CASCADE |
| tasks | task_categories | 1:N | taskId | CASCADE |
| categories | task_categories | 1:N | categoryId | CASCADE |
| tasks | comments | 1:N | taskId | CASCADE |
| users | comments | 1:N | authorId | CASCADE |
| tasks | attachments | 1:N | taskId | CASCADE |
| users | attachments | 1:N | uploaderId | CASCADE |
| users | activity_logs | 1:N | userId | CASCADE |
| projects | activity_logs | 1:N | projectId | CASCADE |
| users | notifications | 1:N | userId | CASCADE |
| users | audit_logs | 1:N | userId | CASCADE |
