"use client";
import { useEffect,useState } from "react";
type Search={id:string;filename:string;sha256:string;searchedSources:number;availableSources:number;createdAt:string};
type Report={id:string;reportType:string;sourceUrl:string;status:string;createdAt:string};
function visitorHeader(){let id=localStorage.getItem("athar-visitor-id");if(!id){id=crypto.randomUUID();localStorage.setItem("athar-visitor-id",id)}return {"x-athar-visitor":id}}
export default function Dashboard(){
  const [history,setHistory]=useState<Search[]>([]);const [cases,setCases]=useState<Report[]>([]);const [loading,setLoading]=useState(true);
  useEffect(()=>{const headers=visitorHeader();Promise.all([fetch("/api/search",{headers}).then(r=>r.json()),fetch("/api/reports",{headers}).then(r=>r.json())]).then(([a,b])=>{setHistory(a.history||[]);setCases(b.reports||[])}).finally(()=>setLoading(false))},[]);
  return <main className="dash"><header><a className="brand" href="/"><span className="brandMark"><i/><i/><i/></span><span>أثــر</span></a><a className="secondary" href="/">بحث جديد</a></header>
    <section className="dashHero"><div><small>مساحتك الخاصة على هذا الجهاز</small><h1>لوحة التحكم</h1><p>سجل الصور والبصمات والبلاغات محفوظ بمعرّف مجهول مستقل.</p></div><div className="dashStats"><article><strong>{history.length}</strong><span>صورة مسجلة</span></article><article><strong>{cases.length}</strong><span>بلاغ محفوظ</span></article></div></section>
    <section className="dashSection"><h2>سجل البحث والملكية</h2>{loading?<div className="empty">جارٍ تحميل السجل…</div>:history.length?<div className="historyTable">{history.map(item=><article key={item.id}><div className="recordIcon">⌁</div><div><b>{item.filename}</b><small dir="ltr">ATH-{item.id.slice(0,8).toUpperCase()}</small></div><code dir="ltr">{item.sha256.slice(0,18)}…</code><span>{item.availableSources}/{item.searchedSources} مصادر</span><time>{new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(new Date(item.createdAt))}</time></article>)}</div>:<div className="empty">لا توجد عمليات بحث محفوظة بعد.</div>}</section>
    <section className="dashSection"><h2>البلاغات</h2>{cases.length?<div className="historyTable">{cases.map(item=><article key={item.id}><div className="recordIcon">!</div><div><b>{item.reportType}</b><small dir="ltr">CASE-{item.id.slice(0,8).toUpperCase()}</small></div><a href={item.sourceUrl} target="_blank">فتح الرابط</a><span>{item.status==="open"?"مفتوح":item.status}</span><time>{new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(new Date(item.createdAt))}</time></article>)}</div>:!loading&&<div className="empty">لا توجد بلاغات محفوظة.</div>}</section>
  </main>
}
