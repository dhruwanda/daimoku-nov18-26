var API = "https://script.google.com/macros/s/AKfycbyvy4rr5S4WbUSzsEEkCHTgm7WxB7iks2QOg5fqBseTmJgpwkk6ENIXUBJ4VrCHWR-zmA/exec";

var START = "2026-08-07";
var END = "2026-11-18";

var members = [];
var logs = [];

var $ = function (id) { return document.getElementById(id); };

/* ---------- time helpers ---------- */

function pad(n) { return n < 10 ? "0" + n : "" + n; }

function ymd(d) {
  return d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());
}

function parseYmd(s) {
  var p = String(s).split("-");
  return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
}

function istToday() {
  return ymd(new Date(Date.now() + 19800000));
}

function addDays(s, n) {
  var d = parseYmd(s);
  d.setUTCDate(d.getUTCDate() + n);
  return ymd(d);
}

function daysBetween(a, b) {
  return Math.round((parseYmd(b) - parseYmd(a)) / 86400000);
}

var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(s) {
  var d = parseYmd(s);
  return d.getUTCDate() + " " + MONTHS[d.getUTCMonth()];
}

/* ---------- minutes to hours ----------
   Everything is stored and summed as whole minutes.
   Hours only appear at the moment of display, so totals always tie out. */

function hm(minutes) {
  var m = Math.round(minutes);
  if (m <= 0) return "0h";
  var h = Math.floor(m / 60);
  var r = m % 60;
  if (h === 0) return r + "m";
  if (r === 0) return h + "h";
  return h + "h " + r + "m";
}

/* ---------- derived numbers ---------- */

function inCampaign(day) {
  return day >= START && day <= END;
}

function totalsByMember() {
  var out = {};
  for (var i = 0; i < members.length; i++) out[members[i]] = 0;
  for (var j = 0; j < logs.length; j++) {
    var l = logs[j];
    if (!inCampaign(l.day)) continue;
    out[l.name] = (out[l.name] || 0) + l.minutes;
  }
  return out;
}

function totalsByDay() {
  var out = {};
  for (var i = 0; i < logs.length; i++) {
    var l = logs[i];
    if (!inCampaign(l.day)) continue;
    out[l.day] = (out[l.day] || 0) + l.minutes;
  }
  return out;
}

function daysLeft() {
  var t = istToday();
  if (t > END) return 0;
  if (t < START) return daysBetween(START, END) + 1;
  return daysBetween(t, END) + 1;
}

/* ---------- rendering ---------- */

function renderStats() {
  var per = totalsByMember();
  var district = 0;
  for (var k in per) if (per.hasOwnProperty(k)) district += per[k];

  var me = $("who").value;
  $("mine").textContent = hm(me && per[me] ? per[me] : 0);
  $("district").textContent = hm(district);
  $("daysleft").textContent = daysLeft();
}

function renderMembers() {
  var per = totalsByMember();
  var names = members.slice().sort(function (a, b) { return (per[b] || 0) - (per[a] || 0); });

  if (!names.length) {
    $("members").innerHTML = '<p class="empty">No members yet. Add yourself above.</p>';
    return;
  }

  var max = 0;
  for (var i = 0; i < names.length; i++) if ((per[names[i]] || 0) > max) max = per[names[i]];

  var html = "";
  for (var j = 0; j < names.length; j++) {
    var n = names[j];
    var mins = per[n] || 0;
    var w = max > 0 ? Math.round((mins / max) * 100) : 0;
    html += '<div class="row">'
      + '<span class="name" title="' + esc(n) + '">' + esc(n) + "</span>"
      + '<span class="track"><span class="fill" style="width:' + w + '%"></span></span>'
      + '<span class="val">' + hm(mins) + "</span>"
      + "</div>";
  }
  $("members").innerHTML = html;
}

function renderDaily() {
  var byDay = totalsByDay();
  var today = istToday();
  var last = today > END ? END : (today < START ? START : today);

  var days = [];
  for (var d = START; ; d = addDays(d, 1)) {
    days.push(d);
    if (d === last) break;
  }

  var max = 0;
  for (var i = 0; i < days.length; i++) {
    var v = byDay[days[i]] || 0;
    if (v > max) max = v;
  }

  $("ymax").textContent = hm(max);
  $("ymid").textContent = hm(max / 2);

  var step = Math.max(1, Math.ceil(days.length / 5));
  var bars = "", dates = "";

  for (var j = 0; j < days.length; j++) {
    var mins = byDay[days[j]] || 0;
    var h = max > 0 ? Math.max(2, Math.round((mins / max) * 104)) : 2;
    bars += '<div style="height:' + h + 'px" title="' + shortDate(days[j]) + ": " + hm(mins) + '"></div>';
    dates += "<div>" + (j % step === 0 ? shortDate(days[j]) : "") + "</div>";
  }

  $("daily").innerHTML = bars;
  $("dates").innerHTML = dates;
}

function renderToday() {
  var me = $("who").value;
  var t = istToday();
  if (!me || me === "__new") { $("today").textContent = ""; return; }

  var mine = logs.filter(function (l) { return l.name === me && l.day === t; });
  if (!mine.length) { $("today").textContent = "Nothing logged today yet."; return; }

  var sum = 0, parts = [];
  for (var i = 0; i < mine.length; i++) { sum += mine[i].minutes; parts.push(hm(mine[i].minutes)); }
  $("today").textContent = "Today: " + parts.join(" + ") + (mine.length > 1 ? " = " + hm(sum) : "");
}

function renderAll() {
  renderStats();
  renderMembers();
  renderDaily();
  renderToday();
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
  });
}

/* ---------- dropdown ---------- */

function fillSelect(keep) {
  var sel = $("who");
  var html = '<option value="">Select your name</option>';
  var sorted = members.slice().sort(function (a, b) { return a.localeCompare(b); });
  for (var i = 0; i < sorted.length; i++) {
    html += '<option value="' + esc(sorted[i]) + '">' + esc(sorted[i]) + "</option>";
  }
  html += '<option value="__new">+ Add new member</option>';
  sel.innerHTML = html;

  var want = keep || localStorage.getItem("daimokuMember") || "";
  if (want && members.indexOf(want) !== -1) sel.value = want;
  onWhoChange();
}

function onWhoChange() {
  var v = $("who").value;
  $("newbox").hidden = v !== "__new";
  if (v && v !== "__new") localStorage.setItem("daimokuMember", v);
  renderStats();
  renderToday();
}

/* ---------- network ---------- */

function load() {
  return fetch(API + "?t=" + Date.now())
    .then(function (r) { return r.json(); })
    .then(function (data) {
      if (!data.ok) throw new Error(data.error || "Could not load");
      members = data.members || [];
      logs = data.logs || [];
      fillSelect();
      renderAll();
    })
    .catch(function (err) {
      $("members").innerHTML = '<p class="empty">Could not load data. Check your connection and refresh.</p>';
      console.error(err);
    });
}

function send(payload) {
  return fetch(API, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload)
  }).then(function (r) { return r.json(); });
}

/* ---------- events ---------- */

$("who").addEventListener("change", onWhoChange);

$("minutes").addEventListener("input", function () {
  var n = parseInt(this.value, 10);
  $("live").textContent = n > 0 ? "That is " + hm(n) : "Enter minutes only.";
});

$("submit").addEventListener("click", function () {
  var btn = this;
  var sel = $("who").value;
  var raw = $("minutes").value;
  var mins = Math.round(parseFloat(raw));
  var msg = $("msg");

  msg.className = "msg";

  if (!sel) { fail("Select your name first."); return; }
  if (sel === "__new" && !$("newname").value.trim()) { fail("Enter your name first."); return; }
  if (!raw || isNaN(mins) || mins <= 0) { fail("Enter minutes as a whole number."); return; }
  if (mins > 1440) { fail("That is more than 24 hours. Check the number."); return; }

  btn.disabled = true;
  msg.textContent = "Saving…";

  var name = sel === "__new" ? $("newname").value.trim() : sel;
  var action = sel === "__new" ? "addAndLog" : "log";

  send({ action: action, name: name, minutes: mins })
    .then(function (res) {
      if (!res.ok) throw new Error(res.error || "Could not save");
      $("minutes").value = "";
      $("newname").value = "";
      $("live").textContent = "Enter minutes only.";
      localStorage.setItem("daimokuMember", name);
      return load().then(function () {
        $("who").value = name;
        onWhoChange();
        var t = istToday();
        var got = 0;
        for (var i = 0; i < logs.length; i++) {
          if (logs[i].name === name && logs[i].day === t) got += logs[i].minutes;
        }
        if (got > 0) {
          msg.className = "msg";
          msg.textContent = "Saved. " + hm(got) + " logged today.";
        } else {
          msg.className = "msg bad";
          msg.textContent = "Saved to the sheet but not showing yet. Refresh in a moment.";
        }
      });
    })
    .catch(function (err) {
      fail("Could not save. Try again.");
      console.error(err);
    })
    .then(function () { btn.disabled = false; });

  function fail(text) {
    msg.className = "msg bad";
    msg.textContent = text;
  }
});

load();
