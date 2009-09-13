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
#   Markus Hossner <markushossner@gmx.de>
#   Mark Banner <bugzilla@standard8.plus.com>
#   David Ascher <dascher@mozillamessaging.com>
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
var gCoheCollapsedHeaderListLongAddresses = [
  {name:"subject"},
  {name:"from", useToggle:true, outputFunction:OutputEmailAddresses},
  {name:"toCcBcc", useToggle:true, outputFunction: OutputEmailAddresses},
  {name:"date", outputFunction:coheUpdateDateValue}
  ];

var gCoheCollapsedHeaderListShortAddresses = [
  {name:"subject"},
  {name:"from", useToggle:true, useShortView:true, outputFunction:OutputEmailAddresses},
  {name:"toCcBcc", useToggle:true, useShortView:true, outputFunction: OutputEmailAddresses},
  {name:"date", outputFunction:coheUpdateDateValue}
  ];
    
var prefBranch = Components.classes["@mozilla.org/preferences-service;1"]
  .getService(Components.interfaces.nsIPrefService)
  .getBranch("extensions.CompactHeader.");

var coheIntegrateRSSLinkify = false;

var RSSLinkify = {
    oldSubject: null,
    newSubject: null
};

var coheFirstTime = true;
    
function cleanupHeaderXUL(){
	var xularray = ["collapsedfromOutBox", "collapsedtoCcBccOutBox",
									"collapsedButtonBox", "collapsedsubjectOutBox", 
									"collapseddateOutBox", "coheBaselineBox"];
									
	/* rescue otheraction and tagpopup */
	moveMenusToButtonBox(false);
	for (var i=0; i<xularray.length; i++) {
		var x = document.getElementById(xularray[i]);
		if (x != null) {
			x.parentNode.removeChild(x);
		}
	}
}
    
function create2LHeaderXUL() {
	cleanupHeaderXUL();
	
	var myElement = document.getElementById("collapsedHeaderViewFirstLine");
		
	var xul1   = document.createElement("hbox");
	xul1.id    = "collapsedfromOutBox";
	xul1.align = "start";
	xul1.flex  = "0";
  myElement.appendChild(xul1,myElement);  

	var xultmp1   = document.createElement("grid");
  xultmp1.flex  = "1";
  xul1.appendChild(xultmp1,xul1);  
  
  var xultmp2   = document.createElement("columns");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("column");
  xultmp3.flex  = "0";
  xultmp2.appendChild(xultmp3,xultmp2);
  
  var xultmp2   = document.createElement("rows");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("row");
  xultmp3.id    = "collapsedfromRow";
  xultmp2.appendChild(xultmp3,xultmp2);
    
  var xultmp4   = document.createElement("mail-multi-emailHeaderField");   
	xultmp4.id    = "collapsedfromBox";
	xultmp4.flex  = "0";
  xultmp3.appendChild(xultmp4,xultmp3);
	
  var xultmp1   = document.createElement("grid");
  xultmp1.id    = "collapsedtoCcBccOutBox";
  xultmp1.flex  = "1";
  myElement.appendChild(xultmp1,myElement);  
  
  var xultmp2   = document.createElement("columns");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("column");
  xultmp3.flex  = "0";
  xultmp2.appendChild(xultmp3,xultmp2);

  var xultmp3   = document.createElement("column");
  xultmp3.flex  = "1";
  xultmp2.appendChild(xultmp3,xultmp2);
  
  var xultmp2   = document.createElement("rows");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("row");
  xultmp3.id    = "collapsedtoCcBccRow";
  xultmp3.align = "baseline";
  xultmp2.appendChild(xultmp3,xultmp2);
    
  var xultmp4   = document.createElement("label");   
  xultmp4.id    = "collapsedtoCcBccLabel";
  xultmp4.setAttribute("class","headerName");
  xultmp4.setAttribute("value","to");
  xultmp4.setAttribute("control","collapsedtoCcBccBox");
  xultmp3.appendChild(xultmp4,xultmp3);

  var xultmp4   = document.createElement("mail-multi-emailHeaderField");   
  xultmp4.id    = "collapsedtoCcBccBox";
  xultmp4.flex  = "1";
  xultmp3.appendChild(xultmp4,xultmp3);
  
  var xultmp1   = document.createElement("header-view-button-box");
  xultmp1.id    = "collapsedButtonBox";
  xultmp1.flex  = "0";
  xultmp1.align = "start";
  myElement.appendChild(xultmp1,myElement);  
  
  
  var myElement = document.getElementById("collapsedHeaderViewSecondLine");
    
  var xul1   = document.createElement("hbox");
  xul1.id    = "collapsedsubjectOutBox";
  xul1.align = "start";
  xul1.flex  = "99";
  myElement.appendChild(xul1,myElement);  
	
  var xultmp2   = document.createElement("row");
  xultmp2.id    = "collapsedsubjectRow";
  xultmp2.flex  = "99";
  xul1.appendChild(xultmp2,xul1);

  var xultmp3   = document.createElement("mail-headerfield");
  xultmp3.id    = "collapsedsubjectBox";
  xultmp3.flex  = "99";
  xultmp2.appendChild(xultmp3,xultmp2);
  
  var xul1   = document.createElement("hbox");
  xul1.id    = "collapseddateOutBox";
  xul1.align = "end";
  xul1.flex  = "0";
  myElement.appendChild(xul1,myElement);  
  
  var xultmp2   = document.createElement("row");
  xultmp2.id    = "collapseddateRow";
  xultmp2.align = "end";
  xultmp2.pack  = "end";
  xul1.appendChild(xultmp2,xul1);

  var xultmp3   = document.createElement("label");
  xultmp3.id    = "collapseddateBox";
  xultmp3.flex  = "1";
  xultmp3.setAttribute("class","dateLabel");
  xultmp2.appendChild(xultmp3,xultmp2);

  document.getElementById("collapsedHeaderView").setAttribute("twolineview", "true");
}

function create1LHeaderXUL() {
	cleanupHeaderXUL();
	
	var myElement = document.getElementById("collapsedHeaderViewFirstLine");

  var xul1   = document.createElement("hbox");
  xul1.id    = "collapsedsubjectOutBox";
  xul1.align = "start";
  xul1.flex  = "99";
  myElement.appendChild(xul1,myElement);  
  
  var xultmp2   = document.createElement("row");
  xultmp2.id    = "collapsedsubjectRow";
  xultmp2.flex  = "99";
  xul1.appendChild(xultmp2,xul1);

  var xultmp3   = document.createElement("mail-headerfield");
  xultmp3.id    = "collapsedsubjectBox";
  xultmp3.flex  = "99";
  xultmp2.appendChild(xultmp3,xultmp2);

  var xul1   = document.createElement("hbox");
  xul1.id    = "collapsedfromOutBox";
  xul1.align = "start";
  xul1.flex  = "0";
  myElement.appendChild(xul1,myElement);  

  var xultmp1   = document.createElement("grid");
  xultmp1.flex  = "1";
  xul1.appendChild(xultmp1,xul1);  
  
  var xultmp2   = document.createElement("columns");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("column");
  xultmp3.flex  = "0";
  xultmp2.appendChild(xultmp3,xultmp2);
  
  var xultmp2   = document.createElement("rows");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("row");
  xultmp3.id    = "collapsedfromRow";
  xultmp2.appendChild(xultmp3,xultmp2);
    
  var xultmp4   = document.createElement("mail-multi-emailHeaderField");   
  xultmp4.id    = "collapsedfromBox";
  xultmp4.flex  = "0";
  xultmp3.appendChild(xultmp4,xultmp3);
	
  var xultmp1   = document.createElement("grid");
  xultmp1.id    = "collapsedtoCcBccOutBox";
  xultmp1.flex  = "1";
  myElement.appendChild(xultmp1,myElement);  
    
  var xultmp2   = document.createElement("rows");
  xultmp1.appendChild(xultmp2,xultmp1);  

  var xultmp3   = document.createElement("row");
  xultmp3.id    = "collapsedtoCcBccRow";
  xultmp3.align = "baseline";
  xultmp2.appendChild(xultmp3,xultmp2);
    
  var xultmp4   = document.createElement("mail-multi-emailHeaderField");   
  xultmp4.id    = "collapsedtoCcBccBox";
  xultmp4.flex  = "1";
  xultmp4.hidden = "true";
  xultmp3.appendChild(xultmp4,xultmp3);
  
  var xul1   = document.createElement("hbox");
  xul1.id    = "collapseddateOutBox";
  xul1.align = "end";
  xul1.flex  = "0";
  myElement.appendChild(xul1,myElement);  
  
  var xultmp2   = document.createElement("row");
  xultmp2.id    = "collapseddateRow";
  xultmp2.align = "start";
  xultmp2.pack  = "end";
  xul1.appendChild(xultmp2,xul1);

  var xultmp3   = document.createElement("label");
  xultmp3.id    = "collapseddateBox";
  xultmp3.flex  = "1";
  xultmp3.setAttribute("class","dateLabel");
  xultmp2.appendChild(xultmp3,xultmp2);
	
	var xul3   = document.createElement("header-view-button-box");
	xul3.id    = "collapsedButtonBox";
	xul3.hidden = "true";

	myElement.appendChild(xul3, myElement);

	document.getElementById("collapsedHeaderView").removeAttribute("twolineview");
}

function createExpandedHeaderXUL() {
	return;
	
  var myElement = document.getElementById("expandedHeaderView");

	var xul0   = document.createElement("vbox");
	xul0.id    = "expandedHeadersBox";
	xul0.flex  = "1";
	xul0.setAttribute("insertafter", "hideDetailsButtonBox");

	myElement.appendChild(xul0, myElement);
	//myElement.insertBefore(xul0, "expandedHeadersTopBox")
	
	var newParent = document.getElementById("expandedHeadersBox");
	if (newParent != null) {
		var myElement = document.getElementById("expandedHeadersTopBox");
		newParent.appendChild(myElement);
		myElement = document.getElementById("expandedHeadersBottomBox");
		newParent.appendChild(myElement);
	} else {
		alert ("null");
	}
	
	
}
// Now, for each view the message pane can generate, we need a global table
// of headerEntries. These header entry objects are generated dynamically
// based on the static data in the header lists (see above) and elements
// we find in the DOM based on properties in the header lists.
var gCoheCollapsedHeaderView = {};

function coheInitializeHeaderViewTables()
{
	
/*  coheReInitializeHeaderViewTables(); */
  // iterate over each header in our header list array, create a header entry
	// for it, and store it in our header table
	if (prefBranch.getBoolPref("headersize.twolineview")) {
  	create2LHeaderXUL();
	} else {
  	create1LHeaderXUL();
	}
  //document.getElementById("collapsedHeaderView").removeAttribute("twolineview");
	
	//var tb = document.getElementById("collapsedsubjectValue");
  gCoheCollapsedHeaderView = {};
  var index;

  for (index = 0; index < gCoheCollapsedHeaderListLongAddresses.length; index++) {
    gCoheCollapsedHeaderView[gCoheCollapsedHeaderListLongAddresses[index].name] =
      new createHeaderEntry('collapsed', gCoheCollapsedHeaderListLongAddresses[index]);
  }

  /*
  if (prefBranch.getBoolPref("headersize.addressstyle") != 1) {
	  for (index = 0; index < gCoheCollapsedHeaderListLongAddresses.length; index++) {
	    gCoheCollapsedHeaderView[gCoheCollapsedHeaderListLongAddresses[index].name] =
	      new createHeaderEntry('collapsed', gCoheCollapsedHeaderListLongAddresses[index]);
	  }
	} else {
	  for (index = 0; index < gCoheCollapsedHeaderListShortAddresses.length; index++) {
	    gCoheCollapsedHeaderView[gCoheCollapsedHeaderListShortAddresses[index].name] =
	      new createHeaderEntry('collapsed', gCoheCollapsedHeaderListShortAddresses[index]);
		}
	}
  */
  
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
	  RSSLinkify.oldSubject = document.getElementById("collapsedsubjectBox");
	  RSSLinkify.oldSubject.parentNode.insertBefore(RSSLinkify.newSubject, RSSLinkify.oldSubject);
	}

//	moveMenusToButtonBox(gCoheCollapsedHeaderViewMode);
	
  updateHdrButtons();
  updateHdrIconText();
  
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

	if (coheFirstTime)
	{
  	gMessageListeners.push(coheMessageListener);
  	coheFirstTime = false;
	}
	
	moveMenusToButtonBox(gCoheCollapsedHeaderViewMode);
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
  }
  if (prefBranch.getBoolPref("headersize.addressstyle")) {
  	selectEmailDisplayed();
  }
  
	UpdateJunkButton();
	updateMyReplyButtons();
	updateHdrButtons();
}


function moveMenusToButtonBox(viewMode) {
	var target;
	
	if (viewMode)
		target = "collapsedButtonBox";
	else
		target = "otherActionsBox";
	
	var newParent = document.getElementById(target);
	if (newParent != null) {
		var myElement = document.getElementById("otherActionsButton");
		newParent.appendChild(myElement);
		myElement = document.getElementById("tagMenuPopup");
		newParent.appendChild(myElement);
	} else {
		alert ("null");
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
	 	updateMyReplyButtons();
	  updateHdrButtons();
	}

	moveMenusToButtonBox(gCoheCollapsedHeaderViewMode);
  
  // Work around a xul deck bug where the height of the deck is determined
	// by the tallest panel in the deck even if that panel is not selected...
  deck.selectedPanel.collapsed = false;
}

// default method for updating a header value into a header entry
function coheUpdateHeaderValueInTextNode(headerEntry, headerValue)
{
  headerEntry.textNode.value = headerValue;
}

function coheUpdateDateValue(headerEntry, headerValue) {
  //var t = currentHeaderData.date.headerValue;
	var d = document.getElementById("collapseddateBox");
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

function copyButtonIcons(buttonname, element) {
	var e0 = document.getElementById("mail-bar3");
	var iconsize;
	
	if (e0) {
	  iconsize = e0.getAttribute("iconsize");	
	} else {
		iconsize = "small";
	}
	
	var e01 = document.getElementById("hiddenIconSpace");
  if (e01) {
    e01.setAttribute("iconsize", iconsize); 
  }	
	
  var e1 = document.getElementById(buttonicons[buttonname]);
  if (!e1) return;
  
  var s1 = window.getComputedStyle(e1, null);
  if (!s1) return;
  
  var imageregion = s1.getPropertyValue("-moz-image-region");
  var imagefile = s1.getPropertyValue("list-style-image");

  if (imagefile && imagefile != "") element.style.listStyleImage = imagefile;
  if (imageregion && imageregion != "") element.style.MozImageRegion = imageregion;
  
  if (buttonname == "hdrTrashButton") {
  	removeClass(element, "hdrTrashButton");
  }
}

function updateHdrButtons() {
	
	var buttonBox = document.getElementById('msgHeaderViewDeck').selectedPanel
									.getElementsByTagName("header-view-button-box").item(0);
  for(var buttonname in buttonslist) {

		var strViewMode;
		if (gCoheCollapsedHeaderViewMode)
			strViewMode = "view.compact";
		else
		  strViewMode = "view.expanded";
		for (var j=0; j<buttonslist[buttonname].length; j++){
	  	var myElement = buttonBox.getButton(buttonslist[buttonname][j]) || document.getElementById(buttonslist[buttonname][j]);
	  	copyButtonIcons(buttonslist[buttonname][j], myElement);
	  	if (myElement != null) {
	  		addClass(myElement, "msgHeaderView-flat-button");
	  		if (prefBranch.getBoolPref(strViewMode + ".display" + buttonname)) {
		  		if (buttonname != "Reply") {
			  		myElement.hidden =  false; //! prefBranch.getBoolPref("expandedview.display" + buttonname);
		  		}
		  	}
		  	else {
		  		myElement.hidden =  true ; //! prefBranch.getBoolPref(strViewMode + "display" + buttonname);
		  	}
	  	}
	  	else {
	  		alert("myElement null");
	  	}
	  }
  }
}

function updateHdrIconText() {
	var myE = [document.getElementById("collapsedButtonBox"),
						 document.getElementById("expandedButtonBox"),
						 document.getElementById("tagMenuPopup"),
						 document.getElementById("otherActionsButton")];
	if (prefBranch.getBoolPref("buttons.showonlyicon")) {
		for (var i=0; i<myE.length; i++) {
			myE[i].removeAttribute("OnlyIcon");
			myE[i].setAttribute("OnlyIcon", "Icon");
		}
	} else {
		for (var i=0; i<myE.length; i++) {
			myE[i].removeAttribute("OnlyIcon");
			myE[i].setAttribute("OnlyIcon", "Text");
		}
	}
}

function updateMyReplyButtons() {
	UpdateReplyButtons();
	var buttonBox = document.getElementById('msgHeaderViewDeck').selectedPanel
									.getElementsByTagName("header-view-button-box").item(0);
	for (var j=0;j<buttonslist["Reply"].length; j++) {
		var myElement = buttonBox.getButton(buttonslist["Reply"][j]);
		addClass(myElement, "msgHeaderView-flat-button");
		if (!myElement.hidden) {
			myElement.setAttribute("mode", buttonslist["Reply"][j]);
		}
	}
}

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

var myPrefObserverView =
{
  register: function()
  {
    // First we'll need the preference services to look for preferences.
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);

    // For this._branch we ask that the preferences for extensions.myextension. and children
    this._branch = prefService.getBranch("extensions.CompactHeader.view.");

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

 		updateMyReplyButtons();
    updateHdrButtons();
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

		updateMyReplyButtons();
		/*updateHdrButtons();*/
	  gDBView.reloadMessage();
  }
}

var myPrefObserverIconText =
{
  register: function()
  {
    // First we'll need the preference services to look for preferences.
    var prefService = Components.classes["@mozilla.org/preferences-service;1"]
                                .getService(Components.interfaces.nsIPrefService);

    // For this._branch we ask that the preferences for extensions.myextension. and children
    this._branch = prefService.getBranch("extensions.CompactHeader.buttons.");

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

    updateHdrIconText();  
  }
}

myPrefObserverView.register();
myPrefObserverHeaderSize.register();
myPrefObserverIconText.register();

/*
function CoHe_customizeToolbar(aWhich) {

	// feststellen, welche Toolbar konfiguriert werden soll
	var elem = aWhich;
	while(elem.tagName != "popup") {
		elem = elem.parentNode;
	}

	var tbar = document.getElementById("HeaderPaneToolbar");
	var toolbox = document.getElementById(tbar.parentNode.id);

	toolbox.customizeDone = CoHe_customizeToolbarDone;
	document.getElementById('CoHe-customize-mitem').setAttribute("disabled", "true");

	// l�st Reaktion auf �nderungen der Icongr��e/Symbolanzeige im Anpassen-Dialog aus
	CoHeInterval = window.setInterval("CoHe_adjustToolboxWidth(true)", 100);

	openDialog("chrome://global/content/customizeToolbar.xul", "CustomizeToolbar", "chrome,all,dependent", toolbox);
}
*/

/*
	Schlie�t die Symbolleisten-Konfiguration ab
		=> Aufruf durch CoHe_customizeToolbar()
*/
/*
function CoHe_customizeToolbarDone(aToolboxChanged) {
	if(document.getElementById('CoHe-customize-mitem'))
		document.getElementById('CoHe-customize-mitem').removeAttribute("disabled");

	window.focus();
}
*/