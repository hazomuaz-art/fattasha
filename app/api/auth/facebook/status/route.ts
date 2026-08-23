import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { facebookUsers } from "@/db/schema";
import { safeVisitor } from "@/lib/facebook-auth";

export async function GET(request:Request){const visitor=safeVisitor(new URL(request.url).searchParams.get("visitor"));if(!visitor)return Response.json({connected:false});const [user]=await getDb().select({name:facebookUsers.name,profileLink:facebookUsers.profileLink}).from(facebookUsers).where(eq(facebookUsers.userId,visitor)).limit(1);return Response.json(user?{connected:true,...user}:{connected:false},{headers:{"cache-control":"private, no-store"}})}
