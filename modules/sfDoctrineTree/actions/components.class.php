<?php
/**
 * sfDoctrineTreeComponents 
 * 
 * @uses sfComponents
 * @package 
 * @version $id$
 * @copyright 2008 Jacques B. Philip
 * @author Arnoldas Lukasevicius <arnoldas.lukasevicius@gmail.com>
 * @author Jacques B. Philip <jphilip@noatak.com>
 * @license LGPL See LICENSE that came packaged with this software
 */
class sfDoctrineTreeComponents extends sfComponents
{
  public function getTree($model, $field, $rootId = 0, $query = null)
  {
    $treeObject = Doctrine::getTable($model)->getTree();
    if ($query)
      $treeObject->setBaseQuery($query);    
    if( $rootId ) {
      if (Doctrine::VERSION < '1.2.0') {
      	$root = $treeObject->findRoot ( $rootId );
      } else {
      	$root = $treeObject->fetchRoot ( $rootId );
      }
      return $treeObject->fetchBranch($root->getId()); 
    } else {
      	return $treeObject->fetchTree();
    }
  }

  public function executeTree()
  {
    $this->records = $this->getTree($this->model, $this->field, $this->root, $this->query);
  }
}
