type MinecraftLauncherManifestVersion = {
  id: string;
  type: "release" | "snapshot" | "old_alpha" | "old_beta";
  time: string;
};

type MinecraftLauncherManifest = {
  latest: {
    release: string;
    snapshot: string;
  };
  versions: MinecraftLauncherManifestVersion[];
};

let cachedMinecraftLauncherManifest: MinecraftLauncherManifest | undefined =
  undefined;

export enum PaperVersionStatus {
  OUTDATED = "OUTDATED",
  LATEST = "LATEST",
  EXPERIMENTAL = "EXPERIMENTAL",
  UNKNOWN = "UNKNOWN",
  NON_EXISTENT = "NON_EXISTENT",
}

export function paperVersionStatusToDisplay(
  paperVersionStatus?: PaperVersionStatus
): string {
  switch (paperVersionStatus) {
    case PaperVersionStatus.OUTDATED:
      return "Outdated";
    case PaperVersionStatus.LATEST:
      return "Latest";
    case PaperVersionStatus.EXPERIMENTAL:
      return "Experimental";
    case PaperVersionStatus.UNKNOWN:
      return "Unknown";
    case PaperVersionStatus.NON_EXISTENT:
    case undefined:
      return "Non-existent";
    default:
      return "Unknown???";
  }
}

let cachedPaperVersionInfo: Record<string, PaperVersionStatus> | undefined =
  undefined;

async function fetchPaperVersions(): Promise<string[]> {
  const response = await fetch("https://api.papermc.io/v2/projects/paper");
  if (!response.ok) {
    throw new Error(`Failed to fetch Paper versions: ${response.statusText}`);
  }
  const data = await response.json();
  return data.versions as string[];
}

async function fetchPaperVersionInfo(
  version: string
): Promise<PaperVersionStatus> {
  const response = await fetch(
    `https://api.papermc.io/v2/projects/paper/versions/${version}/builds`
  );
  if (response.status === 404) {
    return PaperVersionStatus.NON_EXISTENT;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Paper version info: ${response.statusText}`
    );
  }

  const data = await response.json();
  if (data.builds.length === 0) {
    return PaperVersionStatus.NON_EXISTENT;
  }
  const latestBuild = data.builds[data.builds.length - 1];
  if (latestBuild.channel === "experimental") {
    return PaperVersionStatus.EXPERIMENTAL;
  } else if (latestBuild.channel === "default") {
    return PaperVersionStatus.LATEST;
  }

  return PaperVersionStatus.UNKNOWN;
}

async function fetchAndProcessAllPaperVersionInfo(): Promise<
  Record<string, PaperVersionStatus>
> {
  // Fetch the Paper versions and their statuses from the API
  // and cache the results for future use.

  const versions = await fetchPaperVersions();
  const versionInfo: Record<string, PaperVersionStatus> = {};
  for (const version of versions) {
    versionInfo[version] = await fetchPaperVersionInfo(version);
  }

  let latestStableVersion: string | undefined;
  for (let i = 0; i < versions.length; i++) {
    const version = versions[versions.length - 1 - i];
    const status = versionInfo[version];
    if (!latestStableVersion && status === PaperVersionStatus.LATEST) {
      latestStableVersion = version;
    } else if (latestStableVersion && (status === PaperVersionStatus.LATEST || status === PaperVersionStatus.EXPERIMENTAL)) {
      versionInfo[version] = PaperVersionStatus.OUTDATED;
    }
  }

  return versionInfo;
}

export async function getPaperVersionInfo(): Promise<
  Record<string, PaperVersionStatus>
> {
  // Fetch the Paper version info from the API and cache it for future use.
  cachedPaperVersionInfo ??= await fetchAndProcessAllPaperVersionInfo();
  return cachedPaperVersionInfo;
}

async function fetchMinecraftLauncherManifest(): Promise<
  MinecraftLauncherManifest
> {
  const response = await fetch(
    "https://launchermeta.mojang.com/mc/game/version_manifest.json"
  );
  if (!response.ok) {
    throw new Error(
      `Failed to fetch Minecraft launcher manifest: ${response.statusText}`
    );
  }
  const data = await response.json();
  return data as MinecraftLauncherManifest;
}

export async function getMinecraftLauncherManifest(): Promise<
  MinecraftLauncherManifest
> {
  // Fetch the Minecraft launcher manifest from Mojang's servers
  // and cache it for future use.
  cachedMinecraftLauncherManifest ??= await fetchMinecraftLauncherManifest();
  return cachedMinecraftLauncherManifest;
}
