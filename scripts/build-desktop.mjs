import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDir, '..');
const releaseDir = resolve(projectRoot, 'release');
const defaultBuildOutputDir = resolve(releaseDir, 'build');
const cacheRoot = resolve(projectRoot, '.cache');
const tempDir = resolve(cacheRoot, 'tmp');
const electronCacheDir = resolve(cacheRoot, 'electron');
const electronBuilderCacheDir = resolve(cacheRoot, 'electron-builder');
const cliArgs = process.argv.slice(2);
const supportedTargets = ['mac', 'win', 'linux'];
const supportedArchs = ['x64', 'arm64', 'universal', 'ia32', 'armv7l'];
const requestedTarget = cliArgs
  .find((arg) => supportedTargets.includes(arg.replace(/^--/, '')))
  ?.replace(/^--/, '');
const requestedArchs = cliArgs
  .filter((arg) => supportedArchs.includes(arg.replace(/^--/, '')))
  .map((arg) => arg.replace(/^--/, ''));
const platformToTarget = {
  darwin: 'mac',
  win32: 'win',
  linux: 'linux',
};
const buildTarget = requestedTarget || platformToTarget[process.platform];
const buildStamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
const logoPath = resolve(projectRoot, 'logo.png');
const iconPngPath = resolve(projectRoot, 'build', 'icon.png');
const iconIcoPath = resolve(projectRoot, 'build', 'icon.ico');
const iconIcnsPath = resolve(projectRoot, 'build', 'icon.icns');

if (!supportedTargets.includes(buildTarget || '')) {
  console.error(
    `Unsupported desktop target "${buildTarget ?? process.platform}". Use one of --mac, --win, or --linux.`,
  );
  process.exit(1);
}

for (const directory of [releaseDir, tempDir, electronCacheDir, electronBuilderCacheDir]) {
  mkdirSync(directory, { recursive: true });
}

const env = {
  ...process.env,
  TEMP: tempDir,
  TMP: tempDir,
  ELECTRON_CACHE: electronCacheDir,
  ELECTRON_BUILDER_CACHE: electronBuilderCacheDir,
  ...(buildTarget === 'win' ? { CSC_IDENTITY_AUTO_DISCOVERY: 'false' } : {}),
};

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env,
    stdio: 'inherit',
    shell: true,
  });

  if (result.error) {
    throw result.error;
  }

  if ((result.status ?? 1) !== 0) {
    process.exit(result.status ?? 1);
  }
}

function normalizeArch(arch) {
  return arch === 'arm' ? 'armv7l' : arch;
}

function resolveBuildArchs() {
  if (requestedArchs.length > 0) {
    return [...new Set(requestedArchs)];
  }

  return [normalizeArch(process.arch)];
}

function resolveFinalBuildOutputDir(arch) {
  return resolve(defaultBuildOutputDir, `${buildTarget}-${arch}`);
}

function resolveStagingBuildOutputDir(arch) {
  return resolve(releaseDir, `build-staging-${buildTarget}-${arch}-${buildStamp}`);
}

function shouldGenerateIcons() {
  if (!existsSync(logoPath)) {
    return false;
  }

  if (!existsSync(iconPngPath) || !existsSync(iconIcoPath)) {
    return true;
  }

  return buildTarget === 'mac' && !existsSync(iconIcnsPath);
}

function tryRemoveDirectory(directory) {
  if (!existsSync(directory)) {
    return true;
  }

  try {
    rmSync(directory, { recursive: true, force: true, maxRetries: 5, retryDelay: 500 });
    return true;
  } catch {
    return false;
  }
}

function finalizeBuildOutput(stagingBuildOutputDir, finalBuildOutputDir) {
  if (!existsSync(stagingBuildOutputDir)) {
    return;
  }

  mkdirSync(defaultBuildOutputDir, { recursive: true });

  if (tryRemoveDirectory(finalBuildOutputDir)) {
    try {
      renameSync(stagingBuildOutputDir, finalBuildOutputDir);
      console.log(`Build artifacts available at ${finalBuildOutputDir}`);
      return;
    } catch {
    }
  }

  console.warn(
    `Build artifacts were created at ${stagingBuildOutputDir} because ${finalBuildOutputDir} is still locked.`,
  );
}

async function buildForArch(arch) {
  const stagingBuildOutputDir = resolveStagingBuildOutputDir(arch);
  const finalBuildOutputDir = resolveFinalBuildOutputDir(arch);

  // Use programmatic API to avoid CLI path-with-spaces issues on Windows
  const require = createRequire(import.meta.url);
  const { build, Platform, Arch } = require('electron-builder');

  const platformMap = { mac: Platform.MAC, win: Platform.WINDOWS, linux: Platform.LINUX };
  const archMap = {
    x64: Arch.x64,
    arm64: Arch.arm64,
    ia32: Arch.ia32,
    armv7l: Arch.armv7l,
    universal: Arch.universal,
  };

  const platform = platformMap[buildTarget];
  const archValue = archMap[arch];
  const targets = archValue !== undefined
    ? platform.createTarget(null, archValue)
    : platform.createTarget();

  await build({
    projectDir: projectRoot,
    targets,
    publish: 'never',
    config: {
      directories: { output: stagingBuildOutputDir },
      ...(buildTarget === 'win'
        ? {
            win: { signAndEditExecutable: false },
            afterPack: resolve(projectRoot, 'scripts', 'set-win-icon.cjs'),
          }
        : {}),
    },
  });

  finalizeBuildOutput(stagingBuildOutputDir, finalBuildOutputDir);
}

if (shouldGenerateIcons()) {
  run('node', [resolve(projectRoot, 'scripts', 'generate-icon.mjs')]);
}

const buildArchs = resolveBuildArchs();

run('npx', ['electron-vite', 'build']);

for (const arch of buildArchs) {
  await buildForArch(arch);
}
