"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getCountries, getStudyLevels, type Country, type StudyLevel } from "@/lib/api/catalog";
import { submitStudyAbroadLead } from "@/lib/api/students";
import { getStudyLevelSuggestionList } from "@/lib/shared-suggestion-catalog";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  last_education_title: "",
  last_education_result: "",
  ielts_score: "",
  interest_for: "",
  preferred_country: "",
  budget: "",
  note: ""
};

export default function StudyAbroadQueryPage() {
  const router = useRouter();
  const [countries, setCountries] = useState<Country[]>([]);
  const [studyLevels, setStudyLevels] = useState<StudyLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const studyLevelSuggestions = useMemo(
    () => getStudyLevelSuggestionList(studyLevels.map((item) => item.name)),
    [studyLevels],
  );

  useEffect(() => {
    getCountries()
      .then((list) => setCountries(list.filter((country) => country.status === "active")))
      .catch(() => null);
    getStudyLevels()
      .then((list) => setStudyLevels(list.filter((item) => item.status === "active")))
      .catch(() => null);
  }, []);

  const handleChange = (field: keyof typeof emptyForm) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      await submitStudyAbroadLead({
        name: form.name,
        phone: form.phone,
        email: form.email,
        last_education_title: form.last_education_title,
        last_education_result: form.last_education_result,
        ielts_score: form.ielts_score || undefined,
        interest_for: form.interest_for,
        preferred_country: form.preferred_country ? Number(form.preferred_country) : undefined,
        budget: form.budget || undefined,
        note: form.note || undefined
      });
      setSuccess(true);
      setForm(emptyForm);
    } catch {
      setError("Failed to submit enquiry. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="legacy-study-page">
      <div className="legacy-study-shell">
        <header className="legacy-study-intro">
          <h1>Get Help to Study Abroad</h1>
          <p>
            Share your details with us to receive personalized guidance for studying abroad. Please provide your name,
            email, phone number, last academic degree, result, preferred country, and university choice.
          </p>
          <p>
            Our team will review your information and suggest the best opportunities for your future education.
          </p>
        </header>

        <form className="legacy-study-form" onSubmit={handleSubmit}>
          <h2>Student Enquiry</h2>

          {success ? (
            <div className="legacy-study-alert is-success">
              Your enquiry has been submitted successfully. We will contact you soon.
            </div>
          ) : null}

          {error ? (
            <div className="legacy-study-alert is-error">
              {error}
            </div>
          ) : null}

          <div className="legacy-study-grid">
            <label className="legacy-study-field">
              <span>Full Name</span>
              <input required type="text" placeholder="Write name" value={form.name} onChange={handleChange("name")} />
            </label>

            <label className="legacy-study-field">
              <span>Email Address</span>
              <input required type="email" placeholder="Write email" value={form.email} onChange={handleChange("email")} />
            </label>

            <label className="legacy-study-field">
              <span>Mobile Number</span>
              <input required type="tel" inputMode="tel" placeholder="Write number" value={form.phone} onChange={handleChange("phone")} />
            </label>

            <label className="legacy-study-field">
              <span>Last Academic Degree</span>
              <input required type="text" placeholder="Write degree" value={form.last_education_title} onChange={handleChange("last_education_title")} />
            </label>

            <label className="legacy-study-field">
              <span>Last Academic Result</span>
              <input required type="text" placeholder="Write result" value={form.last_education_result} onChange={handleChange("last_education_result")} />
            </label>

            <label className="legacy-study-field">
              <span>IELTS Score</span>
              <input type="text" placeholder="Write score" value={form.ielts_score} onChange={handleChange("ielts_score")} />
            </label>

            <label className="legacy-study-field legacy-study-field--select">
              <span>Preferred Country</span>
              <select required value={form.preferred_country} onChange={handleChange("preferred_country")}>
                <option value="">Country choice</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="legacy-study-field legacy-study-field--select">
              <span>Interested Program</span>
              <input
                required
                list="study-abroad-interest-options"
                placeholder="Program choice"
                value={form.interest_for}
                onChange={handleChange("interest_for")}
              />
              <datalist id="study-abroad-interest-options">
                {studyLevelSuggestions.map((level) => (
                  <option key={level} value={level} />
                ))}
              </datalist>
            </label>

            <label className="legacy-study-field">
              <span>Your Budget</span>
              <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="Write budget" value={form.budget} onChange={handleChange("budget")} />
            </label>

            <label className="legacy-study-field legacy-study-field--note">
              <span>Note :</span>
              <textarea placeholder="Write note here....." value={form.note} onChange={handleChange("note")} />
            </label>
          </div>

          <div className="legacy-study-actions">
            <button type="button" className="legacy-study-btn legacy-study-btn--back" onClick={() => router.back()}>
              Back
            </button>
            <button type="submit" className="legacy-study-btn legacy-study-btn--submit" disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
