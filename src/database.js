const {Pool} = require('pg');
//para las promesas
const { promisify } = require('util');

const { database } = require('./keys');

const pool = new Pool({
    user: database.user,
    host: database.host,
    database: database.database,
    password: database.password,
    port: database.port,
});

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('Database connection fue cerrada.');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('Database has to many connections');
        }
        //fue rechazada
        if (err.code === 'ECONNREFUSED') {
            console.error('Database connection fue rechazada');
        }
    }

    if (connection) {connection.release();
    console.log('DB esta conectada');
    }
    return;
});

// Promisify Pool Querys
pool.query = promisify(pool.query);

module.exports = pool;