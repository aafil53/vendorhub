const express = require('express')
const cookieParser = require('cookie-parser')
const app = express()
const db = require("./db")
const e = require('express')
const port = 3003
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs')

app.get('/', (req, res) => {
  res.render('homepage.ejs')

})

app.get('/client', (req, res) => {
  res.render('client.ejs')

})
app.get('/vendor', (req, res) => {
  res.render('vendor.ejs')

})
app.get('/admin', (req, res) => {
  res.render('admin.ejs')
})

app.get('/signup', (req, res) => {
  res.render('signup.ejs')
})

app.post('/client', (req, res) => {
  const { email, password } = req.body
  if (!email || !password) {
    return res.status(400).send(`
      <h2>Error</h2>
      `)
  }
  try {
    const user = db.prepare(`
    SELECT * FROM users WHERE email=? AND password = ?
    `).get(email, password);
    if (!user) {
      return res.send('user not found')
    }
    res.send('login successfull')
  } catch (err) {
    console.log(err)
  }



})

app.post('/signup', (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    res.send('error')
  }
  /**
   
  const user = db.prepare(`
  SELECT * FROM users WHERE email=? AND password = ? AND role =?;
  `).get(email, password, role);
  if (user) {
    return res.send('user already exists')
  }

  */
  try {
    db.prepare(`
        INSERT INTO users (email,password,role) VALUES (?,?,?);
        `).run(email, password, role);
        res.send('login successfull')
  } catch (error) {
    if (error.code==='SQLITE_CONSTRAINT_UNIQUE') {
      return res.send('user already exists')
    }
    
  }
})

app.listen(port)

