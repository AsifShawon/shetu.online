"use client";

import { useState } from "react";

import { countries, services, studyLevels } from "@/lib/legacy-data";

export function FilterPanel() {
  const [tab, setTab] = useState<"courses" | "countries" | "scholarships" | "universities" | "budget">("courses");

  return (
    <div className="legacy-filter-card">
      <div className="legacy-filter-inner">
        <div className="legacy-search-box">
          <div className="border">
            <div className="legacy-search-field">
              <input type="search" placeholder="Search with your preferred Subject" />
              <button type="button">
                <i className="fa-solid fa-magnifying-glass" />
              </button>
            </div>
          </div>
        </div>

        <p className="legacy-filter-headline">দেশ, কোর্স, বাজেট, স্কলারশিপ অথবা বিশ্ববিদ্যালয়ের নাম দিয়ে সার্চ করুন</p>

        <div className="legacy-filter-icons">
          {[
            ["courses", "fa-book", "কোর্স"],
            ["countries", "fa-globe", "দেশ"],
            ["scholarships", "fa-hourglass-half", "স্কলারশিপ"],
            ["universities", "fa-building-columns", "বিশ্ববিদ্যালয়"],
            ["budget", "fa-sack-dollar", "বাজেট"]
          ].map(([key, icon, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key as typeof tab)}
              className="legacy-filter-icon"
            >
              <i className={`fa-solid ${icon}`} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        <form action={tabRouteMap[tab]} className="legacy-filter-fields">
          <div className="legacy-filter-field">
            <label>কোন কোর্স পড়তে চান?</label>
            <select name="course[]">
              <option>Search</option>
              {services.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="legacy-filter-field">
            <label>স্টাডি লেভেল</label>
            <select name="studyLevel[]">
              <option>Search</option>
              {studyLevels.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div className="legacy-filter-field">
            <label>কোন দেশে যেতে চান?</label>
            <select name="country[]">
              <option>Search</option>
              {countries.map((item) => (
                <option key={item.name} value={item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          {tab === "budget" ? (
            <div className="legacy-filter-field">
              <label>বাজেট</label>
              <input type="number" name="budget" placeholder="Enter your budget (BDT)" />
            </div>
          ) : null}
          <button type="submit" className="legacy-filter-submit">
            খুঁজুন <i className="fa-solid fa-magnifying-glass" />
          </button>
        </form>
      </div>
    </div>
  );
}

const tabRouteMap = {
  courses: "/your-selected-result-courses",
  countries: "/your-selected-result",
  scholarships: "/your-selected-result-scholarship",
  universities: "/your-selected-result-university",
  budget: "/your-selected-result-Budget"
} as const;
