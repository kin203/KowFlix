# Nginx Configuration for KowFlix

This configuration sets up Nginx as a reverse proxy for the backend API and serves static files for the frontend and media.

## /etc/nginx/sites-available/kowflix

```nginx
server {
    listen 80;
    server_name your-domain.com; # Replace with your actual domain

    # Frontend (Static Build)
    location / {
        root /var/www/kowflix/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Media Files (Cached)
    location /media {
        alias /media/DATA/kowflix; # Adjust path to your media drive
        expires 30d;
        add_header Cache-Control "public, no-transform";
        access_log off;
    }

    # HLS Streaming (Optional Optimization)
    location /hls {
        alias /media/DATA/kowflix/hls;
        add_header Cache-Control "no-cache"; # Master playlists shouldn't be cached too long
        add_header Access-Control-Allow-Origin *;
        
        location ~ \.ts$ {
            expires 30d;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

## Setup Steps
1.  **Install Nginx**: `sudo apt install nginx`
2.  **Create Config**: `sudo nano /etc/nginx/sites-available/kowflix` (paste content above)
3.  **Enable Site**: `sudo ln -s /etc/nginx/sites-available/kowflix /etc/nginx/sites-enabled/`
4.  **Test Config**: `sudo nginx -t`
5.  **Restart Nginx**: `sudo systemctl restart nginx`
