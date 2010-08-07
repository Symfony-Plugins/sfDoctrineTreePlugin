<?php if (!function_exists('javascript_tag'))
        try {
            use_helper('Javascript');
        } catch (Exception $e) { }; 
    
    if (!function_exists('javascript_tag'))
        use_helper('JavascriptBase');
        
    use_helper('DoctrineTree');     
?>
<div class="doctrine_tree_container" id="<?php echo $model; ?>_doctrine_tree_container">
	<div id='doctrine_tree_links'>				
		<?php if (!$no_help): ?>
		&nbsp;&nbsp;&nbsp;
		<a href="#" onclick="$('doctrine_tree_help').toggle(); return false;">Help</a>
		<?php endif; ?>
	</div>
	
	<?php if (!$no_help): ?>
	 <div id ='doctrine_tree_help' style='display:none;'>
		<?php include_partial('sfDoctrineTree/help'); ?>
		<a onclick="$('doctrine_tree_help').toggle(); return false;" href="#">[X] Hide help</a>
	</div>		
	<?php endif; ?>
	      	
	<?php if( isset($records) && is_object($records) && $records->count() > 0 ): ?>	
	  <?php	   
	  $prevLevel = 0;  
	  $noRootAttr =  " noDrag='true' noSiblings='true' noDelete='true'";	  
	  if ($no_root_rename) {
	  	$noRootAttr .= " noRename='true'";
	  }	  
	  if ($no_root_expand_collapse_all) {
	  	$noRootAttr .= " noExpandCollapseAll='true'";
	  }	    
	  if (isset($options['noAdd']) && $options['noAdd']) { 
	  	$noRootAttr .= " noAdd='true'";
	  }	  	  	  
	  if (is_object($options) && get_class($options) == 'sfOutputEscaperArrayDecorator') {
	  	$options = $options->getRawValue();
	  }	    
	  $nodeNoAttr = _tag_options($options);
	  ?>	
	  <ul id="dhtmlgoodies_tree2" class="dhtmlgoodies_tree">      
	  <?php foreach($records as $record): ?>
	  
	  <?php 
	  $noAttr = $record->getNode()->getLevel() == 0 ?  $noRootAttr : $nodeNoAttr;
	  $identifier = $record->identifier();
	  if (is_object($identifier) && get_class($identifier) == 'sfOutputEscaperArrayDecorator')
	  {
	    $identifier = $identifier->getRawValue();
	  }
	  $identifier = array_values($identifier); 
	  ?>	  
	  <?php if($prevLevel > 0 && $record->getNode()->getLevel() == $prevLevel): ?> 
	  	</li>
	  <?php endif; ?>
	    
	  <?php if($record->getNode()->getLevel() > $prevLevel)  
	  		echo '<ul>'; 
	  	elseif ($record->getNode()->getLevel() < $prevLevel) 
	  		echo str_repeat('</ul></li>', $prevLevel - $record->getNode()->getLevel()); 
	  ?>	  	
	  <li id ="node<?php echo $identifier[0] ?>" <?php echo $noAttr ?>>
	  <?php $partial = $link_partial ? $link_partial : 'sfDoctrineTree/link'; ?>
	  <?php include_partial($partial, 
	  		array(
	  			'record' => $record, 
	  			'model' => $model, 
	  			'field' => $field, 
	  			'root' => $root, 
	  			'identifier' => $identifier[0])) 
	  		?>
	  <?php if ($record->getNode()->getLevel() == 0): ?>
	  	<img style="padding:0pt 5px;display:none;vertical-align:middle;" id="doctrine_tree_indicator" src="/sfDoctrineTreePlugin/images/indicator.gif" /> 
	  <?php endif; ?>
	  	  			
	  <?php $prevLevel = $record->getNode()->getLevel(); ?>
	  
	  <?php endforeach; ?>
	  </li></ul>
	<?php endif; ?>		
</div>

<script language="javascript" type="text/javascript">
<!--
document.observe('dom:loaded', 
	function() {
    	treeObj = new JSDragDropTree();
		treeObj.setTreeId('dhtmlgoodies_tree2');
		treeObj.setMaximumDepth('<?php echo $max_depth; ?>');
		treeObj.setMessageMaximumDepthReached('Maximum depth reached');
		treeObj.setRootId('<?php echo $root; ?>');
		treeObj.setNameField('<?php echo $field; ?>');
		treeObj.setModel('<?php echo $model; ?>');
		treeObj.filePathRenameItem = '<?php echo $filePathRenameItem; ?>';
		treeObj.filePathDeleteItem = '<?php echo $filePathDeleteItem; ?>';
		treeObj.filePathAddItem = '<?php echo $filePathAddItem; ?>';
		treeObj.filePathSaveTree = '<?php echo $filePathSaveTree; ?>';
		treeObj.linkPartial = '<?php echo $linkPartial; ?>';
		treeObj.initTree();
		treeObj.expand(1);
	}
);		
//-->
</script>		