import { env } from "cloudflare:workers";

const encoder=new TextEncoder();
function settings(){const e=env as unknown as Record<string,string>;return {appId:e.FACEBOOK_APP_ID,appSecret:e.FACEBOOK_APP_SECRET,stateSecret:e.FACEBOOK_OAUTH_STATE_SECRET}}
function hex(bytes:ArrayBuffer){return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,"0")).join("")}
export async function signState(value:string){const {stateSecret}=settings();const key=await crypto.subtle.importKey("raw",encoder.encode(stateSecret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);return hex(await crypto.subtle.sign("HMAC",key,encoder.encode(value)))}
export function facebookSettings(){return settings()}
export function safeVisitor(value:string|null){return value&&/^[a-f0-9-]{20,64}$/i.test(value)?`anon:${value}`:null}
