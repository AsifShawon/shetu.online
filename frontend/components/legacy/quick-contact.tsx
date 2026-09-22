"use client";

import { useState } from "react";

export function QuickContact() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="legacy-primary-btn fixed bottom-24 left-4 z-40 shadow-lg md:left-6"
      >
        Quick Contact
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 bg-slate-950/45 p-4">
          <div className="legacy-panel mx-auto mt-8 w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-extrabold text-[var(--legacy-primary)]">Quick Contact Us</h3>
              <button type="button" onClick={() => setOpen(false)} className="text-slate-500">
                <i className="fa-solid fa-xmark text-xl" />
              </button>
            </div>
            <form className="mt-5 space-y-4">
              <input className="legacy-form-field" placeholder="Enter your name" />
              <input className="legacy-form-field" placeholder="Enter your phone" />
              <input className="legacy-form-field" placeholder="Enter your email" />
              <input className="legacy-form-field" placeholder="Enter your subject" />
              <textarea className="legacy-form-field min-h-32" placeholder="Enter your message" />
              <button type="button" className="legacy-primary-btn w-full">
                Submit
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

