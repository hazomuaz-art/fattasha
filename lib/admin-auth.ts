import { env } from "cloudflare:workers";
import { cookies } from "next/headers";

const encoder=new TextEncoder();
function bytesToHex(bytes:ArrayBuffer){return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,"0")).join("")}
async function hmac(value:string){const key=await crypto.subtle.importKey("raw",encoder.encode(env.ADMIN_SESSION_SECRET),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return bytesToHex(await crypto.subtle.sign("HMAC",key,encoder.encode(value)))}
export async function passwordHash(password:string){const digest=await crypto.subtle.digest("SHA-256",encoder.encode(`${env.ADMIN_PASSWORD_SALT}:${password}`));return bytesToHex(digest)}
export async function validAdminCredentials(username:string,password:string){
  const supplied=await passwordHash(password);const expected=env.ADMIN_PASSWORD_HASH||"";
  if(username!==env.ADMIN_USERNAME||supplied.length!==expected.length)return false;
  let mismatch=0;for(let i=0;i<supplied.length;i++)mismatch|=supplied.charCodeAt(i)^expected.charCodeAt(i);return mismatch===0;
}
export async function createAdminSession(){const exp=Date.now()+8*60*60*1000;const value=`${exp}.${await hmac(String(exp))}`;const jar=await cookies();jar.set("fattasha_admin",value,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:8*60*60})}
export async function isAdmin(){const value=(await cookies()).get("fattasha_admin")?.value||"";const [exp,signature]=value.split(".");if(!exp||!signature||Number(exp)<Date.now())return false;const expected=await hmac(exp);if(signature.length!==expected.length)return false;let mismatch=0;for(let i=0;i<signature.length;i++)mismatch|=signature.charCodeAt(i)^expected.charCodeAt(i);return mismatch===0}
export async function clearAdminSession(){(await cookies()).delete("fattasha_admin")}
