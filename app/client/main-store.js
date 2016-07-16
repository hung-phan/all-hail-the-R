import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import reducers from './main-reducer';

let middlewares = [
  thunkMiddleware,
];
let enhancers = [];

if (process.env.NODE_ENV === 'development' && !process.env.SERVER_RENDERING) {
  const logger = require('redux-logger')({ level: 'info' });
  const { persistState } = require('redux-devtools');

  middlewares = [
    ...middlewares,
    logger,
  ];
  enhancers = [
    ...enhancers,
    require('./components/main/debug').default.instrument(),
    persistState(window.location.href.match(/[?&]debug_session=([^&]+)\b/)),
    window.devToolsExtension ? window.devToolsExtension() : f => f,
  ];
}

export default function (initialState = {}) {
  const store = createStore(reducers, initialState, compose(
    applyMiddleware(...middlewares),
    ...enhancers
  ));

  if (module.hot) {
    module.hot.accept('./main-reducer', () =>
      store.replaceReducer(require('./main-reducer').default)
    );
  }

  return store;
}
