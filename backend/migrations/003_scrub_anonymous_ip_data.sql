-- Migration: Scrub IP and user-agent data from anonymous report submissions
-- Date: 2026-04-26
-- Reason: Anonymous reporters must have zero fingerprinting. IP/UA was logged
--         to audit_logs for REPORT_CREATED events with no actor (anonymous).
--         This violates zero-knowledge anonymity guarantees.

-- Step 1: Disable immutability triggers temporarily
ALTER TABLE audit_logs DISABLE TRIGGER trg_audit_logs_no_update;

-- Step 2: Null out IP + user_agent for anonymous submissions (no actor = anonymous)
UPDATE audit_logs
SET    ip_address = NULL,
       user_agent = NULL
WHERE  action = 'REPORT_CREATED'
  AND  actor_id IS NULL;

-- Step 3: Re-enable immutability triggers
ALTER TABLE audit_logs ENABLE TRIGGER trg_audit_logs_no_update;
