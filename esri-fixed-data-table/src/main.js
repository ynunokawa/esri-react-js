require([
	'esri/arcgis/utils',
	'esri/layers/GraphicsLayer',
	'esri/graphic',
	'esri/symbols/SimpleMarkerSymbol',
	'esri/symbols/SimpleLineSymbol',
	'esri/symbols/SimpleFillSymbol',
	'esri/Color',

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
	var _featureId = 'id';
	var _attributesForTable = [{
		name: 'id',
		label: 'ID'
	}, {
		name: 'mag',
		label: 'Magnitude'
	}, {
		name: 'place',
		label: 'Place'
	}];
	var _mapId = '8774c381d1334fccb438f6cee0f4e9d1';
	var _layerId = 'csv_8650_0';
	var _selectRowZoomLevel = 12;

	// Esri Map
	var mapDeferred = arcgisUtils.createMap(_mapId, 'mapDiv');
	mapDeferred.then(function(response) {
		map = response.map;
		console.log(map);
		layer = map.getLayer(_layerId);
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
		console.log('getFeatureAttributes');
		arrayUtils.forEach(layer.graphics, function(g) {
			if(extent.contains(g.geometry)) {
				var row = [];
				arrayUtils.forEach(_attributesForTable, function(a, i) {
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
			if(g.attributes[_featureId] === id) {
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
	    						new Color([255,0,0,0.5]), 
	    						2
	    					);
						}
						else {
							highlightSymbol = g.symbol.setStyle(SimpleLineSymbol.STYLE_SOLID).setColor(new Color([255,0,0,0.5])).setWidth(2);
						}
					}
					else if(g.geometry.type === 'polygon') {
						if(g.symbol === undefined) {
							highlightSymbol = new SimpleFillSymbol(
	          					SimpleFillSymbol.STYLE_SOLID, 
	          					new SimpleLineSymbol(
	            					SimpleLineSymbol.STYLE_SOLID, 
	            					new Color([255,0,0]), 
	            					3
	          					), 
	          					new Color([125,125,125,0.35])
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
					targetFeature = new Graphic(g.geometry, highlightSymbol);
				}
			}
		});

		return targetFeature;
	}

	function initEsriFixedDataTable() {
		console.log(layer);

		// Highlight Layer
		var highlightLayer = new GraphicsLayer();
		map.addLayer(highlightLayer);

		// Esri Fixed Data Table UI
		var EsriFixedDataTable = React.createClass({
			getInitialState() {
				return {
					rows : getFeatureAttributes(layer, map.extent)
				};
			},

			_rowGetter(rowIndex) {
				return this.state.rows[rowIndex];
			},

			_onRowSelect: function(e, index) {
				console.log(e, index);
				console.log(this.state.rows[index][0]);
				var g = getTargetFeature(this.state.rows[index][0], 'click');
				console.log(g);
				map.centerAndZoom(g.geometry, _selectRowZoomLevel);
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
		  
			render() {
			    var controlledScrolling =
			      this.props.left !== undefined || this.props.top !== undefined;

				return (
			      <Table
				    rowHeight={30}
				    rowGetter={this._rowGetter}
				    rowsCount={this.state.rows.length}
				    width={5000}
				    height={300}
				    headerHeight={50}
				    onRowClick={this._onRowSelect}
				    onRowMouseEnter={this._onRowMouseEnter}
				    onRowMouseLeave={this._onRowMouseLeave}
			        scrollTop={this.props.top}
			        scrollLeft={this.props.left}
			        overflowX={controlledScrolling ? "hidden" : "auto"}
			        overflowY={controlledScrolling ? "hidden" : "auto"}>
				    {(() => {
				    	var i = -1;
				    	return _attributesForTable.map((a) => {
				    		i = _attributesForTable.indexOf(a);
				    		console.log(a, i);
				    		if(i === _attributesForTable.length-1) {
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
			    )
			}
		});

		ReactDOM.render(
			<EsriFixedDataTable map={map} top={0} left={0} />,
			document.getElementById(_tableDivID)
		);

	}

});
