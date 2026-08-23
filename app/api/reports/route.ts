import { getDb } from "@/db";
import { reports } from "@/db/schema";
import { requestUserId } from "@/lib/identity";
import { rateLimit, sameOrigin, secureJson } from "@/lib/security";
export async function POST(request:Request){
  if(!sameOrigin(request))return secureJson({error:"طلب غير موثوق."},{status:403});
  const retryAfter=rateLimit(request,"reports",10);if(retryAfter)return secureJson({error:"طلبات كثيرة. حاول بعد قليل."},{status:429,headers:{"retry-after":String(retryAfter)}});
  const userId=await requestUserId();if(!userId)return Response.json({error:"تعذّر إنشاء جلسة خاصة."},{status:401});
  const body=await request.json() as {searchId?:string;sourceUrl?:string;reportType?:string;notes?:string};
  if(!body.sourceUrl||!body.reportType)return Response.json({error:"الرابط ونوع البلاغ مطلوبان."},{status:400});
  let parsed:URL;try{parsed=new URL(body.sourceUrl)}catch{return Response.json({error:"الرابط غير صالح."},{status:400})}
  if(!["http:","https:"].includes(parsed.protocol))return secureJson({error:"نوع الرابط غير مسموح."},{status:400});
  if(body.sourceUrl.length>2048||(body.reportType?.length||0)>80||(body.notes?.length||0)>2000)return secureJson({error:"البيانات أطول من الحد المسموح."},{status:400});
  const id=crypto.randomUUID();await getDb().insert(reports).values({id,userId,searchId:body.searchId||null,sourceUrl:body.sourceUrl,reportType:body.reportType,notes:body.notes||null,createdAt:new Date()});
  return Response.json({caseId:`CASE-${id.slice(0,8).toUpperCase()}`},{status:201});
}
export async function GET(){
  const userId=await requestUserId();if(!userId)return Response.json({reports:[]});
  const { desc, eq }=await import("drizzle-orm");const rows=await getDb().select().from(reports).where(eq(reports.userId,userId)).orderBy(desc(reports.createdAt)).limit(20);
  return Response.json({reports:rows});
}
