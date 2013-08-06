/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _   = require('underscore')


function noware(req,res,next) {
  next()
}

// FIX: update to latest plugin format
module.exports = function( options, register ) {
  var seneca = this
  var name = "jsonrest-api"


  options = this.util.deepextend({
    prefix:'/api/rest',
    aspect:false,
    list:{embed:false},

    startware:noware,
    premap:noware,
    postmap:noware,
    endware:noware,

  },options)

  

  function parse_ent(args) {
    var out = {
      name:  args.name,
      base:  args.base,
      zone:  args.zone,
      entid: args.id
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
      var q = {}
      if(args.q) {
        if(typeof(args.q)==='string'){
          q = JSON.parse(args.q);
        } else {
          q = args.q;
        }
      } 

      if( args.limit ) {
        q.limit$ = parseInt(args.limit)
      }

      if( args.skip ) {
        q.skip$ = parseInt(args.skip)
      }

      if( args.sort ) {
        if(typeof(args.sort)==='string'){
          q.sort$ = JSON.parse(args.sort);
        } else {
          q.sort$ = args.sort;
        }
      }


      list_aspect(this,{args:args,q:q,qent:qent},done,function(ctxt,done){
        ctxt.qent.list$(ctxt.q,function(err,list){
          if( err ) return done(err);

          var out, data = _.map(list,function(ent){return ent.data$()})

          if( _.isString(options.list.embed) ) {
            out = {}
            out[options.list.embed] = data
          }
          else out = data;

          done(err,out)
        })
      })
    }
  })



  // lenient with PUT and POST - treat them as aliases, and both can create new entities
  function putpost(si,args,done) {
    var ent_type = parse_ent(args)

    var ent = si.make(ent_type.zone,ent_type.base,ent_type.name)

    var data = args.data || {}

    var good = _.filter(_.keys(data),function(k){return !~k.indexOf('$')})

    var fields = _.pick(data,good)
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


  
  function resolve(req,res,args,act,respond) {
    var kind = req.params.kind
    var parts = kind.split('_')
    
    function def(p) { return _.isString(p) ? (0 < p.length ? p : void 0) : void 0 }

    if( 3 == parts.length ) {
      args.zone = def(parts[0])
      args.base = def(parts[1])
      args.name = def(parts[2])
    }
    else if( 2 == parts.length ) {
      args.base = def(parts[0])
      args.name = def(parts[1])
    }
    else if( 1 == parts.length ) {
      args.name = def(parts[0])
    }

    
    if( req.query ) {
      args.q = _.extend({},args.q,req.query)
      args.q = seneca.util.clean(args.q)

      if( req.query.q$ ) {
        args.q = _.extend(JSON.parse(req.query.q$),args.q)
      }

      if( req.query.skip$ ) {
        args.skip = parseInt(req.query.skip$)
      }

      if( req.query.limit$ ) {
        args.limit = parseInt(req.query.limit$)
      }

      if( req.query.sort$ ) {
        args.sort = req.query.sort$
      }
    }
    

    act(args,respond)
  }


  var service = this.http({
    prefix:options.prefix,
    pin:{role:name,prefix:options.prefix,method:'*'},
    startware:options.startware,
    premap:options.premap,
    map:{
      get:{GET:resolve,alias:':kind/:id?'},
      put:{PUT:resolve,alias:':kind/:id?',data:true},
      post:{POST:resolve,alias:':kind/:id?',data:true},
      delete:{DELETE:resolve,alias:':kind/:id'}
    },
    postmap:options.postmap,
    endware:options.endware,
  })


  register(null,{
    name:name,
    service:service
  })
}


// for testing
//cart.__allow = allow

