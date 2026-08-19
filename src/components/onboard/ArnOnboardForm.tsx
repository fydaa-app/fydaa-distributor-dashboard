"use client";

import { useEffect, useState, useRef } from "react";
import { getCookie, setCookie } from "cookies-next";
import {
  requestArnOtp,
  verifyArnOtp,
  fetchKycData,
  submitKycExtra,
  requestLinkEmail,
  verifyLinkEmail,
  createNominationDetails,
  type RiskProfileQuestion,
  type NomineeRelationship,
  type NomineeAddress,
  type CreateNomineeDto,
  type CreateNominationPayload,
  type UserStage,
} from "@/services/arnOnboardService";
import {
  getClientIp,
  createInvestorProfileAndMfAccount,
  createAndVerifyBankAccount,
  type AccountType,
} from "@/services/arnInvestmentSetupService";

interface ArnOnboardFormProps {
  phase: "mobile" | "otp" | "risk" | "riskScore" | "email" | "emailOtp" | "kyc" | "kycCompliant" | "identity" | "bank" | "nominee" | "welcome";
  mobile: string;
  onMobileChange: (value: string) => void;
  otpValues: string[];
  onOtpChange: (values: string[]) => void;
  onGoToOtp: () => void;
  onGoToMobile: () => void;
  onReset: () => void;
  userStage?: UserStage | null;
  onKycVerified: () => void;
  onGoToIdentity: () => void;
  onGoToKycCompliant: () => void;
  onGoToEmail: () => void;
  onGoToEmailOtp: () => void;
  onEmailVerified: () => void;
  onIdentityVerified: () => void;
  onBankVerified: () => void;
  onGoToWelcome: () => void;
  onGoToBank: () => void;
  onGoToRiskScore: () => void;
  kycError: string | null;
  referredBy: string;
  onOtpVerified: (token: string) => void;
  riskQuestions: RiskProfileQuestion[];
  riskAnswers: Record<number, number>;
  onRiskAnswerChange: (questionId: number, optionIndex: number) => void;
  riskIndex: number;
  onRiskIndexChange: (index: number) => void;
  onSubmitRisk: () => void;
  riskError: string | null;
  isLoadingRisk: boolean;
  isSubmittingRisk: boolean;
  riskScoreData: Record<string, unknown> | null;
  isLoadingScore: boolean;
  scoreError: string | null;
}

function RiskScoreArc({ score }: { score: number }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const halfCircumference = circumference / 2;
  const progressOffset = halfCircumference * (1 - clamped / 100);

  return (
    <svg
      className="risk-gauge-svg"
      width="190"
      height="110"
      viewBox="0 0 190 110"
      aria-hidden="true"
    >
      <g transform="rotate(180 95 95)">
        <circle
          cx="95"
          cy="95"
          r={radius}
          fill="none"
          stroke="rgba(186,117,23,0.18)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${halfCircumference} ${circumference}`}
        />
        <circle
          cx="95"
          cy="95"
          r={radius}
          fill="none"
          stroke="var(--arn-amber)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={`${halfCircumference} ${circumference}`}
          strokeDashoffset={progressOffset}
          style={{
            transition: "stroke-dashoffset 700ms ease",
          }}
        />
      </g>
    </svg>
  );
}

const COUNTRY_CODES = [
  { code: "+1", country: "US", flag: "🇺🇸", label: "United States" },
  { code: "+91", country: "IN", flag: "🇮🇳", label: "India" },
  { code: "+44", country: "GB", flag: "🇬🇧", label: "United Kingdom" },
  { code: "+971", country: "AE", flag: "🇦🇪", label: "United Arab Emirates" },
  { code: "+966", country: "SA", flag: "🇸🇦", label: "Saudi Arabia" },
  { code: "+65", country: "SG", flag: "🇸🇬", label: "Singapore" },
  { code: "+61", country: "AU", flag: "🇦🇺", label: "Australia" },
  { code: "+880", country: "BD", flag: "🇧🇩", label: "Bangladesh" },
  { code: "+92", country: "PK", flag: "🇵🇰", label: "Pakistan" },
  { code: "+94", country: "LK", flag: "🇱🇰", label: "Sri Lanka" },
  { code: "+977", country: "NP", flag: "🇳🇵", label: "Nepal" },
  { code: "+95", country: "MM", flag: "🇲🇲", label: "Myanmar" },
  { code: "+63", country: "PH", flag: "🇵🇭", label: "Philippines" },
  { code: "+60", country: "MY", flag: "🇲🇾", label: "Malaysia" },
  { code: "+62", country: "ID", flag: "🇮🇩", label: "Indonesia" },
  { code: "+84", country: "VN", flag: "🇻🇳", label: "Vietnam" },
  { code: "+66", country: "TH", flag: "🇹🇭", label: "Thailand" },
  { code: "+82", country: "KR", flag: "🇰🇷", label: "South Korea" },
  { code: "+81", country: "JP", flag: "🇯🇵", label: "Japan" },
  { code: "+86", country: "CN", flag: "🇨🇳", label: "China" },
  { code: "+49", country: "DE", flag: "🇩🇪", label: "Germany" },
  { code: "+33", country: "FR", flag: "🇫🇷", label: "France" },
  { code: "+39", country: "IT", flag: "🇮🇹", label: "Italy" },
  { code: "+34", country: "ES", flag: "🇪🇸", label: "Spain" },
  { code: "+31", country: "NL", flag: "🇳🇱", label: "Netherlands" },
  { code: "+41", country: "CH", flag: "🇨🇭", label: "Switzerland" },
  { code: "+46", country: "SE", flag: "🇸🇪", label: "Sweden" },
  { code: "+47", country: "NO", flag: "🇳🇴", label: "Norway" },
  { code: "+45", country: "DK", flag: "🇩🇰", label: "Denmark" },
  { code: "+358", country: "FI", flag: "🇫🇮", label: "Finland" },
  { code: "+48", country: "PL", flag: "🇵🇱", label: "Poland" },
  { code: "+43", country: "AT", flag: "🇦🇹", label: "Austria" },
  { code: "+32", country: "BE", flag: "🇧🇪", label: "Belgium" },
  { code: "+30", country: "GR", flag: "🇬🇷", label: "Greece" },
  { code: "+7", country: "RU", flag: "🇷🇺", label: "Russia" },
  { code: "+55", country: "BR", flag: "🇧🇷", label: "Brazil" },
  { code: "+52", country: "MX", flag: "🇲🇽", label: "Mexico" },
  { code: "+1", country: "CA", flag: "🇨🇦", label: "Canada" },
  { code: "+20", country: "EG", flag: "🇪🇬", label: "Egypt" },
  { code: "+234", country: "NG", flag: "🇳🇬", label: "Nigeria" },
  { code: "+27", country: "ZA", flag: "🇿🇦", label: "South Africa" },
  { code: "+254", country: "KE", flag: "🇰🇪", label: "Kenya" },
  { code: "+972", country: "IL", flag: "🇮🇱", label: "Israel" },
  { code: "+90", country: "TR", flag: "🇹🇷", label: "Turkey" },
  { code: "+98", country: "IR", flag: "🇮🇷", label: "Iran" },
  { code: "+964", country: "IQ", flag: "🇮🇶", label: "Iraq" },
];

export const STATE_CODES: Record<string, string> = {
  "Andhra Pradesh": "AP",
  "Arunachal Pradesh": "AR",
  "Assam": "AS",
  "Bihar": "BR",
  "Chhattisgarh": "CG",
  "Goa": "GA",
  "Gujarat": "GJ",
  "Haryana": "HR",
  "Himachal Pradesh": "HP",
  "Jharkhand": "JH",
  "Karnataka": "KA",
  "Kerala": "KL",
  "Madhya Pradesh": "MP",
  "Maharashtra": "MH",
  "Manipur": "MN",
  "Meghalaya": "ML",
  "Mizoram": "MZ",
  "Nagaland": "NL",
  "Odisha": "OD",
  "Punjab": "PB",
  "Rajasthan": "RJ",
  "Sikkim": "SK",
  "Tamil Nadu": "TN",
  "Telangana": "TS",
  "Tripura": "TR",
  "Uttar Pradesh": "UP",
  "Uttarakhand": "UK",
  "West Bengal": "WB",
  "Andaman and Nicobar Islands": "AN",
  "Chandigarh": "CH",
  "Dadra and Nagar Haveli and Daman and Diu": "DH",
  "Delhi": "DL",
  "Delhi (NCT)": "DL",
  "Jammu and Kashmir": "JK",
  "Ladakh": "LA",
  "Lakshadweep": "LD",
  "Puducherry": "PY",
};

export default function ArnOnboardForm({
  phase,
  mobile,
  onMobileChange,
  otpValues,
  onOtpChange,
  onGoToOtp,
  onGoToMobile,
  onReset,
  userStage,
  onKycVerified,
  onGoToIdentity,
  onGoToKycCompliant,
  onGoToEmail,
  onGoToEmailOtp,
  onEmailVerified,
  onIdentityVerified,
  onBankVerified,
  onGoToWelcome,
  onGoToBank,
  onGoToRiskScore,
  kycError,
  referredBy,
  onOtpVerified,
  riskQuestions,
  riskAnswers,
  onRiskAnswerChange,
  riskIndex,
  onRiskIndexChange,
  onSubmitRisk,
  riskError,
  isLoadingRisk,
  isSubmittingRisk,
  riskScoreData,
  isLoadingScore,
  scoreError,
}: ArnOnboardFormProps) {
  const [resendTimer, setResendTimer] = useState(30);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [countryCode, setCountryCode] = useState("+91");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);

  const [email, setEmail] = useState("");
  const [emailOtpValues, setEmailOtpValues] = useState(["", "", "", "", "", ""]);
  const [isRequestingEmail, setIsRequestingEmail] = useState(false);
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailResendTimer, setEmailResendTimer] = useState(30);
  const [isResendingEmail, setIsResendingEmail] = useState(false);

  useEffect(() => {
    setEmailVerified(getCookie("emailVerified") === "1");
  }, []);

  const [nomineeVerified, setNomineeVerified] = useState(false);

  useEffect(() => {
    setNomineeVerified(getCookie("nomineeVerified") === "1");
  }, []);

  useEffect(() => {
    if (userStage) {
      setEmailVerified(!!userStage.isEmail);
      setNomineeVerified(!!userStage.isNominee);
      setBankVerified(!!userStage.isBank);
    }
  }, [userStage]);

  const [nomineeName, setNomineeName] = useState("");
  const [nomineeDob, setNomineeDob] = useState("");
  const [nomineeRelationship, setNomineeRelationship] = useState<NomineeRelationship | "">("");
  const [nomineePan, setNomineePan] = useState("");
  const [nomineeAadhaar, setNomineeAadhaar] = useState("");
  const [nomineeEmail, setNomineeEmail] = useState("");
  const [nomineePhoneIsd, setNomineePhoneIsd] = useState("91");
  const [nomineePhoneNumber, setNomineePhoneNumber] = useState("");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLine2, setAddrLine2] = useState("");
  const [addrCity, setAddrCity] = useState("");
  const [addrState, setAddrState] = useState("");
  const [addrPostal, setAddrPostal] = useState("");
  const addrCountry = "IN";
  const [guardianName, setGuardianName] = useState("");
  const [guardianRelationship, setGuardianRelationship] = useState<NomineeRelationship | "">("");
  const [guardianPan, setGuardianPan] = useState("");
  const [guardianEmail, setGuardianEmail] = useState("");
  const [guardianPhoneIsd, setGuardianPhoneIsd] = useState("91");
  const [guardianPhoneNumber, setGuardianPhoneNumber] = useState("");
  const [guardianAddrLine1, setGuardianAddrLine1] = useState("");
  const [guardianAddrPostal, setGuardianAddrPostal] = useState("");
  const guardianAddrCountry = "IN";
  const [isSubmittingNominee, setIsSubmittingNominee] = useState(false);
  const [nomineeError, setNomineeError] = useState<string | null>(null);

  const nomineeAge = (() => {
    if (!nomineeDob) return null;
    const dob = new Date(nomineeDob);
    if (Number.isNaN(dob.getTime())) return null;
    const diff = Date.now() - dob.getTime();
    const age = Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
    return age;
  })();
  const isMinor = nomineeAge !== null && nomineeAge < 18;

  const isNomineeValid =
    nomineeName.trim().length > 0 &&
    nomineeDob.trim().length > 0 &&
    nomineeRelationship !== "" &&
    nomineePan.trim().length > 0 &&
    nomineeAadhaar.trim().length === 4 &&
    nomineeEmail.trim().length > 0 &&
    nomineePhoneNumber.trim().length > 0 &&
    addrLine1.trim().length > 0 &&
    addrLine2.trim().length > 0 &&
    addrCity.trim().length > 0 &&
    addrState.trim().length > 0 &&
    addrPostal.trim().length > 0 &&
    addrCountry.trim().length > 0 &&
    (!isMinor ||
      (guardianName.trim().length > 0 &&
        guardianRelationship !== "" &&
        guardianPan.trim().length > 0 &&
        guardianEmail.trim().length > 0 &&
        guardianPhoneNumber.trim().length > 0 &&
        guardianAddrLine1.trim().length > 0 &&
        guardianAddrPostal.trim().length > 0 &&
        guardianAddrCountry.trim().length > 0));

  const handleNomineeSubmit = async () => {
    if (!isNomineeValid) {
      setNomineeError("Please fill in all the required nominee details.");
      return;
    }

    setIsSubmittingNominee(true);
    setNomineeError(null);

    const buildAddress = (): NomineeAddress | undefined => {
      const hasValue =
        addrLine1.trim() ||
        addrLine2.trim() ||
        addrCity.trim() ||
        addrState.trim() ||
        addrPostal.trim() ||
        addrCountry.trim();
      if (!hasValue) return undefined;
      const address: NomineeAddress = {};
      if (addrLine1.trim()) address.line1 = addrLine1.trim();
      if (addrLine2.trim()) address.line2 = addrLine2.trim();
      if (addrCity.trim()) address.city = addrCity.trim();
      if (addrState.trim()) address.state = addrState.trim();
      if (addrPostal.trim()) address.postal_code = addrPostal.trim();
      if (addrCountry.trim()) address.country = addrCountry.trim();
      return address;
    };

    const buildGuardianAddress = (): NomineeAddress | undefined => {
      const hasValue =
        guardianAddrLine1.trim() || guardianAddrPostal.trim() || guardianAddrCountry.trim();
      if (!hasValue) return undefined;
      const address: NomineeAddress = {};
      if (guardianAddrLine1.trim()) address.line1 = guardianAddrLine1.trim();
      if (guardianAddrPostal.trim()) address.postal_code = guardianAddrPostal.trim();
      if (guardianAddrCountry.trim()) address.country = guardianAddrCountry.trim();
      return address;
    };

    try {
      const nominee: CreateNomineeDto = {
        nominee_name: nomineeName.trim(),
        nominee_dob: nomineeDob,
        allocation_percentage: 100,
        nominee_relationship: nomineeRelationship as NomineeRelationship,
        nominee_order: 1,
        nominee_pan: nomineePan.trim().toUpperCase(),
        nominee_aadhaar_number: nomineeAadhaar.trim(),
        nominee_email_address: nomineeEmail.trim(),
        nominee_phone_number: {
          isd: nomineePhoneIsd.trim() || "91",
          number: nomineePhoneNumber.trim(),
        },
      };

        const address = buildAddress();
        if (address) nominee.nominee_address = address;

        if (isMinor) {
          nominee.guardian_name = guardianName.trim();
          nominee.guardian_relationship = guardianRelationship as NomineeRelationship;
          nominee.guardian_pan = guardianPan.trim().toUpperCase();
          nominee.guardian_email_address = guardianEmail.trim();
          nominee.guardian_phone_number = {
            isd: guardianPhoneIsd.trim() || "91",
            number: guardianPhoneNumber.trim(),
          };
        const guardianAddress = buildGuardianAddress();
        if (guardianAddress) nominee.guardian_address = guardianAddress;
      }

      const payload: CreateNominationPayload = { nominees: [nominee] };

      await createNominationDetails(payload);

      setCookie("nomineeVerified", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      setNomineeVerified(true);
      onGoToWelcome();
    } catch (err) {
      if (err && typeof err === "object" && "isConflict" in err && (err as { isConflict?: boolean }).isConflict) {
        setCookie("nomineeVerified", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
        setNomineeVerified(true);
        onGoToWelcome();
        return;
      }
      setNomineeError(
        err instanceof Error ? err.message : "Failed to save nominee. Please try again."
      );
    } finally {
      setIsSubmittingNominee(false);
    }
  };

  const [fullName, setFullName] = useState("");
  const [pan, setPan] = useState("");
  const [dob, setDob] = useState("");
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [kycLocalError, setKycLocalError] = useState<string | null>(null);

  const [fatherName, setFatherName] = useState("");
  const [gender, setGender] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("");
  const [incomeSlab, setIncomeSlab] = useState("");
  const [occupationType, setOccupationType] = useState("");
  const [sourceOfWealth, setSourceOfWealth] = useState("");
  const [pepChecked, setPepChecked] = useState(false);
  const [isSubmittingIdentity, setIsSubmittingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState<string | null>(null);
  const [bankVerified, setBankVerified] = useState(false);

  useEffect(() => {
    setBankVerified(getCookie("bankVerified") === "1");
  }, []);

  const [bankIfsc, setBankIfsc] = useState("");
  const [bankAccountType, setBankAccountType] = useState<AccountType | "">("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankConfirmNumber, setBankConfirmNumber] = useState("");
  const [bankStatus, setBankStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [bankError, setBankError] = useState<string | null>(null);

  const handleBankVerify = async () => {
    if (!bankIfsc.trim()) {
      setBankError("Please enter your IFSC code.");
      return;
    }
    if (!bankAccountType) {
      setBankError("Please select an account type.");
      return;
    }
    if (!/^\d{9,18}$/.test(bankAccountNumber)) {
      setBankError("Account number must be 9 to 18 digits.");
      return;
    }
    if (bankAccountNumber !== bankConfirmNumber) {
      setBankError("Account number and confirm account number do not match.");
      return;
    }

    setBankStatus("loading");
    setBankError(null);

    try {
      const ipAddress = await getClientIp();

      await createInvestorProfileAndMfAccount({ ipAddress });

      await createAndVerifyBankAccount({
        account_number: bankAccountNumber,
        type: bankAccountType as AccountType,
        ifsc_code: bankIfsc.trim(),
      });

      setCookie("bankVerified", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      setBankStatus("success");
    } catch (err) {
      setBankError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
      setBankStatus("error");
    }
  };

  const genderOptions = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "others", label: "Others" },
  ];
  const maritalOptions = [
    { value: "single", label: "Single" },
    { value: "married", label: "Married" },
  ];
  const incomeSlabOptions = [
    { value: "upto_1lakh", label: "Up to ₹1 Lakh" },
    { value: "above_1lakh_upto_5lakh", label: "Above ₹1 Lakh – ₹5 Lakh" },
    { value: "above_5lakh_upto_10lakh", label: "Above ₹5 Lakh – ₹10 Lakh" },
    { value: "above_10lakh_upto_25lakh", label: "Above ₹10 Lakh – ₹25 Lakh" },
    { value: "above_25lakh_upto_1cr", label: "Above ₹25 Lakh – ₹1 Cr" },
    { value: "above_1cr", label: "Above ₹1 Cr" },
  ];
  const occupationOptions = [
    { value: "private_sector_service", label: "Private Sector" },
    { value: "public_sector_service", label: "Public Sector" },
    { value: "government_service", label: "Government Sector" },
    { value: "business", label: "Business" },
    { value: "professional", label: "Professional" },
    { value: "retired", label: "Retired" },
    { value: "house_wife", label: "Housewife" },
    { value: "student", label: "Student" },
    { value: "agriculture", label: "Agriculture" },
    { value: "doctor", label: "Doctor" },
    { value: "forex_dealer", label: "Forex Dealer" },
    { value: "service", label: "Service" },
    { value: "others", label: "Others" },
  ];

  const sourceOfWealthOptions = [
    { value: "salary", label: "Salary" },
    { value: "business", label: "Business" },
    { value: "gift", label: "Gift" },
    { value: "ancestral_property", label: "Ancestral Property" },
    { value: "rental_income", label: "Rental Income" },
    { value: "prize_money", label: "Prize Money" },
    { value: "royalty", label: "Royalty" },
    { value: "others", label: "Others" },
  ];

  const isIdentityValid =
    fatherName.trim().length > 0 &&
    gender !== "" &&
    maritalStatus !== "" &&
    incomeSlab !== "" &&
    occupationType !== "" &&
    sourceOfWealth !== "" &&
    pepChecked;

  const titleCase = (value: string): string =>
    value
      .trim()
      .split(/\s+/)
      .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
      .join(" ");

  const handleIdentitySubmit = async () => {
    if (!isIdentityValid) return;

    setIsSubmittingIdentity(true);
    setIdentityError(null);

    try {
      await submitKycExtra({
        father_name: titleCase(fatherName),
        gender: gender as "male" | "female" | "others",
        marital_status: maritalStatus as "single" | "married",
        income_slab: incomeSlab as
          | "upto_1lakh"
          | "above_1lakh_upto_5lakh"
          | "above_5lakh_upto_10lakh"
          | "above_10lakh_upto_25lakh"
          | "above_25lakh_upto_1cr"
          | "above_1cr",
        occupation: occupationType,
        pep_details: "not_applicable",
        source_of_wealth: sourceOfWealth,
      });
      onIdentityVerified();
    } catch (err) {
      setIdentityError(
        err instanceof Error ? err.message : "Failed to save profile details. Please try again."
      );
    } finally {
      setIsSubmittingIdentity(false);
    }
  };

  const panValid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan.trim());
  const isKycValid =
    fullName.trim().length > 0 && panValid && dob.trim().length > 0;

  const handleKycSubmit = async () => {
    if (!isKycValid) return;

    setIsSubmittingKyc(true);
    setKycLocalError(null);

    try {
      const result = await fetchKycData({
        pan: pan.trim().toUpperCase(),
        date_of_birth: dob,
        name: fullName.trim(),
      });

      if (result.isKycCompliant) {
        onKycVerified();
      } else {
        const reason = result.reason ? ` — ${result.reason}` : "";
        setKycLocalError(`${result.message}${reason}`.trim());
      }
    } catch (err) {
      setKycLocalError(
        err instanceof Error ? err.message : "KYC verification failed. Please try again."
      );
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  useEffect(() => {
    if (phase === "otp") {
      setResendTimer(30);
      setOtpError(null);
    }
    if (phase === "emailOtp") {
      setEmailResendTimer(30);
      setEmailError(null);
    }
  }, [phase]);

  useEffect(() => {
    if (phase !== "otp" || resendTimer <= 0) return;
    const timer = setInterval(() => {
      setResendTimer((t) => (t <= 1 ? (clearInterval(timer), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, resendTimer]);

  useEffect(() => {
    if (phase !== "emailOtp" || emailResendTimer <= 0) return;
    const timer = setInterval(() => {
      setEmailResendTimer((t) => (t <= 1 ? (clearInterval(timer), 0) : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, emailResendTimer]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMobileSubmit = async () => {
    if (mobile.replace(/\D/g, "").length !== 10) return;

    setIsRequesting(true);
    setOtpError(null);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: countryCode,
        mobileNumber: digits,
        referredBy,
      });
      onGoToOtp();
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to send OTP. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  const handleOtpDigitChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1);
    const next = [...otpValues];
    next[index] = digit;
    onOtpChange(next);
    if (digit && index < otpValues.length - 1) {
      const el = document.getElementById(`otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const el = document.getElementById(`otp-${index - 1}`);
      el?.focus();
    }
  };

  const handleVerify = async () => {
    if (!otpValues.every((v) => v.length === 1)) {
      setOtpError("Please enter the complete 6-digit OTP.");
      return;
    }

    setIsVerifying(true);
    setOtpError(null);

    try {
      const digits = otpValues.join("");
      const result = await verifyArnOtp({
        mobileNumber: mobile.replace(/\D/g, ""),
        otp: digits,
      });

      const userData = (result.data || {}) as Record<string, unknown>;
      if (userData.accessToken && typeof userData.accessToken === "string") {
        setCookie("onboardedUserToken", userData.accessToken, { path: "/" });
      }
      if (userData.refreshToken && typeof userData.refreshToken === "string") {
        setCookie("onboardedUserRefreshToken", userData.refreshToken, { path: "/" });
      }
      setCookie("onboardedUserData", JSON.stringify(userData), { path: "/" });

      const token =
        userData.accessToken && typeof userData.accessToken === "string"
          ? (userData.accessToken as string)
          : "";
      onOtpVerified(token);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "OTP verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (isResending) return;

    setResendTimer(30);
    setOtpError(null);
    setIsResending(true);

    try {
      const digits = mobile.replace(/\D/g, "");
      await requestArnOtp({
        callingCode: countryCode,
        mobileNumber: digits,
        referredBy,
      });
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : "Failed to resend OTP. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const handleResendEmail = async () => {
    if (isResendingEmail) return;

    setEmailResendTimer(30);
    setEmailError(null);
    setIsResendingEmail(true);

    try {
      await requestLinkEmail({ email: email.trim() });
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to resend email. Please try again.");
    } finally {
      setIsResendingEmail(false);
    }
  };

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const handleEmailSubmit = async () => {
    if (!emailValid) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    setIsRequestingEmail(true);
    setEmailError(null);

    try {
      await requestLinkEmail({ email: email.trim() });
      onGoToEmailOtp();
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Failed to send email verification. Please try again."
      );
    } finally {
      setIsRequestingEmail(false);
    }
  };

  const handleEmailOtpDigitChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(0, 1);
    const next = [...emailOtpValues];
    next[index] = digit;
    setEmailOtpValues(next);
    if (digit && index < emailOtpValues.length - 1) {
      const el = document.getElementById(`email-otp-${index + 1}`);
      el?.focus();
    }
  };

  const handleEmailOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !emailOtpValues[index] && index > 0) {
      const el = document.getElementById(`email-otp-${index - 1}`);
      el?.focus();
    }
  };

  const handleEmailVerify = async () => {
    if (!emailOtpValues.every((v) => v.length === 1)) {
      setEmailError("Please enter the complete 6-digit code.");
      return;
    }

    setIsVerifyingEmail(true);
    setEmailError(null);

    try {
      const digits = emailOtpValues.join("");
      await verifyLinkEmail({ email: email.trim(), otp: digits });
      setCookie("emailVerified", "1", { path: "/", maxAge: 60 * 60 * 24 * 30 });
      setEmailVerified(true);
      onEmailVerified();
    } catch (err) {
      setEmailError(
        err instanceof Error ? err.message : "Email verification failed. Please try again."
      );
    } finally {
      setIsVerifyingEmail(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === countryCode) || COUNTRY_CODES[1];

  const riskProfileBlock =
    riskScoreData &&
    typeof riskScoreData.riskProfile === "object" &&
    riskScoreData.riskProfile !== null
      ? (riskScoreData.riskProfile as Record<string, unknown>)
      : null;

  const assetAllocationBlock =
    riskScoreData &&
    typeof riskScoreData.assetAllocation === "object" &&
    riskScoreData.assetAllocation !== null
      ? (riskScoreData.assetAllocation as Record<string, unknown>)
      : null;

  const totalPoints = Number(riskProfileBlock?.totalPoints ?? 0);
  const riskScore = totalPoints * (100 / 70);
  const displayScore = Math.round(
    Math.max(0, Math.min(100, riskScore))
  );
  const fallbackAppetite =
    riskScore <= 30
      ? "Conservative"
      : riskScore <= 60
        ? "Moderate"
        : "Aggressive";
  const riskAppetite =
    typeof assetAllocationBlock?.smallCasePortfolioName === "string" &&
    assetAllocationBlock.smallCasePortfolioName
      ? (assetAllocationBlock.smallCasePortfolioName as string)
      : fallbackAppetite;

  const handleRiskSelect = (questionId: number, optionIndex: number) => {
    onRiskAnswerChange(questionId, optionIndex);

    const isLast = riskIndex >= riskQuestions.length - 1;
    if (!isLast) {
      window.setTimeout(() => onRiskIndexChange(riskIndex + 1), 260);
    }
  };

  const handleRiskBack = () => {
    if (riskIndex > 0) {
      onRiskIndexChange(riskIndex - 1);
    } else {
      onGoToMobile();
    }
  };

  const formattedMobile = (() => {
    const digits = mobile.replace(/\D/g, "");
    if (!digits) return "";
    const prefix = selectedCountry.flag + " " + selectedCountry.code;
    return `${prefix} ${digits}`;
  })();

  const isMobileValid = mobile.replace(/\D/g, "").length === 10;
  const isOtpComplete = otpValues.every((v) => v.length === 1);

  return (
    <div>
      {phase === "mobile" && (
        <div className="step-panel">
          <div className="text-center">
            <p className="step-eyebrow">Account Setup</p>
            <h2 className="step-title">Tell us your mobile number</h2>
            <p className="step-helper">We will send a one-time code to verify your number.</p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Mobile Number <span className="req">Required</span>
            </label>
            <div className="flex gap-2">
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((prev) => !prev)}
                  className="field-prefix flex items-center justify-between gap-1 min-w-[88px]"
                >
                  <span>{selectedCountry.flag} {selectedCountry.code}</span>
                  <i className="ti ti-chevron-down text-[10px] text-[var(--arn-txt-3)]" aria-hidden="true" />
                </button>
                {isDropdownOpen && (
                  <div className="country-dropdown">
                    {COUNTRY_CODES.map((item) => (
                      <button
                        key={item.country}
                        type="button"
                        onClick={() => {
                          setCountryCode(item.code);
                          setIsDropdownOpen(false);
                        }}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-[var(--arn-bg-2)] ${
                          item.code === countryCode ? "text-[var(--arn-amber)]" : "text-[var(--arn-txt)]"
                        }`}
                      >
                        <span className="text-base">{item.flag}</span>
                        <span className="flex-1">{item.label}</span>
                        <span className="text-[var(--arn-txt-2)]">{item.code}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <input
                className="field-input flex-1"
                placeholder="98765 43210"
                inputMode="numeric"
                maxLength={10}
                value={mobile}
                onChange={(e) => onMobileChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
              />
            </div>
          </div>

          {otpError && phase === "mobile" && (
            <div className="field-error">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <button
            type="button"
            onClick={handleMobileSubmit}
            disabled={!isMobileValid || isRequesting}
            className="btn-primary btn-wide"
          >
            {isRequesting ? "Sending..." : "Proceed"} {!isRequesting && <i className="ti ti-arrow-right" aria-hidden="true" />}
          </button>
        </div>
      )}

      {phase === "otp" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToMobile} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Account Setup</p>
            <h2 className="step-title">Enter the OTP sent to</h2>
            <p className="step-helper">{formattedMobile}</p>
          </div>

          <div className="otp-row justify-center">
            {otpValues.map((value, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                className="otp-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(index, e)}
              />
            ))}
          </div>

          {otpError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {otpError}
            </div>
          )}

          <div className="mb-5 text-center">
            <span
              className={`resend-link ${resendTimer > 0 || isResending ? "disabled" : ""}`}
              role="button"
              onClick={handleResend}
            >
              {isResending ? "Resending..." : resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={!isOtpComplete || isVerifying}
            className="btn-primary btn-wide"
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "risk" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={handleRiskBack} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          {isLoadingRisk ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Loading your risk profile</h2>
              <p className="step-helper">Please wait a moment…</p>
            </div>
          ) : riskQuestions.length === 0 ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Couldn&apos;t load questions</h2>
              <p className="step-helper">
                {riskError || "Something went wrong. Please try again."}
              </p>
              <button
                type="button"
                onClick={onGoToMobile}
                className="btn-primary btn-wide"
              >
                Back to Mobile
              </button>
            </div>
          ) : (
            (() => {
              const question = riskQuestions[riskIndex];
              const selected = riskAnswers[question.id];
              const pct = ((riskIndex + 1) / riskQuestions.length) * 100;

              return (
                <div>
                  <div className="q-header-row">
                    <p className="step-eyebrow">Risk Assessment</p>
                    <span className="q-counter">
                      {riskIndex + 1} / {riskQuestions.length}
                    </span>
                  </div>

                  <h2 className="step-title" style={{ marginBottom: 6 }}>
                    {question.question}
                  </h2>

                  <div className="q-progress-track">
                    <div className="q-progress-fill" style={{ width: `${pct}%` }} />
                  </div>

                  <p className="step-helper" style={{ marginBottom: 30 }}>
                    Select the option that best describes you.
                  </p>

                  <div className="answer-grid">
                    {question.option.map((opt, index) => {
                      const isSelected = selected === index;
                      return (
                        <div
                          key={index}
                          role="button"
                          tabIndex={0}
                          onClick={() => handleRiskSelect(question.id, index)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              handleRiskSelect(question.id, index);
                            }
                          }}
                          className={`answer-card ${isSelected ? "selected" : ""}`}
                        >
                          {opt.answer}
                        </div>
                      );
                    })}
                  </div>

                  {riskError && (
                    <div className="field-error justify-center mt-4">
                      <i className="ti ti-alert-circle" aria-hidden="true" />
                      {riskError}
                    </div>
                  )}

                  {riskIndex === riskQuestions.length - 1 && (
                    <button
                      type="button"
                      onClick={onSubmitRisk}
                      disabled={
                        selected === undefined || isSubmittingRisk
                      }
                      className="btn-primary btn-wide"
                      style={{ marginTop: 24 }}
                    >
                      {isSubmittingRisk ? "Submitting..." : "Submit"}
                    </button>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {phase === "riskScore" && (
        <div className="step-panel">
          {isLoadingScore ? (
            <div className="text-center py-10">
              <p className="step-eyebrow">Risk Assessment</p>
              <h2 className="step-title">Generating your risk score</h2>
              <p className="step-helper">Please wait a moment…</p>
            </div>
          ) : (
            <div>
              <p className="step-eyebrow" style={{ textAlign: "center" }}>
                Risk Assessment
              </p>
              <h2 className="step-title" style={{ textAlign: "center" }}>
                Your Risk Profile
              </h2>

              <div className="risk-gauge-wrap">
                <RiskScoreArc score={riskScore} />
                <div className="risk-score">{displayScore}</div>
                <div className="risk-appetite">{riskAppetite}</div>
                <div className="risk-score-sub">Your risk score is</div>
              </div>

              {scoreError && (
                <div className="field-error justify-center">
                  <i className="ti ti-alert-circle" aria-hidden="true" />
                  {scoreError}
                </div>
              )}

              <button
                type="button"
                onClick={onGoToEmail}
                className="btn-primary btn-wide"
                style={{ marginTop: 24 }}
              >
                Continue <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
      )}
      {phase === "email" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToRiskScore} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <p className="step-eyebrow">Identity Verification</p>
          <h2 className="step-title">Verify your email address</h2>
          <p className="step-helper">
            Verify your email to receive your personalised risk profile report.
          </p>

          <div className="field-group">
            <label className="field-label">
              Email Address <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              type="email"
              placeholder="Enter your email-id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {emailError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {emailError}
            </div>
          )}

          <button
            type="button"
            onClick={handleEmailSubmit}
            disabled={!emailValid || isRequestingEmail}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isRequestingEmail ? "Sending..." : "Verify Email"}{" "}
            {!isRequestingEmail && <i className="ti ti-arrow-right" aria-hidden="true" />}
          </button>
        </div>
      )}

      {phase === "emailOtp" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToEmail} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Identity Verification</p>
            <h2 className="step-title">Enter the code sent to</h2>
            <p className="step-helper">{email.trim()}</p>
          </div>

          <div className="otp-row justify-center">
            {emailOtpValues.map((value, index) => (
              <input
                key={index}
                id={`email-otp-${index}`}
                className="otp-box pin-box"
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={value}
                onChange={(e) => handleEmailOtpDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleEmailOtpKeyDown(index, e)}
              />
            ))}
          </div>

          {emailError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {emailError}
            </div>
          )}

          <div className="mb-5 text-center">
            <span
              className={`resend-link ${emailResendTimer > 0 || isResendingEmail ? "disabled" : ""}`}
              role="button"
              onClick={handleResendEmail}
            >
              {isResendingEmail ? "Resending..." : emailResendTimer > 0 ? `Resend in ${emailResendTimer}s` : "Resend Email"}
            </span>
          </div>

          <button
            type="button"
            onClick={handleEmailVerify}
            disabled={!emailOtpValues.every((v) => v.length === 1) || isVerifyingEmail}
            className="btn-primary btn-wide"
          >
            {isVerifyingEmail ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "kyc" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToRiskScore} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <div className="text-center">
            <p className="step-eyebrow">Identity Verification</p>
            <h2 className="step-title">Complete your PAN details</h2>
            <p className="step-helper">
              Please provide your PAN number, date of birth and full name to complete your profile.
            </p>
          </div>

          <div className="field-group">
            <label className="field-label">
              Full Name <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="Enter your full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value.replace(/\d/g, ""))}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              PAN Number <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="ABCDE1234F"
              value={pan}
              maxLength={10}
              ref={panInputRef}
              onChange={(e) => {
                const cursorPos = e.target.selectionStart ?? 0;
                const newValue = e.target.value.replace(/\s/g, "").toUpperCase();
                setPan(newValue);
                requestAnimationFrame(() => {
                  if (panInputRef.current) {
                    const restoredPos = Math.min(cursorPos, newValue.length);
                    panInputRef.current.setSelectionRange(restoredPos, restoredPos);
                  }
                });
              }}
            />
          </div>

          <div className="field-group">
            <label className="field-label">
              Date of Birth <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
            />
          </div>

          {(kycError || kycLocalError) && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {kycLocalError || kycError}
            </div>
          )}

          <button
            type="button"
            onClick={handleKycSubmit}
            disabled={!isKycValid || isSubmittingKyc}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isSubmittingKyc ? "Verifying..." : "Verify"}
          </button>
        </div>
      )}

      {phase === "kycCompliant" && (
        <div className="step-panel">
          <p className="step-eyebrow" style={{ textAlign: "center" }}>
            Identity Verification
          </p>
          <h2 className="step-title" style={{ textAlign: "center" }}>
            KYC compliance status
          </h2>
          <p className="step-helper" style={{ textAlign: "center" }}>
            We&apos;ve checked your KYC status with the CKYC Registry (CERSAI) and SEBI databases.
          </p>

          <div className="glass-card gold" style={{ textAlign: "center", padding: "34px 26px" }}>
            <div className="success-ring">
              <i className="ti ti-shield-check" aria-hidden="true" />
            </div>
            <div className="card-title" style={{ textAlign: "center" }}>
              You&apos;re KYC Compliant!
            </div>
            <div className="card-sub" style={{ textAlign: "center" }}>
              Your KYC is complete and up to date. You can proceed without any additional verification.
            </div>
          </div>

          <button
            type="button"
            onClick={onGoToIdentity}
            className="btn-primary btn-wide"
            style={{ marginTop: 20 }}
          >
            Continue <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}

      {phase === "identity" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToKycCompliant} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <p className="step-eyebrow">Identity Verification</p>
          <h2 className="step-title">Answer the following questions</h2>
          <p className="step-helper">
            Please provide the information below to complete your profile.
          </p>

          <div className="onboard-section-label">Family Details</div>
          <div className="field-group">
            <label className="field-label">
              Father&apos;s Name <span className="req">Required</span>
            </label>
            <input
              className="field-input"
              placeholder="Enter father's name"
              value={fatherName}
              onChange={(e) => setFatherName(e.target.value.replace(/\d/g, ""))}
            />
          </div>

          <div className="onboard-section-label">Personal Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Gender</label>
              <select
                className="field-select"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="">Select your gender</option>
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Marital Status</label>
              <select
                className="field-select"
                value={maritalStatus}
                onChange={(e) => setMaritalStatus(e.target.value)}
              >
                <option value="">Select your marital status</option>
                {maritalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="onboard-section-label">Financial Details</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="field-group">
              <label className="field-label">Income Slab</label>
              <select
                className="field-select"
                value={incomeSlab}
                onChange={(e) => setIncomeSlab(e.target.value)}
              >
                <option value="">Select your income slab range</option>
                {incomeSlabOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Occupation</label>
              <select
                className="field-select"
                value={occupationType}
                onChange={(e) => setOccupationType(e.target.value)}
              >
                <option value="">Select your occupation</option>
                {occupationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="field-group">
              <label className="field-label">Source of Wealth</label>
              <select
                className="field-select"
                value={sourceOfWealth}
                onChange={(e) => setSourceOfWealth(e.target.value)}
              >
                <option value="">Select your source of wealth</option>
                {sourceOfWealthOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="onboard-check">
            <input
              type="checkbox"
              checked={pepChecked}
              onChange={(e) => setPepChecked(e.target.checked)}
            />
            <span>
              I confirm I am not a politically exposed person (PEP). By continuing, you agree to our{" "}
              <a href="#" onClick={(e) => e.preventDefault()}>
                Terms &amp; Conditions
              </a>
              .
            </span>
          </label>

          {identityError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {identityError}
            </div>
          )}

          <button
            type="button"
            onClick={handleIdentitySubmit}
            disabled={!isIdentityValid || isSubmittingIdentity}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isSubmittingIdentity ? "Saving..." : "Save and Continue"}
          </button>
        </div>
      )}

      {phase === "bank" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToIdentity} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          {bankStatus === "success" ? (
            <>
              <p className="step-eyebrow" style={{ textAlign: "center" }}>
                Investment Setup
              </p>
              <h2 className="step-title" style={{ textAlign: "center" }}>
                Bank account connected
              </h2>
              <p className="step-helper" style={{ textAlign: "center" }}>
                Your bank account has been connected and verification is in
                progress.
              </p>

              <div
                className="glass-card gold"
                style={{ textAlign: "center", padding: "34px 26px" }}
              >
                <div className="success-ring">
                  <i className="ti ti-circle-check" aria-hidden="true" />
                </div>
                <div className="card-title" style={{ textAlign: "center" }}>
                  You&apos;re all set!
                </div>
                <div className="card-sub" style={{ textAlign: "center" }}>
                  You can continue with the rest of the onboarding.
                </div>
              </div>

              <button
                type="button"
                onClick={onBankVerified}
                className="btn-primary btn-wide"
                style={{ marginTop: 20 }}
              >
                Continue <i className="ti ti-arrow-right" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <p className="step-eyebrow">Investment Setup</p>
              <h2 className="step-title">Connect your bank account</h2>
              <p className="step-helper">
                Please provide your bank details to complete your profile.
              </p>

              <div className="field-group">
                <label className="field-label">IFSC Code</label>
                <input
                  className="field-input"
                  placeholder="Enter your IFSC code"
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label className="field-label">Account Type</label>
                <select
                  className="field-select"
                  value={bankAccountType}
                  onChange={(e) => setBankAccountType(e.target.value as AccountType)}
                >
                  <option value="">Select account type</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                  <option value="nre">NRE</option>
                  <option value="nro">NRO</option>
                </select>
              </div>

              <div className="field-group">
                <label className="field-label">Account Number</label>
                <input
                  className="field-input"
                  placeholder="XXXX XXXX XX XXXX"
                  inputMode="numeric"
                  value={bankAccountNumber}
                  onChange={(e) =>
                    setBankAccountNumber(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              <div className="field-group">
                <label className="field-label">Confirm Account Number</label>
                <input
                  className="field-input"
                  placeholder="XXXX XXXX XX XXXX"
                  inputMode="numeric"
                  value={bankConfirmNumber}
                  onChange={(e) =>
                    setBankConfirmNumber(e.target.value.replace(/\D/g, ""))
                  }
                />
              </div>

              {bankError && (
                <div className="field-error justify-center">
                  <i className="ti ti-alert-circle" aria-hidden="true" />
                  {bankError}
                </div>
              )}

              <button
                type="button"
                onClick={handleBankVerify}
                disabled={bankStatus === "loading"}
                className="btn-primary btn-wide"
                style={{ marginTop: 8 }}
              >
                {bankStatus === "loading" ? "Verifying..." : "Verify"}
              </button>
            </>
          )}
        </div>
      )}

      {phase === "nominee" && (
        <div className="step-panel">
          <div className="flex justify-center mb-5">
            <div className="back-btn" onClick={onGoToBank} role="button" tabIndex={0}>
              <i className="ti ti-arrow-left" aria-hidden="true" />
            </div>
          </div>

          <p className="step-eyebrow">Investment Setup</p>
          <h2 className="step-title">Add a trusted nominee</h2>
          <p className="step-helper">
            Add the details of a trusted person to complete your profile.
          </p>

          <>
            <div className="field-group">
              <label className="field-label">
                Nominee Name <span className="req">Required</span>
              </label>
              <input
                className="field-input"
                placeholder="Enter name as per Govt ID"
                value={nomineeName}
                onChange={(e) => setNomineeName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label className="field-label">
                Date of Birth <span className="req">Required</span>
              </label>
              <input
                className="field-input"
                type="date"
                value={nomineeDob}
                onChange={(e) => setNomineeDob(e.target.value)}
              />
            </div>

            {nomineeDob && (
              <>
                <div className="field-group">
                  <label className="field-label">
                    Nominee Relationship <span className="req">Required</span>
                  </label>
                <select
                  className="field-select"
                  value={nomineeRelationship}
                  onChange={(e) => setNomineeRelationship(e.target.value as NomineeRelationship)}
                >
                  <option value="">Select relationship</option>
                  <option value="father">Father</option>
                  <option value="mother">Mother</option>
                  <option value="court_appointed_legal_guardian">Court Appointed Legal Guardian</option>
                  <option value="aunt">Aunt</option>
                  <option value="brother_in_law">Brother in Law</option>
                  <option value="brother">Brother</option>
                  <option value="daughter">Daughter</option>
                  <option value="daughter_in_law">Daughter in Law</option>
                  <option value="father_in_law">Father in Law</option>
                  <option value="grand_daughter">Grand Daughter</option>
                  <option value="grand_father">Grand Father</option>
                  <option value="grand_mother">Grand Mother</option>
                  <option value="grand_son">Grand Son</option>
                  <option value="mother_in_law">Mother in Law</option>
                  <option value="nephew">Nephew</option>
                  <option value="niece">Niece</option>
                  <option value="sister">Sister</option>
                  <option value="sister_in_law">Sister in Law</option>
                  <option value="son">Son</option>
                  <option value="son_in_law">Son in Law</option>
                  <option value="spouse">Spouse</option>
                  <option value="uncle">Uncle</option>
                  <option value="others">Others</option>
                </select>
              </div>

              {!isMinor && (
                <>
                  <div className="onboard-section-label">Nominee Details</div>
                  <div className="field-group">
                    <label className="field-label">
                      PAN Number <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={nomineePan}
                      onChange={(e) => setNomineePan(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Aadhaar Number <span className="req">Required</span>
                    </label>
                    <div className="flex gap-2 items-center">
                      <span className="aadhaar-prefix">XXXX-XXXX-</span>
                      <input
                        className="field-input flex-1"
                        placeholder="0000"
                        maxLength={4}
                        inputMode="numeric"
                        value={nomineeAadhaar}
                        onChange={(e) =>
                          setNomineeAadhaar(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Email Address <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="Enter email-id"
                      value={nomineeEmail}
                      onChange={(e) => setNomineeEmail(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Phone Number <span className="req">Required</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="field-prefix"
                        style={{ maxWidth: 70 }}
                        placeholder="91"
                        inputMode="numeric"
                        value={nomineePhoneIsd}
                        onChange={(e) => setNomineePhoneIsd(e.target.value.replace(/\D/g, ""))}
                      />
                      <input
                        className="field-input flex-1"
                        placeholder="Phone number"
                        inputMode="numeric"
                        value={nomineePhoneNumber}
                        onChange={(e) => setNomineePhoneNumber(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                  <div className="onboard-section-label">Address</div>
                  <div className="field-group">
                    <label className="field-label">
                      Line 1 <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="House / flat / street"
                      value={addrLine1}
                      onChange={(e) => setAddrLine1(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Line 2 <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="Area / landmark"
                      value={addrLine2}
                      onChange={(e) => setAddrLine2(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field-group">
                      <label className="field-label">
                        City <span className="req">Required</span>
                      </label>
                      <input
                        className="field-input"
                        placeholder="City"
                        value={addrCity}
                        onChange={(e) => setAddrCity(e.target.value)}
                      />
                    </div>
                    <div className="field-group">
                      <label className="field-label">
                        State <span className="req">Required</span>
                      </label>
                      <select
                        className="field-select"
                        value={addrState}
                        onChange={(e) => setAddrState(e.target.value)}
                      >
                        <option value="">Select state</option>
                        {Object.entries(STATE_CODES).map(([name, code]) => (
                          <option key={name} value={code}>
                            {name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field-group">
                      <label className="field-label">
                        Postal Code <span className="req">Required</span>
                      </label>
                      <input
                        className="field-input"
                        placeholder="Postal code"
                        value={addrPostal}
                        onChange={(e) => setAddrPostal(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </>
              )}

              {isMinor && (
                <div className="onboard-section-label">Guardian Details</div>
              )}
              {isMinor && (
                <>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian Name <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="Enter guardian name"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian Relationship <span className="req">Required</span>
                    </label>
                    <select
                      className="field-select"
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value as NomineeRelationship)}
                    >
                      <option value="">Select relationship</option>
                      <option value="father">Father</option>
                      <option value="mother">Mother</option>
                      <option value="court_appointed_legal_guardian">Court Appointed Legal Guardian</option>
                      <option value="aunt">Aunt</option>
                      <option value="brother_in_law">Brother in Law</option>
                      <option value="brother">Brother</option>
                      <option value="daughter">Daughter</option>
                      <option value="daughter_in_law">Daughter in Law</option>
                      <option value="father_in_law">Father in Law</option>
                      <option value="grand_daughter">Grand Daughter</option>
                      <option value="grand_father">Grand Father</option>
                      <option value="grand_mother">Grand Mother</option>
                      <option value="grand_son">Grand Son</option>
                      <option value="mother_in_law">Mother in Law</option>
                      <option value="nephew">Nephew</option>
                      <option value="niece">Niece</option>
                      <option value="sister">Sister</option>
                      <option value="sister_in_law">Sister in Law</option>
                      <option value="son">Son</option>
                      <option value="son_in_law">Son in Law</option>
                      <option value="spouse">Spouse</option>
                      <option value="uncle">Uncle</option>
                      <option value="others">Others</option>
                    </select>
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian PAN <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      value={guardianPan}
                      onChange={(e) => setGuardianPan(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian Email <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      type="email"
                      placeholder="Enter email-id"
                      value={guardianEmail}
                      onChange={(e) => setGuardianEmail(e.target.value)}
                    />
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian Phone <span className="req">Required</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        className="field-prefix"
                        style={{ maxWidth: 70 }}
                        placeholder="91"
                        inputMode="numeric"
                        value={guardianPhoneIsd}
                        onChange={(e) => setGuardianPhoneIsd(e.target.value.replace(/\D/g, ""))}
                      />
                      <input
                        className="field-input flex-1"
                        placeholder="Phone number"
                        inputMode="numeric"
                        value={guardianPhoneNumber}
                        onChange={(e) => setGuardianPhoneNumber(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                  <div className="field-group">
                    <label className="field-label">
                      Guardian Address Line 1 <span className="req">Required</span>
                    </label>
                    <input
                      className="field-input"
                      placeholder="House / flat / street"
                      value={guardianAddrLine1}
                      onChange={(e) => setGuardianAddrLine1(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="field-group">
                      <label className="field-label">
                        Postal Code <span className="req">Required</span>
                      </label>
                      <input
                        className="field-input"
                        placeholder="Postal code"
                        value={guardianAddrPostal}
                        onChange={(e) => setGuardianAddrPostal(e.target.value.replace(/\D/g, ""))}
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
          </>

          {nomineeError && (
            <div className="field-error justify-center">
              <i className="ti ti-alert-circle" aria-hidden="true" />
              {nomineeError}
            </div>
          )}

          <button
            type="button"
            onClick={handleNomineeSubmit}
            disabled={!isNomineeValid || isSubmittingNominee}
            className="btn-primary btn-wide"
            style={{ marginTop: 8 }}
          >
            {isSubmittingNominee ? "Saving..." : "Save and Continue"}
          </button>
        </div>
      )}

      {phase === "welcome" && (
        <div className="step-panel welcome-panel">
          <div className="success-ring">
            <i className="ti ti-check" aria-hidden="true" />
          </div>

          <p className="step-eyebrow" style={{ textAlign: "center" }}>Welcome to Fydaa</p>
          <h2 className="step-title" style={{ textAlign: "center" }}>You&apos;re all set</h2>
          <p className="step-helper" style={{ textAlign: "center", margin: "0 auto 28px", maxWidth: "440px" }}>
            Your advisor will reach out within 24 hours to begin your wealth journey.
          </p>

          <div className="summary-list">
            <div className="summary-row">
              <span className="summary-label">Mobile</span>
              <span className="summary-val">
                <i className="ti ti-circle-check" aria-hidden="true" />
                {mobile.replace(/\D/g, "") ? mobile.replace(/\D/g, "") : "—"}
              </span>
            </div>
            {riskScoreData && (
              <div className="summary-row">
                <span className="summary-label">Risk Profile</span>
                <span className="summary-val">
                  <i className="ti ti-circle-check" aria-hidden="true" />
                  {displayScore} · {riskAppetite}
                </span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">KYC Status</span>
              <span className="summary-val">
                <i className="ti ti-circle-check" aria-hidden="true" />
                Verified
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Bank</span>
              <span className="summary-val">
                <i className={bankVerified ? "ti ti-circle-check" : "ti ti-clock"} aria-hidden="true" />
                {bankVerified ? "Verified" : "Not connected"}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Email</span>
              <span className="summary-val">
                <i className={emailVerified ? "ti ti-circle-check" : "ti ti-clock"} aria-hidden="true" />
                {emailVerified ? "Verified" : "Not connected"}
              </span>
            </div>
            <div className="summary-row">
              <span className="summary-label">Nominee</span>
              <span className="summary-val">
                <i className={nomineeVerified ? "ti ti-circle-check" : "ti ti-clock"} aria-hidden="true" />
                {nomineeVerified ? "Verified" : "Not connected"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onReset}
            className="btn-primary btn-wide"
          >
            Go to Dashboard <i className="ti ti-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}
