import { cookies } from "next/headers";
import { facebookSettings, safeVisitor, signState } from "@/lib/facebook-auth";

export async function GET(request:Request){
  const {searchParams}=new URL(request.url);const visitor=safeVisitor(searchParams.get("visitor"));
  if(!visitor)return Response.redirect(new URL("/?facebook=invalid",request.url));
  const nonce=crypto.randomUUID();const value=`${nonce}.${Date.now()}.${visitor}`;const state=`${value}.${await signState(value)}`;
  (await cookies()).set("fattasha_fb_state",state,{httpOnly:true,secure:true,sameSite:"lax",path:"/",maxAge:600});
  const {appId}=facebookSettings();const target=new URL("https://www.facebook.com/v23.0/dialog/oauth");
  target.search=new URLSearchParams({client_id:appId,redirect_uri:"https://fattasha.vercel.app/api/auth/facebook/callback",state,scope:"public_profile,user_link",response_type:"code"}).toString();
  return Response.redirect(target);
}
