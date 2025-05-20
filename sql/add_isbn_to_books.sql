-- Eliminar el índice existente si existe
DROP INDEX IF EXISTS idx_books_isbn ON books;

-- Eliminar la columna isbn si existe
ALTER TABLE books DROP COLUMN IF EXISTS isbn;

-- Agregar la columna ISBN nuevamente
ALTER TABLE books
ADD COLUMN isbn VARCHAR(20) NOT NULL UNIQUE AFTER id;

-- Actualizar registros existentes con un ISBN temporal único
UPDATE books SET isbn = CONCAT('TMP', LPAD(id, 10, '0')) WHERE isbn = '';

-- Añadir índice único para ISBN
CREATE UNIQUE INDEX idx_books_isbn ON books(isbn);
