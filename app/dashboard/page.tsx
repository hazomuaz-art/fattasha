import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { reports, searches } from "@/db/schema";

export const dynamic="force-dynamic";
export default async function Dashboard(){
  const h=await headers();const userId=h.get("oai-authenticated-user-id")||"local-preview-user";const db=getDb();
  const [history,cases]=await Promise.all([
    db.select().from(searches).where(eq(searches.userId,userId)).orderBy(desc(searches.createdAt)).limit(20),
    db.select().from(reports).where(eq(reports.userId,userId)).orderBy(desc(reports.createdAt)).limit(20),
  ]);
  return <main className="dash"><header><a className="brand" href="/"><span className="brandMark"><i/><i/><i/></span><span>أثــر</span></a><a className="secondary" href="/">بحث جديد</a></header>
    <section className="dashHero"><div><small>مساحتك الخاصة</small><h1>لوحة التحكم</h1><p>سجل الصور والبصمات والبلاغات المرتبطة بحسابك.</p></div><div className="dashStats"><article><strong>{history.length}</strong><span>صورة مسجلة</span></article><article><strong>{cases.length}</strong><span>بلاغ محفوظ</span></article></div></section>
    <section className="dashSection"><h2>سجل البحث والملكية</h2>{history.length?<div className="historyTable">{history.map(item=><article key={item.id}><div className="recordIcon">⌁</div><div><b>{item.filename}</b><small dir="ltr">ATH-{item.id.slice(0,8).toUpperCase()}</small></div><code dir="ltr">{item.sha256.slice(0,18)}…</code><span>{item.availableSources}/{item.searchedSources} مصادر</span><time>{new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium",timeStyle:"short"}).format(item.createdAt)}</time></article>)}</div>:<div className="empty">لا توجد عمليات بحث محفوظة بعد.</div>}</section>
    <section className="dashSection"><h2>البلاغات</h2>{cases.length?<div className="historyTable">{cases.map(item=><article key={item.id}><div className="recordIcon">!</div><div><b>{item.reportType}</b><small dir="ltr">CASE-{item.id.slice(0,8).toUpperCase()}</small></div><a href={item.sourceUrl} target="_blank">فتح الرابط</a><span>{item.status==="open"?"مفتوح":item.status}</span><time>{new Intl.DateTimeFormat("ar-SA",{dateStyle:"medium"}).format(item.createdAt)}</time></article>)}</div>:<div className="empty">لا توجد بلاغات محفوظة.</div>}</section>
  </main>
}
