-- Add unique constraint to instagram_account_id to allow upsert
ALTER TABLE instagram_credentials ADD CONSTRAINT instagram_credentials_account_id_key UNIQUE (instagram_account_id);
