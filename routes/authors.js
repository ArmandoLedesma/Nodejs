var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar autores
router.get("/", function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // autores por página
  const offset = (page - 1) * limit;

  // Construir la consulta base
  let baseQuery = "FROM authors WHERE 1=1";
  let countQuery = "SELECT COUNT(*) as total " + baseQuery;
  let params = [];

  // Aplicar filtros si existen
  if (req.query.search) {
    baseQuery += " AND name LIKE ?";
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm);
  }

  if (req.query.state) {
    baseQuery += " AND state = ?";
    params.push(req.query.state);
  }

  // Orden
  const orderBy = req.query.orderBy || "id";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  baseQuery += ` ORDER BY ${orderBy} ${order}`;

  // Consulta principal con paginación
  const mainQuery = `SELECT * ${baseQuery} LIMIT ? OFFSET ?`;

  // Ejecutar consulta de conteo
  dbConn.query(countQuery, params, function (err, countResult) {
    if (err) {
      req.flash("error", err);
      res.render("authors/index", {
        title: "Gestión de Autores",
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
        res.render("authors/index", {
          title: "Gestión de Autores",
          data: "",
          pagination: {},
          filters: req.query,
        });
      } else {
        res.render("authors/index", {
          title: "Gestión de Autores",
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

// Mostrar formulario de agregar autor
router.get("/add", function (req, res, next) {
  res.render("authors/add", {
    title: "Agregar Autor",
    name: "",
  });
});

// Agregar autor
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre del autor");
    res.render("authors/add", {
      title: "Agregar Autor",
      name: name,
    });
  }
  if (!errors) {
    // Primero verificar si ya existe un autor con el mismo nombre
    dbConn.query(
      "SELECT id FROM authors WHERE name = ?",
      [name],
      function (err, rows) {
        if (err) {
          req.flash("error", err);
          res.render("authors/add", {
            title: "Agregar Autor",
            name: name,
          });
        } else if (rows.length > 0) {
          req.flash("error", "Ya existe un autor con este nombre");
          res.render("authors/add", {
            title: "Agregar Autor",
            name: name,
          });
        } else {
          var form_data = {
            name: name,
            state: "activo",
          };

          dbConn.query(
            "INSERT INTO authors SET ?",
            form_data,
            function (err, result) {
              if (err) {
                req.flash("error", err);
                res.render("authors/add", {
                  title: "Agregar Autor",
                  name: form_data.name,
                });
              } else {
                req.flash("success", "Autor agregado exitosamente");
                res.redirect("/authors");
              }
            }
          );
        }
      }
    );
  }
});

// Mostrar formulario de editar autor
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "SELECT * FROM authors WHERE id = " + id,
    function (err, rows, fields) {
      if (err) throw err;
      if (rows.length <= 0) {
        req.flash("error", "Autor no encontrado con id = " + id);
        res.redirect("/authors");
      } else {
        res.render("authors/edit", {
          title: "Editar Autor",
          id: rows[0].id,
          name: rows[0].name,
          state: rows[0].state,
        });
      }
    }
  );
});

// Actualizar autor
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let state = req.body.state;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre del autor");
    res.render("authors/edit", {
      title: "Editar Autor",
      id: req.params.id,
      name: name,
      state: state,
    });
  }
  if (!errors) {
    var form_data = {
      name: name,
      state: state,
    };

    // Verificar si existe otro autor con el mismo nombre
    dbConn.query(
      "SELECT id FROM authors WHERE name = ? AND id != ?",
      [name, id],
      function (err, rows) {
        if (err) {
          req.flash("error", err);
          res.render("authors/edit", {
            title: "Editar Autor",
            id: req.params.id,
            name: name,
            state: state,
          });
        } else if (rows.length > 0) {
          req.flash("error", "Ya existe otro autor con este nombre");
          res.render("authors/edit", {
            title: "Editar Autor",
            id: req.params.id,
            name: name,
            state: state,
          });
        } else {
          // Si no existe otro autor con el mismo nombre, actualizamos
          dbConn.query(
            "UPDATE authors SET ? WHERE id = ?",
            [form_data, id],
            function (err, result) {
              if (err) {
                req.flash("error", err);
                res.render("authors/edit", {
                  title: "Editar Autor",
                  id: req.params.id,
                  name: form_data.name,
                  state: form_data.state,
                });
              } else {
                req.flash("success", "Autor actualizado exitosamente");
                res.redirect("/authors");
              }
            }
          );
        }
      }
    );
  }
});

// Eliminar autor
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  // Primero verificar si el autor tiene libros asociados
  dbConn.query(
    "SELECT * FROM books WHERE author_id = ?",
    [id],
    function (err, books) {
      if (err) {
        req.flash("error", err);
        res.redirect("/authors");
      } else if (books.length > 0) {
        req.flash(
          "error",
          "No se puede eliminar el autor porque tiene libros asociados"
        );
        res.redirect("/authors");
      } else {
        // Si no tiene libros, procedemos a eliminar
        dbConn.query(
          "DELETE FROM authors WHERE id = ?",
          [id],
          function (err, result) {
            if (err) {
              req.flash("error", err);
              res.redirect("/authors");
            } else {
              req.flash("success", "Autor eliminado exitosamente");
              res.redirect("/authors");
            }
          }
        );
      }
    }
  );
});

module.exports = router;
