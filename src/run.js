
  'use strict';

  var pathRX = new RegExp(/\/[^\/]+$/)
    , locationPath = location.pathname.replace(pathRX, '');

  var dojoConfig = {
    async: true,
    parseOnLoad: true,
    packages: [{
      name: 'react',
      location: 'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.0/',
      //location: locationPath + '/lib/react-0.14.0/build',
      main: 'react'
    }, {
      name: 'reactDom',
      location: 'https://cdnjs.cloudflare.com/ajax/libs/react/0.14.0/',
      //location: locationPath + '/lib/react-0.14.0/build',
      main: 'react-dom'
    }, {
      name: 'fixedDataTable',
      location: 'https://cdnjs.cloudflare.com/ajax/libs/fixed-data-table/0.4.7/',
      //location: locationPath + '/fixed-data-table/dist',
      main: 'fixed-data-table'
    }]
  };

