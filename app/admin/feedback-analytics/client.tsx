'use client';

import { useState } from 'react';
import { AnonymousFeedback } from '@prisma/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { FEEDBACK_RATING_FIELDS, FeedbackRatings } from '@/lib/feedback';

interface ClientProps {
  initialFeedbacks: AnonymousFeedback[];
}

export default function FeedbackAnalyticsClient({ initialFeedbacks }: ClientProps) {
  const [feedbacks] = useState<AnonymousFeedback[]>(initialFeedbacks);

  // Calculate stats
  const totalFeedback = feedbacks.length;
  const avgRating = totalFeedback > 0
    ? (feedbacks.reduce((acc, f) => acc + f.overallRating, 0) / totalFeedback).toFixed(1)
    : '0';

  // Calculate rating distribution for charts (0-10 scale)
  const ratingDistribution = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => ({
    star,
    count: feedbacks.filter(f => f.overallRating === star).length,
  })).reverse(); // 10 stars first
  
  const maxCount = Math.max(...ratingDistribution.map(d => d.count), 1);

  const downloadReport = () => {
    const doc = new jsPDF('landscape');

    // Report Header
    doc.setFontSize(22);
    doc.setTextColor(220, 38, 38); // Red color
    doc.text('Surabhi 2026', 14, 22);

    doc.setFontSize(16);
    doc.setTextColor(40, 40, 40);
    doc.text('Anonymous Feedback Analytics Report', 14, 32);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${format(new Date(), 'PPpp')}`, 14, 40);

    // Summary Stats
    doc.setFontSize(14);
    doc.setTextColor(30, 30, 30);
    doc.text('Summary Statistics:', 14, 55);
    
    doc.setFontSize(12);
    doc.setTextColor(60, 60, 60);
    doc.text(`Total Feedback Submissions: ${totalFeedback}`, 14, 65);
    doc.text(`Average Overall Rating: ${avgRating} / 10.0`, 14, 72);

    // Prepare table data
    const tableColumn = [
      "Date", 
      "Competition", 
      "Overall", 
      "Competition",
      "Experience",
      "Hospitality",
      "Judgement",
      "Organization",
      "Venue",
      "Suggestions"
    ];

    const tableRows = feedbacks.map(feedback => {
      const parsedRatings = feedback.ratings as unknown as FeedbackRatings;
      return [
        format(new Date(feedback.createdAt), 'MMM dd, yHH:mm'),
        feedback.competitionName,
        `${feedback.overallRating}/10`,
        `${parsedRatings.competition ?? '-'}/10`,
        `${parsedRatings.experience ?? '-'}/10`,
        `${parsedRatings.hospitality ?? '-'}/10`,
        `${parsedRatings.fairJudgement ?? '-'}/10`,
        `${parsedRatings.organization ?? '-'}/10`,
        `${parsedRatings.venue ?? '-'}/10`,
        feedback.suggestions
      ];
    });

    // Generate Table
    autoTable(doc, {
      startY: 85,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 3,
        overflow: 'linebreak',
      },
      headStyles: {
        fillColor: [220, 38, 38], // Red header
        textColor: 255,
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 25 }, // Date
        1: { cellWidth: 35 }, // Competition
        2: { cellWidth: 15 }, // Overall
        3: { cellWidth: 20 }, // Competition Quality
        4: { cellWidth: 20 }, // Experience
        5: { cellWidth: 20 }, // Hospitality
        6: { cellWidth: 20 }, // Judgement
        7: { cellWidth: 22 }, // Organization
        8: { cellWidth: 15 }, // Venue
        9: { cellWidth: 'auto' }, // Suggestions Takes remaining space
      },
      alternateRowStyles: {
        fillColor: [245, 245, 245]
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    }

    doc.save(`Surabhi_Feedback_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  return (
    <div className="space-y-8">
      {/* Top action bar */}
      <div className="flex justify-end">
        <button
          onClick={downloadReport}
          disabled={totalFeedback === 0}
          className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-red-600/20 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Download Feedback Report</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stats Summary Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
            <h3 className="text-zinc-400 font-medium mb-1">Total Submissions</h3>
            <p className="text-4xl font-bold text-white">{totalFeedback}</p>
          </div>
          
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-zinc-400 font-medium mb-1">Average Overall Rating</h3>
              <div className="flex items-baseline space-x-2">
                <p className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-500">
                  {avgRating}
                </p>
                <span className="text-xl text-zinc-500 font-medium">/ 10</span>
              </div>
            </div>
            {/* Background decorative rating */}
            <svg className="absolute -right-4 -bottom-4 w-32 h-32 text-zinc-800/50 -rotate-12" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        </div>

        {/* Visual Analytics Bar Chart */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-zinc-400 font-medium mb-6">Overall Rating Distribution</h3>
          <div className="space-y-3 pb-2 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
            {ratingDistribution.map(({ star, count }) => (
              <div key={star} className="flex items-center text-sm">
                <div className="w-12 flex items-center justify-end mr-4 text-zinc-400 font-medium">
                  {star} <span className="text-yellow-500 ml-1">★</span>
                </div>
                <div className="flex-1 bg-black rounded-full h-3 overflow-hidden border border-zinc-800">
                  <div 
                    className={`h-full rounded-full transition-all duration-1000 ${
                      star >= 7 ? 'bg-green-500' : star >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${count > 0 ? (count / maxCount) * 100 : 0}%` }}
                  ></div>
                </div>
                <div className="w-12 text-right ml-4 text-zinc-300 font-medium">
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Feedback List */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-zinc-800">
          <h3 className="text-lg font-medium text-white">Recent Feedback</h3>
        </div>
        
        {feedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-zinc-400 font-medium">No feedback submitted yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {feedbacks.map((item) => {
              const parsedRatings = item.ratings as unknown as FeedbackRatings;
              
              return (
              <div key={item.id} className="p-6 hover:bg-zinc-800/30 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-4">
                  <div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 mb-2">
                      {item.competitionName}
                    </span>
                    <p className="text-xs text-zinc-500 mt-1">
                      {format(new Date(item.createdAt), 'MMM dd, yyyy • hh:mm a')}
                    </p>
                  </div>
                  <div className="mt-2 md:mt-0 flex items-center">
                    <span className="text-sm text-zinc-400 mr-2">Overall:</span>
                    <span className="text-lg font-bold text-white bg-zinc-800 px-3 py-1 rounded-lg border border-zinc-700">
                      {item.overallRating} <span className="text-yellow-500 text-sm">★</span>
                    </span>
                  </div>
                </div>

                {/* Sub-ratings Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-black/40 p-4 rounded-lg border border-zinc-800">
                  {FEEDBACK_RATING_FIELDS.map((field) => (
                    <div key={field.key} className="flex justify-between items-center text-xs">
                      <span className="text-zinc-400 truncate pr-2">{field.label}</span>
                      <span className="text-zinc-200 font-medium bg-zinc-800/80 px-2 py-0.5 rounded">
                        {parsedRatings[field.key] ?? '-'}/10
                      </span>
                    </div>
                  ))}
                </div>

                <div className="text-sm text-zinc-300 whitespace-pre-wrap">
                  <span className="font-medium text-zinc-500 block mb-1">Suggestions:</span>
                  {item.suggestions}
                </div>
              </div>
            )})}
          </div>
        )}
      </div>
    </div>
  );
}
