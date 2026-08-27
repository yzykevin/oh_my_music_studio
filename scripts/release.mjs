#!/usr/bin/env node
/**
 * OMS release helper.
 *
 * Local test:
 *   npm run release:test
 *
 * Release through GitHub Actions:
 *   npm run release -- 1.1.8
 *
 * Re-run an existing tag:
 *   npm run release -- --dispatch v1.1.8
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PACKAGE_PATH = join(ROOT, 'package.json');
const LOCK_PATH = join(ROOT, 'package-lock.json');
const DOCS_PATH = join(ROOT, 'docs', 'index.html');
const RELEASE_DIR = join(ROOT, 'release');

const colors = {
  dim: (value) => `\x1b[2m${value}\x1b[0m`,
  bold: (value) => `\x1b[1m${value}\x1b[0m`,
  green: (value) => `\x1b[32m${value}\x1b[0m`,
  red: (value) => `\x1b[31m${value}\x1b[0m`,
  yellow: (value) => `\x1b[33m${value}\x1b[0m`,
  cyan: (value) => `\x1b[36m${value}\x1b[0m`,
};

function log(step, message) {
  console.log(`${colors.dim(`[${step}]`)} ${message}`);
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: options.silent ? 'pipe' : 'inherit',
    encoding: 'utf-8',
    shell: false,
  });
  if (result.error || result.status !== 0) {
    const detail = result.error?.message || result.stderr || '';
    throw new Error(`${command} ${args.join(' ')} failed${detail ? `: ${detail}` : ''}`);
  }
  return result;
}

function getOutput(command, args) {
  return run(command, args, { silent: true }).stdout.trim();
}

function fail(message) {
  console.error(`${colors.red('✖')} ${message}`);
  process.exit(1);
}

function assertVersion(version) {
  if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
    fail(`Invalid version "${version}". Expected semver such as 1.1.8 or 1.2.0-beta.1.`);
  }
}

function checkCleanWorkingTree() {
  if (getOutput('git', ['status', '--porcelain'])) {
    fail('Working tree is not clean. Commit the current changes before releasing.');
  }
}

function updateVersionFiles(version) {
  const packageJson = JSON.parse(readFileSync(PACKAGE_PATH, 'utf-8'));
  const oldVersion = packageJson.version;
  packageJson.version = version;
  writeFileSync(PACKAGE_PATH, `${JSON.stringify(packageJson, null, 2)}\n`);

  const lockJson = JSON.parse(readFileSync(LOCK_PATH, 'utf-8'));
  lockJson.version = version;
  if (lockJson.packages?.['']) lockJson.packages[''].version = version;
  writeFileSync(LOCK_PATH, `${JSON.stringify(lockJson, null, 2)}\n`);

  const githubBase = 'https://github.com/yzykevin/oh_my_music_studio/releases/download';
  const docs = readFileSync(DOCS_PATH, 'utf-8')
    .replace(/(releases\/download\/)[^/]+\/(OMS-[^"']+\.dmg)/g, `$1v${version}/OMS-${version}-arm64.dmg`)
    .replace(/(releases\/download\/)[^/]+\/(OMS[.-][^"']+\.exe)/g, `$1v${version}/OMS-Setup-${version}.exe`)
    .replace(/(btnPrimary\.href = ')[^']+OMS-[^']+\.dmg'/g, `$1${githubBase}/v${version}/OMS-${version}-arm64.dmg'`)
    .replace(/(btnPrimary\.href = ')[^']+OMS[.-][^']+\.exe'/g, `$1${githubBase}/v${version}/OMS-Setup-${version}.exe'`)
    .replace(/>(v\d+\.\d+\.\d+)<\/text>/g, `>v${version}</text>`);
  writeFileSync(DOCS_PATH, docs);

  return oldVersion;
}

function runLocalTest() {
  log('1/4', colors.bold('Running tests...'));
  run('npm', ['test', '--', '--runInBand']);
  log('2/4', colors.bold('Building application...'));
  run('npm', ['run', 'build']);
  run('npm', ['run', 'build:all']);
  run('npx', ['electron-builder', '--publish', 'never']);

  if (process.platform === 'darwin') {
    const artifacts = readdirSync(RELEASE_DIR);
    const dmg = artifacts.some((file) => file.endsWith('.dmg'));
    const zip = artifacts.some((file) => file.endsWith('.zip'));
    const metadata = existsSync(join(RELEASE_DIR, 'latest-mac.yml'));
    if (!dmg || !zip || !metadata) {
      fail('macOS build did not produce DMG, ZIP and latest-mac.yml.');
    }
    log('3/4', colors.green('✓ macOS DMG, ZIP and latest-mac.yml are present'));
  } else {
    log('3/4', colors.yellow('— macOS artifacts were not checked on this platform'));
  }
  log('4/4', colors.green('Local release test passed'));
}

function getRepository() {
  const remote = getOutput('git', ['remote', 'get-url', 'origin']);
  const match = remote.match(/github\.com[:/](.+?)(?:\.git)?$/);
  if (!match) fail(`Origin is not a GitHub repository: ${remote}`);
  return match[1];
}

function dispatchExistingTag(tag, repository) {
  run('gh', ['workflow', 'run', 'release.yml', '--repo', repository, '--ref', tag, '--field', `tag=${tag}`]);
  console.log(`\n${colors.green('✓')} GitHub Actions dispatched for ${tag}`);
  console.log(`  https://github.com/${repository}/actions/workflows/release.yml`);
}

function release(version) {
  assertVersion(version);
  const tag = `v${version}`;
  const repository = getRepository();

  log('1/7', colors.bold('Checking release prerequisites...'));
  checkCleanWorkingTree();
  run('gh', ['auth', 'status']);
  const existingTags = getOutput('git', ['tag', '--list', tag]);
  if (existingTags === tag) fail(`Tag ${tag} already exists. Use --dispatch ${tag} to rebuild it.`);
  log('1/7', colors.green('✓ Prerequisites OK'));

  log('2/7', colors.bold('Running the complete local release test before publishing...'));
  runLocalTest();
  checkCleanWorkingTree();

  log('3/7', colors.bold(`Updating version to ${colors.cyan(version)}...`));
  const oldVersion = updateVersionFiles(version);
  run('git', ['add', 'package.json', 'package-lock.json', 'docs/index.html']);
  run('git', ['commit', '-m', `chore: bump version to ${version}`]);
  log('3/7', colors.green(`✓ ${oldVersion} → ${version}`));

  log('4/7', colors.bold('Creating release tag...'));
  run('git', ['tag', '-a', tag, '-m', `Release ${tag}`]);
  log('5/7', colors.bold('Pushing commit and tag to GitHub...'));
  run('git', ['push', 'origin', 'HEAD']);
  run('git', ['push', 'origin', tag]);

  log('6/7', colors.green('✓ GitHub Actions triggered'));
  log('7/7', colors.bold('Release build is running on macOS and Windows.'));
  console.log(`\n${colors.green('✓')} Release ${tag} started for ${repository}`);
  console.log(`  Actions: https://github.com/${repository}/actions/workflows/release.yml`);
  console.log(`  Release: https://github.com/${repository}/releases/tag/${tag}`);
}

const args = process.argv.slice(2);
try {
  if (args[0] === '--test') {
    runLocalTest();
  } else if (args[0] === '--dispatch') {
    const tag = args[1];
    if (!/^v\d+\.\d+\.\d+(-[\w.]+)?$/.test(tag || '')) fail('Usage: npm run release -- --dispatch v1.1.8');
    dispatchExistingTag(tag, getRepository());
  } else if (args[0]) {
    release(args[0]);
  } else {
    fail('Usage: npm run release:test | npm run release -- 1.1.8 | npm run release -- --dispatch v1.1.8');
  }
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
