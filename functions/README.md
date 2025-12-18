# Cloud Functions - Auto Cleanup de Registros Pendientes

## 📋 Descripción

Este directorio contiene las Cloud Functions de Firebase para el proyecto CHK Website Bot.

## 🔒 Funciones de Seguridad

### 1. `cleanupPendingRegistrations`
**Trigger:** Actualización de documento en `pending_registrations`

**Propósito:** Elimina automáticamente los documentos de registros pendientes cuando su estado cambia a:
- `approved` - Registro aprobado
- `rejected` - Registro rechazado  
- `failed` - Registro fallido

**Por qué es importante:**
- ❌ Los registros pendientes contienen **contraseñas en texto plano**
- ❌ Contienen **Telegram IDs** sensibles
- ✅ Esta función elimina estos datos inmediatamente después de procesarse

### 2. `cleanupExpiredRegistrations`
**Trigger:** Programado (cada 1 hora)

**Propósito:** Elimina registros pendientes que hayan expirado (más de 10 minutos).

**Por qué es importante:**
- ✅ Limpia registros abandonados automáticamente
- ✅ Previene acumulación de datos sensibles
- ✅ Mantiene la base de datos limpia

## 🚀 Deployment

### Prerequisitos
```bash
npm install -g firebase-tools
firebase login
```

### Inicializar Functions (solo primera vez)
```bash
firebase init functions
# Selecciona:
# - Use an existing project
# - JavaScript
# - ESLint: Yes
# - Install dependencies: Yes
```

### Instalar dependencias
```bash
cd functions
npm install
```

### Deploy
```bash
# Deploy todas las functions
firebase deploy --only functions

# Deploy una función específica
firebase deploy --only functions:cleanupPendingRegistrations
firebase deploy --only functions:cleanupExpiredRegistrations
```

## 🧪 Testing Local

```bash
cd functions
npm run serve
```

Esto inicia el emulador de Functions para testing local.

## 📊 Monitoreo

Ver logs en tiempo real:
```bash
firebase functions:log
```

Ver logs en Firebase Console:
- Ve a Firebase Console → Functions → Logs

## ⚙️ Configuración

Las funciones usan la configuración por defecto de Firebase Admin SDK.

No requieren variables de entorno adicionales.

## 🔐 Seguridad

- ✅ Las funciones se ejecutan con privilegios de admin
- ✅ Solo eliminan documentos, no modifican datos
- ✅ Tienen logs completos para auditoría
- ✅ Manejo de errores robusto

## 📝 Notas

- Las funciones se ejecutan automáticamente, no requieren intervención manual
- Los logs están disponibles en Firebase Console
- El cleanup de expirados corre cada hora automáticamente
