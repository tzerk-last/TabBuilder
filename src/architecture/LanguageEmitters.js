'use strict';

/**
 * LanguageEmitters (patrón Strategy)
 * ----------------------------------
 * Cada arquitectura razona en términos ABSTRACTOS ("una interfaz de repositorio",
 * "un DTO", "un caso de uso"). El emitter traduce esa intención a código idiomático
 * del framework destino.
 *
 * Esto es lo que mantiene los dos ejes ortogonales:
 *   - Agregar una ARQUITECTURA  -> nuevo blueprint, no toca emitters.
 *   - Agregar un FRAMEWORK      -> nuevo emitter, no toca arquitecturas.
 *
 * Cada emitter declara:
 *   base   : carpeta raíz del código fuente del framework
 *   ext    : extensión de archivo
 *   ns(p)  : "namespace"/paquete a partir de un path lógico (ej. Domain/Ports)
 *   iface  : genera una interfaz/puerto
 *   dto    : genera un DTO/record
 *   service: genera un servicio/clase
 *   repo   : genera implementación de repositorio
 *   useCase: genera un caso de uso
 *
 * ── Modelo estructurado de métodos (P0-1) ──────────────────────────────────
 * Los métodos de una interfaz/puerto se describen como objetos:
 *   { name, returnType, parameters: [{name, type}], async?, nullableReturn? }
 * Los tipos lógicos ('Id', 'Entity', 'Command', 'Aggregate', 'void', etc.)
 * se resuelven a tipos idiomáticos por lenguaje mediante `resolveType()`.
 *
 * ── Modelo estructurado de referencias a interfaz (P0-2) ───────────────────
 * Cualquier sitio que implemente/dependa de una interfaz (service, repo,
 * adapter, useCase, o un `dep` en el constructor) YA NO recibe solo el
 * nombre de la interfaz como string. Recibe una "referencia" completa:
 *   { name: 'IEntityRepository', layerPath: 'Domain/Interfaces' }
 * `layerPath` es la MISMA ruta lógica usada para generar el archivo de la
 * interfaz (la que arma `srcPath`/`pkg`/`ns`), así que el emitter puede
 * derivar el namespace/package/use-path EXACTO de esa interfaz y emitir el
 * import correspondiente sin volver a adivinarlo ni duplicar la lógica de
 * resolución de namespaces.
 */

/**
 * Mapa de tipos lógicos -> tipo idiomático por lenguaje.
 * Cualquier tipo lógico no listado se usa tal cual (permite que un blueprint
 * pase ya un tipo concreto, ej. el nombre de un DTO generado).
 */
const TYPE_MAPS = {
  csharp: { Id: 'Guid', void: 'void', string: 'string', int: 'int', bool: 'bool' },
  java: { Id: 'Long', void: 'void', string: 'String', int: 'int', bool: 'boolean' },
  php: { Id: 'int', void: 'void', string: 'string', int: 'int', bool: 'bool' },
  python: { Id: 'int', void: 'None', string: 'str', int: 'int', bool: 'bool' },
};

/**
 * Tipos lógicos "primitivos": NO requieren import porque no son una clase
 * generada por el motor de arquitecturas. Cualquier tipo lógico que NO esté
 * en este set (ej. 'Entity', 'Aggregate', 'Command') sí necesita resolverse
 * contra el registro de tipos de dominio (ver `DOMAIN_TYPES` más abajo).
 */
const PRIMITIVE_TYPES = new Set(['Id', 'void', 'string', 'int', 'bool']);

/** Resuelve un tipo lógico a su equivalente idiomático en `lang`. */
function resolveType(lang, type) {
  if (!type) return TYPE_MAPS[lang].void;
  return TYPE_MAPS[lang][type] || type;
}

/**
 * Construye el bloque de imports/usings/use a partir de un set de líneas.
 * Cada emitter decide qué imports requiere cada `iface`/`service`/`repo`
 * (P0-2) y los agrega aquí; este helper sólo evita duplicados y normaliza
 * el salto de línea final.
 */
function renderImports(lines) {
  const unique = [...new Set(lines.filter(Boolean))];
  return unique.length ? `${unique.join('\n')}\n\n` : '';
}

/**
 * Prefijo de package Java compartido por `pkg()` y por la base física del
 * emitter (`base: 'src/main/java/com/example/app'`). Vive en una sola
 * constante para que ambos NUNCA puedan desincronizarse (P0-3).
 */
const ROOT_PKG = 'com.example.app';

/**
 * snake_case para nombres de módulo Python (PEP 8): "IEntityRepository" ->
 * "i_entity_repository". Se usa tanto para el nombre de archivo lógico como
 * para el `from ... import` generado.
 */
function toSnakeCase(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2')
    .toLowerCase();
}

const EMITTERS = {
  // ─── ASP.NET (C#) ────────────────────────────────────────────────────────
  aspnet: {
    base: 'src',
    ext: 'cs',
    lang: 'csharp',
    rootNs: (p) => p.projectName,
    ns(ctx, layerPath) {
      return `${ctx.projectName}.${layerPath.replace(/\//g, '.')}`;
    },
    /** `using` exacto para consumir una referencia { name, layerPath } generada en otra capa. */
    usingFor(ctx, ref) {
      return `using ${this.ns(ctx, ref.layerPath)};`;
    },
    /** Firma C# válida: `TipoRetorno Nombre(TipoParam param, ...);` */
    methodSignature({ name, returnType, parameters = [], async = false, nullableReturn = false }) {
      const ret0 = resolveType('csharp', returnType);
      const ret = nullableReturn && ret0 !== 'void' ? `${ret0}?` : ret0;
      const finalRet = async ? (ret === 'void' ? 'Task' : `Task<${ret}>`) : ret;
      const pascalName = name.charAt(0).toUpperCase() + name.slice(1) + (async ? 'Async' : '');
      const params = parameters.map((p) => `${resolveType('csharp', p.type)} ${p.name}`).join(', ');
      return `${finalRet} ${pascalName}(${params})`;
    },
    iface(ctx, { name, layerPath, methods = [], usings = [], refs = [] }) {
      const ns = this.ns(ctx, layerPath);
      const needsTask = methods.some((m) => m.async);
      const refUsings = refs
        .filter((r) => r.layerPath !== layerPath)
        .map((r) => this.usingFor(ctx, r));
      const imports = renderImports([
        needsTask ? 'using System.Threading.Tasks;' : '',
        ...refUsings,
        ...usings,
      ]);
      const body = methods.length
        ? methods.map((m) => `    ${this.methodSignature(m)};`).join('\n')
        : '    // TODO: define el contrato';
      return `${imports}namespace ${ns};\n\npublic interface ${name}\n{\n${body}\n}\n`;
    },
    dto(ctx, { name, layerPath, fields = [] }) {
      const ns = this.ns(ctx, layerPath);
      const props = fields.length
        ? fields.map((f) => `${resolveType('csharp', f.type)} ${f.name}`).join(', ')
        : 'int Id, string Name';
      return `namespace ${ns};\n\npublic record ${name}(${props});\n`;
    },
    /**
     * Clase marcador para un tipo de dominio referenciado en firmas de método
     * (Entity, Aggregate, Command, ...) pero que ningún blueprint modela aún
     * con campos propios. Genera un archivo real y compilable para que la
     * referencia NUNCA apunte a un tipo inexistente (P0-2 / consistencia).
     */
    domainType(ctx, { name, layerPath }) {
      const ns = this.ns(ctx, layerPath);
      return `namespace ${ns};\n\n/// <summary>\n/// Marcador de dominio generado automáticamente porque "${name}" se referencia\n/// en una o más firmas de método. Reemplázalo con tus propios campos.\n/// </summary>\npublic class ${name}\n{\n}\n`;
    },
    /** Cuerpo de método stub que SÍ compila: implementa la firma y lanza NotImplementedException. */
    stubMethods(methods) {
      return methods.map((m) => {
        const sig = this.methodSignature(m);
        return `    public ${sig}\n    {\n        throw new NotImplementedException();\n    }`;
      }).join('\n\n');
    },
    /**
     * Construye, para una clase con `layerPath` propio, el bloque de `using`
     * necesario para: (a) la interfaz que implementa (`ifaceRef`), (b) cada
     * dependencia inyectada cuyo tipo viva en otra capa (`deps[].ref`).
     * Una referencia cuyo `layerPath` coincide con el de la propia clase NO
     * genera import (mismo namespace).
     */
    refUsings(ctx, layerPath, refs) {
      return refs
        .filter((r) => r && r.layerPath && r.layerPath !== layerPath)
        .map((r) => this.usingFor(ctx, r));
    },
    service(ctx, { name, layerPath, iface, ifaceRef, deps = [], ifaceMethods = [], typeRefs = [] }) {
      const ns = this.ns(ctx, layerPath);
      const ctorArgs = deps.map((d) => `${d.type} ${d.field}`).join(', ');
      const assigns = deps.map((d) => `        _${d.field} = ${d.field};`).join('\n');
      const fields = deps.map((d) => `    private readonly ${d.type} _${d.field};`).join('\n');
      const impl = iface ? ` : ${iface}` : '';
      const stubs = ifaceMethods.length ? '\n\n' + this.stubMethods(ifaceMethods) : '';
      const needsTask = ifaceMethods.some((m) => m.async);
      const depRefs = deps.map((d) => d.ref).filter(Boolean);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...depRefs, ...typeRefs];
      const usingBlock = (ifaceMethods.length || refs.length)
        ? renderImports([
          'using System;',
          needsTask ? 'using System.Threading.Tasks;' : '',
          ...this.refUsings(ctx, layerPath, refs),
        ])
        : '';
      return `${usingBlock}namespace ${ns};\n\npublic class ${name}${impl}\n{\n${fields ? fields + '\n\n' : ''}    public ${name}(${ctorArgs})\n    {\n${assigns}\n    }${stubs}\n}\n`;
    },
    repo(ctx, { name, layerPath, iface, ifaceRef, ifaceMethods = [], typeRefs = [] }) {
      const ns = this.ns(ctx, layerPath);
      const body = ifaceMethods.length
        ? this.stubMethods(ifaceMethods) + '\n\n    // TODO: persistencia (EF Core, Dapper, etc.)'
        : '    // TODO: persistencia (EF Core, Dapper, etc.)';
      const needsTask = ifaceMethods.some((m) => m.async);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...typeRefs];
      const usingBlock = renderImports([
        'using System;',
        needsTask ? 'using System.Threading.Tasks;' : '',
        ...this.refUsings(ctx, layerPath, refs),
      ]);
      return `${usingBlock}namespace ${ns};\n\npublic class ${name} : ${iface}\n{\n${body}\n}\n`;
    },
    useCase(ctx, { name, layerPath }) {
      const ns = this.ns(ctx, layerPath);
      return `namespace ${ns};\n\npublic class ${name}\n{\n    public Task ExecuteAsync()\n    {\n        // TODO: orquesta el caso de uso\n        return Task.CompletedTask;\n    }\n}\n`;
    },
  },

  // ─── Spring Boot (Java) ──────────────────────────────────────────────────
  'spring-boot': {
    base: 'src/main/java/com/example/app',
    ext: 'java',
    lang: 'java',
    /**
     * P0-3: el package SIEMPRE se deriva exactamente del mismo `layerPath`
     * usado para construir la ruta física (ver srcPath/ROOT_PKG más abajo),
     * preservando el mismo casing en ambos. Antes el package forzaba
     * lower-case mientras la carpeta física mantenía PascalCase, generando
     * una ruta que no coincidía con el package declarado.
     */
    pkg(layerPath) {
      return `${ROOT_PKG}.${layerPath.replace(/\//g, '.')}`;
    },
    /** `import` exacto para consumir una referencia { name, layerPath } generada en otra capa. */
    importFor(ref) {
      return `import ${this.pkg(ref.layerPath)}.${ref.name};`;
    },
    /** Firma Java válida: `TipoRetorno nombre(TipoParam param, ...);` */
    methodSignature({ name, returnType, parameters = [] }) {
      const ret = resolveType('java', returnType);
      const params = parameters.map((p) => `${resolveType('java', p.type)} ${p.name}`).join(', ');
      return `${ret} ${name}(${params})`;
    },
    refImports(layerPath, refs) {
      return refs
        .filter((r) => r && r.layerPath && r.layerPath !== layerPath)
        .map((r) => this.importFor(r));
    },
    iface(_ctx, { name, layerPath, methods = [], imports = [], refs = [] }) {
      const body = methods.length
        ? methods.map((m) => `    ${this.methodSignature(m)};`).join('\n')
        : '    // TODO: define el contrato';
      const importBlock = renderImports([...this.refImports(layerPath, refs), ...imports]);
      return `package ${this.pkg(layerPath)};\n\n${importBlock}public interface ${name} {\n${body}\n}\n`;
    },
    dto(_ctx, { name, layerPath, fields = [] }) {
      const props = fields.length
        ? fields.map((f) => `${resolveType('java', f.type)} ${f.name}`).join(', ')
        : 'Long id, String name';
      return `package ${this.pkg(layerPath)};\n\npublic record ${name}(${props}) {}\n`;
    },
    /**
     * Clase marcador para un tipo de dominio referenciado en firmas de método
     * (Entity, Aggregate, Command, ...) pero que ningún blueprint modela aún
     * con campos propios. Genera un archivo real y compilable para que la
     * referencia NUNCA apunte a un tipo inexistente (P0-2 / consistencia).
     */
    domainType(_ctx, { name, layerPath }) {
      return `package ${this.pkg(layerPath)};\n\n/**\n * Marcador de dominio generado automáticamente porque "${name}" se referencia\n * en una o más firmas de método. Reemplázalo con tus propios campos.\n */\npublic class ${name} {\n}\n`;
    },
    /** Cuerpo de método stub que SÍ compila: @Override + lanza UnsupportedOperationException. */
    stubMethods(methods) {
      return methods.map((m) => {
        const sig = this.methodSignature(m);
        return `    @Override\n    public ${sig} {\n        throw new UnsupportedOperationException("Not implemented yet.");\n    }`;
      }).join('\n\n');
    },
    service(_ctx, { name, layerPath, iface, ifaceRef, deps = [], annotate = '@Service', ifaceMethods = [], typeRefs = [] }) {
      const frameworkImport = annotate === '@Service'
        ? 'import org.springframework.stereotype.Service;' : '';
      const ctorArgs = deps.map((d) => `${d.type} ${d.field}`).join(', ');
      const fields = deps.map((d) => `    private final ${d.type} ${d.field};`).join('\n');
      const assigns = deps.map((d) => `        this.${d.field} = ${d.field};`).join('\n');
      const impl = iface ? ` implements ${iface}` : '';
      const stubs = ifaceMethods.length ? '\n\n' + this.stubMethods(ifaceMethods) : '\n\n    // TODO: implementa la lógica';
      const depRefs = deps.map((d) => d.ref).filter(Boolean);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...depRefs, ...typeRefs];
      const importBlock = renderImports([frameworkImport, ...this.refImports(layerPath, refs)]);
      return `package ${this.pkg(layerPath)};\n\n${importBlock}${annotate}\npublic class ${name}${impl} {\n${fields ? fields + '\n\n' : ''}    public ${name}(${ctorArgs}) {\n${assigns}\n    }${stubs}\n}\n`;
    },
    repo(_ctx, { name, layerPath, iface, ifaceRef, ifaceMethods = [], typeRefs = [] }) {
      const body = ifaceMethods.length
        ? this.stubMethods(ifaceMethods) + '\n\n    // TODO: persistencia (JPA, JDBC...)'
        : '    // TODO: persistencia (JPA, JDBC...)';
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...typeRefs];
      const importBlock = renderImports([
        'import org.springframework.stereotype.Repository;',
        ...this.refImports(layerPath, refs),
      ]);
      return `package ${this.pkg(layerPath)};\n\n${importBlock}@Repository\npublic class ${name} implements ${iface} {\n${body}\n}\n`;
    },
    useCase(_ctx, { name, layerPath }) {
      return `package ${this.pkg(layerPath)};\n\npublic class ${name} {\n    public void execute() {\n        // TODO: orquesta el caso de uso\n    }\n}\n`;
    },
  },

  // ─── Laravel (PHP) ───────────────────────────────────────────────────────
  laravel: {
    base: 'src',
    ext: 'php',
    lang: 'php',
    ns: (layerPath) => `App\\${layerPath.replace(/\//g, '\\')}`,
    /** `use` exacto para consumir una referencia { name, layerPath } generada en otra capa. */
    useFor(ref) {
      return `use ${this.ns(ref.layerPath)}\\${ref.name};`;
    },
    /** Firma PHP válida: `nombre(TipoParam $param, ...): TipoRetorno;` */
    methodSignature({ name, returnType, parameters = [], nullableReturn = false }) {
      const ret0 = resolveType('php', returnType);
      const ret = nullableReturn && ret0 !== 'void' ? `?${ret0}` : ret0;
      const params = parameters
        .map((p) => `${resolveType('php', p.type)} $${p.name}`)
        .join(', ');
      return `${name}(${params}): ${ret}`;
    },
    refUses(layerPath, refs) {
      return refs
        .filter((r) => r && r.layerPath && r.layerPath !== layerPath)
        .map((r) => this.useFor(r));
    },
    iface(_ctx, { name, layerPath, methods = [], uses = [], refs = [] }) {
      const body = methods.length
        ? methods.map((m) => `    public function ${this.methodSignature(m)};`).join('\n')
        : '    // TODO: define el contrato';
      const importBlock = renderImports([...this.refUses(layerPath, refs), ...uses]);
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\n${importBlock}interface ${name}\n{\n${body}\n}\n`;
    },
    dto(_ctx, { name, layerPath, fields = [] }) {
      const props = (fields.length ? fields : [{ type: 'int', name: 'id' }, { type: 'string', name: 'name' }])
        .map((f) => `        public readonly ${resolveType('php', f.type)} $${f.name},`).join('\n');
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\nfinal class ${name}\n{\n    public function __construct(\n${props}\n    ) {}\n}\n`;
    },
    /**
     * Clase marcador para un tipo de dominio referenciado en firmas de método
     * (Entity, Aggregate, Command, ...) pero que ningún blueprint modela aún
     * con campos propios. Genera un archivo real y compilable para que la
     * referencia NUNCA apunte a un tipo inexistente (P0-2 / consistencia).
     */
    domainType(_ctx, { name, layerPath }) {
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\n/**\n * Marcador de dominio generado automáticamente porque "${name}" se referencia\n * en una o más firmas de método. Reemplázalo con tus propios campos.\n */\nfinal class ${name}\n{\n}\n`;
    },
    /** Cuerpo de método stub que SÍ compila: implementa la firma y lanza RuntimeException. */
    stubMethods(methods) {
      return methods.map((m) => {
        const sig = this.methodSignature(m);
        return `    public function ${sig}\n    {\n        throw new \\RuntimeException('Not implemented yet.');\n    }`;
      }).join('\n\n');
    },
    service(_ctx, { name, layerPath, iface, ifaceRef, deps = [], ifaceMethods = [], typeRefs = [] }) {
      const ctorArgs = deps.map((d) => `        private readonly ${d.type} $${d.field},`).join('\n');
      const impl = iface ? ` implements ${iface}` : '';
      const stubs = ifaceMethods.length ? '\n\n' + this.stubMethods(ifaceMethods) : '\n\n    // TODO: implementa la lógica';
      const depRefs = deps.map((d) => d.ref).filter(Boolean);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...depRefs, ...typeRefs];
      const importBlock = renderImports(this.refUses(layerPath, refs));
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\n${importBlock}class ${name}${impl}\n{\n    public function __construct(\n${ctorArgs}\n    ) {}${stubs}\n}\n`;
    },
    repo(_ctx, { name, layerPath, iface, ifaceRef, ifaceMethods = [], typeRefs = [] }) {
      const body = ifaceMethods.length
        ? this.stubMethods(ifaceMethods) + '\n\n    // TODO: persistencia (Eloquent, Query Builder...)'
        : '    // TODO: persistencia (Eloquent, Query Builder...)';
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...typeRefs];
      const importBlock = renderImports(this.refUses(layerPath, refs));
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\n${importBlock}class ${name} implements ${iface}\n{\n${body}\n}\n`;
    },
    useCase(_ctx, { name, layerPath }) {
      return `<?php\n\nnamespace ${this.ns(layerPath)};\n\nclass ${name}\n{\n    public function execute(): void\n    {\n        // TODO: orquesta el caso de uso\n    }\n}\n`;
    },
  },

  // ─── FastAPI (Python) ────────────────────────────────────────────────────
  fastapi: {
    base: 'app',
    ext: 'py',
    lang: 'python',
    /**
     * Ruta de módulo Python a partir de un layerPath lógico: 'Domain/Ports/Output'
     * -> 'app.domain.ports.output' (todo en snake_case/minúsculas, como exige PEP 8
     * para nombres de paquete).
     */
    modulePath(layerPath) {
      return ['app', ...layerPath.split('/').map((s) => s.toLowerCase())].join('.');
    },
    /** `from ... import ...` exacto para consumir una referencia { name, layerPath }. */
    importFor(ref) {
      const fileModule = toSnakeCase(ref.name);
      return `from ${this.modulePath(ref.layerPath)}.${fileModule} import ${ref.name}`;
    },
    /** Firma Python válida: `def nombre(self, param: Tipo) -> TipoRetorno: ...` */
    methodSignature({ name, returnType, parameters = [], async = false, nullableReturn = false }) {
      const ret0 = resolveType('python', returnType);
      const ret = nullableReturn && ret0 !== 'None' ? `Optional[${ret0}]` : ret0;
      const params = parameters.map((p) => `${p.name}: ${resolveType('python', p.type)}`).join(', ');
      const sig = params ? `self, ${params}` : 'self';
      return `${async ? 'async def' : 'def'} ${name}(${sig}) -> ${ret}`;
    },
    /**
     * A diferencia de C#/Java/PHP, en Python CADA archivo es su propio módulo:
     * compartir `layerPath` (misma carpeta lógica) NO exime del import, porque
     * no existe un "mismo namespace implícito" entre archivos de una carpeta.
     * Solo se excluye la auto-referencia (el propio archivo que se está
     * generando, identificado por nombre exacto).
     */
    refImports(selfName, refs) {
      return refs
        .filter((r) => r && r.layerPath && r.name !== selfName)
        .map((r) => this.importFor(r));
    },
    iface(_ctx, { name, layerPath, methods = [], refs = [] }) {
      const needsOptional = methods.some((m) => m.nullableReturn);
      const body = methods.length
        ? methods.map((m) => `    @abstractmethod\n    ${this.methodSignature(m)}: ...`).join('\n\n')
        : '    @abstractmethod\n    def execute(self) -> None: ...';
      const typingImport = needsOptional ? 'from typing import Optional' : '';
      const refImportBlock = this.refImports(name, refs);
      const importBlock = renderImports(['from abc import ABC, abstractmethod', typingImport, ...refImportBlock]);
      return `${importBlock}class ${name}(ABC):\n${body}\n`;
    },
    dto(_ctx, { name, fields = [] }) {
      const props = (fields.length ? fields : [{ type: 'int', name: 'id' }, { type: 'str', name: 'name' }])
        .map((f) => `    ${f.name}: ${resolveType('python', f.type)}`).join('\n');
      return `from pydantic import BaseModel\n\n\nclass ${name}(BaseModel):\n${props}\n`;
    },
    /**
     * Clase marcador para un tipo de dominio referenciado en firmas de método
     * (Entity, Aggregate, Command, ...) pero que ningún blueprint modela aún
     * con campos propios. Genera un archivo real para que la referencia NUNCA
     * apunte a un módulo inexistente (P0-2 / consistencia).
     */
    domainType(_ctx, { name }) {
      return `class ${name}:\n    """Marcador de dominio generado automáticamente porque "${name}" se\n    referencia en una o más firmas de método. Reemplázalo con tus propios campos.\n    """\n    pass\n`;
    },
    /** Cuerpo de método stub que SÍ se puede instanciar: implementa el abstractmethod y lanza NotImplementedError. */
    stubMethods(methods) {
      return methods.map((m) => {
        const sig = this.methodSignature(m);
        return `    ${sig}:\n        raise NotImplementedError`;
      }).join('\n\n');
    },
    service(_ctx, { name, layerPath, iface, ifaceRef, deps = [], ifaceMethods = [], typeRefs = [] }) {
      const ctorArgs = deps.map((d) => `${d.field}: ${d.type}`).join(', ');
      const assigns = deps.map((d) => `        self._${d.field} = ${d.field}`).join('\n')
        || '        pass';
      const base = iface ? `(${iface})` : '';
      const stubs = ifaceMethods.length ? '\n\n' + this.stubMethods(ifaceMethods) : '\n\n    # TODO: implementa la lógica';
      const needsOptional = ifaceMethods.some((m) => m.nullableReturn);
      const depRefs = deps.map((d) => d.ref).filter(Boolean);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...depRefs, ...typeRefs];
      const importBlock = renderImports([
        needsOptional ? 'from typing import Optional' : '',
        ...this.refImports(name, refs),
      ]);
      return `${importBlock}class ${name}${base}:\n    def __init__(self${ctorArgs ? ', ' + ctorArgs : ''}) -> None:\n${assigns}${stubs}\n`;
    },
    repo(_ctx, { name, layerPath, iface, ifaceRef, ifaceMethods = [], typeRefs = [] }) {
      const base = iface ? `(${iface})` : '';
      const body = ifaceMethods.length
        ? this.stubMethods(ifaceMethods) + '\n\n    # TODO: persistencia (SQLAlchemy, etc.)'
        : '    # TODO: persistencia (SQLAlchemy, etc.)\n    ...';
      const needsOptional = ifaceMethods.some((m) => m.nullableReturn);
      const refs = [...(ifaceRef ? [ifaceRef] : []), ...typeRefs];
      const importBlock = renderImports([
        needsOptional ? 'from typing import Optional' : '',
        ...this.refImports(name, refs),
      ]);
      return `${importBlock}class ${name}${base}:\n${body}\n`;
    },
    useCase(_ctx, { name }) {
      return `class ${name}:\n    async def execute(self) -> None:\n        # TODO: orquesta el caso de uso\n        ...\n`;
    },
  },
};

/** @param {string} framework */
function getEmitter(framework) {
  const e = EMITTERS[framework];
  if (!e) {
    throw new Error(
      `No hay emitter para el framework "${framework}". ` +
      `Frameworks con arquitecturas avanzadas: ${Object.keys(EMITTERS).join(', ')}.`
    );
  }
  return e;
}

/** Construye la ruta física de un archivo de código fuente. */
function srcPath(emitter, layerPath, fileName) {
  return `${emitter.base}/${layerPath}/${fileName}.${emitter.ext}`;
}

module.exports = { EMITTERS, getEmitter, srcPath, resolveType, ROOT_PKG, PRIMITIVE_TYPES, toSnakeCase };
