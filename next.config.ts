import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // ホーム直下に別の package-lock.json があるため、Turbopack のルートをこのリポジトリに固定
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
