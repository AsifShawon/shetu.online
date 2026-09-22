"use client";

import { useEffect, useState } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { useToast } from "@/components/layout/toast-provider";
import {
  getAdminResource,
  postAdminAction,
  updateAdminResource,
  type AdminRecord,
} from "@/lib/api/admin";
import { getApiErrorMessage } from "@/lib/api/client";

const INCIDENTS_PATH = "/api/admin/moderation-incidents/";
const USERS_PATH = "/api/admin/users/";

export default function AdminModerationPage() {
  const { showToast } = useToast();
  const [incidents, setIncidents] = useState<AdminRecord[]>([]);
  const [users, setUsers] = useState<AdminRecord[]>([]);
  const [incidentNotes, setIncidentNotes] = useState<Record<number, string>>({});
  const [incidentStatuses, setIncidentStatuses] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [incidentData, userData] = await Promise.all([
        getAdminResource(INCIDENTS_PATH),
        getAdminResource(USERS_PATH),
      ]);
      setIncidents(incidentData);
      setUsers(userData);
      setIncidentNotes(Object.fromEntries(incidentData.map((item) => [Number(item.id), String(item.notes ?? "")])));
      setIncidentStatuses(Object.fromEntries(incidentData.map((item) => [Number(item.id), String(item.status ?? "open")])));
    } catch (error) {
      showToast({
        variant: "error",
        title: "Moderation load failed",
        message: getApiErrorMessage(error, "Unable to load moderation data."),
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleIncidentSave = async (id: number) => {
    setBusyKey(`incident-${id}`);
    try {
      await updateAdminResource(INCIDENTS_PATH, id, {
        status: incidentStatuses[id],
        notes: incidentNotes[id],
      });
      showToast({
        variant: "success",
        title: "Incident updated",
        message: "Moderation notes were saved.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Incident update failed",
        message: getApiErrorMessage(error, "Unable to update this moderation incident."),
      });
    } finally {
      setBusyKey(null);
    }
  };

  const handleBanAction = async (id: number, isBanned: boolean) => {
    setBusyKey(`user-${id}`);
    try {
      const action = isBanned ? "unban" : "ban";
      const payload = isBanned
        ? {}
        : {
            reason: window.prompt("Ban reason") || "",
            banned_until: "",
          };
      await postAdminAction(USERS_PATH, id, action, payload);
      showToast({
        variant: "success",
        title: isBanned ? "User unbanned" : "User banned",
        message: "The user moderation status was updated.",
      });
      await load();
    } catch (error) {
      showToast({
        variant: "error",
        title: "User moderation failed",
        message: getApiErrorMessage(error, "Unable to update the user moderation state."),
      });
    } finally {
      setBusyKey(null);
    }
  };

  return (
    <AdminShell
      section="verification"
      resourceKey="moderation-incidents"
      title="Moderation"
      description="Manage auto-flagged content incidents and apply account-level bans when platform rules are breached."
    >
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-medium text-slate-900">Flagged incidents</h2>
            <p className="mt-1 text-sm text-slate-500">Contact-sharing and related rule checks land here for review.</p>
          </div>

          <div className="space-y-4 p-5">
            {loading ? (
              <p className="py-6 text-center text-sm text-slate-500">Loading incidents...</p>
            ) : incidents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                No moderation incident is currently open.
              </p>
            ) : (
              incidents.map((incident) => {
                const id = Number(incident.id);
                return (
                  <article key={id} className="rounded-lg border border-slate-200 p-4">
                    <div className="grid gap-4 xl:grid-cols-[1.1fr_200px_1fr]">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {String(incident.reported_user_email ?? "Unknown user")} · {String(incident.source_type ?? "source")}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-slate-600">{String(incident.content_excerpt ?? "No excerpt available.")}</p>
                        {incident.matched_terms ? (
                          <p className="mt-2 text-xs text-slate-500">Matched terms: {JSON.stringify(incident.matched_terms)}</p>
                        ) : null}
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Status</label>
                        <select
                          className="h-11 w-full rounded-md border border-slate-300 px-3 text-sm"
                          value={incidentStatuses[id] ?? "open"}
                          onChange={(event) => setIncidentStatuses((current) => ({ ...current, [id]: event.target.value }))}
                        >
                          <option value="open">Open</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                          <option value="dismissed">Dismissed</option>
                        </select>
                      </div>
                      <div>
                        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Notes</label>
                        <textarea
                          className="min-h-[96px] w-full rounded-md border border-slate-300 px-3 py-3 text-sm"
                          value={incidentNotes[id] ?? ""}
                          onChange={(event) => setIncidentNotes((current) => ({ ...current, [id]: event.target.value }))}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className="mt-4 rounded-md bg-[#1f8bff] px-4 py-2 text-sm font-medium text-white"
                      disabled={busyKey === `incident-${id}`}
                      onClick={() => handleIncidentSave(id)}
                    >
                      {busyKey === `incident-${id}` ? "Saving..." : "Save incident"}
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-xl font-medium text-slate-900">Account controls</h2>
            <p className="mt-1 text-sm text-slate-500">Use the ban and unban actions against the full admin user registry.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-white text-slate-900">
                <tr>
                  <th className="px-4 py-4 font-semibold">Name</th>
                  <th className="px-4 py-4 font-semibold">Email</th>
                  <th className="px-4 py-4 font-semibold">Role</th>
                  <th className="px-4 py-4 font-semibold">Status</th>
                  <th className="px-4 py-4 font-semibold">Ban Reason</th>
                  <th className="px-4 py-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-500">Loading users...</td>
                  </tr>
                ) : (
                  users.map((user) => {
                    const id = Number(user.id);
                    const isBanned = Boolean(user.is_banned);
                    return (
                      <tr key={id} className="border-b border-slate-100">
                        <td className="px-4 py-4 text-slate-700">{String(user.full_name ?? user.name ?? "-")}</td>
                        <td className="px-4 py-4 text-slate-700">{String(user.email ?? "-")}</td>
                        <td className="px-4 py-4 text-slate-700">{String(user.role ?? "-")}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${isBanned ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-700"}`}>
                            {isBanned ? "Banned" : "Active"}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{String(user.ban_reason ?? "-")}</td>
                        <td className="px-4 py-4">
                          <button
                            type="button"
                            className={`rounded-md px-3 py-2 text-xs font-semibold ${isBanned ? "border border-emerald-500 text-emerald-600" : "border border-rose-500 text-rose-600"}`}
                            disabled={busyKey === `user-${id}`}
                            onClick={() => handleBanAction(id, isBanned)}
                          >
                            {busyKey === `user-${id}` ? "Working..." : isBanned ? "Unban" : "Ban"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AdminShell>
  );
}
