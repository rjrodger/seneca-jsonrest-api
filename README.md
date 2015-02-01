# seneca-jsonrest-api - a [Seneca](http://senecajs.org) plugin

## Seneca HTTP JSON REST API Plugin

Exposes your data entities as a [REST
API](http://en.wikipedia.org/wiki/Representational_state_transfer). For
example, if you have a data entity called _foo_, then the following
end points will become available:

   * GET _/api/rest/foo_: return a list of all foo entities
   * GET _/api/rest/foo/:id_: return a single foo entity by identifier
   * POST _/api/rest/foo_: create a new foo entity
   * PUT _/api/rest/foo/:id_: update a foo entity

You can use the plugin options to change the URL prefix, and to add
additional behaviours.

Note that it is not necessary for the underlying entity to be
persistent. You can define a virtual entity _foo_ by providing actions for
the patterns:

   * _role:entity,name:foo,cmd:save_
   * _role:entity,name:foo,cmd:load_
   * _role:entity,name:foo,cmd:list_
   * _role:entity,name:foo,cmd:remove_


## Options

You can _seneca.use_ this plugin multiple times to create multiple
independent API end points, so long as you specify different
prefixes. The _prefix_ option is used to create separate action
patterns so that they do not conflict.

   * _prefix_: a custom prefix
   * _pins_: an array of entity pins, with properties _name,base,zone_. These define the data entities that will be exposed.

## Examples

   * [tests](https://github.com/rjrodger/seneca-jsonrest-api/tree/master/test) in this repository
   * [seneca-examples/api-server](https://github.com/rjrodger/seneca-examples/tree/master/api-server)
   * [seneca-data-editor](https://github.com/rjrodger/seneca-data-editor)


## Support

Current Version: 0.3.1

Tested on: Node 0.10.36, [Seneca](//github.com/rjrodger/seneca) 0.6.1

[![Build Status](https://travis-ci.org/rjrodger/seneca-jsonrest-api.png?branch=master)](https://travis-ci.org/rjrodger/seneca-jsonrest-api)

[Annotated Source Code](http://rjrodger.github.io/seneca-jsonrest-api/doc/jsonrest-api.html).

If you're using this module, feel free to contact me on Twitter if you
have any questions! :) [@rjrodger](http://twitter.com/rjrodger)

[![Gitter chat](https://badges.gitter.im/rjrodger/seneca-jsonrest-api.png)](https://gitter.im/rjrodger/seneca-jsonrest-api)


## Install

To install and add to the dependencies list in the package.json file
for your project:

```sh
npm install seneca-jsonrest-api --save
```

And in your code:

```js
var seneca = require('seneca')()
    .use( 'jsonrest-api' )
```






