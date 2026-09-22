"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { MultiSuggestionInput, SuggestionInput } from "@/components/form/suggestion-fields";
import { useToast } from "@/components/layout/toast-provider";
import {
  getCountries,
  getServices,
  getStudyLevels,
  type Country,
  type ServiceCategory,
  type StudyLevel,
} from "@/lib/api/catalog";
import { getApiErrorMessage } from "@/lib/api/client";
import {
  createConsultantService,
  getConsultantServices,
  getConsultantSubjects,
  updateConsultantService,
  type Subject,
} from "@/lib/api/consultants";
import {
  getCountrySuggestionList,
  getServiceSuggestionList,
  getStudyLevelSuggestionList,
  getSubjectSuggestionList,
} from "@/lib/shared-suggestion-catalog";
import { buildSuggestionList, normalizeKey, normalizeText } from "@/lib/suggestions";

type ServiceMetricState = {
  service_name: string;
  price: string;
  duration: string;
};

type ServiceFormState = {
  title: string;
  description: string;
  country_input: string;
  status: "active" | "disabled";
  service_names: string[];
  service_metrics: ServiceMetricState[];
  study_level_names: string[];
  subject_names: string[];
};

const MAX_TITLE_LENGTH = 150;
const MAX_DESCRIPTION_LENGTH = 300;

function createBlankForm(): ServiceFormState {
  return {
    title: "",
    description: "",
    country_input: "",
    status: "active",
    service_names: [],
    service_metrics: [],
    study_level_names: [],
    subject_names: [],
  };
}

function resolveNamesFromIds(ids: number[] | undefined, source: Array<{ id: number; name: string }>) {
  if (!ids?.length) return [];

  return ids
    .map((id) => source.find((item) => item.id === id)?.name)
    .filter((item): item is string => Boolean(item));
}

function takeFulfilledValue<T>(result: PromiseSettledResult<T>) {
  return result.status === "fulfilled" ? result.value : null;
}

function syncServiceMetrics(serviceNames: string[], existingMetrics: ServiceMetricState[]) {
  const metricsByName = new Map(
    existingMetrics.map((item) => [normalizeKey(item.service_name), item]),
  );

  return serviceNames.map((serviceName) => {
    const existing = metricsByName.get(normalizeKey(serviceName));

    return {
      service_name: serviceName,
      price: existing?.price ?? "",
      duration: existing?.duration ?? "",
    };
  });
}

export function ConsultantServiceForm({ editId = null }: { editId?: number | null }) {
  const router = useRouter();
  const { showToast } = useToast();

  const [countries, setCountries] = useState<Country[]>([]);
  const [serviceCategories, setServiceCategories] = useState<ServiceCategory[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<ServiceFormState>(createBlankForm());

  const isEditing = typeof editId === "number" && Number.isFinite(editId);

  const countrySuggestions = useMemo(
    () => getCountrySuggestionList(countries.map((item) => item.name)),
    [countries],
  );

  const serviceSuggestions = useMemo(
    () => getServiceSuggestionList(serviceCategories.map((item) => item.name)),
    [serviceCategories],
  );

  const studyLevelSuggestions = useMemo(
    () => getStudyLevelSuggestionList(studyLevels.map((item) => item.name)),
    [studyLevels],
  );

  const subjectSuggestions = useMemo(
    () => getSubjectSuggestionList(subjects.map((item) => item.name)),
    [subjects],
  );

  const countryByName = useMemo(
    () => new Map(countries.map((item) => [normalizeKey(item.name), item])),
    [countries],
  );

  const serviceByName = useMemo(
    () => new Map(serviceCategories.map((item) => [normalizeKey(item.name), item])),
    [serviceCategories],
  );

  const studyLevelByName = useMemo(
    () => new Map(studyLevels.map((item) => [normalizeKey(item.name), item])),
    [studyLevels],
  );

  useEffect(() => {
    setLoading(true);

    Promise.allSettled([
      getConsultantServices({ scope: "mine" }),
      getCountries(),
      getServices(),
      getStudyLevels(),
      getConsultantSubjects(),
    ])
      .then(([serviceResult, countryResult, categoryResult, studyLevelResult, subjectResult]) => {
        const serviceData = takeFulfilledValue(serviceResult) ?? [];
        const countryData = takeFulfilledValue(countryResult) ?? [];
        const categoryData = takeFulfilledValue(categoryResult) ?? [];
        const studyLevelData = takeFulfilledValue(studyLevelResult) ?? [];
        const subjectData = takeFulfilledValue(subjectResult) ?? [];

        const activeCategories = categoryData.filter((item) => item.status === "active");
        const activeStudyLevels = studyLevelData.filter((item) => item.status === "active");

        setCountries(countryData);
        setServiceCategories(activeCategories);
        setStudyLevels(activeStudyLevels);
        setSubjects(subjectData);

        if (isEditing) {
          const targetService = serviceData.find((item) => item.id === editId);

          if (targetService) {
            const serviceNames = targetService.service_category_names?.length
              ? targetService.service_category_names
              : resolveNamesFromIds(targetService.service_categories, activeCategories);

            const levelNames = targetService.study_level_names?.length
              ? targetService.study_level_names
              : resolveNamesFromIds(targetService.study_levels, activeStudyLevels);

            setForm({
              title: targetService.title,
              description: targetService.description,
              country_input: targetService.country_name ?? "",
              status: targetService.status,
              service_names: serviceNames,
              service_metrics: serviceNames.map((serviceName) => ({
                service_name: serviceName,
                price: targetService.price ?? "",
                duration: targetService.duration,
              })),
              study_level_names: levelNames,
              subject_names: targetService.subject_names ?? [],
            });
          } else {
            setForm(createBlankForm());
            showToast({
              variant: "warning",
              title: "Service not found",
              message: "The requested service could not be loaded for editing.",
            });
          }
        } else {
          setForm(createBlankForm());
        }

        const failedKeys = [
          serviceResult.status === "rejected" ? "services" : null,
          countryResult.status === "rejected" ? "countries" : null,
          categoryResult.status === "rejected" ? "service categories" : null,
          studyLevelResult.status === "rejected" ? "study levels" : null,
          subjectResult.status === "rejected" ? "subjects" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some suggestions could not sync",
            message: `Using fallback suggestions while ${failedKeys.join(", ")} are unavailable from the API.`,
          });
        }
      })
      .finally(() => setLoading(false));
  }, [editId, isEditing, showToast]);

  const updateForm = (
    field: "title" | "description" | "country_input" | "status",
    value: string,
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateServiceMetric = (
    serviceName: string,
    field: "price" | "duration",
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      service_metrics: current.service_metrics.map((item) =>
        normalizeKey(item.service_name) === normalizeKey(serviceName)
          ? { ...item, [field]: value }
          : item,
      ),
    }));
  };

  const resolveCountryMatch = async () => {
    const currentMatch = countryByName.get(normalizeKey(form.country_input));
    if (currentMatch) {
      return currentMatch;
    }

    try {
      const refreshedCountries = await getCountries();
      setCountries(refreshedCountries);

      return refreshedCountries.find(
        (item) => normalizeKey(item.name) === normalizeKey(form.country_input),
      ) ?? null;
    } catch {
      return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const matchedCountry = await resolveCountryMatch();

    if (!matchedCountry) {
      showToast({
        variant: "warning",
        title: "Select a valid country",
        message: countries.length === 0
          ? "The country catalog is unavailable right now. Reload and try again once countries sync."
          : "Choose a country from the synced catalog suggestions before publishing.",
      });
      return;
    }

    if (form.service_names.length === 0) {
      showToast({
        variant: "warning",
        title: "Select service categories",
        message: "Pick at least one service from the suggestions.",
      });
      return;
    }

    const selectedServiceEntries = form.service_names
      .map((serviceName) => {
        const serviceId = serviceByName.get(normalizeKey(serviceName))?.id;
        const metric = form.service_metrics.find(
          (item) => normalizeKey(item.service_name) === normalizeKey(serviceName),
        );

        return {
          serviceName,
          serviceId,
          price: normalizeText(metric?.price ?? ""),
          duration: normalizeText(metric?.duration ?? ""),
        };
      })
      .filter(
        (item): item is { serviceName: string; serviceId: number; price: string; duration: string } =>
          typeof item.serviceId === "number",
      );

    if (selectedServiceEntries.length === 0) {
      showToast({
        variant: "warning",
        title: "Select service categories",
        message: "Pick services from the catalog suggestions so they can be saved correctly.",
      });
      return;
    }

    const incompleteService = selectedServiceEntries.find((item) => !item.price || !item.duration);

    if (incompleteService) {
      showToast({
        variant: "warning",
        title: "Add service charge and duration",
        message: `Enter both charge and duration for ${incompleteService.serviceName}.`,
      });
      return;
    }

    const selectedStudyLevelIds = Array.from(
      new Set(
        form.study_level_names
          .map((name) => studyLevelByName.get(normalizeKey(name))?.id)
          .filter((id): id is number => typeof id === "number"),
      ),
    );

    if (selectedStudyLevelIds.length === 0) {
      showToast({
        variant: "warning",
        title: "Select study levels",
        message: "Pick at least one study level from the suggestions.",
      });
      return;
    }

    const subject_names_input = buildSuggestionList(form.subject_names, { sort: false });

    if (subject_names_input.length === 0) {
      showToast({
        variant: "warning",
        title: "Add subjects",
        message: "Add at least one subject for this service.",
      });
      return;
    }

    const payloadBase = {
      title: normalizeText(form.title),
      description: normalizeText(form.description),
      country_id: matchedCountry.id,
      status: form.status,
      study_levels: selectedStudyLevelIds,
      subject_names_input,
    };

    setSubmitting(true);

    try {
      if (isEditing && editId) {
        const [primaryService, ...additionalServices] = selectedServiceEntries;

        await updateConsultantService(editId, {
          ...payloadBase,
          price: primaryService.price,
          duration: primaryService.duration,
          service_categories: [primaryService.serviceId],
        });

        for (const serviceEntry of additionalServices) {
          await createConsultantService({
            ...payloadBase,
            price: serviceEntry.price,
            duration: serviceEntry.duration,
            service_categories: [serviceEntry.serviceId],
          });
        }
      } else {
        for (const serviceEntry of selectedServiceEntries) {
          await createConsultantService({
            ...payloadBase,
            price: serviceEntry.price,
            duration: serviceEntry.duration,
            service_categories: [serviceEntry.serviceId],
          });
        }
      }

      showToast({
        variant: "success",
        title: isEditing ? "Services updated" : "Services published",
        message: isEditing
          ? "Your service changes were saved service-wise."
          : `${selectedServiceEntries.length} consultant service${selectedServiceEntries.length > 1 ? "s were" : " was"} published successfully.`,
      });

      router.push("/dashboard/consultant/services");
      router.refresh();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Service save failed",
        message: getApiErrorMessage(error, "Unable to save this service."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href="/dashboard/consultant">Dashboard</Link>
        <i className="fa-solid fa-chevron-right" />
        <Link href={"/dashboard/consultant/services" as Route}>Services</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>{isEditing ? "Edit Service" : "Create Service"}</span>
      </div>

      <section className="sd-card sd-card--allow-overflow sd-service-builder-card">
        <div className="sd-card-header sd-service-builder-head">
          <div className="sd-service-builder-title-wrap">
            <h3 className="sd-service-builder-title">
              <i className="fa-solid fa-clipboard-list" />
              <span>{isEditing ? "Update Your Service" : "Create Your Service"}</span>
            </h3>
            <p>Create and publish consultant services with searchable country, service, study level, and subject suggestions.</p>
          </div>

          <Link href={"/dashboard/consultant/services" as Route} className="sd-btn-outline">
            Back to Services
          </Link>
        </div>

        {loading ? (
          <p className="sd-loading">Loading service form...</p>
        ) : (
          <div className="sd-form-section sd-service-form-section">
            <form className="sd-form-grid sd-form-grid--services" onSubmit={handleSubmit}>
              <SuggestionInput
                label="Select Country"
                placeholder="Type or click to select a country..."
                value={form.country_input}
                suggestions={countrySuggestions}
                required
                allowCustom={false}
                helper="Country must be selected from catalog suggestions."
                onChange={(value) => updateForm("country_input", value)}
              />

              <MultiSuggestionInput
                label="Select Services"
                placeholder="Search and select services..."
                values={form.service_names}
                suggestions={serviceSuggestions}
                required
                allowCustom={false}
                helper="Select one or more service categories."
                onChange={(values) =>
                  setForm((current) => ({
                    ...current,
                    service_names: values,
                    service_metrics: syncServiceMetrics(values, current.service_metrics),
                  }))
                }
              />

              {form.service_names.length > 0 ? (
                <div className="sd-form-full">
                  <label className="sd-label">Service Wise Charge and Duration</label>
                  <div className="sd-service-metrics-grid">
                    {form.service_metrics.map((item) => (
                      <div key={item.service_name} className="sd-service-metric-card">
                        <h4>{item.service_name}</h4>
                        <div className="sd-service-metric-fields">
                          <div>
                            <label className="sd-label">Duration</label>
                            <div className="sd-service-icon-field">
                              <i className="fa-regular fa-clock" />
                              <input
                                className="sd-field"
                                placeholder="Enter the time/days you will take"
                                value={item.duration}
                                onChange={(event) => updateServiceMetric(item.service_name, "duration", event.target.value)}
                                required
                              />
                            </div>
                          </div>

                          <div>
                            <label className="sd-label">Charge (BDT)</label>
                            <div className="sd-service-icon-field">
                              <i className="fa-solid fa-bangladeshi-taka-sign" />
                              <input
                                className="sd-field"
                                inputMode="decimal"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="Enter the service charge"
                                value={item.price}
                                onChange={(event) => updateServiceMetric(item.service_name, "price", event.target.value)}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="sd-form-helper">Each selected service category is saved with its own charge and duration.</p>
                </div>
              ) : null}

              <div className="sd-form-full">
                <label className="sd-label">Title of Your Service</label>
                <div className="sd-service-icon-field">
                  <i className="fa-solid fa-quote-left" />
                  <input
                    className="sd-field"
                    placeholder="Enter the title of service"
                    value={form.title}
                    maxLength={MAX_TITLE_LENGTH}
                    onChange={(event) => updateForm("title", event.target.value)}
                    required
                  />
                </div>
                <div className="sd-field-meta">
                  <span className="sd-form-helper">Keep it short and outcome-driven so students can understand fast.</span>
                  <span className="sd-field-counter">{form.title.length} / {MAX_TITLE_LENGTH}</span>
                </div>
              </div>

              <MultiSuggestionInput
                label="Select Subjects"
                placeholder="Search and select subjects..."
                values={form.subject_names}
                suggestions={subjectSuggestions}
                required
                helper="Suggestions come from the shared subject catalog and legacy common subjects. Custom subjects are also allowed."
                onChange={(values) => setForm((current) => ({ ...current, subject_names: values }))}
              />

              <MultiSuggestionInput
                label="Select Study Levels"
                placeholder="Search and select study levels..."
                values={form.study_level_names}
                suggestions={studyLevelSuggestions}
                required
                allowCustom={false}
                helper="Select one or more target study levels."
                onChange={(values) => setForm((current) => ({ ...current, study_level_names: values }))}
              />

              <div className="sd-form-full">
                <label className="sd-label">Description of Your Service</label>
                <textarea
                  className="sd-field"
                  rows={6}
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  placeholder="Enter the description of your service"
                  value={form.description}
                  onChange={(event) => updateForm("description", event.target.value)}
                  required
                />
                <div className="sd-field-meta">
                  <span className="sd-form-helper">Describe process, timeline, and what students can expect from your support.</span>
                  <span className="sd-field-counter">{form.description.length} / {MAX_DESCRIPTION_LENGTH}</span>
                </div>
              </div>

              <div>
                <label className="sd-label">Status</label>
                <select
                  className="sd-field"
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                >
                  <option value="active">Active</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div className="sd-form-actions">
                <button type="submit" className="sd-btn-primary" disabled={submitting}>
                  {submitting ? "Saving..." : isEditing ? "Update Service" : "Publish"}
                </button>
                <Link href={"/dashboard/consultant/services" as Route} className="sd-btn-outline">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        )}
      </section>
    </div>
  );
}
