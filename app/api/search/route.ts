import { env } from "cloudflare:workers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { matches, searches, sourceRuns } from "@/db/schema";
import { runConnectors } from "@/lib/connectors";
import { requestUserId } from "@/lib/identity";

export const dynamic = "force-dynamic";
const allowedTypes = new Set(["image/jpeg","image/png","image/webp"]);

function hex(buffer:ArrayBuffer){return Array.from(new Uint8Array(buffer),b=>b.toString(16).padStart(2,"0")).join("")}
export async function POST(request:Request){
  try{
    const form=await request.formData();
    const image=form.get("image");
    const width=Number(form.get("width")||0)||null;
    const height=Number(form.get("height")||0)||null;
    if(!(image instanceof File)) return Response.json({error:"لم يتم إرفاق صورة."},{status:400});
    if(!allowedTypes.has(image.type)) return Response.json({error:"الصيغة غير مدعومة."},{status:415});
    if(image.size>10*1024*1024) return Response.json({error:"حجم الصورة يتجاوز 10 ميجابايت."},{status:413});

    const id=crypto.randomUUID();
    const sha256=hex(await crypto.subtle.digest("SHA-256",await image.arrayBuffer()));
    const owner=await requestUserId();if(!owner)return Response.json({error:"تعذّر إنشاء جلسة خاصة لهذا الجهاز."},{status:401});
    const objectKey=`${owner}/${id}/original`;
    await env.IMAGES_BUCKET.put(objectKey,image.stream(),{httpMetadata:{contentType:image.type}});

    const db=getDb();
    const publicToken=crypto.randomUUID()+crypto.randomUUID();const publicExpiresAt=new Date(Date.now()+30*60*1000);
    await db.insert(searches).values({id,userId:owner,filename:image.name,contentType:image.type,byteSize:image.size,
      sha256,width,height,objectKey,publicToken,publicExpiresAt,status:"searching",searchedSources:0,availableSources:0,createdAt:new Date()});
    const publicImageUrl=`${new URL(request.url).origin}/api/public-image/${publicToken}`;
    const results=await runConnectors(image,image.name,publicImageUrl);const found=results.flatMap(r=>r.matches||[]);
    await db.update(searches).set({status:"completed",searchedSources:results.filter(r=>r.searched).length,availableSources:found.length}).where(eq(searches.id,id));
    await db.insert(sourceRuns).values(results.map(r=>({searchId:id,connector:r.name,status:r.status,
      resultUrl:r.resultUrl||null,detail:r.detail,durationMs:r.durationMs,matchCount:r.matches?.length||0})));
    if(found.length)await db.insert(matches).values(found.map(match=>({id:crypto.randomUUID(),searchId:id,connector:"SauceNAO",...match,createdAt:new Date()})));
    return Response.json({search:{id,assetId:`ATH-${id.slice(0,8).toUpperCase()}`,sha256,width,height,
      createdAt:new Date().toISOString()},sources:results,matches:found});
  }catch(error){
    const message=error instanceof Error?error.message:"تعذّر إكمال البحث.";
    return Response.json({error:message},{status:500});
  }
}

export async function GET(){
  try{
    const owner=await requestUserId();if(!owner)return Response.json({history:[]});
    const db=getDb();
    const history=await db.select({id:searches.id,filename:searches.filename,sha256:searches.sha256,
      searchedSources:searches.searchedSources,availableSources:searches.availableSources,createdAt:searches.createdAt})
      .from(searches).where(eq(searches.userId,owner)).orderBy(desc(searches.createdAt)).limit(20);
    return Response.json({history});
  }catch{return Response.json({history:[]})}
}
