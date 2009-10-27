/*# -*- Mode: C++; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
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
#   Joachim Herb <joachim.herb@gmx.de>
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

/* This is where functions related to displaying the headers for a selected message in the
   message pane live. */

////////////////////////////////////////////////////////////////////////////////////
// Warning: if you go to modify any of these JS routines please get a code review from
// scott@scott-macgregor.org. It's critical that the code in here for displaying
// the message headers for a selected message remain as fast as possible. In particular,
// right now, we only introduce one reflow per message. i.e. if you click on a message in the thread
// pane, we batch up all the changes for displaying the header pane (to, cc, attachements button, etc.)
// and we make a single pass to display them. It's critical that we maintain this one reflow per message
// view in the message header pane.
////////////////////////////////////////////////////////////////////////////////////

var gCoheCollapsedHeaderViewMode = false;
var gCoheBuiltCollapsedView = false;

/**
 * The collapsed view: very lightweight. We only show a couple of fields.  See
 * msgHdrViewOverlay.js for details of the field definition semantics.
 */
var gCoheCollapsedHeader1LListLongAddresses = [
  {name:"subject"},
  {name:"from", useToggle:true, outputFunction:coheOutputEmailAddresses},
  {name:"toCcBcc", useToggle:true, outputFunction:coheOutputEmailAddresses},
  {name:"date", outputFunction:coheUpdateDateValue}
  ];

var gCoheCollapsedHeader2LListLongAddresses = [
  {name:"subject"},
  {name:"from", useToggle:true, outputFunction:coheOutputEmailAddresses},
  {name:"toCcBcc", useToggle:true, outputFunction:coheOutputEmailAddresses},
  {name:"date", outputFunction:coheUpdateDateValue}
  ];
  
var prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
  .getService(Components.interfaces.nsIPrefService)
  .getBranch("extensions.CompactHeader.");

var coheIntegrateRSSLinkify = false;

var RSSLinkify = {
    oldSubject1L: null,
    newSubject1L: null,
    oldSubject2L: null,
    newSubject2L: null
};

var coheFirstTime = true;

function coheOutputEmailAddresses(headerEntry, emailAddresses) {
  OutputEmailAddresses(headerEntry, emailAddresses);
}

// Now, for each view the message pane can generate, we need a global table
// of headerEntries. These header entry objects are generated dynamically
// based on the static data in the header lists (see above) and elements
// we find in the DOM based on properties in the header lists.
var gCoheCollapsedHeaderView = {};

function coheInitializeHeaderViewTables()
{
  
  gCoheCollapsedHeaderView = {};
  var index;

  if (prefBranch.getBoolPref("headersize.twolineview")) {
    for (index = 0; index < gCoheCollapsedHeader2LListLongAddresses.length; index++) {
      gCoheCollapsedHeaderView[gCoheCollapsedHeader2LListLongAddresses[index].name] =
        new createHeaderEntry('collapsed2L', gCoheCollapsedHeader2LListLongAddresses[index]);
    }
  } else { 
    for (index = 0; index < gCoheCollapsedHeader1LListLongAddresses.length; index++) {
      gCoheCollapsedHeaderView[gCoheCollapsedHeader1LListLongAddresses[index].name] =
        new createHeaderEntry('collapsed1L', gCoheCollapsedHeader1LListLongAddresses[index]);
    }
  }

  if (prefBranch.getBoolPref("headersize.linkify")) {
    RSSLinkify.newSubject = document.createElement("label");
    RSSLinkify.newSubject.setAttribute("id", "collapsedsubjectlinkBox");
    RSSLinkify.newSubject.setAttribute("class", "headerValue plain headerValueUrl");
    RSSLinkify.newSubject.setAttribute("originalclass", "headerValue plain headerValueUrl");
    RSSLinkify.newSubject.setAttribute("context", "CohecopyUrlPopup");
    RSSLinkify.newSubject.setAttribute("keywordrelated", "true");
    RSSLinkify.newSubject.setAttribute("readonly", "true");
    RSSLinkify.newSubject.setAttribute("appendoriginalclass", "true");
    RSSLinkify.newSubject.setAttribute("flex", "1");
    if (prefBranch.getBoolPref("headersize.twolineview")) {
      RSSLinkify.oldSubject = document.getElementById("collapsed2LsubjectBox");
    } else {
      RSSLinkify.oldSubject = document.getElementById("collapsed1LsubjectBox");
    }
    RSSLinkify.oldSubject.parentNode.insertBefore(RSSLinkify.newSubject, RSSLinkify.oldSubject);
  }
}

function coheOnLoadMsgHeaderPane()
{ 
  coheInitializeHeaderViewTables();

  // Add an address book listener so we can update the header view when things
  // change.
  Components.classes["@mozilla.org/abmanager;1"]
            .getService(Components.interfaces.nsIAbManager)
            .addAddressBookListener(coheAddressBookListener,
                                    Components.interfaces.nsIAbListener.all);

  var deckHeaderView = document.getElementById("msgHeaderViewDeck");

  gCoheCollapsedHeaderViewMode = 
    deckHeaderView.selectedPanel == document.getElementById('collapsedHeaderView');    
    
  // work around XUL deck bug where collapsed header view, if it's the persisted
  // default, wouldn't be sized properly because of the larger expanded
  // view "stretches" the deck.
  if (gCoheCollapsedHeaderViewMode)
    document.getElementById('expandedHeaderView').collapsed = true;
  else
    document.getElementById('collapsedHeaderView').collapsed = true;

  if (prefBranch.getBoolPref("headersize.twolineview")) {
    document.getElementById('collapsed1LHeadersBox').collapsed = true;
    document.getElementById('collapsed2LHeadersBox').collapsed = false;
  } else {
    document.getElementById('collapsed1LHeadersBox').collapsed = false;
    document.getElementById('collapsed2LHeadersBox').collapsed = true;
  }
    
  if (coheFirstTime)
  {
    coheFirstTime = false;
    gMessageListeners.push(coheMessageListener);
    loadToolboxData();
    fillToolboxPalette();
    saveToolboxData();
    var toolbox = document.getElementById("header-view-toolbox");
    toolbox.customizeDone = function(aEvent) {
      MailToolboxCustomizeDone(aEvent, "CustomizeHeaderToolbar");
      enableButtons();
      CHTUpdateReplyButton();
      saveToolboxData();
    };
  }
  
  coheToggleHeaderContent();
}

var coheMessageListener = 
{
  onStartHeaders: 
  function cML_onStartHeaders () {
      gCoheBuiltCollapsedView = false;    
  },
  
  onEndHeaders: 
  function cML_onEndHeaders() {
    ClearHeaderView(gCoheCollapsedHeaderView);  
    coheUpdateMessageHeaders();
  },
  
  onEndAttachments: function cML_onEndAttachments(){}
};

function coheOnUnloadMsgHeaderPane()
{
  Components.classes["@mozilla.org/abmanager;1"]
            .getService(Components.interfaces.nsIAbManager)
            .removeAddressBookListener(coheAddressBookListener);
  
  removeEventListener('messagepane-loaded', coheOnLoadMsgHeaderPane, true);
  removeEventListener('messagepane-unloaded', coheOnUnloadMsgHeaderPane, true);
}

var coheAddressBookListener =
{
  onItemAdded: function(aParentDir, aItem) {
    coheOnAddressBookDataChanged(nsIAbListener.itemAdded,
                             aParentDir, aItem);
  },
  onItemRemoved: function(aParentDir, aItem) {
    coheOnAddressBookDataChanged(aItem instanceof nsIAbCard ?
                             nsIAbListener.directoryItemRemoved :
                             nsIAbListener.directoryRemoved,
                             aParentDir, aItem);
  },
  
  onItemPropertyChanged: function(aItem, aProperty, aOldValue, aNewValue) {
    // We only need updates for card changes, address book and mailing list
    // ones don't affect us here.
    if (aItem instanceof Components.interfaces.nsIAbCard)
      coheOnAddressBookDataChanged(nsIAbListener.itemChanged, null, aItem);
  }
}

function coheOnAddressBookDataChanged(aAction, aParentDir, aItem) {
  gEmailAddressHeaderNames.forEach(function (headerName) {
      var headerEntry = null;

      if (headerName in gCoheCollapsedHeaderView) {
        headerEntry = gCoheCollapsedHeaderView[headerName];
        if (headerEntry)
          headerEntry.enclosingBox.updateExtraAddressProcessing(aAction,
                                                                aParentDir,
                                                                aItem);
      }
    });
}

// make sure the appropriate fields within the currently displayed view header mode
// are collapsed or visible...
function coheUpdateHeaderView()
{
  if (gCoheCollapsedHeaderViewMode)
    showHeaderView(gCoheCollapsedHeaderView);

  if (prefBranch.getBoolPref("headersize.linkify")) {
    var url = currentHeaderData["content-base"];
    if(url) {
        RSSLinkify.newSubject.setAttribute("onclick", "if (!event.button) messenger.launchExternalURL('" + 
                                             url.headerValue + "');");
        RSSLinkify.newSubject.setAttribute("value", currentHeaderData["subject"].headerValue);
        RSSLinkify.newSubject.setAttribute("url", url.headerValue);
        RSSLinkify.newSubject.setAttribute("collapsed", "false");
        RSSLinkify.oldSubject.setAttribute("collapsed", "true");
    } else {
        RSSLinkify.newSubject.setAttribute("collapsed", "true");
        RSSLinkify.oldSubject.setAttribute("collapsed", "false");
    }
  } else {
    RSSLinkify.newSubject.setAttribute("collapsed", "true");
    RSSLinkify.oldSubject.setAttribute("collapsed", "false");
  }
  if (prefBranch.getBoolPref("headersize.addressstyle")) {
    selectEmailDisplayed();
  }
  
  //fillToolboxPalette();
  coheToggleHeaderContent();
  CHTUpdateReplyButton();
  CHTUpdateJunkButton();
}

function enableButtons() {
  var hdrToolbar = document.getElementById("header-view-toolbar");
  if (toolbar) {
    var buttons = hdrToolbar.querySelectorAll("[disabled*='true']");
    for (var i=0; i<buttons.length; i++) {
      buttons[i].removeAttribute("disabled");
    }
  }
}

function fillToolboxPalette() {
  var hdrToolbar = document.getElementById("header-view-toolbar");
  var hdrToolbox = document.getElementById("header-view-toolbox");
  var buttons = ["button-reply", "button-replyall", "button-replylist", "button-print", 
                 "button-tag", "button-forward", "button-archive", "button-mark", "button-file"];
  var currentSet=hdrToolbar.getAttribute("currentset");
  hdrToolbar.currentSet = currentSet;
  for (var i=0; i<buttons.length; i++) {
    var buttonName = buttons[i];
    var button = document.getElementById(buttonName) || 
        document.getElementById("mail-toolbox").palette.getElementsByAttribute("id", buttonName)[0];
    if (button) {
      var hdrButton = button.cloneNode(true);
      if (hdrButton) {
      	if (hdrButton.localName == "toolbaritem") {
      		var subButtons = hdrButton.querySelectorAll(".toolbarbutton-1");
      		for (var j=0; j<subButtons.length; j++) {
      			addClass(subButtons[j], "msgHeaderView-button");
      		}
      	} else {
          addClass(hdrButton, "msgHeaderView-button");
      	}
        //hdrButton.id = "hdr" + hdrButton.id;
        hdrToolbox.palette.appendChild(hdrButton);
/*        var bStyle = document.defaultView.getComputedStyle(button, null);
        hdrButton.style.MozImageRegion = bStyle.MozImageRegion;
        hdrButton.style.listStyleImage = bStyle.listStyleImage;*/
      }
      if (currentSet.indexOf(buttonName)>=0) {
        var result = hdrToolbar.insertItem(hdrButton.id);
        currentSet = hdrToolbar.getAttribute("currentset");
        hdrToolbar.currentSet = currentSet;
      }
    }
  }

  var buttonsRemove = ["hdrForwardButton", "hdrArchiveButton",
                       "hdrReplyToSenderButton"];
  for (var i=0; i<buttonsRemove.length; i++) {
    var buttonName = buttonsRemove[i];
    var button = document.getElementById(buttonName) || 
        document.getElementById("header-view-toolbox").palette.getElementsByAttribute("id", buttonName)[0];
    if (button) {
      button.setAttribute("collapsed", "true");
    }
  }

  var target = "hdrOtherActionsButton";
  
  var newParent = document.getElementById(target) || 
      document.getElementById("header-view-toolbox").palette.getElementsByAttribute("id", target)[0];

  if (newParent != null) {
    var myElement;
    myElement= document.getElementById("otherActionsPopup");
    if (myElement) {
      newParent.appendChild(myElement);
    }
  }
}

function coheToggleHeaderView ()
{
  gCoheCollapsedHeaderViewMode = !gCoheCollapsedHeaderViewMode;
  
  let deck = document.getElementById('msgHeaderViewDeck');
  // Work around a xul deck bug where the height of the deck is determined
  // by the tallest panel in the deck even if that panel is not selected...
  deck.selectedPanel.collapsed = true;

  if (gCoheCollapsedHeaderViewMode) {
    deck.selectedPanel = document.getElementById("collapsedHeaderView")
    coheUpdateMessageHeaders();
  } else {
    deck.selectedPanel = document.getElementById("expandedHeaderView");
    ClearHeaderView(gExpandedHeaderView);
    UpdateExpandedMessageHeaders();
    gDBView.reloadMessage();
  }
  
  // Work around a xul deck bug where the height of the deck is determined
  // by the tallest panel in the deck even if that panel is not selected...
  deck.selectedPanel.collapsed = false;
  
  coheToggleHeaderContent();
}

function coheToggleHeaderContent() {
  var strHideLabel = document.getElementById("CoheHideDetailsLabel").value;
  var strShowLabel = document.getElementById("CoheShowDetailsLabel").value;
  var strLabel;
  
  loadToolboxData();

  var hdrToolbox = document.getElementById("header-view-toolbox");
  var hdrToolbar = document.getElementById("header-view-toolbar");
  var firstPermanentChild = hdrToolbar.firstPermanentChild;
  var lastPermanentChild = hdrToolbar.lastPermanentChild;
  if (gCoheCollapsedHeaderViewMode) {
    strLabel = strShowLabel;
    var cBox = document.getElementById("collapsed2LButtonBox");
    if (cBox.parentNode.id != hdrToolbox.parentNode.id) {
      var cloneToolboxPalette = hdrToolbox.palette.cloneNode(true);
      var cloneToolbarset = hdrToolbox.toolbarset.cloneNode(true);
      cBox.parentNode.insertBefore(hdrToolbox, cBox);
      hdrToolbox.palette = cloneToolboxPalette;
      hdrToolbox.toolbarset = cloneToolbarset;
      hdrToolbar = document.getElementById("header-view-toolbar");
      hdrToolbar.firstPermanentChild = firstPermanentChild;
      hdrToolbar.lastPermanentChild = lastPermanentChild;
    }
  } else {
    strLabel = strHideLabel;
    var cBox = document.getElementById("expandedHeaders");
    if (cBox.parentNode.id != hdrToolbox.parentNode.id) {
      var cloneToolboxPalette = hdrToolbox.palette.cloneNode(true);
      var cloneToolbarset = hdrToolbox.toolbarset.cloneNode(true);
      cBox.parentNode.appendChild(hdrToolbox);
      hdrToolbox.palette = cloneToolboxPalette;
      hdrToolbox.toolbarset = cloneToolbarset;
      hdrToolbar = document.getElementById("header-view-toolbar");
      hdrToolbar.firstPermanentChild = firstPermanentChild;
      hdrToolbar.lastPermanentChild = lastPermanentChild;
    }
  }
  
  if (document.getElementById("hideDetailsMenu")) {
    document.getElementById("hideDetailsMenu").setAttribute("label", strLabel);
  }
}

// default method for updating a header value into a header entry
function coheUpdateHeaderValueInTextNode(headerEntry, headerValue)
{
  headerEntry.textNode.value = headerValue;
}

function coheUpdateDateValue(headerEntry, headerValue) {
  //var t = currentHeaderData.date.headerValue;
  var d
  d = document.getElementById("collapsed1LdateBox");
  d.textContent = headerValue;
  d = document.getElementById("collapsed2LdateBox");
  d.textContent = headerValue;
}


// coheUpdateMessageHeaders: Iterate through all the current header data we received from mime for this message
// for each header entry table, see if we have a corresponding entry for that header. i.e. does the particular
// view care about this header value. if it does then call updateHeaderEntry
function coheUpdateMessageHeaders()
{
  // Remove the height attr so that it redraws correctly. Works around a
  // problem that attachment-splitter causes if it's moved high enough to
  // affect the header box:
  document.getElementById('msgHeaderView').removeAttribute('height');
  
  // iterate over each header we received and see if we have a matching entry
  // in each header view table...
  for (var headerName in currentHeaderData)
  {
    var headerField = currentHeaderData[headerName];
    var headerEntry = null;

    if (gCoheCollapsedHeaderViewMode && !gCoheBuiltCollapsedView)
    {
      if (headerName == "cc" || headerName == "to" || headerName == "bcc")
        headerEntry = gCoheCollapsedHeaderView["toCcBcc"];
      else if (headerName in gCoheCollapsedHeaderView)
        headerEntry = gCoheCollapsedHeaderView[headerName];
    }

    if (headerEntry) {
      headerEntry.outputFunction(headerEntry, headerField.headerValue);
      headerEntry.valid = true;
    }
  }

  if (gCoheCollapsedHeaderViewMode)
   gCoheBuiltCollapsedView = true;

  // now update the view to make sure the right elements are visible
  coheUpdateHeaderView();
}

addEventListener('messagepane-loaded', coheOnLoadMsgHeaderPane, true);
addEventListener('messagepane-unloaded', coheOnUnloadMsgHeaderPane, true);

function addClass(el, strClass) {
  var testnew = new RegExp('\\b'+strClass+'\\b').test(el.className);  
  if (!testnew) {
    el.className += el.className?' '+strClass:strClass;
  }
}

function removeClass(el, strClass) {
  el.className = el.className.replace(strClass, '');
}

function CoheCopyWebsiteAddress(websiteAddressNode)
{
  if (websiteAddressNode)
  {
    var websiteAddress = websiteAddressNode.getAttribute("url");

    var contractid = "@mozilla.org/widget/clipboardhelper;1";
    var iid = Components.interfaces.nsIClipboardHelper;
    var clipboard = Components.classes[contractid].getService(iid);
    clipboard.copyString(websiteAddress);
  }
}

function selectEmailDisplayed() {
  var xulemail = document.getElementById("collapsedtoCcBccBox");
  if (xulemail != null) {
    var nextbox = document.getAnonymousElementByAttribute(xulemail, "anonid", "longEmailAddresses");
    if (nextbox != null) {
      var xuldesc = document.getAnonymousElementByAttribute(xulemail, "containsEmail", "true");
      if (xuldesc != null) {
        var children = xuldesc.children;
        for (var i=0; i<children.length; i++) {
          if (children[i].localName == "mail-emailaddress") {
            var rawAddress = children[i].getAttribute("emailAddress");
            if (rawAddress) {
              children[i].setAttribute("label", rawAddress);
            }
          }
        }
      }
    }
  }
  var xulemail = document.getElementById("collapsedfromBox");
  if (xulemail != null) {
    var nextbox = document.getAnonymousElementByAttribute(xulemail, "anonid", "longEmailAddresses");
    if (nextbox != null) {
      var xuldesc = document.getAnonymousElementByAttribute(xulemail, "containsEmail", "true");
      if (xuldesc != null) {
        var children = xuldesc.children;
        for (var i=0; i<children.length; i++) {
          if (children[i].localName == "mail-emailaddress") {
            var rawAddress = children[i].getAttribute("emailAddress");
            if (rawAddress) {
              children[i].setAttribute("label", rawAddress);
            }
          }
        }
      }
    }
  }
}

var myPrefObserverHeaderSize =
{
  register: function()
  {
    // First we'll need the preference services to look for preferences.
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);

    // For this._branch we ask that the preferences for extensions.myextension. and children
    this._branch = prefService.getBranch("extensions.CompactHeader.headersize.");

    // Now we queue the interface called nsIPrefBranch2. This interface is described as:  
    // "nsIPrefBranch2 allows clients to observe changes to pref values."
    this._branch.QueryInterface(Components.interfaces.nsIPrefBranch2);

    // Finally add the observer.
    this._branch.addObserver("", this, false);
  },

  unregister: function()
  {
    if(!this._branch) return;
    this._branch.removeObserver("", this);
  },

  observe: function(aSubject, aTopic, aData)
  {
    if(aTopic != "nsPref:changed") return;
    // aSubject is the nsIPrefBranch we're observing (after appropriate QI)
    // aData is the name of the pref that's been changed (relative to aSubject)

    var event = document.createEvent('Events');
    event.initEvent('messagepane-loaded', false, true);
    var headerViewElement = document.getElementById("msgHeaderView");
    headerViewElement.dispatchEvent(event);

    gDBView.reloadMessage();
  }
}

myPrefObserverHeaderSize.register();

