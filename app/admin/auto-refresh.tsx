"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminAutoRefresh(){const router=useRouter();useEffect(()=>{const timer=setInterval(()=>router.refresh(),10_000);return()=>clearInterval(timer)},[router]);return <span className="adminRefresh" title="تتحدث تلقائيًا كل 10 ثوانٍ">● تحديث تلقائي</span>}
