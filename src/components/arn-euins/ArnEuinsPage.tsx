"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  getHierarchy,
  saveArnEuinDetails,
  type HierarchyOption,
  type HierarchyResponse,
} from "@/services/arnHierarchyService";
import ComponentCard from "@/components/common/ComponentCard";
import ArnEuinsTable from "@/components/tables/ArnEuinsTable";
import ArnStatusTag from "@/components/common/ArnStatusTag";

type EditState = Record<string, { name: string; email: string; phone: string }>;
type ValidationErrors = Record<string, { name?: string; email?: string; phone?: string }>;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function inputClass(hasError?: string | boolean) {
  return [
    "flex-1 rounded-[8px] border bg-[var(--arn-bg)] px-3 py-1.5 text-right text-sm text-[var(--arn-txt)]",
    hasError ? "border-[var(--arn-red)]" : "border-[var(--arn-bdr-2)]",
  ].join(" ");
}

function getColumnVisibility(data: HierarchyOption[]) {
  const hasName = data.some((item) => item.name && item.name.trim().length > 0);
  const hasEmail = data.some((item) => item.email && item.email.trim().length > 0);
  const hasPhone = data.some((item) => item.phone && item.phone.trim().length > 0);
  return { hasName, hasEmail, hasPhone };
}

function getStatusMeta(status?: string) {
  if (status === "ACCEPTED") {
    return { label: "Active", variant: "active" as const };
  }
  if (status === "REJECTED") {
    return { label: "Rejected", variant: "failed" as const };
  }
  return { label: "Pending", variant: "processing" as const };
}

export default function ArnEuinsPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, isPartner } = useAuth();

  const [hierarchy, setHierarchy] = useState<HierarchyResponse | null>(null);
  const [editing, setEditing] = useState<EditState>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (!isLoading && isAuthenticated && !isPartner) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isPartner, router]);

  useEffect(() => {
    let cancelled = false;

    getHierarchy()
      .then((data) => {
        if (!cancelled) {
          setHierarchy(data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-sm text-[var(--arn-txt-2)]">Loading EUINs...</div>
      </div>
    );
  }

  if (!isAuthenticated || !isPartner) {
    return null;
  }

  const euins = hierarchy ? (() => {
    const flatten = (nodes: HierarchyOption[]): HierarchyOption[] => {
      const result: HierarchyOption[] = [];
      for (const node of nodes) {
        if ((node.level === "arn" || node.level === "euin") && node.euinNumber) {
          result.push(node);
        }
        if (node.children && node.children.length > 0) {
          result.push(...flatten(node.children));
        }
      }
      return result;
    };
    return flatten(hierarchy.hierarchy);
  })() : [];

  const { hasName, hasEmail, hasPhone } = getColumnVisibility(euins);

  const startEdit = (euin: string, current: HierarchyOption) => {
    setEditing((prev) => ({
      ...prev,
      [euin]: {
        name: current.name || "",
        email: current.email || "",
        phone: current.phone || "",
      },
    }));
  };

  const cancelEdit = (euin: string) => {
    setEditing((prev) => {
      const next = { ...prev };
      delete next[euin];
      return next;
    });
  };

  const saveEdit = async (euin: string) => {
    const nextEdit = editing[euin];
    if (!nextEdit) return;

    if (!validateEdit(euin)) {
      return;
    }

    setSaving(euin);
    try {
      const row = euins.find((u) => u.euinNumber === euin);
      if (!row?.id) {
        throw new Error("EUIN id not found; cannot save details");
      }

      await saveArnEuinDetails(row.id, {
        name: nextEdit.name,
        email: nextEdit.email,
        mobileNumber: nextEdit.phone,
      });

      const data = await getHierarchy();
      setHierarchy(data);
      cancelEdit(euin);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(null);
    }
  };

  const updateField = (euin: string, field: "name" | "email" | "phone", value: string) => {
    setEditing((prev) => ({
      ...prev,
      [euin]: {
        ...prev[euin],
        [field]: value,
      },
    }));
    setValidationErrors((prev) => {
      const next = { ...prev };
      delete next[euin];
      return next;
    });
  };

  const validateEdit = (euin: string) => {
    const data = editing[euin];
    if (!data) return false;
    const errors: { name?: string; email?: string; phone?: string } = {};
    if (!data.name.trim()) {
      errors.name = "Name cannot be empty";
    } else if (/\d/.test(data.name)) {
      errors.name = "Name cannot contain numbers";
    }
    if (!data.email.trim()) {
      errors.email = "Email cannot be empty";
    } else if (!EMAIL_REGEX.test(data.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!data.phone.trim()) {
      errors.phone = "Phone cannot be empty";
    } else if (!/^\d+$/.test(data.phone.trim())) {
      errors.phone = "Phone must contain only digits";
    } else if (data.phone.trim().length !== 10) {
      errors.phone = "Phone must be 10 digits";
    }
    const hasError = Object.keys(errors).length > 0;
    if (hasError) {
      setValidationErrors((prev) => ({ ...prev, [euin]: errors }));
    }
    return !hasError;
  };

  if (euins.length === 0) {
    return (
      <ComponentCard title="EUINs" desc="Manage EUIN details and contact information">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-sm text-[var(--arn-txt-2)]">No EUINs found under your account.</p>
        </div>
      </ComponentCard>
    );
  }

  const isEditing = (euin: string) => !!editing[euin];

  return (
    <div className="mx-auto w-full max-w-[1440px] space-y-6 p-5 sm:space-y-7 sm:p-6 lg:space-y-8 lg:p-8">
      <ComponentCard title="EUINs" desc="Manage EUIN details and contact information">
      <ArnEuinsTable
        euins={euins}
        hasName={hasName}
        hasEmail={hasEmail}
        hasPhone={hasPhone}
        editing={editing}
        validationErrors={validationErrors}
        isEditing={isEditing}
        startEdit={startEdit}
        cancelEdit={cancelEdit}
        saveEdit={saveEdit}
        updateField={updateField}
        saving={saving}
      />

      <div className="sm:hidden mt-4 space-y-4">
        {euins.map((item) => {
          const edit = editing[item.euinNumber];
          const editingThis = isEditing(item.euinNumber);
          return (
            <div key={item.euinNumber} className="rounded-[14px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--arn-txt)]">EUIN</span>
                <input
                  type="text"
                  readOnly
                  value={item.euinNumber}
                  className="w-32 rounded-[8px] border border-black dark:border-white bg-[var(--arn-bg-3)] px-3 py-1.5 text-right text-xs text-black dark:text-white cursor-not-allowed"
                />
              </div>

              {hasName && (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--arn-txt-2)]">Name</span>
                  {editingThis ? (
                    <input
                      type="text"
                      value={edit?.name ?? ""}
                      onChange={(e) => updateField(item.euinNumber, "name", e.target.value)}
                      className={inputClass(validationErrors[item.euinNumber]?.name)}
                    />
                  ) : (
                    <span className="text-sm text-[var(--arn-txt)]">{item.name || "—"}</span>
                  )}
                  {validationErrors[item.euinNumber]?.name && (
                    <p className="mt-1 text-xs text-[var(--arn-red)]">{validationErrors[item.euinNumber].name}</p>
                  )}
                </div>
              )}

              {hasEmail && (
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--arn-txt-2)]">Email</span>
                  {editingThis ? (
                    <div>
                      <input
                        type="email"
                        value={edit?.email ?? ""}
                        onChange={(e) => updateField(item.euinNumber, "email", e.target.value)}
                        className={inputClass(validationErrors[item.euinNumber]?.email)}
                      />
                      {validationErrors[item.euinNumber]?.email && (
                        <p className="mt-1 text-right text-xs text-[var(--arn-red)]">{validationErrors[item.euinNumber].email}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--arn-txt)]">{item.email || "—"}</span>
                  )}
                </div>
              )}

              {hasPhone && (
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="text-xs font-semibold text-[var(--arn-txt-2)]">Phone</span>
                  {editingThis ? (
                    <div>
                      <input
                        type="tel"
                        value={edit?.phone ?? ""}
                        onChange={(e) => updateField(item.euinNumber, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                        className={inputClass(validationErrors[item.euinNumber]?.phone)}
                      />
                      {validationErrors[item.euinNumber]?.phone && (
                        <p className="mt-1 text-right text-xs text-[var(--arn-red)]">{validationErrors[item.euinNumber].phone}</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-[var(--arn-txt)]">{item.phone || "—"}</span>
                  )}
                </div>
              )}

              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-[var(--arn-txt-2)]">Status</span>
                {(() => {
                  const { label, variant } = getStatusMeta(item.status);
                  return (
                    <div className="text-right">
                      <ArnStatusTag label={label} variant={variant} />
                      {item.status === "REJECTED" && item.rejectionReason && (
                        <p className="mt-1 text-xs text-[var(--arn-red)]">{item.rejectionReason}</p>
                      )}
                    </div>
                  );
                })()}
              </div>

              {editingThis ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => saveEdit(item.euinNumber)}
                    disabled={saving === item.euinNumber}
                    className="flex-1 rounded-[8px] bg-[var(--arn-amber)] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--arn-amber-txt)] disabled:opacity-70"
                  >
                    {saving === item.euinNumber ? "Saving..." : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => cancelEdit(item.euinNumber)}
                    disabled={saving === item.euinNumber}
                    className="flex-1 rounded-[8px] border border-[var(--arn-bdr)] px-3 py-2 text-xs font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:opacity-70"
                  >
                    Cancel
                  </button>
                </div>
              ) : !(item.name && item.name.trim() && item.email && item.email.trim() && item.phone && item.phone.trim()) ? (
                <button
                  type="button"
                  onClick={() => startEdit(item.euinNumber, item)}
                  className="w-full rounded-[8px] border border-[var(--arn-bdr)] px-3 py-2 text-xs font-bold text-[var(--arn-amber)] transition-colors hover:bg-[var(--arn-amber-bg)]"
                >
                  Assign
                </button>
              ) : null}
            </div>
          );
        })}
      </div>
    </ComponentCard>
    </div>
  );
}
