export default function CoursePaymentCancelPage() {
  return (
    <section className="py-16 md:py-20">
      <div className="legacy-container">
        <div className="legacy-panel mx-auto max-w-3xl p-10 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700">
            <i className="fa-solid fa-xmark text-3xl" />
          </div>
          <h1 className="mt-6 text-4xl font-extrabold text-[var(--legacy-primary)]">Payment Cancelled</h1>
          <p className="mt-4 text-base leading-8 text-[var(--legacy-muted)]">
            This route keeps the cancellation state screen that existed in the old course payment flow.
          </p>
        </div>
      </div>
    </section>
  );
}

