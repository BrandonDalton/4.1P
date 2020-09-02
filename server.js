const express = require('express')
const bodyParser = require("body-parser")
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { ObjectID } = require('mongodb');
const { body, validationResult } = require('express-validator');
const mailchimp = require('@mailchimp/mailchimp_marketing');

const url = 'mongodb://127.0.0.1:27017/db_users'
const app = express();
app.use(bodyParser.urlencoded({ extended: true }))

const port = 8080;
const base = `${__dirname}/public`

const saltRounds = 10;

mailchimp.setConfig({
  apiKey: "dd440949bd38832bd72b4281546b7669-us17",
  server: "us17",
});

async function callPing() {
  const response = await mailchimp.ping.get();
  console.log(response);
}

callPing();

const listId = "ca5e1222ed";

async function addUserToMail(email, fname, lname) {
  console.log('Running Start', email, fname, lname );
  const response = await mailchimp.lists.addListMember(listId, {
    email_address: email,
    status: "subscribed",
    merge_fields: {
      FNAME: fname,
      LNAME: lname
    }
  })
  console.log('Running' , response);
}




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

const User = mongoose.model("users", userSchema);

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
    const password = req.body.password;
    //Password Hasing Storing

    //Hashes The Password
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        //If No Errors  Create User
        const user = new User(
          {
            _id: userID,
            fname: req.body.fname,
            lname: req.body.lname,
            email: req.body.email,
            password: hash,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            postcode: req.body.postcode,
            mobile: req.body.mobile
          }
        )

        user.save(err => {
          if (err) { console.log(err) }
          else { console.log("Successfull!")
          // addUserToMail(user.email, user.fname, user.lname);
          addUserToMail(user.email, user.fname, user.lname);
          return res.redirect('login.html')
        }
        })
      })
    })
  }
});

app.post('/loginForm', function (req, res) {
  
  //User Login Email Input
  const userEmailLogin = req.body.email;

  //Search To See If Email Exists
  User.findOne({ email: userEmailLogin }, function (err, acc) {
    //If Errors Log
    if (err) {
      console.log("Errors:" ,err)
    }
    else {
      //If Document Is Null
      if(acc == null) {
        //Cant Find Account
        console.log("Errors:" , 'Cant Find Login Details')
      } else {
        //Input Password
        const passwordInput = req.body.password;
        //Compare Database Has vs Password
        bcrypt.compare(passwordInput, acc.password, function(err, result) {
          //If Correct Redirect
          if(result == true){
            res.redirect('reqlogin.html')
          } else {
            //Password is incorrect
            console.log('Password Is Incorrect.')
          }
      });
      }
      
    }
  });
})

app.listen(port, function () {
  console.log('Server Is Running On Port 3000');
  console.log(base);
})

