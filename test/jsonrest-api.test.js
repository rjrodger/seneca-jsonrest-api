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
seneca.use( require('..'), {tag$:'aspects', aspects:true, prefix:'/aspects/rest'})


var jsonrestapi = seneca.pin({role:'jsonrest-api',prefix:'/api/rest',method:'*'})
var jsonrestapi_aspects = seneca.pin({role:'jsonrest-api',prefix:'/aspects/rest',method:'*'})


function squish(obj) { return util.inspect(obj).replace(/\s+/g,'') }


describe('jsonrest-api', function() {
  
  it('version', function() {
    assert.ok(gex(seneca.version),'0.5.*')
  })


  it('happy', function(){
    jsonrestapi.post({name:'foo',data$:{a:1}},function(err,saved){
      assert.ok(null==err)
      //console.dir(saved)
      assert.ok(saved.id)
      assert.equal(saved.a,1)
      assert.equal(saved.$.name,'foo')

      jsonrestapi.get({name:'foo',id:saved.id},function(err,loaded){
        //console.dir(loaded)
        assert.ok(null==err)
        assert.equal(loaded.id,saved.id)
        assert.equal(loaded.a,1)
        assert.equal(loaded.$.name,'foo')
      })
    })
  })


  it('load_aspect_defaults', function(){
    jsonrestapi_aspects.post({name:'zoo',data$:{a:1}},function(err,saved){
      assert.ok(null==err)

      jsonrestapi_aspects.get({name:'zoo',id:saved.id},function(err,loaded){
        console.dir(loaded)
        assert.ok(null==err)
        assert.equal(loaded.id,saved.id)
        assert.equal(loaded.a,1)
        assert.equal(loaded.$.name,'zoo')
      })
    })
  })
  
})
