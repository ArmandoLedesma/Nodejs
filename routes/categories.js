var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar categorías
router.get("/", function (req, res, next) {
  dbConn.query(
    "SELECT * FROM categories ORDER BY id desc",
    function (err, rows) {
      if (err) {
        req.flash("error", err);
        res.render("categories/index", { data: "" });
      } else {
        res.render("categories/index", { data: rows });
      }
    }
  );
});

// Mostrar formulario de agregar categoría
router.get("/add", function (req, res, next) {
  res.render("categories/add", {
    name: "",
    state: "activo", // Estado por defecto
  });
});

// Agregar categoría
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let state = req.body.state || "activo";
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la categoría");
    res.render("categories/add", {
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
