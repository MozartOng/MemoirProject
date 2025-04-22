// src/utils/password.util.js
const bcrypt = require('bcrypt');
const saltRounds = 10; // Adjust salt rounds as needed

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

module.exports = {
  hashPassword,
  comparePassword,
};