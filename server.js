'use strict';
const log = console.log;

const express = require('express')
const port = process.env.PORT || 3000
const bodyParser = require('body-parser') // middleware for parsing HTTP body from client
const { ObjectID } = require('mongodb')
const session = require('express-session')
const cookieParser = require('cookie-parser');
const path = require('path')
const { User } = require('./libraries/models/user')
const multer = require("multer");
//const mongoose = require('mongoose')

const { mongoose } = require('./libraries/db/mondb');
mongoose.set('useFindAndModify', false);

// const mongoose = require('./libraries/db/mongoose');

// Import auth
// const { chatRouter } = require('./libraries/auth/chatRouter');
const login = require('./libraries/auth/login');
const indexrouter = require('./libraries/routes/indexRouter');


//mongoose.connect(databaselink, { useNewUrlParser: true });


// express
const app = express();

// body-parser middleware setup.  Will parse the JSON and convert to object
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// static files
app.use('/libraries', express.static(__dirname + "/libraries"))
app.use('/view', express.static(__dirname + "/view"))
app.use('/modules', express.static(__dirname + '/node_modules'))
app.use('/api', indexrouter);
// Express-session
app.use(cookieParser())
app.use(express.static(path.join(__dirname, './View')));
app.use(session({
    secret: 'secretcode',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000,
        httpOnly: true
    }
}))

const sessionChecker = (req, res, next) => {
    if (req.session.user) {
        res.redirect('/home')
    } else {
        next()
    }
}

// Routers 
const userRouter = require('./libraries/routes/userRouter');
const postRouter = require('./libraries/routes/postRouter');
const projectRouter = require('./libraries/routes/projectRouter');
const indexRouter = require('./libraries/routes/indexRouter');
app.use('/', userRouter);
app.use('/', postRouter);
app.use('/', projectRouter)
app.use('/', indexRouter)

app.post('/user/login', (req, res) => {
    const email = req.body.email
    const password = req.body.password
    User.authenticate(email, password).then((user) => {
        if (!user) {
            res.status(400).send("invalid user")
        } else {
            req.session.user = user._id
            res.redirect('/admin')
        }
    }).catch((error) => {
        res.status(400).send("invalid user")
    })
});

app.get('/logout', (req, res) => {
    req.session.destroy((error) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.redirect('/loginPage')
        }
    })
})

//Upload img to cloud
// TODO : error with parser.single
//app.post('/uploadImg', parser.single("photo"), (req, res) => {
//    res.send(JSON.stringify(req.file.url))
//});

// GET user by id
app.get('/user/:id', (req, res) => {
    const id = req.params.id
    if (!ObjectID.isValid(id)) {
        return res.status(404).send()
    }
    User.findById(id).then((user) => {
        if (!user) {
            res.status(404).send()
        } else {
            res.send(user)
        }
    }).catch((error) => {
        res.status(400).send(error)
    })
})


// Chat Routes
const chatRoutes = require('./libraries/auth/chatRoutes');
chatRoutes(app);
log("chatRoutes")

// Landing Page
app.get('/', (req, res) => {
    res.sendfile("./view/Home/mainView.html")
})
app.get('/home', (req, res) => {
    res.sendfile("./view/Home/mainView.html")
})
app.get('/discussion', (req, res) => {
    res.sendfile("./view/Home/mainView.html");
})

app.get('/createP', (req, res) => {
    res.sendfile('./view/PostProject/createP.html');
})
app.get('/post', (req, res) => {
    res.sendfile('./view/PostProject/post.html');
})
app.get('/login', (req, res) => {
    res.sendfile('./view/LoginSignUp/login.html');
})
app.get('/signup', (req, res) => {
    res.sendfile('./view/LoginSignUp/signup.html');
})

const ioServer = app.listen(port, () => {
    log(`Listening on port ${port}...`)
});

// socket.io for chat
const io = require('socket.io').listen(ioServer);
// Set up socket.io
io.on('connection', () => {
    console.log('A user is connected.');
})