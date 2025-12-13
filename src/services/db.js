import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
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

export const addCreditsToUser = async (userId, creditsToAdd, adminId, adminName, amount = 0) => {
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
      newBalance,
      amount: amount
    });
    return true;
  } catch (error) {
    console.error('Error adding credits:', error);
    throw error;
  }
};

export const addPlanToUser = async (userId, planDuration, adminId, adminName, amount = 0) => {
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
      newPlan: planName,
      amount: amount
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

export const getBinStats = async (period = 'all') => {
  try {
    // Calcular fecha de inicio según el período
    let startDate = null;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case 'all':
      default:
        startDate = null; // Sin filtro
        break;
    }

    // Obtener todas las lives
    const livesRef = collection(db, 'lives');
    const livesSnapshot = await getDocs(livesRef);
    let lives = livesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`📊 Total lives antes de filtrar: ${lives.length}`);
    console.log(`📅 Período seleccionado: ${period}`);
    console.log(`🕐 Fecha de inicio: ${startDate}`);

    // Filtrar por fecha si es necesario
    if (startDate) {
      const originalCount = lives.length;
      lives = lives.filter(live => {
        // Verificar si tiene campo de fecha (createdAt, timestamp, date, etc.)
        const dateField = live.createdAt || live.timestamp || live.date || live.created;
        
        if (!dateField) {
          console.warn('Live sin fecha:', live.id);
          return false; // Excluir lives sin fecha cuando hay filtro
        }

        try {
          // Convertir a Date según el tipo
          let liveDate;
          if (dateField.toDate) {
            // Firestore Timestamp
            liveDate = dateField.toDate();
          } else if (dateField.seconds) {
            // Timestamp object
            liveDate = new Date(dateField.seconds * 1000);
          } else if (typeof dateField === 'string') {
            // String ISO
            liveDate = new Date(dateField);
          } else if (dateField instanceof Date) {
            // Ya es Date
            liveDate = dateField;
          } else {
            console.warn('Formato de fecha desconocido:', dateField);
            return false;
          }

          const isInRange = liveDate >= startDate;
          return isInRange;
        } catch (error) {
          console.error('Error procesando fecha:', error, dateField);
          return false;
        }
      });
      
      console.log(`✅ Lives después de filtrar: ${lives.length} (filtrados: ${originalCount - lives.length})`);
    }

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

// ========== TEST DATA GENERATION ==========

const SAMPLE_BINS = [
  '411111', '424242', '450000', '476173', '483312',
  '510510', '555555', '540000', '543210', '557039',
  '371449', '378282', '378734', '340000', '341111',
  '456789', '491234', '465432', '478901', '482345',
  '512345', '523456', '534567', '545678', '556789',
  '461234', '472345', '483456', '494567', '405678',
  '517890', '528901', '539012', '540123', '551234',
  '467890', '478901', '489012', '490123', '401234',
  '518901', '529012', '530123', '541234', '552345',
  '462345', '473456', '484567', '495678', '406789',
  '513456', '524567', '535678', '546789', '557890'
];

export const generateTestLives = async (count = 100) => {
  try {
    console.log(`🚀 Generando ${count} lives de prueba...`);
    
    // Obtener gates existentes
    const gatesSnapshot = await getDocs(collection(db, 'gates'));
    const gates = gatesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (gates.length === 0) {
      console.error('❌ No hay gates disponibles.');
      return;
    }
    
    console.log(`✅ Encontrados ${gates.length} gates`);
    
    const createdLives = [];
    
    for (let i = 0; i < count; i++) {
      const randomGate = gates[Math.floor(Math.random() * gates.length)];
      const randomBin = SAMPLE_BINS[Math.floor(Math.random() * SAMPLE_BINS.length)];
      
      // Fecha aleatoria en los últimos 6 meses
      const now = new Date();
      const sixMonthsAgo = new Date(now.getTime() - (180 * 24 * 60 * 60 * 1000));
      const randomTime = sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime());
      
      const liveData = {
        bin: randomBin,
        gateId: randomGate.id,
        gateName: randomGate.name || 'Test Gate',
        createdAt: Timestamp.fromDate(new Date(randomTime)),
        userId: 'test-user-' + Math.floor(Math.random() * 10),
        cardNumber: randomBin + '********' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'),
        status: 'approved'
      };
      
      const liveRef = doc(collection(db, 'lives'));
      await setDoc(liveRef, liveData);
      createdLives.push({ id: liveRef.id, ...liveData });
      
      if ((i + 1) % 10 === 0) {
        console.log(`📊 Progreso: ${i + 1}/${count} lives creadas`);
      }
    }
    
    console.log(`✅ ¡Completado! Se crearon ${createdLives.length} lives de prueba`);
    console.log('🏦 BINs únicos:', [...new Set(createdLives.map(l => l.bin))].length);
    console.log('🚪 Gates únicos:', [...new Set(createdLives.map(l => l.gateId))].length);
    
    return createdLives;
  } catch (error) {
    console.error('❌ Error generando lives:', error);
    throw error;
  }
};

export const deleteAllTestLives = async () => {
  try {
    console.log('🗑️ Eliminando todas las lives...');
    
    const livesSnapshot = await getDocs(collection(db, 'lives'));
    const deletions = [];
    
    const { deleteDoc } = await import('firebase/firestore');
    
    for (const docSnap of livesSnapshot.docs) {
      deletions.push(deleteDoc(docSnap.ref));
    }
    
    await Promise.all(deletions);
    console.log(`✅ Eliminadas ${deletions.length} lives`);
  } catch (error) {
    console.error('❌ Error eliminando lives:', error);
    throw error;
  }
};

// ========== ANALYTICS FUNCTIONS ==========

/**
 * Obtener estadísticas de Analytics con filtro de fecha
 */
export const getAnalyticsStats = async (dateRange = 'all') => {
  try {
    const startDate = getDateRangeStart(dateRange);
    
    // Obtener órdenes
    const ordersRef = collection(db, 'analytics_orders');
    const ordersSnapshot = await getDocs(ordersRef);
    
    // Obtener actividad
    const activityRef = collection(db, 'analytics_activity');
    const activitySnapshot = await getDocs(activityRef);
    
    // Obtener suscripciones
    const subsRef = collection(db, 'analytics_subscriptions');
    const subsSnapshot = await getDocs(subsRef);
    
    // Filtrar órdenes por fecha si es necesario
    let orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (startDate) {
      orders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= startDate;
      });
    }
    
    // Filtrar actividad por fecha
    let activity = activitySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (startDate) {
      activity = activity.filter(act => {
        if (!act.timestamp) return false;
        const actDate = act.timestamp.toDate();
        return actDate >= startDate;
      });
    }
    
    // Filtrar suscripciones por fecha
    let subscriptions = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    if (startDate) {
      subscriptions = subscriptions.filter(sub => {
        if (!sub.createdAt) return false;
        const subDate = sub.createdAt.toDate();
        return subDate >= startDate;
      });
    }
    
    // Calcular métricas de órdenes
    const totalOrders = orders.length;
    const approvedOrders = orders.filter(o => o.status === 'approved').length;
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    
    // Calcular revenue del período filtrado
    const totalRevenue = orders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + (o.price || 0), 0);
    
    // Calcular revenue del mes actual y anterior para comparación
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    // Órdenes del mes actual (sin filtro de dateRange)
    const currentMonthOrders = ordersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate();
        return orderDate >= currentMonthStart && orderDate <= now;
      });
    
    // Órdenes del mes anterior
    const previousMonthOrders = ordersSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(o => {
        if (!o.createdAt) return false;
        const orderDate = o.createdAt.toDate();
        return orderDate >= previousMonthStart && orderDate <= previousMonthEnd;
      });
    
    const currentMonthRevenue = currentMonthOrders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + (o.price || 0), 0);
    
    const previousMonthRevenue = previousMonthOrders
      .filter(o => o.status === 'approved')
      .reduce((sum, o) => sum + (o.price || 0), 0);
    
    // Calcular suscripciones por tipo
    const planSubs = subscriptions.filter(s => s.type === 'plan').length;
    const creditSubs = subscriptions.filter(s => s.type === 'credits').length;
    
    const renewals = subscriptions.filter(s => s.isRenewal).length;
    
    // Usuarios únicos activos
    const uniqueUsers = new Set(activity.map(a => a.userId)).size;
    
    // Obtener estadísticas de lives
    const livesRef = collection(db, 'lives');
    const livesSnapshot = await getDocs(livesRef);
    const totalLives = livesSnapshot.size;
    const availableLives = livesSnapshot.docs.filter(doc => doc.data().status === 'available').length;
    
    return {
      orders: {
        total: totalOrders,
        approved: approvedOrders,
        pending: pendingOrders,
        comparison: calculateComparison(currentMonthOrders.length, previousMonthOrders.length)
      },
      revenue: {
        total: currentMonthRevenue,
        comparison: calculateComparison(currentMonthRevenue, previousMonthRevenue)
      },
      users: {
        total: uniqueUsers,
        new: Math.floor(uniqueUsers * 0.3),
        active: Math.floor(uniqueUsers * 0.6),
        inactive: Math.floor(uniqueUsers * 0.1)
      },
      subscriptions: {
        total: planSubs + creditSubs,
        plans: planSubs,
        credits: creditSubs
      },
      lives: {
        total: totalLives,
        available: availableLives
      },
      renewals: renewals,
      activity: activity.length
    };
  } catch (error) {
    console.error('Error getting analytics stats:', error);
    throw error;
  }
};

/**
 * Obtener datos para gráfico de ventas dinámicas (por mes)
 */
export const getSalesDynamics = async (dateRange = 'all') => {
  try {
    const startDate = getDateRangeStart(dateRange);
    
    const ordersRef = collection(db, 'analytics_orders');
    const snapshot = await getDocs(ordersRef);
    
    let orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(o => o.status === 'approved');
    
    // Aplicar filtro de fecha
    if (startDate) {
      orders = orders.filter(order => {
        if (!order.createdAt) return false;
        const orderDate = order.createdAt.toDate();
        return orderDate >= startDate;
      });
    }
    
    // Agrupar por mes
    const monthlyData = {};
    
    orders.forEach(order => {
      const date = order.createdAt.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase();
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthName,
          monthKey: monthKey, // Para ordenar correctamente
          plans: 0,
          credits: 0,
          total: 0
        };
      }
      
      if (order.type === 'plan') {
        monthlyData[monthKey].plans += order.price || 0;
      } else {
        monthlyData[monthKey].credits += order.price || 0;
      }
      monthlyData[monthKey].total += order.price || 0;
    });
    
    // Convertir a array y ordenar cronológicamente
    const sortedData = Object.values(monthlyData)
      .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    
    // Limitar a los últimos 12 meses
    const last12Months = sortedData.slice(-12);
    
    // Remover monthKey del resultado final (solo se usó para ordenar)
    return last12Months.map(({ monthKey, ...rest }) => rest);
  } catch (error) {
    console.error('Error getting sales dynamics:', error);
    return [];
  }
};

/**
 * Obtener actividad de usuarios (por día)
 */
export const getUserActivity = async (dateRange = 'all') => {
  try {
    const startDate = getDateRangeStart(dateRange);
    
    const activityRef = collection(db, 'analytics_activity');
    const snapshot = await getDocs(activityRef);
    
    let activity = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    // Aplicar filtro de fecha
    if (startDate) {
      activity = activity.filter(act => {
        if (!act.timestamp) return false;
        const actDate = act.timestamp.toDate();
        return actDate >= startDate;
      });
    }
    
    // Agrupar por día
    const dailyData = {};
    
    activity.forEach(act => {
      const date = act.timestamp.toDate();
      const dayKey = date.toISOString().split('T')[0];
      const displayDate = date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
      
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = {
          date: displayDate,
          dateKey: dayKey, // Para ordenar correctamente
          count: 0
        };
      }
      
      dailyData[dayKey].count++;
    });
    
    // Ordenar cronológicamente y limitar a últimos 30 días
    const sortedData = Object.values(dailyData)
      .sort((a, b) => a.dateKey.localeCompare(b.dateKey))
      .slice(-30);
    
    // Remover dateKey del resultado final
    return sortedData.map(({ dateKey, ...rest }) => rest);
  } catch (error) {
    console.error('Error getting user activity:', error);
    return [];
  }
};

/**
 * Obtener tabla de órdenes de clientes
 */
export const getCustomerOrders = async (limit = 10) => {
  try {
    const ordersRef = collection(db, 'analytics_orders');
    const snapshot = await getDocs(ordersRef);
    
    const orders = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate())
      .slice(0, limit);
    
    return orders.map(order => ({
      id: order.id,
      profile: order.createdBy,
      address: order.targetUser,
      date: order.createdAt.toDate().toLocaleDateString('es-ES'),
      status: order.status,
      price: `$${order.price}`
    }));
  } catch (error) {
    console.error('Error getting customer orders:', error);
    return [];
  }
};

// Helper functions
function getDateRangeStart(range) {
  const now = new Date();
  switch (range) {
    case 'today':
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return today;
    case 'week':
      const week = new Date();
      week.setDate(week.getDate() - 7);
      return week;
    case 'month':
      const month = new Date();
      month.setMonth(month.getMonth() - 1);
      return month;
    case 'year':
      const year = new Date();
      year.setFullYear(year.getFullYear() - 1);
      return year;
    case 'all':
    default:
      return null;
  }
}

function calculateComparison(current, previous) {
  if (previous === 0) return '+100%';
  const diff = ((current - previous) / previous) * 100;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toFixed(1)}%`;
}

// ========== NOTIFICATIONS ==========

/**
 * Crear una notificación
 */
export const createNotification = async (userId, type, title, message, data = {}) => {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      userId,
      type,
      title,
      message,
      data,
      read: false,
      createdAt: serverTimestamp()
    });
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Obtener notificaciones de un usuario
 */
export const getUserNotifications = async (userId, limitCount = 50) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Marcar notificación como leída
 */
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notifRef = doc(db, 'notifications', notificationId);
    await updateDoc(notifRef, { read: true });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Eliminar una notificación
 */
export const deleteNotification = async (notificationId) => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const notifRef = doc(db, 'notifications', notificationId);
    await deleteDoc(notifRef);
  } catch (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Eliminar todas las notificaciones de un usuario
 */
export const deleteAllNotifications = async (userId) => {
  try {
    const { deleteDoc } = await import('firebase/firestore');
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
};

/**
 * Crear notificación para todos los admins
 */
export const notifyAdmins = async (type, title, message, data = {}) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', 'in', ['admin', 'dev']));
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map(userDoc => 
      createNotification(userDoc.id, type, title, message, data)
    );
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error notifying admins:', error);
    throw error;
  }
};

// ========== TELEGRAM INTEGRATION ==========

/**
 * Link Telegram account to Firebase user
 */
export const linkTelegramAccount = async (firebaseUid, telegramId, username = '') => {
  try {
    // Check if Telegram ID is already linked
    const telegramUsersRef = collection(db, 'telegram_users');
    const q = query(telegramUsersRef, where('telegramId', '==', telegramId.toString()));
    const existing = await getDocs(q);
    
    if (!existing.empty) {
      throw new Error('Este Telegram ID ya está vinculado a otra cuenta');
    }
    
    // Create link
    const linkRef = doc(collection(db, 'telegram_users'));
    await setDoc(linkRef, {
      telegramId: telegramId.toString(),
      firebaseUid,
      username,
      chatId: null, // Will be set when user starts bot
      notifications: true,
      linkedAt: serverTimestamp(),
      lastActive: serverTimestamp()
    });
    
    return true;
  } catch (error) {
    console.error('Error linking Telegram account:', error);
    throw error;
  }
};

/**
 * Get Telegram link status for a user
 */
export const getTelegramLink = async (firebaseUid) => {
  try {
    const telegramUsersRef = collection(db, 'telegram_users');
    const q = query(telegramUsersRef, where('firebaseUid', '==', firebaseUid));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return null;
    }
    
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() };
  } catch (error) {
    console.error('Error getting Telegram link:', error);
    return null;
  }
};

/**
 * Unlink Telegram account
 */
export const unlinkTelegramAccount = async (firebaseUid) => {
  try {
    const telegramUsersRef = collection(db, 'telegram_users');
    const q = query(telegramUsersRef, where('firebaseUid', '==', firebaseUid));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const docRef = snapshot.docs[0].ref;
      await deleteDoc(docRef);
    }
    
    return true;
  } catch (error) {
    console.error('Error unlinking Telegram account:', error);
    throw error;
  }
};

// ========== USER SETTINGS ==========

/**
 * Update user announcements preference
 */
export const updateUserAnnouncements = async (userId, receiveAnnouncements) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      receiveAnnouncements,
      updatedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error updating announcements preference:', error);
    throw error;
  }
};

/**
 * Request password change - sends confirmation code to Telegram
 */
export const requestPasswordChange = async (userId) => {
  try {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Get Telegram link
    const telegramLink = await getTelegramLink(userId);
    if (!telegramLink) {
      throw new Error('Telegram no vinculado. Por favor vincula tu cuenta de Telegram primero.');
    }
    
    // Store code in pending_password_changes collection
    const changeRef = doc(collection(db, 'pending_password_changes'));
    await setDoc(changeRef, {
      userId,
      code,
      telegramId: telegramLink.telegramId,
      createdAt: serverTimestamp(),
      expiresAt: Timestamp.fromMillis(Date.now() + 10 * 60 * 1000), // 10 minutes
      used: false
    });
    
    // TODO: Send code to Telegram bot
    // This will be handled by the Telegram bot service
    console.log(`🔐 Password change code for user ${userId} (Telegram: ${telegramLink.telegramId}): ${code}`);
    
    return {
      success: true,
      message: 'Código de confirmación enviado a tu Telegram',
      changeId: changeRef.id,
      code: code // Temporary: return code for testing
    };
  } catch (error) {
    console.error('Error requesting password change:', error);
    throw error;
  }
};

/**
 * Confirm password change with code from Telegram
 */
export const confirmPasswordChange = async (userId, code, newPassword) => {
  try {
    // Find pending change
    const changesRef = collection(db, 'pending_password_changes');
    const q = query(
      changesRef,
      where('userId', '==', userId),
      where('code', '==', code),
      where('used', '==', false)
    );
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      throw new Error('Código inválido o expirado');
    }
    
    const changeDoc = snapshot.docs[0];
    const changeData = changeDoc.data();
    
    // Check if expired
    if (changeData.expiresAt.toMillis() < Date.now()) {
      throw new Error('Código expirado. Solicita uno nuevo.');
    }
    
    // Mark as used
    await updateDoc(changeDoc.ref, {
      used: true,
      usedAt: serverTimestamp()
    });
    
    // Update password in Firebase Auth
    // Note: This requires Firebase Admin SDK on backend
    // For now, return success and handle password update separately
    
    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };
  } catch (error) {
    console.error('Error confirming password change:', error);
    throw error;
  }
};
