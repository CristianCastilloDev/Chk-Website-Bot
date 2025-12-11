# Reglas Temporales para Generar Datos de Prueba

## ⚠️ SOLO PARA DESARROLLO - NO USAR EN PRODUCCIÓN

Estas reglas permiten generar datos de prueba sin restricciones de roles.

### Paso 1: Aplicar Reglas Temporales

Ve a Firebase Console → Firestore Database → Rules y reemplaza las secciones de Analytics con:

```javascript
// ========== ANALYTICS - ÓRDENES (TEMPORAL) ==========

match /analytics_orders/{orderId} {
  allow read, write: if request.auth != null;
}

// ========== ANALYTICS - ACTIVIDAD (TEMPORAL) ==========

match /analytics_activity/{activityId} {
  allow read, write: if request.auth != null;
}

// ========== ANALYTICS - SUSCRIPCIONES (TEMPORAL) ==========

match /analytics_subscriptions/{subscriptionId} {
  allow read, write: if request.auth != null;
}
```

### Paso 2: Generar Datos

En la consola del navegador:

```javascript
window.generateAnalyticsData();
```

### Paso 3: Restaurar Reglas de Producción

Después de generar los datos, **IMPORTANTE**: vuelve a aplicar las reglas de producción desde `firestore.rules`

---

## Alternativa: Cambiar tu rol a Admin

Si prefieres no cambiar las reglas temporalmente:

1. Ve a Firebase Console → Firestore Database
2. Busca tu documento en la colección `users`
3. Edita el campo `role` y cámbialo a `"admin"` o `"dev"`
4. Ejecuta `window.generateAnalyticsData()`
5. (Opcional) Vuelve a cambiar tu rol si lo necesitas
