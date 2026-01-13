import checkout from "@paypal/checkout-server-sdk";

const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV } = process.env;

function environment() {
  const clientId = PAYPAL_CLIENT_ID || "";
  const clientSecret = PAYPAL_CLIENT_SECRET || "";
  const isSandbox = (PAYPAL_ENV || "sandbox").toLowerCase() !== "live";
  return isSandbox
    ? new checkout.core.SandboxEnvironment(clientId, clientSecret)
    : new checkout.core.LiveEnvironment(clientId, clientSecret);
}

export function getPaypalClient() {
  return new checkout.core.PayPalHttpClient(environment());
}

export function getCurrency() {
  return "ILS";
}
