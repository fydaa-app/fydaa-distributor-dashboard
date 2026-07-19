import ArnProgressBar from "@/components/common/ArnProgressBar";
import type { ArnGoal } from "@/types/arnClient";

interface ArnClientGoalsListProps {
  goals: ArnGoal[];
}

export default function ArnClientGoalsList({ goals }: ArnClientGoalsListProps) {
  if (goals.length === 0) {
    return (
      <div className="rounded-[12px] bg-[var(--arn-bg-2)] p-5 text-center text-xs text-[var(--arn-txt-2)]">
        No goals available.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {goals.map((goal, index) => (
        <div key={goal.name}>
          <div className="mb-2 text-sm font-bold text-[var(--arn-txt)]">{goal.name}</div>
          <div className="mb-2 flex justify-between text-sm text-[var(--arn-txt-2)]">
            <span>{goal.saved} saved</span>
            <span>
              {goal.target} target{goal.termName ? ` · ${goal.termName}` : ""}
              {goal.nextInstallmentDate ? ` · Due: ${goal.nextInstallmentDate}` : ""}
            </span>
          </div>
          <ArnProgressBar value={goal.progressPercent} color={["#BA7517", "#185FA5", "#3B6D11", "#0F6E56", "#534AB7", "#A32D2D"][index % 6]} />
        </div>
      ))}
    </div>
  );
}
