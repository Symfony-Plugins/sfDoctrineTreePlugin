<?php
function get_doctrine_tree($model, $field, $root = 0, $options = array(), $query = null)
{  
  $module = 'sfDoctrineTree';
  
  $rename_url = sfConfig::get('app_doctrine_tree_rename_url', $module.'/rename');
  $delete_url = sfConfig::get('app_doctrine_tree_delete_url', $module.'/delete');
  $add_child_url = sfConfig::get('app_doctrine_tree_add_child_url', $module.'/add_child');
  $save_tree_url = sfConfig::get('app_doctrine_tree_save_tree_url', $module.'/save_tree');
  
  $response = sfContext::getInstance()->getResponse();
  $response->addJavascript(sfConfig::get('sf_prototype_web_dir'). '/js/prototype');
    
  $response->addStylesheet('/'.$module.'Plugin/css/drag-drop-folder-tree');
  $response->addJavascript('/'.$module.'Plugin/js/drag-drop-folder-tree');
  $response->addJavascript('/'.$module.'Plugin/js/context-menu');  
  
  $link_partial = _get_option($options, 'link_partial');
  $no_help = _get_option($options, 'no_help');
  if (!$max_depth = _get_option($options, 'max_depth')) $max_depth = 6;    
  $no_root_rename = _get_option($options, 'no_root_rename');
  $no_root_expand_collapse_all  = _get_option($options, 'no_root_expand_collapse_all');
  
  return get_component('sfDoctrineTree', 'tree', 
  			array( 
  				'model' => $model, 
  				'field' => $field, 
    			'root' => $root,
  				'max_depth' => $max_depth, 
    			'link_partial' => $link_partial, 
    			'no_root_rename' => $no_root_rename,  			    
  				'no_root_expand_collapse_all' => $no_root_expand_collapse_all, 
    			'no_help' => $no_help, 
    			'options' => $options, 
    			'query' => $query,
  				'root' => $root,
   				'field' => $field,
  				'model' => $model,
  				'filePathRenameItem' => url_for($rename_url, true),
  				'filePathDeleteItem' => url_for($delete_url, true),
  				'filePathAddItem' => url_for($add_child_url, true),
  				'filePathSaveTree' => url_for($save_tree_url, true),
  				'linkPartial' => ($link_partial ? $link_partial : '')));    
}

function include_doctrine_tree($model, $field, $root = 0, $options = array(), $query = null)
{
  echo get_doctrine_tree($model, $field, $root, $options, $query);
}