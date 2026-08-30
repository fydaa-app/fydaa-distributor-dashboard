"use client";

import ArnEmptyState from "@/components/common/ArnEmptyState";
import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { HierarchyOption } from "@/services/arnHierarchyService";

type EditState = Record<string, { name: string; email: string; phone: string }>;
type ValidationErrors = Record<string, { name?: string; email?: string; phone?: string }>;

interface ArnEuinsTableProps {
  euins: HierarchyOption[];
  hasName: boolean;
  hasEmail: boolean;
  hasPhone: boolean;
  editing: EditState;
  validationErrors: ValidationErrors;
  isEditing: (euin: string) => boolean;
  startEdit: (euin: string, current: HierarchyOption) => void;
  cancelEdit: (euin: string) => void;
  saveEdit: (euin: string) => void;
  updateField: (euin: string, field: "name" | "email" | "phone", value: string) => void;
  saving: string | null;
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

function inputClass(hasError?: string | boolean) {
  return [
    "w-full rounded-[8px] border bg-[var(--arn-bg)] px-3 py-2 text-sm text-[var(--arn-txt)]",
    hasError ? "border-[var(--arn-red)]" : "border-[var(--arn-bdr-2)]",
  ].join(" ");
}

export default function ArnEuinsTable({
  euins,
  hasName,
  hasEmail,
  hasPhone,
  editing,
  validationErrors,
  isEditing,
  startEdit,
  cancelEdit,
  saveEdit,
  updateField,
  saving,
}: ArnEuinsTableProps) {
  if (euins.length === 0) {
    return (
      <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
        <ArnEmptyState
          title="No EUINs found"
          description="No EUINs found under your account."
        />
      </div>
    );
  }

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
      <div className="-mx-5 overflow-x-auto">
        <table className="min-w-[860px] w-full table-fixed border-collapse text-left text-sm [&_tbody_tr:nth-child(odd)]:bg-[var(--arn-bg-2)] [&_tbody_tr:nth-child(even)]:bg-[var(--arn-bg)]">
          <thead>
            <tr>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">EUIN</th>
              {hasName && <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Name</th>}
              {hasEmail && <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Email</th>}
              {hasPhone && <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Phone</th>}
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Status</th>
              <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Action</th>
            </tr>
          </thead>
          <tbody>
            {euins.map((item) => {
              const editingThis = isEditing(item.euinNumber);
              const edit = editing[item.euinNumber];
              const errors = validationErrors[item.euinNumber];
              return (
                <tr key={item.euinNumber} className="border-b border-[var(--arn-bdr)] last:border-0">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      readOnly
                      value={item.euinNumber}
                      className="w-full rounded-[8px] border border-black dark:border-white bg-[var(--arn-bg-3)] px-3 py-2 text-sm text-black dark:text-white cursor-not-allowed"
                    />
                  </td>
                  {hasName && (
                    <td className="px-4 py-3">
                      {editingThis ? (
                        <div>
                          <input
                            type="text"
                            value={edit?.name ?? ""}
                            onChange={(e) => updateField(item.euinNumber, "name", e.target.value)}
                            className={inputClass(errors?.name)}
                          />
                          {errors?.name && (
                            <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.name}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--arn-txt)]">{item.name || "—"}</span>
                      )}
                    </td>
                  )}
                  {hasEmail && (
                    <td className="px-4 py-3">
                      {editingThis ? (
                        <div>
                          <input
                            type="email"
                            value={edit?.email ?? ""}
                            onChange={(e) => updateField(item.euinNumber, "email", e.target.value)}
                            className={inputClass(errors?.email)}
                          />
                          {errors?.email && (
                            <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.email}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--arn-txt)]">{item.email || "—"}</span>
                      )}
                    </td>
                  )}
                  {hasPhone && (
                    <td className="px-4 py-3">
                      {editingThis ? (
                        <div>
                          <input
                            type="tel"
                            value={edit?.phone ?? ""}
                            onChange={(e) => updateField(item.euinNumber, "phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                            className={inputClass(errors?.phone)}
                          />
                          {errors?.phone && (
                            <p className="mt-1 text-xs text-[var(--arn-red)]">{errors.phone}</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-[var(--arn-txt)]">{item.phone || "—"}</span>
                      )}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    {(() => {
                      const { label, variant } = getStatusMeta(item.status);
                      return (
                        <div>
                          <ArnStatusTag label={label} variant={variant} />
                          {item.status === "REJECTED" && item.rejectionReason && (
                            <p className="mt-1 text-xs text-[var(--arn-red)]">{item.rejectionReason}</p>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-4 py-3">
                    {editingThis ? (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(item.euinNumber)}
                          disabled={saving === item.euinNumber}
                          className="rounded-[8px] bg-[var(--arn-amber)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--arn-amber-txt)] disabled:opacity-70"
                        >
                          {saving === item.euinNumber ? "Saving..." : "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => cancelEdit(item.euinNumber)}
                          disabled={saving === item.euinNumber}
                          className="rounded-[8px] border border-[var(--arn-bdr)] px-3 py-1.5 text-xs font-bold text-[var(--arn-txt-2)] transition-colors hover:bg-[var(--arn-bg-2)] disabled:opacity-70"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : !(item.name && item.name.trim() && item.email && item.email.trim() && item.phone && item.phone.trim()) ? (
                      <button
                        type="button"
                        onClick={() => startEdit(item.euinNumber, item)}
                        className="rounded-[8px] border border-[var(--arn-bdr)] px-3 py-1.5 text-xs font-bold text-[var(--arn-amber)] transition-colors hover:bg-[var(--arn-amber-bg)]"
                      >
                        Assign
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
