/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      }
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        path: false,
        child_process: false,
        crypto: false,
        os: false,
      };
      config.resolve.alias = {
        ...config.resolve.alias,
        "node-fetch": false,
      };
    }
    
    // Ignore ONNX Runtime Web modules which cause Webpack parsing errors
    config.module.rules.push({
      test: /onnxruntime-web/,
      parser: { amd: false, system: false, requireEnsure: false, worker: false }
    });

    // Fix for "import.meta cannot be used outside of module code"
    config.module.rules.push({
      test: /\.m?js$/,
      type: "javascript/auto",
      resolve: {
        fullySpecified: false,
      },
    });

    return config;
  },
};

export default nextConfig;
