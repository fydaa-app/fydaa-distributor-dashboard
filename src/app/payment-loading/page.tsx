import { Metadata } from "next";
import ArnLoadingState from "@/components/common/ArnLoadingState";

export const metadata: Metadata = {
  title: "Loading Payment Screen | Fydaa",
  description: "Loading your payment",
};

export default function PaymentLoadingPage() {
  return <ArnLoadingState label="Loading payment screen..." />;
}