// Script para generar lives de prueba en Firebase
// Las funciones están disponibles en la consola del navegador

import { generateTestLives, deleteAllTestLives } from '../services/db';

// Hacer disponible en window para uso en consola
window.generateTestLives = generateTestLives;
window.deleteAllTestLives = deleteAllTestLives;

// console.log('✅ Funciones de prueba cargadas:');
// console.log('   📝 await generateTestLives(100) - Genera 100 lives de prueba');
// console.log('   🗑️ await deleteAllTestLives() - Elimina todas las lives');
