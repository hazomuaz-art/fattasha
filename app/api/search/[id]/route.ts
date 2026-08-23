import { env } from "cloudflare:workers";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searches, sourceRuns } from "@/db/schema";
import { requestUserId } from "@/lib/identity";

export async function DELETE(_request:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params; const owner=await requestUserId();if(!owner)return Response.json({error:"غير مصرح"},{status:401});
  const db=getDb(); const [record]=await db.select().from(searches).where(and(eq(searches.id,id),eq(searches.userId,owner))).limit(1);
  if(!record)return Response.json({error:"غير موجود"},{status:404});
  await env.IMAGES_BUCKET.delete(record.objectKey);
  await db.delete(sourceRuns).where(eq(sourceRuns.searchId,id));
  await db.delete(searches).where(eq(searches.id,id));
  return Response.json({deleted:true});
}
