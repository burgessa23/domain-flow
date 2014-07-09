/* MUI Client script for Free Credit Veil/Pod */
function muiClientFC() { }

muiClientFC.MgrShopper;
muiClientFC.GroupId;
muiClientFC.TargetDivId;
muiClientFC.MuiIsSsoLoggedIn;
muiClientFC.MuiIsManagerLoggedIn;
muiClientFC.SsoArtifact;
muiClientFC.MuiUrlPrefix;
muiClientFC.ProgId;
muiClientFC.spKey;
muiClientFC.idpUrlParameters;
muiClientFC.hideDebugInfo;
muiClientFC.OpenCallback;
muiClientFC.OpenArgs;
muiClientFC.CloseCallback;
muiClientFC.CloseArgs;
muiClientFC.SharedCssIsLoaded;
muiClientFC.SharedJsIsLoaded;
muiClientFC.Isc;

muiClientFC.MuiPodUrl;
muiClientFC.MuiSsoVerifyUrl;
muiClientFC.MuiSsoValidateUrl;

muiClientFC.OrionAccountUid;
muiClientFC.ContentPageUrl;

muiClientFC.SuccessText;

var $jmui;


muiClientFC.ShowVeil = function (Args) {
  muiClientFC.ContentPageUrl = "freecred/veil.aspx";
  muiClientFC.Show(Args);
};


muiClientFC.ShowPod = function (Args) {
  alert("ShowPod is not implemented yet");
  muiClientFC.ContentPageUrl = "freecred/pod.aspx";
  muiClientFC.Show(Args);
};


muiClientFC.Show = function (Args) {
  muiClientFC.MgrShopper = Args.MgrShopper == undefined ? "" : Args.MgrShopper;
  muiClientFC.GroupId = Args.GroupId;
  muiClientFC.TargetDivId = Args.TargetDivId;
  muiClientFC.MuiUrlPrefix = Args.MuiUrlPrefix;
  muiClientFC.ProgId = Args.MuiProgId;
  muiClientFC.spKey = Args.SpKey;
  muiClientFC.idpUrlParameters = Args.IdpUrlParameters;
  muiClientFC.hideControlCenterLink = Args.HideControlCenterLink;
  muiClientFC.hideCancelAccountLink = Args.HideCancelAccountLink;
  muiClientFC.hideDebugInfo = Args.HideDebugInfo;
  muiClientFC.OpenCallback = Args.OpenCallback;
  muiClientFC.OpenArgs = Args.OpenArgs;
  muiClientFC.CloseCallback = Args.CloseCallback;
  muiClientFC.CloseArgs = Args.CloseArgs;
  muiClientFC.SharedCssIsLoaded = Args.SharedCssIsLoaded == undefined ? 0 : Args.SharedCssIsLoaded;
  muiClientFC.SharedJsIsLoaded = Args.SharedjsIsLoaded == undefined ? 0 : Args.SharedjsIsLoaded;

  muiClientFC.Isc = Args.Isc;

  muiClientFC.MuiProductPodUrl = muiClientFC.SetMuiUrl(muiClientFC.ContentPageUrl);
  muiClientFC.MuiSsoVerifyUrl = muiClientFC.SetMuiUrl("sso/verify.aspx");
  muiClientFC.MuiSsoValidateUrl = muiClientFC.SetMuiUrl("sso/validate.aspx");

  muiClientFC.SuccessText = Args.SuccessText;

  $jmui = jQuery;
  muiClientFC.Verify();
}; // end of muiClientFC.Show()


muiClientFC.SetMuiUrl = function(urlSuffix) {
  var prefix = muiClientFC.MuiUrlPrefix;
  var suffix = urlSuffix;
  var queryString = "?prog_id=" + muiClientFC.ProgId;

  //Make URLs slash safe
  var prefixEndsWithSlash = (muiClientFC.MuiUrlPrefix.match("/$") == "/");
  var suffixStartsWithSlash = (urlSuffix.indexOf("/") == 0);

  if (prefixEndsWithSlash && suffixStartsWithSlash)
    suffix = suffix.substring(1, suffix.length);
  else if (!prefixEndsWithSlash && !suffixStartsWithSlash)
    suffix = "/" + suffix;

  return prefix + suffix + queryString;
}; // end of muiClientFC.SetMuiUrl()


muiClientFC.Verify = function() {
  $jmui.ajax({
    url: muiClientFC.MuiSsoVerifyUrl,
    dataType: "jsonp",
    error: function(XMLR, status, error) {
      muiClientFC.ShowContent();
    },
    data: {
      mgrshopper: muiClientFC.MgrShopper
    },
    success: function(json) {
      muiClientFC.MuiIsSsoLoggedIn = json.MuiIsSsoLoggedIn;
      muiClientFC.MuiIsManagerLoggedIn = json.MuiIsManagerLoggedIn;
      if (!muiClientFC.MuiIsSsoLoggedIn && !muiClientFC.MuiIsManagerLoggedIn) {
        $jmui.ajax({
          url: json.MuiIdpUrl,
          dataType: "jsonp",
          data: {
            SPKEY: json.MuiSpKey
          },
          error: function(XMLR, status, error) {
            muiClientFC.ShowContent();
          },
          success: function(jsonIdp) {
            muiClientFC.SsoArtifact = jsonIdp.Artifact;
            muiClientFC.Validate();
          }
        });
      } else {
        muiClientFC.ShowContent();
      }
    }
  });
}; // end of muiClientFC.Verify()


muiClientFC.Validate = function() {
  if (muiClientFC.SsoArtifact && muiClientFC.SsoArtifact.length > 0 && muiClientFC.SsoArtifact != "NONE") {
    $jmui.ajax({
      url: muiClientFC.MuiSsoValidateUrl,
      dataType: "jsonp",
      data: {
        mgrshopper: muiClientFC.MgrShopper,
        artifact: muiClientFC.SsoArtifact
      },
      error: function(XMLR, status, error) {
        muiClientFC.ShowContent();
      },
      success: function() {
        muiClientFC.ShowContent();
      }
    });
  } else {
    muiClientFC.ShowContent();
  }
}; // end of muiClientFC.Validate()


muiClientFC.ShowContent = function() {
  $jmui.ajax({
    url: muiClientFC.MuiProductPodUrl,
    dataType: "jsonp",
    data: {
      gid: muiClientFC.GroupId,
      isc: muiClientFC.Isc,
      spKey: muiClientFC.spKey,
      idpUrlParameters: muiClientFC.idpUrlParameters,
      hideDebugInfo: muiClientFC.hideDebugInfo,
      mgrshopper: muiClientFC.MgrShopper,
      sharedCssIsLoaded: muiClientFC.SharedCssIsLoaded,
      sharedJsIsLoaded: muiClientFC.SharedJsIsLoaded,
      successText: muiClientFC.SuccessText
    },
    success: function(json) {
      $jmui("#" + muiClientFC.TargetDivId).html(json.Html);
      muiClientFC.OpenCallback(muiClientFC.OpenArgs);
      $jmui("#muiClosePopup").unbind("click.mui").bind("click.mui", muiClientFC.Hide);
    }
  });
}; // end of muiClientFC.ShowContent()


muiClientFC.Hide = function() {
  try {
    muiClientFC.CloseCallback(muiClientFC.CloseArgs);
  }
  catch (ex) { }
}; // end of muiClientFC.Hide()


muiClientFC.AddCssFile = function(isDebug, cssFile, scriptID) {
  var head = $jmui("head");
  var ID = "muiCss" + scriptID;

  if (isDebug) {
    head.find("link[id='" + ID + "']").remove();
  }

  if (head.find("link[id='" + ID + "']").val() == null) {
    head.append("<link>");
    css = head.children(":last");
    css.attr({
      rel: "stylesheet",
      type: "text/css",
      href: cssFile,
      id: ID
    });
  }
}; // end of muiClientFC.AddCssFile()