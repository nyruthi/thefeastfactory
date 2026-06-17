-- Regional operations rollout helper.
-- Use after applying the matching Prisma schema changes to an existing database.

CREATE TABLE IF NOT EXISTS public.operating_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code varchar(40) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,
  center_latitude numeric(10, 8) NOT NULL,
  center_longitude numeric(11, 8) NOT NULL,
  service_radius_km numeric(8, 2) NOT NULL DEFAULT 50,
  delivery_fee_per_km numeric(10, 2) NOT NULL DEFAULT 10,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE public.admin_users ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.operating_regions(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.operating_regions(id);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS distance_km numeric(8, 2);
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS delivery_fee numeric(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS region_id uuid REFERENCES public.operating_regions(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS distance_km numeric(8, 2);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee numeric(10, 2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS operating_regions_is_active_idx ON public.operating_regions(is_active);
CREATE INDEX IF NOT EXISTS admin_users_region_id_idx ON public.admin_users(region_id);
CREATE INDEX IF NOT EXISTS events_region_id_event_date_idx ON public.events(region_id, event_date);
CREATE INDEX IF NOT EXISTS orders_region_id_order_status_idx ON public.orders(region_id, order_status);
CREATE INDEX IF NOT EXISTS orders_region_id_created_at_idx ON public.orders(region_id, created_at);

INSERT INTO public.operating_regions (code, name, center_latitude, center_longitude, service_radius_km, delivery_fee_per_km, is_active)
VALUES
  ('HYDERABAD', 'Hyderabad', 17.38500000, 78.48670000, 50.00, 10.00, true),
  ('KARIMNAGAR', 'Karimnagar', 18.43860000, 79.12880000, 50.00, 10.00, true),
  ('WARANGAL', 'Warangal', 17.96890000, 79.59410000, 50.00, 10.00, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  center_latitude = EXCLUDED.center_latitude,
  center_longitude = EXCLUDED.center_longitude,
  service_radius_km = EXCLUDED.service_radius_km,
  delivery_fee_per_km = EXCLUDED.delivery_fee_per_km,
  is_active = EXCLUDED.is_active;

WITH candidates AS (
  SELECT
    e.id AS event_id,
    r.id AS region_id,
    ROUND((
      6371 * 2 * atan2(
        sqrt(
          power(sin(radians((ua.latitude::double precision - r.center_latitude::double precision) / 2)), 2) +
          cos(radians(r.center_latitude::double precision)) *
          cos(radians(ua.latitude::double precision)) *
          power(sin(radians((ua.longitude::double precision - r.center_longitude::double precision) / 2)), 2)
        ),
        sqrt(1 - (
          power(sin(radians((ua.latitude::double precision - r.center_latitude::double precision) / 2)), 2) +
          cos(radians(r.center_latitude::double precision)) *
          cos(radians(ua.latitude::double precision)) *
          power(sin(radians((ua.longitude::double precision - r.center_longitude::double precision) / 2)), 2)
        ))
      )
    )::numeric, 2) AS distance_km,
    row_number() OVER (
      PARTITION BY e.id
      ORDER BY
        6371 * 2 * atan2(
          sqrt(
            power(sin(radians((ua.latitude::double precision - r.center_latitude::double precision) / 2)), 2) +
            cos(radians(r.center_latitude::double precision)) *
            cos(radians(ua.latitude::double precision)) *
            power(sin(radians((ua.longitude::double precision - r.center_longitude::double precision) / 2)), 2)
          ),
          sqrt(1 - (
            power(sin(radians((ua.latitude::double precision - r.center_latitude::double precision) / 2)), 2) +
            cos(radians(r.center_latitude::double precision)) *
            cos(radians(ua.latitude::double precision)) *
            power(sin(radians((ua.longitude::double precision - r.center_longitude::double precision) / 2)), 2)
          ))
        )
    ) AS rank
  FROM public.events e
  JOIN public.user_addresses ua ON ua.id = e.address_id
  JOIN public.operating_regions r ON r.is_active
  WHERE e.region_id IS NULL
    AND ua.latitude IS NOT NULL
    AND ua.longitude IS NOT NULL
)
UPDATE public.events e
SET region_id = c.region_id,
    distance_km = c.distance_km,
    delivery_fee = 0
FROM candidates c
JOIN public.operating_regions r ON r.id = c.region_id
WHERE e.id = c.event_id
  AND c.rank = 1
  AND c.distance_km <= r.service_radius_km;

UPDATE public.orders o
SET region_id = e.region_id,
    distance_km = e.distance_km,
    delivery_fee = 0
FROM public.events e
WHERE o.event_id = e.id
  AND o.region_id IS NULL;
