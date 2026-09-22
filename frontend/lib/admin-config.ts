export type AdminSectionKey =
  | "overview"
  | "content"
  | "catalog"
  | "packages"
  | "verification"
  | "training"
  | "transactions";

export type AdminFieldType =
  | "text"
  | "password"
  | "email"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "date"
  | "datetime"
  | "file"
  | "json";

export interface AdminSelectOption {
  label: string;
  value: string | number;
}

export interface AdminFieldConfig {
  name: string;
  label: string;
  type: AdminFieldType;
  placeholder?: string;
  helperText?: string;
  required?: boolean;
  rows?: number;
  accept?: string;
  options?: AdminSelectOption[];
  optionSource?: string;
  optionLabelKey?: string;
  optionValueKey?: string;
}

export interface AdminResourceColumn {
  key: string;
  label: string;
}

export interface AdminResourceConfig {
  key: string;
  label: string;
  singularLabel: string;
  description: string;
  path: string;
  columns: AdminResourceColumn[];
  fields: AdminFieldConfig[];
  readOnly?: boolean;
  allowCreate?: boolean;
  allowDelete?: boolean;
}

export interface AdminSectionConfig {
  section: AdminSectionKey;
  title: string;
  description: string;
  resources?: AdminResourceConfig[];
}

export interface AdminSidebarItem {
  key: string;
  label: string;
  href?: string;
  icon: string;
  section?: AdminSectionKey;
  resourceKey?: string;
  children?: AdminSidebarItem[];
}

const activeStatusOptions: AdminSelectOption[] = [
  { label: "Active", value: "active" },
  { label: "Disabled", value: "disabled" },
];

const verificationOptions: AdminSelectOption[] = [
  { label: "Pending", value: "pending" },
  { label: "In Progress", value: "in_progress" },
  { label: "Accepted", value: "accepted" },
  { label: "Rejected", value: "rejected" },
];

const subscriptionOptions: AdminSelectOption[] = [
  { label: "None", value: "none" },
  { label: "Pro", value: "pro" },
];

const roleOptions: AdminSelectOption[] = [
  { label: "Student", value: "student" },
  { label: "Consultant", value: "consultant" },
  { label: "Agency", value: "agency" },
  { label: "Admin", value: "admin" },
];

const orderStatusOptions: AdminSelectOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "In Progress", value: "in_progress" },
  { label: "Delivered", value: "delivered" },
];

const paymentStatusOptions: AdminSelectOption[] = [
  { label: "Unpaid", value: "unpaid" },
  { label: "Paid", value: "paid" },
  { label: "Success", value: "success" },
];

const withdrawalStatusOptions: AdminSelectOption[] = [
  { label: "Pending", value: "pending" },
  { label: "Completed", value: "completed" },
  { label: "Rejected", value: "rejected" },
];

const classScheduleStatusOptions: AdminSelectOption[] = [
  { label: "Active", value: "active" },
  { label: "In-active", value: "inactive" },
  { label: "Completed", value: "completed" },
];

export const adminOptionSources: Record<string, string> = {
  countries: "/api/admin/countries/",
  cities: "/api/admin/cities/",
  universities: "/api/admin/universities/",
  studyLevels: "/api/admin/study-levels/",
  serviceCategories: "/api/admin/service-categories/",
  educationalInfo: "/api/admin/educational-info/",
  consultants: "/api/admin/users/?role=consultant",
  users: "/api/admin/users/",
};

export const adminSectionConfigs: Record<AdminSectionKey, AdminSectionConfig> = {
  overview: {
    section: "overview",
    title: "Dashboard",
    description: "Operational summary, moderation queues, catalog health, and transaction visibility.",
  },
  content: {
    section: "content",
    title: "Content Management",
    description: "Manage site settings, homepage assets, social proof, FAQs, terms, and incoming contact messages.",
    resources: [
      {
        key: "site-settings",
        label: "Configuration",
        singularLabel: "Site Setting",
        description: "Company branding, contact channels, social links, promo video, and general configuration.",
        path: "/api/admin/site-settings/",
        columns: [
          { key: "company_name", label: "Company" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "address", label: "Address" },
        ],
        fields: [
          { name: "company_name", label: "Company Name", type: "text", required: true },
          { name: "email", label: "Company Email", type: "email" },
          { name: "phone", label: "Company Phone", type: "text" },
          { name: "address", label: "Address", type: "textarea", rows: 3 },
          { name: "promo_video", label: "Promo Video URL", type: "text" },
          { name: "company_detail", label: "Company Detail", type: "textarea", rows: 5 },
          { name: "facebook", label: "Facebook", type: "text" },
          { name: "twitter", label: "Twitter", type: "text" },
          { name: "youtube", label: "YouTube", type: "text" },
          { name: "instagram", label: "Instagram", type: "text" },
          { name: "primary_logo", label: "Primary Logo", type: "file", accept: "image/*" },
          { name: "secondary_logo", label: "Secondary Logo", type: "file", accept: "image/*" },
        ],
        allowDelete: false,
      },
      {
        key: "company-details",
        label: "Company Details",
        singularLabel: "Company Detail",
        description: "Editable company story blocks used across the about/company sections.",
        path: "/api/admin/company-details/",
        columns: [
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Sub Title" },
          { key: "slug", label: "Slug" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subtitle", label: "Sub Title", type: "text" },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 8, required: true },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "sliders",
        label: "Hero Sliders",
        singularLabel: "Slider",
        description: "Homepage carousel copy and media.",
        path: "/api/admin/sliders/",
        columns: [
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Subtitle" },
          { key: "slug", label: "Slug" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subtitle", label: "Subtitle", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 5, required: true },
          { name: "image", label: "Image", type: "file", accept: "image/*", required: true },
        ],
      },
      {
        key: "about-sections",
        label: "About Us",
        singularLabel: "About Section",
        description: "About page blocks and supporting visuals.",
        path: "/api/admin/about-sections/",
        columns: [
          { key: "title", label: "Title" },
          { key: "subtitle", label: "Sub Title" },
          { key: "slug", label: "Slug" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "subtitle", label: "Sub Title", type: "text" },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 6, required: true },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "testimonials",
        label: "Testimonials",
        singularLabel: "Testimonial",
        description: "Public trust indicators and social proof.",
        path: "/api/admin/testimonials/",
        columns: [
          { key: "name", label: "Name" },
          { key: "designation", label: "Designation" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "designation", label: "Designation", type: "text" },
          { name: "description", label: "Description", type: "textarea", rows: 4, required: true },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "faqs",
        label: "FAQs",
        singularLabel: "FAQ",
        description: "Frequently asked questions across the public site.",
        path: "/api/admin/faqs/",
        columns: [
          { key: "question", label: "Question" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "question", label: "Question", type: "textarea", rows: 3, required: true },
          { name: "answer", label: "Answer", type: "textarea", rows: 5, required: true },
        ],
      },
      {
        key: "terms-documents",
        label: "Terms Documents",
        singularLabel: "Terms Document",
        description: "Terms, policies, and legal content.",
        path: "/api/admin/terms-documents/",
        columns: [
          { key: "title", label: "Title" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "content", label: "Content", type: "textarea", rows: 8, required: true },
        ],
      },
      {
        key: "contact-submissions",
        label: "Contact Inbox",
        singularLabel: "Contact Submission",
        description: "Latest messages from public forms.",
        path: "/api/admin/contact-submissions/",
        columns: [
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "service_interest", label: "Preferred Subject" },
          { key: "subject", label: "Preferred Country" },
          { key: "message", label: "Note/Message" },
          { key: "created_at", label: "Query Date" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
      {
        key: "study-abroad-leads",
        label: "Student Queries",
        singularLabel: "Student Query",
        description: "Student study-abroad lead entries submitted from the public-facing intake forms.",
        path: "/api/admin/study-abroad-leads/",
        columns: [
          { key: "name", label: "Name" },
          { key: "phone", label: "Phone" },
          { key: "email", label: "Email" },
          { key: "last_education_title", label: "Last Education" },
          { key: "last_education_result", label: "Result" },
          { key: "ielts_score", label: "Ielts" },
          { key: "interest_for", label: "Preferred Subject" },
          { key: "preferred_country_name", label: "Preferred Country" },
          { key: "budget", label: "Budget" },
          { key: "note", label: "Note/Message" },
          { key: "created_at", label: "Query Date" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
    ],
  },
  catalog: {
    section: "catalog",
    title: "Educational Data",
    description: "Master-data management for services, countries, institutions, courses, and educational information pages.",
    resources: [
      {
        key: "service-categories",
        label: "Service Categories",
        singularLabel: "Service Category",
        description: "Assessment, admission, visa, and service group definitions.",
        path: "/api/admin/service-categories/",
        columns: [
          { key: "name", label: "Name" },
          { key: "description", label: "Description" },
          { key: "image", label: "Image" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 4 },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "countries",
        label: "Countries",
        singularLabel: "Country",
        description: "Destination country master list.",
        path: "/api/admin/countries/",
        columns: [
          { key: "name", label: "Name" },
          { key: "image", label: "Image" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "image", label: "Flag / Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "cities",
        label: "Cities",
        singularLabel: "City",
        description: "City master list used for consultant discovery and student preferences.",
        path: "/api/admin/cities/",
        columns: [
          { key: "name", label: "Name" },
          { key: "country", label: "Country" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "country", label: "Country", type: "select", optionSource: "countries", required: true },
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
        ],
      },
      {
        key: "universities",
        label: "Universities",
        singularLabel: "University",
        description: "Institution master list.",
        path: "/api/admin/universities/",
        columns: [
          { key: "name", label: "Name" },
          { key: "image", label: "Image" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "courses",
        label: "Courses",
        singularLabel: "Course",
        description: "Course master list used by filters and content pages.",
        path: "/api/admin/courses/",
        columns: [
          { key: "name", label: "Name" },
          { key: "image", label: "Image" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "image", label: "Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "study-levels",
        label: "Study Levels",
        singularLabel: "Study Level",
        description: "Academic level taxonomy.",
        path: "/api/admin/study-levels/",
        columns: [
          { key: "name", label: "Name" },
          { key: "slug", label: "Slug" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "text", required: true },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
        ],
      },
      {
        key: "educational-info",
        label: "Educational Info",
        singularLabel: "Educational Info",
        description: "Main study-abroad information cards and page headers.",
        path: "/api/admin/educational-info/",
        columns: [
          { key: "title", label: "Title" },
          { key: "country", label: "Country Id" },
          { key: "institution_name", label: "Institution" },
          { key: "location", label: "Location" },
          { key: "course_name", label: "Course" },
          { key: "entry_score", label: "Entry Score" },
          { key: "study_level", label: "Level Id" },
          { key: "budget", label: "Budget" },
          { key: "scholarship_available", label: "Scholarship" },
          { key: "show_on_home", label: "Home Enabled" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "country", label: "Country", type: "select", optionSource: "countries", required: true },
          { name: "institution_name", label: "Institution", type: "text" },
          { name: "location", label: "Location", type: "text" },
          { name: "next_batch", label: "Next Batch", type: "text" },
          { name: "entry_score", label: "Entry Score", type: "text" },
          { name: "course_name", label: "Course Name", type: "text" },
          { name: "study_level", label: "Study Level", type: "select", optionSource: "studyLevels" },
          { name: "description", label: "Description", type: "textarea", rows: 5 },
          { name: "budget", label: "Budget", type: "number" },
          { name: "scholarship_available", label: "Scholarship Available", type: "checkbox" },
          { name: "scholarship_percentage", label: "Scholarship Percentage", type: "text" },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "show_on_home", label: "Show On Home", type: "checkbox" },
          { name: "card_banner", label: "Card Banner", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "educational-page-contents",
        label: "Page Content",
        singularLabel: "Page Content",
        description: "Full detail-page body content for educational information pages.",
        path: "/api/admin/educational-page-contents/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "headline", label: "Headline" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "headline", label: "Headline", type: "text" },
          { name: "head_description", label: "Head Description", type: "textarea", rows: 4 },
          { name: "living_cost", label: "Living Cost", type: "textarea", rows: 3 },
          { name: "academic_intake", label: "Academic Intake", type: "textarea", rows: 3 },
          { name: "deadline", label: "Deadline", type: "textarea", rows: 3 },
          { name: "popular_programs_text", label: "Popular Programs Text", type: "textarea", rows: 3 },
          { name: "popular_program_names", label: "Popular Program Names JSON", type: "json", helperText: "Use a JSON array, e.g. [\"MBA\", \"Computer Science\"]" },
          { name: "banner_image", label: "Banner Image", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "why-country-points",
        label: "Why This Country",
        singularLabel: "Country Point",
        description: "Bullet-point marketing and informational highlights per educational page.",
        path: "/api/admin/why-country-points/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "point", label: "Point" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "point", label: "Point", type: "text", required: true },
          { name: "point_detail", label: "Detail", type: "textarea", rows: 4 },
          { name: "source_link", label: "Source Link", type: "text" },
        ],
      },
      {
        key: "program-durations",
        label: "Program Durations",
        singularLabel: "Program Duration",
        description: "Program name and duration blocks per educational info page.",
        path: "/api/admin/program-durations/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "program_name", label: "Program" },
          { key: "duration", label: "Duration" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "program_name", label: "Program Name", type: "text", required: true },
          { name: "duration", label: "Duration", type: "text", required: true },
        ],
      },
      {
        key: "top-universities",
        label: "Top Universities",
        singularLabel: "Top University",
        description: "Featured universities shown on country detail pages.",
        path: "/api/admin/top-universities/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "institution", label: "Institution" },
          { key: "ranking", label: "Ranking" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "institution", label: "Institution", type: "text", required: true },
          { name: "short_description", label: "Short Description", type: "text" },
          { name: "ranking", label: "Ranking", type: "text" },
          { name: "number_of_students", label: "Number of Students", type: "text" },
          { name: "logo", label: "Logo", type: "file", accept: "image/*" },
        ],
      },
      {
        key: "visa-checklist-items",
        label: "Visa Checklists",
        singularLabel: "Checklist Item",
        description: "Visa checklist items linked to educational pages.",
        path: "/api/admin/visa-checklist-items/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "text", label: "Text" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "text", label: "Text", type: "textarea", rows: 4, required: true },
        ],
      },
      {
        key: "country-faqs",
        label: "Country FAQs",
        singularLabel: "Country FAQ",
        description: "FAQ entries scoped to educational detail pages.",
        path: "/api/admin/country-faqs/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "question", label: "Question" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "question", label: "Question", type: "textarea", rows: 3, required: true },
          { name: "answer", label: "Answer", type: "textarea", rows: 5, required: true },
        ],
      },
      {
        key: "scholarship-items",
        label: "Scholarships",
        singularLabel: "Scholarship Item",
        description: "Scholarship bullets per educational info page.",
        path: "/api/admin/scholarship-items/",
        columns: [
          { key: "educational_info", label: "Educational Info Id" },
          { key: "text", label: "Text" },
        ],
        fields: [
          { name: "educational_info", label: "Educational Info", type: "select", optionSource: "educationalInfo", required: true },
          { name: "text", label: "Text", type: "textarea", rows: 4, required: true },
        ],
      },
    ],
  },
  packages: {
    section: "packages",
    title: "Pro-Consultants",
    description: "Manage paid consultant plans and review active subscription records.",
    resources: [
      {
        key: "pro-packages",
        label: "Pro Packages",
        singularLabel: "Pro Package",
        description: "Package catalog sold to consultants.",
        path: "/api/admin/pro-packages/",
        columns: [
          { key: "name", label: "Name" },
          { key: "level", label: "Level" },
          { key: "package_type", label: "Package Type" },
          { key: "duration_days", label: "Duration" },
          { key: "description", label: "Short Text" },
          { key: "price", label: "Price" },
          { key: "features", label: "Features" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Package Name", type: "text", required: true },
          { name: "level", label: "Level", type: "text", helperText: "Shown under the package name. Use values like Basic, Popular, Professional, or Premium." },
          { name: "package_type", label: "Package Type", type: "select", required: true, options: [
            { label: "Monthly", value: "monthly" },
            { label: "Annual", value: "annual" },
          ] },
          { name: "duration_days", label: "Duration Days", type: "number", required: true, helperText: "Display period for the selected package type, such as 30 for monthly or 365 for annual." },
          { name: "price", label: "Price", type: "number", required: true },
          { name: "description", label: "Description", type: "textarea", rows: 4 },
          { name: "features", label: "Features JSON", type: "json", helperText: "Use a JSON array of strings. These become the feature bullets on the Pricing page." },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
        ],
      },
      {
        key: "pro-subscriptions",
        label: "Subscriptions",
        singularLabel: "Subscription",
        description: "Existing consultant subscriptions and activation window.",
        path: "/api/admin/pro-subscriptions/",
        columns: [
          { key: "user", label: "User Id" },
          { key: "package", label: "Package Id" },
          { key: "starts_at", label: "Starts" },
          { key: "ends_at", label: "Ends" },
          { key: "active", label: "Active" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
    ],
  },
  verification: {
    section: "verification",
    title: "Verification & User Oversight",
    description: "Manage user roles, consultant verification requests, and platform-facing consultant service visibility.",
    resources: [
      {
        key: "users",
        label: "Manage Users",
        singularLabel: "User",
        description: "Cross-role user management and account state.",
        path: "/api/admin/users/",
        columns: [
          { key: "image_url", label: "Image" },
          { key: "full_name", label: "Full Name" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "role", label: "Role" },
          { key: "last_login_display", label: "Last Login" },
        ],
        fields: [
          { name: "image", label: "Image", type: "file", accept: "image/*" },
          { name: "name", label: "Name", type: "text", required: true },
          { name: "role", label: "Role", type: "select", options: roleOptions, required: true },
          { name: "email", label: "Email", type: "email", required: true },
          { name: "phone", label: "Phone", type: "text" },
          { name: "password", label: "Password", type: "password" },
          { name: "repassword", label: "Re-password", type: "password" },
          { name: "occupation", label: "Occupation", type: "text" },
          { name: "skill_languages", label: "Skill Languages", type: "text" },
          {
            name: "account_type",
            label: "Account Type",
            type: "select",
            options: [
              { label: "Personal", value: "personal" },
              { label: "Agency", value: "agency" },
            ],
          },
          { name: "verification_status", label: "Verification Status", type: "select", options: verificationOptions },
          { name: "subscription_status", label: "Subscription Status", type: "select", options: subscriptionOptions },
          { name: "is_banned", label: "Banned", type: "checkbox" },
          { name: "banned_until", label: "Banned Until", type: "datetime" },
          { name: "ban_reason", label: "Ban Reason", type: "textarea", rows: 3 },
          { name: "is_active", label: "Active", type: "checkbox" },
          { name: "is_staff", label: "Staff", type: "checkbox" },
        ],
      },
      {
        key: "verification-requests",
        label: "Verification Queue",
        singularLabel: "Verification Request",
        description: "Approve, reject, or annotate consultant verification requests.",
        path: "/api/admin/verification-requests/",
        columns: [
          { key: "user.first_name", label: "User Name" },
          { key: "user.role", label: "User Type" },
          { key: "user.email", label: "Email" },
          { key: "user.phone", label: "Phone" },
          { key: "user.date_joined", label: "Join Date" },
          { key: "created_at", label: "Request Date" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "user_id", label: "Consultant", type: "select", optionSource: "consultants", optionLabelKey: "email", required: true },
          { name: "status", label: "Status", type: "select", options: verificationOptions, required: true },
          { name: "notes", label: "Notes", type: "textarea", rows: 4 },
        ],
      },
      {
        key: "consultant-services",
        label: "Consultant Services",
        singularLabel: "Consultant Service",
        description: "Read-only oversight for live consultant offers.",
        path: "/api/admin/consultant-services/",
        columns: [
          { key: "consultant_name", label: "Consultant" },
          { key: "title", label: "Title" },
          { key: "country_name", label: "Country" },
          { key: "status", label: "Status" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
      {
        key: "assessment-reports",
        label: "Assessment Reports",
        singularLabel: "Assessment Report",
        description: "Review submitted consultant reports before they become student-visible.",
        path: "/api/admin/assessment-reports/",
        columns: [
          { key: "assessment_id", label: "Assessment" },
          { key: "student_id", label: "Student" },
          { key: "consultant_id", label: "Consultant" },
          { key: "submission_status", label: "Submission" },
          { key: "admin_approval_status", label: "Approval" },
          { key: "approved_at", label: "Approved At" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
      {
        key: "review-requests",
        label: "Review Requests",
        singularLabel: "Review Request",
        description: "Track revision requests raised by students after reports are submitted.",
        path: "/api/admin/review-requests/",
        columns: [
          { key: "assessment_id", label: "Assessment" },
          { key: "student_id", label: "Student" },
          { key: "consultant_id", label: "Consultant" },
          { key: "status", label: "Status" },
          { key: "created_at", label: "Created" },
        ],
        fields: [
          { name: "status", label: "Status", type: "select", options: [
            { label: "Open", value: "open" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Resolved", value: "resolved" },
          ] },
          { name: "admin_notes", label: "Admin Notes", type: "textarea", rows: 4 },
        ],
        allowCreate: false,
      },
      {
        key: "moderation-incidents",
        label: "Moderation Incidents",
        singularLabel: "Moderation Incident",
        description: "Auto-flagged content incidents and manual moderation notes.",
        path: "/api/admin/moderation-incidents/",
        columns: [
          { key: "reported_user_email", label: "Reported User" },
          { key: "source_type", label: "Source" },
          { key: "status", label: "Status" },
          { key: "auto_flagged", label: "Auto Flagged" },
          { key: "created_at", label: "Created" },
        ],
        fields: [
          { name: "status", label: "Status", type: "select", options: [
            { label: "Open", value: "open" },
            { label: "Investigating", value: "investigating" },
            { label: "Resolved", value: "resolved" },
            { label: "Dismissed", value: "dismissed" },
          ] },
          { name: "notes", label: "Notes", type: "textarea", rows: 5 },
        ],
        allowCreate: false,
      },
      {
        key: "admin-invitations",
        label: "Admin Invitations",
        singularLabel: "Admin Invitation",
        description: "Invite-only onboarding records for new admin accounts.",
        path: "/api/admin/invitations/",
        columns: [
          { key: "email", label: "Email" },
          { key: "invited_by_email", label: "Invited By" },
          { key: "expires_at", label: "Expires" },
          { key: "accepted_at", label: "Accepted At" },
        ],
        fields: [
          { name: "email", label: "Email", type: "email", required: true },
          { name: "invited_by", label: "Invited By", type: "select", optionSource: "users" },
          { name: "notes", label: "Notes", type: "textarea", rows: 3 },
        ],
      },
    ],
  },
  training: {
    section: "training",
    title: "Trainings",
    description: "Manage consultant-facing subjects and training/course products.",
    resources: [
      {
        key: "subjects",
        label: "Subjects",
        singularLabel: "Subject",
        description: "Subject list used by consultant services.",
        path: "/api/admin/subjects/",
        columns: [
          { key: "name", label: "Name" },
          { key: "updated_at", label: "Updated" },
        ],
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
        ],
      },
      {
        key: "trainings",
        label: "Trainings",
        singularLabel: "Training",
        description: "Training and course inventory for consultants or students.",
        path: "/api/admin/trainings/",
        columns: [
          { key: "title", label: "Title" },
          { key: "training_type", label: "Type" },
          { key: "description", label: "Description" },
          { key: "overview", label: "Overview" },
          { key: "organization", label: "Organization" },
          { key: "address", label: "Address" },
          { key: "language", label: "Languages" },
          { key: "application_deadline", label: "Apply Deadline" },
          { key: "start_date", label: "Start Date" },
          { key: "duration", label: "Duration" },
          { key: "price", label: "Price" },
          { key: "document", label: "Documents" },
          { key: "thumbnail", label: "Thumbnail" },
        ],
        fields: [
          { name: "title", label: "Title", type: "text", required: true },
          { name: "training_type", label: "Training Type", type: "text" },
          { name: "description", label: "Description", type: "textarea", rows: 4 },
          { name: "overview", label: "Overview", type: "textarea", rows: 4 },
          { name: "organization", label: "Organization", type: "text" },
          { name: "address", label: "Address", type: "text" },
          { name: "language", label: "Language", type: "text" },
          { name: "application_deadline", label: "Application Deadline", type: "datetime" },
          { name: "start_date", label: "Start Date", type: "datetime" },
          { name: "duration", label: "Duration", type: "text" },
          { name: "price", label: "Price", type: "number" },
          { name: "status", label: "Status", type: "select", options: activeStatusOptions },
          { name: "thumbnail", label: "Thumbnail", type: "file", accept: "image/*" },
          { name: "document", label: "Document", type: "file" },
        ],
      },
    ],
  },
  transactions: {
    section: "transactions",
    title: "Transaction Management",
    description: "Moderate payment-related records, withdrawal requests, and commission rules.",
    resources: [
      {
        key: "service-charge-rules",
        label: "Service Charge",
        singularLabel: "Service Charge Rule",
        description: "Admin commission and role-tier charging rules.",
        path: "/api/admin/service-charge-rules/",
        columns: [
          { key: "service_name", label: "Service" },
          { key: "role_tier", label: "User Type" },
          { key: "commission", label: "Commission" },
        ],
        fields: [
          { name: "service_category", label: "Service Category", type: "select", optionSource: "serviceCategories", required: true },
          { name: "role_tier", label: "Role Tier", type: "text", required: true },
          { name: "commission", label: "Commission", type: "number", required: true },
        ],
      },
      {
        key: "wallet-transactions",
        label: "Wallet Transactions",
        singularLabel: "Wallet Transaction",
        description: "Read-only ledger of user wallet movement.",
        path: "/api/admin/wallet-transactions/",
        columns: [
          { key: "user_name", label: "User" },
          { key: "amount", label: "Amount" },
          { key: "transaction_type", label: "Type" },
          { key: "payment_method", label: "Method" },
          { key: "created_at", label: "Created" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
      {
        key: "withdrawals",
        label: "Withdrawals",
        singularLabel: "Withdrawal",
        description: "Update payout request status and admin notes.",
        path: "/api/admin/withdrawals/",
        columns: [
          { key: "consultant_name", label: "Consultant" },
          { key: "amount", label: "Amount" },
          { key: "status", label: "Status" },
          { key: "transaction_reference", label: "Reference" },
        ],
        fields: [
          { name: "status", label: "Status", type: "select", options: withdrawalStatusOptions, required: true },
          { name: "notes", label: "Notes", type: "textarea", rows: 4 },
          { name: "transaction_reference", label: "Transaction Reference", type: "text" },
        ],
        allowCreate: false,
      },
      {
        key: "refund-requests",
        label: "Refund Requests",
        singularLabel: "Refund Request",
        description: "Review and process refund demands tied to paid assessments.",
        path: "/api/admin/refund-requests/",
        columns: [
          { key: "assessment_id", label: "Assessment" },
          { key: "order_id", label: "Order" },
          { key: "requested_by_id", label: "Requested By" },
          { key: "status", label: "Status" },
          { key: "processed_at", label: "Processed At" },
        ],
        fields: [
          { name: "status", label: "Status", type: "select", options: [
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
            { label: "Processed", value: "processed" },
          ], required: true },
          { name: "admin_notes", label: "Admin Notes", type: "textarea", rows: 4 },
        ],
        allowCreate: false,
      },
      {
        key: "settlements",
        label: "Assessment Settlements",
        singularLabel: "Assessment Settlement",
        description: "Held and released consultant settlement records for paid assessments.",
        path: "/api/admin/settlements/",
        columns: [
          { key: "assessment_id", label: "Assessment" },
          { key: "consultant_id", label: "Consultant" },
          { key: "gross_amount", label: "Gross" },
          { key: "net_amount", label: "Net" },
          { key: "status", label: "Status" },
          { key: "hold_until", label: "Hold Until" },
        ],
        fields: [],
        readOnly: true,
        allowCreate: false,
      },
      {
        key: "orders",
        label: "Orders",
        singularLabel: "Order",
        description: "Update order delivery and payment status.",
        path: "/api/admin/orders/",
        columns: [
          { key: "order_number", label: "Order ID" },
          { key: "customer_name", label: "Name" },
          { key: "total", label: "Amount" },
          { key: "payment_status", label: "Status" },
        ],
        fields: [
          { name: "delivery_status", label: "Delivery Status", type: "select", options: orderStatusOptions },
          { name: "payment_status", label: "Payment Status", type: "select", options: paymentStatusOptions },
          { name: "payment_method", label: "Payment Method", type: "text" },
          { name: "subtotal", label: "Subtotal", type: "number" },
          { name: "total", label: "Total", type: "number" },
          { name: "bank_transaction_id", label: "Bank Transaction Id", type: "text" },
          { name: "invoice_number", label: "Invoice Number", type: "text" },
        ],
        allowCreate: false,
      },
      {
        key: "course-orders",
        label: "Course Orders",
        singularLabel: "Course Order",
        description: "Training purchase transactions and status changes.",
        path: "/api/admin/course-orders/",
        columns: [
          { key: "order_number", label: "Order ID" },
          { key: "customer_name", label: "Name" },
          { key: "training_title", label: "Training" },
          { key: "price", label: "Amount" },
          { key: "payment_status", label: "Payment" },
          { key: "payment_method", label: "Method" },
        ],
        fields: [
          { name: "payment_status", label: "Payment Status", type: "select", options: paymentStatusOptions },
          { name: "payment_method", label: "Payment Method", type: "text" },
          { name: "price", label: "Price", type: "number" },
          { name: "bank_transaction_id", label: "Bank Transaction Id", type: "text" },
          { name: "invoice_number", label: "Invoice Number", type: "text" },
        ],
        allowCreate: false,
      },
      {
        key: "class-schedules",
        label: "Class Schedule",
        singularLabel: "Class Schedule",
        description: "Manage live class schedule links, times, and publication status.",
        path: "/api/admin/class-schedules/",
        columns: [
          { key: "date_time", label: "Date & Time" },
          { key: "name", label: "Class Name" },
          { key: "link", label: "Class Link" },
          { key: "status", label: "Status" },
        ],
        fields: [
          { name: "name", label: "Class Name", type: "text", required: true },
          { name: "link", label: "Class Link", type: "text", required: true },
          { name: "date_time", label: "Select Schedule", type: "datetime", required: true },
          { name: "status", label: "Status", type: "select", options: classScheduleStatusOptions, required: true },
        ],
      },
    ],
  },
};

export const adminSidebarItems: AdminSidebarItem[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    href: "/admin",
    icon: "fa-house",
    section: "overview",
  },
  {
    key: "educational-info",
    label: "Educational Info",
    href: "/admin/eduinfo",
    icon: "fa-graduation-cap",
    section: "catalog",
    resourceKey: "educational-info",
  },
  {
    key: "services",
    label: "Services",
    href: "/admin/services",
    icon: "fa-list-ul",
    section: "catalog",
    resourceKey: "service-categories",
  },
  {
    key: "countries",
    label: "Country",
    href: "/admin/country",
    icon: "fa-earth-americas",
    section: "catalog",
    resourceKey: "countries",
  },
  {
    key: "cities",
    label: "Cities",
    href: "/admin/catalog?resource=cities",
    icon: "fa-city",
    section: "catalog",
    resourceKey: "cities",
  },
  {
    key: "courses",
    label: "Courses",
    href: "/admin/course",
    icon: "fa-book",
    section: "catalog",
    resourceKey: "courses",
  },
  {
    key: "study-levels",
    label: "Study Level",
    href: "/admin/studylevel",
    icon: "fa-user-graduate",
    section: "catalog",
    resourceKey: "study-levels",
  },
  {
    key: "universities",
    label: "University",
    href: "/admin/university",
    icon: "fa-building-columns",
    section: "catalog",
    resourceKey: "universities",
  },
  {
    key: "pro-consultants",
    label: "Pro-Consultants",
    icon: "fa-crown",
    section: "packages",
    children: [
      {
        key: "pro-packages",
        label: "Packages",
        href: "/admin/pro-user-package",
        icon: "fa-box-open",
        section: "packages",
        resourceKey: "pro-packages",
      },
    ],
  },
  {
    key: "verified-consultants",
    label: "Verified-Consultants",
    icon: "fa-user-check",
    section: "verification",
    children: [
      {
        key: "verification-requests",
        label: "Request",
        href: "/admin/verified-user-request",
        icon: "fa-bell",
        section: "verification",
        resourceKey: "verification-requests",
      },
    ],
  },
  {
    key: "students",
    label: "Student",
    icon: "fa-user-graduate",
    section: "content",
    children: [
      {
        key: "student-queries",
        label: "Queries",
        href: "/admin/student-queries",
        icon: "fa-clipboard-question",
        section: "content",
        resourceKey: "study-abroad-leads",
      },
    ],
  },
  {
    key: "trainings",
    label: "Trainings",
    href: "/admin/traininginfo",
    icon: "fa-screwdriver-wrench",
    section: "training",
    resourceKey: "trainings",
  },
  {
    key: "transactions",
    label: "Transaction",
    icon: "fa-money-bill-transfer",
    section: "transactions",
    children: [
      {
        key: "service-charge-rules",
        label: "Service Charge",
        href: "/admin/user-service-charge",
        icon: "fa-circle-dollar-to-slot",
        section: "transactions",
        resourceKey: "service-charge-rules",
      },
      {
        key: "refund-requests",
        label: "Refund Requests",
        href: "/admin/refund-requests",
        icon: "fa-rotate-left",
        section: "transactions",
        resourceKey: "refund-requests",
      },
      {
        key: "settlements",
        label: "Settlements",
        href: "/admin/transactions?resource=settlements",
        icon: "fa-wallet",
        section: "transactions",
        resourceKey: "settlements",
      },
    ],
  },
  {
    key: "manage-users",
    label: "Manage Users",
    icon: "fa-user-shield",
    section: "verification",
    children: [
      {
        key: "users",
        label: "All Users",
        href: "/admin/user",
        icon: "fa-list",
        section: "verification",
        resourceKey: "users",
      },
      {
        key: "users-create",
        label: "Create User",
        href: "/admin/user/create",
        icon: "fa-plus",
        section: "verification",
        resourceKey: "users",
      },
      {
        key: "assessment-reports",
        label: "Assessment Reports",
        href: "/admin/assessment-reports",
        icon: "fa-file-signature",
        section: "verification",
        resourceKey: "assessment-reports",
      },
      {
        key: "moderation-incidents",
        label: "Moderation",
        href: "/admin/moderation",
        icon: "fa-shield",
        section: "verification",
        resourceKey: "moderation-incidents",
      },
      {
        key: "admin-invitations",
        label: "Admin Invites",
        href: "/admin/verification?resource=admin-invitations",
        icon: "fa-user-plus",
        section: "verification",
        resourceKey: "admin-invitations",
      },
    ],
  },
  {
    key: "sliders",
    label: "Slider",
    href: "/admin/slider",
    icon: "fa-sliders",
    section: "content",
    resourceKey: "sliders",
  },
  {
    key: "about-company",
    label: "About Company",
    icon: "fa-briefcase",
    section: "content",
    children: [
      {
        key: "company-details",
        label: "Company Informations",
        href: "/admin/company-details",
        icon: "fa-address-card",
        section: "content",
        resourceKey: "company-details",
      },
      {
        key: "about-sections",
        label: "About Us",
        href: "/admin/about",
        icon: "fa-circle-info",
        section: "content",
        resourceKey: "about-sections",
      },
    ],
  },
  {
    key: "messages",
    label: "Message",
    href: "/admin/contact",
    icon: "fa-envelope-open-text",
    section: "content",
    resourceKey: "contact-submissions",
  },
  {
    key: "testimonials",
    label: "Testimonials",
    href: "/admin/testimonials",
    icon: "fa-message",
    section: "content",
    resourceKey: "testimonials",
  },
  {
    key: "faqs",
    label: "F.A.Q",
    href: "/admin/faq",
    icon: "fa-circle-question",
    section: "content",
    resourceKey: "faqs",
  },
  {
    key: "class-schedules",
    label: "Class Schedule",
    href: "/admin/schedule",
    icon: "fa-clock",
    section: "transactions",
    resourceKey: "class-schedules",
  },
  {
    key: "orders-shortcut",
    label: "Orders",
    href: "/admin/order",
    icon: "fa-cart-shopping",
    section: "transactions",
    resourceKey: "orders",
  },
  {
    key: "configuration",
    label: "Configuration",
    href: "/admin/configer",
    icon: "fa-screwdriver-wrench",
    section: "content",
    resourceKey: "site-settings",
  },
  {
    key: "terms-documents",
    label: "Terms & Condition",
    href: "/admin/terms-and-condition",
    icon: "fa-circle-info",
    section: "content",
    resourceKey: "terms-documents",
  },
];

export function getAdminResourceConfig(section: AdminSectionKey, resourceKey?: string): AdminResourceConfig | undefined {
  const resources = adminSectionConfigs[section].resources ?? [];
  if (!resourceKey) {
    return resources[0];
  }
  return resources.find((resource) => resource.key === resourceKey) ?? resources[0];
}
