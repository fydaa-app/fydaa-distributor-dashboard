import Link from "next/link";
import React from "react";

interface BreadcrumbProps {
  pageTitle: string;
  parentTitle?: string;
  parentHref?: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({
  pageTitle,
  parentTitle,
  parentHref,
}) => {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-black text-[var(--arn-txt)] sm:text-base">
        {pageTitle}
      </h2>
      <nav>
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--arn-txt-3)] hover:text-[var(--arn-amber)]"
              href="/"
            >
              Home
              <svg
                className="stroke-current"
                width="15"
                height="14"
                viewBox="0 0 17 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  stroke="currentColor"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>
          {parentTitle && parentHref ? (
            <>
              <li>
                <Link
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--arn-txt-3)] hover:text-[var(--arn-amber)]"
                  href={parentHref}
                >
                  {parentTitle}
                  <svg
                    className="stroke-current"
                    width="15"
                    height="14"
                    viewBox="0 0 17 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </li>
            </>
          ) : null}
          <li className="text-xs font-semibold text-[var(--arn-txt)]">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
};

export default PageBreadcrumb;
