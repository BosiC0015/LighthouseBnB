const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  const txt = `
    SELECT id, name, email, password
    FROM users
    WHERE email = $1`;
  const value = [email];
  return pool.query(txt, value)
    .then(res => res.rows[0])
    .catch(err => {
      console.log(err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  const txt = `
    SELECT id, name, email, password
    FROM users
    WHERE id LIKE $1`;
  const value = [id];
  return pool
    .query(txt, value)
    .then(res => res.rows)
    .catch(err => {
      console.log(err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name, password, email}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  const txt = `
    INSERT INTO users(name, email, password)
    VALUES ($1, $2, $3) RETURNING *`;
  const values = [user.name, user.email, user.password];
  return pool
    .query(txt, values)
    .then(res => res.rows)
    .catch(err => {
      console.log(err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  // return getAllProperties(null, 2);
  const txt = `
    SELECT * FROM reservations
    WHERE guest_id = $1
    LIMIT $2;`;
  const values = [guest_id, limit];
  return pool
    .query(txt, values)
    .then(res => res.rows)
    .catch(err => {
      console.log(err.message);
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const values = [];
  let txt = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // if city filter exist
  if (options.city) {
    values.push(`%${options.city}%`);
    if (txt.includes('WHERE')) {
      txt += `AND city LIKE $${values.length} `;
    } else {
      txt += `WHERE city LIKE $${values.length} `;
    }
  }

  // owner_id
  if (options.owner_id) {
    values.push(`${options.owner_id}`);
    if (txt.includes('WHERE')) {
      txt += `AND owner_id = $${values.length} `;
    } else {
      txt += `WHERE owner_id = $${values.length} `;
    }
  }

  // min cost
  if (options.minimum_price_per_night) {
    values.push(`${options.minimum_price_per_night * 100}`);
    if (txt.includes('WHERE')) {
      txt += `AND cost_per_night >= $${values.length} `;
    } else {
      txt += `WHERE cost_per_night >= $${values.length} `;
    }
  }

  // max cost
  if (options.maximum_price_per_night) {
    values.push(`${options.maximum_price_per_night * 100}`);
    if (txt.includes('WHERE')) {
      txt += `AND cost_per_night <= $${values.length} `;
    } else {
      txt += `WHERE cost_per_night <= $${values.length} `;
    }
  }

  // rating
  if (options.minimum_rating) {
    values.push(`${options.minimum_rating}`);
    if (txt.includes('WHERE')) {
      txt += `AND rating >= $${values.length} `;
    } else {
      txt += `WHERE rating >= $${values.length} `;
    }
  }
  
  values.push(limit);
  txt += `
  GROUP BY properties.id
  ORDER BY cost_per_night
  LIMIT $${values.length};
  `;
  
  console.log(txt)
  return pool.query(txt, values)
    .then((res) => res.rows)
    .catch((err) => {
      console.log(err.message);
    });
}
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const values = [];
  const bindMessageCount = [];
  let count = 1;
  for (const key in property) {
    // push the actual value
    values.push(property[key]);
    // push the index of the value as "$(index + 1)"
    bindMessageCount.push(`$${count}`);
    count++;
  }
  console.log(property)

  let txt =`
  INSERT INTO properties (${Object.keys(property).join()})
  VALUES(${bindMessageCount.join()})
  RETURNING *;
  `;

  return pool.query(txt, values)
  .then(result => {
    return result.rows[0];
  })
  .catch(err => console.log(err.message));
}
exports.addProperty = addProperty;
