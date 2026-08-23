import { env } from "cloudflare:workers";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searches, sourceRuns } from "@/db/schema";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const h=await headers(); const owner=h.get("oai-authenticated-user-id")||"local-preview-user";
  const db=getDb(); const [record]=await db.select().from(searches).where(and(eq(searches.id,id),eq(searches.userId,owner))).limit(1);
  if(!record)return Response.json({error:"غير موجود"},{status:404});
  await env.IMAGES_BUCKET.delete(record.objectKey);
  await db.delete(sourceRuns).where(eq(sourceRuns.searchId,id));
  await db.delete(searches).where(eq(searches.id,id));
  return Response.json({deleted:true});
}
