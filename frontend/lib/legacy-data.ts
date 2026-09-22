export type LegacyConsultant = {
  id: string;
  name: string;
  title: string;
  country: string;
  countryImage?: string;
  rating: number;
  reviewCount: number;
  image: string;
  badge?: "Verified" | "Pro";
  summary: string;
  services: string[];
  studyLevels: string[];
  experience: string;
  price: string;
  joinedDate?: string;
  serviceOptions?: Array<{ name: string; price: string }>;
};

export type LegacyCourse = {
  id: string;
  title: string;
  type: string;
  organization: string;
  price: string;
  duration: string;
  image: string;
  summary: string;
};

export type LegacyPost = {
  id: string;
  title: string;
  country: string;
  studyLevel: string;
  budget: string;
  subject: string;
  description: string;
};

export const legacySite = {
  companyName: "Shetu",
  phone: "+8801712345678",
  email: "contact@shetu.com.bd",
  secondaryEmail: "course@promaxbpo.com",
  address: "Dhaka, Bangladesh",
  facebook: "#",
  twitter: "#",
  youtube: "#",
  instagram: "#",
  companyDetail:
    "Shetu helps students explore study destinations, connect with consultants, and take the next step toward overseas education.",
  homeHeroTitle: "Find Your Ideal University Abroad",
  homeHeroText:
    "Get matched with the right universities, programs, and scholarships based on your academic profile and budget — all in one place."
} as const;

export const publicNav = [
  { href: "/consultants", label: "কনসালটেন্ট" },
  { href: "/courses", label: "কনসালটেন্ট ট্রেইনিং" },
  { href: "/register", label: "কনসালটেন্ট হোন" },
  { href: "/become_pro_consultants", label: "প্রো কনসালটেন্ট" }
] as const;

export const countries = [
  { name: "Australia", image: "/legacy/Frontend/assets/img/gallery/course-banner.avif" },
  { name: "Canada", image: "/legacy/Frontend/assets/img/gallery/studentvisa.jpg" },
  { name: "United Kingdom", image: "/legacy/Frontend/assets/img/gallery/studentvisa2.jpg" },
  { name: "Germany", image: "/legacy/Frontend/assets/img/gallery/studentvisa3.jpg" },
  { name: "Japan", image: "/legacy/Frontend/assets/img/gallery/people.png" },
  { name: "Malaysia", image: "/legacy/Frontend/assets/img/gallery/background.jpg" }
] as const;

export const services = [
  "University Selection",
  "Scholarship Guidance",
  "Visa Processing",
  "Application Review",
  "SOP Support",
  "Interview Preparation"
] as const;

export const studyLevels = [
  "School",
  "Undergraduate",
  "PostGraduate",
  "Doctorate",
  "Vocational"
] as const;

export const faqs = [
  {
    question: "What is the cost of using Shetu?",
    answer:
      "You can browse consultants, explore countries, and compare opportunities before choosing any paid consultancy service."
  },
  {
    question: "Are the consultants verified on Shetu?",
    answer:
      "Verified consultants go through profile completion and review checks, and their profile cards clearly show their verification status."
  },
  {
    question: "How long will it take to receive my evaluation report?",
    answer:
      "Assessment delivery depends on consultant setup, but the platform clearly shows estimated duration before you send the request."
  },
  {
    question: "Can I search by country, course, and budget?",
    answer:
      "Yes. The public filtering flow is designed around course, study level, university, scholarship, and budget combinations."
  }
] as const;

export const consultants: LegacyConsultant[] = [
  {
    id: "1",
    name: "Shawon Asif",
    title: "Australia and UK Admission Strategy Consultant",
    country: "Australia",
    countryImage: "/legacy/Frontend/assets/img/gallery/studentvisa.jpg",
    rating: 4.8,
    reviewCount: 126,
    image: "/legacy/no-profile-img.png",
    badge: "Verified",
    summary:
      "Supports students with university shortlisting, document review, and application strategy for high-demand destinations.",
    services: ["University Selection", "Visa Processing", "SOP Support"],
    studyLevels: ["Undergraduate", "PostGraduate"],
    experience: "6+ years experience in international admissions guidance.",
    price: "৳ 2,500",
    joinedDate: "26 Feb, 2026",
    serviceOptions: [
      { name: "Assessment", price: "৳ 500" },
      { name: "Visa Processing", price: "৳ 600" }
    ]
  },
  {
    id: "2",
    name: "Nafisa Rahman",
    title: "Canada and Germany Study Abroad Advisor",
    country: "Canada",
    countryImage: "/legacy/Frontend/assets/img/gallery/studentvisa2.jpg",
    rating: 4.7,
    reviewCount: 98,
    image: "/legacy/no-profile-img.png",
    badge: "Pro",
    summary:
      "Works with student profiles, scholarship targeting, and visa-readiness planning for Europe and North America.",
    services: ["Scholarship Guidance", "Application Review", "Interview Preparation"],
    studyLevels: ["Undergraduate", "PostGraduate", "Doctorate"],
    experience: "5+ years handling scholarship-focused applicant journeys.",
    price: "৳ 3,000",
    joinedDate: "14 Mar, 2026",
    serviceOptions: [
      { name: "Scholarship Guidance", price: "৳ 700" },
      { name: "Interview Prep", price: "৳ 550" }
    ]
  },
  {
    id: "3",
    name: "Tariqul Islam",
    title: "Japan and Malaysia Admissions Consultant",
    country: "Japan",
    countryImage: "/legacy/Frontend/assets/img/gallery/background.jpg",
    rating: 4.6,
    reviewCount: 73,
    image: "/legacy/no-profile-img.png",
    badge: "Verified",
    summary:
      "Focused on affordable destinations and step-by-step student assistance from profile review to visa preparation.",
    services: ["University Selection", "Application Review", "Visa Processing"],
    studyLevels: ["School", "Undergraduate", "Vocational"],
    experience: "4+ years guiding budget-sensitive applications.",
    price: "৳ 2,000",
    joinedDate: "03 Jan, 2026",
    serviceOptions: [
      { name: "Application Review", price: "৳ 400" },
      { name: "Visa Support", price: "৳ 650" }
    ]
  }
];

export const courses: LegacyCourse[] = [
  {
    id: "1",
    title: "Foreign Education and Study Abroad Student Consultancy Training",
    type: "Training",
    organization: "Shetu Academy",
    price: "BDT 4,500",
    duration: "6 Weeks",
    image: "/legacy/Frontend/assets/img/page/training_banner.png",
    summary:
      "A practical course for consultants and advisors who want to understand student counseling, applications, and visa workflows."
  },
  {
    id: "2",
    title: "Student Visa File Preparation Bootcamp",
    type: "Workshop",
    organization: "Shetu Academy",
    price: "BDT 2,900",
    duration: "3 Weeks",
    image: "/legacy/Frontend/assets/img/gallery/courses-banner.png",
    summary:
      "Focused on document collection, readiness checks, SOP support, and visa workflow structure."
  }
];

export const studentPosts: LegacyPost[] = [
  {
    id: "1",
    title: "Need guidance for Canada undergraduate intake",
    country: "Canada",
    studyLevel: "Undergraduate",
    budget: "BDT 12-15 lakh",
    subject: "Computer Science",
    description: "Looking for a consultant who can help with admission, tuition range, and scholarship possibilities."
  },
  {
    id: "2",
    title: "Seeking Germany masters roadmap",
    country: "Germany",
    studyLevel: "PostGraduate",
    budget: "BDT 10 lakh",
    subject: "Mechanical Engineering",
    description: "Need a consultant for profile review, shortlist creation, and visa support."
  }
];

export const proPackages = [
  {
    name: "Starter Pro",
    price: "BDT 2,999",
    description: "Highlighted profile, public badge, and improved consultant discoverability."
  },
  {
    name: "Growth Pro",
    price: "BDT 5,499",
    description: "Everything in Starter plus advanced service visibility and premium positioning."
  }
] as const;

export const testimonials = [
  {
    name: "Mim Akter",
    text: "The consultant matching process made it much easier to compare destinations and understand my budget realistically."
  },
  {
    name: "Rahim Uddin",
    text: "The platform helped me shortlist universities and understand next steps before spending money on applications."
  }
] as const;
