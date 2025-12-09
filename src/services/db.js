import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  increment
} from 'firebase/firestore';
import { db } from './firebase';

// ========== USER MANAGEMENT ==========



export const createUserDocument = async (uid, userData) => {
  try {
    const userRef = doc(db, 'users', uid);
    const newUser = {
      username: userData.username || '',
      name: userData.name || '',
      email: userData.email,
      role: userData.role || 'miembro',
      credits: userData.credits || 10,
      plan: userData.plan || null,
      planExpiresAt: userData.planExpiresAt || null,
      avatar: userData.avatar || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(userRef, newUser);
    return { id: uid, ...newUser };
  } catch (error) {
    console.error('Error creating user document:', error);
    throw error;
  }
};

export const getUserDocument = async (uid) => {
  try {
    console.log('🔍 Getting user document for UID:', uid);
    const userRef = doc(db, 'users', uid);
    console.log('📍 User ref path:', userRef.path);
    const userSnap = await getDoc(userRef);
    console.log('📦 User snap exists:', userSnap.exists());

    if (userSnap.exists()) {
      const rawData = userSnap.data();
      console.log('🔬 Raw data from Firestore:', rawData);
      console.log('🔬 Raw data keys:', Object.keys(rawData));

      const userData = {
        id: userSnap.id,
        ...rawData,
        // Ensure timestamps are properly converted
        createdAt: rawData.createdAt,
        updatedAt: rawData.updatedAt,
        planExpiresAt: rawData.planExpiresAt
      };
      console.log('✅ User data retrieved:', userData);
      return userData;
    }
    console.warn('⚠️ User document does not exist for UID:', uid);
    return null;
  } catch (error) {
    console.error('❌ Error getting user document:', error);
    throw error;
  }
};

export const updateUserDocument = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user document:', error);
    throw error;
  }
};


export const getAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnap = await getDocs(usersRef);
    const users = [];
    usersSnap.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

export const getUsersByRole = async (role) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const usersSnap = await getDocs(q);
    const users = [];
    usersSnap.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return users;
  } catch (error) {
    console.error('Error getting users by role:', error);
    throw error;
  }
};

// ========== CREDITS MANAGEMENT ==========

export const addCredits = async (uid, amount, description = 'Credits added') => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      credits: increment(amount),
      updatedAt: serverTimestamp()
    });
    await createTransaction({
      userId: uid,
      type: 'purchase',
      credits: amount,
      description
    });
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

export const deductCredits = async (uid, amount, description = 'Credits used') => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found');
    }
    const currentCredits = userSnap.data().credits || 0;
    if (currentCredits < amount) {
      throw new Error('Insufficient credits');
    }
    await updateDoc(userRef, {
      credits: increment(-amount),
      updatedAt: serverTimestamp()
    });
    await createTransaction({
      userId: uid,
      type: 'usage',
      credits: -amount,
      description
    });
    return true;
  } catch (error) {
    console.error('Error deducting credits:', error);
    throw error;
  }
};

export const getCreditsBalance = async (uid) => {
  try {
    const user = await getUserDocument(uid);
    return user?.credits || 0;
  } catch (error) {
    console.error('Error getting credits balance:', error);
    throw error;
  }
};

// Update user credits (for Gates usage)
export const updateUserCredits = async (uid, newCredits) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      credits: newCredits,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user credits:', error);
    throw error;
  }
};

// ========== PLANS MANAGEMENT ==========

export const getPlans = async () => {
  try {
    const plansRef = collection(db, 'plans');
    const q = query(plansRef, where('active', '==', true));
    const plansSnap = await getDocs(q);
    const plans = [];
    plansSnap.forEach((doc) => {
      plans.push({ id: doc.id, ...doc.data() });
    });
    return plans.sort((a, b) => a.price - b.price);
  } catch (error) {
    console.error('Error getting plans:', error);
    throw error;
  }
};

export const getPlan = async (planId) => {
  try {
    const planRef = doc(db, 'plans', planId);
    const planSnap = await getDoc(planRef);
    if (planSnap.exists()) {
      return { id: planSnap.id, ...planSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting plan:', error);
    throw error;
  }
};

export const createPlan = async (planData) => {
  try {
    const planRef = doc(collection(db, 'plans'));
    const newPlan = {
      name: planData.name,
      type: planData.type,
      price: planData.price,
      credits: planData.credits,
      features: planData.features || [],
      popular: planData.popular || false,
      active: planData.active !== undefined ? planData.active : true,
      createdAt: serverTimestamp()
    };
    await setDoc(planRef, newPlan);
    return { id: planRef.id, ...newPlan };
  } catch (error) {
    console.error('Error creating plan:', error);
    throw error;
  }
};

// ========== TRANSACTIONS ==========

export const createTransaction = async (transactionData) => {
  try {
    const transactionRef = doc(collection(db, 'transactions'));
    const newTransaction = {
      userId: transactionData.userId,
      type: transactionData.type,
      credits: transactionData.credits,
      description: transactionData.description,
      createdAt: serverTimestamp()
    };
    await setDoc(transactionRef, newTransaction);
    return { id: transactionRef.id, ...newTransaction };
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
};

export const getUserTransactions = async (uid) => {
  try {
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', uid),
      orderBy('createdAt', 'desc')
    );
    const transactionsSnap = await getDocs(q);
    const transactions = [];
    transactionsSnap.forEach((doc) => {
      transactions.push({ id: doc.id, ...doc.data() });
    });
    return transactions;
  } catch (error) {
    console.error('Error getting user transactions:', error);
    throw error;
  }
};

// ========== DASHBOARD DATA ==========

export const getDashboardData = () => {
  return {
    stats: {
      totalUsers: 1248,
      revenue: 45231,
      growth: 12.5,
      activeUsers: 892
    },
    analytics: {
      userGrowth: [
        { month: 'Jan', users: 400 },
        { month: 'Feb', users: 600 },
        { month: 'Mar', users: 800 },
        { month: 'Apr', users: 1000 },
        { month: 'May', users: 1100 },
        { month: 'Jun', users: 1248 }
      ],
      revenue: [
        { month: 'Jan', revenue: 20000 },
        { month: 'Feb', revenue: 25000 },
        { month: 'Mar', revenue: 30000 },
        { month: 'Apr', revenue: 35000 },
        { month: 'May', revenue: 40000 },
        { month: 'Jun', revenue: 45231 }
      ],
      traffic: [
        { name: 'Direct', value: 400 },
        { name: 'Social', value: 300 },
        { name: 'Organic', value: 300 },
        { name: 'Referral', value: 200 }
      ]
    }
  };
};

// ========== SALES MANAGEMENT ==========

export const createSaleRecord = async (saleData) => {
  try {
    const saleRef = doc(collection(db, 'sales'));
    const sale = {
      adminId: saleData.adminId,
      adminName: saleData.adminName,
      userId: saleData.userId,
      userName: saleData.userName,
      type: saleData.type,
      creditsAdded: saleData.creditsAdded || 0,
      planAdded: saleData.planAdded || null,
      planDuration: saleData.planDuration || null,
      previousBalance: saleData.previousBalance,
      newBalance: saleData.newBalance,
      previousPlan: saleData.previousPlan || null,
      newPlan: saleData.newPlan || null,
      amount: saleData.amount || 0,
      timestamp: serverTimestamp(),
      notes: saleData.notes || ''
    };
    await setDoc(saleRef, sale);
    return { id: saleRef.id, ...sale };
  } catch (error) {
    console.error('Error creating sale record:', error);
    throw error;
  }
};

export const addCreditsToUser = async (userId, creditsToAdd, adminId, adminName) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    const userData = userSnap.data();
    const previousBalance = userData.credits || 0;
    const newBalance = previousBalance + creditsToAdd;
    await updateDoc(userRef, {
      credits: newBalance,
      updatedAt: serverTimestamp()
    });
    await createSaleRecord({
      adminId,
      adminName,
      userId,
      userName: userData.name,
      type: 'credits',
      creditsAdded: creditsToAdd,
      previousBalance,
      newBalance
    });
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

export const addPlanToUser = async (userId, planDuration, adminId, adminName) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User not found');
    const userData = userSnap.data();
    const now = new Date();
    let newExpirationDate;
    if (userData.planExpiresAt) {
      const currentExpiration = userData.planExpiresAt.toDate();
      newExpirationDate = new Date(currentExpiration.getTime() + planDuration * 24 * 60 * 60 * 1000);
    } else {
      newExpirationDate = new Date(now.getTime() + planDuration * 24 * 60 * 60 * 1000);
    }
    const planName = planDuration === 7 ? 'Semanal' : planDuration === 30 ? 'Mensual' : `${planDuration} Días`;
    await updateDoc(userRef, {
      planExpiresAt: Timestamp.fromDate(newExpirationDate),
      planDuration: (userData.planDuration || 0) + planDuration,
      updatedAt: serverTimestamp()
    });
    await createSaleRecord({
      adminId,
      adminName,
      userId,
      userName: userData.name,
      type: 'plan',
      planAdded: planName,
      planDuration,
      previousBalance: userData.credits || 0,
      newBalance: userData.credits || 0,
      previousPlan: userData.plan || 'Free',
      newPlan: planName
    });
    return true;
  } catch (error) {
    console.error('Error adding plan:', error);
    throw error;
  }
};

export const getAllSales = async () => {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, orderBy('timestamp', 'desc'));
    const salesSnap = await getDocs(q);
    const sales = [];
    salesSnap.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    return sales;
  } catch (error) {
    console.error('Error getting sales:', error);
    return [];
  }
};

export const getUserSales = async (userId) => {
  try {
    const salesRef = collection(db, 'sales');
    const q = query(salesRef, where('userId', '==', userId), orderBy('timestamp', 'desc'));
    const salesSnap = await getDocs(q);
    const sales = [];
    salesSnap.forEach((doc) => {
      sales.push({ id: doc.id, ...doc.data() });
    });
    return sales;
  } catch (error) {
    console.error('Error getting user sales:', error);
    return [];
  }
};

export const getUserLifetimeStats = async (userId) => {
  try {
    const sales = await getUserSales(userId);
    let totalCreditsAdded = 0;
    let totalMoneySpent = 0;
    sales.forEach(sale => {
      if (sale.type === 'credits') {
        totalCreditsAdded += sale.creditsAdded || 0;
      }
      totalMoneySpent += sale.amount || 0;
    });
    return {
      totalCreditsAdded,
      totalMoneySpent,
      totalTransactions: sales.length,
      lastPurchase: sales[0] || null
    };
  } catch (error) {
    console.error('Error getting user lifetime stats:', error);
    return {
      totalCreditsAdded: 0,
      totalMoneySpent: 0,
      totalTransactions: 0,
      lastPurchase: null
    };
  }
};

// ========== PERMISSION VERIFICATION ==========

export const verifyDevPermissions = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('Usuario no encontrado');
    }
    const userData = userSnap.data();
    if (userData.role !== 'dev') {
      throw new Error('Solo los usuarios Dev pueden realizar esta acción');
    }
    return userData;
  } catch (error) {
    console.error('Error verifying dev permissions:', error);
    throw error;
  }
};

export const updateUserRole = async (userId, newRole, adminId) => {
  try {
    await verifyDevPermissions(adminId);
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
};


// ========== USERNAME FUNCTIONS ==========

export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') return false;
  if (username.length < 3 || username.length > 20) return false;
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  return usernameRegex.test(username);
};

export const getUserByUsername = async (username) => {
  try {
    console.log('🔍 Searching for username:', username);
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const usersSnap = await getDocs(q);
    console.log('📊 Query results:', usersSnap.size, 'documents found');
    if (usersSnap.empty) {
      console.warn('⚠️ No user found with username:', username);
      return null;
    }
    const userDoc = usersSnap.docs[0];
    const userData = { id: userDoc.id, ...userDoc.data() };
    console.log('✅ User found by username:', userData);
    return userData;
  } catch (error) {
    console.error('❌ Error getting user by username:', error);
    throw error;
  }
};

export const checkUsernameAvailable = async (username) => {
  try {
    const user = await getUserByUsername(username);
    return user === null;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};


// ========== GATES MANAGEMENT ==========

export const getAllGates = async () => {
  try {
    const gatesRef = collection(db, 'gates');
    const q = query(gatesRef, orderBy('order', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting gates:', error);
    return [];
  }
};

export const getActiveGates = async () => {
  try {
    const gates = await getAllGates();
    return gates.filter(gate => gate.status === 'active');
  } catch (error) {
    console.error('Error getting active gates:', error);
    return [];
  }
};

export const updateGateStatus = async (gateId, status) => {
  try {
    const gateRef = doc(db, 'gates', gateId);
    await updateDoc(gateRef, {
      status,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating gate status:', error);
    throw error;
  }
};

export const createGate = async (gateData) => {
  try {
    const gateRef = doc(collection(db, 'gates'));
    await setDoc(gateRef, {
      ...gateData,
      status: 'active',
      active: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return gateRef.id;
  } catch (error) {
    console.error('Error creating gate:', error);
    throw error;
  }
};

export const updateGate = async (gateId, updates) => {
  try {
    const gateRef = doc(db, 'gates', gateId);
    await updateDoc(gateRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating gate:', error);
    throw error;
  }
};

// ========== LIVES MANAGEMENT ==========

export const saveLive = async (liveData) => {
  try {
    const liveRef = doc(collection(db, 'lives'));
    const now = new Date();

    await setDoc(liveRef, {
      ...liveData,
      timestamp: serverTimestamp(),
      date: now.toISOString().split('T')[0],
      hour: now.toTimeString().split(' ')[0].substring(0, 5)
    });

    // Actualizar stats
    await incrementLiveStats(liveData.gateId, liveData.gateType);

    return liveRef.id;
  } catch (error) {
    console.error('Error saving live:', error);
    throw error;
  }
};

export const getUserLives = async (userId, limitCount = 100) => {
  try {
    const livesRef = collection(db, 'lives');
    const q = query(
      livesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user lives:', error);
    return [];
  }
};

export const getAllLives = async (limitCount = 500) => {
  try {
    const livesRef = collection(db, 'lives');
    const q = query(livesRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting all lives:', error);
    return [];
  }
};

export const getLivesToday = async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const livesRef = collection(db, 'lives');
    const q = query(livesRef, where('date', '==', today));
    const snapshot = await getDocs(q);
    return snapshot.docs.length;
  } catch (error) {
    console.error('Error getting lives today:', error);
    return 0;
  }
};

export const incrementLiveStats = async (gateId, gateType) => {
  try {
    const statsRef = doc(db, 'stats', 'global_stats');

    try {
      await updateDoc(statsRef, {
        totalLives: increment(1),
        [`livesByGate.${gateId}`]: increment(1),
        [`livesByType.${gateType}`]: increment(1),
        lastUpdated: serverTimestamp()
      });
    } catch (error) {
      // Si no existe, crear
      await setDoc(statsRef, {
        totalLives: 1,
        livesByGate: { [gateId]: 1 },
        livesByType: { [gateType]: 1 },
        lastUpdated: serverTimestamp()
      });
    }
  } catch (error) {
    console.error('Error incrementing live stats:', error);
  }
};

export const getGlobalStats = async () => {
  try {
    const statsRef = doc(db, 'stats', 'global_stats');
    const snapshot = await getDoc(statsRef);
    return snapshot.exists() ? snapshot.data() : null;
  } catch (error) {
    console.error('Error getting global stats:', error);
    return null;
  }
};

// ========== BIN ANALYTICS ==========

export const saveBinSearch = async (userId, binData) => {
  try {
    const searchRef = collection(db, 'bin_searches');
    await setDoc(doc(searchRef), {
      userId,
      bin: binData.bin,
      bank: binData.bank || 'Desconocido',
      country: binData.country || 'Desconocido',
      countryCode: binData.countryCode || '',
      type: binData.type || 'Desconocido',
      brand: binData.brand || 'Desconocido',
      level: binData.level || 'Standard',
      prepaid: binData.prepaid || false,
      timestamp: serverTimestamp()
    });
    console.log('✅ BIN search saved');
  } catch (error) {
    console.error('Error saving BIN search:', error);
    throw error;
  }
};

export const getUserBinSearches = async (userId) => {
  try {
    const searchesRef = collection(db, 'bin_searches');
    const q = query(
      searchesRef,
      where('userId', '==', userId),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.slice(0, 10).map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting BIN searches:', error);
    return [];
  }
};


// Helper function to fetch BIN data with cache-first strategy
const fetchBinDataFromAPI = async (bin) => {
  try {
    // 1. Primero buscar en el caché de Firestore
    const cacheRef = doc(db, 'bin_cache', bin);
    const cacheDoc = await getDoc(cacheRef);

    if (cacheDoc.exists()) {
      //console.log(`✅ BIN ${bin} encontrado en caché`);
      const cachedData = cacheDoc.data();
      return {
        bank: cachedData.bank,
        country: cachedData.country,
        type: cachedData.type,
        brand: cachedData.brand,
        level: cachedData.level,
        prepaid: cachedData.prepaid
      };
    }

    // 2. Si no está en caché, consultar la API
    console.log(`🌐 BIN ${bin} no está en caché, consultando API...`);
    const response = await fetch(`https://bin-ip-checker.p.rapidapi.com/?bin=${bin}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json, text/plain, */*',
        'X-RapidAPI-Key': 'f4f24adea3mshaa035122af7c477p173fcbjsnad38016e6ced',
        'X-RapidAPI-Host': 'bin-ip-checker.p.rapidapi.com',
        'User-Agent': 'Mozilla/5.0'
      },
      body: new URLSearchParams({ 'bin': bin })
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (!data.success || !data.BIN) return null;

    const binData = data.BIN;
    const binInfo = {
      bank: binData.issuer?.name || 'Desconocido',
      country: binData.country?.name || 'Desconocido',
      type: binData.type || 'Desconocido',
      brand: binData.brand || binData.scheme || 'Desconocido',
      level: binData.level || 'Standard',
      prepaid: binData.is_prepaid === 'true' || binData.is_prepaid === true
    };

    // 3. Guardar en caché para futuras consultas
    await setDoc(cacheRef, {
      ...binInfo,
      bin: bin,
      cachedAt: serverTimestamp(),
      lastUpdated: new Date().toISOString()
    });

    console.log(`💾 BIN ${bin} guardado en caché`);
    return binInfo;

  } catch (error) {
    console.error(`Error fetching BIN ${bin}:`, error);
    return null;
  }
};

export const getBinStats = async () => {
  try {
    // Obtener todas las lives
    const livesRef = collection(db, 'lives');
    const livesSnapshot = await getDocs(livesRef);
    const lives = livesSnapshot.docs.map(doc => doc.data());

    // Obtener información de BINs únicos desde la API
    const uniqueBins = [...new Set(lives.map(live => live.bin).filter(Boolean))];
    const binDataCache = {};

    // Consultar API para cada BIN único (en paralelo)
    await Promise.all(
      uniqueBins.map(async (bin) => {
        const binData = await fetchBinDataFromAPI(bin);
        if (binData) {
          binDataCache[bin] = binData;
        }
      })
    );

    // Enriquecer lives con datos de la API
    const enrichedLives = lives.map(live => {
      if (live.bin && binDataCache[live.bin]) {
        return {
          ...live,
          bank: binDataCache[live.bin].bank,
          country: binDataCache[live.bin].country
        };
      }
      return live;
    });

    // BINs con más lives (BINs más usados que dieron lives)
    const binLivesCount = {};
    enrichedLives.forEach(live => {
      if (live.bin) {
        binLivesCount[live.bin] = (binLivesCount[live.bin] || 0) + 1;
      }
    });
    const topBinsWithLives = Object.entries(binLivesCount)
      .map(([bin, lives]) => ({ bin, lives }))
      .sort((a, b) => b.lives - a.lives);

    // Top bancos (suma de lives por banco, aunque sean BINs diferentes)
    const bankCount = {};
    enrichedLives.forEach(live => {
      if (live.bank && live.bank !== 'Desconocido') {
        bankCount[live.bank] = (bankCount[live.bank] || 0) + 1;
      }
    });
    const topBanks = Object.entries(bankCount)
      .map(([bank, count]) => ({ bank, count }))
      .sort((a, b) => b.count - a.count);

    // Top países (suma de lives por país)
    const countryCount = {};
    enrichedLives.forEach(live => {
      if (live.country && live.country !== 'Desconocido') {
        countryCount[live.country] = (countryCount[live.country] || 0) + 1;
      }
    });
    const topCountries = Object.entries(countryCount)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7

    // Top marcas (VISA, Mastercard, etc.)
    const brandCount = {};
    enrichedLives.forEach(live => {
      if (live.bin && binDataCache[live.bin]?.brand) {
        const brand = binDataCache[live.bin].brand;
        if (brand && brand !== 'Desconocido') {
          brandCount[brand] = (brandCount[brand] || 0) + 1;
        }
      }
    });
    const topBrands = Object.entries(brandCount)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7

    // Tipos de tarjeta (Credit vs Debit)
    const typeCount = {};
    enrichedLives.forEach(live => {
      if (live.bin && binDataCache[live.bin]?.type) {
        const type = binDataCache[live.bin].type;
        if (type && type !== 'Desconocido') {
          typeCount[type] = (typeCount[type] || 0) + 1;
        }
      }
    });
    const cardTypes = Object.entries(typeCount)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    // Niveles de tarjeta (Classic, Gold, Platinum, etc.)
    const levelCount = {};
    enrichedLives.forEach(live => {
      if (live.bin && binDataCache[live.bin]?.level) {
        const level = binDataCache[live.bin].level;
        if (level && level !== 'Standard') {
          levelCount[level] = (levelCount[level] || 0) + 1;
        }
      }
    });
    const cardLevels = Object.entries(levelCount)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7

    // BINs más consultados en BIN Analytics (búsquedas manuales)
    const searchesRef = collection(db, 'bin_searches');
    const snapshot = await getDocs(searchesRef);
    const searches = snapshot.docs.map(doc => doc.data());

    const binCheckCount = {};
    searches.forEach(search => {
      binCheckCount[search.bin] = (binCheckCount[search.bin] || 0) + 1;
    });
    const mostCheckedBins = Object.entries(binCheckCount)
      .map(([bin, count]) => ({ bin, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 7); // Top 7

    return {
      topBinsWithLives: topBinsWithLives.slice(0, 7), // Top 7
      mostCheckedBins,
      topBanks: topBanks.slice(0, 7), // Top 7
      topCountries,
      topBrands,
      cardTypes,
      cardLevels
    };
  } catch (error) {
    console.error('Error getting BIN stats:', error);
    return {
      topBinsWithLives: [],
      mostCheckedBins: [],
      topBanks: [],
      topCountries: [],
      topBrands: [],
      cardTypes: [],
      cardLevels: []
    };
  }
};
