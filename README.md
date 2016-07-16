# React and Koa boilerplate

[![build status](https://secure.travis-ci.org/hung-phan/koa-react-isomorphic.svg)](http://travis-ci.org/hung-phan/koa-react-isomorphic/)
[![Dependency Status](https://david-dm.org/hung-phan/koa-react-isomorphic.svg)](https://david-dm.org/hung-phan/koa-react-isomorphic)
[![devDependency Status](https://david-dm.org/hung-phan/koa-react-isomorphic/dev-status.svg)](https://david-dm.org/hung-phan/koa-react-isomorphic#info=devDependencies)

The idea of this repository is to try out all new concepts and libraries which work great for React.js.
Additionally, this will be the boilerplate for koa isomorphic (or universal) application.

So far, I manage to put together these following technologies:

* [Koa.js](https://github.com/koajs/koa)
* [Webpack](https://github.com/webpack/webpack)
* [Babel](https://babeljs.io/)
* [Flowtype](http://flowtype.org/)
* [Marko](http://markojs.com/)
* [Bootstrap](http://getbootstrap.com/css/) and [FontAwesome](https://fortawesome.github.io/Font-Awesome/)
* [Redux](https://github.com/rackt/redux)
* [PostCSS](https://github.com/postcss/postcss)
* [PurifyCSS](https://github.com/purifycss/purifycss)
* [CSSNext](http://cssnext.io/)
* [CSSNano](http://cssnano.co/)
* [Mocha](https://mochajs.org/), [Chai](http://chaijs.com/), [Sinon](http://sinonjs.org/), [Nock](https://github.com/pgte/nock) and [Istanbul](https://github.com/gotwarlost/istanbul)

## Explanation

What initially gets run is `build/server.js`, which is complied by Webpack to utilise the power of ES6 and ES7 in server-side code.
In `server.js`, I initialse all middlewares from `config/middleware/index`, then start server at `localhost:3000`. API calls
from client side eventually will request to `/api/*`, which are created by `app/server/apis`. Rendering tasks will be delegated to
[React-Router](https://github.com/rackt/react-router) to do server rendering for React.

## Requirement

Install [redux-devtools-extension](https://github.com/zalmoxisus/redux-devtools-extension) to have better experience when developing.

### Require assets in server

Leverage the power of [webpack-isomorphic-tools](https://github.com/halt-hammerzeit/webpack-isomorphic-tools) to hack `require` module with
the support of external webpack.

```javascript
    (context, request, callback) => {
      const regexp = new RegExp(`${assets}$`);

      return regexp.test(request)
        ? callback(null, `commonjs ${path.join(context.replace(ROOT, './../'), request)}`)
        : callback();
    },
```

### app/routes.js

Contains all components and routing.

### app/app.js

Binds root component to `<div id='app'></div>`, and prepopulate redux store with server-rendering data from `window.__data`

### app/server.js

Handles routing for server, and generates page which will be returned by react-router and marko. I make a facade `getUrl` for data fetching in both client and server.
Then performs server-side process.

### Marko template
[Custom taglibs](http://markojs.com/docs/marko/custom-taglibs/) are defined under `app/server/templates/helpers`. To see it usage, look
for `app/server/templates/layout/application.marko`. For example:

```html
    <prerender-data data=data.layoutData.prerenderData />
```

#### Partial template data
For now, the way to pass data to template is done via `layout-data=data`. This makes the current data
accesible at the `layouts/application.marko`.

### Node require in server
To be able to use the default node `require` instead of webpack dynamic `require`, use `global.nodeRequire`. This is defined
in `prod-server.js` to fix the problem that server wants to require somethings that are not bundled into current build. For example,

```javascript
const { ROOT, PUBLIC } = global.nodeRequire('./config/path-helper');
```

Note: `nodeRequire` will resolve the path from project root directory.

### Server-side data fetching

#### Redux

We ask react-router for route which matches the current request and then check to see if has a static `fetchData()` function.
If it does, we pass the redux dispatcher to it and collect the promises returned. Those promises will be resolved when each matching route has loaded its
necessary data from the API server. The current implementation is based on [redial](https://github.com/markdalgleish/redial).

```javascript
export default (callback) => (ComposedComponent) => {
  class FetchDataEnhancer extends ComposedComponent {
    render() {
      return (
        <ComposedComponent { ...this.props } />
      );
    }
  }

  return provideHooks({
    fetchData(...args) {
      return callback(...args);
    },
  })(FetchDataEnhancer);
};
```

and

```javascript
export function serverFetchData(renderProps, store) {
  return trigger('fetchData', map('component', renderProps.routes), getLocals(store, renderProps));
}

export function clientFetchData(routes, store) {
  browserHistory.listen(location => {
    match({ routes, location }, (error, redirectLocation, renderProps) => {
      if (error) {
        window.location.href = '/500.html';
      } else if (redirectLocation) {
        window.location.href = redirectLocation.pathname + redirectLocation.search;
      } else if (renderProps) {
        trigger('fetchData', renderProps.components, getLocals(store, renderProps));
      } else {
        window.location.href = '/404.html';
      }
    });
  });
}
```

Takes a look at `templates/todos`, we will have sth like `@fetchDataEnhancer(({ store }) => store.dispatch(fetchTodos()))` to let the server calls `fetchData()` function
on a component from the server.

#### Relay
We rely on [isomorphic-relay-router](https://github.com/denvned/isomorphic-relay-router) to do the server-rendering path.

```javascript
IsomorphicRouter.prepareData(renderProps)
  .then(({ data: prerenderData, props }) => {
    const prerenderComponent = renderToString(
      <IsomorphicRouter.RouterContext {...props} />
    );

    resolve(
      this.render(template, {
        ...parameters,
        prerenderComponent,
        prerenderData,
      })
    );
  });
```

## Render methods

this.render:

```javascript
this.render = this.render || function (template: string, parameters: Object = {}) {...}
```

Will receive a template and its additional parameters. See [settings.js](https://github.com/hung-phan/koa-react-isomorphic/blob/master/config%2Finitializers%2Fsettings.js) for more info.
It will pass this object to template.

this.prerender:

```javascript
this.prerender = this.prerender || function (template: string, parameters: Object = {}, initialState: Object = {}) {...}
```

Will receive additional parameter `initialState` which is the state of redux store (This will not apply for relay branch).

## Features

* Immutablejs: Available on [features/immutablejs](https://github.com/hung-phan/koa-react-isomorphic/tree/features/immutable-js)
* Relay: Available on [features/relay](https://github.com/hung-phan/koa-react-isomorphic/tree/features/relay)

## Idea to structure redux application
For now, the best way is to place all logic in the same place with components to make it less painful when scaling the application.
Current structure is the combination of ideas from [organizing-redux](http://jaysoo.ca/2016/02/28/organizing-redux-application/) and
[ducks-modular-redux](https://github.com/erikras/ducks-modular-redux). Briefly, we will have our reducer, action-types, and actions
in the same place with featured components.

![alt text](https://raw.githubusercontent.com/hung-phan/koa-react-isomorphic/master/redux-structure.png "redux structure")

Sample for logic-bundle:

```
import fetch from 'isomorphic-fetch';
import { createAction, handleActions } from 'redux-actions';
import getUrl from 'client/helpers/get-url';

export const ADD_TODO = 'todos/ADD_TODO';
export const REMOVE_TODO = 'todos/REMOVE_TODO';
export const COMPLETE_TODO = 'todos/COMPLETE_TODO';
export const SET_TODOS = 'todos/SET_TODOS';

export const addTodo = createAction(ADD_TODO);
export const removeTodo = createAction(REMOVE_TODO);
export const completeTodo = createAction(COMPLETE_TODO);
export const setTodos = createAction(SET_TODOS);

export const fetchTodos = () => dispatch =>
  fetch(getUrl('/api/v1/todos'))
    .then(res => res.json())
    .then(res => dispatch(setTodos(res)));

const initialState = [];

export default handleActions({
  [ADD_TODO]: (state, { payload: text }) => [
    ...state, { text, complete: false },
  ],
  [REMOVE_TODO]: (state, { payload: index }) => [
    ...state.slice(0, index),
    ...state.slice(index + 1),
  ],
  [COMPLETE_TODO]: (state, { payload: index }) => [
    ...state.slice(0, index),
    { ...state[index], complete: !state[index].complete },
    ...state.slice(index + 1),
  ],
  [SET_TODOS]: (state, { payload: todos }) => todos,
}, initialState);
```

## Hacky stub
You can use the global.nodeRequire in `app` to get back the original `require` of
node. It will be usefull in the case you want to require sth at runtime instead of
compile time

```javascript
const module = global.nodeRequire('path');
```

## Upcoming

* Rxjs
* Phusion Passenger server with Nginx

## Development

```bash
$ git clone git@github.com:hung-phan/koa-react-isomorphic.git
$ cd koa-react-isomorphic
$ npm install
```

### Hot reload

```bash
$ npm run watch
$ npm run dev
```

### With server rendering - encourage for testing only

```bash
$ SERVER_RENDERING=true npm run watch
$ npm run dev
```

## Test

```bash
$ npm test
$ npm run test:watch
$ npm run test:lint
$ npm run test:coverage
```

## Debug
```bash
$ npm run watch
$ npm run debug
```

If you use tool like Webstorm or any JetBrains product to debug, you need add another option to `scripts/debug` to prevent
using default browser to debug. Example: `node-debug -p 9999 -b -c prod-server.js`

## Enable flowtype in development
```bash
$ npm run flow:watch
$ npm run flow:stop # to terminate the server
```

You need to add annotation to the file to enable flowtype (`// @flow`)

## Production

### Normal run

```bash
$ npm run build
$ SECRET_KEY=your_env_key npm start
```

### With pm2

```bash
$ npm run build
$ SECRET_KEY=your_env_key npm run pm2:start
$ npm run pm2:stop # to terminate the server
```

### Deploy heroku
```bash
$ heroku create
$ git push heroku master
```
