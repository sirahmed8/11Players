/**
 * Edge Config utility — reads feature flags and app config from Vercel Edge Config.
 * Falls back to safe defaults when running outside Vercel (e.g. Firebase Hosting).
 */

export interface AppConfig {
  maintenanceMode: boolean;
  globalAnnouncementEn: string;
  globalAnnouncementAr: string;
}

const DEFAULTS: AppConfig = {
  maintenanceMode: false,
  globalAnnouncementEn: "",
  globalAnnouncementAr: "",
};

let edgeConfigClient: any = null;

async function getEdgeConfigClient() {
  if (!process.env.EDGE_CONFIG) return null;
  if (!edgeConfigClient) {
    const { createClient } = await import("@vercel/edge-config");
    edgeConfigClient = createClient(process.env.EDGE_CONFIG);
  }
  return edgeConfigClient;
}

export async function getAppConfig(): Promise<AppConfig> {
  try {
    const client = await getEdgeConfigClient();
    if (!client) return DEFAULTS;

    const [maintenanceMode, globalAnnouncementEn, globalAnnouncementAr] =
      await Promise.all([
        client.get("maintenanceMode"),
        client.get("globalAnnouncementEn"),
        client.get("globalAnnouncementAr"),
      ]);

    return {
      maintenanceMode: !!maintenanceMode,
      globalAnnouncementEn: globalAnnouncementEn || "",
      globalAnnouncementAr: globalAnnouncementAr || "",
    };
  } catch (err) {
    console.warn("[EdgeConfig] Failed to fetch config, using defaults:", err);
    return DEFAULTS;
  }
}
