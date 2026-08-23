export type MatchResult={platform:string;title:string;pageUrl:string;similarity:number;matchType:string};
export type ConnectorResult={id:string;name:string;mode:"automatic"|"launcher"|"manual";status:"completed"|"no_matches"|"launcher"|"unavailable";searched:boolean;resultUrl?:string;detail:string;durationMs:number;matches?:MatchResult[];loginRequired?:boolean;imageSearch?:boolean};

function decode(value:string){return value.replace(/<[^>]*>/g,"").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;|&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").trim()}
function absolute(value:string){try{return new URL(decode(value),"https://saucenao.com").toString()}catch{return ""}}
function unsafeTitle(value:string){return /\b(penis|porn|hentai|nude|sex|xxx)\b/i.test(value)}

async function sauceNao(image:Blob,filename:string):Promise<ConnectorResult>{
  const started=Date.now();
  try{
    const form=new FormData();form.append("file",image,filename);form.append("db","999");
    const response=await fetch("https://saucenao.com/search.php",{method:"POST",body:form,headers:{"user-agent":"Mozilla/5.0 AtharImageTrace/1.0"}});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const html=await response.text();const blocks=html.match(/<div class="result"[\s\S]*?(?=<div class="result"|<div id="footer")/g)||[];
    const matches:MatchResult[]=[];const seen=new Set<string>();
    for(const block of blocks){
      const similarity=Number(block.match(/resultsimilarityinfo[^>]*>([\d.]+)%/)?.[1]||0);if(similarity<70)continue;
      const title=decode(block.match(/resulttitle[^>]*>([\s\S]*?)<\/div>/)?.[1]||"تطابق بصري");
      if(unsafeTitle(title))continue;
      const platform=decode(block.match(/title="Index #[^"]*?:\s*([^"-]+)/)?.[1]||"مصدر ويب");
      const urls=[...block.matchAll(/href="([^"]+)"/g)].map(m=>absolute(m[1])).filter(url=>url.startsWith("http")&&!new URL(url).hostname.endsWith("saucenao.com"));
      const pageUrl=urls[0];if(!pageUrl||seen.has(pageUrl))continue;seen.add(pageUrl);
      matches.push({platform,title:title||"تطابق بصري",pageUrl,similarity,matchType:similarity>=90?"تطابق قوي":"تطابق محتمل"});if(matches.length===8)break;
    }
    return {id:"saucenao",name:"SauceNAO",mode:"automatic",status:matches.length?"completed":"no_matches",searched:true,matches,durationMs:Date.now()-started,detail:matches.length?`عثر المصدر على ${matches.length} تطابقات قابلة للفتح بنسبة تشابه 70٪ فأعلى.`:"اكتمل البحث ولم يعثر المصدر على تطابق موثوق بنسبة 70٪ فأعلى."};
  }catch(e){return {id:"saucenao",name:"SauceNAO",mode:"automatic",status:"unavailable",searched:true,durationMs:Date.now()-started,detail:`تعذّر إكمال البحث الآلي في هذه المحاولة: ${e instanceof Error?e.message:"خطأ اتصال"}.`}}
}

function launcher(id:string,name:string,url:string,detail:string):ConnectorResult{return {id,name,mode:"launcher",status:"launcher",searched:false,resultUrl:url,detail,durationMs:0,imageSearch:true}}
function manual(id:string,name:string,url:string,imageSearch=false):ConnectorResult{return {id,name,mode:"manual",status:"launcher",searched:false,resultUrl:url,detail:imageSearch?"بحث بصري مجاني بعد تسجيل الدخول؛ يجب إكمال الرفع داخل المنصة.":"بحث مجاني بعد تسجيل الدخول، لكن المنصة لا توفر بحثًا عكسيًا عامًا بالصورة.",durationMs:0,loginRequired:true,imageSearch}}

export async function runConnectors(image:Blob,filename:string,publicImageUrl:string){
  const encoded=encodeURIComponent(publicImageUrl);const automatic=await sauceNao(image,filename);
  return [automatic,
    launcher("google-lens","Google Lens",`https://lens.google.com/uploadbyurl?url=${encoded}`,"رابط بحث بصري مجاني مهيأ بالصورة. يفتح Google Lens لإظهار نتائجه مباشرة للمستخدم."),
    launcher("tineye","TinEye",`https://www.tineye.com/search/?url=${encoded}`,"رابط بحث عكسي مجاني مهيأ بالصورة ويفتح نتائج TinEye."),
    launcher("yandex","Yandex Images",`https://yandex.com/images/search?rpt=imageview&url=${encoded}`,"رابط بحث بصري مجاني مهيأ بالصورة ويفتح نتائج Yandex."),
    launcher("iqdb","IQDB",`https://iqdb.org/?url=${encoded}`,"بحث عكسي مجاني مهيأ بالصورة للمصادر الفنية والرسوم."),
    launcher("trace-moe","trace.moe",`https://trace.moe/?auto&url=${encoded}`,"بحث مجاني مهيأ بالصورة للتعرّف على لقطات الأنمي."),
    launcher("bing","Bing Visual Search","https://www.bing.com/visualsearch","يفتح أداة Bing الرسمية؛ يتطلب اختيار الصورة داخل الصفحة لأن Bing لا يضمن رابط بحث دائمًا."),
    manual("pinterest","Pinterest Lens","https://www.pinterest.com/",true),manual("facebook","Facebook","https://www.facebook.com/search/photos/"),manual("instagram","Instagram","https://www.instagram.com/explore/"),manual("x","X","https://x.com/explore"),manual("tiktok","TikTok","https://www.tiktok.com/search"),manual("reddit","Reddit","https://www.reddit.com/search/"),manual("youtube","YouTube","https://www.youtube.com/results"),manual("telegram","Telegram","https://web.telegram.org/")];
}
