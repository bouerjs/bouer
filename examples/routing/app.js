var app = new Bouer('#app', {
  data: {
    version: '3.0.0',
  },
  config: {
    //usehash: false
  },
  components: [{
      route: '/home',
      path: '/components/home.html',
      title: 'Routing App * Home',
      isDefault: true,
    },
    {
      route: '/about',
      path: '/components/about.html',
      title: 'Routing App * About',
      children: [{
        route: '/me',
        path: '/components/about-me.html',
        title: 'Routing App * About Me',
      }]
    },
    {
      route: '/contact',
      path: '/components/contact.html',
      title: 'Routing App * Contact',
      keepAlive: true
    }
  ]
});