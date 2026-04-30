import { and, desc, eq, sql } from "drizzle-orm";
import type { Subject } from "@/lib/subjects";
import { getDb, schema } from "@/lib/db";

export async function createTaskSession(params: {
  userId: number;
  subject: Subject;
  topic: string;
  taskText: string;
  correctAnswer: string;
}) {
  const db = getDb();
  const rows = await db
    .insert(schema.taskSessions)
    .values({
      userId: params.userId,
      subject: params.subject,
      topic: params.topic,
      taskText: params.taskText,
      correctAnswer: params.correctAnswer,
    })
    .returning({ id: schema.taskSessions.id });
  return rows[0]?.id as number | undefined;
}

export async function getTask(userId: number, taskId: number) {
  const db = getDb();
  const rows = await db
    .select({
      id: schema.taskSessions.id,
      subject: schema.taskSessions.subject,
      topic: schema.taskSessions.topic,
      taskText: schema.taskSessions.taskText,
      correctAnswer: schema.taskSessions.correctAnswer,
      correct: schema.taskSessions.correct,
      userAnswer: schema.taskSessions.userAnswer,
      aiFeedback: schema.taskSessions.aiFeedback,
      createdAt: schema.taskSessions.createdAt,
    })
    .from(schema.taskSessions)
    .where(and(eq(schema.taskSessions.userId, userId), eq(schema.taskSessions.id, taskId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function setTaskCheckResult(params: {
  userId: number;
  taskId: number;
  userAnswer: string;
  correct: boolean;
  aiFeedback: string;
}) {
  const db = getDb();
  await db
    .update(schema.taskSessions)
    .set({
      userAnswer: params.userAnswer,
      correct: params.correct,
      aiFeedback: params.aiFeedback,
    })
    .where(and(eq(schema.taskSessions.userId, params.userId), eq(schema.taskSessions.id, params.taskId)));
}

export async function listTaskHistory(userId: number) {
  const db = getDb();
  return await db
    .select({
      id: schema.taskSessions.id,
      subject: schema.taskSessions.subject,
      topic: schema.taskSessions.topic,
      correct: schema.taskSessions.correct,
      createdAt: schema.taskSessions.createdAt,
    })
    .from(schema.taskSessions)
    .where(eq(schema.taskSessions.userId, userId))
    .orderBy(desc(schema.taskSessions.id))
    .limit(50);
}

export async function getTaskStats(userId: number) {
  const db = getDb();

  const totalRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.taskSessions)
    .where(and(eq(schema.taskSessions.userId, userId), eq(schema.taskSessions.correct, true)));

  const todayRows = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.taskSessions)
    .where(
      and(
        eq(schema.taskSessions.userId, userId),
        eq(schema.taskSessions.correct, true),
        sql`date(${schema.taskSessions.createdAt}) = date('now')`,
      ),
    );

  return {
    solvedTotal: totalRows[0]?.count ?? 0,
    solvedToday: todayRows[0]?.count ?? 0,
  };
}

