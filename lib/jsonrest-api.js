/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _   = require('underscore')


module.exports = function cart( options, register ) {
  var name = "jsonrest-api"


  this.add({role:name,method:'get'},function(args,done){
    var name = args.name
    var base = args.base
    var zone = args.zone
    var entid = args.id || zone || base

    //console.dir(args)
 
    var ent = this.make(zone,base,name)
    if( entid ) {
      ent.load$(entid,function(err,ent){
        done(err, ent ? ent.data$() : null )
      })
    }
    else {
      var q = args.q || {}
      ent.list$(q,function(err,list){
        done(err,list)
      })
    }
  })


  // lenient with PUT and POST - treat them as aliases, and both can create new entities
  function putpost(si,args,done) {
    var name = args.name
    var base = args.base
    var zone = args.zone
    var entid = args.id || zone || base
 
    var ent = si.make(zone,base,name)

    var data = args.data$ || {}

    var good = _.filter(_.keys(data),function(k){return !~k.indexOf('$')})
    //console.log(good)

    var fields = _.pick(data,good)
    //console.dir(fields)
    ent.data$(fields)

    if( entid ) {
      ent.id = entid
    }

    ent.save$(function(err,ent){
      var data = ent ? ent.data$() : null
      done(err, data )
    })
  }

  this.add({role:name,method:'put'},function(args,done){
    putpost(this,args,done)
  })

  this.add({role:name,method:'post'},function(args,done){
    putpost(this,args,done)
  })

  this.add({role:name,method:'delete'},function(args,done){
    done(null,args)
  })



  var service = this.http({
    prefix:'/api/rest',
    pin:{role:name,method:'*'},
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
