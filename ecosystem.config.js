module.exports = {
    apps: [
        {
            name: "kowflix-backend",
            script: "./kowflix-backend/src/server.js",
            env: {
                NODE_ENV: "production",
                PORT: 5000
            },
            watch: false,
            instances: 1,
            autorestart: true,
            max_memory_restart: "1G"
        },
        // Frontend is typically served via Nginx (static build), but if you need to serve it via Node (e.g. for preview):
        // {
        //   name: "kowflix-frontend",
        //   script: "serve",
        //   env: {
        //     PM2_SERVE_PATH: './kowflix-frontend/dist',
        //     PM2_SERVE_PORT: 3000,
        //     PM2_SERVE_SPA: 'true',
        //     PM2_SERVE_HOMEPAGE: '/index.html'
        //   }
        // }
    ]
};
