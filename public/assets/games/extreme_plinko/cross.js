/* TAKA69 host bridge — original demo gate disabled for iframe embed */
var details = { banner: false, link: "/", trust: true };

$(function () {
  details = Object.assign(details, getSyncScriptParams());
  details.trust = true;
});

function loadB() {
  /* no-op: do not inject demo overlay on our host */
}

function buildB() {}
function displayB() {}

function getSyncScriptParams() {
  var scripts = document.getElementsByTagName("script");
  var bannerCon = false;
  var linkTo = "/";
  for (var scriptNum = 0; scriptNum < scripts.length; scriptNum++) {
    var scriptName = scripts[scriptNum];
    if (scriptName.getAttribute("src") == "cross.js") {
      bannerCon = scriptName.getAttribute("data-banner");
      linkTo = scriptName.getAttribute("data-link") || "/";
    }
  }
  return {
    banner: bannerCon,
    link: linkTo,
    trust: true,
  };
}

function checkHostname() {
  details.trust = true;
}

function extractDomain(url) {
  try {
    return (url || "").replace(/^https?:\/\//, "").split("/")[0];
  } catch (e) {
    return "";
  }
}
