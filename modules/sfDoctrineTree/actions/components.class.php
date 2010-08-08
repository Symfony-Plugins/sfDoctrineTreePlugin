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
class sfDoctrineTreeComponents extends sfComponents {
		
	/**
	 * @param string $model
	 * @param string_type $field
	 * @param integer $rootId
	 * @param string $query
	 */
	public function getTree($model, $field, $rootId = null, $query = null) {
		if (($tableObject = Doctrine::getTable ( $model )) !== false) {
			if (($treeObject = $tableObject->getTree ()) !== false) {
				if ($query) {
					$treeObject->setBaseQuery ( $query );
				}
				if ($rootId !== null) {
					$function = (Doctrine::VERSION < '1.2.0') ? 'findRoot' : 'fetchRoot';
					if (($root = $treeObject->$function ( $rootId )) !== false) {
						return $treeObject->fetchBranch ( $root->getId () );
					} else {
						throw new Exception('Root node with id='.$rootId.' not found.'); 
					}
				} else {
					return $treeObject->fetchTree ();
				}
			} else {
				throw new Exception('Model ' . $model . ' do not actAs: NestedSet.');
			}
		} else {
			throw new Exception('Table ' . $model . ' do not exists.');
		}
	}
	
	/**
	 * 
	 */
	public function executeTree() {
		$this->records = $this->getTree ( $this->model, $this->field, $this->root, $this->query );
	}
}
