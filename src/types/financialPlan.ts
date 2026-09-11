export interface FinancialPlanQuestion {
  questionId: number;
  label: string;
  type: "radio" | "select" | "text" | "number" | "textarea";
  options?: Array<{ value: string; label: string }>;
  required: boolean;
  placeholder?: string;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
}

export interface FinancialPlanSection {
  id: 1 | 2 | 3 | 4 | 5;
  title: string;
  description?: string;
  fields: FinancialPlanQuestion[];
}

export interface FinancialPlanSubmitRequest {
  personalDetails: Array<{
    questionId: number;
    option?: string;
    value?: string;
  }>;
}

export interface FinancialPlanSubmitResponse {
  success: boolean;
  message?: string;
  data?: Record<string, unknown>;
  planId?: string;
}

export interface FinancialPlanQuestionsResponse {
  sections: FinancialPlanSection[];
}

export const FINANCIAL_PLAN_SECTIONS: FinancialPlanSection[] = [
  {
    id: 1,
    title: "Personal Details",
    description: "Basic information about you and your family",
    fields: [
      {
        questionId: 1,
        label: "Full Name",
        type: "text",
        required: true,
        placeholder: "Enter your full name",
      },
      {
        questionId: 2,
        label: "Date of Birth",
        type: "text",
        required: true,
        placeholder: "DD/MM/YYYY",
        validation: { pattern: "^\\d{2}/\\d{2}/\\d{4}$" },
      },
      {
        questionId: 3,
        label: "Gender",
        type: "radio",
        required: true,
        options: [
          { value: "male", label: "Male" },
          { value: "female", label: "Female" },
          { value: "others", label: "Others" },
        ],
      },
      {
        questionId: 4,
        label: "Marital Status",
        type: "radio",
        required: true,
        options: [
          { value: "single", label: "Single" },
          { value: "married", label: "Married" },
        ],
      },
      {
        questionId: 5,
        label: "Number of Dependents",
        type: "number",
        required: true,
        placeholder: "0",
        validation: { min: 0, max: 10 },
      },
      {
        questionId: 6,
        label: "Occupation",
        type: "select",
        required: true,
        options: [
          { value: "salaried", label: "Salaried" },
          { value: "self_employed", label: "Self Employed" },
          { value: "business", label: "Business" },
          { value: "professional", label: "Professional" },
          { value: "retired", label: "Retired" },
          { value: "student", label: "Student" },
          { value: "homemaker", label: "Homemaker" },
          { value: "others", label: "Others" },
        ],
      },
      {
        questionId: 7,
        label: "Annual Income (₹)",
        type: "number",
        required: true,
        placeholder: "Enter annual income",
        validation: { min: 0 },
      },
      {
        questionId: 8,
        label: "PAN Number",
        type: "text",
        required: true,
        placeholder: "ABCDE1234F",
        validation: { pattern: "^[A-Z]{5}[0-9]{4}[A-Z]$" },
      },
    ],
  },
  {
    id: 2,
    title: "Financial Goals",
    description: "What are you planning for?",
    fields: [
      {
        questionId: 10,
        label: "Primary Financial Goal",
        type: "radio",
        required: true,
        options: [
          { value: "retirement", label: "Retirement Planning" },
          { value: "child_education", label: "Child Education" },
          { value: "home_purchase", label: "Home Purchase" },
          { value: "wealth_creation", label: "Wealth Creation" },
          { value: "tax_saving", label: "Tax Saving" },
          { value: "emergency_fund", label: "Emergency Fund" },
        ],
      },
      {
        questionId: 11,
        label: "Goal Time Horizon (Years)",
        type: "number",
        required: true,
        placeholder: "10",
        validation: { min: 1, max: 40 },
      },
      {
        questionId: 12,
        label: "Target Amount (₹)",
        type: "number",
        required: true,
        placeholder: "Enter target amount",
        validation: { min: 1000 },
      },
      {
        questionId: 13,
        label: "Current Savings for This Goal (₹)",
        type: "number",
        required: false,
        placeholder: "0",
        validation: { min: 0 },
      },
      {
        questionId: 14,
        label: "Monthly Investment Capacity (₹)",
        type: "number",
        required: true,
        placeholder: "Enter monthly amount",
        validation: { min: 500 },
      },
    ],
  },
  {
    id: 3,
    title: "Risk Profile",
    description: "Understanding your risk tolerance",
    fields: [
      {
        questionId: 20,
        label: "How would you describe your investment knowledge?",
        type: "radio",
        required: true,
        options: [
          { value: "beginner", label: "Beginner - Limited knowledge" },
          { value: "intermediate", label: "Intermediate - Some experience" },
          { value: "advanced", label: "Advanced - Experienced investor" },
        ],
      },
      {
        questionId: 21,
        label: "How would you react if your portfolio dropped 20% in a month?",
        type: "radio",
        required: true,
        options: [
          { value: "panic_sell", label: "Sell immediately to avoid further losses" },
          { value: "wait", label: "Wait and see what happens" },
          { value: "buy_more", label: "Buy more at lower prices" },
        ],
      },
      {
        questionId: 22,
        label: "What is your investment time horizon?",
        type: "radio",
        required: true,
        options: [
          { value: "short", label: "Less than 3 years" },
          { value: "medium", label: "3 to 7 years" },
          { value: "long", label: "More than 7 years" },
        ],
      },
      {
        questionId: 23,
        label: "What percentage of your portfolio are you comfortable allocating to equities?",
        type: "radio",
        required: true,
        options: [
          { value: "low", label: "0-30% (Conservative)" },
          { value: "medium", label: "30-60% (Moderate)" },
          { value: "high", label: "60-100% (Aggressive)" },
        ],
      },
      {
        questionId: 24,
        label: "Do you have an emergency fund covering 6 months of expenses?",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "partial", label: "Partially" },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Investment Plan",
    description: "Your personalized investment strategy",
    fields: [
      {
        questionId: 30,
        label: "Preferred Investment Approach",
        type: "radio",
        required: true,
        options: [
          { value: "lumpsum", label: "Lumpsum Investment" },
          { value: "sip", label: "Systematic Investment Plan (SIP)" },
          { value: "both", label: "Combination of Both" },
        ],
      },
      {
        questionId: 31,
        label: "Asset Allocation Preference",
        type: "radio",
        required: true,
        options: [
          { value: "equity_focused", label: "Equity Focused (70%+ Equity)" },
          { value: "balanced", label: "Balanced (50-70% Equity)" },
          { value: "debt_focused", label: "Debt Focused (<50% Equity)" },
        ],
      },
      {
        questionId: 32,
        label: "Preferred Fund Categories",
        type: "select",
        required: true,
        options: [
          { value: "large_cap", label: "Large Cap" },
          { value: "flexi_cap", label: "Flexi Cap" },
          { value: "mid_cap", label: "Mid Cap" },
          { value: "small_cap", label: "Small Cap" },
          { value: "hybrid", label: "Hybrid/Balanced" },
          { value: "debt", label: "Debt Funds" },
        ],
      },
      {
        questionId: 33,
        label: "Investment Platform Preference",
        type: "radio",
        required: true,
        options: [
          { value: "direct", label: "Direct Mutual Funds" },
          { value: "regular", label: "Regular Mutual Funds" },
        ],
      },
      {
        questionId: 34,
        label: "Tax Saving Requirement (80C)",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes, need ELSS for tax saving" },
          { value: "no", label: "No tax saving needed" },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "Summary & Submit",
    description: "Review and submit your financial plan",
    fields: [
      {
        questionId: 40,
        label: "Email for Plan Delivery",
        type: "text",
        required: true,
        placeholder: "your@email.com",
        validation: { pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$" },
      },
      {
        questionId: 41,
        label: "Confirm Details",
        type: "radio",
        required: true,
        options: [
          { value: "yes", label: "Yes, all details are correct" },
          { value: "no", label: "No, I need to make changes" },
        ],
      },
    ],
  },
];