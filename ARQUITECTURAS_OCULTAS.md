# TabBuilder MVP — Arquitecturas Ocultas

**Estado:** enabled: false (NO aparecen en la UI pero el código está intacto)

---

## 2 Arquitecturas Ocultas

| Arquitectura | enabled | Razón |
|--------------|---------|-------|
| Hexagonal | false | Fuera de scope MVP |
| DDD | false | Fuera de scope MVP |

---

## ✅ Arquitecturas Visibles (3)

| Arquitectura | enabled | Descripción |
|--------------|---------|-------------|
| Standard / MVC | true | Estructura plana, controladores + vistas |
| Clean | true | Clean Architecture, capas concéntricas |
| API | true | Solo API REST, sin vistas |

---

## 🔄 Cómo se Ocultan

Los blueprints tienen un flag `enabled: false`:

```javascript
// src/architecture/blueprints/HexagonalArchitecture.js
blueprint: {
  id: 'hexagonal',
  name: 'Hexagonal',
  description: '...',
  enabled: false  // ← No aparece en UI
}
```

El webview original filtra automáticamente:

```javascript
// En src/commands/webview.js (getArchitectureData)
// Solo muestra arquitecturas donde enabled !== false
```

---

## 🔄 Para Activar una Arquitectura en el Futuro

Solo cambiar en `src/architecture/blueprints/{Architecture}Architecture.js`:

```javascript
blueprint: {
  id: 'hexagonal',
  // ...
  enabled: false,  // ← Cambiar a: true
}
```

**Impacto:** Hexagonal aparecería automáticamente en la UI

---

## 📊 Archivos Afectados

- `src/architecture/blueprints/HexagonalArchitecture.js` — agregado `enabled: false`
- `src/architecture/blueprints/DddArchitecture.js` — agregado `enabled: false`

**Nota:** El código generador está intacto en `src/architecture/`.

---

## ✅ Verificación

```bash
✅ No se eliminó código
✅ Los blueprints existen
✅ Solo están marcados como enabled: false
✅ Se pueden reactivar fácilmente
✅ No hay breaking changes
```
