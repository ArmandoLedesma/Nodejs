var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

// Mostrar lista de usuarios con paginación y filtros
router.get("/", function (req, res, next) {
  const page = parseInt(req.query.page) || 1;
  const limit = 10; // usuarios por página
  const offset = (page - 1) * limit;

  // Construir la consulta base
  let baseQuery = `FROM users WHERE 1=1`;
  let params = [];

  // Aplicar filtros si existen
  if (req.query.search) {
    baseQuery += ` AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR document_number LIKE ?)`;
    const searchTerm = `%${req.query.search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (req.query.user_type) {
    baseQuery += ` AND user_type = ?`;
    params.push(req.query.user_type);
  }

  if (req.query.state) {
    baseQuery += ` AND state = ?`;
    params.push(req.query.state);
  }

  let countQuery = `SELECT COUNT(*) as total ${baseQuery}`;

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
      res.render("users/index", {
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
        res.render("users/index", {
          title: "Gestión de Usuarios",
          data: "",
          pagination: {},
          filters: req.query,
        });
      } else {
        res.render("users/index", {
          title: "Gestión de Usuarios",
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

// Mostrar formulario de agregar usuario
router.get("/add", function (req, res, next) {
  res.render("users/add", {
    title: "Agregar Usuario",
    document_type: "",
    document_number: "",
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
    user_type: "",
    state: "activo",
  });
});

// Agregar usuario
router.post("/add", function (req, res, next) {
  let document_type = req.body.document_type;
  let document_number = req.body.document_number;
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let email = req.body.email;
  let phone = req.body.phone;
  let address = req.body.address;
  let user_type = req.body.user_type;
  let state = req.body.state || "activo";
  let errors = false;

  // Validación
  if (
    !document_type ||
    !document_number ||
    !first_name ||
    !last_name ||
    !email ||
    !user_type
  ) {
    errors = true;
    req.flash("error", "Por favor complete todos los campos requeridos");
    res.render("users/add", {
      document_type: document_type,
      document_number: document_number,
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: phone,
      address: address,
      user_type: user_type,
      state: state,
    });
  }

  // Si no hay errores
  if (!errors) {
    var form_data = {
      document_type: document_type,
      document_number: document_number,
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: phone,
      address: address,
      user_type: user_type,
      state: state,
    };

    // Insertar usuario
    dbConn.query("INSERT INTO users SET ?", form_data, function (err, result) {
      if (err) {
        req.flash("error", err.message);
        res.render("users/add", form_data);
      } else {
        req.flash("success", "Usuario agregado exitosamente");
        res.redirect("/users");
      }
    });
  }
});

// Mostrar página de editar usuario
router.get("/edit/(:id)", function (req, res, next) {
  let id = req.params.id;
  dbConn.query(
    "SELECT * FROM users WHERE id = ?",
    [id],
    function (err, rows, fields) {
      if (err) throw err;

      // Si no se encuentra el usuario
      if (rows.length <= 0) {
        req.flash("error", "Usuario no encontrado con id = " + id);
        res.redirect("/users");
      } else {
        res.render("users/edit", {
          title: "Editar Usuario",
          id: rows[0].id,
          document_type: rows[0].document_type,
          document_number: rows[0].document_number,
          first_name: rows[0].first_name,
          last_name: rows[0].last_name,
          email: rows[0].email,
          phone: rows[0].phone,
          address: rows[0].address,
          user_type: rows[0].user_type,
          state: rows[0].state,
        });
      }
    }
  );
});

// Actualizar usuario
router.post("/update/:id", function (req, res, next) {
  let id = req.params.id;
  let document_type = req.body.document_type;
  let document_number = req.body.document_number;
  let first_name = req.body.first_name;
  let last_name = req.body.last_name;
  let email = req.body.email;
  let phone = req.body.phone;
  let address = req.body.address;
  let user_type = req.body.user_type;
  let state = req.body.state;
  let errors = false;

  if (
    !document_type ||
    !document_number ||
    !first_name ||
    !last_name ||
    !email ||
    !user_type
  ) {
    errors = true;
    req.flash("error", "Por favor complete todos los campos requeridos");
    res.redirect("/users/edit/" + id);
  }

  // Si no hay errores
  if (!errors) {
    var form_data = {
      document_type: document_type,
      document_number: document_number,
      first_name: first_name,
      last_name: last_name,
      email: email,
      phone: phone,
      address: address,
      user_type: user_type,
      state: state,
    };

    // Actualizar usuario
    dbConn.query(
      "UPDATE users SET ? WHERE id = ?",
      [form_data, id],
      function (err, result) {
        if (err) {
          req.flash("error", err.message);
          res.redirect("/users/edit/" + id);
        } else {
          req.flash("success", "Usuario actualizado exitosamente");
          res.redirect("/users");
        }
      }
    );
  }
});

// Eliminar usuario
router.get("/delete/(:id)", function (req, res, next) {
  let id = req.params.id;

  dbConn.query("DELETE FROM users WHERE id = ?", [id], function (err, result) {
    if (err) {
      req.flash("error", err);
      res.redirect("/users");
    } else {
      req.flash("success", "Usuario eliminado exitosamente! ID = " + id);
      res.redirect("/users");
    }
  });
});

module.exports = router;
