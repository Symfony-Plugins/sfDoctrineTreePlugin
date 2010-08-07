<?php
/**
 * sfDoctrineTreeActions 
 * 
 * @uses sfActions
 * @package 
 * @version $id$
 * @copyright 2008 Jacques B. Philip
 * @author Arnoldas Lukasevicius <arnoldas.lukasevicius@gmail.com>
 * @author Jacques B. Philip <jphilip@noatak.com>
 * @license LGPL See LICENSE that came packaged with this software
 */
class sfDoctrineTreeActions extends sfActions {
	
	const RESPONSE_STATUS__SUCCESS = 200;
	const RESPONSE_STATUS__NOT_FOUND = 404;
	const RESPONSE_STATUS__BAD_REQUEST = 400;
	const RESPONSE_STATUS__METHOD_NOT_ALLOWED = 405;
	const RESPONSE_STATUS__INTERNAL_SERVER_ERROR = 500;
	
	const REQUEST_PARAMETER__ID = 'id';
	const REQUEST_PARAMETER__ROOT = 'root';
	const REQUEST_PARAMETER__MODEL = 'model';
	const REQUEST_PARAMETER__TITLE_FIELD_NAME = 'field';
	const REQUEST_PARAMETER__TITLE_FIELD_VALUE = 'value';
	const REQUEST_PARAMETER__DRAG_HISTORY = 'dragHistory';
	const REQUEST_PARAMETER__LINK_PARTIAL = 'linkPartial';
	
	const RESPONSE_OK = 'OK';		
	const RESPONSE_BODY_STATUS = 'status';
	
	const DEFAULT_LINK_PARTIAL = 'sfDoctrineTree/link';
	
	private $params = array ();	
	private $_response_body = array ();
	
	/*
	 * Try to keep default response code and message as error.
	 * If action will succeed and no fatal error or unhandled
	 * exception will be throwed - action must change response 
	 * code and message to success.	  
	 */
	private $_response_status__message = 'ERROR';
	private $_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
		
	/**
	 * @param array $paramsToCheck
	 * @return string
	 */
	public function preExecuteOK($paramsToCheck = array()) {

		$result = true;
		
		/* 
		 * Let's set default response code and message to unknown server error 
		 * in case execution flow will be interrupted by fatal error or unhandled 
		 * exception will be raised.
		*/						
		$response = sfContext::getInstance ()->getResponse ();
		$response->setStatusCode ( $this->_response_status__code, $this->_response_status__message );
						
		if (! sfContext::getInstance ()->getRequest ()->isXmlHttpRequest ()) {
			$result = false;
			$this->_response_status__message = 'Bad request. This is not an XmlHttpRequest';
			$this->_response_status__code = self::RESPONSE_STATUS__METHOD_NOT_ALLOWED;
		} else if (sfContext::getInstance ()->getRequest ()->getMethodName () != 'POST') {
			$result = false;
			$this->_response_status__message = 'Bad request. Only POST method is allowed';
			$this->_response_status__code = self::RESPONSE_STATUS__METHOD_NOT_ALLOWED;
		} else if (sfConfig::get ( 'sf_environment' ) == 'test') {
			$result = false;
			$this->_response_status__message = 'Bad request. Request is not allowed in test environment';
			$this->_response_status__code = self::RESPONSE_STATUS__METHOD_NOT_ALLOWED;
		}
		else {		
			foreach ( $paramsToCheck as $paramToCheck ) {
				if ($this->hasRequestParameter ( $paramToCheck )) {
					$value = $this->getRequestParameter ( $paramToCheck );
					if ((strlen ( trim ( $value ) ) == 0) || (count ( $value ) == 0)) {
						$this->_response_status__message = 'Bad request. Wrong parameter ' . $paramToCheck;
						$this->_response_status__code = self::RESPONSE_STATUS__BAD_REQUEST;
						$$result = false;
						break;
					}
					$this->params [$paramToCheck] = $value;
				} else {
					$this->_response_status__message = 'Bad request. Parameter ' . $paramToCheck . ' not found';
					$this->_response_status__code = self::RESPONSE_STATUS__BAD_REQUEST;
					$result = false;
					break;
				}
			}
		}
		return $result;
	}
	
	/* (non-PHPdoc)
	 * @see lib/vendor/symfony/lib/action/sfAction#postExecute()
	 */
	public function postExecute() {
		$response = sfContext::getInstance ()->getResponse ();
		$response->setStatusCode ( $this->_response_status__code, $this->_response_status__message );
		$response->setHttpHeader ( 'Content-type', 'application/json' );										
		/*
		 * In response body we will put status information. This will be 
		 * the last line of defence agains unhandled error, exceptions and 
		 * warnings. JavaScript frontend have to try to parse response body 
		 * as JSON data. If some messages will be added on top by PHP 
		 * (exceptions, errors, warnings) JSON parser will be unable to parse 
		 * correctly response body and find there status: OK. This will be a 
		 * sight of some problems.
		 */
		$this->_response_body = array_merge(
			array( self::RESPONSE_BODY_STATUS => self::RESPONSE_OK ), 
				$this->_response_body );				
		return $this->renderText (json_encode ($this->_response_body));		
	}
	
	/**
	 * @return string
	 */
	public function executeAdd_child() {
		if ($this->preExecuteOK(array (
					self::REQUEST_PARAMETER__MODEL, 
					self::REQUEST_PARAMETER__ID, 
					self::REQUEST_PARAMETER__ROOT, 
					self::REQUEST_PARAMETER__TITLE_FIELD_NAME, 
					self::REQUEST_PARAMETER__TITLE_FIELD_VALUE 
				))) {			
			if (($record = 
				$this->findRecord ( $this->params [self::REQUEST_PARAMETER__MODEL], $this->params [self::REQUEST_PARAMETER__ID] )) !== false) {						
					$child = new $this->params [self::REQUEST_PARAMETER__MODEL] ();
					$child[$this->params [self::REQUEST_PARAMETER__TITLE_FIELD_NAME]] = $this->params [self::REQUEST_PARAMETER__TITLE_FIELD_VALUE];
					if (($node = $record->getNode ()) !== false) {
						try {
							if (($node->addChild ( $child )) !== false) {
								$identifier = array_values ( $child->identifier () );
								$partial = (empty ( $this->params [self::REQUEST_PARAMETER__LINK_PARTIAL] )) 
									? self::DEFAULT_LINK_PARTIAL : $this->params [self::REQUEST_PARAMETER__LINK_PARTIAL];
								$options = array (
										'record' => $child, 
									 	self::REQUEST_PARAMETER__MODEL => $this->params [self::REQUEST_PARAMETER__MODEL], 
									 	self::REQUEST_PARAMETER__TITLE_FIELD_NAME => $this->params [self::REQUEST_PARAMETER__TITLE_FIELD_NAME], 
									 	self::REQUEST_PARAMETER__ROOT => $this->params [self::REQUEST_PARAMETER__ROOT], 
									 	'identifier' => $identifier [0] );
								$this->_response_status__code = self::RESPONSE_STATUS__SUCCESS;
								$this->_response_status__message = self::RESPONSE_OK;
								$this->_response_body = array ( self::REQUEST_PARAMETER__ID => $identifier [0], 
																'partial' => $this->getPartial ( $partial, $options ) );
							} else {
								$this->_response_status__message = 'Cannot insert a node that has already has a place within the tree';
								$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
							}
						} catch ( Exception $e ) {
							$this->_response_status__message = $this->getExceptionInfo ( $e );
							$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
						}
					} else {
						$this->_response_status__message = 'Model ' . $this->params ['model'] . ' do not actAs: NestedSet';
						$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
					}
				}
		}
		return sfView::NONE;
	}
	
	/**
	 * @return string
	 */
	public function executeRename() {
		if ($this->preExecuteOK(
				array (
					self::REQUEST_PARAMETER__MODEL, 
					self::REQUEST_PARAMETER__ID, 
					self::REQUEST_PARAMETER__TITLE_FIELD_NAME, 
					self::REQUEST_PARAMETER__TITLE_FIELD_VALUE 
				))) {
			if (($record = $this->findRecord ( 
					$this->params [self::REQUEST_PARAMETER__MODEL], 
					$this->params [self::REQUEST_PARAMETER__ID] )) !== false) {
				try {
					$record [$this->params [self::REQUEST_PARAMETER__TITLE_FIELD_NAME]] = 
						$this->params [self::REQUEST_PARAMETER__TITLE_FIELD_VALUE];
					$record->save ();
					$this->_response_status__code = self::RESPONSE_STATUS__SUCCESS;
					$this->_response_status__message = self::RESPONSE_OK;					
				} catch ( Exception $e ) {
					$this->_response_status__message = $this->getExceptionInfo ( $e );
					$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
				}
			}
		}
		return sfView::NONE;
	}
	
	/**
	 * @return string
	 */
	public function executeDelete() {
		if ($this->preExecuteOK(
				array (
					self::REQUEST_PARAMETER__MODEL, 
					self::REQUEST_PARAMETER__ID 
				))) {
			if (($record = $this->findRecord ( 
				$this->params [self::REQUEST_PARAMETER__MODEL], 
				$this->params [self::REQUEST_PARAMETER__ID] )) !== false) {
				if (($node = $record->getNode ()) !== false) {
					try {
						$node->delete ();
						$this->_response_status__code = self::RESPONSE_STATUS__SUCCESS;
						$this->_response_status__message = self::RESPONSE_OK;						
					} catch ( Exception $e ) {
						$this->_response_status__message = $this->getExceptionInfo ( $e );
						$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
					}
				} else {
					$this->_response_status__message = sprintf ( 'Model %s do not actAs: NestedSet', $this->params [self::REQUEST_PARAMETER__MODEL] );
					$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
				}
			}
		}
		return sfView::NONE;
	}
	
	/**
	 * @return string
	 */
	public function executeSave_tree() {
		if ($this->preExecuteOK(array (
					self::REQUEST_PARAMETER__MODEL, 
					self::REQUEST_PARAMETER__DRAG_HISTORY 
				))) {
			if (($model = $this->getTable ( $this->params [self::REQUEST_PARAMETER__MODEL] )) !== false) {
				$item = json_decode ( $this->params [self::REQUEST_PARAMETER__DRAG_HISTORY] );
				if (($source = $model->find ( $item [0] )) !== false) {
					if (($target = $model->find ( $item [2] )) !== false) {
						try {
							$source->getNode ()->$item [1] ( $target );
							$this->_response_status__code = self::RESPONSE_STATUS__SUCCESS;
							$this->_response_status__message = self::RESPONSE_OK;							
						} catch ( Exception $e ) {
							$this->_response_status__message = $this->getExceptionInfo ( $e );
							$this->_response_status__code = self::RESPONSE_STATUS__INTERNAL_SERVER_ERROR;
						}
					} else {
						$this->_response_status__message = 'Couldn\'t find the target node';
						$this->_response_status__code = self::RESPONSE_STATUS__NOT_FOUND;
					}
				} else {
					$this->_response_status__message = 'Couldn\'t find the source node';
					$this->_response_status__code = self::RESPONSE_STATUS__NOT_FOUND;
				}
			}
		}
		return sfView::NONE;
	}
	
	/**
	 * @param Exception $e
	 * @return string
	 */
	private function getExceptionInfo(Exception $e) {
		return sprintf ( "Exception: %s in %s line %d", $e->getMessage (), $e->getFile (), $e->getLine () );
	}
	
	/**
	 * @param unknown_type $table_name
	 * @param unknown_type $id
	 * @return mixed|string
	 */
	private function findRecord($table_name, $id) {
		if (($table = $this->getTable ( $table_name )) !== false) {
			if (($record = $table->find ( $id )) !== false) {
				return $record;
			} else {
				$this->_response_status__message = 'Couldn\'t find the record';
				$this->_response_status__code = self::RESPONSE_STATUS__NOT_FOUND;
			}
		}
		return false;
	}
	
	/**
	 * @param unknown_type $table_name
	 * @return Doctrine_Table|string|string
	 */
	private function getTable($table_name) {
		try {
			if (($table = Doctrine::getTable ( $table_name )) !== false) {
				return $table;
			}
		} catch ( Exception $e ) {
			$this->_response_status__message = 'Couldn\'t find the table';
			$this->_response_status__code = self::RESPONSE_STATUS__NOT_FOUND;
			return false;
		}
		return false;
	}
}