-- AlphaPay development seed data.
-- Run AFTER the migrations (rates are already seeded by 0002_rates.sql).

-- Sample collection accounts shown to customers on the payment step.
insert into public.collection_accounts (currency, type, account_name, account_details)
values
  ('TZS', 'mobile_money', 'AlphaPay Tanzania',
   '{"provider": "M-Pesa", "number": "+255 700 000 000"}'::jsonb),
  ('TZS', 'bank', 'AlphaPay Tanzania Ltd',
   '{"bank": "CRDB Bank", "account_number": "0150000000000"}'::jsonb),
  ('INR', 'bank', 'AlphaPay India Pvt Ltd',
   '{"bank": "HDFC Bank", "account_number": "50100000000000", "ifsc_or_upi": "alphapay@hdfcbank"}'::jsonb);

-- Promote your own account to admin after your first Google sign-in:
--   update public.profiles set role = 'admin' where email = 'you@example.com';
