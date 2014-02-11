/* Copyright (c) 2013-2014 Richard Rodger, MIT License */
"use strict";


var _ = require('underscore')


function noware(req,res,next) {
  next()
}


function parseJSON(o) {
  return null == o ? {} : _.isString(o) ? JSON.parse(o) : o
}

var notfoundres = {httpstatus$:404}


module.exports = function( options ) {
  var seneca = this
  var plugin = "jsonrest-api"


  options = seneca.util.deepextend({
    prefix:'/api/rest',
    aspect:false,
    list:{embed:false},

    startware:noware,
    premap:noware,
    postmap:noware,
    endware:noware,

    meta:true,
    canonalias:{}
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
          {role:plugin,prefix:options.prefix,aspect:kind, 
           advice:'before', ctxt:ctxt, default$:ctxt}, 
          function(err,ctxt) {
            if( err ) return done(err);

            func.call(si,ctxt,function(err,out){
              if( err ) return done(err);

              ctxt.out = out
              si.act(
                {role:plugin,prefix:options.prefix,aspect:kind, 
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



  this.add({role:plugin,prefix:options.prefix,method:'get'},function(args,done){
    var ent_type = parse_ent(args)
 
    var qent = this.make(ent_type.zone,ent_type.base,ent_type.name)

    if( ent_type.entid ) {
      load_aspect(this,{args:args,qent:qent},done,function(ctxt,done){
        ctxt.qent.load$(ent_type.entid,function(err,ent){
          var data = ent.data$(options.meta,'string')
          done(err, ent ? data : notfoundres )
        })
      })
    }
    else {
      var q = parseJSON(args.q)

      if( args.limit ) {
        q.limit$ = parseInt(args.limit,10)
      }

      if( args.skip ) {
        q.skip$ = parseInt(args.skip,10)
      }

      if( args.sort ) {
        q.sort$ = parseJSON( args.sort )
      }


      list_aspect(this,{args:args,q:q,qent:qent},done,function(ctxt,done){
        ctxt.qent.list$(ctxt.q,function(err,list){
          if( err ) return done(err);

          var out, data = _.map(list,function(ent){
            var data = ent.data$(options.meta,'string')
            return data
          })

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
        var data = ent ? ent.data$(true,'string') : null
        done(err, data)
      })
    })
  }


  this.add({role:plugin,prefix:options.prefix,method:'put'},function(args,done){
    putpost(this,args,done)
  })


  this.add({role:plugin,prefix:options.prefix,method:'post'},function(args,done){
    putpost(this,args,done)
  })


  this.add({role:plugin,prefix:options.prefix,method:'delete'},function(args,done){
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
    var kind  = options.canonalias[req.params.kind] || req.params.kind
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


    // query properties are verbatim
    // query meta data params use $ suffix

    if( req.query ) {
      args.q = seneca.util.clean( _.extend({},args.q$,req.query) )

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


  seneca.act({role:'web',use:{
    prefix:options.prefix,
    pin:{role:plugin,prefix:options.prefix,method:'*'},
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
  }})


  return {
    name:plugin
  }
}



