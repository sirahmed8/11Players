import withPWAInit from "@ducanh2912/next-pwa";

const isVercel = !!process.env.VERCEL;

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Disabled everywhere to fix App Router client-side navigation (RSC payload caching bug)
  register: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  // Static export for Firebase; full SSR for Vercel (enables API routes, middleware, Blob)
  ...(isVercel ? {} : { output: "export" }),
  images: {
    // Vercel handles image optimisation natively; Firebase needs unoptimized
    unoptimized: !isVercel,
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
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        pathname: '/**',
      },
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

export default withPWA(nextConfig);
