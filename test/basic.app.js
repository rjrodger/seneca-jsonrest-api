/* Copyright (c) 2013-2014 Richard Rodger */
"use strict";


// node basic.app.js 
// must be run inside test folder so static works

var connect = require('connect')

var seneca = require('seneca')()

seneca.use( require('..') )



var app = connect()

app.use( connect.static('./public') )
app.use( connect.bodyParser() )
app.use( connect.cookieParser() )
app.use( connect.json() )
app.use( seneca.export('web') )

app.listen(3000)


var foo_ent = seneca.make('foo')
foo_ent.make$({tag:'a'}).save$()
foo_ent.make$({tag:'b'}).save$()

