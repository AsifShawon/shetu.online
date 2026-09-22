"use client";

import type { Route } from "next";
import Link from "next/link";
import { useEffect, useState } from "react";

import { useAuth } from "@/components/layout/auth-provider";
import { useLang } from "@/components/layout/lang-provider";
import { getAssessments } from "@/lib/api/assessments";
import { getQuotations } from "@/lib/api/marketplace";
import { getWalletTransactions, type WalletTransaction } from "@/lib/api/payments";
import { getStudentChoices, type StudentChoice } from "@/lib/api/students";

const STATUS_CLASS: Record<string, string> = {
  completed: "sd-status sd-status--green",
  approved: "sd-status sd-status--green",
  accepted: "sd-status sd-status--blue",
  rejected: "sd-status sd-status--red",
  submitted: "sd-status sd-status--purple",
  pending: "sd-status sd-status--yellow",
  revision_requested: "sd-status sd-status--yellow",
  proposal_pending: "sd-status sd-status--purple",
};

export function StudentOverview() {
  const { user } = useAuth();
  const { lang } = useLang();
  const [choices, setChoices] = useState<StudentChoice[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [assessments, setAssessments] = useState<
    Array<{
      id: number;
      assessment_title: string;
      status: string;
      consultant_name?: string;
      country_name?: string;
      service_title?: string;
      preferred_subject?: string;
      preferred_institute?: string;
    }>
  >([]);
  const [quotations, setQuotations] = useState<Array<{ id: number; consultant_name?: string }>>([]);

  useEffect(() => {
    if (!user) {
      setChoices([]);
      setTransactions([]);
      setAssessments([]);
      setQuotations([]);
      return;
    }

    Promise.all([getStudentChoices(), getWalletTransactions(), getAssessments(), getQuotations()])
      .then(([studentChoices, txns, assessmentRows, quoteRows]) => {
        setChoices(studentChoices);
        setTransactions(txns);
        setAssessments(assessmentRows.slice(0, 6) as typeof assessments);
        setQuotations(quoteRows.slice(0, 12).map((item) => ({ id: item.id, consultant_name: item.consultant_name })));
      })
      .catch(() => null);
  }, [user]);

  const recentChoices = choices.slice(0, 4);
  const assessmentRows = assessments.slice(0, 5);
  const sortedTransactions = [...transactions].sort((left, right) => {
    const leftDate = left.created_at ? new Date(left.created_at).getTime() : 0;
    const rightDate = right.created_at ? new Date(right.created_at).getTime() : 0;
    return rightDate - leftDate;
  });
  const lastDeposit = sortedTransactions.find((item) => item.transaction_type === "cash_in");
  const lastTransaction = sortedTransactions[0];
  const totalIn = transactions
    .filter((item) => item.transaction_type === "cash_in")
    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  const totalOut = transactions
    .filter((item) => item.transaction_type === "cash_out")
    .reduce((sum, item) => sum + parseFloat(item.amount || "0"), 0);
  const balanceValue = totalIn - totalOut;
  const totalMovement = totalIn + totalOut;

  const consultantNames = Array.from(
    new Set(quotations.map((item) => item.consultant_name).filter((name): name is string => Boolean(name))),
  ).slice(0, 6);

  const isBangla = lang === "bn";
  const copy = isBangla
    ? {
        lastDeposit: "সর্বশেষ জমা",
        lastTransaction: "সর্বশেষ লেনদেন",
        totalTransaction: "মোট লেনদেন",
        balance: "ব্যালেন্স",
        addMoney: "টাকা যোগ করুন",
        recentChoices: "সাম্প্রতিক পছন্দ",
        noChoices: "এখনও কোনো স্টাডি চয়েজ যোগ করা হয়নি।",
        countryFallback: "দেশ",
        serviceFallback: "সেবা",
        institute: "ইনস্টিটিউট",
        subjectFallback: "ইঞ্জিনিয়ারিং",
        instituteFallback: "উল্লেখ করা হয়নি",
        recommendedConsultants: "প্রস্তাবিত কনসালটেন্ট",
        consultantsCopy: "অভিজ্ঞ কনসালটেন্টরা আপনার স্টাডি অ্যাব্রড যাত্রার প্রতিটি ধাপে গাইড করতে প্রস্তুত। এখনই যোগাযোগ করুন।",
        noConsultants: "এখনও কোনো কনসালটেন্ট সাজেশন নেই।",
        seeAllConsultants: "সব কনসালটেন্ট দেখুন",
        assessmentUpdate: "অ্যাসেসমেন্ট আপডেট",
        service: "সেবা",
        country: "দেশ",
        subject: "বিষয়",
        studyLevel: "স্টাডি লেভেল",
        assessment: "অ্যাসেসমেন্ট",
        status: "স্ট্যাটাস",
        noAssessments: "এখনও কোনো অ্যাসেসমেন্ট আপডেট নেই।",
        consultantFallback: "কনসালটেন্ট",
        assessmentServiceFallback: "অ্যাসেসমেন্ট সেবা",
        undergraduate: "আন্ডারগ্র্যাজুয়েট",
        seeRevised: "সংশোধিতটি দেখুন",
        open: "খুলুন",
      }
    : {
        lastDeposit: "Last Deposit",
        lastTransaction: "Last Transaction",
        totalTransaction: "Total Transaction",
        balance: "Balance",
        addMoney: "Add Money",
        recentChoices: "Recent Choices",
        noChoices: "No study choices added yet.",
        countryFallback: "Country",
        serviceFallback: "Service",
        institute: "Institute",
        subjectFallback: "Engineering",
        instituteFallback: "Not specified",
        recommendedConsultants: "Recommended Consultants",
        consultantsCopy: "Our experienced consultants are here to guide and support you through each stage of your study abroad journey. Reach out now!",
        noConsultants: "No consultant recommendations yet.",
        seeAllConsultants: "See All Consultants",
        assessmentUpdate: "Assessment Update",
        service: "Service",
        country: "Country",
        subject: "Subject",
        studyLevel: "Study level",
        assessment: "Assessment",
        status: "Status",
        noAssessments: "No assessment updates yet.",
        consultantFallback: "Consultant",
        assessmentServiceFallback: "Assessment Service",
        undergraduate: "Undergraduate",
        seeRevised: "See Revised",
        open: "Open",
      };
  const statusLabels: Record<string, string> = isBangla
    ? {
        completed: "সম্পন্ন",
        approved: "অনুমোদিত",
        accepted: "গৃহীত",
        rejected: "প্রত্যাখ্যাত",
        submitted: "জমা দেওয়া হয়েছে",
        pending: "অপেক্ষমাণ",
        revision_requested: "সংশোধন চাওয়া হয়েছে",
        proposal_pending: "প্রস্তাব অপেক্ষমাণ",
      }
    : {
        completed: "Completed",
        approved: "Approved",
        accepted: "Accepted",
        rejected: "Rejected",
        submitted: "Submitted",
        pending: "Pending",
        revision_requested: "Revision requested",
        proposal_pending: "Proposal pending",
      };
  const formatMoney = (value: number) =>
    value.toLocaleString(isBangla ? "bn-BD" : "en-BD", { maximumFractionDigits: 0 });
  const formatBudget = (value?: string) => {
    if (!value) return isBangla ? "৳ ০" : "BDT 0";
    return /bdt|৳/i.test(value) ? value : isBangla ? `৳ ${value}` : `${value} BDT`;
  };

  return (
    <div className="sd-section-stack sd-student-dashboard-body">
      <section className="sd-student-balance-strip">
        <div className="sd-student-balance-metrics">
          <div className="sd-student-balance-item">
            <span className="sd-student-balance-icon sd-student-balance-icon--amber">
              <i className="fa-solid fa-coins" />
            </span>
            <div>
              <p>{copy.lastDeposit}</p>
              <strong>BDT {formatMoney(lastDeposit ? parseFloat(lastDeposit.amount || "0") : 0)}</strong>
            </div>
          </div>
          <div className="sd-student-balance-item">
            <span className="sd-student-balance-icon sd-student-balance-icon--rose">
              <i className="fa-regular fa-flag" />
            </span>
            <div>
              <p>{copy.lastTransaction}</p>
              <strong>BDT {formatMoney(lastTransaction ? parseFloat(lastTransaction.amount || "0") : 0)}</strong>
            </div>
          </div>
          <div className="sd-student-balance-item">
            <span className="sd-student-balance-icon sd-student-balance-icon--blue">
              <i className="fa-regular fa-handshake" />
            </span>
            <div>
              <p>{copy.totalTransaction}</p>
              <strong>BDT {formatMoney(totalMovement)}</strong>
            </div>
          </div>
        </div>

        <div className="sd-student-balance-summary">
          <p>{copy.balance}</p>
          <strong>BDT {formatMoney(balanceValue)}</strong>
          <Link href="/dashboard/student/wallet" className="sd-btn-primary sd-btn-pill">
            <i className="fa-solid fa-plus" />
            {copy.addMoney}
          </Link>
        </div>
      </section>

      <section className="sd-student-overview-grid">
        <div className="sd-student-surface sd-student-surface--choices">
          <div className="sd-student-surface-head">
            <h2>{copy.recentChoices}</h2>
            <span>{String(recentChoices.length).padStart(2, "0")}</span>
          </div>

          <div className="sd-student-choice-list">
            {recentChoices.length === 0 ? (
              <p className="sd-empty-inline">{copy.noChoices}</p>
            ) : (
              recentChoices.map((choice, index) => (
                <div className="sd-student-choice-card" key={choice.id}>
                  <div className="sd-student-choice-index">{String(index + 1).padStart(2, "0")}</div>
                  <div className="sd-student-choice-main">
                    <strong>{choice.country_name ?? copy.countryFallback}</strong>
                    <span>{choice.service_name ?? copy.serviceFallback}</span>
                  </div>
                  <div className="sd-student-choice-budget">
                    <strong>{formatBudget(choice.budget)}</strong>
                    <span>{choice.subject || copy.subjectFallback}</span>
                  </div>
                  <div className="sd-student-choice-institute">
                    <strong>{copy.institute}</strong>
                    <span>{choice.institute || copy.instituteFallback}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="sd-student-surface sd-student-surface--consultants">
          <div className="sd-student-surface-head">
            <h2>{copy.recommendedConsultants}</h2>
          </div>
          <p className="sd-student-consultants-copy">{copy.consultantsCopy}</p>

          <div className="sd-student-consultant-list">
            {consultantNames.length === 0 ? (
              <p className="sd-empty-inline">{copy.noConsultants}</p>
            ) : (
              consultantNames.map((name) => (
                <div className="sd-student-consultant-card" key={name}>
                  <img src="/legacy/no-profile-img.png" alt={name} />
                  <strong>{name}</strong>
                </div>
              ))
            )}
          </div>

          <Link href={"/dashboard/consultants-of-eduwise" as Route} className="sd-btn-primary sd-student-consultants-cta">
            {copy.seeAllConsultants}
          </Link>
        </div>
      </section>

      <section className="sd-student-assessment-overview">
        <div className="sd-student-surface sd-student-surface--table">
          <div className="sd-student-surface-head sd-student-surface-head--table">
            <h2>{copy.assessmentUpdate}</h2>
            <span>{String(assessmentRows.length).padStart(2, "0")}</span>
          </div>

          <div className="sd-student-assessment-table-head">
            <span>{copy.service}</span>
            <span>{copy.country}</span>
            <span>{copy.subject}</span>
            <span>{copy.studyLevel}</span>
            <span>{copy.assessment}</span>
            <span>{copy.status}</span>
          </div>

          {assessmentRows.length === 0 ? (
            <p className="sd-empty-inline">{copy.noAssessments}</p>
          ) : (
            assessmentRows.map((assessment) => (
              <div className="sd-student-assessment-row" key={assessment.id}>
                <div className="sd-student-assessment-service">
                  <img src="/legacy/no-profile-img.png" alt={assessment.consultant_name ?? copy.consultantFallback} />
                  <div>
                    <strong>{assessment.consultant_name ?? copy.consultantFallback}</strong>
                    <span>{assessment.service_title ?? copy.assessmentServiceFallback}</span>
                  </div>
                </div>
                <span>{assessment.country_name ?? copy.countryFallback}</span>
                <span>{assessment.preferred_subject ?? copy.subjectFallback}</span>
                <span>{copy.undergraduate}</span>
                <Link
                  href={`/dashboard/student/assessments/${assessment.id}` as Route}
                  className="sd-student-assessment-link"
                >
                  <i className="fa-regular fa-eye" />
                  {assessment.status === "revision_requested" ? copy.seeRevised : copy.open}
                </Link>
                <span className={STATUS_CLASS[assessment.status] ?? "sd-status sd-status--yellow"}>
                  {statusLabels[assessment.status] ?? assessment.status.replace(/_/g, " ")}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
