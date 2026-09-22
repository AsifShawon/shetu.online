"use client";

import type { Route } from "next";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  GraduationCap,
  MapPin,
  Search,
  Sparkles,
  Star,
  Wallet,
} from "lucide-react";

import { useLang } from "@/components/layout/lang-provider";
import {
  getMediaUrl,
} from "@/lib/api/client";
import {
  getCountries,
  getEducationalInfoList,
  getStudyLevels,
  getUniversities,
  type Country,
  type EducationalInfo,
  type StudyLevel,
  type University,
} from "@/lib/api/catalog";
import { getConsultantServices, type ConsultantService } from "@/lib/api/consultants";

import styles from "./catalog-search-results.module.css";

type ViewMode = "universities" | "programs";
type SortMode = "default" | "ranked" | "low";
type FilterSection = "country" | "university" | "studyLevel" | "duration" | "budget";

type ProgramResult = {
  id: number;
  title: string;
  universityName: string;
  location: string;
  countryName: string;
  countryImage: string | null;
  studyLevelName: string;
  budgetValue: number;
  scholarshipAvailable: boolean;
  scholarshipValue: number;
  durationYears: number;
  intakeLabel: string;
  image: string | null;
  entryScore: string;
  summary: string;
  searchBlob: string;
};

type UniversityResult = {
  key: string;
  name: string;
  image: string | null;
  countryName: string;
  countryImage: string | null;
  locations: string[];
  programCount: number;
  studyLevels: string[];
  scholarshipCount: number;
  maxScholarship: number;
  minBudget: number;
  maxBudget: number;
  featuredProgram: string;
  firstProgramId: number;
  searchBlob: string;
};

type ConsultantMatch = {
  consultantId: number;
  consultantName: string;
  consultantImage: string | null;
  consultantRating: number;
  reviewCount: number;
  verificationStatus: string;
  subscriptionStatus: string;
  countryNames: string[];
  countryImage: string | null;
  serviceTitles: string[];
  servicePriceMin: number;
  servicePriceMax: number;
  durations: string[];
  subjectNames: string[];
  studyLevels: string[];
  profileSummary: string;
  searchBlob: string;
};

const RESULTS_PER_PAGE = 4;
const MAX_BUDGET = 100000;
const DURATION_OPTIONS = ["1 year", "2 years", "3 years", "4 years", "5 years"];
const HELP_AVATARS = [
  "/legacy/Frontend/dashboard/src/assets/images/users/avatar-1.jpg",
  "/legacy/Frontend/dashboard/src/assets/images/users/avatar-2.jpg",
  "/legacy/Frontend/dashboard/src/assets/images/users/avatar-3.jpg",
  "/legacy/Frontend/dashboard/src/assets/images/users/avatar-4.jpg",
];
const CONSULTANTS_PER_SECTION = 3;

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function parseAmount(value: string | number | null | undefined) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const numeric = Number(String(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function unique(items: string[]) {
  return [...new Set(items.filter(Boolean))];
}

function splitCsv(value: string | null) {
  if (!value) return [];
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function getInitials(value: string) {
  const parts = value.split(" ").filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "EW";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function guessDurationYears(studyLevelName: string, title: string) {
  const source = normalize(`${studyLevelName} ${title}`);
  if (source.includes("phd") || source.includes("doctor")) return 5;
  if (source.includes("bachelor") || source.includes("undergraduate")) return 4;
  if (source.includes("master") || source.includes("postgraduate") || source.includes("mba")) return 2;
  if (source.includes("vocational") || source.includes("diploma") || source.includes("certificate")) return 1;
  return 3;
}

function formatBudget(value: number, lang: "en" | "bn") {
  if (!Number.isFinite(value) || value <= 0) {
    return lang === "bn" ? "বাজেট জানানো হয়নি" : "Budget on request";
  }

  const locale = lang === "bn" ? "bn-BD" : "en-US";
  return `BDT ${value.toLocaleString(locale)} / year`;
}

function formatRange(min: number, max: number, lang: "en" | "bn") {
  if (min <= 0 && max <= 0) {
    return lang === "bn" ? "বাজেট জানানো হয়নি" : "Budget on request";
  }
  if (min > 0 && max > 0 && min !== max) {
    return `${formatBudget(min, lang).replace(" / year", "")} - ${formatBudget(max, lang).replace(" / year", "")}`;
  }
  return formatBudget(Math.max(min, max), lang).replace(" / year", "");
}

function formatLocations(locations: string[], lang: "en" | "bn") {
  if (locations.length === 0) return lang === "bn" ? "একাধিক লোকেশন" : "Multiple locations";
  if (locations.length === 1) return locations[0];
  return lang === "bn" ? "একাধিক লোকেশন" : "Multiple locations";
}

function getDefaultView(pathname: string, searchParams: URLSearchParams | ReturnType<typeof useSearchParams>): ViewMode {
  const explicit = searchParams.get("view");
  if (explicit === "universities" || explicit === "programs") return explicit;

  if (
    pathname.includes("your-selected-result-courses") ||
    pathname.includes("your-selected-result-Budget") ||
    pathname.includes("your-selected-result-scholarship")
  ) {
    return "programs";
  }

  if (pathname === "/your-search-result") {
    if (searchParams.get("studyLevel") || searchParams.get("course") || searchParams.get("q")) {
      return "programs";
    }
  }

  return "universities";
}

function getDefaultScholarship(pathname: string, searchParams: URLSearchParams | ReturnType<typeof useSearchParams>) {
  const explicit = searchParams.get("scholarship");
  if (explicit === "1") return true;
  if (explicit === "0") return false;
  return pathname.includes("your-selected-result-scholarship");
}

function getDefaultSort(
  pathname: string,
  view: ViewMode,
  searchParams: URLSearchParams | ReturnType<typeof useSearchParams>,
): SortMode {
  const explicit = searchParams.get("sort");
  if (explicit === "default" || explicit === "ranked" || explicit === "low") return explicit;
  if (view === "programs" && pathname.includes("your-selected-result-Budget")) return "low";
  return "default";
}

function buildUrl(
  pathname: string,
  params: {
    view: ViewMode;
    keyword: string;
    country: string;
    university: string;
    studyLevel: string;
    durations: string[];
    budget: number;
    scholarship: boolean;
    sort: SortMode;
    page: number;
  },
) {
  const query = new URLSearchParams();

  query.set("view", params.view);
  if (params.keyword.trim()) query.set("keyword", params.keyword.trim());
  if (params.country.trim()) query.set("country", params.country.trim());
  if (params.university.trim()) query.set("university", params.university.trim());
  if (params.studyLevel.trim()) query.set("studyLevel", params.studyLevel.trim());
  if (params.durations.length > 0) query.set("duration", params.durations.join(","));
  if (params.view === "programs" && params.budget > 0) query.set("budget", String(params.budget));
  if (params.scholarship) query.set("scholarship", "1");
  if (params.sort !== "default") query.set("sort", params.sort);
  if (params.page > 1) query.set("page", String(params.page));

  const queryString = query.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function CatalogSearchResults() {
  const { lang } = useLang();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [countries, setCountries] = useState<Country[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [educationalInfo, setEducationalInfo] = useState<EducationalInfo[]>([]);
  const [consultantServices, setConsultantServices] = useState<ConsultantService[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentView = getDefaultView(pathname, searchParams);
  const keywordFilter = searchParams.get("keyword") ?? searchParams.get("course") ?? searchParams.get("q") ?? "";
  const countryFilter = searchParams.get("country") ?? "";
  const universityFilter = searchParams.get("university") ?? "";
  const studyLevelFilter = searchParams.get("studyLevel") ?? "";
  const durationFilter = splitCsv(searchParams.get("duration"));
  const budgetFilter = Math.max(0, Math.min(MAX_BUDGET, Number(searchParams.get("budget") ?? "0") || 0));
  const scholarshipOnly = getDefaultScholarship(pathname, searchParams);
  const currentSort = getDefaultSort(pathname, currentView, searchParams);
  const currentPage = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const [countryDraft, setCountryDraft] = useState(countryFilter);
  const [universityDraft, setUniversityDraft] = useState(universityFilter);
  const [studyLevelDraft, setStudyLevelDraft] = useState(studyLevelFilter);
  const [durationDraft, setDurationDraft] = useState<string[]>(durationFilter);
  const [budgetDraft, setBudgetDraft] = useState(budgetFilter);
  const [scholarshipDraft, setScholarshipDraft] = useState(scholarshipOnly);
  const [openSection, setOpenSection] = useState<FilterSection | null>(
    currentView === "programs" ? "country" : "university",
  );

  useEffect(() => {
    setCountryDraft(countryFilter);
    setUniversityDraft(universityFilter);
    setStudyLevelDraft(studyLevelFilter);
    setDurationDraft(durationFilter);
    setBudgetDraft(budgetFilter);
    setScholarshipDraft(scholarshipOnly);
  }, [budgetFilter, countryFilter, durationFilter.join(","), scholarshipOnly, studyLevelFilter, universityFilter]);

  useEffect(() => {
    Promise.allSettled([
      getCountries(),
      getUniversities(),
      getStudyLevels(),
      getEducationalInfoList(),
      getConsultantServices({ scope: "public" }),
    ])
      .then(([countryResult, universityResult, studyLevelResult, infoResult, consultantResult]) => {
        if (countryResult.status === "fulfilled") {
          setCountries(countryResult.value.filter((item) => item.status === "active"));
        }
        if (universityResult.status === "fulfilled") {
          setUniversities(universityResult.value.filter((item) => item.status === "active"));
        }
        if (studyLevelResult.status === "fulfilled") {
          setStudyLevels(studyLevelResult.value.filter((item) => item.status === "active"));
        }
        if (infoResult.status === "fulfilled") {
          setEducationalInfo(infoResult.value.filter((item) => item.status === "active"));
        }
        if (consultantResult.status === "fulfilled") {
          setConsultantServices(consultantResult.value.filter((item) => item.status === "active"));
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const copy = lang === "bn"
    ? {
        headerLabel: "স্টাডি ম্যাচ",
        headerTitleUniversity: countryFilter ? `${countryFilter} এর সেরা বিশ্ববিদ্যালয়` : "সেরা বিশ্ববিদ্যালয় খুঁজুন",
        headerTitleProgram: studyLevelFilter ? `${studyLevelFilter} ডিগ্রি সারা বিশ্ব থেকে` : "সারা বিশ্বের প্রোগ্রাম খুঁজুন",
        headerBody: "দেশ, বিশ্ববিদ্যালয়, ডিগ্রি টাইপ, মেয়াদ এবং বাজেট ধরে রেজাল্ট শর্টলিস্ট করুন।",
        universitiesTab: "Universities",
        programsTab: "Programs",
        allUniversities: "All University",
        topRanked: "Top Ranked",
        allPrograms: "All Programs",
        lowTuition: "Low Tuition Fee",
        country: "Country",
        university: "University",
        degreeType: "Degree type",
        duration: "Duration",
        budget: "Budget",
        scholarship: "Scholarship",
        annualTuition: "Annual Tuition Fee",
        selectCountry: "Select Country",
        searchUniversity: "Search University",
        selectDegree: "Select degree",
        applyFilters: "Apply Filters",
        clearAll: "Clear all",
        universitiesCount: "Universities",
        programsCount: "Programs",
        onCampus: "On campus",
        fullTime: "Full time",
        programs: "Programs",
        tuitionRange: "Tuition range",
        scholarshipRate: "Scholarship rate",
        studyLevels: "Study levels",
        location: "Location",
        applyDate: "Apply date",
        scholarships: "Scholarships",
        exploreDetails: "Explore details",
        needHelp: "Need help?",
        helpBody: "আমাদের অভিজ্ঞ কনসালট্যান্টরা আপনাকে সঠিক দেশ, কোর্স এবং আবেদন রুট ঠিক করতে সাহায্য করবে।",
        consultants: "Our consultants",
        consultantTitle: "Matching consultants",
        consultantBody: "এই সার্চ রেজাল্ট অনুযায়ী যেসব কনসালট্যান্ট আপনাকে গাইড করতে পারবেন।",
        consultantAction: "View profile",
        consultantVerified: "Verified",
        consultantPro: "Pro",
        consultantServicesLabel: "Services",
        noResults: "কোনো ফল পাওয়া যায়নি",
        noResultsBody: "ফিল্টার একটু পরিবর্তন করুন বা সবগুলো রিসেট করুন।",
        loading: "রেজাল্ট লোড হচ্ছে...",
        selected: "Selected filters",
      }
    : {
        headerLabel: "Study Match",
        headerTitleUniversity: countryFilter ? `Top universities in ${countryFilter}` : "Top universities worldwide",
        headerTitleProgram: studyLevelFilter ? `${studyLevelFilter} degrees from all around the world` : "Programs from all around the world",
        headerBody: "Shortlist results by country, university, degree type, duration, and budget without leaving the page.",
        universitiesTab: "Universities",
        programsTab: "Programs",
        allUniversities: "All University",
        topRanked: "Top Ranked",
        allPrograms: "All Programs",
        lowTuition: "Low Tuition Fee",
        country: "Country",
        university: "University",
        degreeType: "Degree type",
        duration: "Duration",
        budget: "Budget",
        scholarship: "Scholarship",
        annualTuition: "Annual Tuition Fee",
        selectCountry: "Select Country",
        searchUniversity: "Search University",
        selectDegree: "Select degree",
        applyFilters: "Apply Filters",
        clearAll: "Clear all",
        universitiesCount: "Universities",
        programsCount: "Programs",
        onCampus: "On campus",
        fullTime: "Full time",
        programs: "Programs",
        tuitionRange: "Tuition range",
        scholarshipRate: "Scholarship rate",
        studyLevels: "Study levels",
        location: "Location",
        applyDate: "Apply date",
        scholarships: "Scholarships",
        exploreDetails: "Explore details",
        needHelp: "Need help?",
        helpBody: "Our experienced consultants can help you narrow the right country, course, and application plan.",
        consultants: "Our consultants",
        consultantTitle: "Matching consultants",
        consultantBody: "Consultants who can guide this exact shortlist, applications, and next steps.",
        consultantAction: "View profile",
        consultantVerified: "Verified",
        consultantPro: "Pro",
        consultantServicesLabel: "Services",
        noResults: "No results found",
        noResultsBody: "Adjust the filters or reset everything to widen the match.",
        loading: "Loading search results...",
        selected: "Selected filters",
      };

  const countryById = new Map(countries.map((item) => [item.id, item]));
  const universityByName = new Map(universities.map((item) => [normalize(item.name), item]));
  const studyLevelById = new Map(studyLevels.map((item) => [item.id, item.name]));

  const programs: ProgramResult[] = educationalInfo.map((item) => {
    const matchedCountry = countryById.get(item.country_id);
    const matchedUniversity = universityByName.get(normalize(item.institution_name));
    const studyLevelName = studyLevelById.get(item.study_level_id) ?? item.course_name ?? "General";
    const durationYears = guessDurationYears(studyLevelName, item.title);
    const budgetValue = parseAmount(item.budget);
    const scholarshipValue = parseAmount(item.scholarship_percentage);
    const location = item.location || matchedCountry?.name || "Location unavailable";
    const countryName = matchedCountry?.name ?? location;
    const title = item.title?.trim() || item.course_name?.trim() || item.institution_name;
    const summary = [
      `${title} at ${item.institution_name}.`,
      item.entry_score ? `Entry score ${item.entry_score}.` : "",
      item.next_batch ? `Next intake ${item.next_batch}.` : "Admissions currently open.",
    ].filter(Boolean).join(" ");

    return {
      id: item.id,
      title,
      universityName: item.institution_name,
      location,
      countryName,
      countryImage: getMediaUrl(matchedCountry?.image),
      studyLevelName,
      budgetValue,
      scholarshipAvailable: item.scholarship_available,
      scholarshipValue,
      durationYears,
      intakeLabel: item.next_batch || "Admissions open",
      image: getMediaUrl(item.card_banner) ?? getMediaUrl(matchedUniversity?.image),
      entryScore: item.entry_score,
      summary,
      searchBlob: normalize([
        title,
        item.institution_name,
        location,
        countryName,
        studyLevelName,
        item.course_name,
        item.entry_score,
      ].join(" ")),
    };
  });

  const universitiesGrouped = new Map<string, UniversityResult>();
  for (const program of programs) {
    const key = normalize(program.universityName);
    const existing = universitiesGrouped.get(key);
    if (!existing) {
      universitiesGrouped.set(key, {
        key,
        name: program.universityName,
        image: program.image ?? getMediaUrl(universityByName.get(key)?.image),
        countryName: program.countryName,
        countryImage: program.countryImage,
        locations: [program.location],
        programCount: 1,
        studyLevels: [program.studyLevelName],
        scholarshipCount: program.scholarshipAvailable ? 1 : 0,
        maxScholarship: program.scholarshipValue,
        minBudget: program.budgetValue,
        maxBudget: program.budgetValue,
        featuredProgram: program.title,
        firstProgramId: program.id,
        searchBlob: normalize([
          program.universityName,
          program.countryName,
          program.location,
          program.studyLevelName,
          program.title,
        ].join(" ")),
      });
      continue;
    }

    existing.locations = unique([...existing.locations, program.location]);
    existing.studyLevels = unique([...existing.studyLevels, program.studyLevelName]);
    existing.programCount += 1;
    existing.scholarshipCount += Number(program.scholarshipAvailable);
    existing.maxScholarship = Math.max(existing.maxScholarship, program.scholarshipValue);
    if (program.budgetValue > 0) {
      existing.minBudget = existing.minBudget > 0 ? Math.min(existing.minBudget, program.budgetValue) : program.budgetValue;
      existing.maxBudget = Math.max(existing.maxBudget, program.budgetValue);
    }
    existing.searchBlob = normalize(`${existing.searchBlob} ${program.title} ${program.studyLevelName}`);
  }

  const universityCards = [...universitiesGrouped.values()];

  const consultantGroups = new Map<number, ConsultantMatch>();
  for (const service of consultantServices) {
    const existing = consultantGroups.get(service.consultant_id);
    const subjectNames = unique(
      service.subject_names?.length
        ? service.subject_names
        : (service.service_category_names ?? []),
    );
    const studyLevelNames = unique(service.study_level_names ?? []);
    const countryName = service.country_name ?? "";
    const servicePrice = parseAmount(service.price);

    if (!existing) {
      consultantGroups.set(service.consultant_id, {
        consultantId: service.consultant_id,
        consultantName: service.consultant_name || "Shetu Consultant",
        consultantImage: getMediaUrl(service.consultant_image),
        consultantRating: service.consultant_rating ?? 0,
        reviewCount: service.consultant_review_count ?? 0,
        verificationStatus: service.consultant_verification_status ?? "pending",
        subscriptionStatus: service.consultant_subscription_status ?? "none",
        countryNames: countryName ? [countryName] : [],
        countryImage: getMediaUrl(service.country_image),
        serviceTitles: [service.title],
        servicePriceMin: servicePrice,
        servicePriceMax: servicePrice,
        durations: service.duration ? [service.duration] : [],
        subjectNames,
        studyLevels: studyLevelNames,
        profileSummary: service.description,
        searchBlob: normalize([
          service.consultant_name ?? "",
          service.title,
          service.description,
          countryName,
          ...(service.service_category_names ?? []),
          ...subjectNames,
          ...studyLevelNames,
        ].join(" ")),
      });
      continue;
    }

    existing.countryNames = unique([...existing.countryNames, countryName]);
    existing.serviceTitles = unique([...existing.serviceTitles, service.title]);
    existing.subjectNames = unique([...existing.subjectNames, ...subjectNames]);
    existing.studyLevels = unique([...existing.studyLevels, ...studyLevelNames]);
    existing.durations = unique([...existing.durations, service.duration]);
    if (servicePrice > 0) {
      existing.servicePriceMin = existing.servicePriceMin > 0 ? Math.min(existing.servicePriceMin, servicePrice) : servicePrice;
      existing.servicePriceMax = Math.max(existing.servicePriceMax, servicePrice);
    }
    existing.searchBlob = normalize(`${existing.searchBlob} ${service.title} ${service.description} ${countryName}`);
    existing.consultantRating = Math.max(existing.consultantRating, service.consultant_rating ?? 0);
    existing.reviewCount = Math.max(existing.reviewCount, service.consultant_review_count ?? 0);
  }

  const matchingConsultants = [...consultantGroups.values()]
    .filter((consultant) => {
      const matchesKeyword = !keywordFilter || consultant.searchBlob.includes(normalize(keywordFilter));
      const matchesCountry =
        !countryFilter || consultant.countryNames.some((item) => normalize(item).includes(normalize(countryFilter)));
      const matchesStudyLevel =
        !studyLevelFilter || consultant.studyLevels.some((item) => normalize(item).includes(normalize(studyLevelFilter)));
      const matchesDuration =
        durationFilter.length === 0 ||
        consultant.durations.some((duration) => {
          const value = normalize(duration);
          return durationFilter.some((item) => value.includes(normalize(item.replace("years", "year"))));
        });
      const matchesBudget =
        budgetFilter <= 0 ||
        (consultant.servicePriceMin > 0 && consultant.servicePriceMin <= budgetFilter) ||
        (consultant.servicePriceMax > 0 && consultant.servicePriceMax <= budgetFilter);

      return matchesKeyword && matchesCountry && matchesStudyLevel && matchesDuration && matchesBudget;
    })
    .sort((left, right) => {
      const rightScore = Number(right.subscriptionStatus === "pro") + Number(right.verificationStatus === "accepted");
      const leftScore = Number(left.subscriptionStatus === "pro") + Number(left.verificationStatus === "accepted");
      if (rightScore !== leftScore) return rightScore - leftScore;
      if (right.consultantRating !== left.consultantRating) return right.consultantRating - left.consultantRating;
      return left.consultantName.localeCompare(right.consultantName);
    })
    .slice(0, CONSULTANTS_PER_SECTION);

  const programCountryMatches = countries
    .map((item) => item.name)
    .filter((name) => !countryDraft || normalize(name).includes(normalize(countryDraft)))
    .slice(0, 6);
  const universityMatches = universityCards
    .map((item) => item.name)
    .filter((name) => !universityDraft || normalize(name).includes(normalize(universityDraft)))
    .slice(0, 6);
  const studyLevelMatches = studyLevels
    .map((item) => item.name)
    .filter((name) => !studyLevelDraft || normalize(name).includes(normalize(studyLevelDraft)))
    .slice(0, 6);

  let filteredPrograms = programs.filter((item) => {
    const matchesKeyword = !keywordFilter || item.searchBlob.includes(normalize(keywordFilter));
    const matchesCountry = !countryFilter || normalize(item.countryName).includes(normalize(countryFilter));
    const matchesUniversity = !universityFilter || normalize(item.universityName).includes(normalize(universityFilter));
    const matchesStudyLevel = !studyLevelFilter || normalize(item.studyLevelName).includes(normalize(studyLevelFilter));
    const matchesDuration = durationFilter.length === 0 || durationFilter.includes(`${item.durationYears} year`) || durationFilter.includes(`${item.durationYears} years`);
    const matchesBudget = budgetFilter <= 0 || (item.budgetValue > 0 && item.budgetValue <= budgetFilter);
    const matchesScholarship = !scholarshipOnly || item.scholarshipAvailable;

    return matchesKeyword && matchesCountry && matchesUniversity && matchesStudyLevel && matchesDuration && matchesBudget && matchesScholarship;
  });

  if (currentSort === "low") {
    filteredPrograms = [...filteredPrograms].sort((left, right) => {
      const leftBudget = left.budgetValue || Number.MAX_SAFE_INTEGER;
      const rightBudget = right.budgetValue || Number.MAX_SAFE_INTEGER;
      if (leftBudget !== rightBudget) return leftBudget - rightBudget;
      return left.title.localeCompare(right.title);
    });
  } else {
    filteredPrograms = [...filteredPrograms].sort((left, right) => {
      if (right.scholarshipValue !== left.scholarshipValue) return right.scholarshipValue - left.scholarshipValue;
      if (left.budgetValue !== right.budgetValue) {
        if (left.budgetValue === 0) return 1;
        if (right.budgetValue === 0) return -1;
        return left.budgetValue - right.budgetValue;
      }
      return left.title.localeCompare(right.title);
    });
  }

  let filteredUniversities = universityCards.filter((item) => {
    const matchesKeyword = !keywordFilter || item.searchBlob.includes(normalize(keywordFilter));
    const matchesCountry = !countryFilter || normalize(item.countryName).includes(normalize(countryFilter));
    const matchesUniversity = !universityFilter || normalize(item.name).includes(normalize(universityFilter));
    const matchesStudyLevel =
      !studyLevelFilter || item.studyLevels.some((level) => normalize(level).includes(normalize(studyLevelFilter)));
    const matchesScholarship = !scholarshipOnly || item.scholarshipCount > 0;
    return matchesKeyword && matchesCountry && matchesUniversity && matchesStudyLevel && matchesScholarship;
  });

  if (currentSort === "ranked") {
    filteredUniversities = [...filteredUniversities].sort((left, right) => {
      if (right.scholarshipCount !== left.scholarshipCount) return right.scholarshipCount - left.scholarshipCount;
      if (right.programCount !== left.programCount) return right.programCount - left.programCount;
      return left.name.localeCompare(right.name);
    });
  } else {
    filteredUniversities = [...filteredUniversities].sort((left, right) => {
      if (right.programCount !== left.programCount) return right.programCount - left.programCount;
      if (right.maxScholarship !== left.maxScholarship) return right.maxScholarship - left.maxScholarship;
      return left.name.localeCompare(right.name);
    });
  }

  const activeResults = currentView === "programs" ? filteredPrograms : filteredUniversities;
  const totalPages = Math.max(1, Math.ceil(activeResults.length / RESULTS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageStart = (safePage - 1) * RESULTS_PER_PAGE;
  const pagedResults = activeResults.slice(pageStart, pageStart + RESULTS_PER_PAGE);

  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1).filter((item) => {
    return item === 1 || item === totalPages || Math.abs(item - safePage) <= 1;
  });

  const selectedBadges = [
    keywordFilter,
    countryFilter,
    universityFilter,
    studyLevelFilter,
    ...durationFilter,
    scholarshipOnly ? copy.scholarship : "",
    currentView === "programs" && budgetFilter > 0 ? `${copy.budget}: BDT ${budgetFilter.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}` : "",
  ].filter(Boolean);

  function pushFilters(next: Partial<{
    view: ViewMode;
    country: string;
    university: string;
    studyLevel: string;
    durations: string[];
    budget: number;
    scholarship: boolean;
    sort: SortMode;
    page: number;
  }> = {}) {
    const url = buildUrl(pathname, {
      view: next.view ?? currentView,
      keyword: keywordFilter,
      country: next.country ?? countryFilter,
      university: next.university ?? universityFilter,
      studyLevel: next.studyLevel ?? studyLevelFilter,
      durations: next.durations ?? durationFilter,
      budget: next.budget ?? budgetFilter,
      scholarship: next.scholarship ?? scholarshipOnly,
      sort: next.sort ?? currentSort,
      page: next.page ?? 1,
    });

    startTransition(() => {
      router.push(url as Route);
    });
  }

  function handleApply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = buildUrl(pathname, {
      view: currentView,
      keyword: keywordFilter,
      country: countryDraft,
      university: universityDraft,
      studyLevel: studyLevelDraft,
      durations: durationDraft,
      budget: currentView === "programs" ? budgetDraft : 0,
      scholarship: scholarshipDraft,
      sort: currentSort,
      page: 1,
    });

    startTransition(() => {
      router.push(url as Route);
    });
  }

  function clearAll() {
    setCountryDraft("");
    setUniversityDraft("");
    setStudyLevelDraft("");
    setDurationDraft([]);
    setBudgetDraft(0);
    setScholarshipDraft(false);

    const url = buildUrl(pathname, {
      view: currentView,
      keyword: keywordFilter,
      country: "",
      university: "",
      studyLevel: "",
      durations: [],
      budget: 0,
      scholarship: false,
      sort: "default",
      page: 1,
    });

    startTransition(() => {
      router.push(url as Route);
    });
  }

  function toggleDuration(value: string) {
    setDurationDraft((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }
      return [...current, value];
    });
  }

  function setView(nextView: ViewMode) {
    const nextSort: SortMode = nextView === "programs"
      ? (currentSort === "ranked" ? "default" : currentSort)
      : (currentSort === "low" ? "default" : currentSort);

    const url = buildUrl(pathname, {
      view: nextView,
      keyword: keywordFilter,
      country: countryFilter,
      university: universityFilter,
      studyLevel: studyLevelFilter,
      durations: nextView === "programs" ? durationFilter : [],
      budget: nextView === "programs" ? budgetFilter : 0,
      scholarship: scholarshipOnly,
      sort: nextSort,
      page: 1,
    });

    startTransition(() => {
      router.push(url as Route);
    });
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.layout}>
          <aside className={styles.sidebar}>
            <form className={styles.filterPanel} onSubmit={handleApply}>
              <div className={styles.viewTabs}>
                <button
                  type="button"
                  className={`${styles.viewTab} ${currentView === "universities" ? styles.viewTabActive : ""}`}
                  onClick={() => setView("universities")}
                >
                  {copy.universitiesTab}
                </button>
                <button
                  type="button"
                  className={`${styles.viewTab} ${currentView === "programs" ? styles.viewTabActive : ""}`}
                  onClick={() => setView("programs")}
                >
                  {copy.programsTab}
                </button>
              </div>

              <div className={styles.filterStack}>
                <div className={styles.filterItem}>
                  <button type="button" className={styles.filterHeader} onClick={() => setOpenSection(openSection === "country" ? null : "country")}>
                    <span>{copy.country}</span>
                    <ChevronDown size={18} className={openSection === "country" ? styles.iconOpen : ""} />
                  </button>
                  {openSection === "country" ? (
                    <div className={styles.filterBody}>
                      <label className={styles.fieldLabel}>{copy.country}</label>
                      <div className={styles.searchField}>
                        <input
                          value={countryDraft}
                          onChange={(event) => setCountryDraft(event.target.value)}
                          placeholder={copy.selectCountry}
                        />
                        <Search size={18} />
                      </div>
                      {programCountryMatches.length > 0 ? (
                        <div className={styles.suggestionRow}>
                          {programCountryMatches.map((item) => (
                            <button key={item} type="button" className={styles.suggestionChip} onClick={() => setCountryDraft(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className={styles.filterItem}>
                  <button type="button" className={styles.filterHeader} onClick={() => setOpenSection(openSection === "university" ? null : "university")}>
                    <span>{copy.university}</span>
                    <ChevronDown size={18} className={openSection === "university" ? styles.iconOpen : ""} />
                  </button>
                  {openSection === "university" ? (
                    <div className={styles.filterBody}>
                      <label className={styles.fieldLabel}>{copy.university}</label>
                      <div className={styles.searchField}>
                        <input
                          value={universityDraft}
                          onChange={(event) => setUniversityDraft(event.target.value)}
                          placeholder={copy.searchUniversity}
                        />
                        <Search size={18} />
                      </div>
                      {universityMatches.length > 0 ? (
                        <div className={styles.suggestionRow}>
                          {universityMatches.map((item) => (
                            <button key={item} type="button" className={styles.suggestionChip} onClick={() => setUniversityDraft(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className={styles.filterItem}>
                  <button type="button" className={styles.filterHeader} onClick={() => setOpenSection(openSection === "studyLevel" ? null : "studyLevel")}>
                    <span>{copy.degreeType}</span>
                    <ChevronDown size={18} className={openSection === "studyLevel" ? styles.iconOpen : ""} />
                  </button>
                  {openSection === "studyLevel" ? (
                    <div className={styles.filterBody}>
                      <label className={styles.fieldLabel}>{copy.degreeType}</label>
                      <div className={styles.searchField}>
                        <input
                          value={studyLevelDraft}
                          onChange={(event) => setStudyLevelDraft(event.target.value)}
                          placeholder={copy.selectDegree}
                        />
                        <Search size={18} />
                      </div>
                      {studyLevelMatches.length > 0 ? (
                        <div className={styles.suggestionRow}>
                          {studyLevelMatches.map((item) => (
                            <button key={item} type="button" className={styles.suggestionChip} onClick={() => setStudyLevelDraft(item)}>
                              {item}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {currentView === "programs" ? (
                  <div className={styles.filterItem}>
                    <button type="button" className={styles.filterHeader} onClick={() => setOpenSection(openSection === "duration" ? null : "duration")}>
                      <span>{copy.duration}</span>
                      <ChevronDown size={18} className={openSection === "duration" ? styles.iconOpen : ""} />
                    </button>
                    {openSection === "duration" ? (
                      <div className={styles.filterBody}>
                        <label className={styles.fieldLabel}>{copy.duration}</label>
                        <div className={styles.checkboxList}>
                          {DURATION_OPTIONS.map((item) => (
                            <label key={item} className={styles.checkboxRow}>
                              <span>{item}</span>
                              <input
                                type="checkbox"
                                checked={durationDraft.includes(item)}
                                onChange={() => toggleDuration(item)}
                              />
                            </label>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                {currentView === "programs" ? (
                  <div className={styles.filterItem}>
                    <button type="button" className={styles.filterHeader} onClick={() => setOpenSection(openSection === "budget" ? null : "budget")}>
                      <span>{copy.budget}</span>
                      <ChevronDown size={18} className={openSection === "budget" ? styles.iconOpen : ""} />
                    </button>
                    {openSection === "budget" ? (
                      <div className={styles.filterBody}>
                        <label className={styles.fieldLabel}>{copy.annualTuition}</label>
                        <div className={styles.rangeWrap}>
                          <div className={styles.rangeTrack}>
                            <div
                              className={styles.rangeFill}
                              style={{ width: `${Math.max(4, (budgetDraft / MAX_BUDGET) * 100)}%` }}
                            />
                          </div>
                          <input
                            className={styles.rangeInput}
                            type="range"
                            min="0"
                            max={String(MAX_BUDGET)}
                            step="1000"
                            value={budgetDraft}
                            onChange={(event) => setBudgetDraft(Number(event.target.value))}
                          />
                        </div>
                        <div className={styles.rangeLabels}>
                          <span>$ 0</span>
                          <strong>$ {budgetDraft.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}</strong>
                          <span>$ {MAX_BUDGET.toLocaleString(lang === "bn" ? "bn-BD" : "en-US")}</span>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <label className={styles.toggleRow}>
                  <span>{copy.scholarship}</span>
                  <input
                    type="checkbox"
                    checked={scholarshipDraft}
                    onChange={(event) => setScholarshipDraft(event.target.checked)}
                  />
                </label>
              </div>

              <div className={styles.actionRow}>
                <button type="submit" className={styles.applyButton}>
                  <Filter size={16} />
                  {copy.applyFilters}
                </button>
                <button type="button" className={styles.clearButton} onClick={clearAll}>
                  {copy.clearAll}
                </button>
              </div>
            </form>

            <div className={styles.helpCard}>
              <div className={styles.helpGlow} />
              <h3>{copy.needHelp}</h3>
              <p>{copy.helpBody}</p>
              <div className={styles.helpAvatars}>
                {HELP_AVATARS.map((item) => (
                  <img key={item} src={item} alt="" />
                ))}
              </div>
              <Link href="/consultants" className={styles.helpButton}>
                {copy.consultants}
              </Link>
            </div>
          </aside>

          <div className={styles.main}>
            <div className={styles.header}>
              <div className={styles.headerCopy}>
                <span className={styles.eyebrow}>{copy.headerLabel}</span>
                <h1>{currentView === "universities" ? copy.headerTitleUniversity : copy.headerTitleProgram}</h1>
                <p>{copy.headerBody}</p>
                {selectedBadges.length > 0 ? (
                  <div className={styles.badgeRow}>
                    <span className={styles.badgeLabel}>{copy.selected}</span>
                    {selectedBadges.map((item) => (
                      <span key={item} className={styles.filterBadge}>{item}</span>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className={styles.headerSide}>
                <div className={styles.segmented}>
                  {currentView === "universities" ? (
                    <>
                      <button
                        type="button"
                        className={`${styles.segmentButton} ${currentSort === "default" ? styles.segmentButtonActive : ""}`}
                        onClick={() => pushFilters({ sort: "default", page: 1 })}
                      >
                        {copy.allUniversities}
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentButton} ${currentSort === "ranked" ? styles.segmentButtonActive : ""}`}
                        onClick={() => pushFilters({ sort: "ranked", page: 1 })}
                      >
                        {copy.topRanked}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className={`${styles.segmentButton} ${currentSort === "default" ? styles.segmentButtonActive : ""}`}
                        onClick={() => pushFilters({ sort: "default", page: 1 })}
                      >
                        {copy.allPrograms}
                      </button>
                      <button
                        type="button"
                        className={`${styles.segmentButton} ${currentSort === "low" ? styles.segmentButtonActive : ""}`}
                        onClick={() => pushFilters({ sort: "low", page: 1 })}
                      >
                        {copy.lowTuition}
                      </button>
                    </>
                  )}
                </div>

                <div className={styles.resultsMeta}>
                  <p>
                    {activeResults.length} {currentView === "universities" ? copy.universitiesCount : copy.programsCount}
                  </p>

                  {totalPages > 1 ? (
                    <nav className={styles.pagination} aria-label="Search results pagination">
                      <button
                        type="button"
                        className={styles.pageButton}
                        disabled={safePage <= 1}
                        onClick={() => pushFilters({ page: safePage - 1 })}
                      >
                        <ChevronLeft size={16} />
                      </button>

                      {pageNumbers.map((item) => (
                        <button
                          key={item}
                          type="button"
                          className={`${styles.pageButton} ${item === safePage ? styles.pageButtonActive : ""}`}
                          onClick={() => pushFilters({ page: item })}
                        >
                          {item}
                        </button>
                      ))}

                      <button
                        type="button"
                        className={styles.pageButton}
                        disabled={safePage >= totalPages}
                        onClick={() => pushFilters({ page: safePage + 1 })}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </nav>
                  ) : null}
                </div>
              </div>
            </div>

            {isLoading || isPending ? (
              <div className={styles.stateCard}>
                <Sparkles size={28} />
                <p>{copy.loading}</p>
              </div>
            ) : activeResults.length === 0 ? (
              <div className={styles.stateCard}>
                <Filter size={28} />
                <h2>{copy.noResults}</h2>
                <p>{copy.noResultsBody}</p>
                <button type="button" className={styles.clearButtonInline} onClick={clearAll}>
                  {copy.clearAll}
                </button>
              </div>
            ) : (
              <div className={styles.cardStack}>
                {currentView === "universities"
                  ? (pagedResults as UniversityResult[]).map((item) => (
                      <article key={item.key} className={styles.resultCard}>
                        <div className={styles.cardTop}>
                          <div className={styles.identity}>
                            <div className={styles.logoBadge}>
                              {item.image ? <img src={item.image} alt={item.name} /> : <span>{getInitials(item.name)}</span>}
                            </div>
                            <div className={styles.titleBlock}>
                              <h2>{item.name}</h2>
                              <p>{formatLocations(item.locations, lang)}</p>
                            </div>
                          </div>

                          <div className={styles.cardAside}>
                            <span className={styles.highlightPill}>
                              {item.maxScholarship > 0 ? `Up to ${item.maxScholarship}% scholarship` : "Admissions open"}
                            </span>
                            <span className={styles.softPill}>{copy.onCampus}</span>
                          </div>
                        </div>

                        <div className={styles.cardBody}>
                          <span className={styles.overline}>{copy.programs}</span>
                          <h3>{item.featuredProgram}</h3>
                          <p>
                            {item.programCount} programs across {item.studyLevels.slice(0, 3).join(", ")}
                            {item.studyLevels.length > 3 ? "..." : ""}
                          </p>
                        </div>

                        <div className={styles.statGrid}>
                          <div className={styles.statCell}>
                            <Building2 size={18} />
                            <span>{copy.programs}</span>
                            <strong>{item.programCount}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <GraduationCap size={18} />
                            <span>{copy.studyLevels}</span>
                            <strong>{item.studyLevels.length}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <Award size={18} />
                            <span>{copy.scholarships}</span>
                            <strong>{item.scholarshipCount || "N/A"}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <Wallet size={18} />
                            <span>{copy.tuitionRange}</span>
                            <strong>{formatRange(item.minBudget, item.maxBudget, lang)}</strong>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.cardFooterMeta}>
                            {item.countryImage ? <img src={item.countryImage} alt={item.countryName} /> : <MapPin size={16} />}
                            <span>{item.countryName}</span>
                          </div>
                          <Link href={`/educational-details-information/${item.firstProgramId}` as Route} className={styles.cardLink}>
                            {copy.exploreDetails}
                          </Link>
                        </div>
                      </article>
                    ))
                  : (pagedResults as ProgramResult[]).map((item) => (
                      <article key={item.id} className={styles.resultCard}>
                        <div className={styles.cardTop}>
                          <div className={styles.identity}>
                            <div className={styles.logoBadge}>
                              {item.image ? <img src={item.image} alt={item.universityName} /> : <span>{getInitials(item.universityName)}</span>}
                            </div>
                            <div className={styles.titleBlock}>
                              <strong>{item.universityName}</strong>
                              <p>{item.studyLevelName}</p>
                            </div>
                          </div>

                          <div className={styles.programPriceWrap}>
                            <span className={styles.programPrice}>{formatBudget(item.budgetValue, lang)}</span>
                            <div className={styles.statusPills}>
                              <span className={styles.softPill}>{copy.fullTime}</span>
                              <span className={styles.softPill}>{copy.onCampus}</span>
                            </div>
                          </div>
                        </div>

                        <div className={styles.cardBody}>
                          <h3>{item.title}</h3>
                          <p>{item.summary}</p>
                        </div>

                        <div className={styles.statGrid}>
                          <div className={styles.statCell}>
                            <MapPin size={18} />
                            <span>{copy.location}</span>
                            <strong>{item.location}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <Clock3 size={18} />
                            <span>{copy.duration}</span>
                            <strong>{item.durationYears} {item.durationYears === 1 ? "Year" : "Years"}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <Sparkles size={18} />
                            <span>{copy.applyDate}</span>
                            <strong>{item.intakeLabel}</strong>
                          </div>
                          <div className={styles.statCell}>
                            <Award size={18} />
                            <span>{copy.scholarships}</span>
                            <strong>{item.scholarshipAvailable ? (item.scholarshipValue ? `${item.scholarshipValue}%` : "Available") : "N/A"}</strong>
                          </div>
                        </div>

                        <div className={styles.cardFooter}>
                          <div className={styles.cardFooterMeta}>
                            {item.countryImage ? <img src={item.countryImage} alt={item.countryName} /> : <MapPin size={16} />}
                            <span>{item.countryName}</span>
                          </div>
                          <Link href={`/educational-details-information/${item.id}` as Route} className={styles.cardLink}>
                            {copy.exploreDetails}
                          </Link>
                        </div>
                      </article>
                    ))}

                {matchingConsultants.length > 0 ? (
                  <section className={styles.consultantSection}>
                    <div className={styles.consultantSectionHead}>
                      <div>
                        <span className={styles.eyebrow}>{copy.consultants}</span>
                        <h2>{copy.consultantTitle}</h2>
                        <p>{copy.consultantBody}</p>
                      </div>
                    </div>

                    <div className={styles.consultantGrid}>
                      {matchingConsultants.map((consultant) => (
                        <article key={consultant.consultantId} className={styles.consultantCard}>
                          <div className={styles.consultantIdentity}>
                            <div className={styles.consultantAvatar}>
                              {consultant.consultantImage ? (
                                <img src={consultant.consultantImage} alt={consultant.consultantName} />
                              ) : (
                                <span>{getInitials(consultant.consultantName)}</span>
                              )}
                            </div>

                            <div className={styles.consultantCopy}>
                              <div className={styles.consultantTitleRow}>
                                <h3>{consultant.consultantName}</h3>
                                {consultant.verificationStatus === "accepted" ? (
                                  <span className={styles.consultantVerified}>
                                    <CheckCircle2 size={14} />
                                    {copy.consultantVerified}
                                  </span>
                                ) : null}
                              </div>

                              <div className={styles.consultantMetaRow}>
                                <span className={styles.consultantStars}>
                                  <Star size={14} fill="currentColor" />
                                  {consultant.consultantRating.toFixed(1)}
                                </span>
                                <span>{consultant.reviewCount} reviews</span>
                                {consultant.subscriptionStatus === "pro" ? (
                                  <span className={styles.consultantPro}>{copy.consultantPro}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>

                          <p className={styles.consultantSummary}>{consultant.profileSummary}</p>

                          <div className={styles.consultantFacts}>
                            <div>
                              <span>{copy.consultantServicesLabel}</span>
                              <strong>{consultant.serviceTitles.slice(0, 2).join(", ")}</strong>
                            </div>
                            <div>
                              <span>{copy.budget}</span>
                              <strong>{formatRange(consultant.servicePriceMin, consultant.servicePriceMax, lang)}</strong>
                            </div>
                          </div>

                          <div className={styles.consultantChipGroup}>
                            {consultant.countryNames.slice(0, 2).map((item) => (
                              <span key={item} className={styles.consultantChip}>{item}</span>
                            ))}
                            {consultant.studyLevels.slice(0, 2).map((item) => (
                              <span key={item} className={styles.consultantChipMuted}>{item}</span>
                            ))}
                            {consultant.subjectNames.slice(0, 2).map((item) => (
                              <span key={item} className={styles.consultantChipMuted}>{item}</span>
                            ))}
                          </div>

                          <Link href={`/consultants-profile-details-view/${consultant.consultantId}` as Route} className={styles.consultantLink}>
                            {copy.consultantAction}
                          </Link>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
