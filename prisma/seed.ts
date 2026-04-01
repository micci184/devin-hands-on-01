import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// パスワード: "password123" の bcrypt ハッシュ
const HASHED_PASSWORD = "$2b$10$9LMNYnaJ.ydBC8Ixhf3TKe2e3wRhJzLZvADooCk16ZzW1xbnjyLwq";

const main = async () => {
  // 全テーブルを依存順に削除
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.taskCategory.deleteMany();
  await prisma.task.deleteMany();
  await prisma.category.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // ユーザー 3 名
  const admin = await prisma.user.create({
    data: {
      email: "admin@example.com",
      name: "管理者 太郎",
      password: HASHED_PASSWORD,
      role: "ADMIN",
      locale: "ja",
      theme: "SYSTEM",
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: "member1@example.com",
      name: "開発者 花子",
      password: HASHED_PASSWORD,
      role: "MEMBER",
      locale: "ja",
      theme: "LIGHT",
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: "member2@example.com",
      name: "開発者 次郎",
      password: HASHED_PASSWORD,
      role: "MEMBER",
      locale: "ja",
      theme: "DARK",
    },
  });

  // プロジェクト 1 件
  const project = await prisma.project.create({
    data: {
      name: "Devin Task Board",
      key: "DTB",
      description: "タスク管理アプリケーション開発プロジェクト",
      ownerId: admin.id,
    },
  });

  // プロジェクトメンバー
  await prisma.projectMember.createMany({
    data: [
      { projectId: project.id, userId: admin.id, role: "OWNER" },
      { projectId: project.id, userId: member1.id, role: "ADMIN" },
      { projectId: project.id, userId: member2.id, role: "MEMBER" },
    ],
  });

  // カテゴリ（デフォルト 4 種）
  const [_bugCategory, featureCategory, improvementCategory, docsCategory] = await Promise.all([
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "バグ",
        color: "oklch(0.55 0.22 27)",
      },
    }),
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "機能追加",
        color: "oklch(0.55 0.12 250)",
      },
    }),
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "改善",
        color: "oklch(0.65 0.17 160)",
      },
    }),
    prisma.category.create({
      data: {
        projectId: project.id,
        name: "ドキュメント",
        color: "oklch(0.55 0.15 300)",
      },
    }),
  ]);

  // タスク 5 件（各ステータスに分散）
  const task1 = await prisma.task.create({
    data: {
      taskNumber: 1,
      title: "環境構築を完了する",
      description:
        "Docker Compose + Next.js 16 + PostgreSQL + Prisma の初期セットアップを行う。\n\n## 作業内容\n- docker-compose.yml の作成\n- Prisma スキーマ定義\n- seed データ投入",
      status: "DONE",
      priority: "HIGH",
      projectId: project.id,
      assigneeId: member1.id,
      reporterId: admin.id,
      startDate: new Date("2025-01-06"),
      dueDate: new Date("2025-01-10"),
      estimatedHours: 8,
      actualHours: 6,
      sortOrder: 1,
    },
  });

  const task2 = await prisma.task.create({
    data: {
      taskNumber: 2,
      title: "ログイン画面を実装する",
      description:
        "Auth.js v5 を使用した認証画面の実装。\n\n- メールアドレス + パスワードでの認証\n- バリデーションエラー表示\n- サインアップ画面へのリンク",
      status: "IN_REVIEW",
      priority: "HIGH",
      projectId: project.id,
      assigneeId: member1.id,
      reporterId: admin.id,
      startDate: new Date("2025-01-13"),
      dueDate: new Date("2025-01-17"),
      estimatedHours: 12,
      actualHours: 10,
      sortOrder: 1,
    },
  });

  const task3 = await prisma.task.create({
    data: {
      taskNumber: 3,
      title: "カンバンボードの D&D を実装する",
      description:
        "### 要件\n- @dnd-kit/core を使用\n- タスクカードのドラッグ&ドロップでステータス変更\n- 楽観的更新で即座に UI に反映",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      projectId: project.id,
      assigneeId: member2.id,
      reporterId: admin.id,
      startDate: new Date("2025-01-20"),
      dueDate: new Date("2025-01-31"),
      estimatedHours: 16,
      sortOrder: 1,
    },
  });

  const task4 = await prisma.task.create({
    data: {
      taskNumber: 4,
      title: "ダッシュボードにグラフを追加する",
      description:
        "recharts を使用してダッシュボードに以下のグラフを表示:\n- ステータス別タスク数（円グラフ）\n- 週次完了タスク数（棒グラフ）",
      status: "TODO",
      priority: "MEDIUM",
      projectId: project.id,
      assigneeId: member1.id,
      reporterId: admin.id,
      dueDate: new Date("2025-02-07"),
      estimatedHours: 10,
      sortOrder: 1,
    },
  });

  const task5 = await prisma.task.create({
    data: {
      taskNumber: 5,
      title: "通知機能を設計する",
      description:
        "通知システムの設計ドキュメントを作成する。\n\n- リアルタイム通知の方式検討\n- メール通知テンプレート設計\n- 通知設定画面の仕様策定",
      status: "BACKLOG",
      priority: "LOW",
      projectId: project.id,
      reporterId: admin.id,
      estimatedHours: 4,
      sortOrder: 1,
    },
  });

  // タスクカテゴリ
  await prisma.taskCategory.createMany({
    data: [
      { taskId: task1.id, categoryId: featureCategory.id },
      { taskId: task2.id, categoryId: featureCategory.id },
      { taskId: task3.id, categoryId: improvementCategory.id },
      { taskId: task4.id, categoryId: featureCategory.id },
      { taskId: task5.id, categoryId: docsCategory.id },
    ],
  });

  // コメント
  await prisma.comment.createMany({
    data: [
      {
        taskId: task1.id,
        authorId: admin.id,
        content: "セットアップ手順を README に追記しました。",
      },
      {
        taskId: task1.id,
        authorId: member1.id,
        content: "確認しました。LGTM です！",
      },
      {
        taskId: task2.id,
        authorId: member1.id,
        content: "Auth.js v5 の Credentials Provider で実装中です。zod バリデーションも追加しました。",
      },
      {
        taskId: task3.id,
        authorId: member2.id,
        content: "@dnd-kit の sortable preset を使って実装を進めています。",
      },
    ],
  });

  // アクティビティログ
  await prisma.activityLog.createMany({
    data: [
      {
        action: "CREATED",
        entityType: "task",
        entityId: task1.id,
        userId: admin.id,
        projectId: project.id,
        newValue: { title: task1.title, status: "BACKLOG" },
      },
      {
        action: "STATUS_CHANGED",
        entityType: "task",
        entityId: task1.id,
        userId: member1.id,
        projectId: project.id,
        oldValue: { status: "IN_PROGRESS" },
        newValue: { status: "DONE" },
      },
      {
        action: "ASSIGNED",
        entityType: "task",
        entityId: task3.id,
        userId: admin.id,
        projectId: project.id,
        newValue: { assigneeId: member2.id, assigneeName: member2.name },
      },
    ],
  });

  // 通知
  await prisma.notification.createMany({
    data: [
      {
        type: "TASK_ASSIGNED",
        title: "タスクが割り当てられました",
        message: `「${task3.title}」があなたに割り当てられました。`,
        userId: member2.id,
        linkUrl: `/projects/${project.id}/tasks/${task3.id}`,
        isRead: false,
      },
      {
        type: "TASK_COMMENTED",
        title: "コメントが追加されました",
        message: `「${task1.title}」に新しいコメントがあります。`,
        userId: admin.id,
        linkUrl: `/projects/${project.id}/tasks/${task1.id}`,
        isRead: true,
      },
      {
        type: "TASK_STATUS_CHANGED",
        title: "ステータスが変更されました",
        message: `「${task1.title}」が DONE に変更されました。`,
        userId: admin.id,
        linkUrl: `/projects/${project.id}/tasks/${task1.id}`,
        isRead: false,
      },
    ],
  });

  // 監査ログ
  await prisma.auditLog.create({
    data: {
      action: "SEED_EXECUTED",
      userId: admin.id,
      resource: "seed",
      resourceId: project.id,
      details: {
        users: 3,
        projects: 1,
        tasks: 5,
        categories: 4,
      },
    },
  });

  console.log("Seed completed: 3 users, 1 project, 5 tasks, 4 categories");
};

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
