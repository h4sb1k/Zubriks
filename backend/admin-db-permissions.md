# Database Permissions for Admin Backend (Stage 4 / Variant B prep)

For absolute defense-in-depth, the `adminRouter` (or a completely separate `admin-backend` process) should connect to the PostgreSQL database using a distinct database user with restricted permissions. 

This prevents an attacker who finds an SQL injection in the admin panel from dumping user passwords or messing with core auth functionality, and vice versa.

## Concept: Principle of Least Privilege in PostgreSQL

Instead of connecting as the `zubriks_admin` superuser, you create a specific role for the admin application.

### 1. Create the Admin DB Role

```sql
-- Create a new role with login
CREATE ROLE zubriks_admin_app WITH LOGIN PASSWORD 'secure_admin_password';

-- Grant connection rights to the database
GRANT CONNECT ON DATABASE "zubriks" TO zubriks_admin_app;
```

### 2. Restrict Table Access

The admin panel needs to read and write routes, waypoints, and zubriks, but it should **never** be able to read all users' `passwordHash` directly to prevent mass credential theft in case of a breach.

```sql
-- Revoke default public schema access
REVOKE ALL ON SCHEMA public FROM public;

-- Grant usage on the public schema to our new role
GRANT USAGE ON SCHEMA public TO zubriks_admin_app;

-- Grant full CRUD on non-sensitive tables
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE 
  "Route", "Waypoint", "Zubrik", "Event", "Achievement", "AdminAuditLog" 
TO zubriks_admin_app;

-- Grant SELECT on sequences (for auto-increment if not using CUID/UUID)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO zubriks_admin_app;
```

### 3. Handling the User Table Securely

The admin panel needs to authenticate admins (which requires reading `passwordHash` and `totpSecret` of `ADMIN` users), and perhaps list normal users (without their passwords).

**Option A: Column-Level Permissions (Simple)**
Grant SELECT only on safe columns for all users, but how does it verify admin passwords?
```sql
GRANT SELECT (id, email, name, role, "createdAt", "emailVerified") ON TABLE "User" TO zubriks_admin_app;
```
*Problem*: Prisma does not support column-level permissions well (it selects all by default unless strictly typed, and it will throw an error).

**Option B: Stored Procedure / Function for Auth (Recommended)**
Create a SECURITY DEFINER function that takes email and password, checks the hash, and returns boolean/user data. The `zubriks_admin_app` role executes this function but cannot read `passwordHash` directly.

```sql
CREATE OR REPLACE FUNCTION verify_admin_login(p_email TEXT)
RETURNS TABLE (id TEXT, "passwordHash" TEXT, "totpSecret" TEXT, "totpEnabled" BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with owner permissions
AS $$
BEGIN
    RETURN QUERY 
    SELECT u.id, u."passwordHash", u."totpSecret", u."totpEnabled"
    FROM "User" u
    WHERE u.email = p_email AND u.role = 'ADMIN';
END;
$$;

GRANT EXECUTE ON FUNCTION verify_admin_login(TEXT) TO zubriks_admin_app;
```

With Option B, you adjust your tRPC `adminLogin` procedure to use raw SQL via Prisma `prisma.$queryRaw` to fetch the admin's password hash and TOTP secret securely, completely bypassing the need for `SELECT` permissions on the `User` table for sensitive columns.

### 4. Setup in Prisma

When running the separate admin process, use the new credentials in your `.env`:
```env
DATABASE_URL="postgresql://zubriks_admin_app:secure_admin_password@localhost:5432/zubriks?schema=public"
```
