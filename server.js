const express = require('express')
const app = express()
const server = require('http').createServer(app);
const WebSocket = require('ws');
const bodyparser = require('body-parser');
const session = require('express-session');
const {v4:uuidv4} = require('uuid');
const mongoose = require('mongoose');
const Remote = require('./models/remote');
const Device = require('./models/device');
const Admin = require('./models/admin');
const bcrypt = require('bcrypt');

mongoose.connect(`mongodb+srv://anmoiotadmin:anmoiotadmin@clusteriot.h9pwp.mongodb.net/iot?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true})
.then(() => {
    console.log('Database connection successful');
    server.listen(port, () => console.info(`listening on port ${port}`));
})
.catch(err => {
    console.error('Database connection error');
})

const wss = new WebSocket.Server({ server:server });
const port = process.env.PORT || 3000;

app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extened: true}));

app.use(session({
    secret: uuidv4(),
    resave: false,
    saveUninitialized: true
}));

app.use(express.static('public'));
app.use("/css" , express.static(__dirname + "public/css"));
app.use("/js" , express.static(__dirname + "public/js"));
app.use("/img" , express.static(__dirname + "public/img"));
app.set('views', "./views");
app.set('view engine', 'ejs');

app.get('/', (req, res) => { 
    res.render("login"); 
});

app.get('/admin', (req, res) => { 
    res.render("admin"); 
});

app.post('/admin', async (req, res) => {
    Admin.findOne({
        email: req.body.email
    })
    .then((result) => {
        if(result){
            var temp = bcrypt.compareSync(req.body.pass,result.password);
            if(temp){
                req.session.user = result.id;
                res.redirect("/dashboard");
            }else{
                res.render("admin", {flag: "Invalid Username/Password"});
            }
        }else{
            res.render("admin", {flag: "Invalid Username/Password"});
        }
    })
    .catch((err) => {
        console.log(err);
        res.render("/login", {flag: "Can Not Login Now"});
    })
});

app.get('/dashboard', (req, res) => {
    if(req.session.user){
        res.render("dashboard");
    }else{
        res.render("admin", {flag: "Session Ended"});
    }
});

app.get('/login', (req, res) => { 
    res.render("login"); 
});

app.post('/login', async (req, res) => {
    Remote.findOne({
        email: req.body.email
    })
    .then((result) => {
        if(result){
            var temp = bcrypt.compareSync(req.body.pass,result.password);
            if(temp){
                req.session.user = result.id;
                res.redirect("index");
            }else{
                res.render("login", {flag: "Invalid Username/Password"});
            }
        }else{
            res.render("login", {flag: "Invalid Username/Password"});
        }
    })
    .catch((err) => {
        console.log(err);
        res.render("login", {flag: "Can Not Login Now"});
    })
});

app.get('/index', (req, res) => {
    if(req.session.user){
        res.render("index", {id: req.session.user});
    }else{
        res.render("login", {flag: "Session Ended"});
    }
});

app.get('/signup', (req, res) => {
    res.render("signup");
});

app.post('/signup', (req, res) => {
    if(req.body.pass == req.body.conpass){
        const remote = new Remote({
            id: uuidv4(),
            name: req.body.username,
            usertype: "remote",
            email: req.body.email,
            password: req.body.pass,
            state: false
        });
        remote.save()
        .then((result) => {
            res.render("login", {flag: "Sign Up Successfull"});
        })
        .catch((err) => {
            console.log(err);
            res.render("login", {flag: "Sign Up Failed"});
        })
    }else{
        res.render("signup", {flag: "Password Not Matching"});
    }
});


app.get('/add-dev', (req, res) => {
    if(req.session.user){
        res.render("add-dev");
    }else{
        res.render("login", {flag: "Session Ended"});
    }
});

app.post('/add-dev', (req, res) => {
    Device.find({
        remoteid: req.session.user,
        name: req.body.name
    })
    .then((result) => {
        if(Object.keys(result).length === 0){
            const device = new Device({
                id: uuidv4(),
                name: req.body.name,
                usertype: "dev",
                remoteid: req.session.user,
                state: false
            });
            device.save()
            .then((result) => {
                res.redirect("index");
            })
            .catch((err) => {
                console.log("THis error: " + err);
                res.render("add-dev", {flag: "Can Not Add Device At The Moment"});
            })
        }else{
            res.render("add-dev", {flag: "Name Unavailable"});
        }
    })
    .catch((err) => {
        console.log(err);
        res.render("add-dev", {flag: "Try Again Later"});
    })
});

app.get('/api/devices', (req, res) => {
    if(req.session.user){
        Device.find({
            remoteid: req.session.user,
        })
        .then((result) => {
            res.json(result);
        })
        .catch((err) => {
            console.log(err);
            res.json({});
        })
    }
});

app.get('/api/remote', (req, res) => {
    if(req.session.user){
        res.send(req.session.user);
    }
});

app.get('/exit', (req, res) => {
    req.session.destroy(function(err){
        if(err){
            res.send("ERROR: " + err);
        }else{
            res.redirect("login");
        }
    })
});

app.get('/dev-list', (req, res) => {
    if(req.session.user){
        res.render("dev-list");
    }else{
        res.render("login", {flag: "Session Ended"});
    }
});

app.post('/edit-dev/:id', (req, res) => {
    Device.findOneAndUpdate({ id: req.params.id },
        {"$set": {name: req.body.newname}},
        {new: true} , function(err, result){
            if(!err){
                res.redirect("/dev-list");  // results is null ??
            }else{
                console.log("Error: " + e);
                res.render("/dev-list", {flag: "Unavailable"});
            }
    });
});

/**
 * when dev connect get its id
 * find record in database and retreive client details
 * if client is box then send event to realated remote
 */
wss.on('connection', function connection(socket, req) {
    socket.id = req.url.slice(1);
    console.log('connected: ' + socket.id);
    updatestate(socket, socket.id, true, true);

    socket.on('close', function (data) {
        console.log('disconnected: ' + socket.id);
        updatestate(socket, socket.id, false, false);
    });

    socket.on('message', function(data) { 
        var msg = JSON.parse(data);
        wss.clients.forEach(function each(client) {
            if (client !== socket && client.readyState === WebSocket.OPEN && client.id == msg.destinationID) {
                client.send(data);
            }
        });
    });
});

//===============================================================================================================


function updatestate(socket, sid, sstate, _dev){
    Device.findOneAndUpdate({ id: sid },
        {"$set": {state: sstate}},
        {new: true} , function(err, result){
            if(!err && result){;
                wss.clients.forEach(function each(client) {
                    if (client !== socket && client.readyState === WebSocket.OPEN && client.id == result.remoteid) {
                        if(_dev){
                            client.send(DataPackage("Online",client.id,sid));
                        }else{
                            client.send(DataPackage("Offline",client.id,sid));
                        }
                    }
                });
            }else{
                Remote.findOneAndUpdate({ id: sid },
                    {"$set": {state: sstate}},
                    {new: true} , function(err, result){
                        if(!err){
                            console.log("remote => " + result.email);
                        }else{
                            console.log("Error: dev not found, " + err);
                        }
                });
                console.log("Error: " + err);
            }
    });
}

function DataPackage(msg,desID,eventId) {
    var msg = {
        client: "server",
        type: msg,
        id:   eventId,
        destinationID: desID
    };
    return JSON.stringify(msg);
}


/**
 * 1. database containing all server users /
 * 2. when remote login render remote page /
 * 3. fetch list of connected boxes /
 * 3. send list of connected boxes to loged remote /
 * 4. when box login assgin dev ID to socket parameters /
 * 5. send msg accroding to ID parameter /
 * 
 * 6. put remote and related boxes in a session 
 **/



/**
 * TODO:
 * 1. Implement database (mongobd)/
 *  <- encrypt user data 
 * 2. Create admin user and control panel 
 * 3. Payment optimizaion (strip or basetree)
 *  - create product/sevice
 *  - create plans
 *  - create checkout page
 * 4. Create main pages (frontpage, contact us, about)
 * 5. make platform look dope and interactive ! 
 */ 