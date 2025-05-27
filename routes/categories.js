var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar categorías
router.get("/", function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // categorías por página
  const offset = (page - 1) * limit;

  // Construir la consulta base
  let baseQuery = "FROM categories WHERE 1=1";
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
  const orderBy = req.query.orderBy || "name";
  const order = req.query.order === "asc" ? "ASC" : "DESC";
  baseQuery += ` ORDER BY ${orderBy} ${order}`;

  // Consultas
  const countQuery = `SELECT COUNT(*) as total ${baseQuery}`;
  const mainQuery = `SELECT * ${baseQuery} LIMIT ? OFFSET ?`;

  // Ejecutar consulta de conteo
  dbConn.query(countQuery, params, function (err, countResult) {
    if (err) {
      req.flash("error", err);
      res.render("categories/index", {
        title: "Gestión de Categorías",
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
        res.render("categories/index", {
          title: "Gestión de Categorías",
          data: "",
          pagination: {},
          filters: req.query,
        });
      } else {
        res.render("categories/index", {
          title: "Gestión de Categorías",
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

// Mostrar formulario de agregar categoría
router.get("/add", function (req, res, next) {
  res.render("categories/add", {
    title: "Agregar Categoría",
    name: "",
    state: "activo", // Estado por defecto
  });
});

// Agregar categoría
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let state = req.body.state || "activo";
  let errors = false;

  if (name.length === 0 || name.trim() === "") {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la categoría");
    res.render("categories/add", {
      title: "Agregar Categoría",
      name: name,
      state: state,
    });
  }

  // Validar que el estado sea válido
  if (state !== "activo" && state !== "inactivo") {
    errors = true;
    req.flash("error", "El estado debe ser 'activo' o 'inactivo'");
    res.render("categories/add", {
      name: name,
      state: "activo",
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      state: state,
    };

    // Primero verificar si ya existe una categoría con el mismo nombre
    dbConn.query(
      "SELECT id FROM categories WHERE name = ?",
      [name],
      function (err, rows) {
        if (err) {
          req.flash("error", err);
          res.render("categories/add", {
            name: form_data.name,
            state: form_data.state,
          });
        } else if (rows.length > 0) {
          req.flash("error", "Ya existe una categoría con ese nombre");
          res.render("categories/add", {
            name: form_data.name,
            state: form_data.state,
          });
        } else {
          // Si no existe, insertamos la nueva categoría
          dbConn.query(
            "INSERT INTO categories SET ?",
            form_data,
            function (err, result) {
              if (err) {
                req.flash("error", err);
                res.render("categories/add", {
                  name: form_data.name,
                  state: form_data.state,
                });
              } else {
                req.flash("success", "Categoría agregada exitosamente");
                res.redirect("/categories");
              }
            }
          );
        }
      }
    );
  }
});

// Mostrar formulario de editar categoría
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "SELECT * FROM categories WHERE id = ?",
    [id],
    function (err, rows, fields) {
      if (err) {
        req.flash("error", err);
        res.redirect("/categories");
      }
      if (rows.length <= 0) {
        req.flash("error", "Categoría no encontrada con id = " + id);
        res.redirect("/categories");
      } else {
        res.render("categories/edit", {
          title: "Editar Categoría",
          id: rows[0].id,
          name: rows[0].name,
          state: rows[0].state,
        });
      }
    }
  );
});

// Actualizar categoría
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let state = req.body.state;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la categoría");
    res.render("categories/edit", {
      id: req.params.id,
      name: name,
      state: state,
    });
  }

  // Validar que el estado sea válido
  if (state !== "activo" && state !== "inactivo") {
    errors = true;
    req.flash("error", "El estado debe ser 'activo' o 'inactivo'");
    res.render("categories/edit", {
      id: req.params.id,
      name: name,
      state: "activo",
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      state: state,
    };

    // Verificar si existe otra categoría con el mismo nombre (excepto esta misma)
    dbConn.query(
      "SELECT id FROM categories WHERE name = ? AND id != ?",
      [name, id],
      function (err, rows) {
        if (err) {
          req.flash("error", err);
          res.render("categories/edit", {
            id: req.params.id,
            name: form_data.name,
            state: form_data.state,
          });
        } else if (rows.length > 0) {
          req.flash("error", "Ya existe otra categoría con ese nombre");
          res.render("categories/edit", {
            id: req.params.id,
            name: form_data.name,
            state: form_data.state,
          });
        } else {
          // Si no existe otra categoría con el mismo nombre, actualizamos
          dbConn.query(
            "UPDATE categories SET ? WHERE id = ?",
            [form_data, id],
            function (err, result) {
              if (err) {
                req.flash("error", err);
                res.render("categories/edit", {
                  id: req.params.id,
                  name: form_data.name,
                  state: form_data.state,
                });
              } else {
                req.flash("success", "Categoría actualizada exitosamente");
                res.redirect("/categories");
              }
            }
          );
        }
      }
    );
  }
});

// Eliminar categoría
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  // Primero verificar si la categoría está en uso
  dbConn.query(
    "SELECT COUNT(*) as count FROM books WHERE category_id = ?",
    [id],
    function (err, rows) {
      if (err) {
        req.flash("error", err);
        res.redirect("/categories");
      } else if (rows[0].count > 0) {
        req.flash(
          "error",
          "No se puede eliminar la categoría porque está siendo utilizada por uno o más libros"
        );
        res.redirect("/categories");
      } else {
        // Si no está en uso, procedemos a eliminarla
        dbConn.query(
          "DELETE FROM categories WHERE id = ?",
          [id],
          function (err, result) {
            if (err) {
              req.flash("error", err);
              res.redirect("/categories");
            } else {
              req.flash("success", "Categoría eliminada exitosamente");
              res.redirect("/categories");
            }
          }
        );
      }
    }
  );
});

module.exports = router;
