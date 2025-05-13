var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar editoriales
router.get("/", function (req, res, next) {
  dbConn.query(
    "SELECT * FROM publishers ORDER BY id desc",
    function (err, rows) {
      if (err) {
        req.flash("error", err);
        res.render("publishers/index", { data: "" });
      } else {
        res.render("publishers/index", { data: rows });
      }
    }
  );
});

// Mostrar formulario de agregar editorial
router.get("/add", function (req, res, next) {
  res.render("publishers/add", {
    name: "",
  });
});

// Agregar editorial
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la editorial");
    res.render("publishers/add", {
      name: name,
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      state: "activo",
    };

    dbConn.query(
      "INSERT INTO publishers SET ?",
      form_data,
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.render("publishers/add", {
            name: form_data.name,
          });
        } else {
          req.flash("success", "Editorial agregada exitosamente");
          res.redirect("/publishers");
        }
      }
    );
  }
});

// Mostrar formulario de editar editorial
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "SELECT * FROM publishers WHERE id = " + id,
    function (err, rows, fields) {
      if (err) throw err;
      if (rows.length <= 0) {
        req.flash("error", "Editorial no encontrada con id = " + id);
        res.redirect("/publishers");
      } else {
        res.render("publishers/edit", {
          id: rows[0].id,
          name: rows[0].name,
          state: rows[0].state,
        });
      }
    }
  );
});

// Actualizar editorial
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let state = req.body.state;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la editorial");
    res.render("publishers/edit", {
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
      "UPDATE publishers SET ? WHERE id = " + id,
      form_data,
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.render("publishers/edit", {
            id: req.params.id,
            name: form_data.name,
            state: form_data.state,
          });
        } else {
          req.flash("success", "Editorial actualizada exitosamente");
          res.redirect("/publishers");
        }
      }
    );
  }
});

// Eliminar editorial
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "DELETE FROM publishers WHERE id = " + id,
    function (err, result) {
      if (err) {
        req.flash("error", err);
        res.redirect("/publishers");
      } else {
        req.flash("success", "Editorial eliminada exitosamente");
        res.redirect("/publishers");
      }
    }
  );
});

module.exports = router;
