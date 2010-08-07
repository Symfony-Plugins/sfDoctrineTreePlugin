/*******************************************************************************
 * This is a modified version for sfDoctrineTree to work with Prototype,
 * Doctrine and Symfony. It add code to work with Crtl-Click on Opera. (Opera
 * does not allow context menus on Right-Click) 
 * 
 * Author: Arnoldas Lukasevicius - 2010 <arnoldas.lukasevicius@gmail.com>
 * Author: Jacques Philip - 1998 <jphilipatnoatakdotcom>
 * ***********************************************************************************************************
 * Context menu Copyright (C) 2006 DTHMLGoodies.com, Alf Magne Kalleland
 * 
 * This library is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Lesser General Public License as published by the Free
 * Software Foundation; either version 2.1 of the License, or (at your option)
 * any later version.
 * 
 * This library is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Lesser General Public License for more
 * details.
 * 
 * You should have received a copy of the GNU Lesser General Public License
 * along with this library; if not, write to the Free Software Foundation, Inc.,
 * 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
 * 
 * Dhtmlgoodies.com., hereby disclaims all copyright interest in this script
 * written by Alf Magne Kalleland.
 * 
 * Alf Magne Kalleland, 2006 Owner of DHTMLgoodies.com
 * 
 * 
 ******************************************************************************/

DHTMLGoodies_menuModel = function() {
	var menuItems;
	this.menuItems = new Array();

}

DHTMLGoodies_menuModel.prototype = {
		addItem : function(id, itemText, itemIcon, url, parentId, jsFunction) {
	i = this.menuItems.length;
	this.menuItems[i] = new Array();
	this.menuItems[i]['id'] = id;
	this.menuItems[i]['itemText'] = itemText;
	this.menuItems[i]['itemIcon'] = itemIcon;
	this.menuItems[i]['url'] = url;
	this.menuItems[i]['parentId'] = parentId;
	this.menuItems[i]['separator'] = false;
	this.menuItems[i]['jsFunction'] = jsFunction;

},
addSeparator : function(id, parentId) {
	this.menuItems[id] = new Array();
	this.menuItems[id]['parentId'] = parentId;
	this.menuItems[id]['separator'] = true;
},
init : function() {
	this.__getDepths();

},
getItems : function() {
	return this.menuItems;
}

,
__getDepths : function() {
	for ( var no = 0; no < this.menuItems.length; no++) {
		this.menuItems[no]['depth'] = 1;
		if (this.menuItems[no]['parentId']) {
			this.menuItems[no]['depth'] = this.menuItems[this.menuItems[no]['parentId']]['depth'] + 1;
		}
	}
},
__hasSubs : function(id) {
	for ( var no = 0; no < this.menuItems.length; no++) { // Looping
		// through menu
		// items
		if (this.menuItems[no]['parentId'] == id)
			return true;
	}
	return false;
}
};

var referenceToDHTMLSuiteContextMenu;

DHTMLGoodies_contextMenu = function() {
	var menuModels;
	var menuItems;
	var menuObject; // Reference to context menu div
	var layoutCSS;
	var menuUls; // Array of <ul> elements
	var width; // Width of context menu
	var srcElement; // Reference to the element which triggered the context
	// menu, i.e. the element which caused the context menu to
	// be displayed.
	var indexCurrentlyDisplayedMenuModel; // Index of currently displayed menu
	// model.
	var imagePath;

	this.menuModels = new Array();
	this.menuObject = false;
	this.menuUls = new Array();
	this.width = 100;
	this.srcElement = false;
	this.indexCurrentlyDisplayedMenuModel = false;
	this.imagePath = '/sfDoctrineTreePlugin/images/';

}

DHTMLGoodies_contextMenu.prototype = {

		setWidth : function(newWidth) {
	this.width = newWidth;
},
setLayoutCss : function(cssFileName) {
	this.layoutCSS = cssFileName;
},
attachToElement : function(element, elementId, menuModel) {
	window.refToThisContextMenu = this;
	if (!element && elementId)
		element = document.getElementById(elementId);
	if (!element.id) {
		element.id = 'context_menu' + Math.random();
		element.id = element.id.replace('.', '');
	}
	this.menuModels[element.id] = menuModel;
	if (Prototype.Browser.Opera) {
		element.onclick = this.__displayContextMenu;
	} else {
		element.oncontextmenu = this.__displayContextMenu;
	}
	element.onmousedown = function() {
		window.refToThisContextMenu
		.setReference(window.refToThisContextMenu);
	};
	document.documentElement.onclick = this.__hideContextMenu;
},
setReference : function(obj) {
	referenceToDHTMLSuiteContextMenu = obj;
},
__displayContextMenu : function(e) {
	if (Prototype.Browser.Opera) {
		if (!e.ctrlKey)
			return;
		else
			Event.stop(e);
	}
	if (document.all)
		e = event;
	var ref = referenceToDHTMLSuiteContextMenu;
	ref.srcElement = ref.getSrcElement(e);

	this.__hideContextMenu;
		
	//if (!ref.indexCurrentlyDisplayedMenuModel
			//|| ref.indexCurrentlyDisplayedMenuModel != this.id) { 
		if (ref.indexCurrentlyDisplayedMenuModel) {
			ref.menuObject.innerHTML = '';
		} else {
			ref.__createDivs();
		}
		ref.menuItems = ref.menuModels[this.id].getItems();
		ref.__createMenuItems();
	//}
		
	ref.indexCurrentlyDisplayedMenuModel = this.id;

	ref.menuObject.style.left = (e.clientX - 5 + Math.max(
			document.body.scrollLeft, document.documentElement.scrollLeft)) + 'px';
	ref.menuObject.style.top = (e.clientY - 5 + Math.max(
			document.body.scrollTop, document.documentElement.scrollTop)) + 'px';
	ref.menuObject.style.display = 'block';
	return false;

},
__hideContextMenu : function() {
	var ref = referenceToDHTMLSuiteContextMenu;
	if (ref.menuObject) {
		ref.menuObject.style.display = 'none';
	}
},
__createDivs : function() {
	this.menuObject = document.createElement('DIV');
	this.menuObject.className = 'DHTMLSuite_contextMenu';
	this.menuObject.style.backgroundImage = 'url(\'' + this.imagePath + 'context-menu-gradient.gif' + '\')';
	this.menuObject.style.backgroundRepeat = 'repeat-y';
	if (this.width) {
		this.menuObject.style.width = this.width + 'px';
	}
	this.menuObject.onmouseout = function(e) {
		var target;
		if (e.target)
			target = e.target;
		else if (e.srcElement) // IE
			target = e.srcElement;
		if (target.tagName.toString() == "DIV"
			&& target.classList.contains('DHTMLSuite_contextMenu'))
			target.style.display = 'none';
	};
	document.body.appendChild(this.menuObject);
},

__mouseOver : function() {
	this.className = 'DHTMLSuite_item_mouseover';
	if (!document.all) {
		this.style.backgroundPosition = 'left center';
	}

},
__mouseOut : function() {
	this.className = '';
	if (!document.all) {
		this.style.backgroundPosition = '1px center';
	}
},
__evalUrl : function() {
	var js = this.getAttribute('jsFunction');
	if (!js)
		js = this.jsFunction;
	if (js)
		eval(js);

},
__createMenuItems : function() {
	window.refToContextMenu = this; // Reference to menu strip object
	this.menuUls = new Array();
	for ( var no = 0; no < this.menuItems.length; no++) { // Looping through
		// menu items
		if (!this.menuUls[0]) { // Create main ul element
			this.menuUls[0] = document.createElement('UL');
			this.menuObject.appendChild(this.menuUls[0]);
		}

		if (this.menuItems[no]['depth'] == 1) {

			// alert(no.toString() + this.menuItems[no]['itemText']);

			if (this.menuItems[no]['separator']) {
				var li = document.createElement('DIV');
				li.className = 'DHTMLSuite_contextMenu_separator';
			} else {
				var li = document.createElement('LI');
				if (this.menuItems[no]['jsFunction']) {
					this.menuItems[no]['url'] = this.menuItems[no]['jsFunction'] + '(this,referenceToDHTMLSuiteContextMenu.srcElement)';
				}
				if (this.menuItems[no]['itemIcon']) {
					li.style.backgroundImage = 'url(\'' + this.menuItems[no]['itemIcon'] + '\')';
					if (!document.all)
						li.style.backgroundPosition = '1px center';

				}

				if (this.menuItems[no]['url']) {
					var url = this.menuItems[no]['url'] + '';
					var tmpUrl = url + '';
					li.setAttribute('jsFunction', url);
					li.jsFunction = url;
					li.onclick = this.__evalUrl;

				}

				li.innerHTML = '<a href="#" onclick="return false">' + this.menuItems[no]['itemText'] + '</a>';
				li.onmouseover = this.__mouseOver;
				li.onmouseout = this.__mouseOut;
			}
			this.menuUls[0].appendChild(li);
		}
	}
},
getSrcElement : function(e) {
	var el;
//	Dropped on which element
	if (e.target)
		el = e.target;
	else if (e.srcElement)
		el = e.srcElement;
	if (el.nodeType == 3) // defeat Safari bug
		el = el.parentNode;
	return el;
}

}