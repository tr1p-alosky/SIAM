CREATE OR REPLACE FUNCTION actualizar_tickets_en_modificacion()
RETURNS TRIGGER AS $$
BEGIN
  NEW.actualizado_en = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tickets_actualizado_en
BEFORE UPDATE ON tickets
FOR EACH ROW
EXECUTE FUNCTION actualizar_tickets_en_modificacion();
