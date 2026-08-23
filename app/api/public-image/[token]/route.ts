import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searches } from "@/db/schema";
export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){
  const {token}=await params;const [record]=await getDb().select({objectKey:searches.objectKey,contentType:searches.contentType,expires:searches.publicExpiresAt}).from(searches).where(eq(searches.publicToken,token)).limit(1);
  if(!record||!record.expires||record.expires.getTime()<Date.now())return new Response("Expired",{status:404});
  const object=await env.IMAGES_BUCKET.get(record.objectKey);if(!object)return new Response("Not found",{status:404});
  return new Response(object.body,{headers:{"content-type":record.contentType,"content-disposition":"inline","cache-control":"private, max-age=60","cross-origin-resource-policy":"cross-origin","x-content-type-options":"nosniff"}});
}
