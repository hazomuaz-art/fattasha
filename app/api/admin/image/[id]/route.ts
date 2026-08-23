import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { searches } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){if(!(await isAdmin()))return new Response("Unauthorized",{status:401});const {id}=await params;const [record]=await getDb().select({objectKey:searches.objectKey,contentType:searches.contentType,filename:searches.filename}).from(searches).where(eq(searches.id,id)).limit(1);if(!record)return new Response("Not found",{status:404});const object=await env.IMAGES_BUCKET.get(record.objectKey);if(!object)return new Response("Not found",{status:404});const download=new URL(request.url).searchParams.get("download")==="1";const safeName=record.filename.replace(/[^\p{L}\p{N}._ -]/gu,"_").slice(0,120)||"fattasha-image";return new Response(object.body,{headers:{"content-type":record.contentType,"content-disposition":`${download?"attachment":"inline"}; filename*=UTF-8''${encodeURIComponent(safeName)}`,"cache-control":"private, no-store","x-content-type-options":"nosniff"}})}
