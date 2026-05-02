import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Нативные Node-модули не бандлить для клиента (better-sqlite3 тянет `fs`)
  serverExternalPackages: ["better-sqlite3", "bcrypt"],
  // Меньше модулей в dev/production за счёт точечных импортов из «толстых» пакетов
  experimental: {
    optimizePackageImports: [
      "@heroui/react",
      "lucide-react",
      "framer-motion",
    ],
  },
};

export default nextConfig;
