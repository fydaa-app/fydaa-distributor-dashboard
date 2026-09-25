"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { ArnLead, CreateLeadPayload, UpdateLeadPayload } from "@/types/arnLead";
import { LeadStatus, LeadSource } from "@/types/arnLead";
import { uploadLeadImage } from "@/services/arnLeadService";
import { COLORS } from "@/theme/colors";

interface LeadFormState {
  name: string;
  email: string;
  mobileNumber: string;
  source: string;
  status: LeadStatus;
  potentialInvestment?: number;
  notes?: string;
  nextFollowUpAt?: string;
  imageUrl?: string;
  convertedAmount?: number;
}

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateLeadPayload | UpdateLeadPayload) => Promise<void>;
  leadToEdit?: ArnLead | null;
  isLoading: boolean;
}

const statusOptions: { value: LeadStatus; label: string }[] = [
  { value: LeadStatus.NEW, label: "New" },
  { value: LeadStatus.IN_PROGRESS, label: "In Progress" },
  { value: LeadStatus.CONVERTED, label: "Converted" },
  { value: LeadStatus.LOST, label: "Lost" },
];

const sourceOptions: { value: LeadSource; label: string }[] = [
  { value: LeadSource.WEBSITE, label: "Website" },
  { value: LeadSource.REFERRAL, label: "Referral" },
  { value: LeadSource.WALK_IN, label: "Walk In" },
  { value: LeadSource.PHONE, label: "Phone" },
  { value: LeadSource.EMAIL, label: "Email" },
  { value: LeadSource.SOCIAL_MEDIA, label: "Social Media" },
  { value: LeadSource.EVENT, label: "Event" },
  { value: LeadSource.OTHER, label: "Other" },
];

const knownSources = new Set<string>(sourceOptions.map((option) => option.value));

const emptyForm = (): LeadFormState => ({
  name: "",
  email: "",
  mobileNumber: "",
  source: LeadSource.WEBSITE,
  status: LeadStatus.NEW,
  potentialInvestment: undefined,
  notes: undefined,
  nextFollowUpAt: undefined,
  imageUrl: undefined,
  convertedAmount: undefined,
});

const inputClass =
  "w-full h-10 rounded-[10px] border px-3 text-sm text-[var(--arn-txt)] bg-[var(--arn-bg-2)] border-[var(--arn-bdr)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)] outline-none transition-colors";

const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif"];
const maxImageBytes = 5 * 1024 * 1024;
const imageHint = "Supported formats: JPEG, PNG, JPG (Max 5MB) - Image cannot be changed after upload";

export default function LeadModal({
  isOpen,
  onClose,
  onSubmit,
  leadToEdit,
  isLoading,
}: LeadModalProps) {
  const isUpdate = Boolean(leadToEdit);
  const [formData, setFormData] = useState<LeadFormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "mobileNumber", string>>>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [sourceDetail, setSourceDetail] = useState("");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [investedError, setInvestedError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedImage(null);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setImageError(null);
    setIsUploadingImage(false);
    setSourceError(null);
    setInvestedError(null);

    if (leadToEdit) {
      const savedSource = leadToEdit.source || LeadSource.WEBSITE;
      const isKnownSource = savedSource !== LeadSource.OTHER && knownSources.has(savedSource);
      setSourceDetail(isKnownSource ? "" : savedSource === LeadSource.OTHER ? "" : savedSource);
      setFormData({
        name: leadToEdit.name,
        email: leadToEdit.email || "",
        mobileNumber: leadToEdit.mobileNumber,
        source: isKnownSource ? savedSource : LeadSource.OTHER,
        status: leadToEdit.status,
        potentialInvestment: leadToEdit.potentialInvestment || undefined,
        notes: leadToEdit.notes || undefined,
        nextFollowUpAt: leadToEdit.nextFollowUpAt ? leadToEdit.nextFollowUpAt.split("T")[0] : undefined,
        imageUrl: leadToEdit.imageUrl || undefined,
        convertedAmount: leadToEdit.convertedAmount || undefined,
      });
    } else {
      setSourceDetail("");
      setFormData(emptyForm());
    }
    setErrors({});
  }, [leadToEdit, isOpen]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<"name" | "email" | "mobileNumber", string>> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = "Mobile number is required";
    else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\D/g, ""))) {
      newErrors.mobileNumber = "Enter a valid 10-digit mobile number";
    }
    const otherSourceMissing = formData.source === LeadSource.OTHER && !sourceDetail.trim();
    const convertedWithoutAmount =
      Boolean(leadToEdit) &&
      formData.status === LeadStatus.CONVERTED &&
      !(formData.convertedAmount !== undefined && formData.convertedAmount > 0);
    setSourceError(otherSourceMissing ? "Enter the source" : null);
    setInvestedError(convertedWithoutAmount ? "Invested amount must be greater than 0" : null);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && !otherSourceMissing && !convertedWithoutAmount;
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setImageError(null);
    setFormData((prev) => ({ ...prev, imageUrl: undefined }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!allowedImageTypes.includes(file.type)) {
      setImageError("Supported formats: JPEG, PNG, JPG, GIF");
      return;
    }
    if (file.size > maxImageBytes) {
      setImageError("Image must be 5MB or smaller");
      return;
    }

    const preview = URL.createObjectURL(file);
    setImageError(null);
    setSelectedImage(file);
    setImagePreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return preview;
    });
    setIsUploadingImage(true);
    try {
      const imageUrl = await uploadLeadImage(file);
      setFormData((prev) => ({ ...prev, imageUrl }));
    } catch (err) {
      setSelectedImage(null);
      setImagePreview(null);
      URL.revokeObjectURL(preview);
      setFormData((prev) => ({ ...prev, imageUrl: leadToEdit?.imageUrl || undefined }));
      setImageError(err instanceof Error ? err.message : "Image upload failed");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    const stringOptionalFields = ["notes", "nextFollowUpAt", "imageUrl"];
    const numberFields = ["potentialInvestment", "convertedAmount"];
    setFormData((prev) => ({
      ...prev,
      [name]: numberFields.includes(name)
        ? value === ""
          ? undefined
          : Number(value)
        : stringOptionalFields.includes(name) && value === ""
          ? undefined
          : value,
    }));
    if (name === "name" || name === "email" || name === "mobileNumber") {
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }));
      }
    }
  };

  const sharedPayload = (): CreateLeadPayload => ({
    name: formData.name.trim(),
    email: formData.email.trim(),
    mobileNumber: formData.mobileNumber.trim(),
    ...(formData.source === LeadSource.OTHER
      ? { source: sourceDetail.trim() }
      : formData.source
        ? { source: formData.source }
        : {}),
    ...(formData.potentialInvestment !== undefined ? { potentialInvestment: formData.potentialInvestment } : {}),
    ...(formData.notes ? { notes: formData.notes } : {}),
    ...(formData.nextFollowUpAt ? { nextFollowUpAt: formData.nextFollowUpAt } : {}),
    ...(formData.imageUrl ? { imageUrl: formData.imageUrl } : {}),
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isUploadingImage) return;
    if (!validate()) return;

    if (leadToEdit) {
      const updateData: UpdateLeadPayload = {
        ...sharedPayload(),
        status: formData.status,
      };
      if (formData.convertedAmount !== undefined && formData.convertedAmount > 0) {
        updateData.convertedAmount = formData.convertedAmount;
      }
      await onSubmit(updateData);
      return;
    }

    await onSubmit(sharedPayload());
  };

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className={`tone-${COLORS.currentBrand} fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}>
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[16px] bg-[var(--arn-bg)] border border-[var(--arn-bdr)] shadow-xl">
        <div className="flex items-center justify-between border-b border-[var(--arn-bdr)] px-6 py-4">
          <h2 className="text-lg font-bold text-[var(--arn-txt)]">
            {leadToEdit ? "Edit Lead" : "Create New Lead"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-[8px] text-[var(--arn-txt-3)] hover:bg-[var(--arn-bg-2)] hover:text-[var(--arn-txt)] transition-colors"
          >
            <i aria-hidden="true" className="ti ti-x h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Lead Name <span className="text-[var(--arn-red)]">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`${inputClass} ${errors.name ? "border-[var(--arn-red)]" : ""}`}
                placeholder="Enter lead name"
              />
              {errors.name && <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="mobileNumber" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Mobile Number <span className="text-[var(--arn-red)]">*</span>
              </label>
              <input
                type="tel"
                id="mobileNumber"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                className={`${inputClass} ${errors.mobileNumber ? "border-[var(--arn-red)]" : ""}`}
                placeholder="Enter 10-digit mobile"
                maxLength={10}
              />
              {errors.mobileNumber && <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.mobileNumber}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Email <span className="text-[var(--arn-red)]">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`${inputClass} ${errors.email ? "border-[var(--arn-red)]" : ""}`}
                placeholder="Enter email"
              />
              {errors.email && <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Source
              </label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleChange}
                className={inputClass}
              >
                {sourceOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {formData.source === LeadSource.OTHER && (
                <>
                  <input
                    type="text"
                    id="sourceDetail"
                    value={sourceDetail}
                    onChange={(event) => {
                      setSourceDetail(event.target.value);
                      if (sourceError) setSourceError(null);
                    }}
                    className={`${inputClass} mt-2 ${sourceError ? "border-[var(--arn-red)]" : ""}`}
                    placeholder="Enter source"
                  />
                  {sourceError && <p className="mt-1 text-xs text-[var(--arn-red)]">{sourceError}</p>}
                </>
              )}
            </div>

            {isUpdate && (
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={inputClass}
                >
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label htmlFor="potentialInvestment" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Potential Investment (₹)
              </label>
              <input
                type="number"
                id="potentialInvestment"
                name="potentialInvestment"
                value={formData.potentialInvestment ?? ""}
                onChange={handleChange}
                className={inputClass}
                placeholder="0"
                min="0"
                step="1000"
              />
            </div>

            {isUpdate && (
              <div>
                <label htmlFor="convertedAmount" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                  Invested Amount (₹)
                </label>
                <input
                  type="number"
                  id="convertedAmount"
                  name="convertedAmount"
                  value={formData.convertedAmount ?? ""}
                  onChange={handleChange}
                className={`${inputClass} ${investedError ? "border-[var(--arn-red)]" : ""}`}
                placeholder="0"
                min="0"
                step="1000"
              />
                {investedError && <p className="mt-1 text-xs text-[var(--arn-red)]">{investedError}</p>}
                {formData.convertedAmount !== undefined && formData.convertedAmount > 0 && (
                  <p className="mt-1 text-xs text-[var(--arn-txt-3)]">Status will auto-change to Converted</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="nextFollowUpAt" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Next Follow-up Date
              </label>
              <input
                type="date"
                id="nextFollowUpAt"
                name="nextFollowUpAt"
                value={formData.nextFollowUpAt ?? ""}
                onChange={handleChange}
                className={inputClass}
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-[var(--arn-txt-2)] mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes ?? ""}
                onChange={handleChange}
                rows={3}
                className="w-full rounded-[10px] border px-3 py-2 text-sm text-[var(--arn-txt)] bg-[var(--arn-bg-2)] border-[var(--arn-bdr)] focus:border-[var(--arn-amber)] focus:bg-[var(--arn-bg)] outline-none transition-colors resize-none"
                placeholder="Add notes..."
              />
            </div>

            <div className="sm:col-span-2 space-y-2">
              <label htmlFor="lead-image-upload" className="block text-sm font-medium text-[var(--arn-txt-2)]">
                Lead Image
              </label>
              <input
                type="file"
                id="lead-image-upload"
                accept="image/jpeg,image/jpg,image/png,image/gif"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              <label
                htmlFor="lead-image-upload"
                className={`inline-flex items-center gap-2 px-4 py-2 bg-[var(--arn-amber)] text-[var(--arn-white)] rounded-lg cursor-pointer hover:opacity-90 transition-colors ${
                  isUploadingImage ? "pointer-events-none opacity-60" : ""
                }`}
              >
                {isUploadingImage ? (
                  <>
                    <i aria-hidden="true" className="ti ti-loader-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <i aria-hidden="true" className="ti ti-upload" />
                    {imagePreview || formData.imageUrl ? "Change Image" : "Upload Image"}
                  </>
                )}
              </label>
              {(imagePreview || formData.imageUrl) && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={imagePreview || formData.imageUrl}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-[var(--arn-bdr)]"
                  />
                  {!isUpdate && (
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-[var(--arn-red)] text-white rounded-full p-1.5"
                      title="Remove image"
                    >
                      <i aria-hidden="true" className="ti ti-x" />
                    </button>
                  )}
                </div>
              )}
              {imageError && <p className="text-sm text-[var(--arn-red)]">{imageError}</p>}
              {!selectedImage && !formData.imageUrl && !isUpdate && (
                <p className="text-sm text-[var(--arn-txt-3)]">{imageHint}</p>
              )}
              {isUpdate && (
                <p className="text-sm text-[var(--arn-txt-3)]">{imageHint}</p>
              )}
              {isUpdate && formData.imageUrl && !imagePreview && (
                <p className="text-sm text-[var(--arn-txt-3)]">Current image will be kept if no new image is uploaded</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-[var(--arn-bdr)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[10px] border border-[var(--arn-bdr)] text-sm font-medium text-[var(--arn-txt-2)] hover:bg-[var(--arn-bg-2)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImage}
              className="px-4 py-2 rounded-[10px] bg-[var(--arn-amber)] text-sm font-medium text-[var(--arn-white)] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            >
              {isLoading ? "Saving..." : leadToEdit ? "Update Lead" : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
