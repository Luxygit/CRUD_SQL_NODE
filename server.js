const express = require("express");
const app = express();
const fs = require("fs");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const PORT = 4000;

const getFunction = (request, response) => {
  //reading file
  fs.readFile("hello.json", "utf8", (error, data) => {
    const obj = JSON.parse(data);
    response.json(obj);
  });
};
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "cyf-hotels",
  password: "idkfaiddqd",
  port: 5432,
});
const dbFunction = (request, response) => {
  pool.query("select * from hotels", (error, result) => {
    response.json(result.rows);
  });
};
//POST endpoint for a new hostel
app.use(bodyParser.json());
app.post("/hotels", function (req, res) {
  const newHotelName = req.body.name;
  let newHotelRooms = req.body.rooms;
  const newHotelPostcode = req.body.postcode;

  if (!Number.isInteger(newHotelRooms) || newHotelRooms <= 0) {
    return res
      .status(400)
      .send("The number of rooms should be a positive integer.");
  }

  pool
    .query("SELECT * FROM hotels WHERE name=$1", [newHotelName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("An hotel with the same name already exists!");
      } else {
        const query =
          "INSERT INTO hotels (name, rooms, postcode) VALUES ($1, $2, $3) RETURNING id";
        pool
          .query(query, [newHotelName, newHotelRooms, newHotelPostcode])
          .then(() => res.status(201).send("Hotel created!"))
          .catch((e) => console.error(e));
      }
    });
});
// POST customers endpoint
app.post("/customers", function (req, res) {
  const newCustomerName = req.body.name;
  const newCustomerEmail = req.body.email;
  const newCustomerAddress = req.body.address;
  const newCustomerCity = req.body.city;
  const newCustomerPostcode = req.body.postcode;
  const newCustomerCountry = req.body.country;

  pool
    .query("SELECT * FROM customers WHERE name=$1", [newCustomerName])
    .then((result) => {
      if (result.rows.length > 0) {
        return res
          .status(400)
          .send("A customer with the same name already exists!");
      } else {
        const query =
          "INSERT INTO customers (name, email, address, city, postcode, country ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id";
        pool
          .query(query, [
            newCustomerName,
            newCustomerEmail,
            newCustomerAddress,
            newCustomerCity,
            newCustomerPostcode,
            newCustomerCountry,
          ])
          .then(() =>
            res.status(201).send(`Customer ${newCustomerId} created!`)
          )
          .catch((e) => console.error(e));
      }
    });
});
// customer name, check in date, number of nights, hotel name, hotel postcose.
const getCustomerBookings = (req, res) => {
  const customerId = req.params.customerId;
  // res.send(customers.find((u) => u.id === customerId));
  pool
    .query(
      `select 
    c.name as customer_name,
    b.checkin_date,
    b.nights,
    h.name,
    h.postcode
    from customers c
    inner join bookings b on b.customer_id = c.id
    inner join hotels h on h.id = b.hotel_id
    where c.id =$1 `,
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
};

// const getFunction = (request, response) => {
//   //reading file
//   const text = fs.readFileSync("hello.json");
//   const obj = JSON.parse(text);

//   //return content
//   return response.json(obj);
// };
const getHotels = async (req, res) => {
  try {
    const queryRows = await pool.query("SELECT * FROM hotels");
    await res.json(queryRows.rows);
  } catch (err) {
    console.log(err);
  }
};
const getHotelById = async (req, res) => {
  const hotelId = req.params.hotelId;
  pool
    .query(
      `select 
    *
      from hotels h
    where h.id =$1 `,
      [hotelId]
    )
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
};
const getCustomers = async (req, res) => {
  try {
    const queryRows = await pool.query(
      `select 
      * from customers c 
      order by name`
    );
    await res.json(queryRows.rows);
  } catch (err) {
    console.log(err);
  }
};
const getCustomerById = async (req, res) => {
  const customerId = req.params.customerId;
  pool
    .query(
      `select 
    *
      from customers c
    where c.id =$1 `,
      [customerId]
    )
    .then((result) => res.json(result.rows))
    .catch((e) => console.error(e));
};
// PATCH FUNCTION
const updateCustomer = async (req, res) => {
  const customerId = req.params.customerId;
  const newEmail = req.body.email;
  const newAddress = req.body.address;
  const newCity = req.body.city;
  const newPostcode = req.body.postcode;
  const newCountry = req.body.country;

  if (newEmail.length <= 0) {
    return res.status(400).send("The email field shouldn't be empty");
  }

  pool
    .query(
      "UPDATE customers SET email=$1 address=$2 city=$3 postcode=$4 country=$5 WHERE id=$6",
      [newEmail, newAddress, newCity, newPostcode, newCountry, customerId]
    )
    .then(() => res.send(`Customer ${customerId} updated!`))
    .catch((e) => console.error(e));
};
const deleteCustomer = async (req, res) => {
  const customerId = req.params.customerId;

  pool
    .query("DELETE FROM bookings WHERE customer_id=$1", [customerId])
    .then(() => {
      pool
        .query("DELETE FROM customers WHERE id=$1", [customerId])
        .then(() => res.send(`Customer ${customerId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
};

const deleteHotel = async (req, res) => {
  const hotelId = req.params.hotelId;

  pool
    .query("DELETE FROM bookings WHERE hotel_id=$1", [hotelId])
    .then(() => {
      pool
        .query("DELETE FROM hotels WHERE id=$1", [hotelId])
        .then(() => res.send(`Hotel ${hotelId} deleted!`))
        .catch((e) => console.error(e));
    })
    .catch((e) => console.error(e));
};
// Finish and Ex 4
app.delete("/hotels/:hotelId", deleteHotel);
app.delete("/customers/:customerId", deleteCustomer);
app.patch("/customers/:customerId", updateCustomer);
app.get("/customers/:customerId/bookings", getCustomerBookings);
app.get("/customers/:customerId", getCustomerById);
app.get("/hotels", getHotels);
app.get("/hotels/:hotelId", getHotelById);
app.get("/customers", getCustomers);
app.get("/hello", getFunction);
app.get("/db", dbFunction);
app.get("/", (req, res) => {
  res.json("Welcome to the Hotels application.");
});

app.listen(PORT, () => console.log(`listening to ${PORT}`));
