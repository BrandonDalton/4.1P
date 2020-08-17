const express = require('express')
const bodyParser = require("body-parser")
const mongoose = require('mongoose');
const { ObjectID } = require('mongodb');
const { body, validationResult } = require('express-validator');

const url = 'mongodb://127.0.0.1:27017'
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

const port = 8080;
const base = `${__dirname}/public`

//Database

mongoose.connect(url, { useNewUrlParser: true })

const db = mongoose.connection

db.once('open', _ => {
  console.log('Database connected:', url)
})

db.on('error', err => {
  console.error('connection error:', err)
})

const userSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      required: true
    },
    fname: {
      type: String,
      trim: true,
      required: true
    },
    lname: {
      type: String,
      trim: true,
      required: true
    },
    email: {
      type: String,
      trim: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    address: {
      type: String,
      required: true
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postcode: {
      type: String
    },
    mobile: {
      type: String
    }
  }
)

const User = mongoose.model("User", userSchema);

//Application

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile('index.html');
})

app.post('/registrationForm', [body('email').isEmail(),
body('password').isLength({ min: 8 }).withMessage('Password Must Be Atleast 8 Char Long'),
body('password').custom((value, { req }) => {
  if (value !== req.body.passwordConfirm) {
    throw new Error("Passwords don't match");
  } else {
    return value;
  }
})], (req, res) => {

  const errors = validationResult(req);
  const hasErrors = !errors.isEmpty();

  if (hasErrors) {
    console.log('User Not Created Error');
    return res.send('User Not Created');
  } else {

    userID = ObjectID();

    const user = new User(
      {
        _id: userID,
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        password: req.body.password,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        postcode: req.body.postcode,
        mobile: req.body.mobile
      }
    )

    user.save(err => {
          if (err)
      {console.log(err)}
      else
      {console.log("Successfull!")}
      return res.send('Success');
      })
  }
});

app.listen(port, function () {
  console.log('Server Is Running On Port 3000');
  console.log(base);
})

