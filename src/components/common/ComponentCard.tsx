import React from "react";

interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc,
}) => {
  return (
    <div className={`rounded-[16px] border border-[var(--arn-bdr)] bg-[var(--arn-bg)] ${className}`}>
      {(title || desc) && (
        <div className="border-b border-[var(--arn-bdr)] px-5 py-4 sm:px-6 sm:py-5">
          {title && (
            <h3 className="text-sm font-black text-[var(--arn-txt)] sm:text-base">
              {title}
            </h3>
          )}
          {desc && (
            <p className="mt-1 text-xs font-medium text-[var(--arn-txt-2)] sm:text-sm">
              {desc}
            </p>
          )}
        </div>
      )}

      <div className="p-5 sm:p-6">
        {children}
      </div>
    </div>
  );
};

export default ComponentCard;
