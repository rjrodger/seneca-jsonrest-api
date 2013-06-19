/* Copyright (c) 2013 Richard Rodger, MIT License */
"use strict";


var _   = require('underscore')


//function allow(canon,access) {
//  var ok = true 
//  ok = ok && void 0 != access.name ? canon.name == access.name : ok
//  ok = ok && void 0 != access.base ? canon.base == access.base : ok
//  ok = ok && void 0 != access.zone ? canon.zone == access.zone : ok

/*
  if( ok && access.list ) {
    var found = false
    _.each(list,function(entry){
      var ok = true
      ok = ok && void 0 != entry.name ? canon.name == entry.name : ok
      ok = ok && void 0 != entry.base ? canon.base == entry.base : ok
      ok = ok && void 0 != entry.zone ? canon.zone == entry.zone : ok
      found = found || ok
    })
    ok = found
  }
*/

//  return ok
//}


module.exports = function( options, register ) {
  var name = "jsonrest-api"

  options = this.util.deepextend({
    prefix:'/api/rest',
    aspect:false,
    list:{embed:false}
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

      if( args.sort ) {
        if(typeof(args.sort)==='string'){
          q.sort$ = JSON.parse(args.sort);
        } else {
          q.sort$ = args.sort;
        }
      }

      list_aspect(this,{args:args,q:q,qent:qent},done,function(ctxt,done){
        ctxt.qent.list$(ctxt.q,function(err,list){
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
    //console.log(good)

    var fields = _.pick(data,good)
    //console.dir(fields)
    ent.data$(fields)

    if( ent_type.entid ) {
      ent.id = ent_type.entid
    }

    //console.dir(ent)

    save_aspect(si,{args:args,ent:ent},done,function(ctxt,done){
      //console.dir(ctxt.ent)
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


  function resolvekind(req,res,args,act,respond) {
    var kind = req.params.kind
    var parts = kind.split('_')
    args.zone = 3 == parts.length ? parts[0] : void 0 
    args.base = 2 <= parts.length ? parts[1] : void 0 
    args.name = 1 <= parts.length ? parts[2] : void 0 
    act(args,respond)
  }


  var service = this.http({
    prefix:options.prefix,
    pin:{role:name,prefix:options.prefix,method:'*'},
    map:{
      get:{GET:resolvekind,alias:':kind/:id?'},
      put:{PUT:resolvekind,alias:':kind/:id?',data:true},
      post:{POST:resolvekind,alias:':kind/:id?',data:true},
      delete:{DELETE:resolvekind,alias:':kind/:id'}
    }
  })


/*
  // FIX: should not be needed
  function resolve_user(args) {
    return args.user || (args.req$ && args.req$.seneca && args.req$.seneca.user ) || null
  }


  // FIX: is this needed at all - seneca-perm does the work
  function make_user_access(entprop) {
    return function(args,done){
      var seneca = this

      var user = resolve_user(args.ctxt.args)
      var ent = args.ctxt[entprop]

      if( user && ent ) {
        if( user.access ) {
          var canon = ent.canon$({object:true})

          var ok = allow(canon,user.access)

          if( ok ) {
            done(null,args.ctxt)
          }
          else return seneca.fail({code:'permission_denied',entity:canon,id:ent.id,case:'no-match',user:{nick:user.nick,id:user.id,access:user.access}},done);
        }
        else if(user.admin) {
          done(null,args.ctxt)
        }
        else return seneca.fail({code:'permission_denied',entity:canon,id:ent.id,case:'no-access',user:{nick:user.nick,id:user.id}},done);
      }
      else return seneca.fail({code:'permission_denied',entity:canon,id:ent.id,case:'no-user'},done);
    }
  }

  if( 'user-access' == options.aspect ) {
    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'load',advice:'before'},make_user_access('qent'))
    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'save',advice:'before'},make_user_access('ent'))
    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'list',advice:'before'},make_user_access('qent'))
    this.add({role:'jsonrest-api',prefix:options.prefix,aspect:'remove',advice:'before'},make_user_access('ent'))
  }
*/

  register(null,{
    name:name,
    service:service
  })
}


// for testing
//cart.__allow = allow

