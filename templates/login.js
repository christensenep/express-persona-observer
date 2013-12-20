navigator.id.watch({
  loggedInUser: {{!loggedInUser}},
  onlogin: function(assertion) {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "{{verifyPath}}", true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.addEventListener("loadend", function(e) {
      var data = JSON.parse(this.responseText);
      if (data && data.status === "okay") {
        document.location.reload(true);
      }
    }, false);

    xhr.send(JSON.stringify({
      assertion: assertion
    }));
  },
  onlogout: function() {
    var xhr = new XMLHttpRequest();
    xhr.open("POST", "{{logoutPath}}", true);
    xhr.addEventListener("loadend", function(e) {
      document.location.reload(true);
    });
    xhr.send();
  }
});

document.addEventListener("DOMContentLoaded", function() {
  var login = document.querySelector("{{loginSelector}}");
  if (login)
    login.addEventListener("click", function() {
      navigator.id.request();
    }, false);

  var logout = document.querySelector("{{logoutSelector}}")
  if (logout)
    logout.addEventListener("click", function() {
      navigator.id.logout();
    }, false);
});
