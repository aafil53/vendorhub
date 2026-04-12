-- backend/migrations/add_vendor_profile_fields.sql
-- Run ONCE in MySQL. Safe — uses IF NOT EXISTS where supported.

ALTER TABLE Users
  ADD COLUMN IF NOT EXISTS companyType      VARCHAR(255)  NULL AFTER contactName,
  ADD COLUMN IF NOT EXISTS founded          INT           NULL AFTER companyType,
  ADD COLUMN IF NOT EXISTS employees        VARCHAR(50)   NULL AFTER founded,
  ADD COLUMN IF NOT EXISTS website          VARCHAR(255)  NULL AFTER employees,
  ADD COLUMN IF NOT EXISTS about            TEXT          NULL AFTER website,
  ADD COLUMN IF NOT EXISTS address          VARCHAR(500)  NULL AFTER about,
  ADD COLUMN IF NOT EXISTS region           VARCHAR(255)  NULL AFTER address,
  ADD COLUMN IF NOT EXISTS country          VARCHAR(255)  NULL DEFAULT 'Saudi Arabia' AFTER region,
  ADD COLUMN IF NOT EXISTS operatingRegions JSON          NULL AFTER country,
  ADD COLUMN IF NOT EXISTS keyContacts      JSON          NULL AFTER operatingRegions,
  ADD COLUMN IF NOT EXISTS bankDetails      JSON          NULL AFTER keyContacts;

-- If your MySQL version doesn't support IF NOT EXISTS for ADD COLUMN,
-- run each line separately and skip any that fail with "duplicate column" error.
