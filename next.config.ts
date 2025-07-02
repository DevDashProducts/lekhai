import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*",
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
    ],
  },
  skipTrailingSlashRedirect: true,
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },
  env: {
    NEXT_PUBLIC_OPENAI_AVAILABLE: process.env.OPENAI_API_KEY ? 'true' : '',
    NEXT_PUBLIC_ELEVENLABS_AVAILABLE: process.env.ELEVENLABS_API_KEY ? 'true' : '',
    NEXT_PUBLIC_GEMINI_AVAILABLE: process.env.GEMINI_API_KEY ? 'true' : '',
  },
  webpack: (config, { isServer, webpack }) => {
    // Completely ignore FFmpeg on server-side
    if (isServer) {
      config.externals = [
        ...(config.externals || []),
        '@ffmpeg/ffmpeg',
        '@ffmpeg/util',
        '@cloudraker/use-whisper'
      ];
      return config;
    }

    // Client-side FFmpeg configuration
    config.resolve.fallback = {
      fs: false,
      path: false,
      crypto: false,
      stream: false,
      buffer: false,
      util: false,
      url: false,
      worker_threads: false,
    };

    // Enable required experiments for FFmpeg
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      topLevelAwait: true,
      layers: true,
    };

    // Handle WebAssembly files
    config.output.webassemblyModuleFilename = 'static/wasm/[modulehash].wasm';

    // Fix module resolution for ES modules
    config.module.rules.push({
      test: /\.m?js$/,
      resolve: {
        fullySpecified: false,
      },
    });

    // Specific rule for FFmpeg modules - ignore dynamic imports
    config.module.rules.push({
      test: /node_modules\/@ffmpeg\/ffmpeg/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: [
            ['@babel/preset-env', {
              targets: 'defaults',
              modules: false,
            }]
          ],
          plugins: [
            // Transform dynamic imports to static imports where possible
            '@babel/plugin-syntax-dynamic-import',
          ],
        },
      },
    });

    // Handle Web Workers
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: 'static/[hash].worker.js',
        },
      },
    });

    // Add DefinePlugin to replace problematic imports
    config.plugins.push(
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      })
    );

    // Ignore specific FFmpeg files that cause issues
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^\.\/worker$/,
        contextRegExp: /@ffmpeg\/ffmpeg/,
      })
    );

    return config;
  },
};

export default nextConfig;
