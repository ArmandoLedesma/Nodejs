var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar autores
router.get("/", function (req, res, next) {
  dbConn.query("SELECT * FROM authors ORDER BY id desc", function (err, rows) {
    if (err) {
      req.flash("error", err);
      res.render("authors/index", { data: "" });
    } else {
      res.render("authors/index", { data: rows });
    }
  });
});

// Mostrar formulario de agregar autor
router.get("/add", function (req, res, next) {
  res.render("authors/add", {
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
      name: name,
    });
  }

  if (!errors) {
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
            name: form_data.name,
          });
        } else {
          req.flash("success", "Autor agregado exitosamente");
          res.redirect("/authors");
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
      "UPDATE authors SET ? WHERE id = " + id,
      form_data,
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.render("authors/edit", {
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
});

// Eliminar autor
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query("DELETE FROM authors WHERE id = " + id, function (err, result) {
    if (err) {
      req.flash("error", err);
      res.redirect("/authors");
    } else {
      req.flash("success", "Autor eliminado exitosamente");
      res.redirect("/authors");
    }
  });
});

module.exports = router;
