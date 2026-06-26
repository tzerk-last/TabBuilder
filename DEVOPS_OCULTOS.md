# TabBuilder MVP — DevOps Ocultos

**Estado:** enabled: false en DEVOPS_CATALOG (NO aparecen en la UI)

---

## 1 DevOps Oculto

| DevOps | enabled | Razón |
|--------|---------|-------|
| Azure Pipelines | false | Fuera de scope MVP |

---

## ✅ DevOps Visibles (4)

| DevOps | enabled | Descripción |
|--------|---------|-------------|
| Ninguno | true | Sin archivos de infraestructura |
| Docker | true | Dockerfile + docker-compose.yml |
| Kubernetes | true | Manifiestos K8s (Deployment, Service, etc.) |
| GitHub Actions | true | CI/CD pipeline en .github/workflows/ |

---

## 🔄 Cómo se Ocultan

En `src/catalogs.js`, el DEVOPS_CATALOG define:

```javascript
{
  id: 'azure-pipelines',
  name: 'Azure Pipelines',
  icon: '☁️',
  description: 'azure-pipelines.yml',
  enabled: false  // ← No aparece en UI
}
```

El webview original filtra automáticamente:

```javascript
// En src/commands/webview.js (getDevOpsData)
// Solo muestra DevOps donde enabled !== false
```

---

## 🔄 Para Activar un DevOps en el Futuro

Solo cambiar en `src/catalogs.js`:

```javascript
{
  id: 'azure-pipelines',
  // ...
  enabled: false,  // ← Cambiar a: true
}
```

**Impacto:** Azure Pipelines aparecería automáticamente en la UI

---

## 📊 Otros DevOps (No incluidos en MVP)

Los siguientes **NO están en DEVOPS_CATALOG** pero sus generadores existen:

- GitLab CI/CD
- CircleCI
- Travis CI
- Jenkins
- AWS CodeBuild
- Google Cloud Build
- etc.

Para agregar uno, simplemente:
1. Agregar entrada en `DEVOPS_CATALOG` con `enabled: true`
2. El webview lo mostrará automáticamente

---

## ✅ Verificación

```bash
✅ No se eliminó código
✅ Los generadores existen
✅ Solo se definen 4 opciones en el MVP
✅ Azure Pipelines está marcado como disabled
✅ Se pueden agregar nuevas opciones fácilmente
✅ No hay breaking changes
```

---

## 📋 Archivos Afectados

- `src/catalogs.js` — DEVOPS_CATALOG con opciones

**Nota:** Los generadores de DevOps están intactos en `src/devops/`.
