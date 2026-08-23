export type ConnectorResult = {
  id: string; name: string; kind: "visual" | "manual"; status: "available" | "unavailable";
  resultUrl?: string; detail: string; durationMs: number; loginRequired?: boolean; imageSearch?: boolean;
};

export interface SearchConnector {
  id: string; name: string; kind: "visual" | "manual";
  search(input: Blob, filename: string): Promise<ConnectorResult>;
}

class GoogleLensConnector implements SearchConnector {
  id = "google-lens"; name = "Google Lens"; kind = "visual" as const;
  async search(input: Blob, filename: string): Promise<ConnectorResult> {
    const started = Date.now();
    try {
      const body = new FormData();
      body.append("encoded_image", input, filename);
      body.append("processed_image_dimensions", "1024,1024");
      const response = await fetch("https://lens.google.com/v3/upload?stcs=1780000000000", {
        method: "POST", body, redirect: "manual", headers: { "user-agent": "Mozilla/5.0 Athar/1.0" },
      });
      const location = response.headers.get("location");
      if (location) {
        return { id:this.id, name:this.name, kind:this.kind, status:"available",
          resultUrl:new URL(location, "https://lens.google.com").toString(),
          detail:"أكمل المحرك البحث البصري وأعاد صفحة نتائج فعلية.", durationMs:Date.now()-started };
      }
      return { id:this.id,name:this.name,kind:this.kind,status:"unavailable",
        detail:`لم يُرجع المصدر رابط نتائج قابلًا للتحقق (HTTP ${response.status}).`,durationMs:Date.now()-started };
    } catch {
      return { id:this.id,name:this.name,kind:this.kind,status:"unavailable",
        detail:"تعذّر الوصول إلى المصدر في هذه المحاولة.",durationMs:Date.now()-started };
    }
  }
}

class ManualConnector implements SearchConnector {
  constructor(public id:string, public name:string, public resultUrl:string) {}
  kind = "manual" as const;
  async search(): Promise<ConnectorResult> {
    return { id:this.id,name:this.name,kind:this.kind,status:"available",resultUrl:this.resultUrl,
      detail:"المصدر متاح مجانًا، لكنه يشترط رفع الصورة مباشرة في صفحته؛ لم تُنقل صورتك إليه تلقائيًا.",durationMs:0 };
  }
}

class AccountConnector implements SearchConnector {
  kind = "manual" as const;
  constructor(public id:string,public name:string,public resultUrl:string,private capability:"visual"|"text"){}
  async search():Promise<ConnectorResult>{
    const visual=this.capability==="visual";
    return {id:this.id,name:this.name,kind:this.kind,status:"available",resultUrl:this.resultUrl,loginRequired:true,imageSearch:visual,durationMs:0,
      detail:visual
        ?"خدمة مجانية بعد تسجيل الدخول، وتدعم البحث البصري داخل تطبيق المنصة. يجب أن يرفع المستخدم الصورة بنفسه."
        :"الدخول والبحث في المحتوى العام مجانيان، لكن المنصة لا توفر بحثًا عكسيًا بالصورة. فُتحت للبحث اليدوي فقط."};
  }
}

export const connectors: SearchConnector[] = [
  new GoogleLensConnector(),
  new ManualConnector("tineye","TinEye","https://tineye.com/"),
  new ManualConnector("yandex","Yandex Images","https://yandex.com/images/"),
  new ManualConnector("bing","Bing Visual Search","https://www.bing.com/visualsearch"),
  new AccountConnector("pinterest","Pinterest Lens","https://www.pinterest.com/","visual"),
  new AccountConnector("facebook","Facebook","https://www.facebook.com/search/photos/","text"),
  new AccountConnector("instagram","Instagram","https://www.instagram.com/explore/","text"),
  new AccountConnector("x","X","https://x.com/explore","text"),
  new AccountConnector("tiktok","TikTok","https://www.tiktok.com/search","text"),
  new AccountConnector("reddit","Reddit","https://www.reddit.com/search/","text"),
  new AccountConnector("youtube","YouTube","https://www.youtube.com/results","text"),
  new AccountConnector("telegram","Telegram","https://web.telegram.org/","text"),
];

export async function runConnectors(image: Blob, filename: string) {
  return Promise.all(connectors.map((connector) => connector.search(image, filename)));
}
