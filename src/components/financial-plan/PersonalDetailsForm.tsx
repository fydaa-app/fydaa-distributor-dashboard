"use client";

import { useState } from "react";
import type { QuestionAnswerDto } from "@/services/financialPlanService";

interface ChildDetail {
  name: string;
  age: string;
}

interface PersonalDetailsFormProps {
  onBack: () => void;
  onSubmit: (answers: QuestionAnswerDto[]) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
}

const YES_NO_OPTIONS = [
  { value: "1", label: "Yes" },
  { value: "2", label: "No" },
] as const;

const KIDS_EDUCATION_OPTIONS = [
  { value: "4", label: "Colleges in India - 10L" },
  { value: "1", label: "Reputed College in India - 20L" },
  { value: "2", label: "Premier College in India - 50L" },
  { value: "3", label: "Premier College Abroad - 1 Cr" },
] as const;

const CHILDREN_COUNT_OPTIONS = [1, 2, 3, 4] as const;

function emptyChild(): ChildDetail {
  return { name: "", age: "" };
}

function resizeChildren(current: ChildDetail[], count: number): ChildDetail[] {
  if (count <= 0) return [];
  if (current.length === count) return current;
  if (current.length > count) return current.slice(0, count);
  return [
    ...current,
    ...Array.from({ length: count - current.length }, () => emptyChild()),
  ];
}

export default function PersonalDetailsForm({
  onBack,
  onSubmit,
  isSubmitting,
  error,
}: PersonalDetailsFormProps) {
  const [fullName, setFullName] = useState("");
  const [age, setAge] = useState("");
  const [married, setMarried] = useState("");
  const [supportParents, setSupportParents] = useState("");
  const [hasChildren, setHasChildren] = useState("");
  const [kidsEducation, setKidsEducation] = useState("");
  const [numberOfChildren, setNumberOfChildren] = useState("");
  const [children, setChildren] = useState<ChildDetail[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isMarried = married === "1";
  const showHasChildren = isMarried;
  const showChildrenDetails = isMarried && hasChildren === "1";

  const handleMarriedChange = (value: string) => {
    setMarried(value);
    setValidationError(null);
    if (value !== "1") {
      setHasChildren("");
      setKidsEducation("");
      setNumberOfChildren("");
      setChildren([]);
    }
  };

  const handleHasChildrenChange = (value: string) => {
    setHasChildren(value);
    setValidationError(null);
    if (value !== "1") {
      setKidsEducation("");
      setNumberOfChildren("");
      setChildren([]);
    }
  };

  const handleNumberOfChildrenChange = (value: string) => {
    setNumberOfChildren(value);
    setValidationError(null);
    const count = Number(value);
    if (!Number.isInteger(count) || count < 1) {
      setChildren([]);
      return;
    }
    setChildren((prev) => resizeChildren(prev, count));
  };

  const updateChild = (index: number, field: keyof ChildDetail, value: string) => {
    setValidationError(null);
    setChildren((prev) =>
      prev.map((child, i) => (i === index ? { ...child, [field]: value } : child))
    );
  };

  const validate = (): string | null => {
    if (!fullName.trim()) return "Please enter full name.";

    const ageNum = Number(age);
    if (!age.trim() || !Number.isInteger(ageNum) || ageNum < 1 || ageNum > 70) {
      return "Age must be a number between 1 and 70.";
    }

    if (!married) return "Please select marital status.";
    if (!supportParents) return "Please select whether parents are supported financially.";

    if (isMarried) {
      if (!hasChildren) return "Please select whether there are children.";
    }

    if (showChildrenDetails) {
      if (!kidsEducation) return "Please select kids education preference.";

      const childCount = Number(numberOfChildren);
      if (
        !numberOfChildren ||
        !Number.isInteger(childCount) ||
        childCount < 1 ||
        childCount > 4
      ) {
        return "Please select number of children (1–4).";
      }

      if (children.length !== childCount) {
        return "Please complete details for each child.";
      }

      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (!child.name.trim()) return `Please enter name for child ${i + 1}.`;
        const childAge = Number(child.age);
        if (
          !child.age.trim() ||
          !Number.isInteger(childAge) ||
          childAge < 1 ||
          childAge > 16
        ) {
          return `Child ${i + 1} age must be a number between 1 and 16.`;
        }
      }
    }

    return null;
  };

  const buildAnswers = (): QuestionAnswerDto[] => {
    const answers: QuestionAnswerDto[] = [
      { questionId: 1, value: fullName.trim() },
      { questionId: 2, value: Number(age) },
      { questionId: 3, option: married },
      { questionId: 4, option: supportParents },
    ];

    if (isMarried) {
      answers.push({ questionId: 5, option: hasChildren });
    }

    if (showChildrenDetails) {
      answers.push({ questionId: 6, option: kidsEducation });
      answers.push({ questionId: 7, value: Number(numberOfChildren) });

      for (const child of children) {
        answers.push({
          value: Number(child.age),
          question: child.name.trim(),
        });
      }
    }

    return answers;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setValidationError(err);
      return;
    }

    setValidationError(null);
    await onSubmit(buildAnswers());
  };

  const displayError = validationError || error;

  return (
    <div className="step-panel">
      <div className="flex justify-center mb-5">
        <div className="back-btn" onClick={onBack} role="button" tabIndex={0}>
          <i className="ti ti-arrow-left" aria-hidden="true" />
        </div>
      </div>

      <div className="text-center">
        <p className="step-eyebrow">Financial Plan</p>
        <h2 className="step-title">Personal Details</h2>
        <p className="step-helper">Answer a few questions to continue the financial plan.</p>
      </div>

      <div className="field-group">
        <label className="field-label">
          What&apos;s Your Full Name? <span className="req">Required</span>
        </label>
        <input
          className="field-input"
          placeholder="Enter full name"
          value={fullName}
          onChange={(e) => {
            setValidationError(null);
            setFullName(e.target.value);
          }}
        />
      </div>

      <div className="field-group">
        <label className="field-label">
          How Old Are You? <span className="req">Required</span>
        </label>
        <input
          className="field-input"
          placeholder="Enter age"
          inputMode="numeric"
          maxLength={2}
          value={age}
          onChange={(e) => {
            setValidationError(null);
            setAge(e.target.value.replace(/\D/g, "").slice(0, 2));
          }}
        />
      </div>

      <div className="field-group">
        <label className="field-label">
          Are You Married? <span className="req">Required</span>
        </label>
        <div className="answer-grid">
          {YES_NO_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              role="button"
              tabIndex={0}
              onClick={() => handleMarriedChange(opt.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleMarriedChange(opt.value);
                }
              }}
              className={`answer-card ${married === opt.value ? "selected" : ""}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">
          Do You Support Your Parents Financially? <span className="req">Required</span>
        </label>
        <div className="answer-grid">
          {YES_NO_OPTIONS.map((opt) => (
            <div
              key={opt.value}
              role="button"
              tabIndex={0}
              onClick={() => {
                setValidationError(null);
                setSupportParents(opt.value);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setValidationError(null);
                  setSupportParents(opt.value);
                }
              }}
              className={`answer-card ${supportParents === opt.value ? "selected" : ""}`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      {showHasChildren && (
        <div className="field-group">
          <label className="field-label">
            Do You Have Children? <span className="req">Required</span>
          </label>
          <p className="step-helper" style={{ marginBottom: 12, textAlign: "left" }}>
            Below 16 years?
          </p>
          <div className="answer-grid">
            {YES_NO_OPTIONS.map((opt) => (
              <div
                key={opt.value}
                role="button"
                tabIndex={0}
                onClick={() => handleHasChildrenChange(opt.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleHasChildrenChange(opt.value);
                  }
                }}
                className={`answer-card ${hasChildren === opt.value ? "selected" : ""}`}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}

      {showChildrenDetails && (
        <>
          <div className="field-group">
            <label className="field-label">
              Where Do You See Your Kids Studying, In India Or Abroad?{" "}
              <span className="req">Required</span>
            </label>
            <div className="answer-grid">
              {KIDS_EDUCATION_OPTIONS.map((opt) => (
                <div
                  key={opt.value}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setValidationError(null);
                    setKidsEducation(opt.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setValidationError(null);
                      setKidsEducation(opt.value);
                    }
                  }}
                  className={`answer-card ${kidsEducation === opt.value ? "selected" : ""}`}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          <div className="field-group">
            <label className="field-label">
              How Many Children Do You Have? <span className="req">Required</span>
            </label>
            <select
              className="field-select"
              value={numberOfChildren}
              onChange={(e) => handleNumberOfChildrenChange(e.target.value)}
            >
              <option value="">Select number of children</option>
              {CHILDREN_COUNT_OPTIONS.map((count) => (
                <option key={count} value={String(count)}>
                  {count}
                </option>
              ))}
            </select>
          </div>

          {children.map((child, index) => (
            <div key={index} className="field-group">
              <div className="onboard-section-label" style={{ marginBottom: 12 }}>
                Child {index + 1}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="field-label">
                    Child {index + 1} Name <span className="req">Required</span>
                  </label>
                  <input
                    className="field-input"
                    placeholder="Enter child name"
                    value={child.name}
                    onChange={(e) => updateChild(index, "name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="field-label">
                    Child {index + 1} Age <span className="req">Required</span>
                  </label>
                  <input
                    className="field-input"
                    placeholder="Age (1–16)"
                    inputMode="numeric"
                    maxLength={2}
                    value={child.age}
                    onChange={(e) =>
                      updateChild(index, "age", e.target.value.replace(/\D/g, "").slice(0, 2))
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {displayError && (
        <div className="field-error">
          <i className="ti ti-alert-circle" aria-hidden="true" />
          {displayError}
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isSubmitting}
        className="btn-primary btn-wide"
      >
        {isSubmitting ? "Submitting..." : "Continue"}{" "}
        {!isSubmitting && <i className="ti ti-arrow-right" aria-hidden="true" />}
      </button>
    </div>
  );
}
