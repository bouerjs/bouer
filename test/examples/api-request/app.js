var app = new Bouer('#app', {
  middleware: function (configure, app) {
    configure('req', function (onBind, onUpdate) {
      onBind(function (context) {

        // the type of the request: `of` or `as`
        var type = context.detail.requestType;

        // the path of the request: `users`
        var path = context.detail.requestPath;

        var baseURL = "https://jsonplaceholder.typicode.com/";

        // Requesting data from the server
        return fetch(baseURL + path, {
          headers: { 'Content-Type': "application/json" }
        }).then(function (response) {

          if (!response.ok)
            throw new Error(response.statusText);

          return response.json();
        }).then(function (json) {

          // the response must be always into a object with `data` property
          return { data: json };
        }).catch(function (error) {
          return error
        });
      });
    });
  },
  data: {
    start: 0,
    limit: 2,
    status: '',
    search: '',

    // Methods
    requested: function (evt) {
      this.data.status = 'Requesting to Server...';
    },
    responded: function (evt) {
      this.data.status = 'Server Responded...';
    },
    failed: function (evt) {
      this.data.status = 'Request Failed...';
    },
    done: function (evt) {
      var _this = this;
      setTimeout(function () {
        _this.data.status = 'Ok';
      }, 2000);
    },
  },
  config: {
    skeleton: {
      numberOfItems: 5
    }
  }
});