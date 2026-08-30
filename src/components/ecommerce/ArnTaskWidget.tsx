"use client";

import { useEffect, useRef, useState } from "react";
import ArnCardHeader from "@/components/common/ArnCardHeader";
import ArnTaskItem from "@/components/common/ArnTaskItem";

type TaskTag = "Review" | "KYC" | "SIP" | "Call";

interface DashboardTask {
  id: string;
  text: string;
  tag: TaskTag;
  done: boolean;
}

const STORAGE_KEY = "fydaa_dashboard_tasks";

const defaultTasks: DashboardTask[] = [];

const TAG_OPTIONS: TaskTag[] = ["Review", "KYC", "SIP", "Call"];

export default function ArnTaskWidget() {
  const [taskState, setTaskState] = useState<DashboardTask[]>(defaultTasks);
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState("");
  const [newTag, setNewTag] = useState<TaskTag>("SIP");

  const skipFirstPersist = useRef(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setTaskState(JSON.parse(raw) as DashboardTask[]);
    } catch {
      /* ignore corrupt cache */
    }
  }, []);

  useEffect(() => {
    if (skipFirstPersist.current) {
      skipFirstPersist.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(taskState));
    } catch {
      /* ignore quota errors */
    }
  }, [taskState]);

  const toggleTask = (id: string) =>
    setTaskState((cur) =>
      cur.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );

  const removeTask = (id: string) =>
    setTaskState((cur) => cur.filter((t) => t.id !== id));

  const addTask = () => {
    const text = newText.trim();
    if (!text) return;
    setTaskState((cur) => [
      ...cur,
      { id: `t${Date.now()}`, text, tag: newTag, done: false },
    ]);
    setNewText("");
    setNewTag("SIP");
    setAdding(false);
  };

  const remaining = taskState.filter((t) => !t.done).length;

  return (
    <div className="rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] p-5 dark:border-[var(--arn-bdr)] dark:bg-[var(--arn-bg)] sm:p-6">
      <ArnCardHeader
        title="Today's tasks"
        action={
          <button
            type="button"
            onClick={() => setAdding((v) => !v)}
            className="text-xs font-bold text-[var(--arn-amber)] sm:text-sm"
          >
            + Add
          </button>
        }
      />

      {adding && (
        <div className="mb-3 flex flex-col gap-2">
          <input
            className="field-input"
            placeholder="Task description"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
          />
          <div className="flex gap-2">
            <select
              className="field-select"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value as TaskTag)}
            >
              {TAG_OPTIONS.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
            <button type="button" onClick={addTask} className="btn-primary">
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col">
        {taskState.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--arn-txt-3)]">
            No tasks for today.
          </p>
        ) : (
          taskState.map((task) => (
            <ArnTaskItem
              key={task.id}
              text={task.text}
              tag={task.tag}
              done={task.done}
              onToggle={() => toggleTask(task.id)}
              onRemove={() => removeTask(task.id)}
            />
          ))
        )}
      </div>

      {taskState.length > 0 && (
        <p className="mt-3 text-xs text-[var(--arn-txt-3)]">{remaining} remaining</p>
      )}
    </div>
  );
}
