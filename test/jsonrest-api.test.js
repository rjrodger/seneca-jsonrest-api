/* Copyright (c) 2013-2014 Richard Rodger */
"use strict";


// mocha jsonrest-api.test.js



var assert  = require('assert')
var util    = require('util')


var _  = require('underscore')
var gex  = require('gex')


var jsonrest_api = require('..')


var seneca = require('seneca')()


seneca.use( require('..') )
seneca.use( require('..'), {tag$:'aspects', aspect:true, prefix:'/aspects/rest'})
seneca.use( require('..'), {tag$:'injects', aspect:true, prefix:'/inject/rest'})
seneca.use( require('..'), {tag$:'access', aspect:'user-access', prefix:'/access/rest'})


var jsonrestapi = seneca.pin({role:'jsonrest-api',prefix:'/api/rest',method:'*'})
var jsonrestapi_aspects = seneca.pin({role:'jsonrest-api',prefix:'/aspects/rest',method:'*'})
var jsonrestapi_inject = seneca.pin({role:'jsonrest-api',prefix:'/inject/rest',method:'*'})
var jsonrestapi_access = seneca.pin({role:'jsonrest-api',prefix:'/access/rest',method:'*'})


seneca.add({role:'jsonrest-api',prefix:'/inject/rest',aspect:'save',advice:'before'},function(args,done){
  args.ctxt.ent.b=2
  done(null,args.ctxt)
})

seneca.add({role:'jsonrest-api',prefix:'/inject/rest',aspect:'load',advice:'after'},function(args,done){
  args.ctxt.out.b=3
  done(null,args.ctxt.out)
})

seneca.add({role:'jsonrest-api',prefix:'/inject/rest',aspect:'list',advice:'before'},function(args,done){
  // still 2, as after advice did not change persistent version
  args.ctxt.q.b=2
  done(null,args.ctxt)
})

seneca.add({role:'jsonrest-api',prefix:'/inject/rest',aspect:'remove',advice:'after'},function(args,done){
  args.ctxt.out.b=4
  done(null,args.ctxt.out)
})



function squish(obj) { return util.inspect(obj).replace(/\s+/g,'') }


describe('jsonrest-api', function() {
  
  it('version', function() {
    assert.ok(gex(seneca.version),'0.5.*')
  })


  function do_methods(pin,entname,vals) {
    return function() {
      ;pin.post({name:entname,data:{a:1}},function(err,saved){
        assert.ok(null==err)
        assert.ok(saved.id)
        assert.equal(saved.a,1)
        assert.equal(seneca.util.parsecanon(saved.entity$).name,entname)
        if( vals ) { assert.equal(saved.b,vals[0]) }

      ;pin.get({name:entname,id:saved.id},function(err,loaded){
        //console.dir(loaded)
        assert.ok(null==err)
        assert.equal(loaded.id,saved.id)
        assert.equal(loaded.a,1)
        assert.equal(seneca.util.parsecanon(loaded.entity$).name,entname)
        if( vals ) { assert.equal(loaded.b,vals[1]) }

      ;pin.get({name:entname},function(err,list){
        //console.dir(list)
        assert.ok(null==err)
        assert.equal(1,list.length)
        assert.equal(list[0].a,1)
        assert.equal(seneca.util.parsecanon(list[0].entity$).name,entname)
        if( vals ) { assert.equal(list[0].b,vals[0]) }

      ;pin.delete({name:entname,id:saved.id},function(err,deleted){
        //console.dir(deleted)
        assert.ok(null==err)
        assert.equal(loaded.id,deleted.id)
        if( vals ) { assert.equal(deleted.b,vals[2]) }

      ;pin.get({name:entname},function(err,list){
        //console.dir(list)
        assert.ok(null==err)
        assert.equal(0,list.length)

      }) }) }) }) })
    }
  }


  it('happy', do_methods(jsonrestapi,'foo'))
  it('aspect_defaults', do_methods(jsonrestapi_aspects,'bar'))
  it('aspect_inject', do_methods(jsonrestapi_inject,'zoo',[2,3,4]))  
})
