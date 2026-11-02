"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import ComponentCard from "@/components/common/ComponentCard";
import {
  fetchPartnerWebsite,
  upsertPartnerWebsite,
  type PartnerWebsiteReview,
} from "@/services/arnProfileService";

const ABOUT_MAX = 800;

type ReviewDraft = {
  key: string;
  id?: number;
  customerName: string;
  stars: number;
  customerProfession: string;
  customerTestimonial: string;
};

function createReviewDraft(seed?: Partial<PartnerWebsiteReview>): ReviewDraft {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    id: seed?.id,
    customerName: seed?.customerName || "",
    stars: seed?.stars && seed.stars >= 1 && seed.stars <= 5 ? seed.stars : 5,
    customerProfession: seed?.customerProfession || "",
    customerTestimonial: seed?.customerTestimonial || "",
  };
}

type WebsiteProfileFormProps = {
  hasPhoto: boolean;
};

export default function WebsiteProfileForm({ hasPhoto }: WebsiteProfileFormProps) {
  const [about, setAbout] = useState("");
  const [certifications, setCertifications] = useState<string[]>([""]);
  const [reviews, setReviews] = useState<ReviewDraft[]>([]);
  const [websiteUrl, setWebsiteUrl] = useState<string | null>(null);
  const [websiteSlug, setWebsiteSlug] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const applyProfile = useCallback(
    (data: {
      about: string | null;
      certifications: string[];
      reviews: PartnerWebsiteReview[];
      websiteUrl: string | null;
      websiteSlug: string | null;
    }) => {
      setAbout(data.about || "");
      setCertifications(
        data.certifications.length > 0 ? data.certifications : [""],
      );
      setReviews(data.reviews.map((review) => createReviewDraft(review)));
      setWebsiteUrl(data.websiteUrl);
      setWebsiteSlug(data.websiteSlug);
      setIsEditing(!data.websiteSlug);
    },
    [],
  );

  const refreshProfile = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await fetchPartnerWebsite();
      applyProfile(data);
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Failed to load website profile",
      );
    } finally {
      setIsLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const trimmedCertifications = useMemo(
    () => certifications.map((item) => item.trim()).filter(Boolean),
    [certifications],
  );

  const aboutValid =
    about.trim().length > 0 && about.trim().length <= ABOUT_MAX;
  const certificationsValid = trimmedCertifications.length > 0;

  const reviewsValid = reviews.every((review) => {
    const hasAnyContent =
      review.customerName.trim() ||
      review.customerProfession.trim() ||
      review.customerTestimonial.trim();
    if (!hasAnyContent) return true;
    return (
      review.customerName.trim().length > 0 &&
      Number.isInteger(review.stars) &&
      review.stars >= 1 &&
      review.stars <= 5
    );
  });

  const hasWebsite = Boolean(websiteSlug);
  const showForm = !hasWebsite || isEditing;
  const canSubmit =
    hasPhoto && aboutValid && certificationsValid && reviewsValid && !isSaving;

  const handleSubmit = async () => {
    if (!hasPhoto) {
      toast.error("Upload your profile photo before creating a website.");
      return;
    }
    if (!aboutValid) {
      toast.error("About is required and must be 800 characters or fewer.");
      return;
    }
    if (!certificationsValid) {
      toast.error("Add at least one certification / qualification / achievement.");
      return;
    }

    const reviewsPayload: PartnerWebsiteReview[] = [];
    for (let index = 0; index < reviews.length; index += 1) {
      const review = reviews[index];
      const customerName = review.customerName.trim();
      const customerProfession = review.customerProfession.trim();
      const customerTestimonial = review.customerTestimonial.trim();
      const hasAnyContent =
        customerName || customerProfession || customerTestimonial;
      if (!hasAnyContent) continue;
      if (!customerName) {
        toast.error("Customer name is required for each review.");
        return;
      }
      if (!Number.isInteger(review.stars) || review.stars < 1 || review.stars > 5) {
        toast.error("Star rating must be between 1 and 5.");
        return;
      }
      reviewsPayload.push({
        id: review.id,
        customerName,
        stars: review.stars,
        customerProfession: customerProfession || null,
        customerTestimonial: customerTestimonial || null,
        displayOrder: index,
      });
    }

    const wasCreate = !websiteSlug;
    const toastId = toast.loading(
      wasCreate ? "Creating website..." : "Saving changes...",
    );
    setIsSaving(true);

    try {
      const data = await upsertPartnerWebsite({
        about: about.trim(),
        certifications: trimmedCertifications,
        reviews: reviewsPayload,
      });

      applyProfile(data);
      setIsEditing(false);

      toast.update(toastId, {
        render: data.created
          ? "Website profile created successfully"
          : "Website profile updated successfully",
        type: "success",
        isLoading: false,
        autoClose: 4000,
      });

      // Refresh from server so the view mode shows latest persisted details.
      const refreshed = await fetchPartnerWebsite();
      applyProfile(refreshed);
      setIsEditing(false);
    } catch (err) {
      toast.update(toastId, {
        render:
          err instanceof Error ? err.message : "Failed to save website profile",
        type: "error",
        isLoading: false,
        autoClose: 4000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const editButton =
    hasWebsite && !isEditing ? (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="rounded-[10px] px-3 py-1.5 text-sm font-bold text-[var(--arn-amber)] transition-colors hover:bg-[var(--arn-amber-bg)]"
      >
        Edit
      </button>
    ) : hasWebsite && isEditing ? (
      <button
        type="button"
        onClick={() => {
          void (async () => {
            try {
              const data = await fetchPartnerWebsite();
              applyProfile(data);
              setIsEditing(false);
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Failed to reload website profile",
              );
            }
          })();
        }}
        className="rounded-[10px] px-3 py-1.5 text-sm font-semibold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)]"
      >
        Cancel
      </button>
    ) : null;

  if (isLoading) {
    return (
      <ComponentCard title="Your Website">
        <p className="text-sm text-[var(--arn-txt-2)]">Loading website profile...</p>
      </ComponentCard>
    );
  }

  if (loadError) {
    return (
      <ComponentCard title="Your Website">
        <p className="text-sm text-[var(--arn-red)]">{loadError}</p>
      </ComponentCard>
    );
  }

  if (!showForm) {
    return (
      <ComponentCard title="Your Website" headerRight={editButton}>
        <div className="space-y-5">
          {websiteUrl && (
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-4 py-2 text-sm font-bold text-[var(--arn-txt)] transition-colors hover:bg-[var(--arn-bg-3)]"
              >
                View Website
              </a>
              <span className="break-all text-xs text-[var(--arn-txt-2)]">
                {websiteUrl}
              </span>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--arn-txt-3)]">
              About
            </p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[var(--arn-txt)]">
              {about || "—"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--arn-txt-3)]">
              Certifications / Qualifications / Achievements
            </p>
            {trimmedCertifications.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[var(--arn-txt)]">
                {trimmedCertifications.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-[var(--arn-txt-2)]">—</p>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--arn-txt-3)]">
              Customer Reviews
            </p>
            {reviews.length === 0 ? (
              <p className="mt-1 text-sm text-[var(--arn-txt-2)]">No reviews yet.</p>
            ) : (
              <ol className="mt-2 list-decimal space-y-3 pl-5 text-sm text-[var(--arn-txt)]">
                {reviews.map((review) => (
                  <li key={review.key}>
                    <div className="font-semibold">
                      {review.customerName || "Customer"}
                      {review.stars ? ` · ${review.stars}/5` : ""}
                    </div>
                    {review.customerProfession ? (
                      <div className="text-[var(--arn-txt-2)]">
                        {review.customerProfession}
                      </div>
                    ) : null}
                    {review.customerTestimonial ? (
                      <p className="mt-1 whitespace-pre-wrap">
                        {review.customerTestimonial}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </ComponentCard>
    );
  }

  return (
    <ComponentCard title="Your Website" headerRight={editButton}>
      <div className="space-y-6">
        {websiteUrl && (
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg-2)] px-4 py-2 text-sm font-bold text-[var(--arn-txt)] transition-colors hover:bg-[var(--arn-bg-3)]"
            >
              View Website
            </a>
            <span className="break-all text-xs text-[var(--arn-txt-2)]">
              {websiteUrl}
            </span>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[var(--arn-txt)]">
            About <span className="text-[var(--arn-red)]">*</span>
          </label>
          <textarea
            value={about}
            maxLength={ABOUT_MAX}
            onChange={(e) => setAbout(e.target.value)}
            rows={5}
            className="w-full rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-2 text-sm text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
            placeholder="Tell clients about yourself (max 800 characters)"
          />
          <p className="text-xs text-[var(--arn-txt-3)]">
            {about.trim().length}/{ABOUT_MAX}
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-[var(--arn-txt)]">
              Certifications / Qualifications / Achievements{" "}
              <span className="text-[var(--arn-red)]">*</span>
            </label>
            <button
              type="button"
              onClick={() => setCertifications((prev) => [...prev, ""])}
              className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {certifications.map((item, index) => (
              <div key={`cert-${index}`} className="flex gap-2">
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...certifications];
                    next[index] = e.target.value;
                    setCertifications(next);
                  }}
                  className="h-11 w-full rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 text-sm text-[var(--arn-txt)] outline-none focus:border-[var(--arn-amber)]"
                  placeholder="e.g. Certified Financial Planner"
                />
                {certifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      setCertifications((prev) =>
                        prev.filter((_, i) => i !== index),
                      )
                    }
                    className="rounded-[10px] border border-[var(--arn-bdr)] px-3 text-sm text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)]"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm font-semibold text-[var(--arn-txt)]">
              Customer Reviews
            </label>
            <button
              type="button"
              onClick={() =>
                setReviews((prev) => [...prev, createReviewDraft()])
              }
              className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
            >
              Add review
            </button>
          </div>

          {reviews.length === 0 ? (
            <p className="text-xs text-[var(--arn-txt-3)]">
              Optional. You can create a website without reviews.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <div
                  key={review.key}
                  className="space-y-2 rounded-[10px] border border-[var(--arn-bdr)] p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[var(--arn-txt-3)]">
                      Review {index + 1}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => {
                          setReviews((prev) => {
                            const next = [...prev];
                            const tmp = next[index - 1];
                            next[index - 1] = next[index];
                            next[index] = tmp;
                            return next;
                          });
                        }}
                        className="text-xs text-[var(--arn-txt-2)] disabled:opacity-40"
                      >
                        Up
                      </button>
                      <button
                        type="button"
                        disabled={index === reviews.length - 1}
                        onClick={() => {
                          setReviews((prev) => {
                            const next = [...prev];
                            const tmp = next[index + 1];
                            next[index + 1] = next[index];
                            next[index] = tmp;
                            return next;
                          });
                        }}
                        className="text-xs text-[var(--arn-txt-2)] disabled:opacity-40"
                      >
                        Down
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setReviews((prev) =>
                            prev.filter((_, i) => i !== index),
                          )
                        }
                        className="text-xs text-[var(--arn-red)]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={review.customerName}
                    onChange={(e) => {
                      const next = [...reviews];
                      next[index] = {
                        ...next[index],
                        customerName: e.target.value,
                      };
                      setReviews(next);
                    }}
                    className="h-11 w-full rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 text-sm outline-none focus:border-[var(--arn-amber)]"
                    placeholder="Customer name *"
                  />

                  <div className="flex items-center gap-2">
                    <label className="text-xs text-[var(--arn-txt-2)]">
                      Stars *
                    </label>
                    <select
                      value={review.stars}
                      onChange={(e) => {
                        const next = [...reviews];
                        next[index] = {
                          ...next[index],
                          stars: Number(e.target.value),
                        };
                        setReviews(next);
                      }}
                      className="h-11 rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 text-sm outline-none focus:border-[var(--arn-amber)]"
                    >
                      {[1, 2, 3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </div>

                  <input
                    type="text"
                    value={review.customerProfession}
                    onChange={(e) => {
                      const next = [...reviews];
                      next[index] = {
                        ...next[index],
                        customerProfession: e.target.value,
                      };
                      setReviews(next);
                    }}
                    className="h-11 w-full rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 text-sm outline-none focus:border-[var(--arn-amber)]"
                    placeholder="Customer profession (optional)"
                  />

                  <textarea
                    value={review.customerTestimonial}
                    onChange={(e) => {
                      const next = [...reviews];
                      next[index] = {
                        ...next[index],
                        customerTestimonial: e.target.value,
                      };
                      setReviews(next);
                    }}
                    rows={3}
                    className="w-full rounded-[10px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--arn-amber)]"
                    placeholder="Customer testimonial (optional)"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="rounded-[10px] bg-[var(--arn-amber)] px-5 py-2 text-sm font-bold text-[var(--arn-white)] transition-colors hover:bg-[var(--arn-amber-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving
            ? "Saving..."
            : hasWebsite
              ? "Save Changes"
              : "Create My Website"}
        </button>
      </div>
    </ComponentCard>
  );
}
