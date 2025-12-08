// Base de datos local de BINs VERIFICADOS
// Solo incluye BINs confirmados de bancos reales
// IMPORTANTE: Todos estos BINs han sido verificados manualmente

export const BIN_DATABASE = {
    // MÉXICO - BINs verificados
    '426807': { bank: 'BANCOPPEL S.A.', country: 'Mexico', countryCode: 'MX', type: 'credit', brand: 'visa', level: 'classic' },
    '416916': { bank: 'Bancoppel', country: 'Mexico', countryCode: 'MX', type: 'credit', brand: 'visa', level: 'classic' },

    // USA - BINs verificados comunes
    '424631': { bank: 'Chase Bank', country: 'United States', countryCode: 'US', type: 'credit', brand: 'visa', level: 'platinum' },
    '414720': { bank: 'Chase Bank', country: 'United States', countryCode: 'US', type: 'credit', brand: 'visa', level: 'signature' },

    // Test Cards oficiales (para desarrollo)
    '411111': { bank: 'Visa Test Card', country: 'Test', countryCode: 'XX', type: 'credit', brand: 'visa', level: 'classic' },
    '424242': { bank: 'Stripe Test Card', country: 'Test', countryCode: 'XX', type: 'credit', brand: 'visa', level: 'classic' },
    '555555': { bank: 'Mastercard Test Card', country: 'Test', countryCode: 'XX', type: 'credit', brand: 'mastercard', level: 'classic' },

    // Agrega aquí BINs que TÚ hayas verificado personalmente
    // Formato: 'BIN': { bank: 'Nombre Banco', country: 'País', countryCode: 'XX', type: 'credit/debit', brand: 'visa/mastercard', level: 'classic/gold/platinum' },
};

// Función helper para buscar un BIN
export const searchBin = (bin) => {
    return BIN_DATABASE[bin] || null;
};

// Función helper para obtener todos los BINs disponibles
export const getAllBins = () => {
    return Object.keys(BIN_DATABASE);
};

// Función helper para obtener estadísticas de la base de datos
export const getBinDatabaseStats = () => {
    const bins = Object.values(BIN_DATABASE);

    const countries = {};
    const banks = {};
    const brands = {};

    bins.forEach(bin => {
        countries[bin.country] = (countries[bin.country] || 0) + 1;
        banks[bin.bank] = (banks[bin.bank] || 0) + 1;
        brands[bin.brand] = (brands[bin.brand] || 0) + 1;
    });

    return {
        totalBins: bins.length,
        countries: Object.keys(countries).length,
        banks: Object.keys(banks).length,
        brands: Object.keys(brands).length,
        topCountries: Object.entries(countries)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([country, count]) => ({ country, count })),
        topBanks: Object.entries(banks)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([bank, count]) => ({ bank, count }))
    };
};
