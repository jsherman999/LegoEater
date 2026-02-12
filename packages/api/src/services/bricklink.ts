import { createHmac, randomBytes } from "node:crypto";

const BRICKLINK_BASE_URL = "https://api.bricklink.com/api/store/v1";

type BricklinkGuideData = {
  unit_price?: number;
  avg_price?: number;
  min_price?: number;
  max_price?: number;
  quantity_avg_price?: number;
  total_quantity?: number;
};

type BricklinkResponse = {
  meta?: {
    code: number;
    message: string;
  };
  data?: BricklinkGuideData;
};

export type BricklinkPriceSnapshot = {
  source: "bricklink";
  currency: "USD";
  avgPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  totalQuantity: number | null;
  fetchedAt: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required`);
  }
  return value;
}

function percentEncode(value: string): string {
  return encodeURIComponent(value)
    .replace(/!/g, "%21")
    .replace(/\*/g, "%2A")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29");
}

function toBaseSetNum(setNum: string): string {
  return setNum.replace(/-\d+$/, "");
}

function buildAuthorizationHeader(method: string, url: string, queryParams: URLSearchParams): string {
  const consumerKey = requireEnv("BRICKLINK_CONSUMER_KEY");
  const consumerSecret = requireEnv("BRICKLINK_CONSUMER_SECRET");
  const tokenValue = requireEnv("BRICKLINK_TOKEN_VALUE");
  const tokenSecret = requireEnv("BRICKLINK_TOKEN_SECRET");

  const oauthParams = {
    oauth_consumer_key: consumerKey,
    oauth_token: tokenValue,
    oauth_nonce: randomBytes(16).toString("hex"),
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_signature_method: "HMAC-SHA1",
    oauth_version: "1.0"
  };

  const combinedParams = new URLSearchParams(queryParams);
  for (const [key, value] of Object.entries(oauthParams)) {
    combinedParams.set(key, value);
  }

  const sortedEntries = Array.from(combinedParams.entries()).sort(([aKey, aValue], [bKey, bValue]) => {
    if (aKey === bKey) {
      return aValue.localeCompare(bValue);
    }
    return aKey.localeCompare(bKey);
  });

  const paramString = sortedEntries
    .map(([key, value]) => `${percentEncode(key)}=${percentEncode(value)}`)
    .join("&");

  const baseString = [method.toUpperCase(), percentEncode(url), percentEncode(paramString)].join("&");
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  const signature = createHmac("sha1", signingKey).update(baseString).digest("base64");

  const headerParams = {
    ...oauthParams,
    oauth_signature: signature
  };

  const serialized = Object.entries(headerParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${percentEncode(key)}="${percentEncode(value)}"`)
    .join(", ");

  return `OAuth ${serialized}`;
}

async function fetchGuide(baseSetNum: string, condition: "N" | "U"): Promise<BricklinkGuideData | null> {
  const endpointPath = `/items/set/${encodeURIComponent(baseSetNum)}/price`;
  const url = `${BRICKLINK_BASE_URL}${endpointPath}`;
  const query = new URLSearchParams({
    guide_type: "sold",
    new_or_used: condition,
    currency_code: "USD"
  });

  const authorization = buildAuthorizationHeader("GET", url, query);
  const response = await fetch(`${url}?${query.toString()}`, {
    headers: {
      Authorization: authorization
    }
  });

  if (!response.ok) {
    throw new Error(`BrickLink request failed (${response.status})`);
  }

  const payload = (await response.json()) as BricklinkResponse;
  if (!payload.data) {
    return null;
  }
  return payload.data;
}

export async function getBricklinkPrice(setNum: string): Promise<BricklinkPriceSnapshot> {
  const bareSetNum = toBaseSetNum(setNum);
  const [newGuide, usedGuide] = await Promise.all([
    fetchGuide(bareSetNum, "N"),
    fetchGuide(bareSetNum, "U")
  ]);

  const candidates = [newGuide, usedGuide].filter((entry): entry is BricklinkGuideData => Boolean(entry));
  if (candidates.length === 0) {
    return {
      source: "bricklink",
      currency: "USD",
      avgPrice: null,
      minPrice: null,
      maxPrice: null,
      totalQuantity: null,
      fetchedAt: new Date().toISOString()
    };
  }

  const avgPrice =
    candidates.reduce((sum, entry) => sum + (entry.avg_price ?? entry.unit_price ?? 0), 0) /
    candidates.length;

  const mins = candidates.map((entry) => entry.min_price).filter((value): value is number => typeof value === "number");
  const maxes = candidates.map((entry) => entry.max_price).filter((value): value is number => typeof value === "number");
  const quantities = candidates
    .map((entry) => entry.total_quantity)
    .filter((value): value is number => typeof value === "number");

  return {
    source: "bricklink",
    currency: "USD",
    avgPrice: Number.isFinite(avgPrice) ? avgPrice : null,
    minPrice: mins.length > 0 ? Math.min(...mins) : null,
    maxPrice: maxes.length > 0 ? Math.max(...maxes) : null,
    totalQuantity: quantities.length > 0 ? quantities.reduce((sum, value) => sum + value, 0) : null,
    fetchedAt: new Date().toISOString()
  };
}
