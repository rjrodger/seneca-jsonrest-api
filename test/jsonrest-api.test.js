/* Copyright (c) 2013 Richard Rodger */
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
seneca.use( require('..'), {tag$:'access', aspect:'user-access-entity-type', prefix:'/access/rest'})


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


  it('allow', function(){
    assert.ok( jsonrest_api.__allow({name:'a'},{name:'a'}) )
    assert.ok( !jsonrest_api.__allow({name:'a'},{name:'x'}) )
    assert.ok( jsonrest_api.__allow({name:'a'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({base:'a'},{base:'a'}) )
    assert.ok( !jsonrest_api.__allow({base:'a'},{base:'x'}) )
    assert.ok( jsonrest_api.__allow({base:'a'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({zone:'a'},{zone:'a'}) )
    assert.ok( !jsonrest_api.__allow({zone:'a'},{zone:'x'}) )
    assert.ok( jsonrest_api.__allow({zone:'a'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({name:'a',base:'b'},{name:'a',base:'b'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b'},{name:'x',base:'b'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b'},{name:'a',base:'x'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b'},{name:'x',base:'x'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b'},{name:'a'}) ) // passes!
    assert.ok( jsonrest_api.__allow({name:'a',base:'b'},{base:'b'}) ) // passes!
    assert.ok( jsonrest_api.__allow({name:'a',base:'b'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({name:'a',zone:'b'},{name:'a',zone:'b'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',zone:'b'},{name:'x',zone:'b'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',zone:'b'},{name:'a',zone:'x'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',zone:'b'},{name:'x',zone:'x'}) )
    assert.ok( jsonrest_api.__allow({name:'a',zone:'b'},{name:'a'}) ) // passes!
    assert.ok( jsonrest_api.__allow({name:'a',zone:'b'},{zone:'b'}) ) // passes!
    assert.ok( jsonrest_api.__allow({name:'a',zone:'b'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({base:'a',zone:'b'},{base:'a',zone:'b'}) )
    assert.ok( !jsonrest_api.__allow({base:'a',zone:'b'},{base:'x',zone:'b'}) )
    assert.ok( !jsonrest_api.__allow({base:'a',zone:'b'},{base:'a',zone:'x'}) )
    assert.ok( !jsonrest_api.__allow({base:'a',zone:'b'},{base:'x',zone:'x'}) )
    assert.ok( jsonrest_api.__allow({base:'a',zone:'b'},{base:'a'}) ) // passes!
    assert.ok( jsonrest_api.__allow({base:'a',zone:'b'},{zone:'b'}) ) // passes!
    assert.ok( jsonrest_api.__allow({base:'a',zone:'b'},{}) ) // passes!

    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',base:'b',zone:'c'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'x',base:'b',zone:'c'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',base:'x',zone:'c'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',base:'b',zone:'x'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'x',base:'x',zone:'c'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',base:'x',zone:'x'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'x',base:'b',zone:'x'}) )
    assert.ok( !jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'x',base:'x',zone:'x'}) )

    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{base:'b',zone:'c'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',zone:'c'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a',base:'b'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{zone:'c'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{name:'a'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{base:'b'}) )
    assert.ok( jsonrest_api.__allow({name:'a',base:'b',zone:'c'},{}) )
  })


  function do_methods(pin,entname,vals) {
    return function() {
      pin.post({name:entname,data:{a:1}},function(err,saved){
        assert.ok(null==err)
        //console.dir(saved)
        assert.ok(saved.id)
        assert.equal(saved.a,1)
        assert.equal(saved.$.name,entname)
        if( vals ) { assert.equal(saved.b,vals[0]) }

        pin.get({name:entname,id:saved.id},function(err,loaded){
          //console.dir(loaded)
          assert.ok(null==err)
          assert.equal(loaded.id,saved.id)
          assert.equal(loaded.a,1)
          assert.equal(loaded.$.name,entname)
          if( vals ) { assert.equal(loaded.b,vals[1]) }

          pin.get({name:entname},function(err,list){
            //console.dir(list)
            assert.ok(null==err)
            assert.equal(1,list.length)
            assert.equal(list[0].a,1)
            assert.equal(list[0].$.name,entname)
            if( vals ) { assert.equal(list[0].b,vals[0]) }

            pin.delete({name:entname,id:saved.id},function(err,deleted){
              //console.dir(deleted)
              assert.ok(null==err)
              assert.equal(loaded.id,deleted.id)
              if( vals ) { assert.equal(deleted.b,vals[2]) }

              pin.get({name:entname},function(err,list){
                //console.dir(list)
                assert.ok(null==err)
                assert.equal(0,list.length)
              })
            })
          })
        })
      })
    }
  }

  it('happy', do_methods(jsonrestapi,'foo'))
  it('aspect_defaults', do_methods(jsonrestapi_aspects,'bar'))
  it('aspect_inject', do_methods(jsonrestapi_inject,'zoo',[2,3,4]))

  it('user-access',function(){
    var ents = {}
    function setent(e,o){ents[o.m]=o}

    var b1_n1 = seneca.make$('b1','n1')
    b1_n1.make$({m:1,a1:1}).save$(setent)
    b1_n1.make$({m:2,a1:2}).save$(setent)
    var b2_n1 = seneca.make$('b2','n1')
    b2_n1.make$({m:3,a2:1}).save$(setent)
    b2_n1.make$({m:4,a2:2}).save$(setent)

    var user = {access:{base:'b1'}}
    jsonrestapi_access.get({user:user,base:'b1',name:'n1',id:ents[1].id},function(err,loaded){
      assert.ok(null==err)
      assert.equal(ents[1].id,loaded.id)
    })

    jsonrestapi_access.get({user:user,base:'b2',name:'n1',id:ents[3].id},function(err,loaded){
      assert.ok(null==err)
      assert.equal(null,loaded)
    })

    jsonrestapi_access.get({base:'b2',name:'n1',id:ents[3].id},function(err,loaded){
      assert.ok(null==err)
      assert.equal(ents[3].id,loaded.id)
    })
  })
  
})
