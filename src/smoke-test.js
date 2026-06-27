// @ts-check
'use strict';

/**
 * Smoke test — verifica que todos los frameworks generan correctamente.
 *
 * Frameworks con generadores oficiales (requieren herramienta instalada):
 *   spring-boot/mvc, spring-boot/api, spring-boot/clean
 *   aspnet/mvc, aspnet/api, aspnet/clean
 *   laravel/mvc, laravel/api, laravel/clean
 *
 * Frameworks basados en plantillas (siempre funcionan, sin herramientas):
 *   django, fastapi, angular, react-vite, nextjs, nestjs
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');
const { buildProject } = require('./services/projectBuilder');

// ── Helpers ───────────────────────────────────────────────────────────────────

const tmpdir = fs.mkdtempSync(path.join(os.tmpdir(), 'tabbuilder-smoke-'));

function cleanup() {
  try {
    fs.rmSync(tmpdir, { recursive: true, force: true });
    console.log('\nCleanup:', tmpdir);
  } catch (_) { /* intentional */ }
}

function commandExists(cmd, args = ['--version']) {
  const r = spawnSync(cmd, args, { stdio: 'ignore' });
  return r && r.status === 0;
}

let passed = 0;
let skipped = 0;
let failed = 0;
const failures = [];

async function runCase(label, fn) {
  process.stdout.write(`  ${label}... `);
  try {
    const skip = await fn();
    if (skip === 'SKIP') {
      console.log('SKIP (herramienta no disponible)');
      skipped++;
    } else {
      console.log('OK');
      passed++;
    }
  } catch (err) {
    console.log('FAIL');
    console.error(`    → ${err.message}`);
    failures.push({ label, error: err.message });
    failed++;
  }
}

async function generate(frameworkId, architectureId, name) {
  const projectFolder = path.join(tmpdir, `${frameworkId}-${architectureId}`);
  fs.mkdirSync(projectFolder, { recursive: true });
  const result = await buildProject({
    name,
    frameworkId,
    architectureId,
    database: 'none',
    devops: 'none',
    targetFolder: projectFolder,
  });
  if (!result.success) throw new Error(result.error || 'buildProject failed');
  return result;
}

// ── Spring Boot ───────────────────────────────────────────────────────────────

async function testSpringBoot() {
  const hasGit    = commandExists('git');
  const hasSpring = commandExists('spring');
  const hasCurl   = commandExists('curl');
  const hasWget   = commandExists('wget');
  const hasUnzip  = commandExists('unzip', ['-v']);
  const canGen    = hasSpring || ((hasCurl || hasWget) && hasUnzip);

  console.log('\n[Spring Boot]');
  await runCase('spring-boot/mvc', async () => {
    if (!hasGit || !canGen) return 'SKIP';
    const r = await generate('spring-boot', 'mvc', 'SmokeSpring');
    if (!fs.existsSync(path.join(r.projectPath, 'pom.xml')))
      throw new Error('pom.xml not found');
  });
  await runCase('spring-boot/api', async () => {
    if (!hasGit || !canGen) return 'SKIP';
    const r = await generate('spring-boot', 'api', 'SmokeSpring');
    if (!fs.existsSync(path.join(r.projectPath, 'pom.xml')))
      throw new Error('pom.xml not found');
  });
  await runCase('spring-boot/clean', async () => {
    if (!hasGit || !canGen) return 'SKIP';
    const r = await generate('spring-boot', 'clean', 'SmokeSpring');
    if (!fs.existsSync(path.join(r.projectPath, 'pom.xml')))
      throw new Error('pom.xml not found');
  });
}

// ── ASP.NET Core ─────────────────────────────────────────────────────────────

async function testAspNet() {
  const hasDotnet = commandExists('dotnet');
  console.log('\n[ASP.NET Core]');
  await runCase('aspnet/mvc', async () => {
    if (!hasDotnet) return 'SKIP';
    const r = await generate('aspnet', 'mvc', 'SmokeAspNet');
    const csproj = fs.readdirSync(r.projectPath).find((f) => f.endsWith('.csproj'));
    if (!csproj) throw new Error('.csproj not found');
  });
  await runCase('aspnet/api', async () => {
    if (!hasDotnet) return 'SKIP';
    const r = await generate('aspnet', 'api', 'SmokeAspNet');
    const csproj = fs.readdirSync(r.projectPath).find((f) => f.endsWith('.csproj'));
    if (!csproj) throw new Error('.csproj not found');
  });
  await runCase('aspnet/clean', async () => {
    if (!hasDotnet) return 'SKIP';
    const r = await generate('aspnet', 'clean', 'SmokeAspNet');
    // Clean arch: solution at root + projects under src/
    const sln = fs.readdirSync(r.projectPath).find((f) => f.endsWith('.sln'));
    if (!sln) throw new Error('.sln not found');
    const domainCsproj = path.join(r.projectPath, 'src', 'SmokeAspNet.Domain', 'SmokeAspNet.Domain.csproj');
    if (!fs.existsSync(domainCsproj)) throw new Error('Domain .csproj not found');
  });
}

// ── Laravel ───────────────────────────────────────────────────────────────────

async function testLaravel() {
  const hasComposer = commandExists('composer');
  const hasPhp      = commandExists('php');
  console.log('\n[Laravel]');
  await runCase('laravel/mvc', async () => {
    if (!hasComposer || !hasPhp) return 'SKIP';
    const r = await generate('laravel', 'mvc', 'SmokeLaravel');
    if (!fs.existsSync(path.join(r.projectPath, 'artisan')))
      throw new Error('artisan not found');
  });
  await runCase('laravel/api', async () => {
    if (!hasComposer || !hasPhp) return 'SKIP';
    const r = await generate('laravel', 'api', 'SmokeLaravel');
    if (!fs.existsSync(path.join(r.projectPath, 'artisan')))
      throw new Error('artisan not found');
  });
  await runCase('laravel/clean', async () => {
    if (!hasComposer || !hasPhp) return 'SKIP';
    const r = await generate('laravel', 'clean', 'SmokeLaravel');
    if (!fs.existsSync(path.join(r.projectPath, 'artisan')))
      throw new Error('artisan not found');
  });
}

// ── Template-based frameworks (no external tools needed) ──────────────────────

async function testTemplateBased() {
  console.log('\n[Template-based frameworks]');

  await runCase('django', async () => {
    const r = await generate('django', 'mvc', 'SmokeApp');
    const settingsDir = path.join(r.projectPath, 'SmokeApp');
    if (!fs.existsSync(path.join(settingsDir, 'settings.py')))
      throw new Error('settings.py not found');
  });

  await runCase('fastapi', async () => {
    const r = await generate('fastapi', 'mvc', 'SmokeApp');
    if (!fs.existsSync(path.join(r.projectPath, 'app', 'main.py')))
      throw new Error('app/main.py not found');
  });

  await runCase('angular', async () => {
    const r = await generate('angular', 'mvc', 'SmokeApp');
    if (!fs.existsSync(path.join(r.projectPath, 'src', 'main.ts')))
      throw new Error('src/main.ts not found');
  });

  await runCase('react (react-vite)', async () => {
    const r = await generate('react-vite', 'mvc', 'SmokeApp');
    if (!fs.existsSync(path.join(r.projectPath, 'src', 'App.jsx')))
      throw new Error('src/App.jsx not found');
  });

  await runCase('nextjs', async () => {
    const r = await generate('nextjs', 'mvc', 'SmokeApp');
    if (!fs.existsSync(path.join(r.projectPath, 'app', 'page.tsx')))
      throw new Error('app/page.tsx not found');
  });

  await runCase('nestjs', async () => {
    const r = await generate('nestjs', 'mvc', 'SmokeApp');
    if (!fs.existsSync(path.join(r.projectPath, 'src', 'main.ts')))
      throw new Error('src/main.ts not found');
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('TabBuilder Smoke Test');
  console.log('='.repeat(50));
  console.log('tmpdir:', tmpdir);

  await testSpringBoot();
  await testAspNet();
  await testLaravel();
  await testTemplateBased();

  console.log('\n' + '='.repeat(50));
  console.log(`Results: ${passed} passed, ${skipped} skipped, ${failed} failed`);

  if (failures.length > 0) {
    console.error('\nFailures:');
    for (const f of failures) {
      console.error(`  ✗ ${f.label}: ${f.error}`);
    }
  }

  cleanup();

  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err.message);
  cleanup();
  process.exit(1);
});
