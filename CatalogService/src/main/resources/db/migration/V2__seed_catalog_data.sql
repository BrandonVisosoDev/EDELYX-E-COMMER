-- =====================================================
-- Migracion V2: Datos Semilla de Prueba para CatalogService
-- Categorias y Productos base
-- =====================================================

-- 1. Insercion de Categorias
INSERT INTO categories (name, active) VALUES 
('Tecnología', true),
('Hogar y Cocina', true),
('Moda y Calzado', true);

-- 2. Insercion de Productos
INSERT INTO products (sku, name, description, price, stock, image_url, active, created_at, category_id) VALUES
('TECH-LAP-001', 'Laptop Lenovo ThinkPad T14', 'Laptop empresarial AMD Ryzen 7, 16GB RAM, 512GB SSD', 18999.99, 15, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed', true, CURRENT_TIMESTAMP, 1),
('TECH-MOU-002', 'Mouse Inalámbrico Logitech MX Master 3S', 'Mouse ergonómico para productividad con sensor de 8000 DPI', 1850.50, 40, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46', true, CURRENT_TIMESTAMP, 1),
('TECH-TEC-003', 'Teclado Mecánico Keychron K2', 'Teclado inalámbrico Bluetooth 75% con switches Red', 2100.00, 25, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3', true, CURRENT_TIMESTAMP, 1),
('HOG-CAF-001', 'Cafetera Espresso DeLonghi Dedica', 'Cafetera manual de acero inoxidable para espresso y cappuccino', 4500.00, 10, 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6', true, CURRENT_TIMESTAMP, 2),
('MOD-PLA-001', 'Playera Básica Algodón Orgánico', 'Playera negra cuello redondo 100% algodón orgánico', 349.00, 100, 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518', true, CURRENT_TIMESTAMP, 3);
