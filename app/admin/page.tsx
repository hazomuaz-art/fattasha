import { count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { facebookUsers, searches } from "@/db/schema";
import { isAdmin } from "@/lib/admin-auth";
import { AdminAutoRefresh } from "./auto-refresh";

export const dynamic="force-dynamic";
type Props={searchParams:Promise<{page?:string;all?:string}>};

export default async function Admin({searchParams}:Props){
  if(!(await isAdmin()))redirect("/admin/login");
  const params=await searchParams;const showAll=params.all==="1";const page=Math.max(1,Number.parseInt(params.page||"1",10)||1);const pageSize=100;
  const db=getDb();const baseRows=db.select({search:searches,facebookName:facebookUsers.name,facebookId:facebookUsers.facebookId,profileLink:facebookUsers.profileLink}).from(searches).leftJoin(facebookUsers,eq(searches.userId,facebookUsers.userId)).orderBy(desc(searches.createdAt));
  const rowsQuery=showAll?baseRows:baseRows.limit(pageSize).offset((page-1)*pageSize);
  const [rows,totalResult,sourceResult,technicalResult]=await Promise.all([rowsQuery,db.select({value:count()}).from(searches),db.select({value:sql<number>`coalesce(sum(${searches.searchedSources}), 0)`}).from(searches),db.select({value:count()}).from(searches).where(isNotNull(searches.ipAddress))]);
  const total=totalResult[0]?.value||0;const totalSources=Number(sourceResult[0]?.value||0);const technicalCount=technicalResult[0]?.value||0;const pages=Math.max(1,Math.ceil(total/pageSize));
  return <main className="adminShell"><header><div><small>لوحة خاصة · <AdminAutoRefresh/></small><h1>إدارة فتّاشة</h1></div><form action="/api/admin/logout" method="post"><button className="secondary">تسجيل الخروج</button></form></header>
    <section className="adminStats"><article><b>{total}</b><span>إجمالي عمليات البحث</span></article><article><b>{totalSources}</b><span>إجمالي فحوصات المصادر</span></article><article><b>{technicalCount}</b><span>عمليات ببيانات تقنية</span></article></section>
    <section className="adminTable"><div className="adminTableTitle"><h2>{showAll?`كل العمليات (${total})`:`العمليات ${Math.min((page-1)*pageSize+1,total)}–${Math.min(page*pageSize,total)} من ${total}`}</h2><a href={showAll?"/admin":"/admin?all=1"}>{showAll?"عرض على صفحات":"عرض كل العمليات"}</a></div>
      <div className="adminGrid">{rows.map(({search:row,facebookName,facebookId,profileLink})=><article key={row.id}><a className="adminThumb" href={`/api/admin/image/${row.id}`} target="_blank" rel="noreferrer" title="فتح الصورة بالحجم الكامل"><img src={`/api/admin/image/${row.id}`} alt="الصورة المرفوعة"/></a><div><b>{row.filename}</b><span dir="ltr">{row.userId}</span>{facebookName&&<><strong>{facebookName}</strong><small dir="ltr">Facebook ID: {facebookId}</small>{profileLink?<a href={profileLink} target="_blank" rel="noreferrer">فتح صفحة فيسبوك</a>:null}</>}<small>{row.createdAt.toLocaleString("ar-SA")}</small><small>{(row.byteSize/1024/1024).toFixed(2)} MB · {row.contentType}</small><section className="technicalDetails"><small dir="ltr">IP: {row.ipAddress||"غير محفوظ — عملية قديمة"}</small><small>الموقع التقريبي: {[row.city,row.region,row.country].filter(Boolean).join("، ")||"غير متاح"}</small><small>الجهاز: {row.deviceType||"غير متاح"} · {row.operatingSystem||"غير متاح"} · {row.browser||"غير متاح"}</small><small dir="ltr" title={row.userAgent||""}>User-Agent: {row.userAgent||"غير متاح"}</small></section><nav className="adminImageActions" aria-label={`إجراءات ${row.filename}`}><a href={`/api/admin/image/${row.id}`} target="_blank" rel="noreferrer">فتح الصورة</a><a href={`/api/admin/image/${row.id}?download=1`} download>حفظ الصورة</a></nav></div></article>)}</div>
      {!showAll&&pages>1&&<nav className="adminPagination" aria-label="صفحات العمليات"><a className={page<=1?"disabled":""} href={page>1?`/admin?page=${page-1}`:"/admin?page=1"}>السابق</a><span>صفحة {page} من {pages}</span><a className={page>=pages?"disabled":""} href={page<pages?`/admin?page=${page+1}`:`/admin?page=${pages}`}>التالي</a></nav>}
    </section></main>
}
