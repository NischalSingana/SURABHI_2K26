"use client";

import { useState, useEffect } from "react";
import { FiX } from "react-icons/fi";

const AUTO_CLOSE_MS = 2500;

type Props = {
  missingFields: string[];
  message: string;
};

export default function ProfileCompleteBanner({ missingFields, message }: Props) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), AUTO_CLOSE_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-500 max-w-md w-full px-4">
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-6 py-4 shadow-xl backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-amber-300 font-semibold text-sm mb-1">
              Complete Your Profile
            </h3>
            <p className="text-amber-200/80 text-xs leading-relaxed mb-2">
              {message}
            </p>
            <ul className="text-amber-200/90 text-xs space-y-1 ml-4 list-disc">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="flex-shrink-0 p-1 rounded hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 transition-colors"
            aria-label="Close"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
