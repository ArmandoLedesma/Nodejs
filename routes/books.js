var express = require('express');
var router = express.Router();
var dbConn  = require('../lib/db');
 
// Mostrar página de libros
router.get('/', function(req, res, next) {
      
    dbConn.query('SELECT * FROM books ORDER BY id desc',function(err,rows)     {
 
        if(err) {
            req.flash('error', err);
            // renderiza a views/books/index.ejs
            res.render('books',{data:''});   
        } else {
            // renderiza a views/books/index.ejs
            res.render('books',{data:rows});
        }
    });
});

// Mostrar página de agregar libro
router.get('/add', function(req, res, next) {    
    // renderiza a views/books/add.ejs
    res.render('books/add', {
        name: '',
        author: ''        
    })
})

// Agregar libro
router.post('/add', function(req, res, next) {    

    let name = req.body.name;
    let author = req.body.author;
    let errors = false;

    if(name.length === 0 || author.length === 0) {
        errors = true;

        // Establecer mensaje de error
        req.flash('error', "Por favor ingrese el nombre y el autor");
        // Renderizar a add.ejs con mensaje de error
        res.render('books/add', {
            name: name,
            author: author
        })
    }

    // si no hay error
    if(!errors) {

        var form_data = {
            name: name,
            author: author
        }
        
        // Insert query
        dbConn.query('INSERT INTO books SET ?', form_data, function(err, result) {
            // Si (err) lanzar err
            if (err) {
                req.flash('error', err)
                 
                // Renderizar a add.ejs
                res.render('books/add', {
                    name: form_data.name,
                    author: form_data.author                    
                })
            } else {                
                req.flash('success', 'Libro agregado exitosamente');
                res.redirect('/books');
            }
        })
    }
})

// Mostrar página de editar libro
router.get('/edit/(:id)', function(req, res, next) {

    let id = req.params.id;
   
    dbConn.query('SELECT * FROM books WHERE id = ' + id, function(err, rows, fields) {
        if(err) throw err
         
        // Si el usuario no se encuentra
        if (rows.length <= 0) {
            req.flash('error', 'Book not found with id = ' + id)
            res.redirect('/books')
        }
        // Si se encuentra el libro
        else {
            // Renderizar a edit.ejs
            res.render('books/edit', {
                title: 'Edit Book', 
                id: rows[0].id,
                name: rows[0].name,
                author: rows[0].author
            })
        }
    })
})

// Actualizar datos del libro
router.post('/update/:id', function(req, res, next) {

    let id = req.params.id;
    let name = req.body.name;
    let author = req.body.author;
    let errors = false;

    if(name.length === 0 || author.length === 0) {
        errors = true;
        
        // Establecer mensaje de error
        req.flash('error', "Porfavor ingrese el nombre y el autor");
        // renderizar en add.ejs con mensaje flash
        res.render('books/edit', {
            id: req.params.id,
            name: name,
            author: author
        })
    }

    // Si no hay error
    if( !errors ) {   
 
        var form_data = {
            name: name,
            author: author
        }
        // Actualizar query
        dbConn.query('UPDATE books SET ? WHERE id = ' + id, form_data, function(err, result) {
            // si (err) lanzar err
            if (err) {
                // Establecer mensaje de error
                req.flash('error', err)
                // Renderizar a edit.ejs
                res.render('books/edit', {
                    id: req.params.id,
                    name: form_data.name,
                    author: form_data.author
                })
            } else {
                req.flash('success', 'Libro actualizado exitosamente');
                res.redirect('/books');
            }
        })
    }
})
   
// Eliminar libro
router.get('/delete/(:id)', function(req, res, next) {

    let id = req.params.id;
     
    dbConn.query('DELETE FROM books WHERE id = ' + id, function(err, result) {
        // si (err) lanzar err
        if (err) {
            // Establecer mensaje de error
            req.flash('error', err)
            // Redireccionar a la página de libros
            res.redirect('/books')
        } else {
            // Establecer mensaje de éxito
            req.flash('success', 'Libro eliminado exitosamente ID = ' + id)
            // Redireccionar a la página de libros
            res.redirect('/books')
        }
    })
})

module.exports = router;