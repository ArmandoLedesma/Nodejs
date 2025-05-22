var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Mostrar página de libros con paginación y filtros
router.get("/", function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // libros por página
  const offset = (page - 1) * limit;

  // Construir la consulta base
  let baseQuery = `
        FROM books 
        LEFT JOIN authors ON books.author_id = authors.id 
        LEFT JOIN publishers ON books.publisher_id = publishers.id 
        LEFT JOIN categories ON books.category_id = categories.id
        WHERE 1=1
    `;

  let countQuery = "SELECT COUNT(*) as total " + baseQuery;
  let params = [];

  // Aplicar filtros si existen
  if (req.query.search) {
    baseQuery +=
      " AND (books.name LIKE ? OR books.isbn LIKE ? OR authors.name LIKE ?)";
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  if (req.query.category) {
    baseQuery += " AND books.category_id = ?";
    params.push(req.query.category);
  }

  if (req.query.publisher) {
    baseQuery += " AND books.publisher_id = ?";
    params.push(req.query.publisher);
  }

  if (req.query.year) {
    baseQuery += " AND books.publication_year = ?";
    params.push(req.query.year);
  }

  // Orden
  const orderBy = req.query.orderBy || "books.id";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  baseQuery += ` ORDER BY ${orderBy} ${order}`;

  // Consulta principal con paginación
  const mainQuery = `
        SELECT books.*, 
               authors.name as author_name, 
               publishers.name as publisher_name, 
               categories.name as category_name 
        ${baseQuery} 
        LIMIT ? OFFSET ?
    `;

  // Ejecutar consulta de conteo
  dbConn.query(countQuery, params, function (err, countResult) {
    if (err) {
      req.flash("error", err);
      res.render("books", {
        data: "",
        pagination: {},
        filters: req.query,
      });
      return;
    }

    const totalItems = countResult[0].total;
    const totalPages = Math.ceil(totalItems / limit);

    // Ejecutar consulta principal
    dbConn.query(mainQuery, [...params, limit, offset], function (err, rows) {
      if (err) {
        req.flash("error", err);
        res.render("books", {
          title: "Gestión de Libros",
          data: "",
          pagination: {},
          filters: req.query,
        });
      } else {
        // Obtener categorías y editoriales para los filtros
        dbConn.query(
          'SELECT id, name FROM categories WHERE state = "activo"',
          function (err, categories) {
            if (err) categories = [];

            dbConn.query(
              'SELECT id, name FROM publishers WHERE state = "activo"',
              function (err, publishers) {
                if (err) publishers = [];
                res.render("books", {
                  title: "Gestión de Libros",
                  data: rows,
                  pagination: {
                    current: page,
                    total: totalPages,
                    limit: limit,
                    totalItems: totalItems,
                  },
                  filters: req.query,
                  categories: categories,
                  publishers: publishers,
                });
              }
            );
          }
        );
      }
    });
  });
});

// Mostrar página de agregar libro
router.get("/add", function (req, res, next) {
  // Obtener autores activos
  dbConn.query(
    'SELECT id, name FROM authors WHERE state = "activo"',
    function (err, authors) {
      if (err) {
        req.flash("error", err);
        res.redirect("/books");
      } else {
        // Obtener editoriales activas
        dbConn.query(
          'SELECT id, name FROM publishers WHERE state = "activo"',
          function (err, publishers) {
            if (err) {
              req.flash("error", err);
              res.redirect("/books");
            } else {
              // Obtener categorías activas
              dbConn.query(
                'SELECT id, name FROM categories WHERE state = "activo"',
                function (err, categories) {
                  if (err) {
                    req.flash("error", err);
                    res.redirect("/books");
                  } else {                    // renderiza a views/books/add.ejs con todas las listas
                    res.render("books/add", {
                      title: "Agregar Libro",
                      name: "",
                      isbn: "",
                      author_id: "",
                      publisher_id: "",
                      category_id: "",
                      publication_year: "",
                      page_count: "",
                      authors: authors,
                      publishers: publishers,
                      categories: categories,
                    });
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

// Agregar libro
router.post("/add", function (req, res, next) {
  let isbn = req.body.isbn;
  let name = req.body.name;
  let author_id = req.body.author_id;
  let publisher_id = req.body.publisher_id;
  let publication_year = req.body.publication_year;
  let page_count = req.body.page_count;
  let category_id = req.body.category_id;
  let errors = false;

  if (
    !isbn ||
    !name ||
    !author_id ||
    !publisher_id ||
    !publication_year ||
    !page_count ||
    !category_id
  ) {
    errors = true;
    // Establecer mensaje de error
    req.flash("error", "Por favor complete todos los campos requeridos");

    // Obtener las listas para el formulario
    dbConn.query(
      'SELECT id, name FROM authors WHERE state = "activo"',
      function (err, authors) {
        if (err) {
          req.flash("error", err);
          res.redirect("/books");
        } else {
          dbConn.query(
            'SELECT id, name FROM publishers WHERE state = "activo"',
            function (err, publishers) {
              if (err) {
                req.flash("error", err);
                res.redirect("/books");
              } else {
                dbConn.query(
                  'SELECT id, name FROM categories WHERE state = "activo"',
                  function (err, categories) {
                    if (err) {
                      req.flash("error", err);
                      res.redirect("/books");
                    } else {                      // Renderizar a add.ejs con mensaje de error
                      res.render("books/add", {
                        title: "Agregar Libro",
                        isbn: isbn,
                        name: name,
                        author_id: author_id,
                        publisher_id: publisher_id,
                        publication_year: publication_year,
                        page_count: page_count,
                        category_id: category_id,
                        authors: authors,
                        publishers: publishers,
                        categories: categories,
                      });
                    }
                  }
                );
              }
            }
          );
        }
      }
    );
  }

  // si no hay error
  if (!errors) {
    var form_data = {
      isbn: isbn,
      name: name,
      author_id: author_id,
      publisher_id: publisher_id,
      publication_year: publication_year,
      page_count: page_count,
      category_id: category_id,
    };

    // Insert query
    dbConn.query("INSERT INTO books SET ?", form_data, function (err, result) {
      if (err) {
        req.flash("error", err.message);
        // Obtener las listas nuevamente
        dbConn.query(
          'SELECT id, name FROM authors WHERE state = "activo"',
          function (err, authors) {
            if (err) {
              req.flash("error", err);
              res.redirect("/books");
            } else {
              dbConn.query(
                'SELECT id, name FROM publishers WHERE state = "activo"',
                function (err, publishers) {
                  if (err) {
                    req.flash("error", err);
                    res.redirect("/books");
                  } else {
                    dbConn.query(
                      'SELECT id, name FROM categories WHERE state = "activo"',
                      function (err, categories) {
                        if (err) {
                          req.flash("error", err);
                          res.redirect("/books");
                        } else {                      res.render("books/add", {
                            title: "Agregar Libro",
                            isbn: form_data.isbn,
                            name: form_data.name,
                            author_id: form_data.author_id,
                            publisher_id: form_data.publisher_id,
                            publication_year: form_data.publication_year,
                            page_count: form_data.page_count,
                            category_id: form_data.category_id,
                            authors: authors,
                            publishers: publishers,
                            categories: categories,
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      } else {
        req.flash("success", "Libro agregado exitosamente");
        res.redirect("/books");
      }
    });
  }
});

// Mostrar página de editar libro
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;

  // Obtener el libro
  dbConn.query(
    "SELECT * FROM books WHERE id = ?",
    [id],
    function (err, rows, fields) {
      if (err) {
        req.flash("error", err);
        res.redirect("/books");
      }

      // Si el libro no se encuentra
      if (rows.length <= 0) {
        req.flash("error", "Libro no encontrado con id = " + id);
        res.redirect("/books");
      }
      // Si se encuentra el libro
      else {
        // Obtener autores activos
        dbConn.query(
          'SELECT id, name FROM authors WHERE state = "activo"',
          function (err, authors) {
            if (err) {
              req.flash("error", err);
              res.redirect("/books");
            } else {
              // Obtener editoriales activas
              dbConn.query(
                'SELECT id, name FROM publishers WHERE state = "activo"',
                function (err, publishers) {
                  if (err) {
                    req.flash("error", err);
                    res.redirect("/books");
                  } else {
                    // Obtener categorías activas
                    dbConn.query(
                      'SELECT id, name FROM categories WHERE state = "activo"',
                      function (err, categories) {
                        if (err) {
                          req.flash("error", err);
                          res.redirect("/books");
                        } else {                          // Renderizar edit.ejs con datos
                          res.render("books/edit", {
                            title: "Editar Libro",
                            id: rows[0].id,
                            isbn: rows[0].isbn,
                            name: rows[0].name,
                            author_id: rows[0].author_id,
                            publisher_id: rows[0].publisher_id,
                            publication_year: rows[0].publication_year,
                            page_count: rows[0].page_count,
                            category_id: rows[0].category_id,
                            authors: authors,
                            publishers: publishers,
                            categories: categories,
                          });
                        }
                      }
                    );
                  }
                }
              );
            }
          }
        );
      }
    }
  );
});

// Actualizar libro
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let isbn = req.body.isbn;
  let name = req.body.name;
  let author_id = req.body.author_id;
  let publisher_id = req.body.publisher_id;
  let publication_year = req.body.publication_year;
  let page_count = req.body.page_count;
  let category_id = req.body.category_id;
  let errors = false;

  if (
    !isbn ||
    !name ||
    !author_id ||
    !publisher_id ||
    !publication_year ||
    !page_count ||
    !category_id
  ) {
    errors = true;
    req.flash("error", "Por favor complete todos los campos requeridos");
    res.redirect("/books/edit/" + id);
  }

  // Si no hay error
  if (!errors) {
    var form_data = {
      isbn: isbn,
      name: name,
      author_id: author_id,
      publisher_id: publisher_id,
      publication_year: publication_year,
      page_count: page_count,
      category_id: category_id,
    };

    // Actualizar query
    dbConn.query(
      "UPDATE books SET ? WHERE id = ?",
      [form_data, id],
      function (err, result) {
        if (err) {
          req.flash("error", err.message);
          res.redirect("/books/edit/" + id);
        } else {
          req.flash("success", "Libro actualizado exitosamente");
          res.redirect("/books");
        }
      }
    );
  }
});

// Eliminar libro
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query("DELETE FROM books WHERE id = ?", [id], function (err, result) {
    if (err) {
      req.flash("error", err);
      res.redirect("/books");
    } else {
      req.flash("success", "Libro eliminado exitosamente (ID = " + id + ")");
      res.redirect("/books");
    }
  });
});

module.exports = router;
