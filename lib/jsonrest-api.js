/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _   = require('underscore')


module.exports = function cart( options, register ) {
  var name = "jsonrest-api"

  options = this.util.deepextend({
    prefix:'/api/rest',
    aspects:false
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


  function load_aspect(si,args,qent,done,loadfunc){
    if( options.aspects ) {
      si.act(
        {role:name,prefix:options.prefix,aspect:'load', 
         advice:'before', args:args, qent:qent, default$:qent}, 
        function(err,qent) {
          if( err ) return done(err);

          loadfunc.call(si,qent,function(err,ent){
            if( err ) return done(err);

            si.act(
              {role:name,prefix:options.prefix,aspect:'load', 
               advice:'after', args:args, ent:ent, default$:ent},
              done
            )
          })
        })
    }
    else return loadfunc.call(si,qent)
  }


  this.add({role:name,prefix:options.prefix,method:'get'},function(args,done){
    var ent_type = parse_ent(args)
 
    var qent = this.make(ent_type.zone,ent_type.base,ent_type.name)
    if( ent_type.entid ) {
      load_aspect(this,args,qent,done,function(qent,done){
        qent.load$(ent_type.entid,function(err,ent){
          done(err, ent ? ent.data$() : null )
        })
      })
    }
    else {
      var q = args.q || {}
      qent.list$(q,function(err,list){
        done(err,list)
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

    ent.save$(function(err,ent){
      var data = ent ? ent.data$() : null
      done(err, data )
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
      ent.remove$(ent_type.entid,function(err){
        return done(null,{id:ent_type.id})
      })
    }
    else return done(null,{id:ent_type.id})

  })



  var service = this.http({
    prefix:options.prefix,
    pin:{role:name,prefix:options.prefix,method:'*'},
    map:{
      get:{GET:true,alias:':name/:base?/:zone?/:id?'},
      put:{PUT:true,alias:':name/:base?/:zone?/:id?'},
      post:{POST:true,alias:':name/:base?/:zone?/:id?'},
      delete:{DELETE:true,alias:':name/:base?/:zone?/:id'}
    }
  })

  register(null,{
    name:name,
    service:service
  })
}
