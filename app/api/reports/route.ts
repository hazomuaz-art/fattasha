import { headers } from "next/headers";
import { getDb } from "@/db";
import { reports } from "@/db/schema";
export async function POST(request:Request){
  const h=await headers();const userId=h.get("oai-authenticated-user-id")||"local-preview-user";
  const body=await request.json() as {searchId?:string;sourceUrl?:string;reportType?:string;notes?:string};
  if(!body.sourceUrl||!body.reportType)return Response.json({error:"الرابط ونوع البلاغ مطلوبان."},{status:400});
  try{new URL(body.sourceUrl)}catch{return Response.json({error:"الرابط غير صالح."},{status:400})}
  const id=crypto.randomUUID();await getDb().insert(reports).values({id,userId,searchId:body.searchId||null,sourceUrl:body.sourceUrl,reportType:body.reportType,notes:body.notes||null,createdAt:new Date()});
  return Response.json({caseId:`CASE-${id.slice(0,8).toUpperCase()}`},{status:201});
}
