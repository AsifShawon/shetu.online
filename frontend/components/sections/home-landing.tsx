"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type RefObject,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  Globe2,
  GraduationCap,
  Landmark,
  NotebookPen,
  Mic,
  Search,
  SendHorizontal,
  ShieldCheck,
  Share2,
  Sparkles,
  Star,
  Users2,
  WalletCards,
} from "lucide-react";

import { SiteFooter } from "@/components/layout/site-footer";
import HeroAnimatedGlobe from "@/components/globe/HeroAnimatedGlobe";
import { HeroSection } from "./hero-section";
import { useAuth } from "@/components/layout/auth-provider";
import { useToast } from "@/components/layout/toast-provider";
import { ConsultantShareModal } from "@/components/ui/consultant-share-modal";
import { LoginRequiredModal } from "@/components/ui/login-required-modal";
import styles from "./home-landing.module.css";
import { useLang } from "@/components/layout/lang-provider";
import { getApiErrorMessage, getMediaUrl } from "@/lib/api/client";
import type { ConsultantService } from "@/lib/api/consultants";
import type { FAQ, SiteSetting, Testimonial } from "@/lib/api/content";
import type {
  Country,
  EducationalInfo,
  ServiceCategory,
  Training,
  University,
} from "@/lib/api/catalog";
import type { StudentPost } from "@/lib/api/marketplace";
import { getSavedConsultants, removeSavedConsultant, saveConsultant } from "@/lib/api/saved-consultants";
import { getCountryFlagUrl } from "@/lib/country-flags";
import { cn } from "@/lib/utils";

interface HomeLandingProps {
  categories: ServiceCategory[];
  consultantServices: ConsultantService[];
  countries: Country[];
  educationalInfo: EducationalInfo[];
  faqs: FAQ[];
  posts: StudentPost[];
  site: SiteSetting | null;
  testimonials: Testimonial[];
  trainings: Training[];
  universities: University[];
}

type SearchTabId = "course" | "country" | "scholarship" | "university" | "budget";

const assetBase = "/legacy/Frontend/assets/img/page";
const heroRightSlides = [
  `${assetBase}/hero-right/image_1.png`,
  `${assetBase}/hero-right/image_2.png`,
  `${assetBase}/hero-right/image_3.png`,
  `${assetBase}/hero-right/image_4.png`,
  `${assetBase}/hero-right/image_5.png`,
  `${assetBase}/hero-right/image_6.png`,
];

const copyEn = {
  heroTitle: "Find Your Ideal Destination",
  heroBody:
    "You can get support directly by applying for your study abroad You can get support directly by applying for your study abroad",
  heroPrimary: "Study Abroad",
  heroSecondary: "Consultation Services",
  heroStats: ["120+ positive reviews", "99% guided success rate"],
  searchLabel: "Search with AI",
  countryTitle: "See Study Opportunities by Country",
  countryBody: "Find universities, programs, and scholarships in your preferred country.",
  studyTitle: "Accurate Guidelines for your Required Study",
  studyBody:
    "Structured routes for every study level so students can understand what to prepare before they apply.",
  universityTitle: "Top Universities for your higher study",
  universityBody:
    "Explore institutions, compare destinations, and move from shortlisting to application with fewer blind spots.",
  serviceTitle: "Get your Complete Guidance",
  serviceBody:
    "From assessment to visa support, every major step is organized into a service students can understand quickly.",
  aboutKicker: "About us",
  aboutTitle: "A cleaner route from first search to final application",
  aboutBody:
    "Shetu combines destination research, consultant discovery, student requests, and consultant training in one place. That makes the journey easier to understand for students and easier to manage for experts.",
  aboutReview: "120+ Positive reviews",
  aboutMetric: "Success rates",
  aboutCta: "Sign up",
  consultantsTitle: "Our Verified Consultants",
  consultantsBody:
    "Connect with expert consultants for personalized guidance from choosing a university to securing your visa.",
  consultantsCta: "View all Consultants",
  postsTitle: "Student Consultation Requests",
  postsBody:
    "Students share their profiles to connect with consultants for assessments and study abroad guidance.",
  postsCta: "View all posts",
  agenciesTitle: "Find best Agency for your study abroad",
  agenciesBody:
    "Agency profiles make it easier to compare country coverage, consultant capacity, and service depth at a glance.",
  agenciesCta: "View all",
  reviewsTitle: "Reviews",
  trainingTitle: "Our Consultation Training",
  trainingBody: "Become a Certified Study Abroad Consultant",
  trainingText:
    "Professional training tracks for consultants who want stronger delivery, clearer structure, and better student outcomes.",
  trainingCta: "View all",
  faqTitle: "Any Question ?",
  faqBody:
    "Answers to common questions about planning, consultant requests, packages, and what happens next after you start.",
  faqCta: "More FAQs",
  footerTitle: "Start your career with us",
  footerBody:
    "Join as a consultant, publish services, and connect with students who already know what support they need.",
  footerName: "Name",
  footerPhone: "Your phone number",
  footerSubmit: "Send request",
  servicesLabel: "Services",
  informationLabel: "Information",
  contactLabel: "Contact us",
  copyright: "Copyright",
  consultantButton: "Send Request",
  studyLevels: ["School", "Bachelor's", "Master's", "PHD", "Vocational"],
  fallbackFaqs: [
    {
      question: "How this work?",
      answer:
        "Browse countries, universities, and consultant services from one place, then move into the path that fits your plan.",
    },
    {
      question: "How do I contact a consultant?",
      answer:
        "Open a consultant profile, review their services, and send a request directly from the card or profile page.",
    },
    {
      question: "Can I publish a student request?",
      answer:
        "Yes. Students can create consultation requests so consultants can respond with the right service and quotation.",
    },
    {
      question: "Do you provide consultant training?",
      answer:
        "Shetu includes training content for consultants who want stronger process knowledge and better student support.",
    },
  ],
} as const;

const copy = {
  en: copyEn,
  bn: copyEn,
} as const;

const searchTabs: Array<{
  id: SearchTabId;
  label: string;
  placeholder: string;
  route: string;
  queryKey: string;
  Icon: typeof GraduationCap;
}> = [
  {
    id: "course",
    label: "Course",
    placeholder: "Which course are you searching for?",
    route: "/your-selected-result-courses",
    queryKey: "course",
    Icon: GraduationCap,
  },
  {
    id: "country",
    label: "Country",
    placeholder: "Which country do you want to study in?",
    route: "/your-selected-result",
    queryKey: "country",
    Icon: Globe2,
  },
  {
    id: "scholarship",
    label: "Scholarship",
    placeholder: "Search scholarship keywords",
    route: "/your-selected-result-scholarship",
    queryKey: "keyword",
    Icon: Sparkles,
  },
  {
    id: "university",
    label: "University",
    placeholder: "Search university names",
    route: "/your-selected-result-university",
    queryKey: "keyword",
    Icon: Landmark,
  },
  {
    id: "budget",
    label: "Budget",
    placeholder: "Set your budget limit",
    route: "/your-selected-result-Budget",
    queryKey: "budget",
    Icon: WalletCards,
  },
];

const studyLevelAssets = [
  `${assetBase}/sec3_school_icon.png`,
  `${assetBase}/sec3_bachelor_icon.png`,
  `${assetBase}/sec3_masters_icon.png`,
  `${assetBase}/sec3_phd_icon.png`,
  `${assetBase}/sec3_vocational_icon.png`,
];

const fallbackCountries = [
  "Australia",
  "United States",
  "Canada",
  "Cyprus",
  "France",
  "Japan",
  "Germany",
  "South Korea",
  "United Kingdom",
  "Hungary",
  "Netherlands",
  "Norway",
];

const universityFallbacks = [
  { image: `${assetBase}/top_uni_1.jpg`, meta: "Canada" },
  { image: `${assetBase}/top_uni_2.jpg`, meta: "Norway" },
  { image: `${assetBase}/top_uni_3.jpg`, meta: "London" },
  { image: `${assetBase}/top_uni_4.jpg`, meta: "Denmark" },
];

const serviceFallbacks = [
  {
    title: "Assessment Service",
    description:
      "A structured first review so students understand profile strength, destination fit, and where to focus next.",
  },
  {
    title: "File Processing Service",
    description:
      "Organize documents, check gaps early, and move toward submission with less back-and-forth.",
  },
  {
    title: "Visa Processing Service",
    description:
      "Track visa requirements, prepare the file, and reduce avoidable mistakes before submission.",
  },
  {
    title: "Feature Processing Service",
    description:
      "Coordinate supporting tasks around the application process when the case needs closer handling.",
  },
  {
    title: "SOP Writing Service",
    description:
      "Shape the statement into something clearer, more focused, and aligned with the application goal.",
  },
  {
    title: "Scholarships Search Service",
    description:
      "Filter opportunities faster and focus on funding paths that actually fit the student profile.",
  },
];

const agencyFallbacks = [
  {
    name: "Agency Name",
    image: `${assetBase}/agency_img1.jpg`,
    logo: `${assetBase}/agency_logo1.jpg`,
    countries: "6 Countries",
    consultants: "200 Consultants",
    services: "10 Services",
  },
  {
    name: "Agency Name",
    image: `${assetBase}/agency_img2.jpg`,
    logo: `${assetBase}/agency_logo2.jpg`,
    countries: "6 Countries",
    consultants: "200 Consultants",
    services: "10 Services",
  },
  {
    name: "Agency Name",
    image: `${assetBase}/agency_img3.jpg`,
    logo: `${assetBase}/agency_logo3.jpg`,
    countries: "6 Countries",
    consultants: "200 Consultants",
    services: "10 Services",
  },
  {
    name: "Agency Name",
    image: `${assetBase}/agency_img4.jpg`,
    logo: `${assetBase}/agency_logo3.jpg`,
    countries: "6 Countries",
    consultants: "200 Consultants",
    services: "10 Services",
  },
];

const trainingFallbacks = [
  {
    title: "Complete Study Abroad Consultancy Bootcamp",
    image: `${assetBase}/consult_2.jpg`,
  },
  {
    title: "Malaysia & UAE Admission Processing Course",
    image: `${assetBase}/consult_1.jpg`,
  },
  {
    title: "Japan & Korea Student Visa Workshop",
    image: `${assetBase}/consult_3.jpg`,
  },
  {
    title: "Complete Study Abroad Consultancy Bootcamp",
    image: `${assetBase}/consult_4.jpg`,
  },
];

const reviewFallbacks = [
  { name: "Name", description: "A clear consultant path helped me move from confusion to action.", image: `${assetBase}/review_2.jpg` },
  { name: "Name", description: "The country and university comparison made decisions much easier.", image: `${assetBase}/review_3.jpg` },
  { name: "Name", description: "I knew what to prepare and what to avoid before I submitted.", image: `${assetBase}/review_4.jpg` },
  { name: "Name", description: "The consultant shortlist saved a lot of time in the process.", image: `${assetBase}/review_5.jpg` },
  { name: "Name", description: "The platform gave me a cleaner route from research to application.", image: `${assetBase}/review_1.jpg` },
];

function trimText(text: string, max: number) {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trim()}...`;
}

function normalizeCountryName(value: string) {
  return value.trim().toLowerCase();
}

function getInitials(name: string) {
  const parts = name.split(" ").filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "EW";
  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

function buildSearchHref(route: string, queryKey: string, value: string) {
  const params = new URLSearchParams();
  if (value.trim()) {
    params.set(queryKey, value.trim());
  }
  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

function asRoute(path: string) {
  return path as Route;
}

function scrollRail(ref: RefObject<HTMLDivElement | null>, direction: 1 | -1) {
  ref.current?.scrollBy({
    left: direction * 340,
    behavior: "smooth",
  });
}

function isKeyboardNavigationKey(event: KeyboardEvent<HTMLElement>) {
  return event.key === "Enter" || event.key === " ";
}

function buildConsultantProfilePath(consultantId: number) {
  return `/consultants-profile-details-view/${consultantId}`;
}

function buildConsultantProfileUrl(consultantId: number) {
  const path = buildConsultantProfilePath(consultantId);
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

export function HomeLanding({
  categories,
  consultantServices,
  countries,
  educationalInfo,
  faqs,
  posts,
  site,
  testimonials,
  trainings,
  universities,
}: HomeLandingProps) {
  const { lang } = useLang();
  const { user, isLoading: isAuthLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<SearchTabId>("course");
  const [searchValue, setSearchValue] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [savedConsultantMap, setSavedConsultantMap] = useState<Record<number, number>>({});
  const [savePendingId, setSavePendingId] = useState<number | null>(null);
  const [shareModalConsultant, setShareModalConsultant] = useState<{ name: string; profileUrl: string } | null>(null);
  const [loginPromptConsultantName, setLoginPromptConsultantName] = useState<string | null>(null);

  const universityRailRef = useRef<HTMLDivElement>(null);
  const agencyRailRef = useRef<HTMLDivElement>(null);

  const c = copy[lang === "bn" ? "bn" : "en"];
  const activeSearchTab = searchTabs.find((tab) => tab.id === activeTab) ?? searchTabs[0];
  const activeCategories = categories.filter((category) => category.status === "active");
  const activeCountries = countries.filter((country) => country.status === "active");
  const activeUniversities = universities.filter((university) => university.status === "active");
  const highlightedEducation = educationalInfo.filter((info) => info.status === "active" && info.show_on_home);
  const activePosts = posts.filter((post) => post.status === "active");
  const activeTrainings = trainings.filter((training) => training.status === "active");
  const activeCountryMap = new Map(activeCountries.map((country) => [normalizeCountryName(country.name), country]));
  const canSaveConsultants =
    user?.role === "student" || user?.role === "consultant" || user?.role === "agency";

  useEffect(() => {
    if (isAuthLoading) return;

    if (!user || !canSaveConsultants) {
      setSavedConsultantMap({});
      return;
    }

    let isMounted = true;

    getSavedConsultants()
      .then((items) => {
        if (!isMounted) return;
        setSavedConsultantMap(
          items.reduce<Record<number, number>>((acc, item) => {
            acc[item.consultant_id] = item.id;
            return acc;
          }, {}),
        );
      })
      .catch(() => {
        if (!isMounted) return;
        setSavedConsultantMap({});
      });

    return () => {
      isMounted = false;
    };
  }, [canSaveConsultants, isAuthLoading, user]);

  const displayedCountries =
    fallbackCountries
      .map((name, index) => {
        const country = activeCountryMap.get(normalizeCountryName(name));

        if (country) {
          return {
            id: country.id,
            name: country.name,
            flagUrl: getMediaUrl(country.image) ?? getCountryFlagUrl(country.name),
          };
        }

        return {
          id: index,
          name,
          flagUrl: getCountryFlagUrl(name),
        };
      });
  const marqueeCountries = [...displayedCountries, ...displayedCountries];

  const dynamicUniversities = activeUniversities.slice(0, 4).map((university, index) => {
    const info = highlightedEducation[index];
    const fallback = universityFallbacks[index % universityFallbacks.length];
    return {
      id: university.id,
      title: university.name,
      meta: info?.location || fallback.meta,
      image: getMediaUrl(info?.card_banner || university.image) ?? fallback.image,
      href: info ? `/educational-details-information/${info.id}` : "/courses",
    };
  });

  const displayedUniversities =
    dynamicUniversities.length > 0
      ? dynamicUniversities
      : universityFallbacks.map((item, index) => ({
          id: index,
          title: "University Name",
          meta: item.meta,
          image: item.image,
          href: "/courses",
        }));

  const dynamicServices = activeCategories.slice(0, 6).map((category, index) => {
    const fallback = serviceFallbacks[index % serviceFallbacks.length];
    return {
      id: category.id,
      title: category.name || fallback.title,
      description: trimText(category.description || fallback.description, 116),
      href: `/courses?service=${encodeURIComponent(category.name || fallback.title)}`,
    };
  });

  const displayedServices: Array<{
    id: number | string;
    title: string;
    description: string;
    href: string;
  }> = [...dynamicServices];
  while (displayedServices.length < 6) {
    const fallback = serviceFallbacks[displayedServices.length];
    displayedServices.push({
      id: `fallback-${displayedServices.length}`,
      title: fallback.title,
      description: fallback.description,
      href: "/courses",
    });
  }

  const consultantMap = new Map<
    number,
    {
      id: number;
      consultantId: number;
      name: string;
      image: string | null;
      country: string;
      rating: number;
      description: string;
      chips: string[];
      offerings: string[];
    }
  >();

  for (const service of consultantServices.filter((item) => item.status === "active")) {
    const existing = consultantMap.get(service.consultant_id);
    const nextOfferings = [service.title, ...(service.service_category_names ?? [])].filter(Boolean);
    const nextChips = [...(service.service_category_names ?? []), ...(service.study_level_names ?? [])].filter(Boolean);

    if (existing) {
      existing.offerings = Array.from(new Set([...existing.offerings, ...nextOfferings])).slice(0, 6);
      existing.chips = Array.from(new Set([...existing.chips, ...nextChips])).slice(0, 4);
      continue;
    }

    consultantMap.set(service.consultant_id, {
      id: service.id,
      consultantId: service.consultant_id,
      name: service.consultant_name || "Shetu Consultant",
      image: getMediaUrl(service.consultant_image),
      country: service.country_name || "Australia",
      rating: service.consultant_rating || 5,
      description: trimText(
        service.description || "Guidance for destination choice, application planning, and visa support.",
        136,
      ),
      chips: Array.from(new Set(nextChips)).slice(0, 4),
      offerings: Array.from(new Set(nextOfferings)).slice(0, 6),
    });
  }

  const displayedConsultants =
    consultantMap.size > 0
      ? Array.from(consultantMap.values()).slice(0, 6)
      : Array.from({ length: 6 }, (_, index) => ({
          id: index,
          consultantId: index + 1,
          name: "Name",
          image: null,
          country: "Australia",
          rating: 5,
          description:
            "Personalized help for destination shortlisting, application planning, and visa preparation.",
          chips: ["Visa Processing", "File Processing", "Assessment"],
          offerings: ["Admission Support", "Visa Processing", "University Selection", "Scholarship Guidance"],
        }));

  const displayedPosts =
    activePosts.length > 0
      ? activePosts.slice(0, 3).map((post, index) => ({
          id: post.id,
          title: trimText(post.title, 58),
          description: trimText(post.description, 146),
          author: post.student_name || "Student",
          avatar: reviewFallbacks[index % reviewFallbacks.length].image,
          meta:
            post.country_name ||
            post.custom_country_name ||
            post.study_level_name ||
            post.custom_study_level_name ||
            "Study abroad request",
          rotation: [-7, -1, 6][index] ?? 0,
        }))
      : Array.from({ length: 3 }, (_, index) => ({
          id: index,
          title: "To Create Post, Update Your Education",
          description:
            "Students can publish consultation requests so consultants can respond with the right service and quotation.",
          author: "Philip J Coulson",
          avatar: reviewFallbacks[index % reviewFallbacks.length].image,
          meta: "Japan",
          rotation: [-7, -1, 6][index] ?? 0,
        }));

  const displayedReviews =
    testimonials.length > 0
      ? testimonials.slice(0, 5).map((review, index) => ({
          id: review.id,
          name: review.name,
          description: trimText(review.description, 220),
            image: getMediaUrl(review.image) ?? reviewFallbacks[index % reviewFallbacks.length].image,
        }))
      : reviewFallbacks.map((review, index) => ({
          id: index,
          ...review,
        }));

  useEffect(() => {
    setActiveReviewIndex((current) => {
      if (displayedReviews.length === 0) return 0;
      return current >= displayedReviews.length ? 0 : current;
    });
  }, [displayedReviews.length]);

  useEffect(() => {
    if (displayedReviews.length <= 1) return;
    const intervalId = window.setInterval(() => {
      setActiveReviewIndex((current) => (current + 1) % displayedReviews.length);
    }, 4500);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [displayedReviews.length]);

  const primaryReview = displayedReviews[activeReviewIndex] ?? displayedReviews[0];
  const reviewThumbs = displayedReviews
    .map((review, index) => ({ ...review, index }))
    .filter((review) => review.index !== activeReviewIndex)
    .slice(0, 4);
  const leadReviewThumb = reviewThumbs[0] ?? null;
  const trailingReviewThumbs = reviewThumbs.slice(1);
  const reviewIndexLabel = String(activeReviewIndex + 1).padStart(2, "0");

  const dynamicTrainings = activeTrainings.slice(0, 4).map((training, index) => ({
    id: training.id,
    title: training.title,
      image: getMediaUrl(training.thumbnail) ?? trainingFallbacks[index % trainingFallbacks.length].image,
  }));

  const displayedTrainings =
    dynamicTrainings.length > 0
      ? dynamicTrainings
      : trainingFallbacks.map((training, index) => ({
          id: index,
          ...training,
        }));

  const faqItems = faqs.length > 0 ? faqs.slice(0, 4) : c.fallbackFaqs;
  const aboutBody = trimText(site?.company_detail || c.aboutBody, 320);

  const handleHeroSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const href = buildSearchHref(activeSearchTab.route, activeSearchTab.queryKey, searchValue);
    startTransition(() => {
      router.push(asRoute(href));
    });
  };

  const goToPreviousReview = () => {
    setActiveReviewIndex((current) => (current - 1 + displayedReviews.length) % displayedReviews.length);
  };

  const goToNextReview = () => {
    setActiveReviewIndex((current) => (current + 1) % displayedReviews.length);
  };

  const handleConsultantShare = (
    event: MouseEvent<HTMLButtonElement>,
    consultant: { consultantId: number; name: string },
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setShareModalConsultant({
      name: consultant.name,
      profileUrl: buildConsultantProfileUrl(consultant.consultantId),
    });
  };

  const redirectToLogin = () => {
    const nextPath =
      typeof window !== "undefined"
        ? `${window.location.pathname}${window.location.search}`
        : "/";
    setLoginPromptConsultantName(null);
    router.push(asRoute(`/login?next=${encodeURIComponent(nextPath)}`));
  };

  const handleConsultantSave = async (
    event: MouseEvent<HTMLButtonElement>,
    consultant: { consultantId: number; name: string },
  ) => {
    event.preventDefault();
    event.stopPropagation();

    if (savePendingId === consultant.consultantId) return;

    if (!user) {
      setLoginPromptConsultantName(consultant.name);
      return;
    }

    if (!canSaveConsultants) {
      showToast({
        title: "Save is not available for this account",
        message: "Students, consultants, and agencies can save consultant profiles.",
        variant: "warning",
      });
      return;
    }

    const savedId = savedConsultantMap[consultant.consultantId];
    setSavePendingId(consultant.consultantId);

    try {
      if (savedId) {
        await removeSavedConsultant(savedId);
        setSavedConsultantMap((current) => {
          const next = { ...current };
          delete next[consultant.consultantId];
          return next;
        });
        showToast({
          title: "Consultant removed",
          message: `${consultant.name} was removed from your saved consultants.`,
          variant: "success",
        });
      } else {
        const savedConsultant = await saveConsultant(consultant.consultantId);
        setSavedConsultantMap((current) => ({
          ...current,
          [consultant.consultantId]: savedConsultant.id,
        }));
        showToast({
          title: "Consultant saved",
          message: `${consultant.name} was added to your saved consultants.`,
          variant: "success",
        });
      }
    } catch (error) {
      showToast({
        title: "Could not update saved consultants",
        message: getApiErrorMessage(error, "Please try again."),
        variant: "error",
      });
    } finally {
      setSavePendingId(null);
    }
  };

  return (
    <div className={styles.page}>
      <HeroSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        searchValue={searchValue}
        setSearchValue={setSearchValue}
        handleHeroSearch={handleHeroSearch}
        isPending={isPending}
        c={c}
      />

      <section className={styles.countrySection}>
        <div className={cn(styles.container, styles.countryWide, styles.countryWrap)}>
          <img src={`${assetBase}/globe_tranparent.png`} alt="" className={styles.countryBackdrop} />
          <div className={cn(styles.sectionHeader, styles.sectionHeaderCentered)}>
            <h2>{c.countryTitle}</h2>
            <p>{c.countryBody}</p>
          </div>

          <div className={styles.countryRail}>
            <div className={styles.countryTrack}>
              {marqueeCountries.map((country, index) => {
                const isDuplicate = index >= displayedCountries.length;
                return (
                  <Link
                    key={`${country.id}-${isDuplicate ? "duplicate" : "primary"}`}
                    href={asRoute(`/your-selected-result?country=${encodeURIComponent(country.name)}`)}
                    className={styles.countryCard}
                    aria-hidden={isDuplicate}
                    tabIndex={isDuplicate ? -1 : undefined}
                  >
                    <span className={styles.countryBadge}>
                      <img src={country.flagUrl} alt={`${country.name} flag`} className={styles.countryFlag} />
                    </span>
                    <span className={styles.countryName}>{country.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.studySection}>
        <div className={cn(styles.container, styles.studyGrid)}>
          <div className={styles.sectionHeader}>
            <h2>{c.studyTitle}</h2>
          </div>
          <p className={styles.studyBody}>{c.studyBody}</p>
        </div>

        <div className={cn(styles.container, styles.studyCards)}>
          {c.studyLevels.map((level, index) => (
            <Link
              key={level}
              href={asRoute(`/your-search-result?studyLevel=${encodeURIComponent(level)}`)}
              className={styles.studyCard}
            >
              <span className={styles.studyIconWrap}>
                <img src={studyLevelAssets[index]} alt={level} />
              </span>
              <span className={styles.studyLabel}>{level}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.universitySection}>
        <div className={cn(styles.container, styles.sectionSpacing)}>
          <div className={styles.sectionHeaderRow}>
            <div className={styles.sectionHeader}>
              <h2>{c.universityTitle}</h2>
              <p>{c.universityBody}</p>
            </div>
            <div className={styles.sectionTools}>
              <button type="button" className={styles.railButton} onClick={() => scrollRail(universityRailRef, -1)}>
                <ChevronLeft size={16} />
              </button>
              <button type="button" className={styles.railButton} onClick={() => scrollRail(universityRailRef, 1)}>
                <ChevronRight size={16} />
              </button>
              <Link href="/courses" className={cn(styles.button, styles.ghostButton)}>
                View all
              </Link>
            </div>
          </div>

          <div className={styles.universityRail} ref={universityRailRef}>
            {displayedUniversities.map((university) => (
              <Link key={university.id} href={asRoute(university.href)} className={styles.universityCard}>
                <img src={university.image} alt={university.title} className={styles.universityImage} />
                <div className={styles.universityOverlay}>
                  <span className={styles.universityMeta}>{university.meta}</span>
                  <strong>{university.title}</strong>
                  <span className={styles.universityLink}>
                    See more <ArrowRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.guidanceSection}>
        <div className={cn(styles.container, styles.sectionSpacing)}>
          <div className={cn(styles.sectionHeader, styles.sectionHeaderCentered, styles.sectionHeaderLight)}>
            <h2>{c.serviceTitle}</h2>
            <p>{c.serviceBody}</p>
          </div>

          <div className={styles.serviceGrid}>
            {displayedServices.map((service, index) => {
              const Icon = [FileCheck2, NotebookPen, ShieldCheck, WalletCards, Sparkles, GraduationCap][index];
              return (
              <Link key={service.id} href={asRoute(service.href)} className={styles.serviceCard}>
                  <span className={styles.serviceIcon}>
                    <Icon size={20} />
                  </span>
                  <strong>{service.title}</strong>
                  <p>{service.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.aboutSection}>
        <div className={cn(styles.container, styles.aboutGrid)}>
          <div className={styles.aboutCopy}>
            <span className={styles.eyebrow}>{c.aboutKicker}</span>
            <h2>{c.aboutTitle}</h2>
            <p>{aboutBody}</p>
            <Link href="/register" className={cn(styles.button, styles.darkButton, styles.aboutButton)}>
              {c.aboutCta}
              <ArrowRight size={18} />
            </Link>
            <div className={styles.reviewStrip}>
              <div className={styles.avatarStack}>
                {reviewThumbs.slice(0, 4).map((review) => (
                  <img key={review.id} src={review.image} alt={review.name} />
                ))}
              </div>
              <div>
                <div className={styles.starRow}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} size={14} className={styles.filledStar} />
                  ))}
                </div>
                <span>{c.aboutReview}</span>
              </div>
            </div>
          </div>

          <div className={styles.aboutVisual}>
            <img src={`${assetBase}/about_us_img.jpg`} alt="About Shetu" className={styles.aboutImage} />
            <div className={styles.aboutMetricCard}>
              <strong>99%</strong>
              <span>{c.aboutMetric}</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.consultantSection}>
        <div className={cn(styles.container, styles.sectionSpacing)}>
          <div className={cn(styles.sectionHeader, styles.sectionHeaderCentered)}>
            <h2>{c.consultantsTitle}</h2>
            <p>{c.consultantsBody}</p>
          </div>

          <div className={styles.consultantGrid}>
            {displayedConsultants.map((consultant) => {
              const consultantHref = asRoute(buildConsultantProfilePath(consultant.consultantId));
              const serviceItems =
                consultant.chips.length > 0
                  ? consultant.chips.slice(0, 4)
                  : ["Visa Processing", "Assessment", "File Processing", "Counselling"];
              const isSaved = Boolean(savedConsultantMap[consultant.consultantId]);
              const isSavePending = savePendingId === consultant.consultantId;

              return (
                <article
                  key={consultant.id}
                  className={styles.consultantCard}
                  role="link"
                  tabIndex={0}
                  aria-label={`Open ${consultant.name} consultant profile`}
                  onClick={() => router.push(consultantHref)}
                  onKeyDown={(event) => {
                    if (!isKeyboardNavigationKey(event)) return;
                    event.preventDefault();
                    router.push(consultantHref);
                  }}
                >
                  <div className={styles.consultantTop}>
                    <div className={styles.consultantTopMain}>
                      {consultant.image ? (
                        <img src={consultant.image} alt={consultant.name} className={styles.consultantAvatar} />
                      ) : (
                        <div className={styles.consultantAvatarFallback}>{getInitials(consultant.name)}</div>
                      )}
                      <div className={styles.consultantMeta}>
                        <div className={styles.consultantNameRow}>
                          <strong>{consultant.name}</strong>
                          <BadgeCheck size={15} />
                        </div>
                        <div className={styles.consultantRoleRow}>
                          <span>Consultant</span>
                          <div className={styles.starRow}>
                            {Array.from({ length: 5 }).map((_, index) => (
                              <Star
                                key={index}
                                size={13}
                                className={index < Math.round(consultant.rating) ? styles.filledStar : styles.emptyStar}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={styles.consultantCountryBadge}>
                      <img
                        src={getCountryFlagUrl(consultant.country)}
                        alt={`${consultant.country} flag`}
                        className={styles.consultantCountryFlag}
                      />
                      <span className={styles.consultantCountryName}>{consultant.country}</span>
                    </div>
                  </div>

                  <div className={styles.consultantServices}>
                    {serviceItems.map((chip, index) => (
                      <span key={`${consultant.id}-${chip}-${index}`} className={styles.consultantServiceItem}>
                        {index % 2 === 0 ? <FileCheck2 size={13} /> : <WalletCards size={13} />}
                        {chip}
                      </span>
                    ))}
                  </div>

                  <p className={styles.consultantDescription}>{consultant.description}</p>

                  <div className={styles.consultantOfferings}>
                    <span className={styles.consultantOfferingsLabel}>Services</span>
                    <div className={styles.consultantOfferingList}>
                      {consultant.offerings.map((offering, index) => (
                        <span key={`${consultant.id}-offering-${index}`} className={styles.consultantOfferingItem}>
                          {offering}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className={styles.consultantActions}>
                    <Link href={consultantHref} className={cn(styles.button, styles.darkButton, styles.consultantAction)}>
                      {c.consultantButton}
                      <ArrowRight size={15} />
                    </Link>
                    <button
                      type="button"
                      className={styles.consultantIconAction}
                      aria-label={`Share ${consultant.name}`}
                      onClick={(event) => handleConsultantShare(event, consultant)}
                    >
                      <Share2 size={15} />
                    </button>
                    <button
                      type="button"
                      className={cn(
                        styles.consultantIconAction,
                        isSaved && styles.consultantIconActionSaved,
                        isSavePending && styles.consultantIconActionBusy,
                      )}
                      aria-label={isSaved ? `Remove ${consultant.name} from saved consultants` : `Save ${consultant.name}`}
                      aria-pressed={isSaved}
                      disabled={isSavePending}
                      onClick={(event) => void handleConsultantSave(event, consultant)}
                    >
                      <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.sectionAction}>
            <Link href="/consultants" className={cn(styles.button, styles.ghostButton)}>
              {c.consultantsCta}
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.postsSection}>
        <div className={cn(styles.container, styles.postsGrid)}>
          <div className={styles.postsCopy}>
            <h2>{c.postsTitle}</h2>
            <p>{c.postsBody}</p>
            <Link href="/student-post" className={cn(styles.button, styles.darkButton)}>
              {c.postsCta}
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className={styles.postsStack}>
            {displayedPosts.map((post) => (
              <article
                key={post.id}
                className={styles.postCard}
                style={{ transform: `rotate(${post.rotation}deg)` }}
              >
                <h3>{post.title}</h3>
                <p>{post.description}</p>
                <div className={styles.postMeta}>
                  <div className={styles.postAuthor}>
                    <span className={styles.postAvatar}>
                      <img src={post.avatar} alt={post.author} className={styles.postAvatarImage} />
                    </span>
                    <div>
                      <strong>{post.author}</strong>
                      <span>{post.meta}</span>
                    </div>
                  </div>
                  <Link href="/student-post" className={styles.postButton}>
                    Send quotation
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.agencySection}>
        <div className={cn(styles.container, styles.sectionSpacing, styles.agencyShell)}>
          <div className={styles.agencyHeader}>
            <div className={styles.agencyHeaderCopy}>
              <h2>{c.agenciesTitle}</h2>
              <p>{c.agenciesBody}</p>
            </div>
            <Link href="/consultants" className={styles.agencyViewAll}>
              {c.agenciesCta}
            </Link>
          </div>

          <div className={styles.agencyStage}>
            <button
              type="button"
              className={cn(styles.agencyNavButton, styles.agencyNavButtonLeft)}
              onClick={() => scrollRail(agencyRailRef, -1)}
              aria-label="Previous agencies"
            >
              <ChevronLeft size={18} />
            </button>

            <div className={styles.agencyRail} ref={agencyRailRef}>
              {agencyFallbacks.map((agency, index) => (
                <article key={`${agency.name}-${index}`} className={styles.agencyCard}>
                  <img src={agency.image} alt={agency.name} className={styles.agencyImage} />
                  <div className={styles.agencyLogoWrap}>
                    <img src={agency.logo} alt={`${agency.name} logo`} className={styles.agencyLogo} />
                  </div>
                  <div className={styles.agencyContent}>
                    <strong>{agency.name}</strong>
                    <p>To Create Post, Update Your EducationTo Create Post, EducationTo Create Post.</p>
                    <div className={styles.agencyStats}>
                      <span className={styles.agencyStat}>
                        <Globe2 size={14} />
                        {agency.countries}
                      </span>
                      <span className={styles.agencyStat}>
                        <Users2 size={14} />
                        {agency.consultants}
                      </span>
                      <span className={styles.agencyStat}>
                        <NotebookPen size={14} />
                        {agency.services}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              type="button"
              className={cn(styles.agencyNavButton, styles.agencyNavButtonRight)}
              onClick={() => scrollRail(agencyRailRef, 1)}
              aria-label="Next agencies"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </section>

      <section className={styles.reviewsSection}>
        <div className={cn(styles.container, styles.reviewsGrid)}>
          <div className={styles.reviewsLabel}>{c.reviewsTitle}</div>

          <div className={styles.reviewsStage}>
            {leadReviewThumb ? (
              <button
                type="button"
                className={cn(styles.reviewThumbButton, styles.reviewThumbLead)}
                onClick={() => setActiveReviewIndex(leadReviewThumb.index)}
                aria-label={`Show review from ${leadReviewThumb.name}`}
              >
                <img src={leadReviewThumb.image} alt={leadReviewThumb.name} className={styles.reviewThumb} />
              </button>
            ) : null}

            <div key={`review-visual-${primaryReview.id}`} className={styles.reviewsVisual}>
              <img src={primaryReview.image} alt={primaryReview.name} className={styles.primaryReviewImage} />
            </div>

            <div key={`review-content-${primaryReview.id}`} className={styles.reviewContent}>
              <span className={styles.reviewIndex}>{reviewIndexLabel}</span>
              <h2>{primaryReview.name}</h2>
              <p>{primaryReview.description}</p>
            </div>

            <div className={styles.reviewThumbTrail}>
              {trailingReviewThumbs.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  className={styles.reviewThumbButton}
                  onClick={() => setActiveReviewIndex(review.index)}
                  aria-label={`Show review from ${review.name}`}
                >
                  <img src={review.image} alt={review.name} className={styles.reviewThumb} />
                </button>
              ))}
            </div>

            <div className={styles.reviewNav}>
              <button type="button" className={styles.reviewNavButton} onClick={goToPreviousReview} aria-label="Previous review">
                <ChevronLeft size={18} />
              </button>
              <button type="button" className={styles.reviewNavButton} onClick={goToNextReview} aria-label="Next review">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.trainingSection}>
        <div className={cn(styles.container, styles.trainingPanel)}>
          <div className={styles.trainingCopy}>
            <span className={styles.eyebrow}>{c.trainingTitle}</span>
            <h2>{c.trainingBody}</h2>
            <p>{c.trainingText}</p>
            <Link href="/courses" className={styles.trainingLink}>
              {c.trainingCta} <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.trainingGrid}>
            {displayedTrainings.map((training) => (
              <Link key={training.id} href={asRoute("/courses")} className={styles.trainingCard}>
                <img src={training.image} alt={training.title} />
                <span>{training.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.faqSection}>
        <div className={cn(styles.container, styles.faqGrid)}>
          <div className={styles.faqCopy}>
            <h2>{c.faqTitle}</h2>
            <p>{c.faqBody}</p>
            <Link href="/contact" className={styles.faqLink}>
              {c.faqCta} <ArrowRight size={16} />
            </Link>
          </div>

          <div className={styles.faqList}>
            {faqItems.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <button
                  key={`${faq.question}-${index}`}
                  type="button"
                  className={cn(styles.faqItem, isOpen && styles.faqItemOpen)}
                  onClick={() => setOpenFaq((current) => (current === index ? -1 : index))}
                >
                  <div className={styles.faqHead}>
                    <strong>{faq.question}</strong>
                    <span>{isOpen ? "−" : "+"}</span>
                  </div>
                  {isOpen ? <p>{faq.answer}</p> : null}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <SiteFooter settings={site} />
      <ConsultantShareModal
        consultantName={shareModalConsultant?.name ?? ""}
        open={Boolean(shareModalConsultant)}
        onClose={() => setShareModalConsultant(null)}
        profileUrl={shareModalConsultant?.profileUrl ?? ""}
      />
      <LoginRequiredModal
        consultantName={loginPromptConsultantName ?? "this consultant"}
        onClose={() => setLoginPromptConsultantName(null)}
        onConfirm={redirectToLogin}
        open={Boolean(loginPromptConsultantName)}
      />
    </div>
  );
}
