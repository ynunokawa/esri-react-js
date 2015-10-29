require([
	'esri/arcgis/utils',
	'esri/layers/GraphicsLayer',
	'esri/graphic',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/Color',
	'esri/geometry/geometryEngine',

	'dojo/_base/array',

	'react', 
	'reactDom',
	'fixedDataTable',

	'xstyle/css!./css/style.css'
], function(
	arcgisUtils, 
	GraphicsLayer,
	Graphic,
	SimpleMarkerSymbol,
	SimpleLineSymbol,
	SimpleFillSymbol,
	Color,
	geometryEngine,

	arrayUtils,

	React, 
	ReactDOM,
	FixedDataTable
) {

	// Grobal
	var map;
	var layer;
	var rows = [];
  	var Table = FixedDataTable.Table;
	var Column = FixedDataTable.Column;

	// Config
	var _tableDivID = 'esriFixedDataTableDiv';
	var _layerInfo = [
		{
			layerId: 'health_data_1927',
			featureId: 'PREF',
			attributes: [{ name: 'PREF', label: 'Pref'}, { name: '受診率23', label: 'Rate'}, { name: '受診率r23', label: 'Rank'}]
		},
		{
			layerId: '医療系9_1107UTZF8_9447',
			featureId: '施設名',
			attributes: [{ name: '施設名', label: 'Name'}, { name: '種別', label: 'Type'}, { name: '住所', label: 'Address'}]
		}
	];
	/*var _layerInfo = [
		{
			layerId: 'csv_8650_0',
			featureId: 'id',
			attributes: [{ name: 'id', label: 'ID'}, { name: 'mag', label: 'Magnitude'}, { name: 'place', label: 'Place'}, { name: 'depth', label: 'Depth'}]
		}
	];*/
	var _nowLayerIndex = 0;
	var _mapId = '92681c2bb2db4c5da82966ab8863c88d';
	//var _mapId = '8774c381d1334fccb438f6cee0f4e9d1';
	var _selectRowZoomLevel = 12;

	// Esri Map
	var mapDeferred = arcgisUtils.createMap(_mapId, 'mapDiv');
	mapDeferred.then(function(response) {
		map = response.map;
		console.log(map);
		layer = map.getLayer(_layerInfo[_nowLayerIndex].layerId);
		console.log(layer);

		setTimeout(function() {
			// EsriFixedDataTable
			initEsriFixedDataTable();
		}, 500);
	});

	// React Startup Codes (JSX)
	ReactDOM.render(
	    <h1>Hello, React!</h1>,
	    document.getElementById('example')
  	);


  	//** EsriJS + FixedDataTable (JSX) **//

	function getFeatureAttributes(layer, extent) {
		var setRows = [];
		console.log('getFeatureAttributes', layer);
		arrayUtils.forEach(layer.graphics, function(g) {
			//if(extent.contains(g.geometry)) {
			if(geometryEngine.contains(extent, g.geometry)) {
				console.log('contain');
				var row = [];
				arrayUtils.forEach(_layerInfo[_nowLayerIndex].attributes, function(a, i) {
					row.push(g.attributes[a.name]);
				});
				setRows.push(row);
			}
		});
		console.log('updatedRowsCount: ', setRows.length);
		return setRows;
	}

	function getTargetFeature(id, type) {
		var targetFeature;
		arrayUtils.forEach(layer.graphics, function(g) {
			if(g.attributes[_layerInfo[_nowLayerIndex].featureId] === id) {
				if(type === 'click') {
					console.log('click!', g);
					targetFeature = g;
				}
				else if(type === 'enter') {
					console.log('enter!', g);
					var highlightSymbol;
					if(g.geometry.type === 'point') {
						if(g.symbol === undefined) {
							highlightSymbol = new SimpleMarkerSymbol(
								SimpleMarkerSymbol.STYLE_CIRCLE, 
								10,
	    						new SimpleLineSymbol(
	    							SimpleLineSymbol.STYLE_SOLID,
	    							new Color([255,0,0,0.5]), 
	    							2
	    						),
	    						new Color([0,0,0,0])
	    					);
						}
						else {
							highlightSymbol = g.symbol.setOutline(
								new SimpleLineSymbol(
									SimpleLineSymbol.STYLE_SOLID,
	    							new Color([255,0,0,0.5]), 
	    							2
	    						)
	    					);
						}
					}
					else if(g.geometry.type === 'line') {
						if(g.symbol === undefined) {
							highlightSymbol = new SimpleLineSymbol(
								SimpleLineSymbol.STYLE_SOLID,
	    						new Color([255,0,0,0.25]), 
	    						2
	    					);
						}
						else {
							highlightSymbol = g.symbol.setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255,0,0,0.25])).setWidth(2);
						}
					}
					else if(g.geometry.type === 'polygon') {
						if(g.symbol === undefined) {
							highlightSymbol = new SimpleFillSymbol(
	          					SimpleFillSymbol.STYLE_SOLID, 
	          					new SimpleLineSymbol(
	            					SimpleLineSymbol.STYLE_SOLID, 
	            					new Color([255,0,0,0.25]), 
	            					3
	          					), 
	          					new Color([0,0,0,0])
	        				);
						}
						else {
							highlightSymbol = g.symbol.setOutline(
								new SimpleLineSymbol(
									SimpleLineSymbol.STYLE_SOLID,
	    							new Color([255,0,0,0.25]), 
	    							2
	    						)
	    					);
						}
					}
					targetFeature = new Graphic(g.geometry, highlightSymbol);
				}
			}
		});

		return targetFeature;
	}

	function listingLayerName() {
  		var layerNameList = [];
  		arrayUtils.forEach(_layerInfo, function(l) {
  			if(map.getLayer(l.layerId).name) {
  				layerNameList.push(map.getLayer(l.layerId).name);
  			}
  			else {
  				layerNameList.push(l.layerId);
  			}
  		});
  		return layerNameList;
  	}

  	function getLayerInfoIndex(name) {
  		var index;
  		arrayUtils.forEach(_layerInfo, function(l, i) {
  			if(map.getLayer(l.layerId).name === name) {
  				index = i;
  			}
  		});
  		return index;
  	}

	function initEsriFixedDataTable() {
		console.log(layer);

		// Highlight Layer
		var highlightLayer = new GraphicsLayer({ className: 'EFDT-highlight-layer'});
		map.addLayer(highlightLayer);

		// Esri Fixed Data Table UI
		var EsriFixedDataTable = React.createClass({
			getInitialState() {
				return {
					rows : getFeatureAttributes(layer, map.extent),
					selectValue: this.props.layers[0]
				};
			},

			_rowGetter(rowIndex) {
				return this.state.rows[rowIndex];
			},

			getDefaultProps: function() {
				return {
				  layers: listingLayerName()
				};
			},

			_onRowSelect: function(e, index) {
				console.log(e, index);
				console.log(this.state.rows[index][0]);
				var g = getTargetFeature(this.state.rows[index][0], 'click');
				console.log(g);
				if(g.geometry.type === 'point') {
					map.centerAndZoom(g.geometry, _selectRowZoomLevel);
				}
				else {
					map.setExtent(g._extent);
				}
			},  

			_onRowMouseEnter: function(e, index) {
				//console.log(e, index);
				var g = getTargetFeature(this.state.rows[index][0], 'enter');
				console.log(g);
				highlightLayer.add(g);
			},

			_onRowMouseLeave: function(e, index) {
				highlightLayer.clear();
			},

			componentDidMount: function() {
				this.props.map.on('extent-change', function(e) {
					this.setState({ rows: getFeatureAttributes(layer, e.extent) });
				}.bind(this));
		  	},
			onChangeSelectValue: function(e) {
				_nowLayerIndex = getLayerInfoIndex(e.target.value);
				layer = map.getLayer(_layerInfo[_nowLayerIndex].layerId);
				this.setState({
					selectValue: e.target.value,
					rows: getFeatureAttributes(layer, map.extent)
				});
			},
		  
			render() {
				var options = this.props.layers.map(function(layer) {
			      return <option className={'EFDT-option'} value={layer} key={layer}>{layer}</option>;
			    });
				return (
				   <div>

				      <div className={'EFDT-layer-select'}>
				          <select className={'EFDT-select'} value={this.state.selectValue} onChange={this.onChangeSelectValue}>
				            {options}
				          </select>
				      </div>
				      <div className={'EFDT-table'}>
					      <Table
						    rowHeight={30}
						    rowGetter={this._rowGetter}
						    rowsCount={this.state.rows.length}
						    width={5000}
						    height={300}
						    headerHeight={50}
						    onRowClick={this._onRowSelect}
						    onRowMouseEnter={this._onRowMouseEnter}
						    onRowMouseLeave={this._onRowMouseLeave}>
						    {(() => {
						    	var i = -1;
						    	//console.log(_nowLayerIndex);
						    	return _layerInfo[_nowLayerIndex].attributes.map((a) => {
						    		i = _layerInfo[_nowLayerIndex].attributes.indexOf(a);
						    		//console.log(a, i);
						    		if(i === _layerInfo[_nowLayerIndex].attributes.length-1) {
						    			return <Column
									      label={a.label}
									      width={200}
									      dataKey={i}
									      key={i}
									      flexGrow={1}
									    />;
						    		}
						    		else {
						    			return <Column
									      label={a.label}
									      width={200}
									      dataKey={i}
									      key={i}
									    />;
						    		}
		          				});
			        		})()}
						  </Table>
					  </div>

			      </div>
			    )
			}
		});

		ReactDOM.render(
			<EsriFixedDataTable map={map} />,
			document.getElementById(_tableDivID)
		);

	}

});
