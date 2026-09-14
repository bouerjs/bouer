var app = new Bouer('#app', {
  data: {
    version: '3.0.0',
    tab: '',
    tabs: [{
        tab: 'component-a',
        text: 'Comp. A'
      },
      {
        tab: 'component-b',
        text: 'Comp. B'
      },
      {
        tab: '',
        text: 'Clear'
      }
    ]
  },
  components: [{
      name: 'component-a',
      path: '/components/component-a.html',
    },
    {
      name: 'component-b',
      path: '/components/component-b.html'
    }
  ]
});