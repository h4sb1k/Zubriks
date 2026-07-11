# Zubriks Admin Panel

This is the fully isolated administration panel for the Zubriks platform.

## Security Architecture

1. **Isolation**: The admin panel runs on a completely separate domain/subdomain and Vite instance from the public application.
2. **Authentication**: Uses a dedicated auth flow with its own independent access and refresh tokens (`admin_at`, `admin_rt`). The tokens are strictly bound to the `/admin-api` path with `SameSite=Strict`.
3. **2FA Enforcement**: Time-based One-Time Password (TOTP) is mandatory for all accounts with the `ADMIN` role. Enrollment is required on the first login.
4. **Rate Limiting**: Login endpoints are strictly rate-limited (5 attempts per 15 minutes per IP).
5. **No Public Traces**: Public users cannot download or inspect admin code, components, or UI. The `robots.txt` and meta tags strictly forbid search engine indexing.

## Deployment Guidelines (Zero Trust)

To maximize the security of this admin panel, it should NOT be exposed directly to the public internet alongside the main website.

### 1. Cloudflare Access (Recommended)
If you are using Cloudflare for DNS/Proxying, use **Cloudflare Zero Trust (Access)**.
1. Create a new Access Application for `admin.zubriks.ru` (or whatever your admin domain is).
2. Set up policies to only allow login via specific Identity Providers (e.g., Google Workspace, GitHub) or specific explicit email addresses.
3. This creates a pre-authentication gateway. Attackers will not even be able to reach the `adminLogin` endpoint or load the Vite bundle without passing Cloudflare Access first.

### 2. IP Allowlisting (Alternative)
If you host this via Nginx, Railway, or VPS without Cloudflare:
1. Whitelist only the VPN or office IP addresses to access the `admin.<domain>` endpoint.
2. Example Nginx config:
```nginx
server {
    listen 443 ssl;
    server_name admin.zubriks.ru;

    allow 192.168.1.0/24; # Office VPN
    deny all; # Block everything else
    
    # ... proxy_pass to admin bundle
}
```

### 3. Stage 4 recommendation (Separate Backend)
Currently, the admin router is mounted on the same Node.js process but on a separate path `/admin-api/trpc`.
For absolute enterprise-grade security, the next step (Вариант B) is to spin up a second physical backend process (`admin-backend`) that connects to the database using a restricted PostgreSQL user, completely isolating process memory and preventing the possibility of a public exploit leaking admin access.
