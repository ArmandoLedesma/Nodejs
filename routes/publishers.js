var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Listar editoriales
router.get("/", function (req, res, next) {
  dbConn.query(
    `SELECT 
      p.*,
      COUNT(b.id) as book_count
    FROM publishers p
    LEFT JOIN books b ON p.id = b.publisher_id
    GROUP BY p.id
    ORDER BY p.name ASC`,
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
    contact_info: "",
    address: "",
    website: "",
    email: "",
    state: "activo",
  });
});

// Agregar editorial
router.post("/add", function (req, res, next) {
  let name = req.body.name;
  let contact_info = req.body.contact_info;
  let address = req.body.address;
  let website = req.body.website;
  let email = req.body.email;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la editorial");
    res.render("publishers/add", {
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: "activo",
    });
  }

  // Validar formato de email si se proporciona
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors = true;
    req.flash("error", "Por favor ingrese un correo electrónico válido");
    res.render("publishers/add", {
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: "activo",
    });
  }

  // Validar formato de website si se proporciona
  if (website && !website.match(/^(http|https):\/\/[^ "]+$/)) {
    errors = true;
    req.flash("error", "Por favor ingrese una URL válida");
    res.render("publishers/add", {
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: "activo",
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      contact_info: contact_info || null,
      address: address || null,
      website: website || null,
      email: email || null,
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
router.get("/edit/:id", function (req, res, next) {
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
          contact_info: rows[0].contact_info,
          address: rows[0].address,
          website: rows[0].website,
          email: rows[0].email,
          state: rows[0].state,
        });
      }
    }
  );
});

// Editar editorial
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let name = req.body.name;
  let contact_info = req.body.contact_info;
  let address = req.body.address;
  let website = req.body.website;
  let email = req.body.email;
  let state = req.body.state;
  let errors = false;

  if (name.length === 0) {
    errors = true;
    req.flash("error", "Por favor ingrese el nombre de la editorial");
    res.render("publishers/edit", {
      id: id,
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: state,
    });
  }

  // Validar formato de email si se proporciona
  if (email && !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
    errors = true;
    req.flash("error", "Por favor ingrese un correo electrónico válido");
    res.render("publishers/edit", {
      id: id,
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: state,
    });
  }

  // Validar formato de website si se proporciona
  if (website && !website.match(/^(http|https):\/\/[^ "]+$/)) {
    errors = true;
    req.flash("error", "Por favor ingrese una URL válida");
    res.render("publishers/edit", {
      id: id,
      name: name,
      contact_info: contact_info,
      address: address,
      website: website,
      email: email,
      state: state,
    });
  }

  if (!errors) {
    var form_data = {
      name: name,
      contact_info: contact_info || null,
      address: address || null,
      website: website || null,
      email: email || null,
      state: state,
    };

    dbConn.query(
      "UPDATE publishers SET ? WHERE id = ?",
      [form_data, id],
      function (err, result) {
        if (err) {
          req.flash("error", err);
          res.render("publishers/edit", {
            id: id,
            name: form_data.name,
            contact_info: form_data.contact_info,
            address: form_data.address,
            website: form_data.website,
            email: form_data.email,
            state: form_data.state,
          });
        } else {
          req.flash("success", "Editorial actualizada correctamente");
          res.redirect("/publishers");
        }
      }
    );
  }
});

// Eliminar editorial
router.get("/delete/:id", function (req, res, next) {
  let id = req.params.id;

  dbConn.query(
    "SELECT * FROM books WHERE publisher_id = ?",
    [id],
    function (err, books) {
      if (err) {
        req.flash("error", err);
        res.redirect("/publishers");
      } else if (books.length > 0) {
        req.flash(
          "error",
          "No se puede eliminar la editorial porque tiene libros asociados"
        );
        res.redirect("/publishers");
      } else {
        dbConn.query(
          "DELETE FROM publishers WHERE id = ?",
          [id],
          function (err, result) {
            if (err) {
              req.flash("error", err);
              res.redirect("/publishers");
            } else {
              req.flash("success", "Editorial eliminada correctamente");
              res.redirect("/publishers");
            }
          }
        );
      }
    }
  );
});

module.exports = router;
