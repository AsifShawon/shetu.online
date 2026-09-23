"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, FormEvent, MouseEvent } from "react";
import {
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Globe2,
  Sparkles,
  Landmark,
  WalletCards,
  Mic,
  SendHorizontal,
  Users2,
  CheckCircle2,
  ShieldCheck,
  Globe,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import HeroAnimatedGlobe from "@/components/globe/HeroAnimatedGlobe";

// Types
export type SearchTabId = "course" | "country" | "scholarship" | "university" | "budget";

export interface SearchTab {
  id: SearchTabId;
  label: string;
  placeholder: string;
  route: string;
  queryKey: string;
  Icon: typeof GraduationCap;
}

export const searchTabs: SearchTab[] = [
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
    placeholder: "Set your budget limit (e.g. 10000 USD)",
    route: "/your-selected-result-Budget",
    queryKey: "budget",
    Icon: WalletCards,
  },
];

const assetBase = "/legacy/Frontend/assets/img/page";
const heroRightSlides = [
  `${assetBase}/hero-right/image_1.png`,
  `${assetBase}/hero-right/image_2.png`,
  `${assetBase}/hero-right/image_3.png`,
  `${assetBase}/hero-right/image_4.png`,
  `${assetBase}/hero-right/image_5.png`,
  `${assetBase}/hero-right/image_6.png`,
];

interface HeroSectionProps {
  activeTab: SearchTabId;
  setActiveTab: (id: SearchTabId) => void;
  searchValue: string;
  setSearchValue: (val: string) => void;
  handleHeroSearch: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  c: {
    heroTitle: string;
    heroBody: string;
    heroPrimary: string;
    heroSecondary: string;
    searchLabel: string;
  };
}

export function HeroSection({
  activeTab,
  setActiveTab,
  searchValue,
  setSearchValue,
  handleHeroSearch,
  isPending,
  c,
}: HeroSectionProps) {
  const activeSearchTab = searchTabs.find((tab) => tab.id === activeTab) ?? searchTabs[0];

  return (
    <section className="relative overflow-hidden pt-8 pb-16 md:pb-24 lg:pb-28 bg-gradient-to-b from-[#F7FAF8] via-[#F1F8F4] to-[#E5F2EC]/60">
      
      {/* Decorative glows (tuned down for brand classicism) */}
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-[#DDEFE5]/40 rounded-full blur-[100px] pointer-events-none -translate-y-1/2" aria-hidden="true" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#045330]/5 rounded-full blur-[120px] pointer-events-none" aria-hidden="true" />

      {/* Background Globe - Centered bottom, hidden on mobile */}
      <div className="absolute inset-x-0 bottom-0 top-1/3 z-0 opacity-15 lg:opacity-25 pointer-events-none select-none overflow-hidden hidden md:block" aria-hidden="true">
        <div className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-[35%] w-[1200px] h-[600px]">
          <HeroAnimatedGlobe />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10">
        
        {/* Top Content Layout: 2-column Grid */}
        <div className="grid gap-10 lg:grid-cols-12 items-center">
          
          {/* Left Column: Typography Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Eyebrow badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F1F8F4] border border-[#c8ded0] text-[#045330] text-xs md:text-sm font-semibold uppercase tracking-wider shadow-sm select-none">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EB0310] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EB0310]"></span>
              </span>
              Study Abroad • Consultants • Scholarships
            </div>

            {/* Badge to Heading space: exactly 20px */}
            <div className="mb-[20px]" />

            {/* Heading: Dual-tone styled (Option A) */}
            <h1 className="text-[#045330] font-extrabold text-4xl sm:text-5xl lg:text-6xl leading-[1.14] tracking-tight max-w-2xl">
              Find Your Ideal Study{" "}
              <span className="text-[#EB0310]">
                Destination
              </span>
            </h1>

            {/* Heading to Paragraph space: exactly 20px */}
            <p className="mt-[20px] text-slate-600 text-base md:text-lg max-w-xl leading-relaxed font-medium">
              Access comprehensive guidance for university matches, course choices, active scholarships, and visa protocols. Connect directly with certified consultants to start your global education journey.
            </p>

            {/* Paragraph to Buttons space: exactly 28px */}
            <div className="flex flex-col sm:flex-row gap-4 mt-[28px] w-full sm:w-auto">
              <Link
                href="/study-abroad"
                className="group inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-[#045330] hover:bg-[#03462A] text-white font-bold shadow-md hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-sm md:text-base"
              >
                <span>{c.heroPrimary || "Study Abroad"}</span>
                <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <Link
                href="/consultants"
                className="inline-flex items-center justify-center gap-2 h-12 px-7 rounded-2xl bg-white hover:bg-[#F1F8F4] text-[#045330] font-bold border border-[#c8ded0] hover:border-[#045330]/30 shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 text-sm md:text-base"
              >
                <Users2 className="w-5 h-5 text-[#EB0310]" />
                <span>{c.heroSecondary || "Consultation Services"}</span>
              </Link>
            </div>

            {/* Buttons to Trust indicators space: exactly 26px */}
            <div className="pt-3 mt-[26px] flex flex-wrap gap-y-3 gap-x-6 text-slate-600 text-xs md:text-sm font-semibold border-t border-[#DDEFE5] w-full max-w-xl">
              <span className="flex items-center gap-2 hover:text-[#045330] transition-colors">
                <ShieldCheck className="w-5 h-5 text-[#045330] opacity-90" />
                Verified consultants
              </span>
              <span className="flex items-center gap-2 hover:text-[#045330] transition-colors">
                <Globe className="w-5 h-5 text-[#045330] opacity-90" />
                Multiple countries
              </span>
              <span className="flex items-center gap-2 hover:text-[#045330] transition-colors">
                <CheckCircle2 className="w-5 h-5 text-[#EB0310]" />
                Course & university matching
              </span>
            </div>
          </div>

          {/* Right Column: Slider Card */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end w-full">
            <HeroSlider />
          </div>

        </div>

        {/* Hero Content to Search Panel: 48px to 56px spacing */}
        <div className="mt-12 md:mt-[48px] lg:mt-[56px] relative z-10">
          <HeroSearchPanel
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            searchValue={searchValue}
            setSearchValue={setSearchValue}
            handleHeroSearch={handleHeroSearch}
            isPending={isPending}
            activeSearchTab={activeSearchTab}
          />
        </div>

      </div>

      {/* Embedded floating badge animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(5px); }
        }
        .animate-float-badge-1 {
          animation: float 5.5s ease-in-out infinite;
        }
        .animate-float-badge-2 {
          animation: float-reverse 6.5s ease-in-out infinite;
          animation-delay: 1s;
        }
      `}</style>
    </section>
  );
}

// HeroSlider Component
function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Sync prefers-reduced-motion media query
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, []);

  // Auto-sliding interval logic (4-5s)
  useEffect(() => {
    if (isPaused || reducedMotion) return;

    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroRightSlides.length);
    }, 4500);

    return () => clearInterval(timer);
  }, [isPaused, reducedMotion]);

  const handlePrev = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsPaused(true);
    setCurrentSlide((prev) => (prev - 1 + heroRightSlides.length) % heroRightSlides.length);
  };

  const handleNext = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setIsPaused(true);
    setCurrentSlide((prev) => (prev + 1) % heroRightSlides.length);
  };

  const handleDotClick = (index: number) => {
    setIsPaused(true);
    setCurrentSlide(index);
  };

  return (
    <div
      className="relative w-full max-w-[480px] lg:max-w-none aspect-[4/3] rounded-[28px] border border-slate-200/60 bg-white shadow-md p-3 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Slide frame wrapper */}
      <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-slate-100 border border-slate-200/50">
        {heroRightSlides.map((image, index) => (
          <div
            key={image}
            className={cn(
              "absolute inset-0 transition-all duration-600 ease-in-out",
              reducedMotion
                ? (index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none")
                : (index === currentSlide ? "opacity-100 scale-100 z-10 translate-x-0" : "opacity-0 scale-95 z-0 pointer-events-none")
            )}
          >
            <Image
              src={image}
              alt="Study Abroad Destination Scenery"
              fill
              sizes="(max-w-1024px) 100vw, 450px"
              priority={index === 0}
              className="object-cover"
            />
          </div>
        ))}

        {/* Gradient dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-transparent to-transparent pointer-events-none z-10" />

        {/* Navigation Chevrons */}
        <button
          onClick={handlePrev}
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#045330] hover:bg-[#045330] hover:text-white flex items-center justify-center shadow transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 outline-none focus:ring-2 focus:ring-[#045330] active:scale-95"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={handleNext}
          type="button"
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/95 text-[#045330] hover:bg-[#045330] hover:text-white flex items-center justify-center shadow transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-20 outline-none focus:ring-2 focus:ring-[#045330] active:scale-95"
          aria-label="Next slide"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* Dot Indicators */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
          {heroRightSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              type="button"
              className={cn(
                "h-1.5 rounded-full transition-all duration-300 outline-none focus:ring-2 focus:ring-[#045330]",
                index === currentSlide ? "w-5 bg-white" : "w-1.5 bg-white/50 hover:bg-white/85"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Floating Badge 1: Top-Left destinations */}
      <div className="absolute -top-3.5 -left-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-md border border-[#DDEFE5] flex items-center gap-2 animate-float-badge-1 select-none">
        <div className="p-1 rounded-lg bg-[#F1F8F4] text-[#045330]">
          <Globe2 className="w-4 h-4" />
        </div>
        <div className="text-left">
          <p className="text-[9px] text-[#045330]/80 font-bold uppercase tracking-wider leading-none">Popular Hubs</p>
          <p className="text-xs font-bold text-[#045330] mt-0.5">UK • USA • Canada • Australia</p>
        </div>
      </div>

      {/* Floating Badge 2: Bottom-Right support */}
      <div className="absolute -bottom-3.5 -right-3.5 z-20 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-md border border-[#DDEFE5] flex items-center gap-2 animate-float-badge-2 select-none">
        <div className="p-1 rounded-lg bg-[#FEF2F2] text-[#EB0310]">
          <Sparkles className="w-4 h-4 fill-[#EB0310]" />
        </div>
        <div className="text-left">
          <p className="text-[9px] text-[#EB0310] font-bold uppercase tracking-wider leading-none">Scholarships</p>
          <p className="text-xs font-bold text-[#045330] mt-0.5">Guidance Available</p>
        </div>
      </div>
    </div>
  );
}

interface HeroSearchPanelProps {
  activeTab: SearchTabId;
  setActiveTab: (id: SearchTabId) => void;
  searchValue: string;
  setSearchValue: (val: string) => void;
  handleHeroSearch: (event: FormEvent<HTMLFormElement>) => void;
  isPending: boolean;
  activeSearchTab: SearchTab;
}

// HeroSearchPanel Component
function HeroSearchPanel({
  activeTab,
  setActiveTab,
  searchValue,
  setSearchValue,
  handleHeroSearch,
  isPending,
  activeSearchTab,
}: HeroSearchPanelProps) {
  return (
    <div className="bg-white rounded-[24px] shadow-[0_16px_48px_rgba(4,83,48,0.08)] border border-[#DDEFE5] p-4 md:p-6 w-full max-w-4xl mx-auto text-left relative z-10">
      
      {/* Segmented active Tab selector - Shetu Green / soft surface theme */}
      <div className="bg-[#F1F8F4] p-1 rounded-2xl flex items-center gap-1 border border-[#DDEFE5] mb-5 overflow-x-auto scrollbar-none">
        {searchTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchValue("");
              }}
              type="button"
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all duration-300 outline-none focus:ring-2 focus:ring-[#045330]/25",
                isActive
                  ? "bg-[#045330] text-white shadow-md border-transparent"
                  : "text-slate-600 hover:text-[#045330] hover:bg-[#045330]/5"
              )}
            >
              <tab.Icon className={cn("w-4 h-4", isActive ? "text-white" : "text-slate-400")} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Submission Form */}
      <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
        <div className="relative flex-1 flex items-center bg-slate-50 hover:bg-slate-100/60 focus-within:bg-white border border-slate-200 focus-within:border-[#045330] rounded-xl md:rounded-2xl px-4 py-3 md:py-4 focus-within:ring-4 focus-within:ring-[#DDEFE5] transition-all duration-300">
          <Sparkles className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
          <input
            type={activeTab === "budget" ? "number" : "text"}
            min={activeTab === "budget" ? "0" : undefined}
            className="w-full bg-transparent text-slate-800 placeholder-slate-400 font-semibold focus:outline-none text-sm md:text-base"
            placeholder={activeSearchTab.placeholder}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            aria-label={activeSearchTab.placeholder}
          />
          <button
            type="button"
            className="p-1.5 text-slate-400 hover:text-[#045330] transition-colors ml-2 focus:outline-none"
            aria-label="Voice search"
          >
            <Mic className="w-5 h-5" />
          </button>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="bg-[#EB0310] hover:bg-[#C8000C] text-white font-bold px-8 py-3.5 md:py-4 rounded-xl md:rounded-2xl flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(235,3,16,0.25)] hover:shadow-[0_10px_24px_rgba(235,3,16,0.32)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 disabled:opacity-70 disabled:pointer-events-none text-sm md:text-base whitespace-nowrap"
        >
          <span>Search Results</span>
          <SendHorizontal className="w-4 h-4 md:w-5 h-5" />
        </button>
      </form>
    </div>
  );
}
