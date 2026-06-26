# TabBuilder MVP — Frameworks Ocultos

**Estado:** enabled: false (NO aparecen en la UI pero el código está intacto)

---

## 10 Frameworks Ocultos

| Framework | Lenguaje | enabled | Razón |
|-----------|----------|---------|-------|
| Blazor | C# | false | Fuera de scope MVP |
| Quarkus | Java | false | Fuera de scope MVP |
| Micronaut | Java | false | Fuera de scope MVP |
| Flask | Python | false | Fuera de scope MVP |
| Litestar | Python | false | Fuera de scope MVP |
| Symfony | PHP | false | Fuera de scope MVP |
| SvelteKit | JavaScript | false | Fuera de scope MVP |
| Astro | JavaScript | false | Fuera de scope MVP |
| Nuxt | JavaScript | false | Fuera de scope MVP |
| Hono | JavaScript | false | Fuera de scope MVP |

---

## ✅ Cómo se Ocultan

El webview original **filtra automáticamente** los frameworks con `enabled: false`

```javascript
// En src/commands/webview.js (línea 152-170 aprox)
const getFrameworkData = () => {
  // ... itera frameworks ...
  // Solo incluye frameworks donde enabled !== false
}
```

---

## 🔄 Para Activar un Framework en el Futuro

Solo cambiar en el archivo del framework (ej: `src/frameworks/python.js`):

```javascript
'flask': {
  // ... código existente ...
  enabled: false,  // ← Cambiar a: true
  // ... resto del código ...
}
```

**Impacto:** Flask aparecería automáticamente en la UI del wizard

---

## 📋 Verificación

```bash
✅ No se eliminó código
✅ Los frameworks existen en los archivos
✅ Solo están marcados como enabled: false
✅ Se pueden reactivar fácilmente
✅ No hay breaking changes
```

---

**Nota:** El código generador para estos frameworks está intacto en `src/frameworks/v2/` y archivos legacy.
