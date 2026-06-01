insert into owners (id, full_name, email, phone, unit)
values
  ('00000000-0000-4000-8000-000000000101', 'Mock Owner 1', 'owner1@example.com', '+14165550101', '101'),
  ('00000000-0000-4000-8000-000000000102', 'Mock Owner 2', 'owner2@example.com', '+14165550102', '202'),
  ('00000000-0000-4000-8000-000000000103', 'Mock Owner 3', 'owner3@example.com', '+14165550103', '303'),
  ('00000000-0000-4000-8000-000000000104', 'Mock Owner 4', 'owner4@example.com', '+14165550104', '404'),
  ('00000000-0000-4000-8000-000000000105', 'Mock Owner 5', 'owner5@example.com', '+14165550105', '505'),
  ('00000000-0000-4000-8000-000000000106', 'Mock Owner 6', 'owner6@example.com', '+14165550106', '606'),
  ('00000000-0000-4000-8000-000000000107', 'Mock Owner 7', 'owner7@example.com', '+14165550107', '707'),
  ('00000000-0000-4000-8000-000000000108', 'Mock Owner 8', 'owner8@example.com', '+14165550108', '808'),
  ('00000000-0000-4000-8000-000000000109', 'Mock Owner 9', 'owner9@example.com', '+14165550109', '909'),
  ('00000000-0000-4000-8000-000000000110', 'Mock Owner 10', 'owner10@example.com', '+14165550110', '1010')
on conflict (id) do update set
  full_name = excluded.full_name,
  email = excluded.email,
  phone = excluded.phone,
  unit = excluded.unit,
  updated_at = now();

insert into vehicles (id, owner_id, plate, normalized_plate, make, model, color, active)
values
  ('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000000101', 'PARK101', 'PARK101', 'Toyota', 'Corolla', 'Silver', true),
  ('00000000-0000-4000-8000-000000001102', '00000000-0000-4000-8000-000000000102', 'PING202', 'PING202', 'Honda', 'Civic', 'Blue', true),
  ('00000000-0000-4000-8000-000000001103', '00000000-0000-4000-8000-000000000103', 'GARAGE3', 'GARAGE3', 'Ford', 'Escape', 'White', true),
  ('00000000-0000-4000-8000-000000001104', '00000000-0000-4000-8000-000000000104', 'LEVEL44', 'LEVEL44', 'Hyundai', 'Elantra', 'Black', true),
  ('00000000-0000-4000-8000-000000001105', '00000000-0000-4000-8000-000000000105', 'TANDEM5', 'TANDEM5', 'Kia', 'Soul', 'Green', true),
  ('00000000-0000-4000-8000-000000001106', '00000000-0000-4000-8000-000000000106', 'SPOT606', 'SPOT606', 'Mazda', 'CX-5', 'Red', true),
  ('00000000-0000-4000-8000-000000001107', '00000000-0000-4000-8000-000000000107', 'BLOCK7', 'BLOCK7', 'Nissan', 'Rogue', 'Gray', true),
  ('00000000-0000-4000-8000-000000001108', '00000000-0000-4000-8000-000000000108', 'MOVE808', 'MOVE808', 'Subaru', 'Impreza', 'Orange', true),
  ('00000000-0000-4000-8000-000000001109', '00000000-0000-4000-8000-000000000109', 'BAY909', 'BAY909', 'Volkswagen', 'Golf', 'Yellow', true),
  ('00000000-0000-4000-8000-000000001110', '00000000-0000-4000-8000-000000000110', 'UNIT10', 'UNIT10', 'Chevrolet', 'Bolt', 'Purple', true)
on conflict (id) do update set
  owner_id = excluded.owner_id,
  plate = excluded.plate,
  normalized_plate = excluded.normalized_plate,
  make = excluded.make,
  model = excluded.model,
  color = excluded.color,
  active = excluded.active,
  updated_at = now();
