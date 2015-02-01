/* Copyright (c) 2013-2015 Richard Rodger, MIT License */
/* jshint node:true, asi:true, eqnull:true */
"use strict";


var _ = require('lodash')


function noware(req,res,next) {
  next()
}


function parseJSON(o) {
  return null == o ? {} : _.isString(o) ? JSON.parse(o) : o
}

var notfoundres = {httpstatus$:404}

var mark = '-'


module.exports = function( options ) {
  /* jshint validthis:true */
  var seneca = this
  var plugin = "jsonrest-api"

  options = seneca.util.deepextend({
    prefix:'/api/rest',
    aspect:false,
    list:{embed:false},
    allow_id:false,

    startware:noware,
    premap:noware,
    postmap:noware,
    endware:noware,

    meta:true,
    canonalias:{},
    pin:null
  },options)

  

  var validprops = {zone:1,base:1,name:1}

  var pins = options.pin

  pins = pins ? _.isArray(pins) ? pins : [pins] : []

  _.map(pins,function(pin){
    pin = _.isString(pin) ? seneca.util.parsecanon(pin) : pin
    _.each(pin,function(v,k){
      if( null == v || '' === v || '*' === v || !validprops[k]) {
        delete pin[k]
      }
      _.each(validprops, function(z,vp){
        if( null == pin[vp] ) {
          pin[vp] = mark
        }
      })

    })
  })
  if( 0 === pins.length ) {
    pins.push({})
  }


  function parse_ent(args) {
    var out = {
      name:  mark==args.name ? void 0 : args.name,
      base:  mark==args.base ? void 0 : args.base,
      zone:  mark==args.zone ? void 0 : args.zone,
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


  _.each(pins,function(pin){

    seneca.add(
      _.extend({},pin,{role:plugin,prefix:options.prefix,method:'get'}),
      action_get)

    seneca.add(
      _.extend({},pin,{role:plugin,prefix:options.prefix,method:'put'}),
      function(args,done){
        action_putpost(this,args,done)
      })

    seneca.add(
      _.extend({},pin,{role:plugin,prefix:options.prefix,method:'post'}),
      function(args,done){
        action_putpost(this,args,done)
      })

    seneca.add(
      _.extend({},pin,{role:plugin,prefix:options.prefix,method:'delete'}),
      action_delete)
  })





  function action_get(args,done){
    var ent_type = parse_ent(args)
 
    var qent = this.make(ent_type.zone,ent_type.base,ent_type.name)

    if( ent_type.entid ) {
      load_aspect(this,{args:args,qent:qent},done,function(ctxt,done){
        ctxt.qent.load$(ent_type.entid,function(err,ent){
          var data = ent ? ent.data$(options.meta,'string') : notfoundres
          done( err, data )
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
  }



  // lenient with PUT and POST - treat them as aliases, and both can create new entities
  function action_putpost(si,args,done) {
    var ent_type = parse_ent(args)

    var ent = si.make(ent_type.zone,ent_type.base,ent_type.name)

    var data = args.data || {}

    var good = _.filter(_.keys(data),function(k){return !~k.indexOf('$')})

    var fields = _.pick(data,good)
    ent.data$(fields)

    if( null != ent_type.entid ) {
      ent.id = ent_type.entid
    }
    else if( null != data.id$ && options.allow_id ) {
      ent.id$ = data.id$
    }

    save_aspect(si,{args:args,ent:ent},done,function(ctxt,done){
      ctxt.ent.save$(function(err,ent){
        var data = ent ? ent.data$(true,'string') : null
        done(err, data)
      })
    })
  }






  function action_delete(args,done){
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
  }


  
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
      args.zone = mark
      args.base = def(parts[0])
      args.name = def(parts[1])
    }
    else if( 1 == parts.length ) {
      args.zone = mark
      args.base = mark
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


  _.each(pins, function(pin){
    pin = _.extend({},pin,{role:plugin,prefix:options.prefix,method:'*'})
    
    seneca.act({role:'web',use:{
      prefix:options.prefix,
      pin:pin,
      //pin:{role:plugin,prefix:options.prefix,method:'*'},
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
  })


  return {
    name:plugin
  }
}



