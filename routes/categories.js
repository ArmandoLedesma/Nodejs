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
  });
});

// Agregar categoría
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la categoría");
    res.render("categories/add", {
      name: name,
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      state: "activo",
    };

    dbConn.query(
      "INSERT INTO categories SET ?",
      form_data,
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.render("categories/add", {
            name: form_data.name,
          });
        } else {
          req.flash("success", "Categoría agregada exitosamente");
          res.redirect("/categories");
        }
      }
    );
  }
});

// Mostrar formulario de editar categoría
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "SELECT * FROM categories WHERE id = " + id,
    function (err, rows, fields) {
      if (err) throw err;
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

  if (!errors) {
    var form_data = {
      name: name,
      state: state,
    };
    dbConn.query(
      "UPDATE categories SET ? WHERE id = " + id,
      form_data,
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
});

// Eliminar categoría
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "DELETE FROM categories WHERE id = " + id,
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
});

module.exports = router;
