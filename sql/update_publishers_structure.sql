-- Agregar nuevas columnas a la tabla publishers de manera segura
ALTER TABLE publishers
ADD COLUMN IF NOT EXISTS contact_info VARCHAR(200) DEFAULT NULL COMMENT 'Información de contacto de la editorial',
ADD COLUMN IF NOT EXISTS address VARCHAR(200) DEFAULT NULL COMMENT 'Dirección física de la editorial',
ADD COLUMN IF NOT EXISTS website VARCHAR(100) DEFAULT NULL COMMENT 'Sitio web oficial de la editorial',
ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL COMMENT 'Correo electrónico de contacto';

-- Verificar y actualizar la restricción ENUM del estado si es necesario
ALTER TABLE publishers 
MODIFY COLUMN state ENUM('activo', 'inactivo') DEFAULT 'activo' NOT NULL;

-- Agregar índices para mejorar el rendimiento de búsquedas
ALTER TABLE publishers
ADD INDEX idx_publisher_email (email),
ADD INDEX idx_publisher_state (state);

-- Agregar restricción de unicidad para el correo electrónico
ALTER TABLE publishers
ADD CONSTRAINT uc_publisher_email UNIQUE (email);

-- Agregar restricción de unicidad para el nombre de la editorial si no existe
ALTER TABLE publishers
ADD CONSTRAINT uc_publisher_name UNIQUE (name);

-- Actualizar registros existentes con valores por defecto si es necesario
UPDATE publishers 
SET 
    contact_info = CONCAT('Contacto de ', name) 
WHERE contact_info IS NULL;

-- Notas importantes:
-- 1. Todos los campos nuevos son opcionales (pueden ser NULL)
-- 2. Se mantiene la relación con la tabla books sin cambios
-- 3. El campo name sigue siendo obligatorio y único
-- 4. El campo state sigue siendo obligatorio con valores predefinidos
-- 5. Se agrega unicidad al email para evitar duplicados
