import { notFound } from "next/navigation";

import { AdminSectionRoutePage } from "@/components/admin/admin-section-page";
import { resolveAdminLegacyRoute } from "@/lib/admin-legacy-routes";

export default async function AdminLegacyCreatePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const route = resolveAdminLegacyRoute(slug);

  if (!route) {
    notFound();
  }

  return (
    <AdminSectionRoutePage
      createHref={route.createHref ?? `/admin/${slug}/create`}
      initialMode="form"
      listHref={route.listHref ?? `/admin/${slug}`}
      resourceKey={route.resourceKey}
      section={route.section}
    />
  );
}
