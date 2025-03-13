const express = require('express');
const bodyParser = require('body-parser'); // Non è più necessario con Express 4.16+, vedi sotto
const mysql = require('mysql2');
const nodemailer = require('nodemailer');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');

const app = express();
const port = 3001;
app.use(express.static('public'));

// Configura il body-parser per gestire le richieste POST
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Necessario se usi JSON nel corpo della richiesta

// Configura la connessione al database MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Tricheca1',
    database: 'mydb'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('MySQL connected...');
});

// Configura le sessioni
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

// Imposta EJS come motore di visualizzazione
app.set('view engine', 'ejs');

// Configura il middleware per i file statici
app.use(express.static(path.join(__dirname, 'public')));

// Gestione delle richieste GET per il rendering delle pagine
app.get('/', (req, res) => {
    res.render("index", { user: req.session.user });
});

app.get('/RegisterController', (req, res) => {
    res.render("RegisterController");
});

app.get('/Verifica_Email', (req, res) => {
    res.render("Verifica_Email");
});
app.get('/AboutUs', (req, res) => {
    res.render("AboutUs");
});
app.get('/Cambio_Password', (req, res) => {
    res.render("Cambio_Password", { user: req.session.user });
});
app.get('/ControllerLogin', (req, res) => {
    res.render("ControllerLogin", { user: req.session.user });
});
app.get('/MobileLogin', (req, res) => {
    res.render("MobileLogin", { user: req.session.user });
});
app.get('/DesktopLogin', (req, res) => {
    res.render("DesktopLogin", { user: req.session.user });
});
app.get('/ControllerConsulenza', (req, res) => {
    res.render("ControllerConsulenza", { user: req.session.user });
});
app.get('/Consulenza_Generale', (req, res) => {
    res.render("Consulenza_Generale", { user: req.session.user });
});
app.get('/Account', (req, res) => {
    res.render("Account", { user: req.session.user });
});
app.get('/Recupero_Password', (req, res) => {
    res.render("Recupero_Password", { user: req.session.user });
});
app.get('/Password_Dimenticata', (req, res) => {
    res.render("Password_Dimenticata", { user: req.session.user });
});
app.get('/RegisterMobile', (req, res) => {
    res.render("RegisterMobile");
});

app.get('/RegisterDesktop', (req, res) => {
    res.render("RegisterDesktop");
});
app.get('/MobileConsulenza', (req, res) => {
    res.render("MobileConsulenza");
});

app.get('/Congratulazioni', (req, res) => {
    res.render("Congratulazioni");
});

app.get('/DesktopConsulenza', (req, res) => {
    res.render("DesktopConsulenza");
});

app.get('/Account_vecchio', (req, res) => {
    res.render("Account_vecchio", { user: req.session.user });
});


app.post('/invia-consulenza', (req, res) => {
    const { Nome, Cognome, Email, Telefono, Richiesta } = req.body;
    console.log(Nome, Cognome, Email, Telefono, Richiesta);
    // Query SQL per inserire i dati nel database
    const sql = `INSERT INTO richieste_utente (nome, cognome, email, telefono, richiesta)
                 VALUES (?, ?, ?, ?, ?)`;
    
    db.query(sql, [Nome, Cognome, Email, Telefono, Richiesta], (err, result) => {
        if (err) {
            console.error('Errore durante l\'inserimento dei dati:', err);
            return res.status(500).send('Errore nel server');
        }
        console.log('Dati inseriti correttamente nel database:', result);
        res.send('Richiesta inviata con successo!');
    });
});
app.post('/register', (req, res) => {
    const { Nome, Email, Password } = req.body;  // Assicurati che req.body contenga questi valori
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // Codice per verificare l'email e inserire l'utente nel database
    const checkEmailQuery = 'SELECT * FROM Utenti WHERE email = ?';

    db.query(checkEmailQuery, [Email], (err, result) => {
        if (err) {
            console.error('Errore durante il controllo dell\'email:', err);
            return res.status(500).json({ error: 'Errore del server.' });
        }
        
        if (result.length > 0) {
            return res.status(400).json({ error: 'Email già registrata.' });
        } else {
            const sql = 'INSERT INTO Utenti (Nome, Email, Password, VerificationCode) VALUES (?, ?, ?, ?)';
            db.query(sql, [Nome, Email, Password, verificationCode], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'inserimento dell\'utente:', err);
                    return res.status(500).json({ error: 'Errore del server durante la registrazione.' });
                }
                
                console.log('Utente registrato con successo.');
                 // Salva l'email nella sessione
                 req.session.Email = Email;
                 // Non inviare email in questa fase
                 console.log(`Verification code for ${Email}: ${verificationCode}`);
                res.status(200).json({ message: 'Registrazione completata con successo.' });
            });
        }
    });
});


// Gestione della richiesta POST per il login
app.post('/Login', (req, res) => {
    const { Email, Password } = req.body;

    const sql = 'SELECT * FROM Utenti WHERE Email = ?';
    db.query(sql, [Email], async (err, result) => {
        if (err) {
            console.error('Errore durante il login:', err);
            return res.status(500).send('Errore nel server');
        }
        if (result.length === 0) {
            return res.status(404).send('Email non esistente');
        } else {
            const user = result[0];
            console.log("Dati utente recuperati:", user);

            if (!user.password) {
                return res.status(500).send('Errore: Password non trovata nel database.');
            }

            
      
            if (!(user.password==Password)) {
               return res.status(401).send('Password errata');
            } else {
                console.log("Login riuscito!");

                // Salva ulteriori informazioni nella sessione
                req.session.user = {
                    id: user.id, // Puoi salvare l'ID o altre informazioni necessarie
                    nome: user.nome,
                    Cognome: user.Cognome,
                    email:user.email,
                    telefono:user.telefono,
                    password:user.password,
                    Alt_Email: user.Alt_Email, // Salva anche l'email alternativa
                };

                res.redirect('/'); // Reindirizza alla pagina principale dopo il login
            }
        }
    });
});


app.post('/verify_code', (req, res) => {
    const { verificationCode } = req.body;
    const Email = req.session.Email;

    if (!Email) {
        return res.status(400).send('Nessuna email trovata nella sessione');
    }

    console.log('Received data:', { verificationCode, Email });

    const checkCodeQuery = 'SELECT * FROM Utenti WHERE Email = ? AND VerificationCode = ?';
    db.query(checkCodeQuery, [Email, verificationCode], (err, result) => {
        if (err) {
            console.error('Errore durante la verifica del codice:', err);
            return res.status(500).send('Errore nel server');
        }

        console.log('Query result:', result);

        if (result.length === 0) {
            console.log(`Codice di verifica non valido. Codice fornito: ${verificationCode}, Email: ${Email}`);
            return res.status(400).send('Codice di verifica non valido');
        } else {
            const updateQuery = 'UPDATE Utenti SET IsVerified = true WHERE Email = ?';
            db.query(updateQuery, [Email], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'aggiornamento dello stato di verifica:', err);
                    return res.status(500).send('Errore nel server');
                }
                res.status(200).send('Verifica completata. Ora puoi effettuare il login.');
            });
        }
    });
});

app.post('/Account_Button', (req, res) => {
    const { name, surname, email, alt_email, phone } = req.body;

    // Esegui la query per aggiornare i dati utente
    const query = `
        UPDATE Utenti 
        SET nome = ?, cognome = ?, Alt_Email = ?, telefono = ?
        WHERE email = ?;
    `;

    db.query(query, [name, surname, alt_email, phone, email], (error, results) => {
        if (error) {
            console.error('Errore durante l\'aggiornamento dei dati: ', error);
            return res.status(500).json({ message: 'Errore durante il salvataggio dei dati.' });
        }
        req.session.user.nome = name;
        req.session.user.Cognome = surname;
        req.session.user.Alt_Email = alt_email;
        req.session.user.telefono = phone;
        return res.status(200).json({ message: 'Dati aggiornati con successo.' });
    });
});
function authMiddleware(req, res, next) {
    if (req.session && req.session.user) {
        console.log('Utente autenticato:', req.session.user);
        next();
    } else {
        console.log('Accesso non autorizzato');
        res.status(401).send('Non autorizzato');
    }
}
app.post('/change_password', async (req, res) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'Le nuove password non corrispondono.' });
    }

    try {
        const userEmail = req.session.user.email;

        const sql = 'SELECT * FROM Utenti WHERE email = ?'; // Assicurati di usare "email" minuscolo
        db.query(sql, [userEmail], (err, result) => {
            if (err) {
                console.error('Errore durante il recupero dell\'utente:', err);
                return res.status(500).json({ error: 'Errore nel server' });
            }
            if (result.length === 0) {
                return res.status(404).json({ error: 'Utente non trovato' });
            }

            const user = result[0];
            console.log('Password dal database:', user.password);
            console.log('Password inserita:', oldPassword);
            
            // Controlla la vecchia password
            if (oldPassword !== user.password) { // Assicurati di usare "password" minuscolo
                console.log("entrato");
                return res.status(401).json({ error: 'Password vecchia errata' });
            }

            // Aggiorna la password senza hashing
            const updateSql = 'UPDATE Utenti SET password = ? WHERE email = ?'; // Assicurati di usare "password" minuscolo
            db.query(updateSql, [newPassword, userEmail], (err, result) => {
                if (err) {
                    console.error('Errore durante l\'aggiornamento della password:', err);
                    return res.status(500).json({ error: 'Si è verificato un errore durante l\'aggiornamento della password.' });
                }

                res.status(200).json({ message: 'Password cambiata con successo!' });
            });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Si è verificato un errore durante il cambio della password.' });
    }
});



// Gestione della richiesta POST per il reinvio del codice di verifica
app.post('/resend_verification', (req, res) => {
    const { email } = req.body;
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    const updateSql = 'UPDATE Utenti SET VerificationCode = ? WHERE Email = ?';
    db.query(updateSql, [verificationCode, email], (err, result) => {
        if (err) {
            return res.status(500).send('Errore nel server');
        }
        sendVerificationEmail(email, verificationCode);
        res.status(200).send('Email di verifica reinviata con successo.');
    });
});

// Funzione per l'invio dell'email di verifica
function sendVerificationEmail(email, code) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'artavi.team@gmail.com',
            pass: 'arcidiacono_clown!'
        }
    });

    const mailOptions = {
        from: 'artavi.team@gmail.com',
        to: email,
        subject: 'Codice di Verifica',
        text: `Il tuo codice di verifica è: ${code}`
    };

    transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });
}

// Avvia il server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
