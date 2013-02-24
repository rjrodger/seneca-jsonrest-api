/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _   = require('underscore')


module.exports = function cart( options, register ) {
  var name = "jsonrest-api"

  options = this.util.deepextend({
    prefix:'/api/rest',
    aspect:false
  },options)

  

  function parse_ent(args) {
    var out = {
      name:  args.name,
      base:  args.base,
      zone:  args.zone,
      entid: args.id
    }

    if( void 0 == out.entid ) {
      out.entid = out.zone
      delete out.zone
    }

    if( void 0 == out.entid ) {
      out.entid = out.base
      delete out.base
    }

    return out
  }


  function make_aspect(kind){
    return function (si,ctxt,done,func){
      if( options.aspect ) {
        si.act(
          {role:name,prefix:options.prefix,aspect:kind, 
           advice:'before', ctxt:ctxt, default$:ctxt}, 
          function(err,ctxt) {
            if( err ) return done(err);

            func.call(si,ctxt,function(err,out){
              if( err ) return done(err);

              ctxt.out = out
              si.act(
                {role:name,prefix:options.prefix,aspect:kind, 
                 advice:'after', ctxt:ctxt, default$:out},
                done
              )
            })
          })
      }
      else return func.call(si,ctxt,done)
    }
  }

  var load_aspect = make_aspect('load')
  var list_aspect = make_aspect('list')
  var save_aspect = make_aspect('save')
  var remove_aspect = make_aspect('remove')



  this.add({role:name,prefix:options.prefix,method:'get'},function(args,done){
    var ent_type = parse_ent(args)
 
    var qent = this.make(ent_type.zone,ent_type.base,ent_type.name)
    if( ent_type.entid ) {
      load_aspect(this,{args:args,qent:qent},done,function(ctxt,done){
        ctxt.qent.load$(ent_type.entid,function(err,ent){
          done(err, ent ? ent.data$() : null )
        })
      })
    }
    else {
      var q = args.q || {}
      list_aspect(this,{args:args,q:q,qent:qent},done,function(ctxt,done){
        ctxt.qent.list$(ctxt.q,function(err,list){
          list = _.map(list,function(ent){return ent.data$()})
          done(err,list)
        })
      })
    }
  })



  // lenient with PUT and POST - treat them as aliases, and both can create new entities
  function putpost(si,args,done) {
    var ent_type = parse_ent(args)

    var ent = si.make(ent_type.zone,ent_type.base,ent_type.name)

    var data = args.data$ || {}

    var good = _.filter(_.keys(data),function(k){return !~k.indexOf('$')})
    //console.log(good)

    var fields = _.pick(data,good)
    //console.dir(fields)
    ent.data$(fields)

    if( ent_type.entid ) {
      ent.id = ent_type.entid
    }

    save_aspect(si,{args:args,ent:ent},done,function(ctxt,done){
      ctxt.ent.save$(function(err,ent){
        var data = ent ? ent.data$() : null
        done(err, data)
      })
    })
  }


  this.add({role:name,prefix:options.prefix,method:'put'},function(args,done){
    putpost(this,args,done)
  })


  this.add({role:name,prefix:options.prefix,method:'post'},function(args,done){
    putpost(this,args,done)
  })


  this.add({role:name,prefix:options.prefix,method:'delete'},function(args,done){
    var ent_type = parse_ent(args)

    if( ent_type.entid ) {
      var ent = this.make(ent_type.zone,ent_type.base,ent_type.name)

      remove_aspect(this,{args:args,ent:ent},done,function(ctxt,done){
        ctxt.ent.remove$(ent_type.entid,function(err){
          return done(null,{id:ent_type.entid})
        })
      })
    }
    else return done(null,{id:null})
  })



  var service = this.http({
    prefix:options.prefix,
    pin:{role:name,prefix:options.prefix,method:'*'},
    map:{
      get:{GET:true,alias:':zone?/:base?/:name/:id?'},
      put:{PUT:true,alias:':zone?/:base?/:name/:id?'},
      post:{POST:true,alias:':zone?/:base?/:name/:id?'},
      delete:{DELETE:true,alias:':zone?/:base?/:name/:id'}
    }
  })



  function resolve_user(args) {
    return args.user || (args.req$ && args.req$.seneca && args.req$.seneca.user ) || null
  }

  if( 'user-access-entity-type' == options.aspect ) {

    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'load',advice:'before'},function(args,done){
      var user = resolve_user(args.ctxt.args)
      var qent = args.ctxt.qent
      console.dir(user)
      console.log('aa '+qent)
      if( user && user.access && qent ) {
        var canon = qent.canon$({object:true})
        canon.name = user.access.name || canon.name
        canon.base = user.access.base || canon.base
        canon.zone = user.access.zone || canon.zone
        args.ctxt.qent = qent.make$(canon.zone,canon.base,canon.name)
        console.log('bb '+args.ctxt.qent)      
      }
      done(null,args.ctxt)
    })

    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'save',advice:'before'},function(args,done){
      done(null,args.ctxt)
    })

    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'list',advice:'before'},function(args,done){
      done(null,args.ctxt)
    })

    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'remove',advice:'before'},function(args,done){
      done(null,args.ctxt)
    })
  }


  register(null,{
    name:name,
    service:service
  })
}
