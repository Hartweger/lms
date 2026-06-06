-- Add sequential order number for poziv na broj (uplatnica)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text UNIQUE;
