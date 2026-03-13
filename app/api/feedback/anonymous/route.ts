import { NextResponse } from 'next/server';
// Trigger TS refresh
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { competitionName, overallRating, ratings, suggestions } = data;

    if (!competitionName || overallRating === undefined || !ratings || !suggestions) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    if (typeof overallRating !== 'number' || overallRating < 0 || overallRating > 10) {
      return NextResponse.json({ success: false, error: 'Invalid overall rating' }, { status: 400 });
    }

    const feedback = await prisma.anonymousFeedback.create({
      data: {
        competitionName,
        overallRating,
        ratings,
        suggestions,
      },
    });

    return NextResponse.json({ success: true, data: feedback }, { status: 201 });
  } catch (error) {
    console.error('Error submitting anonymous feedback:', error);
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
  }
}
