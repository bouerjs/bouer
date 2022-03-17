var app = new Bouer('#app', {
  components: [{
    name: 'input-field',
    path: '/components/input-field.html'
  }],
  data: {
    submit: function () {
      var form = document.querySelector('form');
      console.log(app.toJsObj(form));
      document.querySelector("#output").textContent = "Check the output in browser console"
    }
  }
});