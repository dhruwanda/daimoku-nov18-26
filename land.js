var DISTRICTS = {
  "HUDA": ["Sector 19", "Sector 28", "Sector 29"],
  "Kanishka": ["Gulmohar"]
};

var $ = function (id) { return document.getElementById(id); };

function updateButton() {
  $("proceed").disabled = !($("chapter").value && $("district").value);
}

$("chapter").addEventListener("change", function () {
  var ch = this.value;
  var dsel = $("district");
  var list = DISTRICTS[ch] || [];

  if (!ch) {
    dsel.innerHTML = '<option value="">Select chapter first</option>';
    dsel.disabled = true;
  } else {
    var html = '<option value="">Select district</option>';
    for (var i = 0; i < list.length; i++) {
      html += '<option value="' + list[i] + '">' + list[i] + '</option>';
    }
    dsel.innerHTML = html;
    dsel.disabled = false;
  }
  updateButton();
});

$("district").addEventListener("change", updateButton);

$("proceed").addEventListener("click", function () {
  var ch = $("chapter").value;
  var d = $("district").value;
  if (!ch || !d) return;
  location.href = "app.html?chapter=" + encodeURIComponent(ch) + "&district=" + encodeURIComponent(d);
});
