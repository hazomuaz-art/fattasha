export function requestDetails(request:Request){
  const h=request.headers;const userAgent=(h.get("user-agent")||"غير معروف").slice(0,500);
  const ipAddress=(h.get("cf-connecting-ip")||h.get("x-real-ip")||h.get("x-forwarded-for")?.split(",")[0]?.trim()||"غير متاح").slice(0,80);
  const deviceType=/ipad|tablet/i.test(userAgent)?"جهاز لوحي":/mobile|android|iphone/i.test(userAgent)?"هاتف":"حاسوب";
  const operatingSystem=/iphone|ipad/i.test(userAgent)?"iOS":/android/i.test(userAgent)?"Android":/windows/i.test(userAgent)?"Windows":/mac os|macintosh/i.test(userAgent)?"macOS":/linux/i.test(userAgent)?"Linux":"غير معروف";
  const browser=/edg\//i.test(userAgent)?"Edge":/opr\//i.test(userAgent)?"Opera":/chrome\//i.test(userAgent)?"Chrome":/firefox\//i.test(userAgent)?"Firefox":/safari\//i.test(userAgent)?"Safari":"غير معروف";
  return {ipAddress,country:(h.get("cf-ipcountry")||"غير متاح").slice(0,80),region:(h.get("cf-region")||h.get("cf-region-code")||"غير متاح").slice(0,120),city:(h.get("cf-ipcity")||"غير متاح").slice(0,120),userAgent,deviceType,operatingSystem,browser};
}
