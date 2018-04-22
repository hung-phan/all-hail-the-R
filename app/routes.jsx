/* @flow */
import React from "react";
import { syncHistoryWithStore } from "react-router-redux";
import {
  browserHistory,
  createMemoryHistory,
  Route,
  Router
} from "react-router";
import injectReducers from "./share/helpers/injectReducers";

export const getClientHistory = (store: Object): Object =>
  syncHistoryWithStore(browserHistory, store);

export const getServerHistory = (store: Object, url: string): Object =>
  syncHistoryWithStore(createMemoryHistory(url), store);

export const getRoutes = (
  history: Object,
  store: Object,
  options: Object = {}
): Object => (
  <Router history={history} {...options}>
    <Route
      path="/"
      getComponent={async (nextState, cb) => {
        const [
          { default: TodosComponent },
          { mountPoint: todosMountPoint, default: todosReducer }
        ] = await Promise.all([
          import(/* webpackChunkName: "todos-page" */ "./share/components/todos"),
          import(/* webpackChunkName: "todos-page" */ "./share/components/todos/logicBundle")
        ]);

        injectReducers(store, { [todosMountPoint]: todosReducer });
        cb(null, TodosComponent);
      }}
    />
    <Route
      path="/static-page"
      getComponent={async (nextState, cb) => {
        const {
          default: StaticPageComponent
        } = await import(/* webpackChunkName: "static-page" */ "./share/components/static-page");

        cb(null, StaticPageComponent);
      }}
    />
  </Router>
);
