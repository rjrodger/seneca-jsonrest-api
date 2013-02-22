/* Copyright (c) 2013 Richard Rodger */
"use strict";


// mocha jsonrest-api.test.js



var assert  = require('assert')
var util    = require('util')


var _  = require('underscore')
var gex  = require('gex')


var seneca = require('seneca')()

seneca.use( 'engage' )
seneca.use( require('..') )


function squish(obj) { return util.inspect(obj).replace(/\s+/g,'') }


describe('jsonrest-api', function() {
  
  it('version', function() {
    assert.ok(gex(seneca.version),'0.5.*')
  }),


  
})
