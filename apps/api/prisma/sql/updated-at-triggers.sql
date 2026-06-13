-- Database-owned updated_at timestamps.
-- Prisma's @updatedAt is still useful for generated client ergonomics, but these
-- triggers make PostgreSQL the final source of truth for update timestamps.

CREATE OR REPLACE FUNCTION public.set_updated_at_to_db_time()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = statement_timestamp();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON public.users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_user_addresses_set_updated_at ON public.user_addresses;
CREATE TRIGGER trg_user_addresses_set_updated_at
BEFORE UPDATE ON public.user_addresses
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_menu_categories_set_updated_at ON public.menu_categories;
CREATE TRIGGER trg_menu_categories_set_updated_at
BEFORE UPDATE ON public.menu_categories
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_menu_items_set_updated_at ON public.menu_items;
CREATE TRIGGER trg_menu_items_set_updated_at
BEFORE UPDATE ON public.menu_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_packages_set_updated_at ON public.packages;
CREATE TRIGGER trg_packages_set_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_package_versions_set_updated_at ON public.package_versions;
CREATE TRIGGER trg_package_versions_set_updated_at
BEFORE UPDATE ON public.package_versions
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_package_category_rules_set_updated_at ON public.package_category_rules;
CREATE TRIGGER trg_package_category_rules_set_updated_at
BEFORE UPDATE ON public.package_category_rules
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_package_menu_items_set_updated_at ON public.package_menu_items;
CREATE TRIGGER trg_package_menu_items_set_updated_at
BEFORE UPDATE ON public.package_menu_items
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_package_menu_item_pricing_set_updated_at ON public.package_menu_item_pricing;
CREATE TRIGGER trg_package_menu_item_pricing_set_updated_at
BEFORE UPDATE ON public.package_menu_item_pricing
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_events_set_updated_at ON public.events;
CREATE TRIGGER trg_events_set_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON public.orders;
CREATE TRIGGER trg_orders_set_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_payments_set_updated_at ON public.payments;
CREATE TRIGGER trg_payments_set_updated_at
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_refunds_set_updated_at ON public.refunds;
CREATE TRIGGER trg_refunds_set_updated_at
BEFORE UPDATE ON public.refunds
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_admin_users_set_updated_at ON public.admin_users;
CREATE TRIGGER trg_admin_users_set_updated_at
BEFORE UPDATE ON public.admin_users
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();

DROP TRIGGER IF EXISTS trg_platform_settings_set_updated_at ON public.platform_settings;
CREATE TRIGGER trg_platform_settings_set_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at_to_db_time();
