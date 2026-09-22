"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useLang } from "@/components/layout/lang-provider";
import { useToast } from "@/components/layout/toast-provider";
import { createAssessment } from "@/lib/api/assessments";
import { getApiErrorMessage } from "@/lib/api/client";
import { getConsultantServices, type ConsultantService } from "@/lib/api/consultants";
import { getStudentChoices, type StudentChoice } from "@/lib/api/students";
import { formatDurationDays } from "@/lib/formatters";

type QueryState = {
  initialized: boolean;
  serviceId: number | null;
  choiceId: number | null;
};

function parsePositiveNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return parsed;
}

function formatBudget(value?: string | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "Not specified";
  return `${amount.toLocaleString("en-BD")} BDT`;
}

function formatPrice(value?: string | number | null) {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) return "0 BDT";
  return `${amount.toLocaleString("en-BD")} BDT`;
}

function getChoiceSortValue(choice: StudentChoice) {
  if (!choice.created_at) return 0;
  const parsed = new Date(choice.created_at);
  return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime();
}

export function StudentDirectRequest() {
  const { t } = useLang();
  const router = useRouter();
  const { showToast } = useToast();

  const [queryState, setQueryState] = useState<QueryState>({
    initialized: false,
    serviceId: null,
    choiceId: null,
  });
  const [choices, setChoices] = useState<StudentChoice[]>([]);
  const [service, setService] = useState<ConsultantService | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingChoiceId, setSubmittingChoiceId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const serviceId = parsePositiveNumber(params.get("service_id"));
    const choiceId = parsePositiveNumber(params.get("choice_id"));

    setQueryState({
      initialized: true,
      serviceId,
      choiceId,
    });
  }, []);

  useEffect(() => {
    if (!queryState.initialized) return;

    if (!queryState.serviceId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    Promise.allSettled([
      getStudentChoices(),
      getConsultantServices({ scope: "public" }),
    ])
      .then(([choicesResult, servicesResult]) => {
        const loadedChoices = choicesResult.status === "fulfilled" ? choicesResult.value : [];
        const loadedServices = servicesResult.status === "fulfilled" ? servicesResult.value : [];

        setChoices(loadedChoices);
        setService(loadedServices.find((item) => item.id === queryState.serviceId) ?? null);

        const failedKeys = [
          choicesResult.status === "rejected" ? "choices" : null,
          servicesResult.status === "rejected" ? "consultant services" : null,
        ].filter((item): item is string => Boolean(item));

        if (failedKeys.length > 0) {
          showToast({
            variant: "warning",
            title: "Some request data could not sync",
            message: `The page loaded with partial data while ${failedKeys.join(", ")} were unavailable.`,
          });
        }
      })
      .catch((error) => {
        showToast({
          variant: "error",
          title: "Unable to load direct request page",
          message: getApiErrorMessage(error, "Please try again in a moment."),
        });
      })
      .finally(() => setLoading(false));
  }, [queryState.initialized, queryState.serviceId, showToast]);

  const sortedChoices = useMemo(
    () => [...choices].sort((left, right) => getChoiceSortValue(right) - getChoiceSortValue(left)),
    [choices],
  );

  const prioritizedChoices = useMemo(() => {
    if (!queryState.choiceId) return sortedChoices;

    return [...sortedChoices].sort((left, right) => {
      const leftMatch = left.id === queryState.choiceId ? 1 : 0;
      const rightMatch = right.id === queryState.choiceId ? 1 : 0;
      return rightMatch - leftMatch;
    });
  }, [queryState.choiceId, sortedChoices]);

  const handleSendRequest = async (choice: StudentChoice) => {
    if (!service) return;

    setSubmittingChoiceId(choice.id);

    try {
      await createAssessment({
        choice: choice.id,
        consultant_service_id: service.id,
        preferred_country_id: choice.country_id,
        preferred_institute: choice.institute,
        preferred_subject: choice.subject,
        preferred_session: choice.session,
        student_budget: choice.budget,
        assessment_charge: service.price,
        assessment_duration: service.duration,
        assessment_title: service.title,
        assessment_description: service.description,
      });

      showToast({
        variant: "success",
        title: "Request sent",
        message: "Your consultant request has been sent successfully.",
      });

      router.push("/dashboard/student/assessments" as Route);
      router.refresh();
    } catch (error) {
      showToast({
        variant: "error",
        title: "Request failed",
        message: getApiErrorMessage(error, "Unable to submit this request right now."),
      });
    } finally {
      setSubmittingChoiceId(null);
    }
  };

  return (
    <div className="sd-section-stack">
      <div className="sd-breadcrumb">
        <Link href={"/dashboard/student" as Route}>{t("dash_dashboard")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <Link href={"/dashboard/consultants-of-eduwise" as Route}>{t("choice_choose_consultant")}</Link>
        <i className="fa-solid fa-chevron-right" />
        <span>Send Request</span>
      </div>

      {!queryState.initialized || loading ? (
        <div className="sd-loading">Loading request page...</div>
      ) : !queryState.serviceId ? (
        <div className="sd-empty-state sd-empty-state--consultants">
          <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="No request target" />
          <p className="sd-empty-title">Missing consultant service</p>
          <p className="sd-empty-help">Please choose a consultant service first, then try Request again.</p>
          <Link href={"/dashboard/consultants-of-eduwise" as Route} className="sd-btn-primary">
            Back to consultants
          </Link>
        </div>
      ) : !service ? (
        <div className="sd-empty-state sd-empty-state--consultants">
          <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="Service not found" />
          <p className="sd-empty-title">Service not found</p>
          <p className="sd-empty-help">The selected consultant service is no longer available.</p>
          <Link href={"/dashboard/consultants-of-eduwise" as Route} className="sd-btn-primary">
            Choose another consultant
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-5 md:flex-row md:items-start">
              <img
                src={service.consultant_image ?? "/legacy/no-profile-img.png"}
                alt={service.consultant_name ?? "Consultant"}
                className="h-24 w-24 rounded-full border-4 border-[var(--legacy-primary)] object-cover"
              />

              <div className="flex-1">
                <h3 className="text-xl font-bold text-slate-800">{service.title}</h3>
                <p className="mt-1 text-base font-semibold text-[var(--legacy-primary)]">
                  <i className="fa-solid fa-user mr-2" aria-hidden="true" />
                  {service.consultant_name ?? "Shetu Consultant"}
                </p>

                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="sd-chip sd-chip--success">{formatPrice(service.price)}</span>
                  <span className="sd-chip sd-chip--topic">{service.service_category_names?.[0] ?? "Consulting"}</span>
                  <span className="sd-chip sd-chip--muted">{service.country_name ?? "Country"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start rounded-lg bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
                <i className="fa-regular fa-clock" aria-hidden="true" />
                {formatDurationDays(service.duration)}
              </div>
            </div>
          </section>

          <section className="sd-card">
            <div className="sd-card-header">
              <div className="sd-card-header-left">
                <i className="fa-solid fa-layer-group sd-subheader-icon" aria-hidden="true" />
                <h3>Select Your Choice</h3>
              </div>
            </div>

            {prioritizedChoices.length === 0 ? (
              <div className="sd-empty-state">
                <img src="/legacy/Frontend/assets/img/icon/no-data.png" alt="No choices" />
                <p className="sd-empty-title">No saved choices found</p>
                <p className="sd-empty-help">Create a study choice first, then you can send consultant requests.</p>
                <Link href={"/dashboard/student/choices/create" as Route} className="sd-btn-primary mt-4">
                  {t("choice_create_btn")}
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-left text-sm font-semibold text-slate-700">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Service</th>
                      <th className="px-4 py-3">Country</th>
                      <th className="px-4 py-3">Institute</th>
                      <th className="px-4 py-3">Subject</th>
                      <th className="px-4 py-3">Budget</th>
                      <th className="px-4 py-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prioritizedChoices.map((choice, index) => {
                      const isSubmitting = submittingChoiceId === choice.id;
                      const isPreferred = queryState.choiceId === choice.id;

                      return (
                        <tr
                          key={choice.id}
                          className={`border-b border-slate-100 text-sm text-slate-700 ${isPreferred ? "bg-indigo-50" : "bg-white"}`}
                        >
                          <td className="px-4 py-3">{index + 1}</td>
                          <td className="px-4 py-3 font-semibold">{choice.service_name || "Service"}</td>
                          <td className="px-4 py-3">{choice.country_name || "Country"}</td>
                          <td className="px-4 py-3">{choice.institute || "Not specified"}</td>
                          <td className="px-4 py-3">{choice.subject || "Not specified"}</td>
                          <td className="px-4 py-3">{formatBudget(choice.budget)}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              className="sd-btn-primary sd-btn-sm"
                              onClick={() => void handleSendRequest(choice)}
                              disabled={submittingChoiceId !== null}
                            >
                              {isSubmitting ? "Sending..." : "Send Request"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
