/*******************************************************************************
 * This is a modified version for sfDoctrineTree to work with Prototype,
 * Doctrine and Symfony. It add an Add Node item to the context menu and sends
 * Ajax requests though Prototype. 
 * Author: Arnoldas Lukasevicius - 2010 <arnoldas.lukasevicius@gmail.com>
 * Author: Jacques Philip - 2008 <jphilipatnoatakdotcom>
 * *****************************************************************************
 * Drag and drop folder tree Copyright (C) 2006 DTHMLGoodies.com, Alf Magne
 * Kalleland
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

var JSTreeObj;
var treeUlCounter = 0;
var nodeId = 1;

/* Constructor */
function JSDragDropTree() {
	var idOfTree;
	var imageFolder;
	var rootId;
	var model;
	var nameField;
	var deleteIcon;
	var renameIcon;
	var addIcon;
	var folderImage;
	var plusImage;
	var minusImage;
	var maximumDepth;
	var dragNode_source;
	var dragNode_parent;
	var dragNode_sourceNextSib;
	var dragNode_noSiblings;
	var linkPartial;
	var dragNode_destination;
	var floatingContainer;
	var dragDropTimer;
	var dropTargetIndicator;
	var insertAsSub;
	var indicator_offsetX;
	var indicator_offsetX_sub;
	var indicator_offsetY;
	var messageMaximumDepthReached;
	var filePathRenameItem;
	var filePathDeleteItem;
	var filePathAddItem;
	var filePathSaveTree;
	var additionalRenameRequestParameters = {};
	var additionalDeleteRequestParameters = {};
	var additionalAddRequestParameters = {};
	var renameAllowed;
	var deleteAllowed;
	var addAllowed;
	var currentlyActiveItem;

	var treeItems;
	var contextMenu;
	var rootNodeContextMenuModel;
	var nonRootNodeContextMenuModel;

	var currentItemToEdit; // Reference to item currently being edited(example:
	// renamed)
	var helpObj;
	this.rootId = 0;
	this.model = '';
	this.nameField = 'name';
	this.imageFolder = '/sfDoctrineTreePlugin/images/';
	this.folderImage = 'dhtmlgoodies_folder.gif';
	this.plusImage = 'dhtmlgoodies_plus.gif';
	this.minusImage = 'dhtmlgoodies_minus.gif';
	this.deleteIcon = 'tree_delete.png';
	this.renameIcon = 'tree_rename.png';
	this.addIcon = 'tree_add.png';
	this.maximumDepth = 6;

	this.treeItems = new Array();
	this.contextMenu = false;
	this.rootNodeContextMenuModel = false;
	this.nonRootNodeContextMenuModel = false;

	this.floatingContainer = document.createElement('UL');
	this.floatingContainer.style.position = 'absolute';
	this.floatingContainer.style.display = 'none';
	this.floatingContainer.id = 'floatingContainer';
	this.insertAsSub = false;
	document.body.appendChild(this.floatingContainer);
	this.dragDropTimer = -1;
	this.dragNode_noSiblings = false;
	this.currentItemToEdit = false;

	if (document.all) {
		this.indicator_offsetX = 2; // Offset position of small black lines
		// indicating where nodes would be dropped.
		this.indicator_offsetX_sub = 4;
		this.indicator_offsetY = 2;
	} else {
		this.indicator_offsetX = 1; // Offset position of small black lines
		// indicating where nodes would be dropped.
		this.indicator_offsetX_sub = 3;
		this.indicator_offsetY = 2;
	}
	if (Prototype.Browser.Opera) {
		this.indicator_offsetX = 2; // Offset position of small black lines
		// indicating where nodes would be dropped.
		this.indicator_offsetX_sub = 3;
		this.indicator_offsetY = -7;
	}

	this.messageMaximumDepthReached = ''; // Use '' if you don't want to
	// display a message

	this.renameAllowed = true;
	this.deleteAllowed = true;
	this.addAllowed = true;
	this.currentlyActiveItem = false;
	this.filePathRenameItem = 'folderTree_updateItem.php';
	this.filePathDeleteItem = 'folderTree_updateItem.php';
	this.filePathAddItem = 'folderTree_addItem.php';
	this.filePathSaveTree = 'folderTree_addItem.php';
	this.linkPartial = 'folderTree_addItem.php';
	this.ajaxObjects = new Array();
	this.helpObj = false;

	this.RENAME_STATE_BEGIN = 1;
	this.RENAME_STATE_CANCELED = 2;
	this.RENAME_STATE_REQUEST_SENDED = 3;
	this.renameState = null;
	this.ADD_STATE_BEGIN = 4;
	this.ADD_STATE_CANCELED = 5;
	this.ADD_STATE_REQUEST_SENDED = 6;
	this.addState = null;
}

/* JSDragDropTree class */
JSDragDropTree.prototype = {
	addEvent : function(whichObject, eventType, functionName) {
		if (whichObject.attachEvent) {
			whichObject['e' + eventType + functionName] = functionName;
			whichObject[eventType + functionName] = function() {
				whichObject['e' + eventType + functionName](window.event);
			};
			whichObject.attachEvent('on' + eventType, whichObject[eventType + functionName]);
		} else
			whichObject.addEventListener(eventType, functionName, false);
	}
	// }}}
	,
	removeEvent : function(whichObject, eventType, functionName) {
		if (whichObject.detachEvent) {
			whichObject.detachEvent('on' + eventType, whichObject[eventType + functionName]);
			whichObject[eventType + functionName] = null;
		} else
			whichObject.removeEventListener(eventType, functionName, false);
	},
	Get_Cookie : function(name) {
		var start = document.cookie.indexOf(name + "=");
		var len = start + name.length + 1;
		if ((!start) && (name != document.cookie.substring(0, name.length)))
			return null;
		if (start == -1)
			return null;
		var end = document.cookie.indexOf(";", len);
		if (end == -1)
			end = document.cookie.length;
		return unescape(document.cookie.substring(len, end));
	},
	// This function has been slightly modified
	Set_Cookie : function(name, value, expires, path, domain, secure) {
		expires = expires * 60 * 60 * 24 * 1000;
		var today = new Date();
		var expires_date = new Date(today.getTime() + (expires));
		var cookieString = name + "=" + escape(value)
				+ ((expires) ? ";expires=" + expires_date.toGMTString() : "")
				+ ((path) ? ";path=" + path : "")
				+ ((domain) ? ";domain=" + domain : "")
				+ ((secure) ? ";secure" : "");
		document.cookie = cookieString;
	},
	setFileNameRename : function(newFileName) {
		this.filePathRenameItem = newFileName;
	},
	setFileNameAdd : function(newFileName) {
		this.filePathAddItem = newFileName;
	},
	setFileNameSave : function(newFileName) {
		this.filePathSaveTree = newFileName;
	},
	setLinkPartial : function(newLinkPartial) {
		this.linkPartial = newLinkPartial;
	},
	setFileNameDelete : function(newFileName) {
		this.filePathDeleteItem = newFileName;
	},
	setAdditionalRenameRequestParameters : function(requestParameters) {
		this.additionalRenameRequestParameters = requestParameters;
	},
	setAdditionalAddRequestParameters : function(requestParameters) {
		this.additionalAddRequestParameters = requestParameters;
	},
	setAdditionalDeleteRequestParameters : function(requestParameters) {
		this.additionalDeleteRequestParameters = requestParameters;
	},
	setRenameAllowed : function(renameAllowed) {
		this.renameAllowed = renameAllowed;
	},
	setaddAllowed : function(addAllowed) {
		this.addAllowed = addAllowed;
	},
	setDeleteAllowed : function(deleteAllowed) {
		this.deleteAllowed = deleteAllowed;
	},
	setMaximumDepth : function(maxDepth) {
		this.maximumDepth = maxDepth;
	},
	setMessageMaximumDepthReached : function(newMessage) {
		this.messageMaximumDepthReached = newMessage;
	},
	setImageFolder : function(path) {
		this.imageFolder = path;
	},
	setNameField : function(name) {
		this.nameField = name;
	},
	setRootId : function(id) {
		this.rootId = id;
	},
	setModel : function(m) {
		this.model = m;
	},
	setFolderImage : function(imagePath) {
		this.folderImage = imagePath;
	},
	setDeleteIcon : function(deleteIcon) {
		this.deleteIcon = deleteIcon;
	},
	setRenameIcon : function(renameIcon) {
		this.renameIcon = renameIcon;
	},
	setAddIcon : function(addIcon) {
		this.addIcon = addIcon;
	},
	setPlusImage : function(imagePath) {
		this.plusImage = imagePath;
	},
	setMinusImage : function(imagePath) {
		this.minusImage = imagePath;
	},
	setTreeId : function(idOfTree) {
		this.idOfTree = idOfTree;
	},
	saveTreeState : function() {
		initExpandedNodes = ',';
		for ( var no = 0; no < this.treeItems.length; no++) {
			var subItems = this.treeItems[no].getElementsByTagName('UL');
			if (subItems.length > 0 && subItems[0].style.display == 'block') {
				thisNode = this.treeItems[no].getElementsByTagName('IMG')[0];
				if (thisNode.src.indexOf(JSTreeObj.minusImage) >= 0)
					initExpandedNodes = initExpandedNodes + this.treeItems[no].id.substring(4) + ',';
			}
		}
		JSTreeObj.Set_Cookie('dhtmlgoodies_expandedNodes', initExpandedNodes, 500);
	},
	expand : function(level) {
		for ( var no = 0; no < level; no++) {
			var subItems = this.treeItems[no].getElementsByTagName('UL');
			if (subItems.length > 0 && subItems[0].style.display != 'block') {
				JSTreeObj.showHideNode(false, this.treeItems[no].id);
			}
		}
	},
	isExpandedAll : function() {
		for ( var no = 0; no < this.treeItems.length; no++) {
			var subItems = this.treeItems[no].getElementsByTagName('UL');
			if (subItems.length > 0 && subItems[0].style.display !== 'block') {
				var thisNode = document.getElementById(this.treeItems[no].id);
				if(thisNode !== false){
					var thisPicture = thisNode.getElementsByTagName('IMG')[0];
					if (thisPicture !== false && thisPicture.style.visibility !== 'hidden') {
						if (thisPicture.src.indexOf(JSTreeObj.plusImage) >= 0) {						
							return false;
						}
					}
				}
			}
		}
		return true;
	},
	expandAll : function() {
		this.expand(this.treeItems.length);
		this.__updateRootNodeExpandCollapseMenuItems();
		this.rootNodeContextMenuModel.init();
	},	
	isCollapsedAll : function() {						
		for ( var no = 0; no < this.treeItems.length; no++) {			
			var subItems = this.treeItems[no].getElementsByTagName('UL');
			if (subItems.length > 0 && subItems[0].style.display == 'block') {
				var thisNode = document.getElementById(this.treeItems[no].id);
				var thisPicture = thisNode.getElementsByTagName('IMG')[0];
				if (thisPicture !== false && thisPicture.style.visibility !== 'hidden') {					
					if (thisPicture.src.indexOf(JSTreeObj.minusImage) >= 0) {						
						return false;
					}
				}
			}
		}
		return true;
	},
	collapseAll : function() {
		for ( var no = 0; no < this.treeItems.length; no++) {
			var subItems = this.treeItems[no].getElementsByTagName('UL');
			if (subItems.length > 0 && subItems[0].style.display == 'block') {
				JSTreeObj.showHideNode(false, this.treeItems[no].id);
			}
		}
		this.__updateRootNodeExpandCollapseMenuItems();
		this.rootNodeContextMenuModel.init();
	},
	/*
	 * Find top pos of a tree node
	 */
	getTopPos : function(obj) {
		var top = obj.offsetTop / 1;
		while ((obj = obj.offsetParent) != null) {
			if (obj.tagName != 'HTML')
				top += obj.offsetTop;
		}
		if (document.all)
			top = top / 1 + 13;
		else
			top = top / 1 + 4;
		return top;
	},
	/*
	 * Find left pos of a tree node
	 */
	getLeftPos : function(obj) {
		var left = obj.offsetLeft / 1 + 1;
		while ((obj = obj.offsetParent) != null) {
			if (obj.tagName != 'HTML')
				left += obj.offsetLeft;
		}

		if (document.all)
			left = left / 1 - 2;
		return left;
	},
	showHideNode : function(e, inputId) {
		if (inputId) {
			if (!document.getElementById(inputId))
				return;
			thisNode = document.getElementById(inputId).getElementsByTagName(
					'IMG')[0];
		} else {
			thisNode = this;
			if (this.tagName == 'A')
				thisNode = this.parentNode.getElementsByTagName('IMG')[0];
		}
		if (!thisNode)
			return;
		if (thisNode.style.visibility == 'hidden')
			return;
		var parentNode = thisNode.parentNode;
		inputId = parentNode.id.substring(4);
		if (thisNode.src.indexOf(JSTreeObj.plusImage) >= 0) {
			thisNode.src = thisNode.src.replace(JSTreeObj.plusImage,
					JSTreeObj.minusImage);
			var ul = parentNode.getElementsByTagName('UL')[0];
			ul.style.display = 'block';
			if (!initExpandedNodes)
				initExpandedNodes = ',';
			if (initExpandedNodes.indexOf(',' + inputId + ',') < 0)
				initExpandedNodes = initExpandedNodes + inputId + ',';
		} else {
			thisNode.src = thisNode.src.replace(JSTreeObj.minusImage,
					JSTreeObj.plusImage);
			parentNode.getElementsByTagName('UL')[0].style.display = 'none';
			initExpandedNodes = initExpandedNodes.replace(',' + inputId, '');
		}
		JSTreeObj.Set_Cookie('dhtmlgoodies_expandedNodes', initExpandedNodes,
				500);

		if (e !== false) {
			JSTreeObj.__updateRootNodeExpandCollapseMenuItems();
			JSTreeObj.rootNodeContextMenuModel.init();
		}

		return false;
	},
	/* Initialize drag */
	initDrag : function(e) {
		if (document.all)
			e = event;
		var subs = JSTreeObj.floatingContainer.getElementsByTagName('LI');
		if (subs.length > 0) {
			if (JSTreeObj.dragNode_sourceNextSib) {
				JSTreeObj.dragNode_parent.insertBefore(
						JSTreeObj.dragNode_source,
						JSTreeObj.dragNode_sourceNextSib);
			} else {
				JSTreeObj.dragNode_parent
						.appendChild(JSTreeObj.dragNode_source);
			}
		}

		JSTreeObj.dragNode_source = this.parentNode;
		JSTreeObj.dragNode_parent = this.parentNode.parentNode;
		JSTreeObj.dragNode_sourceNextSib = false;

		if (JSTreeObj.dragNode_source.nextSibling)
			JSTreeObj.dragNode_sourceNextSib = JSTreeObj.dragNode_source.nextSibling;
		JSTreeObj.dragNode_destination = false;
		JSTreeObj.dragDropTimer = 0;
		JSTreeObj.timerDrag();
		return false;
	},
	timerDrag : function() {
		if (this.dragDropTimer >= 0 && this.dragDropTimer < 10) {
			this.dragDropTimer = this.dragDropTimer + 1;
			setTimeout('JSTreeObj.timerDrag()', 20);
			return;
		}
		if (this.dragDropTimer == 10) {
			JSTreeObj.floatingContainer.style.display = 'block';
			JSTreeObj.floatingContainer.appendChild(JSTreeObj.dragNode_source);
		}
	},
	moveDragableNodes : function(e) {
		if (JSTreeObj.dragDropTimer < 10)
			return;
		if (document.all)
			e = event;
		dragDrop_x = e.clientX / 1 + 5 + document.body.scrollLeft;
		dragDrop_y = e.clientY / 1 + 5 + document.documentElement.scrollTop;

		JSTreeObj.floatingContainer.style.left = dragDrop_x + 'px';
		JSTreeObj.floatingContainer.style.top = dragDrop_y + 'px';

		var thisObj = this;
		if (thisObj.tagName == 'A' || thisObj.tagName == 'IMG')
			thisObj = thisObj.parentNode;

		JSTreeObj.dragNode_noSiblings = false;
		var tmpVar = thisObj.getAttribute('noSiblings');
		if (!tmpVar)
			tmpVar = thisObj.noSiblings;
		if (tmpVar == 'true')
			JSTreeObj.dragNode_noSiblings = true;

		if (thisObj && thisObj.id) {
			JSTreeObj.dragNode_destination = thisObj;
			var img = thisObj.getElementsByTagName('IMG')[1];
			var tmpObj = JSTreeObj.dropTargetIndicator;
			tmpObj.style.display = 'block';

			var eventSourceObj = this;
			if (JSTreeObj.dragNode_noSiblings
					&& eventSourceObj.tagName == 'IMG')
				eventSourceObj = eventSourceObj.nextSibling;

			var tmpImg = tmpObj.getElementsByTagName('IMG')[0];
			if (this.tagName == 'A' || JSTreeObj.dragNode_noSiblings) {
				tmpImg.src = tmpImg.src.replace('ind1', 'ind2');
				JSTreeObj.insertAsSub = true;
				tmpObj.style.left = (JSTreeObj.getLeftPos(eventSourceObj) + JSTreeObj.indicator_offsetX_sub) + 'px';
			} else {
				tmpImg.src = tmpImg.src.replace('ind2', 'ind1');
				JSTreeObj.insertAsSub = false;
				tmpObj.style.left = (JSTreeObj.getLeftPos(eventSourceObj) + JSTreeObj.indicator_offsetX) + 'px';
			}

			tmpObj.style.top = (JSTreeObj.getTopPos(thisObj) + JSTreeObj.indicator_offsetY) + 'px';
		}
		return false;
	},
	dropDragableNodes : function() {
		if (JSTreeObj.dragDropTimer < 10) {
			JSTreeObj.dragDropTimer = -1;
			return;
		}
		if (JSTreeObj.dragNode_destination) { // Check depth
			var countUp = JSTreeObj.dragDropCountLevels(
					JSTreeObj.dragNode_destination, 'up');
			var countDown = JSTreeObj.dragDropCountLevels(
					JSTreeObj.dragNode_source, 'down');
			var countLevels = countUp / 1 + countDown / 1
					+ (JSTreeObj.insertAsSub ? 1 : 0);

			if (countLevels > JSTreeObj.maximumDepth) {
				if (JSTreeObj.messageMaximumDepthReached) {
					alert(JSTreeObj.messageMaximumDepthReached);
				}
				JSTreeObj.__revertDrag();
			} else {
				new Ajax.Request(
						JSTreeObj.filePathSaveTree,
						{
							parameters : {
								model : JSTreeObj.model,
								field : JSTreeObj.nameField,
								rootId : JSTreeObj.rootId,
								dragHistory : (function(JSTreeObj) {
									if (JSTreeObj.insertAsSub) {
										return [
												JSTreeObj.dragNode_source.id
														.substring(4),
												'moveAsFirstChildOf',
												JSTreeObj.dragNode_destination.id
														.substring(4) ];
									} else {
										var nextSib = Element.next(
												JSTreeObj.dragNode_destination,
												'li');
										if (nextSib) {
											return [
													JSTreeObj.dragNode_source.id
															.substring(4),
													'moveAsPrevSiblingOf',
													nextSib.id.substring(4) ];
										} else {
											return [
													JSTreeObj.dragNode_source.id
															.substring(4),
													'moveAsLastChildOf',
													JSTreeObj.dragNode_destination.parentNode.parentNode.id
															.substring(4) ];
										}
									}
								})(JSTreeObj).toJSON()
							},
							onFailure : function(transport) {
								JSTreeObj.__revertDrag();
								alert('Error in the Ajax request: ' + transport.statusText);
							},
							onSuccess : function(transport) {
								var hResponse = false;
								if(transport.responseText.isJSON())								
									hResponse = transport.responseText.evalJSON(true);								
								if (hResponse) { // almost last line of defence
									if (hResponse.status == 'OK') { // very last line of defence
										if (JSTreeObj.insertAsSub) {
											var uls = JSTreeObj.dragNode_destination.getElementsByTagName('UL');
											if (uls.length > 0) {
												ul = uls[0];
												ul.style.display = 'block';
												var lis = ul.getElementsByTagName('LI');
												if (lis.length > 0) {
													ul.insertBefore(JSTreeObj.dragNode_source,lis[0]);
												} else {
													ul.appendChild(JSTreeObj.dragNode_source);
												}
											} else {
												var ul = document.createElement('UL');
												ul.style.display = 'block';
												JSTreeObj.dragNode_destination.appendChild(ul);
												ul.appendChild(JSTreeObj.dragNode_source);
											}
											var img = JSTreeObj.dragNode_destination.getElementsByTagName('IMG')[0];
											img.style.visibility = 'visible';
											img.src = img.src.replace(JSTreeObj.plusImage, JSTreeObj.minusImage);
										} else {
											var nextSib = Element.next(JSTreeObj.dragNode_destination,'li');
											if (nextSib) {
												nextSib.parentNode.insertBefore(JSTreeObj.dragNode_source,nextSib);
											} else {
												JSTreeObj.dragNode_destination.parentNode.appendChild(JSTreeObj.dragNode_source);
											}
										}
									} else {
										JSTreeObj.__revertDrag();
										alert('Error in the Ajax request: ' + hResponse.status);
									}
								} else {
									JSTreeObj.__revertDrag();
									alert('Error in the Ajax request: ' + transport.responseText);
								}
							},
							onLoading : function() {
								Element.show('doctrine_tree_indicator');
							},
							onComplete : function() {
								Element.hide('doctrine_tree_indicator');
							}
						});
			}
		} else {
			JSTreeObj.__revertDrag();
		}
		JSTreeObj.dropTargetIndicator.style.display = 'none';
		JSTreeObj.dragDropTimer = -1;
	},
	__revertDrag : function() {
		// Putting the item back to it's original location
		if (JSTreeObj.dragNode_sourceNextSib) {
			JSTreeObj.dragNode_parent.insertBefore(JSTreeObj.dragNode_source, JSTreeObj.dragNode_sourceNextSib);
		} else {
			JSTreeObj.dragNode_parent.appendChild(JSTreeObj.dragNode_source);
		}
	},
	createDropIndicator : function() {
		this.dropTargetIndicator = document.createElement('DIV');
		this.dropTargetIndicator.style.position = 'absolute';
		this.dropTargetIndicator.style.display = 'none';
		var img = document.createElement('IMG');
		img.src = this.imageFolder + 'dragDrop_ind1.gif';
		img.id = 'dragDropIndicatorImage';
		this.dropTargetIndicator.appendChild(img);
		document.body.appendChild(this.dropTargetIndicator);

	},
	dragDropCountLevels : function(obj, direction, stopAtObject) {
		var countLevels = 0;
		if (direction == 'up') {
			while (obj.parentNode && obj.parentNode != stopAtObject) {
				obj = obj.parentNode;
				if (obj.tagName == 'UL')
					countLevels = countLevels / 1 + 1;
			}
			return countLevels;
		}

		if (direction == 'down') {
			var subObjects = obj.getElementsByTagName('LI');
			for ( var no = 0; no < subObjects.length; no++) {
				countLevels = Math.max(countLevels, JSTreeObj.dragDropCountLevels(subObjects[no], "up", obj));
			}
			return countLevels;
		}
	},
	cancelEvent : function() {
		return false;
	},
	cancelSelectionEvent : function() {

		if (JSTreeObj.dragDropTimer < 10)
			return true;
		return false;
	},
	highlightItem : function(inputObj, e) {
		if (JSTreeObj.currentlyActiveItem)
			JSTreeObj.currentlyActiveItem.className = '';
		this.className = 'highlightedNodeItem';
		JSTreeObj.currentlyActiveItem = this;
	},
	removeHighlight : function() {
		if (JSTreeObj.currentlyActiveItem)
			JSTreeObj.currentlyActiveItem.className = '';
		JSTreeObj.currentlyActiveItem = false;
	},
	hasSubNodes : function(obj) {
		var subs = obj.getElementsByTagName('LI');
		if (subs.length > 0)
			return true;
		return false;
	},
	deleteItem : function(obj1, obj2) {
		var message = 'Click OK to delete item ' + obj2.innerHTML;
		if (this.hasSubNodes(obj2.parentNode)) {
			message = message + ' and it\'s sub nodes';
		}
		this.contextMenu.__hideContextMenu();
		if (confirm(message)) {
			new Ajax.Request(
					JSTreeObj.filePathDeleteItem,
					{
						parameters : {
							id : obj2.parentNode.id.substring(4),
							model : JSTreeObj.model,
							field : JSTreeObj.nameField
						},
						onFailure : function(transport) {
							alert('Error in the Ajax request: ' + transport.statusText);
						},
						onSuccess : function(transport) {
							var hResponse = false;
							if(transport.responseText.isJSON())
								hResponse = transport.responseText.evalJSON(true);
							if (hResponse) { // almost last line of defence
								if (hResponse.status == 'OK') { // very last line of defence
									var obj3 = obj2.parentNode.parentNode;
									obj3.removeChild(obj2.parentNode);
									if (!JSTreeObj.hasSubNodes(obj3.parentNode)) {
										var img = obj3.parentNode.getElementsByTagName('IMG')[0];
										img.style.visibility = 'hidden';
									}
								} else {
									alert('Error in the Ajax request: ' + hResponse.status);
								}
							} else {
								alert('Error in the Ajax request: ' + transport.responseText);
							}																					
						},
						onLoading : function() {
							Element.show('doctrine_tree_indicator');
						},
						onComplete : function() {
							Element.hide('doctrine_tree_indicator');
						}
					});
		}
	},
	__saveRenameTextBoxChanges : function(e, inputObj) {
		if (inputObj && inputObj.value.length <= 0)
			this.__cancelRename(false, this);
		if (!inputObj && this)
			inputObj = this;
		if (document.all)
			e = event;
		if (e.keyCode && e.keyCode == 27) {
			JSTreeObj.__cancelRename(e, inputObj);
			return;
		}

		// Send changes to the server.
		if (JSTreeObj.renameState != JSTreeObj.RENAME_STATE_BEGIN) {
			return;
		}
		JSTreeObj.renameState = JSTreeObj.RENAME_STATE_REQUEST_SENDED;

		renameId = inputObj.parentNode.id.substring(4);

		new Ajax.Request(JSTreeObj.filePathRenameItem, {
			parameters : {
				id : renameId,
				model : JSTreeObj.model,
				field : JSTreeObj.nameField,
				value : inputObj.value
			},
			onFailure : function(transport) {
				alert('Error in the Ajax request: ' + transport.statusText);
				JSTreeObj.__cancelRename(false, inputObj);
			},
			onSuccess : function(transport) {
				var hResponse = false;
				if(transport.responseText.isJSON())
					hResponse = transport.responseText.evalJSON(true);
				if (hResponse) { // almost last line of defence
					if (hResponse.status == 'OK') { // very last line of defence
						inputObj.style.display = 'none';
						inputObj.nextSibling.style.visibility = 'visible';
						if (inputObj.value.length > 0) {
							inputObj.nextSibling.innerHTML = inputObj.value;
						}
					} else {
						JSTreeObj.__cancelRename(false, inputObj);
						alert('Error in the Ajax request: ' + hResponse.status);
					}
				} else {
					JSTreeObj.__cancelRename(false, inputObj);
					alert('Error in the Ajax request: ' + transport.responseText);
				}								
			},
			onLoading : function() {
				Element.show('doctrine_tree_indicator');
			},
			onComplete : function() {
				Element.hide('doctrine_tree_indicator');
				JSTreeObj.renameState = null;
			}
		});
	},
	__cancelRename : function(e, inputObj) {
		JSTreeObj.renameState = JSTreeObj.RENAME_STATE_CANCELED;
		if (!inputObj && this)
			inputObj = this;
		inputObj.value = JSTreeObj.helpObj.innerHTML;
		inputObj.nextSibling.innerHTML = JSTreeObj.helpObj.innerHTML;
		inputObj.style.display = 'none';
		inputObj.nextSibling.style.visibility = 'visible';
	},
	renameItem : function(obj1, obj2) {
		if (JSTreeObj.renameState == JSTreeObj.RENAME_STATE_REQUEST_SENDED) {
			return;
		}
		currentItemToEdit = obj2.parentNode; // Reference to the <li> tag.
		if (!obj2.previousSibling
				|| obj2.previousSibling.tagName.toLowerCase() != 'input') {
			var textBox = document.createElement('INPUT');
			textBox.className = 'folderTreeTextBox';
			textBox.value = obj2.innerHTML;
			obj2.parentNode.insertBefore(textBox, obj2);
			textBox.id = 'textBox' + obj2.parentNode.id.substring(4);
			textBox.onblur = function(e) {
				this.__saveRenameTextBoxChanges;
			}, textBox.onkeydown = function(e) {
				if (document.all)
					e = event;
				inputObj = Event.element(e);
				if (e.keyCode == 13) { // Enter pressed
					JSTreeObj.__saveRenameTextBoxChanges(e, inputObj);
				}
				if (e.keyCode == 27) { // ESC pressed
					JSTreeObj.__cancelRename(false, inputObj);
				}
			};
		}
		JSTreeObj.renameState = JSTreeObj.RENAME_STATE_BEGIN;
		obj2.style.visibility = 'hidden';
		obj2.previousSibling.value = obj2.innerHTML;
		obj2.previousSibling.style.display = 'inline';
		obj2.previousSibling.select();

		this.helpObj.innerHTML = obj2.innerHTML;

	},
	__addComplete : function(obj, response) {
		id = obj.parentNode.id.substring(4);
		initExpandedNodes = this.Get_Cookie('dhtmlgoodies_expandedNodes');
		if (initExpandedNodes.indexOf(',' + id + ',') < 0)
			initExpandedNodes = initExpandedNodes + id + ',';
		JSTreeObj.Set_Cookie('dhtmlgoodies_expandedNodes', initExpandedNodes,
				500);

		hResponse = response.evalJSON(true);
		var ul = Element.down(obj.parentNode, 'ul');
		if (!ul) {
			ul = document.createElement('UL');
			obj.parentNode.appendChild(ul);
		}
		var li = document.createElement('LI');
		li.id = 'node' + hResponse.id;
		ul.appendChild(li);
		var a = document.createElement('A');
		a.id = 'nodeATag' + hResponse.id;
		li.appendChild(a);
		Element.replace('nodeATag' + hResponse.id, hResponse.partial);
		a.id = 'nodeATag' + hResponse.id;
		JSTreeObj.addNode(li);
		var img = Element.down(obj.parentNode, 'img');
		img.style.visibility = 'visible';
		if (img.src.indexOf(JSTreeObj.plusImage) >= 0)
			JSTreeObj.showHideNode(false, obj.parentNode.id);
		this.__attachContextMenuToTreeItem(false, li.id);
	},
	__saveAddItem : function(child, parent, childName) {
		if (JSTreeObj.addState != JSTreeObj.ADD_STATE_BEGIN) {
			return;
		}
		JSTreeObj.addState = JSTreeObj.ADD_STATE_BEGIN;

		parentId = parent.parentNode.id.substring(4);

		new Ajax.Request(
				JSTreeObj.filePathAddItem,
				{
					parameters : {
						id : parentId,
						model : JSTreeObj.model,
						field : JSTreeObj.nameField,
						value : childName,
						root : JSTreeObj.rootId,
						linkPartial : JSTreeObj.linkPartial
					},
					onFailure : function(transport) {
						alert('Error in the Ajax request: ' + transport.statusText);
					},
					onSuccess : function(transport) {
						var hResponse = false;
						if(transport.responseText.isJSON())
							hResponse = transport.responseText.evalJSON(true);
						if (hResponse) { // almost last line of defence							
							if (hResponse.status == 'OK') { // very last line of defence
								JSTreeObj.__addComplete(parent, transport.responseText);
							} else {
								alert('Error in the Ajax request: ' + hResponse.status);
							}
						} else {
							alert('Error in the Ajax request: ' + transport.responseText);
						}
					},
					onLoading : function() {
						Element.show('doctrine_tree_indicator');
					},
					onComplete : function() {
						Element.hide('doctrine_tree_indicator');
						JSTreeObj.addState = null;
					}
				});
	},
	addItem : function(child, parent) {
		this.contextMenu.__hideContextMenu();
		var count = JSTreeObj.dragDropCountLevels(parent, 'up');
		if (count >= JSTreeObj.maximumDepth
				&& JSTreeObj.messageMaximumDepthReached) {
			alert(JSTreeObj.messageMaximumDepthReached);
			return;
		}
		if (JSTreeObj.addState == JSTreeObj.ADD_STATE_REQUEST_SENDED) {
			return;
		}
		var childName = prompt('Add a child to ' + parent.text + ':');
		if (childName && childName.length > 0) {
			JSTreeObj.addState = JSTreeObj.ADD_STATE_BEGIN;
			this.__saveAddItem(child, parent, childName);
		}
	},
	addNode : function(node) {
		// No children var set ?
		var noChildren = false;
		var tmpVar = node.getAttribute('noChildren');
		if (!tmpVar)
			tmpVar = node.noChildren;
		if (tmpVar == 'true')
			noChildren = true;
		// No drag var set ?
		var noDrag = false;
		var tmpVar = node.getAttribute('noDrag');
		if (!tmpVar)
			tmpVar = node.noDrag;
		if (tmpVar == 'true' || tmpVar == true)
			noDrag = true;

		nodeId++;

		var subItems = node.getElementsByTagName('UL');
		var img = document.createElement('IMG');
		img.src = this.imageFolder + this.plusImage;
		img.onclick = this.showHideNode;

		if (subItems.length == 0)
			img.style.visibility = 'hidden';
		else {
			subItems[0].id = 'tree_ul_' + treeUlCounter;
			subItems[0].style.display = 'none';
			treeUlCounter++;
		}

		node.getElementsByTagName('A')[0].id = 'nodeATag' + node.id
				.substring(4);

		var aTag = node.getElementsByTagName('A')[0];

		if (!noDrag)
			aTag.onmousedown = JSTreeObj.initDrag;
		if (!noChildren)
			aTag.onmousemove = JSTreeObj.moveDragableNodes;
		node.insertBefore(img, aTag);

		// node.id = 'dhtmlgoodies_treeNode' + nodeId;
		var folderImg = document.createElement('IMG');
		if (!noDrag)
			folderImg.onmousedown = JSTreeObj.initDrag;
		folderImg.onmousemove = JSTreeObj.moveDragableNodes;
		if (node.className) {
			folderImg.src = this.imageFolder + node.className;
		} else {
			folderImg.src = this.imageFolder + this.folderImage;
		}
		node.insertBefore(folderImg, aTag);
	},
	initTree : function() {

		nodeId = 0;
		JSTreeObj = this;
		window.refToDragDropTree = this;

		document.documentElement.onselectstart = JSTreeObj.cancelSelectionEvent;
		document.documentElement.onmousemove = JSTreeObj.moveDragableNodes;
		document.documentElement.onmousedown = JSTreeObj.removeHighlight;
		document.documentElement.onmouseup = JSTreeObj.dropDragableNodes;
		document.documentElement.ondragstart = JSTreeObj.cancelEvent;

		JSTreeObj.createDropIndicator();

		/* Creating help object for storage of values */
		this.helpObj = document.createElement('DIV');
		this.helpObj.style.display = 'none';
		document.body.appendChild(this.helpObj);

		this.treeItems = document.getElementById(this.idOfTree)
				.getElementsByTagName('LI');
		for ( var no = 0; no < this.treeItems.length; no++)
			this.addNode(this.treeItems[no]);

		initExpandedNodes = this.Get_Cookie('dhtmlgoodies_expandedNodes');
		if (initExpandedNodes) {
			var nodes = initExpandedNodes.split(',');
			for ( var no = 0; no < nodes.length; no++) {
				if (nodes[no])
					this.showHideNode(false, 'node' + nodes[no]);
			}
		}
		this.contextMenu = new DHTMLGoodies_contextMenu();
		referenceToDHTMLSuiteContextMenu = this.contextMenu;
		this.contextMenu.setWidth(120);

		if (this.treeItems.length > 0) {
			this.__createRootNodeContextMenu();
			this.__createNonRootNodesContextMenu();
		}
	},

	__updateRootNodeExpandCollapseMenuItems : function() {
		var noExpandCollapseAll = this.treeItems[0].getAttribute('noExpandCollapseAll');
		if (!noExpandCollapseAll) {
			noExpandCollapseAll = this.treeItems[0].noExpandCollapseAll;
		}
		if (!noExpandCollapseAll) {
			for ( var no = 0; no < this.rootNodeContextMenuModel.menuItems.length; no++) {
				if (this.rootNodeContextMenuModel.menuItems[no].id == 101) {
					this.rootNodeContextMenuModel.menuItems.splice(no, 1);
				}
			}

			for ( var no = 0; no < this.rootNodeContextMenuModel.menuItems.length; no++) {
				if (this.rootNodeContextMenuModel.menuItems[no].id == 102) {
					this.rootNodeContextMenuModel.menuItems.splice(no, 1);
				}
			}			
			
			if (!this.isExpandedAll()) {				
				this.rootNodeContextMenuModel.addItem(101, 'Expand all', this.imageFolder + JSTreeObj.minusImage, '', false,'JSTreeObj.expandAll');
			}

			if (!this.isCollapsedAll()) {				
				/* 
				 * If root node is collapsed do not show "Collapse All" context 
				 * menu item even some internal children nodes are not collapsed
				*/				
				var thisNode = document.getElementById(this.treeItems[0].id);
				var thisPicture = thisNode.getElementsByTagName('IMG')[0];
				if (thisPicture !== false && thisPicture.style.visibility !== 'hidden') {					
					if (thisPicture.src.indexOf(JSTreeObj.minusImage) >= 0) {						
						this.rootNodeContextMenuModel.addItem(102, 'Collapse all',this.imageFolder + JSTreeObj.plusImage, '', false,'JSTreeObj.collapseAll');
					}
				}				
			}
		}
	},

	__createRootNodeContextMenu : function() {
		if (this.treeItems.length > 1) {
			var noDelete = this.treeItems[0].getAttribute('noDelete');
			if (!noDelete) {
				noDelete = this.treeItems[0].noDelete;
			}
			var noRename = this.treeItems[0].getAttribute('noRename');
			if (!noRename) {
				noRename = this.treeItems[0].noRename;
			}
			var noAdd = this.treeItems[0].getAttribute('noAdd');
			if (!noAdd) {
				noAdd = this.treeItems[0].noAdd;
			}
			this.rootNodeContextMenuModel = new DHTMLGoodies_menuModel();
			if (!noRename) {
				this.rootNodeContextMenuModel.addItem(1, 'Rename',
						JSTreeObj.imageFolder + JSTreeObj.renameIcon, '',
						false, 'JSTreeObj.renameItem');
			}
			if (!noDelete) {
				this.rootNodeContextMenuModel.addItem(2, 'Delete',
						JSTreeObj.imageFolder + JSTreeObj.deleteIcon, '',
						false, 'JSTreeObj.deleteItem');
			}
			if (!noAdd) {
				this.rootNodeContextMenuModel.addItem(3, 'Add child',
						JSTreeObj.imageFolder + JSTreeObj.addIcon, '', false,
						'JSTreeObj.addItem');
			}

			this.__updateRootNodeExpandCollapseMenuItems();

			if (this.rootNodeContextMenuModel.menuItems.length > 0) {
				this.rootNodeContextMenuModel.init();
				this.__attachContextMenuToTreeItem(true, 0);
			}
		}
	},

	__createNonRootNodesContextMenu : function() {
		if (this.treeItems.length > 1) {
			this.nonRootNodeContextMenuModel = new DHTMLGoodies_menuModel();
			if (this.renameAllowed) {
				this.nonRootNodeContextMenuModel.addItem(4, 'Rename',
						JSTreeObj.imageFolder + JSTreeObj.renameIcon, '',
						false, 'JSTreeObj.renameItem');
			}
			if (this.deleteAllowed) {
				this.nonRootNodeContextMenuModel.addItem(5, 'Delete',
						JSTreeObj.imageFolder + JSTreeObj.deleteIcon, '',
						false, 'JSTreeObj.deleteItem');
			}
			if (this.addAllowed) {
				this.nonRootNodeContextMenuModel.addItem(6, 'Add child',
						JSTreeObj.imageFolder + JSTreeObj.addIcon, '', false,
						'JSTreeObj.addItem');
			}
			if (this.nonRootNodeContextMenuModel.menuItems.length > 0) {
				this.nonRootNodeContextMenuModel.init();
				for ( var no = 1; no < this.treeItems.length; no++) {
					this.__attachContextMenuToTreeItem(false, no);
				}
			}
		}

	},
	__attachContextMenuToTreeItem : function(isRootElement, no) {
		var aTag = this.treeItems[no].getElementsByTagName('A')[0];
		if (!isRootElement) {
			this.contextMenu.attachToElement(aTag, aTag.id,
					this.nonRootNodeContextMenuModel);
		} else {
			this.contextMenu.attachToElement(aTag, aTag.id,
					this.rootNodeContextMenuModel);
		}
		this.addEvent(aTag, 'contextmenu', this.highlightItem);
	}

	,
	__addAdditionalRequestParameters : function(ajax, parameters) {
		for ( var parameter in parameters) {
			ajax.setVar(parameter, parameters[parameter]);
		}
	}
};