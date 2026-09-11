CREATE TRIGGER IF NOT EXISTS combos_deactivate_on_product_delete
BEFORE DELETE ON products
FOR EACH ROW
BEGIN
  UPDATE combos
  SET active = 0, updated_at = datetime('now')
  WHERE id IN (SELECT combo_id FROM combo_items WHERE product_id = OLD.id);
END;