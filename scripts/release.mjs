#!/usr/bin/env node
/**
 * OMS Release Script
 *
 * Usage:
 *   node scripts/release.mjs 1.1.0
 *   GH_TOKEN=xxx node scripts/release.mjs 1.1.0
 *
 * Prerequisites:
 *   - GH_TOKEN env var with "repo" scope (generate at github.com/settings/tokens)
 *   - git remote must be set to github.com
 *   - macOS: builds .dmg automatically
 *   - Windows: requires cross-compile via GitHub Actions (handled automatically)
 */

import { execSync, spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, dirname, basename } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_COMMAND = 'npm run build && npm run build:all && npx electron-builder --publish never';

// ─── Colors ───────────────────────────────────────────────────────────────────
const dim = (s) => `\x1b[2m${s}\x1b[0m`;
const bold = (s) => `\x1b[1m${s}\x1b[0m`;
const green = (s) => `\x1b[32m${s}\x1b[0m`;
const red = (s) => `\x1b[31m${s}\x1b[0m`;
const yellow = (s) => `\x1b[33m${s}\x1b[0m`;
const cyan = (s) => `\x1b[36m${s}\x1b[0m`;

function log(step, msg) {
  console.log(`${dim('[')}${cyan(step)}${dim(']')} ${msg}`);
}

function run(cmd, opts = {}) {
  const { silent = false, cwd = ROOT } = opts;
  if (!silent) console.log(`  ${dim('$')} ${cmd}`);
  const result = spawnSync(cmd, {
    cwd,
    stdio: silent ? 'pipe' : 'inherit',
    shell: true,
      encoding: 'utf-8',
  });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd}\n${result.stderr ?? result.stdout ?? ''}`);
  }
  return result;
}

function exec(cmd) {
  const buf = execSync(cmd, { shell: true });
  return buf?.toString('utf-8') ?? '';
}

function runOrWarn(cmd, opts = {}) {
  try {
    return run(cmd, opts);
  } catch (e) {
    console.warn(`  ${yellow('⚠')} ${e.message}`);
  }
}

// ─── Validate args ─────────────────────────────────────────────────────────────
const VERSION = process.argv[2];
if (!VERSION) {
  console.error(`${red('✖')} Usage: node scripts/release.mjs <version>`);
  console.error(`   Example: node scripts/release.mjs 1.1.0`);
  process.exit(1);
}

const SEMVER_RE = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
if (!SEMVER_RE.test(VERSION)) {
  console.error(`${red('✖')} Invalid version format: "${VERSION}"`);
  console.error(`   Expected semver (e.g. 1.1.0, 1.2.0-beta.1)`);
  process.exit(1);
}

const TAG = `v${VERSION}`;
const GH_TOKEN = process.env.GH_TOKEN;
if (!GH_TOKEN) {
  console.error(`${red('✖')} GH_TOKEN env var is required.`);
  console.error(`   Generate one at: https://github.com/settings/tokens`);
  console.error(`   Required scopes: repo (full control)`);
  console.error(`   Then run: GH_TOKEN=xxx node scripts/release.mjs ${VERSION}`);
  process.exit(1);
}

// ─── Check prerequisites ───────────────────────────────────────────────────────
log('1/7', bold('Checking prerequisites...'));

run('git fetch --all --tags', { silent: true });

const tags = run('git tag', { silent: true }).stdout?.trim().split('\n') ?? [];
if (tags.includes(TAG)) {
  console.error(`${red('✖')} Tag ${TAG} already exists!`);
  console.error(`   Run ${dim('git tag -d ' + TAG)} to delete it first.`);
  process.exit(1);
}

const status = run('git status --porcelain', { silent: true }).stdout?.trim() ?? '';
if (status) {
  console.error(`${red('✖')} Working directory is dirty. Commit or stash changes first.`);
  console.error(`   Run ${dim('git status')} to see what's changed.`);
  process.exit(1);
}

const branch = run('git branch --show-current', { silent: true }).stdout?.trim() ?? '';
if (branch === 'main' || branch === 'master') {
  console.warn(`${yellow('⚠')} You are on "${branch}" branch.`);
  console.warn(`  ${dim('Consider creating a release branch instead: git checkout -b release/${VERSION}')}`);
}

log('1/7', green('✓') + ` Prerequisites OK`);

// ─── Update version ───────────────────────────────────────────────────────────
log('2/8', bold(`Bumping version to ${cyan(VERSION)}...`));

const pkgPath = join(ROOT, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const oldVersion = pkg.version;
pkg.version = VERSION;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const releaseNotesPath = join(ROOT, 'release-notes.md');
let releaseBody = `## What's New\n\n`;
if (existsSync(releaseNotesPath)) {
  releaseBody = readFileSync(releaseNotesPath, 'utf-8');
}

// ─── Update docs/index.html version links ──────────────────────────────────
log('3/8', bold('Updating docs/index.html download links...'));

const docsPath = join(ROOT, 'docs', 'index.html');
let docsHtml = readFileSync(docsPath, 'utf-8');

const githubBase = 'https://github.com/yzykevin/oh_my_music_studio/releases/download';
const dmgFileName = `OMS-${VERSION}-arm64.dmg`;
const exeFileName = `OMS.Setup.${VERSION}.exe`;
const dmgUrl = `${githubBase}/v${VERSION}/${dmgFileName}`;
const exeUrl = `${githubBase}/v${VERSION}/${exeFileName}`;

// Update static download links (href attribute)
docsHtml = docsHtml.replace(
  /href="https:\/\/github\.com\/yzykevin\/oh_my_music_studio\/releases\/download\/[^"]+\/OMS-[^"]+\.dmg"/g,
  `href="${dmgUrl}"`
);
docsHtml = docsHtml.replace(
  /href="https:\/\/github\.com\/yzykevin\/oh_my_music_studio\/releases\/download\/[^"]+\/OMS\.[^"]+\.exe"/g,
  `href="${exeUrl}"`
);

// Update JS download URLs
docsHtml = docsHtml.replace(
  /btnPrimary\.href = 'https:\/\/github\.com\/yzykevin\/oh_my_music_studio\/releases\/download\/[^']+\/OMS-[^']+\.dmg'/g,
  `btnPrimary.href = '${dmgUrl}'`
);
docsHtml = docsHtml.replace(
  /btnPrimary\.href = 'https:\/\/github\.com\/yzykevin\/oh_my_music_studio\/releases\/download\/[^']+\/OMS\.[^']+\.exe'/g,
  `btnPrimary.href = '${exeUrl}'`
);

// Update SVG version badge (e.g. v1.1.5)
docsHtml = docsHtml.replace(
  />(v\d+\.\d+\.\d+)<\/text>/g,
  `>v${VERSION}</text>`
);

writeFileSync(docsPath, docsHtml, 'utf-8');
log('3/8', green('✓') + ` Updated download URLs to v${VERSION}`);

// Only commit if there are changes
const changedFiles = exec(`git status --porcelain`).trim();
if (changedFiles) {
  run(`git add package.json docs/index.html`);
  run(`git commit -m "chore: bump version to ${VERSION}"`);
  log('4/8', green('✓') + ` ${oldVersion} → ${VERSION}`);
} else {
  log('4/8', yellow('—') + ` No changes to commit (already at ${VERSION})`);
}

// ─── Build macOS DMG ─────────────────────────────────────────────────────────
log('4/8', bold('Building macOS DMG...'));

if (!existsSync(join(ROOT, 'build', 'icon.icns'))) {
  console.error(`${red('✖')} build/icon.icns not found. Run ${dim('node build/generate-icon.mjs')} first.`);
  process.exit(1);
}

run('npm ci', { silent: true });
const buildResult = run(BUILD_COMMAND);

if (buildResult.status !== 0) {
  console.error(`${red('✖')} Build failed. Check errors above.`);
  process.exit(1);
}

const releaseDir = join(ROOT, 'release');
const dmgFiles = exec(`ls "${releaseDir}"/*.dmg 2>/dev/null || echo ""`)
  .trim()
  .split('\n')
  .filter(Boolean);

const dmgFile = dmgFiles.find((f) => f.includes(`-${VERSION}-`) || f.includes(`-${VERSION}.`)) ?? dmgFiles[dmgFiles.length - 1];

if (!dmgFile || !existsSync(dmgFile)) {
  console.error(`${red('✖')} DMG not found in ${releaseDir}`);
  exec(`ls -la "${releaseDir}"/*.dmg`);
  process.exit(1);
}

log('4/8', green('✓') + ` ${dmgFile}`);

// ─── Tag & push ────────────────────────────────────────────────────────────────
log('5/8', bold('Creating git tag...'));
run(`git tag -a ${TAG} -m "Release ${TAG}"`);
log('5/8', green('✓') + ` Tagged ${TAG}`);
log('5/8', bold('Pushing to remote...'));
run(`git push origin ${TAG}`);
run(`git push origin HEAD`);
log('5/8', green('✓') + ` Pushed`);

// ─── Get commit SHA for release ────────────────────────────────────────────────
const sha = run('git rev-parse HEAD', { silent: true }).stdout?.trim() ?? '';

// ─── Create GitHub Release ──────────────────────────────────────────────────────
log('6/8', bold('Creating GitHub Release...'));

// Detect repo from git remote
const remoteUrl = run('git remote get-url origin', { silent: true }).stdout?.trim() ?? '';
const repoMatch = remoteUrl.match(/github\.com[:/](.+?)(?:\.git)?$/);
const repo = repoMatch?.[1] ?? '';

const releaseTitle = `OMS v${VERSION}`;

let releaseId = '';
try {
  // Check if release already exists
  let existingId = '';
  try {
    const existing = run(`gh release view ${TAG} --json id --jq .id`, { silent: true });
    existingId = existing.stdout?.trim() ?? '';
  } catch {
    existingId = '';
  }

  if (existingId) {
    releaseId = existingId;
    log('6/8', green('✓') + ` Release ${TAG} already exists`);
  } else {
    // Write release body to temp file to avoid JSON escaping issues
    const bodyPath = join(ROOT, '.release-body.tmp');
    writeFileSync(bodyPath, releaseBody, 'utf-8');

    run(`gh release create ${TAG} --title "${releaseTitle}" --notes-file "${bodyPath}" --draft`);

    const viewResult = run(`gh release view ${TAG} --json id --jq .id`, { silent: true });
    releaseId = viewResult.stdout?.trim() ?? '';

    if (!releaseId) {
      throw new Error(`Release ${TAG} was not created successfully`);
    }

    log('6/8', green('✓') + ` Draft release created`);
  }
} catch (e) {
  console.error(`${red('✖')} Failed to create GitHub release`);
  console.error(`   ${e.message}`);
  console.error(`   You can manually create the release at: https://github.com/${repo}/releases/new?tag=${TAG}`);
  process.exit(1);
}

// ─── Upload DMG ───────────────────────────────────────────────────────────────
log('7/8', bold('Uploading DMG to release...'));

try {
  if (!releaseId) {
    throw new Error(`Release ${TAG} does not exist`);
  }
  const uploadResult = spawnSync('gh', ['release', 'upload', TAG, dmgFile, '--clobber'], {
    cwd: ROOT,
    stdio: 'inherit',
    timeout: 600000, // 10 min timeout for 200MB+ file
  });
  if (uploadResult.status !== 0) {
    throw new Error(uploadResult.stderr || 'Upload failed');
  }
  log('7/8', green('✓') + ` DMG uploaded`);
} catch (e) {
  console.warn(`${yellow('⚠')} DMG upload failed: ${e.message}`);
  console.warn(`   Manually: gh release upload "${TAG}" "${dmgFile}"`);
  console.warn(`   Or upload at: https://github.com/${repo}/releases/edit/${TAG}`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
log('8/8', bold('Done!'));

console.log(`\n${green('━'.repeat(60))}`);
console.log(`  ${bold('Release Summary')}`);
console.log(`  ${dim('-'.repeat(50))}`);
console.log(`  Version   : ${cyan(VERSION)}`);
console.log(`  Tag       : ${dim(TAG)}`);
console.log(`  Commit    : ${dim(sha)}`);
console.log(`  Artifact  : ${dim(dmgFile)}`);
console.log(`  ${dim('-'.repeat(50))}`);
console.log(`  ${green('Draft release created')} at:`);
console.log(`  ${dim(`https://github.com/${repo}/releases/edit/${TAG}`)}`);
console.log(`  ${yellow('→ Edit the release notes, then click Publish release')}`);
console.log(`${green('━'.repeat(60))}\n`);
