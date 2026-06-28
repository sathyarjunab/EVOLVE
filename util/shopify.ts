// ─── Shopify Admin API helper ────────────────────────────────────────────────
// Dev Dashboard apps don't expose a static `shpat_` token. Instead we exchange
// the app's Client ID/Secret for a short-lived (24h) Admin API token via the
// client-credentials grant, cache it in memory, and use it for GraphQL calls.

const STORE_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN;
const CLIENT_ID = process.env.SHOPIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SHOPIFY_CLIENT_SECRET;
const API_VERSION = process.env.SHOPIFY_API_VERSION ?? "2025-04";

// In-memory token cache (per warm server instance). Refreshed before expiry.
let cachedToken: { value: string; expiresAt: number } | null = null;

function assertConfigured() {
  if (!STORE_DOMAIN || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error(
      "Shopify is not configured. Missing SHOPIFY_STORE_DOMAIN / SHOPIFY_CLIENT_ID / SHOPIFY_CLIENT_SECRET.",
    );
  }
}

/** True only when all credentials are present — callers can skip silently. */
export function isShopifyConfigured(): boolean {
  return Boolean(STORE_DOMAIN && CLIENT_ID && CLIENT_SECRET);
}

/** Get a valid Admin API access token, exchanging credentials if needed. */
async function getAccessToken(): Promise<string> {
  assertConfigured();

  // Reuse the cached token until 5 minutes before it expires.
  if (cachedToken && cachedToken.expiresAt - 5 * 60 * 1000 > Date.now()) {
    return cachedToken.value;
  }

  const res = await fetch(`https://${STORE_DOMAIN}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: CLIENT_ID!,
      client_secret: CLIENT_SECRET!,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify token exchange failed (${res.status}): ${text}`);
  }

  const json = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    value: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };
  return cachedToken.value;
}

/** Run a GraphQL query/mutation against the Admin API. */
async function adminGraphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = await getAccessToken();

  const res = await fetch(
    `https://${STORE_DOMAIN}/admin/api/${API_VERSION}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Shopify GraphQL request failed (${res.status}): ${text}`);
  }

  return (await res.json()) as T;
}

// ─── Discount creation ───────────────────────────────────────────────────────

const DISCOUNT_CODE_BASIC_CREATE = /* GraphQL */ `
  mutation discountCodeBasicCreate($basicCodeDiscount: DiscountCodeBasicInput!) {
    discountCodeBasicCreate(basicCodeDiscount: $basicCodeDiscount) {
      codeDiscountNode { id }
      userErrors { field code message }
    }
  }
`;

interface DiscountCodeBasicCreateResponse {
  data?: {
    discountCodeBasicCreate: {
      codeDiscountNode: { id: string } | null;
      userErrors: { field: string[] | null; code: string | null; message: string }[];
    };
  };
  errors?: { message: string }[];
}

export interface CreateDiscountArgs {
  code: string;
  couponCodeType: "FLAT" | "PERCENTAGE";
  /** Stored value: percentage as 0–100, flat as a currency amount. */
  discountValue: number;
}

export interface CreateDiscountResult {
  discountId: string | null;
  errors: string[];
}

/**
 * Create a basic code-based discount in Shopify that maps to one influencer
 * coupon. The Shopify discount `code` is the same as our coupon code, so the
 * cart-permalink `?discount=CODE` parameter applies it at checkout.
 */
export async function createBasicDiscountCode(
  args: CreateDiscountArgs,
): Promise<CreateDiscountResult> {
  const { code, couponCodeType, discountValue } = args;

  // Shopify wants a fraction (0–1) for percentage; a money amount for flat.
  const value =
    couponCodeType === "PERCENTAGE"
      ? { percentage: discountValue / 100 }
      : {
          discountAmount: {
            amount: discountValue,
            appliesOnEachItem: false,
          },
        };

  const variables = {
    basicCodeDiscount: {
      title: code,
      code,
      startsAt: new Date().toISOString(),
      customerSelection: { all: true },
      customerGets: {
        value,
        items: { all: true },
      },
      appliesOncePerCustomer: false,
    },
  };

  const json = await adminGraphql<DiscountCodeBasicCreateResponse>(
    DISCOUNT_CODE_BASIC_CREATE,
    variables,
  );

  if (json.errors?.length) {
    return { discountId: null, errors: json.errors.map((e) => e.message) };
  }

  const payload = json.data?.discountCodeBasicCreate;
  if (!payload) {
    return { discountId: null, errors: ["Empty response from Shopify."] };
  }
  if (payload.userErrors.length) {
    return {
      discountId: null,
      errors: payload.userErrors.map((e) => e.message),
    };
  }

  return { discountId: payload.codeDiscountNode?.id ?? null, errors: [] };
}
