export type { FeatureReleaseStage } from "@/lib/premium/types";
export { canAccessFeature } from "@/lib/premium/entitlements";

export type FeatureReleaseConfig = {
  featureKey: string;
  releaseStage: import("@/lib/premium/types").FeatureReleaseStage;
  label?: string;
};

/** Register features here or in the feature_release_flags DB table */
export const FEATURE_REGISTRY: FeatureReleaseConfig[] = [];

export function getFeatureReleaseStage(featureKey: string): import("@/lib/premium/types").FeatureReleaseStage {
  const registered = FEATURE_REGISTRY.find((f) => f.featureKey === featureKey);
  return registered?.releaseStage ?? "general";
}
