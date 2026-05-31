type YmInitOptions = {
  ssr?: boolean;
  webvisor?: boolean;
  clickmap?: boolean;
  ecommerce?: string | boolean;
  accurateTrackBounce?: boolean;
  trackLinks?: boolean;
  referrer?: string;
  url?: string;
};

type YmFn = {
  (id: number, event: "init", options: YmInitOptions): void;
  (id: number, event: "hit", url: string, options?: Record<string, unknown>): void;
  (id: number, event: string, ...args: unknown[]): void;
  a?: unknown[][];
  l?: number;
};

declare global {
  interface Window {
    ym?: YmFn;
  }
}

export {};
