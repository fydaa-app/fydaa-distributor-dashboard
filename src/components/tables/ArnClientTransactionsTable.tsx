import ArnStatusTag from "@/components/common/ArnStatusTag";
import type { ArnTransaction } from "@/types/arnClient";

interface ArnClientTransactionsTableProps {
  transactions: ArnTransaction[];
}

function getTransactionLabel(type: ArnTransaction["type"]) {
  if (type === "lumpsum") return "Lumpsum";
  if (type === "redemption") return "Redemption";
  if (type === "switch") return "Switch";
  return "SIP";
}

export default function ArnClientTransactionsTable({ transactions }: ArnClientTransactionsTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-[14px] bg-[var(--arn-bg-2)] p-5 text-center text-sm text-[var(--arn-txt-2)]">
        No transactions available.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-[640px] w-full table-fixed border-collapse text-left text-sm">
        <thead>
          <tr>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Date</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Fund</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-left text-xs font-normal text-[var(--arn-txt-3)]">Type</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">Amount</th>
            <th className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-xs font-normal text-[var(--arn-txt-3)]">Units</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={`${transaction.date}-${transaction.fundName}-${transaction.amount}`}>
              <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt-3)]">{transaction.date}</td>
              <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-[var(--arn-txt)]">{transaction.fundName}</td>
              <td className="border-b border-[var(--arn-bdr)] px-4 py-3">
                <ArnStatusTag label={getTransactionLabel(transaction.type)} variant={transaction.type === "sip" ? "sip" : transaction.type === "lumpsum" ? "valuation" : "teal"} />
              </td>
              <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-[var(--arn-txt)]">{transaction.amount}</td>
              <td className="border-b border-[var(--arn-bdr)] px-4 py-3 text-right text-[var(--arn-txt-3)]">{transaction.units}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
