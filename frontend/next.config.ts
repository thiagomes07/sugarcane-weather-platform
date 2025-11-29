import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // SSG - Static Site Generation
  output: 'export',
  
  // React Compiler para otimizações
  reactCompiler: true,
  
  // Desabilita otimização de imagens para deployment em S3
  images: {
    unoptimized: true,
  },
  
  // URLs terminam com / para compatibilidade com S3
  trailingSlash: true,
  
  // Configurações de produção
  compress: true,
  
  // Strict mode para desenvolvimento
  reactStrictMode: true,
  
  // Configurações experimentais
  experimental: {
    // Otimizações de bundle
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
};

export default nextConfig;