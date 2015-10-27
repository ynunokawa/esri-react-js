require([
	'esri/arcgis/utils',
	'dojo/_base/array',

	'react',
	'reactDom',
	'fixedDataTable'
], function(
	arcgisUtils,
	arrayUtils,

	React,
	ReactDOM,
	FixedDataTable
) {

	// Grobal
	var map;
	var layer;

	var featureId = 'LOCATIONID';
	var attributesForTable = [{
		name: 'LOCATIONID',
		label: 'Name'
	}, {
		name: 'NUMSPACES',
		label: 'Capacity'
	}];
	var mapId = '1c0bf2bf70244f888361280f4aabde94';
	var layerId = 'Bike_Parking_4640';

	var rows = [];
  	var Table = FixedDataTable.Table;
	var Column = FixedDataTable.Column;

	// Esri Map
	var mapDeferred = arcgisUtils.createMap(mapId, 'mapDiv');
	mapDeferred.then(function(response) {
		map = response.map;
		console.log(map);
		layer = map.getLayer(layerId);
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
				setRows.push([g.attributes[attributesForTable[0].name], g.attributes[attributesForTable[1].name]]);
			}
		});
		console.log('updatedRowsCount: ', setRows.length);
		return setRows;
	}

	function getTargetFeature(id) {
		arrayUtils.forEach(layer.graphics, function(g) {
			if(g.attributes[featureId] === id) {
				map.centerAndZoom(g.geometry, 16);
			}
		});
	}

	function initEsriFixedDataTable() {
		console.log(layer);
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
				getTargetFeature(this.state.rows[index][0]);
			},

			componentDidMount: function() {
				this.props.map.on('extent-change', function(e) {
					this.setState({ rows: getFeatureAttributes(layer, e.extent) });
				}.bind(this));
		  	},

			render() {
				return (
			      <Table
				    rowHeight={30}
				    rowGetter={this._rowGetter}
				    rowsCount={this.state.rows.length}
				    width={5000}
				    height={300}
				    headerHeight={50}
				    onRowClick={this._onRowSelect}>
				    <Column
				      label={attributesForTable[0].label}
				      width={300}
				      dataKey={0}
				    />
				    <Column
				      label={attributesForTable[1].label}
				      width={500}
				      dataKey={1}
				    />
				  </Table>
			    )
			},
		});

		ReactDOM.render(
			<EsriFixedDataTable map={map} />,
			document.getElementById('example2')
		);

	}

});
