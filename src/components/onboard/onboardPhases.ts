export type OnboardPhase =
  | "mobile"
  | "otp"
  | "stageRetry"
  | "risk"
  | "riskScore"
  | "email"
  | "emailOtp"
  | "kyc"
  | "kycCompliant"
  | "identity"
  | "nonCompliantQuestions"
  | "digilocker"
  | "signature"
  | "nsdlEsign"
  | "modifyKyc"
  | "bank"
  | "nominee"
  | "welcome";

export const INCOME_SLAB_OPTIONS = [
  { value: "upto_1lakh", label: "Up to ₹1 Lakh" },
  { value: "above_1lakh_upto_5lakh", label: "Above ₹1 Lakh – ₹5 Lakh" },
  { value: "above_5lakh_upto_10lakh", label: "Above ₹5 Lakh – ₹10 Lakh" },
  { value: "above_10lakh_upto_25lakh", label: "Above ₹10 Lakh – ₹25 Lakh" },
  { value: "above_25lakh_upto_1cr", label: "Above ₹25 Lakh – ₹1 Cr" },
  { value: "above_1cr", label: "Above ₹1 Cr" },
] as const;

export const SOURCE_OF_WEALTH_OPTIONS = [
  { value: "salary", label: "Salary" },
  { value: "business", label: "Business" },
  { value: "gift", label: "Gift" },
  { value: "ancestral_property", label: "Ancestral Property" },
  { value: "rental_income", label: "Rental Income" },
  { value: "prize_money", label: "Prize Money" },
  { value: "royalty", label: "Royalty" },
  { value: "others", label: "Others" },
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const MARITAL_OPTIONS = [
  { value: "unmarried", label: "Unmarried" },
  { value: "married", label: "Married" },
] as const;

export const COMPLIANT_OCCUPATION_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "private_sector", label: "Private Sector" },
  { value: "professional", label: "Professional" },
  { value: "retired", label: "Retired" },
  { value: "housewife", label: "Housewife" },
  { value: "student", label: "Student" },
  { value: "public_sector", label: "Public Sector" },
  { value: "government_sector", label: "Government Sector" },
  { value: "others", label: "Others" },
] as const;

export const NON_COMPLIANT_OCCUPATION_OPTIONS = [
  { value: "business", label: "Business" },
  { value: "professional", label: "Professional" },
  { value: "retired", label: "Retired" },
  { value: "housewife", label: "Housewife" },
  { value: "student", label: "Student" },
  { value: "public_sector", label: "Public Sector" },
  { value: "private_sector", label: "Private Sector" },
  { value: "government_sector", label: "Government Sector" },
  { value: "others", label: "Others" },
] as const;

export const MODIFY_OCCUPATION_OPTIONS = [
  { value: "private_sector_service", label: "Private Sector" },
  { value: "government_service", label: "Government Service" },
  { value: "business", label: "Business" },
  { value: "professional", label: "Professional" },
  { value: "retired", label: "Retired" },
  { value: "student", label: "Student" },
  { value: "others", label: "Others" },
] as const;
