import { apps, credential } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!apps.length) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_APPLICATION_CREDENTIALS ||"{}");

    initializeApp({
        credential: credential.cert(serviceAccount),
        databaseURL: "https://extend-ai.firebaseio.com"
    });
}

export const db = getFirestore();
