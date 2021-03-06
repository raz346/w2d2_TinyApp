const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const cookieSession = require('cookie-session');
let app = express();
// default port is 8080
let PORT = 8080;
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["agdhsg3476"]
}));
// pass the user_id form the cookies in the templates so they can
// be rendered in each ejs file
app.use((req, res, next) => {
  let userID = req.session.user_id;
  if (userID) {
    res.locals.user = users[userID];
  } else { res.locals.user = null; }
  next();
});
let urlDatabase = {
  "b2xVn2": { long: "http://www.lighthouselabs.ca", userID: "b2xVn2"},
  "9sm5xK": { long: "http://www.google.com", userID: "user2RandomID"}
};
function UrlsToUsers(urlDatabase) {
  for ( let key in urlDatabase) {
    if (req.session.user_id === urlDatabase[key].id) {
      return urlDatabase[key];
    } else { return false; }
  }
}
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    hashed_password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    hashed_password: "dishwasher-funk"
  },
  "b2xVn2": {
    id: "b2xVn2",
    email: "adel_ahmed90@icloud.com",
    hashed_password: "cats"
  }
};
// function to create random string
function generateRandomString() {
  let length = 6;
  let char = "0123456789abcdefghijklmnopqrstuvwxyz";
  let result = "";
  for ( let i = length; i > 0; i--){
    result += char[Math.floor(Math.random() * char.length)];
  }
  return result;
}
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
app.get("/", (req, res) => {
  res.render("urls_new");
});
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});
// create a function to return data from database associated with userid
function urlsForUser(id) {
  let obj = {};
  for (let key in urlDatabase) {
    if (id === urlDatabase[key].userID) {
      obj[key] = urlDatabase[key];
    }
  }
  return  obj;
}
// Add a new route to urls_index to print the shorten and full url and check if there is a user logged in
app.get("/urls", (req, res) => {
  let user_id = req.session.user_id;
  if (!user_id) {
    res.status(401).render("401_errors");
    return;
  }
  res.render("urls_index", { userUrls: urlsForUser(user_id)});
});
app.get("/urls/new", (req, res) => {
  if(req.session.user_id) {
    res.render("urls_new");
  } else { res.redirect("/login"); }
});
// Add a new route to urls_show to print each urls based on given id
app.get("/urls/:id", (req, res) => {
  let template = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id].long
  };
  res.render("urls_show", template);
});
// handle generating new short urls
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = { long: req.body.longURL, userID: req.session.user_id };
  res.redirect("/urls/" + shortURL);
  console.log("urlsdatabase", urlDatabase);
});
// redirect the user to the full url page
app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.originalUrl.substr(3);
  let longURL = urlDatabase[shortURL].long;
  res.redirect(longURL);
});
// handle delete request
app.post("/urls/:id/delete", (req, res) => {
  if ( req.session.user_id === urlDatabase[req.params.id].userID ) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls");
  } else { res.status(400).send("You can't delete other users urls"); }
});
// handle update requests
app.post("/urls/:id", (req, res) => {
  if ( req.session.user_id === urlDatabase[req.params.id].userID ) {
    urlDatabase[req.params.id].long = req.body.longURL;
    res.redirect("/urls/");
  } else { res.status(400).send("You can't update other users urls"); }
});
app.get("/login", (req, res) => {
  res.render("user_login");
});
// handle login submision and errors
app.post("/login", (req, res) => {
  let { email, password } = req.body;
  for (let key in users ) {
    if (email === users[key].email) {
      if (bcrypt.compareSync(password, users[key].hashed_password)){
        req.session.user_id = key;
        res.redirect("/urls");
        return;
      } else {
        res.status(403).send("Your password dosen't match");
        return;
      }
    }
  }
  res.status(403).send("Email is not registered");
});
// handle the logout and clear the cookies
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});
// hanlde requests for /register
app.get("/register", (req, res) => {
  res.render("user_register");
});
// handle registeration
app.post("/register", (req, res) => {
  let id = generateRandomString();
  let  email = req.body.email;
  let password = req.body.password;
  let hashed_password = bcrypt.hashSync(password, 10);
  if (email === "" || hashed_password === "") {
    res.status(400).send("Please enter email and password");
    return;
  } else if (email) {
    for (let key in users ){
      if (email === users[key].email) {
        res.status(400).send("Email is already registered ");
        return;
      }
    }
  }
  users[id] = { id, email, hashed_password };
  req.session.user_id = id;
  res.redirect("/urls");
  console.log("userdatabase", users);
});

