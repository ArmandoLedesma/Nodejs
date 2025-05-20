-- Modificar la tabla books para incluir todos los campos necesarios
ALTER TABLE books
ADD COLUMN publication_year INT AFTER author_id,
ADD COLUMN page_count INT AFTER publication_year,
MODIFY COLUMN author_id INT NOT NULL,
MODIFY COLUMN category_id INT NOT NULL,
MODIFY COLUMN publisher_id INT NOT NULL;

-- Crear índices para mejorar el rendimiento de las búsquedas
CREATE INDEX idx_books_publication_year ON books(publication_year);
CREATE INDEX idx_books_author_id ON books(author_id);
CREATE INDEX idx_books_category_id ON books(category_id);
CREATE INDEX idx_books_publisher_id ON books(publisher_id);
