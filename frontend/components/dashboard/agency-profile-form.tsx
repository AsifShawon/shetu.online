"use client";

import { useEffect, useState } from "react";

import { getAgencyProfile, createAgencyProfile, updateAgencyProfile, type AgencyProfile } from "@/lib/api/agencies";
import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";

import {
  ModernProfileInput,
  ModernProfileTextarea,
  ProfileEditShell,
  ProfileHeaderCard,
  ProfileSectionCard,
  ProfileSectionNav,
  StickyProfileActionBar
} from "./profile-shared";

export function AgencyProfileForm() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeSection, setActiveSection] = useState("identity");

  const [form, setForm] = useState({
    slogan: "",
    description: "",
    banner_heading: "",
    sub_heading: "",
    about_text: "",
    mission: "",
    vision: "",
    policy: "",
    map_link: ""
  });

  const load = async () => {
    try {
      const list = await getAgencyProfile();
      if (list.length > 0) {
        const p = list[0];
        setProfile(p);
        setForm({
          slogan: p.slogan ?? "",
          description: p.description ?? "",
          banner_heading: p.banner_heading ?? "",
          sub_heading: p.sub_heading ?? "",
          about_text: p.about_text ?? "",
          mission: p.mission ?? "",
          vision: p.vision ?? "",
          policy: p.policy ?? "",
          map_link: p.map_link ?? ""
        });
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSaved(false);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (profile) {
        await updateAgencyProfile(profile.id, fd);
      } else {
        await createAgencyProfile(fd);
      }
      setSaved(true);
      showToast({
        variant: "success",
        title: "Profile saved",
        message: "Agency profile information saved successfully.",
      });
      setEditMode(false);
      await load();
    } catch {
      showToast({
        variant: "error",
        title: "Save failed",
        message: "Unable to save your agency profile details.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSectionNav = (id: string) => {
    setActiveSection(id);
  };

  if (loading) return <p className="p-8 text-center text-slate-500 font-medium">Loading agency details...</p>;

  const navItems = [
    { id: "identity", label: "Banner & Identity", icon: "fa-regular fa-id-card" },
    { id: "details", label: "Agency Details", icon: "fa-solid fa-circle-info" },
    { id: "directives", label: "Directives & Policies", icon: "fa-regular fa-file-lines" },
  ];

  const profileDisabled = !editMode;
  const displayImage = user?.image_url || "/legacy/no-profile-img.png";

  return (
    <section className="flex flex-col gap-6 w-full px-2 lg:px-4 py-2">
      <div>
        <h2 className="text-xl font-black text-slate-800">Agency Profile</h2>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mt-1">
          <span>Dashboard</span>
          <i className="fa-solid fa-chevron-right text-[10px]" />
          <span className="text-slate-600">Agency Profile Settings</span>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl px-4 py-3 text-xs font-semibold shadow-sm">
          <i className="fa-solid fa-circle-check text-emerald-500 text-sm" />
          <span>Profile saved successfully.</span>
        </div>
      )}

      <ProfileHeaderCard
        avatarUrl={displayImage}
        name={user?.full_name || "Agency"}
        email={user?.email || ""}
        role="Agency"
        editMode={editMode}
        onToggleEdit={() => setEditMode(!editMode)}
      />

      <ProfileEditShell>
        <div className="lg:col-span-1">
          <ProfileSectionNav
            items={navItems}
            activeSection={activeSection}
            onSectionClick={handleSectionNav}
          />
        </div>

        <div className="lg:col-span-3">
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            {activeSection === "identity" && (
              <ProfileSectionCard id="identity" title="Banner & Identity" icon="fa-regular fa-id-card" helperText="Public slogan and details display">
                <ModernProfileInput
                  label="Slogan"
                  placeholder="Agency tagline"
                  value={form.slogan}
                  onChange={set("slogan")}
                  readOnly={profileDisabled}
                />
                <ModernProfileInput
                  label="Banner Heading"
                  placeholder="Main banner heading"
                  value={form.banner_heading}
                  onChange={set("banner_heading")}
                  readOnly={profileDisabled}
                />
                <ModernProfileInput
                  label="Sub Heading"
                  placeholder="Banner sub-heading"
                  value={form.sub_heading}
                  onChange={set("sub_heading")}
                  readOnly={profileDisabled}
                />
                <ModernProfileInput
                  label="Google Maps Link"
                  placeholder="https://maps.google.com/..."
                  value={form.map_link}
                  onChange={set("map_link")}
                  readOnly={profileDisabled}
                />
              </ProfileSectionCard>
            )}

            {activeSection === "details" && (
              <ProfileSectionCard id="details" title="Agency Details" icon="fa-solid fa-circle-info" helperText="Description and introduction">
                <div className="sm:col-span-2">
                  <ModernProfileTextarea
                    label="Short Description"
                    rows={3}
                    placeholder="Brief agency description..."
                    value={form.description}
                    onChange={set("description")}
                    readOnly={profileDisabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ModernProfileTextarea
                    label="About Us"
                    rows={4}
                    placeholder="Tell students more about your agency..."
                    value={form.about_text}
                    onChange={set("about_text")}
                    readOnly={profileDisabled}
                  />
                </div>
              </ProfileSectionCard>
            )}

            {activeSection === "directives" && (
              <ProfileSectionCard id="directives" title="Directives & Policies" icon="fa-regular fa-file-lines" helperText="Our corporate guidelines">
                <div className="sm:col-span-2">
                  <ModernProfileTextarea
                    label="Mission"
                    rows={2}
                    placeholder="Agency mission statement..."
                    value={form.mission}
                    onChange={set("mission")}
                    readOnly={profileDisabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ModernProfileTextarea
                    label="Vision"
                    rows={2}
                    placeholder="Agency vision statement..."
                    value={form.vision}
                    onChange={set("vision")}
                    readOnly={profileDisabled}
                  />
                </div>
                <div className="sm:col-span-2">
                  <ModernProfileTextarea
                    label="Policy"
                    rows={2}
                    placeholder="Agency guidelines/policies..."
                    value={form.policy}
                    onChange={set("policy")}
                    readOnly={profileDisabled}
                  />
                </div>
              </ProfileSectionCard>
            )}

            <StickyProfileActionBar
              onSave={handleSubmit}
              saving={submitting}
              disabled={profileDisabled}
            />
          </form>
        </div>
      </ProfileEditShell>
    </section>
  );
}
