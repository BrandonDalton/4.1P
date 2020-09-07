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

// Mailchimp Config
mailchimp.setConfig({
  apiKey: "dd440949bd38832bd72b4281546b7669-us17",
  server: "us17",
});

// Checks Response Is Successful
async function callPing() {
  const response = await mailchimp.ping.get();
  console.log(response);
}

callPing();

// Mailing List ID
const listId = "ca5e1222ed";

//Add User Function To Mail
async function addUserToMail(email, fname, lname) {
  console.log('Running Start', email, fname, lname);
  const response = await mailchimp.lists.addListMember(listId, {
    email_address: email,
    status: "subscribed",
    merge_fields: {
      FNAME: fname,
      LNAME: lname
    }
  })
  console.log('Running', response);
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
          else {
            console.log("Successfull!")
            // addUserToMail(user.email, user.fname, user.lname);
            addUserToMail(user.email, user.fname, user.lname);
            return res.redirect('login.html')
          }
        })
      })
    })
  }
});

app.route('/workers')
  //Retrieves All Workers
  .get((req, res) => {
    User.find((err, workerList) => {
      if (!err) {
        console.log('Workers:', workerList);
        res.send('Good Job')
      } else {
        console.log('Errors')
      }
    });
  })
  //Add Worker
  .post((req, res) => {

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
          else {
            return res.send("User Added")
          }
        })
      })
    })
  })
  //Delete All Users
  .delete((req, res) => {
    User.deleteMany((err) => {
      if (err) {
        res.send(err);
      } else {
        res.send('Tasks All Deleted')
      }
    })
  })
//Route With ID
app.route('/workers/:id')
  .get((req, res) => {
    //Find User Based On ID
    User.findOne({ _id: req.params._id }, (err, foundWorker) => {
      if (foundWorker) {
        res.send(foundWorker)
      } else {
        res.send("No Worker Found");
      }
    })
  })
  //Delete Specific User Users
  .delete((req, res) => {
    User.deleteOne({ _id: req.params._id }, (err, workerDeleted) => {
      if (workerDeleted) {
        res.send(workerDeleted)
      } else {
        res.send("Worker Not Found")
      }
    })
  })
  //Updates Users Address and Mobile Based on ID
  .put((req, res) => {
    User.update(
      { _id: req.params._id },
      { address: req.body.address },
      { mobile: req.body.mobile },
      { overwrite: true }, (err) => {
        if (err) {
          res.send(err)
        } else {
          res.send("Worker Updated")
        }
      }
    )
  })
  //Updates Users Password
  .patch((req, res) => {
    const password = req.body.password;
    //Password Hasing Storing

    //Hashes The Password
    bcrypt.genSalt(saltRounds, function (err, salt) {
      bcrypt.hash(password, salt, function (err, hash) {
        User.update(
          { _id: req.params._id },
          { password: password },
          (err) => {
            if (!err) { res.send('Successfully updated! ') }
            else res.send(err)
          }
        )
      })
    })
  })

app.post('/loginForm', function (req, res) {

  //User Login Email Input
  const userEmailLogin = req.body.email;

  //Search To See If Email Exists
  User.findOne({ email: userEmailLogin }, function (err, acc) {
    //If Errors Log
    if (err) {
      console.log("Errors:", err)
    }
    else {
      //If Document Is Null
      if (acc == null) {
        //Cant Find Account
        console.log("Errors:", 'Cant Find Login Details')
      } else {
        //Input Password
        const passwordInput = req.body.password;
        //Compare Database Has vs Password
        bcrypt.compare(passwordInput, acc.password, function (err, result) {
          //If Correct Redirect
          if (result == true) {
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

//App Listen
app.listen(port, function () {
  console.log('Server Is Running On Port 3000');
  console.log(base);
})

