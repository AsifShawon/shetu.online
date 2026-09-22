import { SERVER_API_BASE_URL } from "@/lib/api/server";
import { DEFAULT_PRO_PACKAGES } from "@/lib/default-pro-packages";

import { PricingClient, type DynamicPricingPackage } from "./pricing-client";

async function getPricingPackages(): Promise<DynamicPricingPackage[]> {
  try {
    const response = await fetch(`${SERVER_API_BASE_URL}/api/consultants/pro-packages/`, {
      cache: "no-store"
    });

    if (!response.ok) return [];

    const packages = (await response.json()) as DynamicPricingPackage[];
    return packages.filter((pkg) => pkg.status === "active");
  } catch {
    return [];
  }
}

export default async function PricingPage() {
  const packages = await getPricingPackages();
  const displayPackages = packages.length > 0 ? packages : DEFAULT_PRO_PACKAGES;

  return <PricingClient packages={displayPackages} />;
}
