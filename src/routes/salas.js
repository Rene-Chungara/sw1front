const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
//referencia a la base de datos
const pool = require('../database');
const { isLoggedIn } = require('../lib/auth');
const qr = require('qrcode')
const nodemailer = require('nodemailer')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_GOOGLE,
        pass: process.env.PASS_GOOGLE,
    },
})
const direccion = 'http://localhost:5000/'

router.get('/add', isLoggedIn, (req, res) => {
    //renderizar
    res.render('salas/add');
});

router.post('/add', isLoggedIn, async (req, res) => {
    const { title, xml, description } = req.body;
    const newSalas = {
        title,
        xml,
        description,
        user_id: req.user.id
    };
    const token = jwt.sign({ newSalas }, 'token_sala');
    console.log(token);
    newSalas.tokenS = token;
    const sala = await pool.query('INSERT INTO salas set ?', [newSalas]);
    console.log(sala);
    newSalas.id = sala.insertId;
    console.log(newSalas.id);
    const newUS = {
        user_id: req.user.id,
        salas_id: newSalas.id
    };
    await pool.query('INSERT INTO usersalas set ?', [newUS]);
    //mensajes nombre del mensaje
    req.flash('success', 'Salas guardada Satisfactoriamente');
    res.redirect('/salas');
    // res.send('recibido');
});

router.get('/', isLoggedIn, async (req, res) => {
    const salas = await pool.query('SELECT * FROM salas where user_id = ?', [req.user.id]);
    res.render('salas/list', { salas });
});

router.get('/salasCompartidas', isLoggedIn, async (req, res) => {
    try {
        const idUs = req.user.id;
        console.log(idUs + 'id usuario');
        const salas = await pool.query('SELECT salas.*, users.username AS owner FROM salas JOIN users ON salas.user_id = users.id WHERE salas.id IN (SELECT usersalas.salas_id FROM usersalas WHERE user_id = ?)', [req.user.id]);
        console.log(salas);
        res.render('salas/listCompartidas', { salas });
    } catch (error) {
        console.log(error);
        req.flash('error', 'Error al obtener las salas compartidas');
        res.redirect('/salas');
    }
});

router.get('/delete/:id', async (req, res) => {
    console.log(req.params.id);
    const { id } = req.params;
    //agregar seguridad al eliminar
    await pool.query('DELETE FROM usersalas WHERE salas_id = ?', [id]);
    await pool.query('DELETE FROM salas WHERE ID = ?', [id]);
    req.flash('success', 'Sala eliminada de la base de datos');
    res.redirect('/salas');
});

router.get('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const salas = await pool.query('SELECT * FROM salas WHERE id = ?', [id]);
    console.log(salas);
    res.render('salas/edit', { sala: salas[0] });
});

router.post('/edit/:id', isLoggedIn, async (req, res) => {
    const { id } = req.params;
    const { title, description, xml } = req.body;
    const newSala = {
        title,
        description,
        xml
    };
    await pool.query('UPDATE salas set ? WHERE id = ?', [newSala, id]);
    req.flash('success', 'Sala actualizada Satisfactoriamente');
    res.redirect('/salas');
});

router.get('/inSala/:tokenS', isLoggedIn, async (req, res) => {
    const tokenU = req.user.tokenU;
    console.log(tokenU + 'token de usuario');
    const { tokenS } = req.params;
    console.log(req.params + ' requ parametros');
    const inSala = '?room=' + tokenS;
    const inUs = '&username=' + tokenU;
    const xml = 'http://18.224.96.207:8080/model-UML' + inSala + inUs;
    console.log(xml);
    res.redirect(xml);
});

router.get('/listUsuarios/:idSala', isLoggedIn, async (req, res) => {
    const { idSala } = req.params;

    try {
        // Obtener todos los usuarios
        const allUsers = await pool.query('SELECT * FROM users');

        // Obtener los usuarios que ya están en la sala
        const usersInSala = await pool.query('SELECT user_id FROM usersalas WHERE salas_id = ?', [idSala]);
        const usersInSalaIds = usersInSala.map(user => user.user_id);

        // Filtrar los usuarios que no están en la sala
        const usersNotInSala = allUsers.filter(user => !usersInSalaIds.includes(user.id));

        res.render('salas/listUsuarios', { users: usersNotInSala, idSala });
    } catch (error) {
        console.log(error);
        req.flash('error', 'Error al obtener la lista de usuarios');
        res.redirect('/salas');
    }
});


router.post('/compartir/:idSala', isLoggedIn, async (req, res) => {
    try {
        const { idUsuario } = req.body;
        const { idSala } = req.params;
        const [user] = await pool.query('SELECT * FROM users WHERE id = ?', [idUsuario]);
        if (!user) {
            throw new Error('El usuario seleccionado no existe');
        }
        await enviarCorreoInvitacion(user);
        await pool.query('INSERT INTO usersalas SET ?', { user_id: idUsuario, salas_id: idSala });
        req.flash('success', 'Compartido Satisfactoriamente');
        res.redirect('/salas');
    } catch (error) {
        console.error('Error al compartir sala:', error);
        req.flash('error', 'Error al compartir la sala. Por favor, inténtalo de nuevo.');
        res.redirect('/salas');
    }
});

const enviarCorreoInvitacion = async (user) => {
    try {
    
        const { username,correo } = user
        const codigoQRGenerado = await generarQRBuffer(direccion)
        const contenidoHTML = `
            <html>
                <body>
                    <h1 >Hola ${username}.</h1>
                    <p>Usted fue invita a la plataforma de Diagramas de Secuencia</p>
                    <p>Por favor escanee el siguiente QR para ingresar a la plataforma</p>
                    <hr>             
                    <p>Código QR</p>

                    <img src="cid:codigoQR" alt="Código QR">
                    
                </body>
            </html>
        `

        const asunto = `Invitacion a la Plataforma de Diagramas de Secuencia`
        const mailOptions = {
            from: process.env.EMAIL_GOOGLE,
            to: user.correo,
            subject: asunto,
            html: contenidoHTML,
            attachments: [
                {
                    filename: 'codigoQR.png',
                    content: codigoQRGenerado,
                    encoding: 'base64',
                    cid: 'codigoQR'
                }
            ]
        }

        const info = await transporter.sendMail(mailOptions)
        console.log('correo enviado con exito')
        return {
            success: true,
            status: 200,
            mensaje: 'Correo electrónico enviado con éxito',
            info,
        };

    } catch (error) {
        console.log(error)
        return {
            success: false,
            status: 404,
            mensaje: 'No se pudo enviar el correo electrónico',
            error: error.message,
        }
    }
}


const generarQRBuffer = async (direccion) => {
    const qrCodeURL = direccion
    const qrCode = await qr.toBuffer(qrCodeURL);
    console.log(qrCode);
    return qrCode
}



module.exports = router;