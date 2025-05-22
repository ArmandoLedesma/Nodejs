var express = require("express");
var router = express.Router();
var dbConn = require("../lib/db");

/* GET home page. */
router.get("/", function (req, res, next) {
  // Obtener conteo de libros
  dbConn.query(
    "SELECT COUNT(*) as count FROM books",
    function (err, bookResults) {
      if (err) {
        req.flash("error", err);
        res.render("index", {
          title: "Panel de Control",
          bookCount: "0",
          authorCount: "0",
          recentActivity: "0",
        });
      } else {
        // Obtener conteo de autores
        dbConn.query(
          'SELECT COUNT(*) as count FROM authors WHERE state = "activo"',
          function (err, authorResults) {
            if (err) {
              req.flash("error", err);
              res.render("index", {
                title: "Panel de Control",
                bookCount: bookResults[0].count,
                authorCount: "0",
                recentActivity: "0",
              });
            } else {
              // Obtener actividad reciente (últimos 7 días)
              dbConn.query(
                `
            SELECT COUNT(*) as count 
            FROM (
              SELECT id FROM books WHERE books.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              UNION ALL
              SELECT id FROM authors WHERE authors.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              UNION ALL
              SELECT id FROM categories WHERE categories.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
              UNION ALL
              SELECT id FROM publishers WHERE publishers.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ) as recent
          `,
                function (err, activityResults) {
                  res.render("index", {
                    title: "Panel de Control",
                    bookCount: bookResults[0].count,
                    authorCount: authorResults[0].count,
                    recentActivity: err ? "0" : activityResults[0].count,
                  });
                }
              );
            }
          }
        );
      }
    }
  );
});

module.exports = router;
