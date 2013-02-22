/* Copyright (c) 2013 Richard Rodger */
"use strict";


// node basic.app.js 


var connect = require('connect')

var seneca = require('seneca')()

seneca.use( 'engage' )
seneca.use( require('..') )



var app = connect()

app.use( connect.static('./public') )
app.use( connect.bodyParser() )
app.use( connect.cookieParser() )
app.use( connect.json() )
app.use( seneca.service() )

app.listen(3000)


var foo_ent = seneca.make('foo')
foo_ent.make$({tag:'a'}).save$()
foo_ent.make$({tag:'b'}).save$()

