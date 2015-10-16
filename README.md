![Seneca](http://senecajs.org/files/assets/seneca-logo.png)
> A [Seneca.js][] plugin to expose your data as REST API

# seneca-jsonrest-api
[![Build Status][travis-badge]][travis-url]
[![Gitter][gitter-badge]][gitter-url]

[![js-standard-style][standard-badge]][standard-style]


- __Version:__ 0.3.1
- __Tested on:__ Seneca 0.7.1
- __Node:__ 0.10, 0.11, 0.12, 4

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

If you are new to Seneca in general, please take a look at [senecajs.org][]. We have everything from tutorials to sample apps to help get you up and running quickly.

If you're using this module, and need help, you can:

- Post a [github issue][],
- Tweet to [@senecajs][],
- Ask on the [Gitter][gitter-url].


## Install
 To install, simply use npm. Remember you will need to install[Seneca.js][] if you haven't already.

 ```sh
npm install seneca
npm install seneca-jsonrest-api
 ```

## Quick Example

   ```js
   require('seneca')()
     .use('jsonrest-api')
   ```

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


## Contributing
The [Senecajs org][] encourages open participation. If you feel you can help in any way, be it with
documentation, examples, extra testing, or new features please get in touch.

## License
Copyright Richard Rodger and other contributors 2015, Licensed under [MIT][].

[travis-badge]: https://travis-ci.org/rjrodger/seneca-jsonrest-api.png?branch=master
[travis-url]: https://travis-ci.org/rjrodger/seneca-jsonrest-api
[gitter-badge]: https://badges.gitter.im/Join%20Chat.svg
[gitter-url]: https://gitter.im/senecajs/seneca
[standard-badge]: https://raw.githubusercontent.com/feross/standard/master/badge.png
[standard-style]: https://github.com/feross/standard

[MIT]: ./LICENSE
[Senecajs org]: https://github.com/senecajs/
[senecajs.org]: http://senecajs.org/
[Seneca.js]: https://www.npmjs.com/package/seneca
[github issue]: https://github.com/maxired/seneca-jsonrest-api/issues
[@senecajs]: http://twitter.com/senecajs
