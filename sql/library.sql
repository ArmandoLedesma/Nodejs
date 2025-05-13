-- Tabla de autores
CREATE TABLE authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- Tabla de categorías
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- Tabla de editoriales
CREATE TABLE publishers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    state ENUM('activo', 'inactivo') DEFAULT 'activo'
);

-- Alterar tabla books
ALTER TABLE books
ADD COLUMN author_id INT,
ADD COLUMN category_id INT,
ADD COLUMN publisher_id INT,

ADD CONSTRAINT fk_books_author FOREIGN KEY (author_id) REFERENCES authors(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_books_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_books_publisher FOREIGN KEY (publisher_id) REFERENCES publishers(id) ON DELETE SET NULL;
