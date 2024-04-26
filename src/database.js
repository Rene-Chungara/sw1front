const { Pool } = require('pg');
const { database } = require('./keys');

const pool = new Pool({
    connectionString: database.connectionString
});

pool.on('connect', () => {
    console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1);
});

module.exports = pool;
