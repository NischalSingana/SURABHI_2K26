'use client';

import { useState } from 'react';
import { FiStar } from 'react-icons/fi';
import { FEEDBACK_RATING_FIELDS, type FeedbackRatings, type RatingKey } from "@/lib/feedback";

const initialRatings: FeedbackRatings = {
  competition: 0,
  experience: 0,
  hospitality: 0,
  fairJudgement: 0,
  organization: 0,
  venue: 0,
};

export default function AnonymousFeedbackPage() {
  const [competitionName, setCompetitionName] = useState('');
  const [overallRating, setOverallRating] = useState(0);
  const [ratings, setRatings] = useState<FeedbackRatings>(initialRatings);
  const [suggestions, setSuggestions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSliderChange = (key: RatingKey, value: number) => {
    setRatings((p) => ({ ...p, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionName || !suggestions) {
      setError('Please fill out all fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/feedback/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          competitionName,
          overallRating,
          ratings,
          suggestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback');
      }

      setSuccess(true);
      setCompetitionName('');
      setOverallRating(0);
      setRatings(initialRatings);
      setSuggestions('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16">
      <div className="max-w-3xl mx-auto">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Header Section */}
          <div className="px-6 py-8 md:p-10 border-b border-zinc-800">
            <h1 className="text-3xl font-extrabold text-white text-center mb-6">
              Surabhi 2026 Feedback
            </h1>

            {/* Disclaimer */}
            <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-r-lg">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-amber-200 leading-relaxed font-medium">
                    We value your feedback. Please provide genuine feedback so that it helps us improve and give you a better experience next time. Your name and personal details are not recorded while submitting feedback.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Section */}
          <div className="p-6 md:p-10 bg-zinc-900/50">
            {success ? (
              <div className="text-center py-10">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 mb-6">
                  <svg className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
                <p className="text-zinc-400 mb-8">Your anonymous feedback has been submitted successfully.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex justify-center py-2.5 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-black bg-white hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 focus:ring-offset-black transition-colors"
                >
                  Submit Another Feedback
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                {error && (
                  <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-lg">
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="competitionName" className="block text-sm font-medium text-zinc-300 mb-2">
                    Competition Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="competitionName"
                    value={competitionName}
                    onChange={(e) => setCompetitionName(e.target.value)}
                    required
                    maxLength={100}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors"
                    placeholder="Which competition did you participate in?"
                  />
                </div>

                {/* Overall Rating (0-10) */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-3">
                    Overall Rating <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOverallRating((v) => Math.max(0, v - 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-lg font-bold transition-colors shrink-0"
                    >
                      −
                    </button>
                    <div className="relative flex-1 flex items-center min-w-0">
                      <div className="absolute left-0 right-0 h-3 rounded-full bg-zinc-700" />
                      <div
                        className="absolute left-0 h-3 rounded-full bg-red-500 transition-all duration-150"
                        style={{ width: `${(overallRating / 10) * 100}%` }}
                      />
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={overallRating}
                        onChange={(e) => setOverallRating(parseInt(e.target.value, 10))}
                        className="relative z-10 w-full h-3 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOverallRating((v) => Math.min(10, v + 1))}
                      className="w-9 h-9 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-lg font-bold transition-colors shrink-0"
                    >
                      +
                    </button>
                    <span className="flex items-center gap-1 text-xl font-bold text-red-500 min-w-[4rem] shrink-0">
                      <FiStar className="fill-red-500" size={20} />
                      {overallRating}/10
                    </span>
                  </div>
                </div>

                {/* Detailed Category Ratings */}
                <div className="space-y-4 pt-2">
                  <label className="block text-sm font-medium text-zinc-300">
                    Rate each aspect (0–10)
                  </label>
                  {FEEDBACK_RATING_FIELDS.map((field) => {
                    const val = ratings[field.key] ?? 0;
                    return (
                      <div key={field.key}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm text-zinc-400">{field.label}</span>
                          <span className="text-sm font-medium text-red-500">{val}/10</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSliderChange(field.key, Math.max(0, val - 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-base font-bold transition-colors shrink-0"
                          >
                            −
                          </button>
                          <div className="relative flex-1 flex items-center min-w-0">
                            <div className="absolute left-0 right-0 h-2 rounded-full bg-zinc-700" />
                            <div
                              className="absolute left-0 h-2 rounded-full bg-red-500 transition-all duration-150"
                              style={{ width: `${(val / 10) * 100}%` }}
                            />
                            <input
                              type="range"
                              min={0}
                              max={10}
                              value={val}
                              onChange={(e) => handleSliderChange(field.key, parseInt(e.target.value, 10))}
                              className="relative z-10 w-full h-2 bg-transparent appearance-none cursor-pointer [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:-mt-1 [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-red-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSliderChange(field.key, Math.min(10, val + 1))}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-600 hover:bg-zinc-700 text-zinc-300 hover:text-white text-base font-bold transition-colors shrink-0"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div>
                  <label htmlFor="suggestions" className="block text-sm font-medium text-zinc-300 mb-2 mt-4">
                    Suggestions / Comments <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="suggestions"
                    value={suggestions}
                    onChange={(e) => setSuggestions(e.target.value)}
                    required
                    rows={4}
                    maxLength={1000}
                    className="w-full bg-black border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors resize-none"
                    placeholder="Please share your genuine thoughts, suggestions, or issues..."
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
