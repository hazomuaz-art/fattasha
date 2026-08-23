import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searches } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){if(!(await isAdmin()))return new Response("Unauthorized",{status:401});const {id}=await params;const [record]=await getDb().select({objectKey:searches.objectKey,contentType:searches.contentType}).from(searches).where(eq(searches.id,id)).limit(1);if(!record)return new Response("Not found",{status:404});const object=await env.IMAGES_BUCKET.get(record.objectKey);if(!object)return new Response("Not found",{status:404});return new Response(object.body,{headers:{"content-type":record.contentType,"cache-control":"private, no-store","x-content-type-options":"nosniff"}})}
