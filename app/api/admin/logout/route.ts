import { clearAdminSession } from "@/lib/admin-auth";
import { sameOrigin, secureJson } from "@/lib/security";
export async function POST(request:Request){if(!sameOrigin(request))return secureJson({error:"طلب غير موثوق."},{status:403});await clearAdminSession();return secureJson({ok:true})}
