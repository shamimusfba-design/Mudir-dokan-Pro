export type TenantViewMode =
  | 'DEMO'             // demo.mudidokanpro.web.app or /demo or ?demo=true -> Interactive Live Demo POS
  | 'APP'              // app.mudidokanpro.com or app.mudidokanpro.web.app or /app or ?app=true -> Shopkeeper POS + Client Mgmt
  | 'LANDING'          // mudidokanpro.web.app or mudidokanpro.com at root -> High-converting SaaS Marketing Page
  | 'SHOP_STOREFRONT'  // shamim.mudidokanpro.com or ?shop=shamim -> Customer E-Commerce Store for that shop
  | 'SHOP_APP'         // shamim.mudidokanpro.com/app -> Shopkeeper POS for Shamim
  | 'STORE_PORTAL'     // /store -> Multi-store marketplace
  | 'CUSTOMER_PORTAL'; // /portal -> Customer Khata Portal

export interface TenantInfo {
  mode: TenantViewMode;
  isSubdomain: boolean;
  subdomain: string | null;
  shopSlug: string | null;
  shopName: string;
}

export function detectTenant(): TenantInfo {
  if (typeof window === 'undefined') {
    return {
      mode: 'LANDING',
      isSubdomain: false,
      subdomain: null,
      shopSlug: null,
      shopName: 'মুদি দোকান প্রো',
    };
  }

  const hostname = window.location.hostname.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  const searchParams = new URLSearchParams(window.location.search);

  // 1. Explicit query flags for flexible testing in dev or demo
  const isDemoQuery = searchParams.get('demo') === 'true' || searchParams.get('mode') === 'demo';
  const isAppQuery = searchParams.get('app') === 'true' || searchParams.get('mode') === 'app';
  const isLandingQuery = searchParams.get('landing') === 'true' || searchParams.get('mode') === 'landing';
  const shopQuery = searchParams.get('shop')?.toLowerCase().trim() || null;

  // 2. Subdomain extraction from hostname (e.g. demo.mudidokanpro.web.app, app.mudidokanpro.web.app, shamim.mudidokanpro.com)
  const parts = hostname.split('.');
  let sub: string | null = null;
  if (hostname.endsWith('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
    sub = parts[0];
  } else if (parts.length >= 3) {
    const first = parts[0];
    if (first !== 'www' && first !== 'mudidokanpro' && first !== 'mudirdokanpro') {
      sub = first;
    }
  }

  // Check portal route first:
  if (pathname.startsWith('/portal')) {
    return {
      mode: 'CUSTOMER_PORTAL',
      isSubdomain: Boolean(sub),
      subdomain: sub,
      shopSlug: sub,
      shopName: 'মুদি দোকান প্রো — কাস্টমার পোর্টাল',
    };
  }

  // Check demo (demo.mudidokanpro.web.app or /demo or ?demo=true):
  if (sub === 'demo' || isDemoQuery || pathname === '/demo' || pathname.startsWith('/demo/')) {
    return {
      mode: 'DEMO',
      isSubdomain: sub === 'demo',
      subdomain: 'demo',
      shopSlug: null,
      shopName: 'মুদি দোকান প্রো — লাইভ ডেমো',
    };
  }

  // Check app & client tracking (app.mudidokanpro.com, app.mudidokanpro.web.app, /app, or ?app=true):
  if (sub === 'app' || isAppQuery || pathname === '/app' || pathname.startsWith('/app/')) {
    return {
      mode: 'APP',
      isSubdomain: sub === 'app',
      subdomain: 'app',
      shopSlug: null,
      shopName: 'মুদি দোকান প্রো — অ্যাপ ও ক্লায়েন্ট পোর্টাল',
    };
  }

  // Check individual shop subdomain (e.g., shamim.mudirdokanpro.com or ?shop=shamim):
  const shopSlug = shopQuery || (sub && sub !== 'demo' && sub !== 'app' && sub !== 'api' ? sub : null);
  if (shopSlug) {
    if (pathname.startsWith('/app')) {
      return {
        mode: 'SHOP_APP',
        isSubdomain: true,
        subdomain: shopSlug,
        shopSlug,
        shopName: `${shopSlug.charAt(0).toUpperCase() + shopSlug.slice(1)} মুদি শপ`,
      };
    }
    return {
      mode: 'SHOP_STOREFRONT',
      isSubdomain: true,
      subdomain: shopSlug,
      shopSlug,
      shopName: `${shopSlug.charAt(0).toUpperCase() + shopSlug.slice(1)} মুদি শপ`,
    };
  }

  // Multi-store marketplace route:
  if (pathname.startsWith('/store') || pathname.startsWith('/shop')) {
    return {
      mode: 'STORE_PORTAL',
      isSubdomain: false,
      subdomain: null,
      shopSlug: null,
      shopName: 'মুদি দোকান প্রো — অনলাইন মুদি বাজার',
    };
  }

  // Main domain root / landing page:
  // mudidokanpro.web.app or mudidokanpro.com
  return {
    mode: 'LANDING',
    isSubdomain: false,
    subdomain: null,
    shopSlug: null,
    shopName: 'মুদি দোকান প্রো',
  };
}
