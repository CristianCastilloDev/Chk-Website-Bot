import dotenv from 'dotenv';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Load environment variables
dotenv.config();

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.VITE_FIREBASE_DATABASE_URL,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Seed initial plans
const seedInitialPlans = async () => {
    const plans = [
        {
            name: 'Free',
            type: 'free',
            price: 0,
            credits: 10,
            features: [
                '10 credits per month',
                'Basic analytics',
                'Email support',
                'Community access'
            ],
            popular: false,
            active: true
        },
        {
            name: 'Monthly Pro',
            type: 'monthly',
            price: 29,
            credits: 100,
            features: [
                '100 credits per month',
                'Advanced analytics',
                'Priority support',
                'API access',
                'Custom integrations'
            ],
            popular: true,
            active: true
        },
        {
            name: 'Annual Pro',
            type: 'annual',
            price: 290,
            credits: 1200,
            features: [
                '1200 credits per year',
                'Advanced analytics',
                'Priority support',
                'API access',
                'Custom integrations',
                '2 months free'
            ],
            popular: false,
            active: true
        },
        {
            name: 'Lifetime',
            type: 'lifetime',
            price: 999,
            credits: 10000,
            features: [
                '10,000 credits (one-time)',
                'Lifetime access',
                'All features included',
                'Priority support',
                'API access',
                'Custom integrations',
                'Early access to new features'
            ],
            popular: false,
            active: true
        }
    ];

    for (const plan of plans) {
        const planRef = doc(collection(db, 'plans'));
        const newPlan = {
            ...plan,
            createdAt: serverTimestamp()
        };
        await setDoc(planRef, newPlan);
        console.log(`✅ Created plan: ${plan.name}`);
    }
};

// Main initialization function
const initializeFirebase = async () => {
    try {
        console.log('🔥 Initializing Firebase...');
        console.log('📦 Seeding initial plans...');

        await seedInitialPlans();

        console.log('\n✅ Firebase initialized successfully!');
        console.log('📋 Plans created:');
        console.log('  - Free (10 credits)');
        console.log('  - Monthly Pro (100 credits - $29)');
        console.log('  - Annual Pro (1200 credits - $290)');
        console.log('  - Lifetime (10,000 credits - $999)');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        process.exit(1);
    }
};

// Run the initialization
initializeFirebase();
