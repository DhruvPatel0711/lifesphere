import { db } from "@/lib/db";
import { auditLogs } from "@/drizzle/schema";
import { eq, desc } from "drizzle-orm";

export interface LogAuditParams {
  userId: string;
  recordId?: string;
  action: "CREATE" | "READ" | "UPDATE" | "DELETE" | "SOFT_DELETE" | "EXPORT";
  details?: string;
}

export async function logAudit(params: LogAuditParams) {
  try {
    const entry = db.insert(auditLogs).values({
      userId: params.userId,
      recordId: params.recordId || null,
      action: params.action,
      details: params.details || null,
    }).returning().get();
    return entry;
  } catch (error) {
    console.error("[Audit Log Error]", error);
    return null;
  }
}

export async function getUserAuditLogs(userId: string) {
  return db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.userId, userId))
    .orderBy(desc(auditLogs.createdAt))
    .all();
}
