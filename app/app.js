'use strict';

require('babel/polyfill');
require('./client/lib/index');

import $      from 'jquery';
import React  from 'react/addons';
import Router from 'react-router';
import Home   from './client/components/home/home';
import Enhance   from './client/components/enhance/enhance';

$(document).ready(function() {
  const routes = (
    <Router.Route name='main_page' path='/' handler={Home}></Router.Route>
  );

  Router.run(routes, Router.HashLocation, function(Handler) {
    React.render(React.createFactory(Handler)(), document.getElementById('app'));
  });
});
