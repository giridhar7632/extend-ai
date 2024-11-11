import { SummarySchema } from "@/app/InputForm";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import crypto from "crypto"
import { Firestore } from "firebase-admin/firestore";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getCurrentTime() {
  return Date.now() / 1000
}

export function hashUrl(url: string) {
  return crypto.createHash('sha256').update(url).digest('hex');
}

export const parseSummary = (summary: string) => {
  const cleanedSummary = summary.replace(/```json\n|```/g, "");
  return JSON.parse(cleanedSummary);
}

export const errorHandler = (error: Error) => {
  console.error(error.message)

  if (error.name === 'CastError') {
      return Response.json({ error: 'malformatted id' }, { status: 400 })
  } else if (error.name === 'ValidationError') {
      return Response.json({ error: error.message }, { status: 400 })
  } else if (error.name === 'JsonWebTokenError') {
      return Response.json({ error: 'invalid token' }, { status: 401 })
  } else if (error.name === 'TokenExpiredError') {
      return Response.json({ error: 'token expired' }, { status: 401 })
  } else {
      return Response.json({ error: 'internal server error' }, { status: 500 })
  }
}

export async function insertUrlData(db: Firestore, url: string, urlRecord: SummarySchema) {
  try {
    const urlHash = hashUrl(url);
    const urlRef = db.doc(`urls/${urlHash}`);
    await urlRef.set({ ...urlRecord, updatedAt: new Date() });
  } catch (error) {
    console.error('Error inserting URL data:', error);
  }
}

export async function getUrlData(db: Firestore, url: string) {
  const urlHash = hashUrl(url);
  const doc = await db.collection('urls').doc(urlHash).get();

  if (doc.exists) {
    return doc.data();
  } else {
    return null;
  }
}
