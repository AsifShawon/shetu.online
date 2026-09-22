"use client";

import type { Route } from "next";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";

import { useToast } from "@/components/layout/toast-provider";
import { cn } from "@/lib/utils";
import { getServices, type ServiceCategory } from "@/lib/api/catalog";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  deleteConsultantService,
  getConsultantServices,
  updateConsultantService,
  type ConsultantService,
} from "@/lib/api/consultants";
import { formatDurationDays } from "@/lib/formatters";

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function formatPrice(value: string | null | undefined) {
  const numeric = Number(value ?? "");
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "Negotiable";
  }

  return `BDT ${numeric.toLocaleString("en-US")}`;
}

export function ConsultantServices() {
  const { showToast } = useToast();

  const [services, setServices] = useState<ConsultantService[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [serviceFilter, setServiceFilter] = useState("all");
  const deferredSearch = useDeferredValue(search);

  const load = () => {
    setLoading(true);

    Promise.allSettled([
      getConsultantServices({ scope: "mine" }),
      getServices(),
    ])
      .then(([serviceResult, categoryResult]) => {
        const serviceData = takeFulfilledValue(serviceResult) ?? [];
        const categoryData = takeFulfilledValue(categoryResult) ?? [];

        setServices(serviceData);
        setServiceCategories(categoryData.filter((item) => item.status === "active"));

        const failedKeys = [
          serviceResult.status === "rejected" ? "services" : null,
          categoryResult.status === "rejected" ? "service categories" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some service data could not sync",
            message: `The list loaded with partial data while ${failedKeys.join(", ")} were unavailable.`,
          });
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this service?")) {
      return;
    }

    try {
      await deleteConsultantService(id);
      showToast({
        variant: "success",
        title: "Service deleted",
        message: "The selected service was removed.",
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Delete failed",
        message: getApiErrorMessage(error, "Unable to delete this service."),
      });
    }
  };

  const handleToggleStatus = async (service: ConsultantService) => {
    const nextStatus = service.status === "active" ? "disabled" : "active";

    try {
      await updateConsultantService(service.id, { status: nextStatus });
      showToast({
        variant: "success",
        title: "Service updated",
        message: `Service marked as ${nextStatus}.`,
      });
      load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Status update failed",
        message: getApiErrorMessage(error, "Unable to update service status."),
      });
    }
  };

  const filteredServices = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return services.filter((service) => {
      const matchesQuery =
        !query ||
        service.title.toLowerCase().includes(query) ||
        service.description.toLowerCase().includes(query) ||
        (service.country_name ?? "").toLowerCase().includes(query) ||
        (service.duration ?? "").toLowerCase().includes(query) ||
        (service.subject_names ?? []).some((item) => item.toLowerCase().includes(query)) ||
        (service.study_level_names ?? []).some((item) => item.toLowerCase().includes(query)) ||
        (service.service_category_names ?? []).some((item) => item.toLowerCase().includes(query));

      const matchesFilter =
        serviceFilter === "all" ||
        (service.service_category_names ?? []).some((item) => item === serviceFilter);

      return matchesQuery && matchesFilter;
    });
  }, [deferredSearch, serviceFilter, services]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
          <Link href="/dashboard/consultant" className="hover:text-primary transition-colors">Dashboard</Link>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Services</span>
        </div>
        <h2 className="text-2xl font-black text-slate-900 lg:text-3xl">Manage Services</h2>
      </div>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <i className="fa-solid fa-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm font-medium transition-all focus:border-primary focus:ring-4 focus:ring-primary/5"
                placeholder="Search services..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <select
              className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition-all focus:border-primary focus:ring-4 focus:ring-primary/5 sm:w-56"
              value={serviceFilter}
              onChange={(event) => setServiceFilter(event.target.value)}
            >
              <option value="all">All Categories</option>
              {serviceCategories.map((item) => (
                <option key={item.id} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <Link 
            href={"/dashboard/consultant/services/create" as Route} 
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-sm font-bold text-white shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <i className="fa-solid fa-plus-circle" />
            Create Service
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
            <p className="text-sm font-bold text-slate-500">Loading services...</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[3rem] bg-white p-12 text-center shadow-xl shadow-slate-200/50">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50 text-slate-200">
              <i className="fa-solid fa-folder-open text-5xl" />
            </div>
            <h3 className="text-xl font-black text-slate-900">No Services Found</h3>
            <p className="mt-2 text-sm font-medium text-slate-500 max-w-xs">
              {search || serviceFilter !== "all" 
                ? "We couldn't find any services matching your criteria."
                : "You haven't created any services yet. Create your first service to start getting requests."}
            </p>
            {!search && serviceFilter === "all" && (
              <Link href={"/dashboard/consultant/services/create" as Route} className="mt-6 flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-xs font-bold text-white shadow-lg shadow-primary/20">
                <i className="fa-solid fa-plus" />
                Create Service
              </Link>
            )}
          </div>
        ) : (
          <>
            {/* Mobile/Tablet Card View */}
            <div className="grid gap-4 sm:grid-cols-2 lg:hidden">
              {filteredServices.map((service) => (
                <div key={service.id} className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm border border-slate-100">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="text-base font-black text-slate-900 leading-tight">{service.title}</h4>
                      <p className="mt-1 line-clamp-2 text-xs font-medium text-slate-500">{service.description || "No description provided."}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(service)}
                      className={cn(
                        "flex h-7 items-center rounded-full px-3 text-[10px] font-bold uppercase tracking-wider border transition-colors",
                        service.status === "active" 
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      )}
                    >
                      {service.status}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2 border-y border-slate-50">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Country</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{service.country_name || "—"}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Charge</span>
                      <span className="text-xs font-black text-primary truncate">{formatPrice(service.price)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Duration</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{formatDurationDays(service.duration)}</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Category</span>
                      <span className="text-xs font-bold text-slate-700 truncate">{(service.service_category_names ?? [])[0] || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/dashboard/consultant/services/create?edit=${service.id}` as Route}
                      className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-blue-50 text-xs font-bold text-blue-600 transition-all hover:bg-blue-100"
                    >
                      <i className="fa-solid fa-pen-to-square" />
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(service.id)}
                      className="flex h-10 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 transition-all hover:bg-rose-100"
                    >
                      <i className="fa-solid fa-trash-can" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/50 lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50 bg-slate-50/50">
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Service Info</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Details</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400">Financials</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                    <th className="px-6 py-5 text-[11px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredServices.map((service) => (
                    <tr key={service.id} className="group transition-colors hover:bg-slate-50/30">
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-900">{service.title}</span>
                          <span className="text-xs font-medium text-slate-400 line-clamp-1">{service.description || "No description"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <i className="fa-solid fa-earth-americas text-primary/50" />
                            {service.country_name || "—"}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                            <i className="fa-regular fa-clock text-primary/50" />
                            {formatDurationDays(service.duration)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-primary">{formatPrice(service.price)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{(service.service_category_names ?? [])[0] || "General"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(service)}
                          className={cn(
                            "inline-flex h-7 items-center rounded-full px-4 text-[10px] font-black uppercase tracking-widest border transition-all hover:scale-105",
                            service.status === "active" 
                              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                              : "bg-slate-100 text-slate-400 border-slate-200"
                          )}
                        >
                          {service.status}
                        </button>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <Link
                            href={`/dashboard/consultant/services/create?edit=${service.id}` as Route}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all"
                          >
                            <i className="fa-solid fa-pen-to-square" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDelete(service.id)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </div>

  );
}
