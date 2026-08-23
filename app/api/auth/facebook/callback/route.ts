import { cookies } from "next/headers";
import { getDb } from "@/db";
import { facebookUsers } from "@/db/schema";
import { facebookSettings, signState } from "@/lib/facebook-auth";

export async function GET(request:Request){
  const url=new URL(request.url);const state=url.searchParams.get("state")||"";const code=url.searchParams.get("code")||"";const jar=await cookies();const expected=jar.get("fattasha_fb_state")?.value||"";jar.delete("fattasha_fb_state");
  const parts=state.split(".");const signature=parts.pop()||"";const value=parts.join(".");const visitor=parts.slice(2).join(".");
  if(!code||state!==expected||signature!==await signState(value)||!visitor.startsWith("anon:"))return Response.redirect(new URL("/?facebook=failed",request.url));
  const {appId,appSecret}=facebookSettings();const tokenUrl=new URL("https://graph.facebook.com/v23.0/oauth/access_token");tokenUrl.search=new URLSearchParams({client_id:appId,client_secret:appSecret,redirect_uri:"https://fattasha.vercel.app/api/auth/facebook/callback",code}).toString();
  const tokenResponse=await fetch(tokenUrl,{cache:"no-store"});const token=await tokenResponse.json() as {access_token?:string};if(!token.access_token)return Response.redirect(new URL("/?facebook=failed",request.url));
  const profileResponse=await fetch(`https://graph.facebook.com/v23.0/me?fields=id,name,link&access_token=${encodeURIComponent(token.access_token)}`,{cache:"no-store"});const profile=await profileResponse.json() as {id?:string;name?:string;link?:string};if(!profile.id||!profile.name)return Response.redirect(new URL("/?facebook=failed",request.url));
  const profileLink=profile.link?.startsWith("https://www.facebook.com/")?profile.link:null;const now=new Date();await getDb().insert(facebookUsers).values({facebookId:profile.id,name:profile.name,profileLink,userId:visitor,createdAt:now,lastLoginAt:now}).onConflictDoUpdate({target:facebookUsers.facebookId,set:{name:profile.name,profileLink,userId:visitor,lastLoginAt:now}});
  jar.set("fattasha_fb_name",encodeURIComponent(profile.name),{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:30*24*60*60});
  return Response.redirect(new URL("/?facebook=connected",request.url));
}
