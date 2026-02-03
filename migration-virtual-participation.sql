-- Migration for Virtual Participation Feature
-- Run this SQL on your database

-- Add virtualEnabled to Event table
ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "virtualEnabled" BOOLEAN NOT NULL DEFAULT false;

-- Add isVirtual to IndividualRegistration table
ALTER TABLE "IndividualRegistration" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- Add isVirtual to GroupRegistration table  
ALTER TABLE "GroupRegistration" ADD COLUMN IF NOT EXISTS "isVirtual" BOOLEAN NOT NULL DEFAULT false;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "IndividualRegistration_isVirtual_idx" ON "IndividualRegistration"("isVirtual");
CREATE INDEX IF NOT EXISTS "GroupRegistration_isVirtual_idx" ON "GroupRegistration"("isVirtual");

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'Event' AND column_name = 'virtualEnabled';

SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name IN ('IndividualRegistration', 'GroupRegistration') AND column_name = 'isVirtual';
