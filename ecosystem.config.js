module.exports = {
  apps: [
    {
      name: 'unify-server',
      script: 'server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
      },
      // Example production env block (override in your host/PM2 ecosystem)
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT || 3000,
        // Replace the following placeholders with real values in your host
        NEXT_PUBLIC_LIVE_WS_URL: 'wss://your-ws-host.example.com/ws',
        DATABASE_URL: process.env.DATABASE_URL || 'postgresql://user:pass@host:5432/dbname',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'https://yourdomain.com',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || 'your-nextauth-secret',
      },
      // Ensure graceful restart and keepalive
      kill_timeout: 3000,
      restart_delay: 2000,
    },
  ],
};
