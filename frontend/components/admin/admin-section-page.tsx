"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { AdminOverview } from "@/components/admin/admin-overview";
import { AdminResourceManager } from "@/components/admin/resource-manager";
import { AdminShell } from "@/components/admin/admin-shell";
import {
  adminSectionConfigs,
  getAdminResourceConfig,
  type AdminSectionKey,
} from "@/lib/admin-config";

function AdminSectionPageContent({ section }: { section: AdminSectionKey }) {
  const searchParams = useSearchParams();
  const requestedResourceKey = searchParams.get("resource") ?? undefined;
  const config = adminSectionConfigs[section];
  const activeResource = getAdminResourceConfig(section, requestedResourceKey);
  const title = activeResource?.label ?? config.title;
  const description = activeResource?.description ?? config.description;

  return (
    <AdminShell
      description={description}
      resourceKey={activeResource?.key}
      section={section}
      showIntro={section !== "overview"}
      title={title}
    >
      {section === "overview" ? (
        <AdminOverview />
      ) : (
        <AdminResourceManager
          config={config}
          initialResourceKey={activeResource?.key}
        />
      )}
    </AdminShell>
  );
}

export function AdminSectionPage({ section }: { section: AdminSectionKey }) {
  return (
    <Suspense fallback={null}>
      <AdminSectionPageContent section={section} />
    </Suspense>
  );
}

type AdminSectionPageMode = "list" | "form" | "upsert";

interface AdminSectionRoutePageProps {
  section: AdminSectionKey;
  resourceKey?: string;
  initialMode?: AdminSectionPageMode;
  listHref?: string;
  createHref?: string;
}

function AdminSectionRoutePageContent({
  section,
  resourceKey,
  initialMode = "list",
  listHref,
  createHref,
}: AdminSectionRoutePageProps) {
  const searchParams = useSearchParams();
  const requestedResourceKey = resourceKey ?? searchParams.get("resource") ?? undefined;
  const config = adminSectionConfigs[section];
  const activeResource = getAdminResourceConfig(section, requestedResourceKey);
  const scopedConfig =
    resourceKey && activeResource
      ? {
          ...config,
          resources: [activeResource],
        }
      : config;
  const title = activeResource?.label ?? config.title;
  const description = activeResource?.description ?? config.description;

  return (
    <AdminShell
      description={description}
      resourceKey={activeResource?.key}
      section={section}
      showIntro={section !== "overview"}
      title={title}
    >
      {section === "overview" ? (
        <AdminOverview />
      ) : (
        <AdminResourceManager
          config={scopedConfig}
          createHref={createHref}
          initialMode={initialMode}
          initialResourceKey={activeResource?.key}
          listHref={listHref}
        />
      )}
    </AdminShell>
  );
}

export function AdminSectionRoutePage(props: AdminSectionRoutePageProps) {
  return (
    <Suspense fallback={null}>
      <AdminSectionRoutePageContent {...props} />
    </Suspense>
  );
}
