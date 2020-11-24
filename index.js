// Reading from drive
const fs = require('fs');

// Parsing form data
const bodyParser = require('body-parser');

// Databases
const db    = require('quick.db');
const urls  = new db.table('urls');
const codes = new db.table('codes');

// ————————————————————————————————— //

// Create express app
const app  = require('express')();

// Create server through HTTP for sockets in the future
const http = require('http').createServer(app);

// Settings
app.set('view engine', 'ejs');
app.set('views', __dirname + '/pages');

// Get body as JSON for POST requests
app.use(bodyParser.urlencoded({extended: false}));

// Start the server.
http.listen(process.env.PORT || 3000, () => console.log('Started!'));

// ————————————————————————————————— //

app.get('*', (req, res) => {

    // Remove the '/' from the beginning of the path.
    let path = req.path.slice(1);

    // Default to /index route.
    if(!path) path = 'index';

    // Non-page stuff like CSS & images.
    if(path.startsWith('p/')) {

        // Trim the '/p' from the start.
        path = path.slice(2);

        // If the file exists, send it.
        if(fs.existsSync(`./public/${path}`)) return res.sendFile(`${__dirname}/public/${path}`);

        // Otherwise, send a 404.
        return res.status(404).end();

    }

    // Redirects
    if(path.startsWith('go/')) {

        let code = path.split('/')[1];
        if(!codes.has(code)) return res.render('invalid.ejs');
        else return res.redirect(codes.get(code));

    }

    // If the page exists, render it.
    if(fs.existsSync(`./pages/${path}.ejs`)) return res.render(`${path}.ejs`);

    // Otherwise render a 404.
    return res.render('404.ejs');

});

// ————————————————————————————————— //

// Code alphabet
const alpha = "abcdefghijklmnopqrstuvwxyz".split('').map(l => l.toLowerCase() + l.toUpperCase()).join('');

app.post('*', (req, res) => {

    if(req.path == "/shorten") {
        
        let url = req.body['URLInput'].trim();
        if(!url || !url.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)) return res.redirect(`/?error=Invalid%20URL`);

        let code;      

        if(urls.has(url)) code = urls.get(url);
        else {

            do {
                
                code = "";
                for(let i = 0; i < 5; i++) code += alpha[Math.floor(Math.random() * alpha.length)];

            } while (
                codes.has(code)
            )

            urls.set(url, code);
            codes.set(code, url);

        }

        res.redirect(`/?code=${code}`);

    }

    // 404 
    else res.status(404).end();

});

// ————————————————————————————————— //
