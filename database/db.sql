CREATE DATABASE sw1pizarra;

USE sw1pizarra;

-- TABLE USER
-- all pasword wil be encrypted using SHA1
CREATE TABLE session (
    sid VARCHAR NOT NULL PRIMARY KEY,
    sess JSON NOT NULL,
    expire TIMESTAMP(6) NOT NULL
);

-- Crear la tabla users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(30) NOT NULL,
  correo VARCHAR(100) NOT NULL,
  password VARCHAR(60) NOT NULL,
  tokenU VARCHAR(500)
);

-- Crear la tabla salas
CREATE TABLE salas (
  id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  xml TEXT,
  description TEXT,
  user_id INT,
  created_at TIMESTAMP DEFAULT current_timestamp,
  tokenS VARCHAR(500),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Crear la tabla userSalas
CREATE TABLE userSalas (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  salas_id INT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (salas_id) REFERENCES salas(id)
);
