"use client";
import { useRef, useState } from "react";

type Source={id:string;name:string;kind:"visual"|"manual";status:"available"|"unavailable";resultUrl?:string;detail:string;durationMs:number;loginRequired?:boolean;imageSearch?:boolean};
type SearchResponse={search:{id:string;assetId:string;sha256:string;width:number;height:number;createdAt:string};sources:Source[]};
function visitorHeader(){let id=localStorage.getItem("athar-visitor-id");if(!id){id=crypto.randomUUID();localStorage.setItem("athar-visitor-id",id)}return {"x-athar-visitor":id}}

export default function Home(){
  const inputRef=useRef<HTMLInputElement>(null); const [dragging,setDragging]=useState(false);
  const [file,setFile]=useState<File|null>(null); const [preview,setPreview]=useState("");
  const [phase,setPhase]=useState<"idle"|"analyzing"|"searching"|"done"|"error">("idle");
  const [data,setData]=useState<SearchResponse|null>(null); const [error,setError]=useState("");

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
      <a className="brand" href="#" onClick={reset}><span className="brandMark" aria-hidden="true"><i/><i/><i/></span><span>أثــر</span></a>
      <div className="navLinks"><a href="/dashboard">لوحة التحكم</a><a href="#how">كيف يعمل؟</a><a href="#privacy">الخصوصية</a><span className="liveBadge"><i/> المصادر بحالتها الفعلية</span><button className="lang" type="button" aria-label="Switch to English">EN</button></div>
    </nav>

    {!data&&<section className="hero" aria-labelledby="hero-title">
      <div className="eyebrow"><span/> بحث عكسي حقيقي متعدد المصادر</div>
      <h1 id="hero-title">اعثر على <em>أثر صورتك</em><br/>عبر الإنترنت</h1>
      <p className="lead">نحلّل الصورة وننشئ بصمتها الرقمية، ثم نرسلها فقط إلى موصلات البحث التي تدعم الرفع المباشر. المصادر الأخرى نفتحها لك بوضوح دون الادعاء بأنها بُحثت تلقائيًا.</p>
      {!file?<section className={`uploadCard ${dragging?"dragging":""}`} aria-label="رفع صورة للبحث" onDragOver={e=>{e.preventDefault();setDragging(true)}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);choose(e.dataTransfer.files[0])}}>
        <div className="uploadIcon" aria-hidden="true"><span>⌁</span></div><h2>اسحب صورتك إلى هنا</h2><p>أو اختر صورة من جهازك — حتى 10 ميجابايت</p>
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={e=>choose(e.target.files?.[0])}/>
        <button className="primary" type="button" onClick={()=>inputRef.current?.click()}>اختيار صورة <span aria-hidden="true">←</span></button>
        <div className="formats"><span>JPG</span><span>PNG</span><span>WEBP</span></div>
      </section>:<section className="confirmCard">
        <img src={preview} alt="معاينة الصورة المختارة"/><div className="fileInfo"><small>الصورة المختارة</small><b>{file.name}</b><span>{(file.size/1024/1024).toFixed(2)} MB</span></div>
        <button className="removeBtn" onClick={reset} aria-label="إزالة الصورة">×</button>
        <button className="primary searchBtn" onClick={start} disabled={busy}>{busy?"جارٍ التنفيذ…":"ابدأ البحث الحقيقي"} <span>←</span></button>
      </section>}
      {busy&&<div className="progressPanel" role="status" aria-live="polite"><div className="spinner"/><div><b>{phase==="analyzing"?"تحليل الصورة وإنشاء البصمة…":"البحث بالتوازي في المصادر المتاحة…"}</b><p>لن تظهر أي نتيجة قبل أن يعيد المصدر رابطًا فعليًا.</p></div></div>}
      {phase==="error"&&<div className="errorBox" role="alert">{error}</div>}
      <div className="trustRow" id="privacy"><div><span className="trustIcon">✓</span><p><b>لا نتائج وهمية</b><small>كل حالة مرتبطة باستجابة فعلية</small></p></div><div><span className="trustIcon">⌁</span><p><b>بصمة SHA-256</b><small>سجل ملكية مؤرّخ</small></p></div><div><span className="trustIcon">◇</span><p><b>خاص وآمن</b><small>الحذف يشمل الصورة والسجل</small></p></div></div>
    </section>}

    {data&&<Results data={data} preview={preview} onReset={reset}/>}
    <section className="sourceStrip" id="how"><span>المصادر الموصولة في هذه النسخة</span><div className="sourceNames"><b>Google Lens · تلقائي</b><b>TinEye / Yandex / Bing · رفع مباشر</b><b>Pinterest Lens · حساب مجاني</b><b>منصات اجتماعية · بحث يدوي بحساب مجاني</b></div></section>
  </main>
}

function Results({data,preview,onReset}:{data:SearchResponse;preview:string;onReset:()=>void}){
  const automated=data.sources.filter(s=>s.kind==="visual");const accountSources=data.sources.filter(s=>s.loginRequired);
  return <section className="resultsWrap">
    <header className="resultsHeader"><div><span className="successDot">✓</span><div><small>اكتملت جولة البحث</small><h1>تقرير أثر الصورة</h1></div></div><button className="secondary" onClick={onReset}>بحث بصورة أخرى</button></header>
    <div className="summaryGrid"><article className="assetCard"><img src={preview} alt="الصورة التي جرى البحث عنها"/><div><small>معرّف الأصل</small><b dir="ltr">{data.search.assetId}</b><span>{data.search.width} × {data.search.height}</span></div></article>
      <article><strong>{automated.length}</strong><span>مصادر بُحثت تلقائيًا</span></article><article><strong>{automated.filter(s=>s.status==="available").length}</strong><span>صفحات نتائج فعلية</span></article><article><strong>{accountSources.length}</strong><span>منصات بحساب مجاني</span></article></div>
    <div className="truthNotice"><b>ماذا تعني هذه الأرقام؟</b><p>صفحة النتائج تعني أن المحرك استلم الصورة وأعاد رابط بحث. لا ندّعي عدد التطابقات لأن استخراجه آليًا من صفحات المحركات قد يكون محظورًا أو غير موثوق.</p></div>
    <div className="sectionTitle"><div><h2>المصادر وحالة الوصول</h2><p>لا نعرض مصدرًا على أنه ناجح إن لم يُرجع رابطًا يمكن فتحه.</p></div><span>{data.sources.length} موصلات</span></div>
    <div className="sourceCards">{data.sources.map(source=><article className="sourceCard" key={source.id}><div className="sourceTop"><div className="sourceLogo">{source.name.slice(0,1)}</div><div><h3>{source.name}</h3><span className={source.status==="available"?"status ok":"status bad"}>{source.status==="available"?(source.kind==="visual"?"تم البحث فعليًا":source.loginRequired?"يتطلب حسابًا مجانيًا":"متاح برفع مباشر"):"المصدر غير متاح"}</span></div></div><p>{source.detail}</p>{source.resultUrl&&<a className="openResult" href={source.resultUrl} target="_blank" rel="noreferrer">{source.kind==="visual"?"فتح صفحة النتائج":source.loginRequired?(source.imageSearch?"فتح Pinterest Lens":"تسجيل الدخول والبحث اليدوي"):"فتح المصدر ورفع الصورة"} <span>↗</span></a>}</article>)}</div>
    <article className="fingerprint"><div><small>البصمة الرقمية SHA-256</small><code dir="ltr">{data.search.sha256}</code></div><button onClick={()=>navigator.clipboard.writeText(data.search.sha256)}>نسخ البصمة</button></article>
    <ReportForm searchId={data.search.id}/>
  </section>
}

function ReportForm({searchId}:{searchId:string}){
  const [open,setOpen]=useState(false);const [message,setMessage]=useState("");
  async function submit(event:React.FormEvent<HTMLFormElement>){event.preventDefault();const form=new FormData(event.currentTarget);setMessage("جارٍ الحفظ…");const response=await fetch("/api/reports",{method:"POST",headers:{"content-type":"application/json",...visitorHeader()},body:JSON.stringify({searchId,sourceUrl:form.get("sourceUrl"),reportType:form.get("reportType"),notes:form.get("notes")})});const payload=await response.json() as {caseId?:string;error?:string};setMessage(response.ok?`تم إنشاء البلاغ: ${payload.caseId}`:payload.error||"تعذّر الحفظ")}
  return <section className="reportBox"><div><h2>وجدت استخدامًا غير مصرح به؟</h2><p>سجّل الرابط كحالة مرتبطة ببصمة هذه الصورة.</p></div>{!open?<button className="secondary" onClick={()=>setOpen(true)}>إنشاء بلاغ</button>:<form onSubmit={submit}><input name="sourceUrl" type="url" required placeholder="https://example.com/photo"/><select name="reportType" required defaultValue="سرقة صورة"><option>سرقة صورة</option><option>انتحال شخصية</option><option>استخدام بدون إذن</option><option>حساب مزيف</option><option>استخدام تجاري</option><option>نشر مسيء</option><option>إساءة أخرى</option></select><input name="notes" placeholder="ملاحظات اختيارية"/><button className="primary" type="submit">حفظ البلاغ</button>{message&&<span className="formMessage">{message}</span>}</form>}</section>
}
