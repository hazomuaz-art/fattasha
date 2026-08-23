export type ConnectorResult = {
  id: string; name: string; kind: "visual" | "manual"; status: "available" | "unavailable";
  resultUrl?: string; detail: string; durationMs: number;
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

export const connectors: SearchConnector[] = [
  new GoogleLensConnector(),
  new ManualConnector("tineye","TinEye","https://tineye.com/"),
  new ManualConnector("yandex","Yandex Images","https://yandex.com/images/"),
  new ManualConnector("bing","Bing Visual Search","https://www.bing.com/visualsearch"),
];

export async function runConnectors(image: Blob, filename: string) {
  return Promise.all(connectors.map((connector) => connector.search(image, filename)));
}
