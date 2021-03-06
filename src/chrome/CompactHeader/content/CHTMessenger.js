/*
# ***** BEGIN LICENSE BLOCK *****
# Version: MPL 1.1/GPL 2.0/LGPL 2.1
#
# The contents of this file are subject to the Mozilla Public License Version
# 1.1 (the "License"); you may not use this file except in compliance with
# the License. You may obtain a copy of the License at
# http://www.mozilla.org/MPL/
#
# Software distributed under the License is distributed on an "AS IS" basis,
# WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
# for the specific language governing rights and limitations under the
# License.
#
# The Original Code is Mozilla Communicator client code, released
# March 31, 1998.
#
# The Initial Developer of the Original Code is
# Netscape Communications Corporation.
# Portions created by the Initial Developer are Copyright (C) 1998-1999
# the Initial Developer. All Rights Reserved.
#
# Contributor(s):
# Joachim Herb <joachim.herb@gmx.de>
#
# Alternatively, the contents of this file may be used under the terms of
# either the GNU General Public License Version 2 or later (the "GPL"), or
# the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
# in which case the provisions of the GPL or the LGPL are applicable instead
# of those above. If you wish to allow use of your version of this file only
# under the terms of either the GPL or the LGPL, and not to allow others to
# use your version of this file under the terms of the MPL, indicate your
# decision by deleting the provisions above and replace them with the notice
# and other provisions required by the GPL or the LGPL. If you do not delete
# the provisions above, a recipient may use your version of this file under
# the terms of any one of the MPL, the GPL or the LGPL.
#
# ***** END LICENSE BLOCK *****
*/

if(!org) var org={};
if(!org.mozdev) org.mozdev={};
if(!org.mozdev.customizeHeaderToolbar) org.mozdev.customizeHeaderToolbar = {};

org.mozdev.customizeHeaderToolbar.messenger = function(){
  var pub = {};

//  pub.init = function () {
//    var onLoadFkt = document.getElementById("messengerWindow").getAttribute("onload");
//    if (onLoadFkt) {
//      var strTest = new RegExp('OnLoadMessenger', 'g');;
//      onLoadFkt = onLoadFkt.replace(strTest, 
//        "org.mozdev.customizeHeaderToolbar.messenger.CHTLoadMessenger");
//      document.getElementById("messengerWindow").setAttribute("onload", onLoadFkt);
//    }
//  }
  
  pub.saveToolboxData = function() {
    var hdrToolbox = document.getElementById("header-view-toolbox");
    var hdrToolbar = document.getElementById("header-view-toolbar");
    var saveToolbox = document.getElementById("CHTSaveToolboxData");
    var saveToolbar = document.getElementById("CHTSaveToolbarData");
    if (hdrToolbox && hdrToolbar && saveToolbox && saveToolbar) {
      saveToolbar.firstPermanentChild = hdrToolbar.firstPermanentChild;
      saveToolbar.lastPermanentChild  = hdrToolbar.lastPermanentChild;
      if (hdrToolbox.palette) {
        saveToolbox.palette    = hdrToolbox.palette.cloneNode(true);
      }
      else {
        //alert("no palette")
        var hdrPalette = document.getElementById("header-view-toolbar-palette");
        if (!hdrPalette) {
          //alert("no header-view-toolbar-palette");
        }
        else {
          //alert("header-view-toolbar-palette");
        }
      }
      if (hdrToolbox.toolbarset) {
        saveToolbox.toolbarset = hdrToolbox.toolbarset.cloneNode(true);
      }
      else {
        //alert("no toolbarset")
      }
      saveToolbox.setAttribute("gotData", "true");
    }
    else {
      //alert("no toolbox/bar");
      saveToolbox.setAttribute("gotData", "false");
    }
  }
  
  pub.loadToolboxData = function() {
    var hdrToolbox = document.getElementById("header-view-toolbox");
    var hdrToolbar = document.getElementById("header-view-toolbar");
    var saveToolbox = document.getElementById("CHTSaveToolboxData");
    var saveToolbar = document.getElementById("CHTSaveToolbarData");
    if (hdrToolbox && hdrToolbar && saveToolbox && saveToolbar && saveToolbox.getAttribute("gotData") == "true") {
      hdrToolbar.firstPermanentChild = saveToolbar.firstPermanentChild;
      hdrToolbar.lastPermanentChild = saveToolbar.lastPermanentChild;
      if (saveToolbox.palette) {
        hdrToolbox.palette = saveToolbox.palette.cloneNode(true);
      } else {
      }
      if (saveToolbox.toolbarset) {
        hdrToolbox.toolbarset = saveToolbox.toolbarset.cloneNode(true);
      } else {
      }
    } 
  }
  

  return pub;
}();

org.mozdev.customizeHeaderToolbar.pane = function(){
  var pub = {};
  
  pub.CHTUpdateReplyButton = function () {
    UpdateReplyButtons();
  }
  
  pub.CHTUpdateJunkButton = function () {
    UpdateJunkButton();    
  }
  
  pub.CHTSetDefaultButtons = function () {
    var hdrToolbox = document.getElementById("header-view-toolbox");
    var hdrToolbar = document.getElementById("header-view-toolbar");
    var hdrBarDefaultSet = hdrToolbar.getAttribute("defaultset");
    var hdrBoxDefaultLabelalign = hdrToolbox.getAttribute("defaultlabelalign");
    var hdrBoxDefaultIconsize = hdrToolbox.getAttribute("defaulticonsize");
    var hdrBoxDefaultMode = hdrToolbox.getAttribute("defaultmode");
    var hdrBarDefaultIconsize = hdrToolbar.getAttribute("defaulticonsize");
    var hdrBarDefaultMode = hdrToolbar.getAttribute("defaultmode");  
    
    hdrToolbox.setAttribute("labelalign", hdrBoxDefaultLabelalign);
    hdrToolbox.setAttribute("iconsize", hdrBoxDefaultIconsize);
    hdrToolbox.setAttribute("mode", hdrBoxDefaultMode);
    hdrToolbar.setAttribute("iconsize", hdrBarDefaultIconsize);
    hdrToolbar.setAttribute("mode", hdrBarDefaultMode);
    
    hdrToolbar.currentSet = hdrBarDefaultSet;
    hdrToolbar.setAttribute("currentset", hdrBarDefaultSet);
    
    document.persist(hdrToolbox.id,"labelalign");
    document.persist(hdrToolbox.id,"iconsize");
    document.persist(hdrToolbox.id,"mode");
    document.persist(hdrToolbar.id,"iconsize");
    document.persist(hdrToolbar.id,"mode");
    document.persist(hdrToolbar.id,"currentset");
  }
  
  pub.CHTCleanupButtons = function() {
    var hdrToolbox = document.getElementById("header-view-toolbox");
    var hdrToolbar = document.getElementById("header-view-toolbar");
    var hdrBarDefaultSet = "hdrReplyButton,hdrReplyAllButton,hdrReplyListButton,hdrForwardButton,hdrArchiveButton,hdrJunkButton,hdrTrashButton";
    var hdrBoxDefaultLabelalign = hdrToolbox.getAttribute("defaultlabelalign");
    var hdrBoxDefaultIconsize =   hdrToolbox.getAttribute("defaulticonsize");
    var hdrBoxDefaultMode =       hdrToolbox.getAttribute("defaultmode");
    var hdrBarDefaultIconsize = hdrToolbar.getAttribute("defaulticonsize");
    var hdrBarDefaultMode =     hdrToolbar.getAttirbute("defaultmode");
    
    hdrToolbox.setAttribute("labelalign", hdrBoxDefaultLabelalign);
    hdrToolbox.setAttribute("iconsize", hdrBoxDefaultIconsize);
    hdrToolbox.setAttribute("mode", hdrBoxDefaultMode);
    hdrToolbar.setAttribute("iconsize", hdrBarDefaultIconsize);
    hdrToolbar.setAttribute("mode", hdrBarDefaultMode);
    
    hdrToolbar.currentSet = hdrBarDefaultSet;
    hdrToolbar.setAttribute("currentset", hdrBarDefaultSet);
    
    document.persist(hdrToolbox.id,"labelalign");
    document.persist(hdrToolbox.id,"iconsize");
    document.persist(hdrToolbox.id,"mode");
    document.persist(hdrToolbar.id,"iconsize");
    document.persist(hdrToolbar.id,"mode");
    document.persist(hdrToolbar.id,"currentset");
  }

  return pub;
}();

//org.mozdev.customizeHeaderToolbar.messenger.init();
