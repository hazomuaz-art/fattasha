"use client";
import { useEffect, useRef, useState } from "react";

type Match={platform:string;title:string;pageUrl:string;similarity:number;matchType:string};
type Source={id:string;name:string;mode:"automatic"|"launcher"|"manual";status:"completed"|"no_matches"|"launcher"|"unavailable";searched:boolean;resultUrl?:string;detail:string;durationMs:number;loginRequired?:boolean;imageSearch?:boolean};
type SearchResponse={search:{id:string;assetId:string;sha256:string;width:number;height:number;createdAt:string};sources:Source[];matches:Match[]};
function visitorHeader(){let id=localStorage.getItem("athar-visitor-id");if(!id){id=crypto.randomUUID();localStorage.setItem("athar-visitor-id",id)}return {"x-athar-visitor":id}}

export default function Home(){
  const inputRef=useRef<HTMLInputElement>(null); const [dragging,setDragging]=useState(false);
  const [file,setFile]=useState<File|null>(null); const [preview,setPreview]=useState("");
  const [phase,setPhase]=useState<"idle"|"analyzing"|"searching"|"done"|"error">("idle");
  const [data,setData]=useState<SearchResponse|null>(null); const [error,setError]=useState("");
  const [reminder,setReminder]=useState("");
  const [notificationPrompt,setNotificationPrompt]=useState(false);const [notificationMessage,setNotificationMessage]=useState("");
  useEffect(()=>{const messages=["اللهم صلِّ وسلم على نبينا محمد","سبحان الله وبحمده","لا حول ولا قوة إلا بالله","أستغفر الله العظيم"];let index=0;const show=()=>{setReminder(messages[index++%messages.length]);setTimeout(()=>setReminder(""),6500)};const timer=setInterval(show,30000);return()=>clearInterval(timer)},[]);
  useEffect(()=>{if(!("serviceWorker" in navigator)||!("Notification" in window))return;navigator.serviceWorker.register("/notification-sw.js").then(async registration=>{const last=Number(localStorage.getItem("fattasha-reminder-shown")||0);if(Notification.permission==="granted"&&Date.now()-last>24*60*60*1000){await registration.showNotification("فتّاشة — حان وقت إعادة الفحص",{body:"أعد رفع صورتك لإجراء بحث جديد والتحقق من ظهور نسخ حديثة عبر المصادر ومحركات البحث المتاحة.",icon:"/favicon.svg",badge:"/favicon.svg",tag:"fattasha-recheck",data:{url:"/"}});localStorage.setItem("fattasha-reminder-shown",String(Date.now()))}else if(Notification.permission==="default")setNotificationPrompt(true)}).catch(()=>{});},[]);
  async function enableNotifications(){if(!("Notification" in window)){setNotificationMessage("متصفحك لا يدعم إشعارات الموقع.");return}const permission=await Notification.requestPermission();if(permission!=="granted"){setNotificationMessage("لم يتم السماح بالإشعارات. يمكنك تغيير الإذن من إعدادات المتصفح.");return}const registration=await navigator.serviceWorker.ready;await registration.showNotification("تم تفعيل تنبيهات فتّاشة",{body:"سنذكّرك بإعادة فحص صورتك عند عودتك إلى الموقع.",icon:"/favicon.svg",badge:"/favicon.svg",tag:"fattasha-enabled",data:{url:"/"}});localStorage.setItem("fattasha-reminder-shown",String(Date.now()));setNotificationPrompt(false);setNotificationMessage("تم تفعيل إشعارات إعادة الفحص.")}

  function choose(next?:File){
    if(!next)return; if(!["image/jpeg","image/png","image/webp"].includes(next.type)||next.size>10*1024*1024){setError("اختر صورة JPG أو PNG أو WEBP بحجم لا يتجاوز 10 ميجابايت.");setPhase("error");return}
    if(preview)URL.revokeObjectURL(preview);setFile(next);setPreview(URL.createObjectURL(next));setData(null);setError("");setPhase("idle");
  }
  async function start(){
    if(!file)return; setPhase("analyzing");setError("");
    try{
      const dimensions=await new Promise<{width:number;height:number}>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve({width:image.naturalWidth,height:image.naturalHeight});image.onerror=reject;image.src=preview});
      setPhase("searching"); const form=new FormData();form.append("image",file);form.append("width",String(dimensions.width));form.append("height",String(dimensions.height));
      const response=await fetch("/api/search",{method:"POST",body:form,headers:visitorHeader()});const payload=await response.json() as SearchResponse&{error?:string};
      if(!response.ok)throw new Error(payload.error||"تعذّر إكمال البحث.");setData(payload);setPhase("done");
    }catch(e){setError(e instanceof Error?e.message:"تعذّر إكمال البحث.");setPhase("error")}
  }
  function reset(){setFile(null);if(preview)URL.revokeObjectURL(preview);setPreview("");setData(null);setError("");setPhase("idle")}
  const busy=phase==="analyzing"||phase==="searching";

  return <main className="shell">
    <nav className="nav" aria-label="التنقل الرئيسي">
      <a className="brand" href="#" onClick={reset}><BrandLogo/><span>فتّاشة</span></a>
      <div className="navLinks"><a href="/dashboard">السجل</a><a href="#how">المصادر</a><a href="#privacy">الخصوصية</a><span className="liveBadge"><i/> الخدمة تعمل</span><button className="lang" type="button" aria-label="Switch to English">EN</button></div>
    </nav>

    {!data&&<section className="hero" aria-labelledby="hero-title">
      <div className="heroIntro"><div className="eyebrow">فتّاشة — بحث بصري ذكي</div>
      <h1 id="hero-title">فتّش عن صورتك<br/><em>في ثوانٍ</em></h1>
      <p className="lead">ارفع صورة واحدة. نفحص التطابقات المتاحة، ونجهّزها للبحث في المحركات الأخرى، ثم نعرض الفرق بوضوح بين النتيجة المؤكدة والرابط الخارجي.</p></div>
      {!file?<section className={`uploadCard ${dragging?"dragging":""}`} aria-label="رفع صورة للبحث" onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);choose(e.dataTransfer.files[0])}}>
        <div className="uploadIcon" aria-hidden="true"><span>↑</span></div><h2>ضع الصورة هنا</h2><p>JPG أو PNG أو WEBP — حتى 10 ميجابايت</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>choose(e.target.files?.[0])}/>
        <button className="primary" type="button" onClick={()=>inputRef.current?.click()}>اختيار صورة <span aria-hidden="true">←</span></button>
        <div className="formats"><span>JPG</span><span>PNG</span><span>WEBP</span></div>
      </section>:<section className="confirmCard">
        <img src={preview} alt="معاينة الصورة المختارة"/><div className="fileInfo"><small>الصورة المختارة</small><b>{file.name}</b><span>{(file.size/1024/1024).toFixed(2)} MB</span></div>
        <button className="removeBtn" onClick={reset} aria-label="إزالة الصورة">×</button>
        <button className="primary searchBtn" onClick={start} disabled={busy}>{busy?"جارٍ التنفيذ…":"ابدأ البحث الحقيقي"} <span>←</span></button>
      </section>}
      <p className="securityPurpose">لأغراض تشغيل البحث والحماية من إساءة الاستخدام.</p>
      {busy&&<div className="progressPanel" role="status" aria-live="polite"><div className="spinner"/><div><b>{phase==="analyzing"?"تحليل الصورة وإنشاء البصمة…":"البحث بالتوازي في المصادر المتاحة…"}</b><p>لن تظهر أي نتيجة قبل أن يعيد المصدر رابطًا فعليًا.</p></div></div>}
      {phase==="error"&&<div className="errorBox" role="alert">{error}</div>}
      <div className="trustRow" id="privacy"><div><span className="trustIcon">01</span><p><b>نتائج موثقة</b><small>الرابط يأتي من المصدر</small></p></div><div><span className="trustIcon">02</span><p><b>بيانات وصور محمية</b><small>تشفير أثناء النقل والتخزين مع بصمة SHA-256</small></p></div><div><span className="trustIcon">03</span><p><b>صورك ليست عامة</b><small>رابط البحث ينتهي بعد 30 دقيقة</small></p></div></div>
    </section>}

    {data&&<Results data={data} preview={preview} onReset={reset}/>}
    <section className="sourceStrip" id="how"><span>المصادر التي تساعدك فتّاشة في الوصول إليها</span><div className="platformRail">{["google-lens","tineye","yandex","iqdb","pinterest","facebook","instagram","x","tiktok","youtube"].map(id=><PlatformIcon key={id} id={id}/>)}</div></section>
    <aside className="creatorCard"><img src="/facebook-profile.jpg" alt="لقطة حساب حذيفة على فيسبوك"/><div><small>صُنعت بحب بواسطة</small><b>Huzifa Muaz Ahmed</b><span>تابعني على منصة فيسبوك</span></div><a href="/f" target="_blank" rel="noreferrer" aria-label="متابعة حذيفة على فيسبوك">متابعة <span>f</span></a></aside>
    {notificationPrompt&&<aside className="notificationPrompt" role="dialog" aria-labelledby="notification-title"><button className="notificationClose" onClick={()=>setNotificationPrompt(false)} aria-label="إغلاق">×</button><span className="notificationBell" aria-hidden="true">♢</span><div><b id="notification-title">هل تريد تنبيه إعادة الفحص؟</b><p>فعّل إشعارات الهاتف لتذكيرك بإعادة رفع صورتك والتحقق من ظهور نسخ حديثة عبر المصادر المتاحة.</p></div><button className="notificationEnable" onClick={enableNotifications}>تفعيل الإشعارات</button></aside>}
    {notificationMessage&&<div className="notificationMessage" role="status">{notificationMessage}<button onClick={()=>setNotificationMessage("")} aria-label="إغلاق">×</button></div>}
    {reminder&&<div className="reminderToast" role="status" aria-live="polite"><span>✦</span>{reminder}<button onClick={()=>setReminder("")} aria-label="إغلاق التذكير">×</button></div>}
  </main>
}

function BrandLogo(){return <svg className="brandLogo" viewBox="0 0 48 48" aria-hidden="true"><circle cx="20" cy="20" r="12"/><path d="m29 29 10 10M15 16h10M15 21h7M15 26h5"/><circle cx="35" cy="12" r="3"/></svg>}
const platformLabels:Record<string,string>={"google-lens":"G","tineye":"T","yandex":"Y","iqdb":"IQ","pinterest":"P","facebook":"f","instagram":"◎","x":"X","tiktok":"♪","youtube":"▶","saucenao":"S","trace-moe":"⌁","bing":"B","reddit":"R","telegram":"T"};
function PlatformIcon({id}:{id:string}){return <span className={`platformIcon ${id}`} title={id.replace("-"," ")} aria-label={id.replace("-"," ")}>{platformLabels[id]||id[0]}</span>}

function Results({data,preview,onReset}:{data:SearchResponse;preview:string;onReset:()=>void}){
  const automated=data.sources.filter(s=>s.searched);const launchers=data.sources.filter(s=>s.mode==="launcher");
  return <section className="resultsWrap">
    <header className="resultsHeader"><div><span className="successDot">✓</span><div><small>اكتملت جولة البحث</small><h1>تقرير فتّاشة</h1></div></div><button className="secondary" onClick={onReset}>بحث بصورة أخرى</button></header>
    <div className="summaryGrid"><article className="assetCard"><img src={preview} alt="الصورة التي جرى البحث عنها"/><div><small>معرّف الأصل</small><b dir="ltr">{data.search.assetId}</b><span>{data.search.width} × {data.search.height}</span></div></article>
      <article><strong>{automated.length}</strong><span>مصادر بُحثت تلقائيًا</span></article><article><strong>{data.matches.length}</strong><span>تطابقات قابلة للتحقق</span></article><article><strong>{launchers.length}</strong><span>محركات مهيأة بالصورة</span></article></div>
    <div className="truthNotice"><b>الفرق مهم</b><p>نتائج SauceNAO أدناه من بحث فعلي ويمكن فتح مصادرها. أما Google وTinEye وYandex وغيرها فهي روابط مهيأة بالصورة لإكمال البحث في موقع المصدر، ولا نحسبها كتطابقات.</p></div>
    <div className="sectionTitle"><div><h2>التطابقات المؤكدة</h2><p>نعرض فقط نتائج بنسبة تشابه 70٪ فأعلى وروابط مصدر قابلة للفتح.</p></div><span>{data.matches.length} نتائج</span></div>
    {data.matches.length?<div className="sourceCards">{data.matches.map((match,index)=><article className="sourceCard" key={match.pageUrl}><div className="sourceTop"><div className="sourceLogo">{index+1}</div><div><h3>{match.title}</h3><span className="status ok">{match.platform} · {match.similarity.toFixed(2)}٪</span></div></div><p>{match.matchType} — تحقّق بصريًا من المصدر قبل اتخاذ أي إجراء.</p><a className="openResult" href={match.pageUrl} target="_blank" rel="noreferrer">فتح المصدر الأصلي <span>↗</span></a></article>)}</div>:<div className="empty">لم يظهر تطابق موثوق في المصدر الآلي لهذه الصورة. يمكنك متابعة البحث عبر المحركات المهيأة أدناه.</div>}
    <div className="sectionTitle"><div><h2>المصادر وحالة الوصول</h2><p>لا نعرض مصدرًا على أنه ناجح إن لم يُرجع رابطًا يمكن فتحه.</p></div><span>{data.sources.length} موصلات</span></div>
    <div className="sourceCards">{data.sources.map(source=><article className="sourceCard" key={source.id}><div className="sourceTop"><div className="sourceLogo"><PlatformIcon id={source.id}/></div><div><h3>{source.name}</h3><span className={source.status==="completed"?"status ok":source.status==="unavailable"?"status bad":"status"}>{source.status==="completed"?"تم البحث ووجد تطابقات":source.status==="no_matches"?"تم البحث — لا تطابق موثوق":source.status==="unavailable"?"تعذّر البحث":"جاهز للفتح في المصدر"}</span></div></div><p>{source.detail}</p>{source.resultUrl&&<a className="openResult" href={source.resultUrl} target="_blank" rel="noreferrer">{source.loginRequired?(source.imageSearch?"فتح البحث البصري":"تسجيل الدخول والبحث اليدوي"):source.id==="bing"?"فتح المصدر ورفع الصورة":"فتح البحث المهيأ بالصورة"} <span>↗</span></a>}</article>)}</div>
    <article className="fingerprint"><div><small>البصمة الرقمية SHA-256</small><code dir="ltr">{data.search.sha256}</code></div><button onClick={()=>navigator.clipboard.writeText(data.search.sha256)}>نسخ البصمة</button></article>
    <ReportForm searchId={data.search.id}/>
  </section>
}

function ReportForm({searchId}:{searchId:string}){
  const [open,setOpen]=useState(false);const [message,setMessage]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setMessage("جارٍ الحفظ…");const response=await fetch("/api/reports",{method:"POST",headers:{"content-type":"application/json",...visitorHeader()},body:JSON.stringify({searchId,sourceUrl:form.get("sourceUrl"),reportType:form.get("reportType"),notes:form.get("notes")})});const payload=await response.json() as {caseId?:string;error?:string};setMessage(response.ok?`تم إنشاء البلاغ: ${payload.caseId}`:payload.error||"تعذّر الحفظ")}
  return <section className="reportBox"><div><h2>وجدت استخدامًا غير مصرح به؟</h2><p>سجّل الرابط كحالة مرتبطة ببصمة هذه الصورة.</p></div>{!open?<button className="secondary" onClick={()=>setOpen(true)}>إنشاء بلاغ</button>:<form onSubmit={submit}><input name="sourceUrl" type="url" required placeholder="https://example.com/photo"/><select name="reportType" required defaultValue="سرقة صورة"><option>سرقة صورة</option><option>انتحال شخصية</option><option>استخدام بدون إذن</option><option>حساب مزيف</option><option>استخدام تجاري</option><option>نشر مسيء</option><option>إساءة أخرى</option></select><input name="notes" placeholder="ملاحظات اختيارية"/><button className="primary" type="submit">حفظ البلاغ</button>{message&&<span className="formMessage">{message}</span>}</form>}</section>
}
