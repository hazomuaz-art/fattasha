import { headers } from "next/headers";
export async function requestUserId(){
  const h=await headers();const signedIn=h.get("oai-authenticated-user-id");if(signedIn)return `user:${signedIn}`;
  const visitor=h.get("x-athar-visitor")||"";return /^[a-f0-9-]{20,64}$/i.test(visitor)?`anon:${visitor}`:null;
}
