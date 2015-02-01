/* Copyright (c) 2013-2015 Richard Rodger */
"use strict";


// node basic.app.js 
// must be run inside test folder so static works

var connect     = require('connect')
var serveStatic = require('serve-static')
var bodyParser  = require('body-parser')

var seneca = require('seneca')()
seneca.use( require('..') )



var app = connect()

app.use( serveStatic('./public') )
app.use( bodyParser.json() )
app.use( seneca.export('web') )

app.listen(3000)


var foo_ent = seneca.make('foo')
foo_ent.make$({id$:'a',tag:'A'}).save$()
foo_ent.make$({id$:'b',tag:'B'}).save$()


