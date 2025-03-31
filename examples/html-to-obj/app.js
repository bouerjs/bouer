var app = new Bouer('#app', {
  components: [{
    name: 'input-field',
    path: '/components/input-field.html'
  }],
  data: {
    submit: function () {
      for ( item of this.$components.viewByName('input-field'))
        if (!item.data.value)
          item.data.isValid = false

      return;
      var form = document.querySelector('form');
      console.log(app.toJsObj(form));
      document.querySelector("#output").textContent = "Check the output in browser console"
    }
  }
});