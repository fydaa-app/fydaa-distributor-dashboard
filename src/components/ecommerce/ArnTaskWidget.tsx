"use client";

import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnTaskItem from "@/components/common/ArnTaskItem";
import { useState } from "react";

type TaskTag = "Review" | "KYC" | "SIP" | "Call";

interface DashboardTask {
  id: string;
  text: string;
  tag: TaskTag;
  done: boolean;
}

const tasks: DashboardTask[] = [
  { id: "t1", text: "Send Q1 review to Rahul", tag: "Review", done: true },
  { id: "t2", text: "KYC docs follow-up — Priya", tag: "KYC", done: false },
  { id: "t3", text: "Reactivate Sunita's SIP", tag: "SIP", done: false },
  { id: "t4", text: "Onboarding call — Mohit, 5 PM", tag: "Call", done: false },
  { id: "t5", text: "Share SIP link with Nidhi", tag: "SIP", done: false },
];

export default function ArnTaskWidget() {
  const [taskState, setTaskState] = useState(tasks);

  const toggleTask = (id: string) => {
    setTaskState((current) =>
      current.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
    );
  };

  return (
    <div className="rounded-[16px] border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-[#1c1c1a] sm:p-6">
      <ArnCardHeader
        title="Today's tasks"
        action={<button className="text-xs font-bold text-[#BA7517] sm:text-sm">+ Add</button>}
      />
      <div className="flex flex-col">
        {taskState.map((task) => (
          <ArnTaskItem
            key={task.id}
            text={task.text}
            tag={task.tag}
            done={task.done}
            onToggle={() => toggleTask(task.id)}
          />
        ))}
      </div>
    </div>
  );
}
