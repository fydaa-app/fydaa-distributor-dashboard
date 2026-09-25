"use client";

import React, { useCallback, useMemo, useState } from "react";
import {
  downloadFinancialPlanForUser,
  recalculateWealthScoreForPartner,
  type FinancialPlanData,
  type QuestionAnswerDto,
  type QuestionDefinition,
  updateAssetsLiabilitiesForUser,
  updateBudgetingForUser,
  updateFinancialGoalsForUser,
  updateInsurancePlanningForUser,
  updatePersonalDetailsForUser,
} from "@/services/financialPlanService";

interface ArnClientPlanDataTabProps {
  financialPlan?: FinancialPlanData | null;
  userId: string;
  questions?: QuestionDefinition[];
  onRefresh?: () => void | Promise<void>;
}

const EditableInput = ({
  value,
  onChange,
  placeholder = "",
  type = "text",
  className = "",
}: {
  value: string | number | undefined;
  onChange: (value: string | number) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}) => (
  <input
    type={type}
    value={value ?? ""}
    onChange={(e) => {
      const val = type === "number" ? Number(e.target.value) : e.target.value;
      onChange(val);
    }}
    placeholder={placeholder}
    className={`w-full rounded-md border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-2 py-1 text-sm text-[var(--arn-txt)] ${className}`}
  />
);

const EditableBoolean = ({
  value,
  onChange,
}: {
  value: boolean;
  onChange: (value: boolean) => void;
}) => (
  <select
    value={value ? "true" : "false"}
    onChange={(e) => onChange(e.target.value === "true")}
    className="rounded-md border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-2 py-1 text-sm text-[var(--arn-txt)]"
  >
    <option value="true">Yes</option>
    <option value="false">No</option>
  </select>
);

const EditableDropdown = ({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    className="rounded-md border border-[var(--arn-bdr)] bg-[var(--arn-bg)] px-2 py-1 text-sm text-[var(--arn-txt)]"
  >
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>
        {opt.label}
      </option>
    ))}
  </select>
);

const useQuestionMap = (questions?: QuestionDefinition[]) =>
  useMemo(() => {
    const map = new Map<number, QuestionDefinition>();
    questions?.forEach((q) => map.set(q.questionId, q));
    return map;
  }, [questions]);

const hasPredefinedOptions = (
  questionId: number,
  questionMap: Map<number, QuestionDefinition>
): boolean => {
  const q = questionMap.get(questionId);
  return q?.option !== null && q?.option !== undefined && Object.keys(q.option).length > 0;
};

const isEditableQuestion = (item: QuestionAnswerDto): boolean =>
  item.questionId !== null && item.questionId !== undefined && item.questionId > 0;

const getQuestionOptions = (
  questionId: number,
  questionMap: Map<number, QuestionDefinition>
): Array<{ value: string; label: string }> => {
  const q = questionMap.get(questionId);
  if (!q?.option) return [];
  return Object.entries(q.option).map(([key, label]) => ({
    value: key,
    label: String(label),
  }));
};

const getOptionLabel = (
  questionId: number,
  optionKey: string,
  questionMap: Map<number, QuestionDefinition>
): string => {
  const q = questionMap.get(questionId);
  if (q?.option && typeof q.option === "object") {
    return q.option[optionKey] ? String(q.option[optionKey]) : optionKey;
  }
  return optionKey;
};

const asRecord = (
  value: QuestionAnswerDto[] | Record<string, QuestionAnswerDto[]> | null | undefined
): Record<string, QuestionAnswerDto[]> | null => {
  if (!value || Array.isArray(value)) return null;
  return value;
};

const asArray = (
  value: QuestionAnswerDto[] | Record<string, QuestionAnswerDto[]> | null | undefined
): QuestionAnswerDto[] => (Array.isArray(value) ? value : []);

const renderQuestionnaireSection = (
  items: QuestionAnswerDto[] | undefined | null,
  questionMap: Map<number, QuestionDefinition> | undefined,
  editing: boolean = false,
  editedItems?: Record<string, string | number | boolean>,
  onItemChange?: (questionId: string, value: string | number | boolean) => void
) => {
  if (!items || items.length === 0) return null;

  const displayItems = items.map((item) => {
    if (editing && isEditableQuestion(item)) {
      return {
        ...item,
        ...(hasPredefinedOptions(item.questionId || 0, questionMap!)
          ? { option: editedItems?.[String(item.questionId)]?.toString() ?? item.option }
          : { value: editedItems?.[String(item.questionId)] ?? item.value }),
      };
    }
    if (!editing && questionMap && item.option && isEditableQuestion(item)) {
      return {
        ...item,
        value: getOptionLabel(item.questionId || 0, String(item.option), questionMap),
      };
    }
    return item;
  });

  return (
    <div className="overflow-x-auto">
      <div className="min-w-full">
        <div className="grid grid-cols-[1fr_1fr] gap-3 border-b border-[var(--arn-bdr)] px-4 py-2 text-xs font-semibold uppercase text-[var(--arn-txt-2)]">
          <span>Question</span>
          <span>Answer</span>
        </div>
        {displayItems.map((item, index) => (
          <div
            key={`${item.questionId || "q"}-${index}`}
            className="grid grid-cols-[1fr_1fr] gap-3 border-b border-[var(--arn-bdr)] px-4 py-2.5 last:border-b-0"
          >
            <span className="text-sm text-[var(--arn-txt-2)]">
              {questionMap?.get(item.questionId || 0)?.question ||
                item.question ||
                `Q${item.questionId}`}
            </span>
            <span className="text-sm text-[var(--arn-txt)]">
              {editing && isEditableQuestion(item) ? (
                hasPredefinedOptions(item.questionId || 0, questionMap!) ? (
                  <EditableDropdown
                    value={item.option || ""}
                    options={getQuestionOptions(item.questionId || 0, questionMap!)}
                    onChange={(val) => onItemChange?.(String(item.questionId), val)}
                  />
                ) : typeof item.value === "boolean" ? (
                  <EditableBoolean
                    value={item.value}
                    onChange={(val) => onItemChange?.(String(item.questionId), val)}
                  />
                ) : (
                  <EditableInput
                    value={typeof item.value === "boolean" ? "" : item.value ?? ""}
                    onChange={(val) => onItemChange?.(String(item.questionId), val)}
                    type={typeof item.value === "number" ? "number" : "text"}
                  />
                )
              ) : (
                (item.value ??
                  (item.option
                    ? getOptionLabel(item.questionId || 0, String(item.option), questionMap!)
                    : undefined)) ?? "-"
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const renderGoalsSection = (
  goals: Record<string, QuestionAnswerDto[]> | undefined | null,
  editingSectionId: string | null,
  editedGoals?: Record<string, Record<string, string | number | boolean>>,
  onGoalChange?: (
    goalId: string,
    questionId: string,
    value: string | number | boolean
  ) => void,
  onEditSection?: (section: string) => void,
  onSaveSection?: () => void,
  onCancelSection?: () => void,
  saving?: boolean,
  questionMap?: Map<number, QuestionDefinition>
) => {
  if (!goals || Object.keys(goals).length === 0) return null;

  return (
    <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
      <h3 className="mb-3 text-lg font-semibold text-[var(--arn-txt)]">Financial Goals</h3>
      <div className="space-y-4">
        {Object.entries(goals).map(([goalId, items]) => {
          const isEditingThis = editingSectionId === `goals_${goalId}`;
          const editKey = `goals_${goalId}`;
          const displayItems = isEditingThis
            ? items.filter(isEditableQuestion).map((item) => ({
                ...item,
                ...(hasPredefinedOptions(item.questionId || 0, questionMap!)
                  ? {
                      option:
                        editedGoals?.[editKey]?.[String(item.questionId)]?.toString() ??
                        item.option,
                    }
                  : {
                      value:
                        editedGoals?.[editKey]?.[String(item.questionId)] ?? item.value,
                    }),
              }))
            : items.map((item) => {
                if (questionMap && item.option) {
                  return {
                    ...item,
                    value: getOptionLabel(
                      item.questionId || 0,
                      String(item.option),
                      questionMap
                    ),
                  };
                }
                return item;
              });

          return (
            <div
              key={goalId}
              className="rounded-lg border border-[var(--arn-bdr)] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-[var(--arn-txt)]">
                  {goalId.replace(/([a-z])([1-9])/g, "$1 $2")}
                </h4>
                {!isEditingThis ? (
                  <button
                    type="button"
                    onClick={() => onEditSection?.(`goals_${goalId}`)}
                    className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onCancelSection}
                      className="text-sm font-semibold text-[var(--arn-txt-2)] hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onSaveSection}
                      disabled={saving}
                      className="text-sm font-semibold text-green-600 hover:underline disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {displayItems.map((item, index) => (
                  <div key={`${item.questionId || "q"}-${index}`} className="text-sm">
                    <span className="text-[var(--arn-txt-2)]">
                      {item.question || `Q${item.questionId}`}:
                    </span>
                    {isEditingThis ? (
                      hasPredefinedOptions(item.questionId || 0, questionMap!) ? (
                        <EditableDropdown
                          value={item.option || ""}
                          options={getQuestionOptions(item.questionId || 0, questionMap!)}
                          onChange={(val) =>
                            onGoalChange?.(goalId, String(item.questionId), val)
                          }
                        />
                      ) : typeof item.value === "boolean" ? (
                        <EditableBoolean
                          value={item.value}
                          onChange={(val) =>
                            onGoalChange?.(goalId, String(item.questionId), val)
                          }
                        />
                      ) : (
                        <EditableInput
                          value={typeof item.value === "boolean" ? "" : item.value ?? ""}
                          onChange={(val) =>
                            onGoalChange?.(goalId, String(item.questionId), val)
                          }
                          type={typeof item.value === "number" ? "number" : "text"}
                        />
                      )
                    ) : (
                      <span className="ml-2 text-[var(--arn-txt)]">
                        {(item.value ??
                          (item.option
                            ? getOptionLabel(
                                item.questionId || 0,
                                String(item.option),
                                questionMap!
                              )
                            : undefined)) ?? "-"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderInsuranceSection = (
  insurance: Record<string, QuestionAnswerDto[]> | undefined | null,
  editingSectionId: string | null,
  editedInsurance?: Record<string, Record<string, string | number | boolean>>,
  onInsuranceChange?: (
    insuranceId: string,
    questionId: string,
    value: string | number | boolean
  ) => void,
  onEditSection?: (section: string) => void,
  onSaveSection?: () => void,
  onCancelSection?: () => void,
  saving?: boolean,
  questionMap?: Map<number, QuestionDefinition>
) => {
  if (!insurance || Object.keys(insurance).length === 0) return null;

  return (
    <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
      <h3 className="mb-3 text-lg font-semibold text-[var(--arn-txt)]">
        Insurance Planning
      </h3>
      <div className="space-y-4">
        {Object.entries(insurance).map(([insuranceId, items]) => {
          const isEditingThis = editingSectionId === `insurance_${insuranceId}`;
          const editKey = `insurance_${insuranceId}`;
          const displayItems = isEditingThis
            ? items.filter(isEditableQuestion).map((item) => ({
                ...item,
                ...(hasPredefinedOptions(item.questionId || 0, questionMap!)
                  ? {
                      option:
                        editedInsurance?.[editKey]?.[String(item.questionId)]?.toString() ??
                        item.option,
                    }
                  : {
                      value:
                        editedInsurance?.[editKey]?.[String(item.questionId)] ??
                        item.value,
                    }),
              }))
            : items.map((item) => {
                if (questionMap && item.option) {
                  return {
                    ...item,
                    value: getOptionLabel(
                      item.questionId || 0,
                      String(item.option),
                      questionMap
                    ),
                  };
                }
                return item;
              });

          return (
            <div
              key={insuranceId}
              className="rounded-lg border border-[var(--arn-bdr)] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-medium text-[var(--arn-txt)]">
                  {insuranceId.replace(/([a-z])([0-9])/g, "$1 $2")}
                </h4>
                {!isEditingThis ? (
                  <button
                    type="button"
                    onClick={() => onEditSection?.(`insurance_${insuranceId}`)}
                    className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
                  >
                    Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onCancelSection}
                      className="text-sm font-semibold text-[var(--arn-txt-2)] hover:underline"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={onSaveSection}
                      disabled={saving}
                      className="text-sm font-semibold text-green-600 hover:underline disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {displayItems.map((item, index) => (
                  <div key={`${item.questionId || "q"}-${index}`} className="text-sm">
                    <span className="text-[var(--arn-txt-2)]">
                      {item.question || `Q${item.questionId}`}:
                    </span>
                    {isEditingThis && isEditableQuestion(item) ? (
                      hasPredefinedOptions(item.questionId || 0, questionMap!) ? (
                        <EditableDropdown
                          value={item.option || ""}
                          options={getQuestionOptions(item.questionId || 0, questionMap!)}
                          onChange={(val) =>
                            onInsuranceChange?.(insuranceId, String(item.questionId), val)
                          }
                        />
                      ) : typeof item.value === "boolean" ? (
                        <EditableBoolean
                          value={item.value}
                          onChange={(val) =>
                            onInsuranceChange?.(insuranceId, String(item.questionId), val)
                          }
                        />
                      ) : (
                        <EditableInput
                          value={typeof item.value === "boolean" ? "" : item.value ?? ""}
                          onChange={(val) =>
                            onInsuranceChange?.(insuranceId, String(item.questionId), val)
                          }
                          type={typeof item.value === "number" ? "number" : "text"}
                        />
                      )
                    ) : (
                      <span className="ml-2 text-[var(--arn-txt)]">
                        {(item.value ??
                          (item.option
                            ? getOptionLabel(
                                item.questionId || 0,
                                String(item.option),
                                questionMap!
                              )
                            : undefined)) ?? "-"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const renderPrimitiveValue = (key: string, value: unknown) => {
  if (typeof value === "boolean") {
    return (
      <span
        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          value ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
        }`}
      >
        {value ? "Yes" : "No"}
      </span>
    );
  }

  if (typeof value === "number" && key.toLowerCase().includes("score")) {
    const color =
      value >= 80
        ? "bg-green-100 text-green-700"
        : value >= 60
          ? "bg-yellow-100 text-yellow-700"
          : "bg-red-100 text-red-700";
    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
        {value}
      </span>
    );
  }

  return <span className="text-sm font-medium text-[var(--arn-txt)]">{String(value)}</span>;
};

const JsonField = ({
  label,
  value,
  depth = 0,
}: {
  label: string;
  value: unknown;
  depth?: number;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isPrimitive =
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean";

  if (isPrimitive) {
    return (
      <div className="flex items-start justify-between gap-4 py-2">
        <div className="text-sm font-medium text-[var(--arn-txt-2)]">
          {label.replace(/([A-Z])/g, " $1").trim()}
        </div>
        <div className="text-right">{renderPrimitiveValue(label, value)}</div>
      </div>
    );
  }

  const isArray = Array.isArray(value);

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-[var(--arn-txt-2)]">
            {label.replace(/([A-Z])/g, " $1").trim()}
          </span>
          {typeof (value as Record<string, unknown>)?.overallScore === "number" && (
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                (value as { overallScore: number }).overallScore >= 80
                  ? "bg-green-100 text-green-700"
                  : (value as { overallScore: number }).overallScore >= 60
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {(value as { overallScore: number }).overallScore}/100
            </span>
          )}
        </div>
        <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="ml-6 mt-2 border-l border-[var(--arn-bdr)] pl-4">
          {isArray
            ? value.map((item: unknown, index: number) => (
                <JsonField
                  key={index}
                  label={`Item ${index + 1}`}
                  value={item}
                  depth={depth + 1}
                />
              ))
            : Object.entries(value as Record<string, unknown>).map(
                ([childKey, childValue]) => (
                  <JsonField
                    key={childKey}
                    label={childKey}
                    value={childValue}
                    depth={depth + 1}
                  />
                )
              )}
        </div>
      )}
    </div>
  );
};

const JsonSection = ({ title, data }: { title: string; data: unknown }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!data || typeof data !== "object") return null;

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between py-2 text-left"
      >
        <div className="flex items-center gap-2">
          <h4 className="text-base font-semibold text-[var(--arn-txt)]">{title}</h4>
          {typeof (data as { overallScore?: number }).overallScore === "number" && (
            <span
              className={`rounded-full px-3 py-1 text-sm font-semibold ${
                (data as { overallScore: number }).overallScore >= 80
                  ? "bg-green-100 text-green-700"
                  : (data as { overallScore: number }).overallScore >= 60
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
              }`}
            >
              {(data as { overallScore: number }).overallScore}/100
            </span>
          )}
        </div>
        <span className={`transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="rounded-2xl border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5">
          <div className="space-y-4">
            {Object.entries(data as Record<string, unknown>).map(([key, value]) => (
              <JsonField key={key} label={key} value={value} depth={0} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default function ArnClientPlanDataTab({
  financialPlan,
  userId,
  questions,
  onRefresh,
}: ArnClientPlanDataTabProps) {
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<
    Record<string, Record<string, string | number | boolean>>
  >({});
  const [saving, setSaving] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const questionMap = useQuestionMap(questions);

  const handleItemChange = useCallback(
    (questionId: string, value: string | number | boolean) => {
      if (!editingSection) return;
      setEditedValues((prev) => ({
        ...prev,
        [editingSection]: {
          ...prev[editingSection],
          [questionId]: value,
        },
      }));
    },
    [editingSection]
  );

  const handleGoalChange = useCallback(
    (goalId: string, questionId: string, value: string | number | boolean) => {
      setEditedValues((prev) => ({
        ...prev,
        [`goals_${goalId}`]: {
          ...prev[`goals_${goalId}`],
          [questionId]: value,
        },
      }));
    },
    []
  );

  const handleInsuranceChange = useCallback(
    (insuranceId: string, questionId: string, value: string | number | boolean) => {
      setEditedValues((prev) => ({
        ...prev,
        [`insurance_${insuranceId}`]: {
          ...prev[`insurance_${insuranceId}`],
          [questionId]: value,
        },
      }));
    },
    []
  );

  const handleAssetChange = useCallback(
    (assetId: string, questionId: string, value: string | number | boolean) => {
      setEditedValues((prev) => ({
        ...prev,
        [`assets_${assetId}`]: {
          ...prev[`assets_${assetId}`],
          [questionId]: value,
        },
      }));
    },
    []
  );

  const startEditing = (section: string) => {
    setEditingSection(section);
    setEditedValues({});
    setActionError(null);
    setActionSuccess(null);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditedValues({});
  };

  const handleSave = async () => {
    if (!userId || !editingSection || !financialPlan) return;

    setSaving(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      if (editingSection === "personalDetails") {
        const editableItems = asArray(financialPlan.personalDetails).filter(
          isEditableQuestion
        );
        const data = editableItems.map((item) => ({
          ...item,
          ...(hasPredefinedOptions(item.questionId || 0, questionMap)
            ? {
                option:
                  editedValues.personalDetails?.[String(item.questionId)]?.toString() ??
                  item.option,
              }
            : {
                value:
                  editedValues.personalDetails?.[String(item.questionId)] ?? item.value,
              }),
        }));
        await updatePersonalDetailsForUser(userId, data);
      } else if (editingSection === "budgeting") {
        const editableItems = asArray(financialPlan.budgeting).filter(isEditableQuestion);
        const data = editableItems.map((item) => ({
          ...item,
          ...(hasPredefinedOptions(item.questionId || 0, questionMap)
            ? {
                option:
                  editedValues.budgeting?.[String(item.questionId)]?.toString() ??
                  item.option,
              }
            : {
                value: editedValues.budgeting?.[String(item.questionId)] ?? item.value,
              }),
        }));
        await updateBudgetingForUser(userId, data);
      } else if (editingSection.startsWith("goals_")) {
        const goalId = editingSection.replace("goals_", "");
        const items = asRecord(financialPlan.financialGoals)?.[goalId] || [];
        const data = items.filter(isEditableQuestion).map((item) => ({
          ...item,
          ...(hasPredefinedOptions(item.questionId || 0, questionMap)
            ? {
                option:
                  editedValues[editingSection]?.[String(item.questionId)]?.toString() ??
                  item.option,
              }
            : {
                value:
                  editedValues[editingSection]?.[String(item.questionId)] ?? item.value,
              }),
          goalId,
        }));
        await updateFinancialGoalsForUser(userId, data);
      } else if (editingSection.startsWith("insurance_")) {
        const insuranceId = editingSection.replace("insurance_", "");
        const items = asRecord(financialPlan.insurancePlanning)?.[insuranceId] || [];
        const data = items.filter(isEditableQuestion).map((item) => ({
          ...item,
          ...(hasPredefinedOptions(item.questionId || 0, questionMap)
            ? {
                option:
                  editedValues[editingSection]?.[String(item.questionId)]?.toString() ??
                  item.option,
              }
            : {
                value:
                  editedValues[editingSection]?.[String(item.questionId)] ?? item.value,
              }),
          goalId: insuranceId,
        }));
        await updateInsurancePlanningForUser(userId, data);
      } else if (editingSection.startsWith("assets_")) {
        const assetId = editingSection.replace("assets_", "");
        const items = asRecord(financialPlan.assetsLiabilities)?.[assetId] || [];
        const data = items.filter(isEditableQuestion).map((item) => ({
          ...item,
          ...(hasPredefinedOptions(item.questionId || 0, questionMap)
            ? {
                option:
                  editedValues[editingSection]?.[String(item.questionId)]?.toString() ??
                  item.option,
              }
            : {
                value:
                  editedValues[editingSection]?.[String(item.questionId)] ?? item.value,
              }),
          goalId: assetId,
        }));
        await updateAssetsLiabilitiesForUser(userId, data);
      }

      setEditingSection(null);
      setEditedValues({});
      setActionSuccess("Saved successfully");
      await onRefresh?.();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!userId) return;
    setGeneratingPdf(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      await recalculateWealthScoreForPartner(userId);
      setActionSuccess("Wealth score recalculated and PDF regenerated");
      await onRefresh?.();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to recalculate wealth score"
      );
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownload = async () => {
    if (!userId) return;
    setDownloading(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const blob = await downloadFinancialPlanForUser(userId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "financial-plan.pdf";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setActionSuccess("Plan downloaded");
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to download financial plan"
      );
    } finally {
      setDownloading(false);
    }
  };

  if (!financialPlan) {
    return (
      <div className="p-4">
        <p className="text-sm text-[var(--arn-txt-2)]">No Financial Plan Data Available</p>
      </div>
    );
  }

  const personalDetails = asArray(financialPlan.personalDetails);
  const budgeting = asArray(financialPlan.budgeting);
  const financialGoals = asRecord(financialPlan.financialGoals);
  const assetsLiabilities = asRecord(financialPlan.assetsLiabilities);
  const insurancePlanning = asRecord(financialPlan.insurancePlanning);

  return (
    <div className="space-y-6 p-1 pt-4 sm:p-2">
      {(actionError || actionSuccess) && (
        <div
          className={`rounded-lg px-3 py-2 text-sm ${
            actionError
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {actionError || actionSuccess}
        </div>
      )}

      {personalDetails.length > 0 && (
        <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--arn-txt)]">Personal Details</h3>
            {editingSection === "personalDetails" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-sm font-semibold text-[var(--arn-txt-2)] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-semibold text-green-600 hover:underline disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEditing("personalDetails")}
                className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {renderQuestionnaireSection(
            personalDetails,
            questionMap,
            editingSection === "personalDetails",
            editedValues.personalDetails,
            handleItemChange
          )}
        </div>
      )}

      {financialGoals &&
        renderGoalsSection(
          financialGoals,
          editingSection,
          editedValues,
          handleGoalChange,
          startEditing,
          handleSave,
          cancelEditing,
          saving,
          questionMap
        )}

      {budgeting.length > 0 && (
        <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--arn-txt)]">Budgeting</h3>
            {editingSection === "budgeting" ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={cancelEditing}
                  className="text-sm font-semibold text-[var(--arn-txt-2)] hover:underline"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="text-sm font-semibold text-green-600 hover:underline disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => startEditing("budgeting")}
                className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
              >
                Edit
              </button>
            )}
          </div>
          {renderQuestionnaireSection(
            budgeting,
            questionMap,
            editingSection === "budgeting",
            editedValues.budgeting,
            handleItemChange
          )}
        </div>
      )}

      {assetsLiabilities && Object.keys(assetsLiabilities).length > 0 && (
        <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
          <h3 className="mb-3 text-lg font-semibold text-[var(--arn-txt)]">
            Assets & Liabilities
          </h3>
          <div className="space-y-4">
            {Object.entries(assetsLiabilities).map(([assetId, items]) => {
              const isEditingThis = editingSection === `assets_${assetId}`;
              const displayItems = isEditingThis
                ? items.filter(isEditableQuestion).map((item) => ({
                    ...item,
                    ...(hasPredefinedOptions(item.questionId || 0, questionMap)
                      ? {
                          option:
                            editedValues[`assets_${assetId}`]?.[
                              String(item.questionId)
                            ]?.toString() ?? item.option,
                        }
                      : {
                          value:
                            editedValues[`assets_${assetId}`]?.[
                              String(item.questionId)
                            ] ?? item.value,
                        }),
                  }))
                : items.map((item) => {
                    if (questionMap && item.option) {
                      return {
                        ...item,
                        value: getOptionLabel(
                          item.questionId || 0,
                          String(item.option),
                          questionMap
                        ),
                      };
                    }
                    return item;
                  });

              return (
                <div
                  key={assetId}
                  className="rounded-lg border border-[var(--arn-bdr)] p-4"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <h4 className="font-medium text-[var(--arn-txt)]">
                      {assetId.replace(/([a-z])([0-9])/g, "$1 $2")}
                    </h4>
                    {!isEditingThis ? (
                      <button
                        type="button"
                        onClick={() => startEditing(`assets_${assetId}`)}
                        className="text-sm font-semibold text-[var(--arn-amber)] hover:underline"
                      >
                        Edit
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="text-sm font-semibold text-[var(--arn-txt-2)] hover:underline"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saving}
                          className="text-sm font-semibold text-green-600 hover:underline disabled:opacity-50"
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {displayItems.map((item, index) => (
                      <div key={`${item.questionId || "q"}-${index}`} className="text-sm">
                        <span className="text-[var(--arn-txt-2)]">
                          {item.question || `Q${item.questionId}`}:
                        </span>
                        {isEditingThis && isEditableQuestion(item) ? (
                          hasPredefinedOptions(item.questionId || 0, questionMap) ? (
                            <EditableDropdown
                              value={item.option || ""}
                              options={getQuestionOptions(item.questionId || 0, questionMap)}
                              onChange={(val) =>
                                handleAssetChange(assetId, String(item.questionId), val)
                              }
                            />
                          ) : typeof item.value === "boolean" ? (
                            <EditableBoolean
                              value={
                                (editedValues[`assets_${assetId}`]?.[
                                  String(item.questionId)
                                ] as boolean | undefined) ?? item.value
                              }
                              onChange={(val) =>
                                handleAssetChange(assetId, String(item.questionId), val)
                              }
                            />
                          ) : (
                            <EditableInput
                              type={typeof item.value === "number" ? "number" : "text"}
                              value={String(
                                editedValues[`assets_${assetId}`]?.[
                                  String(item.questionId)
                                ] ??
                                  item.value ??
                                  ""
                              )}
                              onChange={(val) =>
                                handleAssetChange(assetId, String(item.questionId), val)
                              }
                            />
                          )
                        ) : (
                          <span className="ml-2 text-[var(--arn-txt)]">
                            {(item.value ??
                              (item.option
                                ? getOptionLabel(
                                    item.questionId || 0,
                                    String(item.option),
                                    questionMap
                                  )
                                : undefined)) ?? "-"}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {insurancePlanning &&
        renderInsuranceSection(
          insurancePlanning,
          editingSection,
          editedValues,
          handleInsuranceChange,
          startEditing,
          handleSave,
          cancelEditing,
          saving,
          questionMap
        )}

      <div className="mb-6 rounded-[12px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-lg font-semibold text-[var(--arn-txt)]">Actions</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="rounded-md border border-[var(--arn-bdr)] px-4 py-2 text-sm font-semibold text-[var(--arn-txt)] hover:bg-[var(--arn-bg-2)] disabled:opacity-50"
            >
              {downloading ? "Downloading..." : "Download Plan"}
            </button>
            <button
              type="button"
              onClick={handleRecalculate}
              disabled={generatingPdf}
              className="rounded-md bg-[var(--arn-amber)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {generatingPdf ? "Generating..." : "Generate Wealth Score PDF"}
            </button>
          </div>
        </div>
        {financialPlan.planPdf && (
          <a
            href={financialPlan.planPdf}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-3 inline-block text-sm font-semibold text-[var(--arn-amber)] underline hover:opacity-80"
          >
            View PDF
          </a>
        )}
        {financialPlan.wealthScore && (
          <JsonSection title="Wealth Score" data={financialPlan.wealthScore} />
        )}
      </div>
    </div>
  );
}
