-- Demo accounts for admin-panel / API (password for all: Demo12345!)
-- Hash: Argon2id m=65536, t=3, p=2 — same as internal/security/password.go

INSERT INTO users (id, phone, email, password_hash, full_name, avatar_url, phone_verified, email_verified, is_active)
VALUES
  (
    'f0000000-0000-4000-8000-000000000001',
    NULL,
    'admin@demo.local',
    '$argon2id$v=19$m=65536,t=3,p=2$Dx4tPEtaaXiHlqW0w9Lh8A$xhhMCg4P1BcYiIYgn8huICiaXkMeBvA25/IKVpvpgQo',
    'Demo Super Admin',
    NULL,
    false,
    true,
    true
  ),
  (
    'f0000000-0000-4000-8000-000000000002',
    NULL,
    'manager@demo.local',
    '$argon2id$v=19$m=65536,t=3,p=2$Dx4tPEtaaXiHlqW0w9Lh8A$xhhMCg4P1BcYiIYgn8huICiaXkMeBvA25/IKVpvpgQo',
    'Demo Store Manager',
    NULL,
    false,
    true,
    true
  ),
  (
    'f0000000-0000-4000-8000-000000000003',
    '+998901234567',
    'customer@demo.local',
    '$argon2id$v=19$m=65536,t=3,p=2$Dx4tPEtaaXiHlqW0w9Lh8A$xhhMCg4P1BcYiIYgn8huICiaXkMeBvA25/IKVpvpgQo',
    'Demo Mijoz',
    NULL,
    true,
    true,
    true
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO roles (user_id, role)
VALUES
  ('f0000000-0000-4000-8000-000000000001', 'SUPER_ADMIN'),
  ('f0000000-0000-4000-8000-000000000002', 'STORE_MANAGER'),
  ('f0000000-0000-4000-8000-000000000003', 'CUSTOMER')
ON CONFLICT (user_id, role) DO NOTHING;
