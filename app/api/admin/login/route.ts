import { createAdminSession, validAdminCredentials } from "@/lib/admin-auth";
import { rateLimit, sameOrigin, secureJson } from "@/lib/security";
export async function POST(request:Request){
  if(!sameOrigin(request))return secureJson({error:"طلب غير موثوق."},{status:403});
  const retry=rateLimit(request,"admin-login",5);if(retry)return secureJson({error:"تم إيقاف المحاولات مؤقتًا."},{status:429,headers:{"retry-after":String(retry)}});
  const body=await request.json() as {username?:string;password?:string};if(!body.username||!body.password||!(await validAdminCredentials(body.username,body.password)))return secureJson({error:"بيانات الدخول غير صحيحة."},{status:401});
  await createAdminSession();return secureJson({ok:true});
}
