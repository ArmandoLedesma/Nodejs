var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar préstamos con paginación y filtros
router.get("/", function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // préstamos por página
  const offset = (page - 1) * limit;

  // Construir la consulta base
  let baseQuery = `
    FROM loans 
    LEFT JOIN users ON loans.user_id = users.id 
    LEFT JOIN books ON loans.book_id = books.id
    WHERE 1=1
  `;
  let params = [];

  // Aplicar filtros si existen
  if (req.query.search) {
    baseQuery += ` AND (
      users.first_name LIKE ? OR 
      users.last_name LIKE ? OR 
      users.document_number LIKE ? OR
      books.name LIKE ? OR 
      books.isbn LIKE ?
    )`;
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (req.query.status) {
    baseQuery += " AND loans.status = ?";
    params.push(req.query.status);
  }

  // Orden
  const orderBy = req.query.orderBy || "loan_date";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  baseQuery += ` ORDER BY loans.${orderBy} ${order}`;

  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const mainQuery = `
    SELECT 
      loans.*,
      users.first_name,
      users.last_name,
      users.document_number,
      books.name as book_name,
      books.isbn
    ${baseQuery} 
    LIMIT ? OFFSET ?
  `;

  // Ejecutar consulta de conteo
  dbConn.query(countQuery, params, function (err, countResult) {
    if (err) {
      req.flash("error", err);
      res.render("loans/index", {
        title: "Gestión de Préstamos",
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
        res.render("loans/index", {
          title: "Gestión de Préstamos",
          data: "",
          pagination: {},
          filters: req.query,
        });
      } else {
        res.render("loans/index", {
          title: "Gestión de Préstamos",
          data: rows,
          pagination: {
            current: page,
            total: totalPages,
            limit: limit,
            totalItems: totalItems,
          },
          filters: req.query,
        });
      }
    });
  });
});

// Mostrar formulario de nuevo préstamo
router.get("/add", function (req, res, next) {  // Obtener usuarios activos
  dbConn.query(
    'SELECT id, first_name, last_name, document_number FROM users WHERE state = "activo" ORDER BY first_name, last_name',
    function (err, users) {
      if (err) {
        req.flash("error", err);
        res.redirect("/loans");
      } else {
        // Obtener libros disponibles
        dbConn.query(
          'SELECT id, name, isbn FROM books WHERE id NOT IN (SELECT book_id FROM loans WHERE status = "prestado") ORDER BY name',
          function (err, books) {
            if (err) {
              req.flash("error", err);
              res.redirect("/loans");
            } else {
              res.render("loans/add", {
                title: "Nuevo Préstamo",
                users: users,
                books: books,
                user_id: "",
                book_id: "",
                expected_return_date: "",
                notes: "",
              });
            }
          }
        );
      }
    }
  );
});

// Crear nuevo préstamo
router.post("/add", function (req, res, next) {
  let user_id = req.body.user_id;
  let book_id = req.body.book_id;
  let expected_return_date = req.body.expected_return_date;
  let notes = req.body.notes;
  let errors = false;

  if (!user_id || !book_id || !expected_return_date) {
    errors = true;
    req.flash("error", "Por favor complete todos los campos requeridos");
    res.redirect("/loans/add");
  }

  // Validar que el libro esté disponible
  if (!errors) {
    dbConn.query(
      'SELECT COUNT(*) as count FROM loans WHERE book_id = ? AND status = "prestado"',
      [book_id],
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.redirect("/loans/add");
        } else if (result[0].count > 0) {
          req.flash("error", "Este libro no está disponible para préstamo");
          res.redirect("/loans/add");
        } else {
          // Crear el préstamo
          var form_data = {
            user_id: user_id,
            book_id: book_id,
            expected_return_date: expected_return_date,
            notes: notes,
            status: "prestado",
          };

          dbConn.query(
            "INSERT INTO loans SET ?",
            form_data,
            function (err, result) {
              if (err) {
                req.flash("error", err);
                res.redirect("/loans/add");
              } else {
                req.flash("success", "Préstamo registrado exitosamente");
                res.redirect("/loans");
              }
            }
          );
        }
      }
    );
  }
});

// Registrar devolución
router.post("/return/:id", function (req, res, next) {
  let id = req.params.id;

  dbConn.query(
    'UPDATE loans SET status = "devuelto", actual_return_date = CURRENT_TIMESTAMP WHERE id = ?',
    [id],
    function (err, result) {
      if (err) {
        req.flash("error", err);
      } else {
        req.flash("success", "Libro devuelto exitosamente");
      }
      res.redirect("/loans");
    }
  );
});

module.exports = router;
