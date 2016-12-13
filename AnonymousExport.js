define(["qlik", "jquery", "text!./style.css", "text!./template.html"], function (qlik, $, cssContent, template) {
	'use strict';
	$("<style>").html(cssContent).appendTo("head");
	return {
		template: template,
		initialProperties: {
			qHyperCubeDef: {
				qDimensions: [],
				qMeasures: [],
				qInitialDataFetch: [{
					qWidth: 10,
					qHeight: 1000
				}]
			}
		},
		definition: {
			type: "items",
			component: "accordion",
			items: {
				dimensions: {
					uses: "dimensions",
					min: 1
				},
				measures: {
					uses: "measures",
					min: 0
				},
				sorting: {
					uses: "sorting"
				},
				settings: {
					uses: "settings",
					items: {
						initFetchRows: {
							ref: "qHyperCubeDef.qInitialDataFetch.0.qHeight",
							label: "Initial fetch rows",
							type: "number",
							defaultValue: 1000
						}
					}
				}
			}
		},
		support: {
			snapshot: true,
			export: true,
			exportData: true
		},
		paint: function () {
			//setup scope.table
			if (!this.$scope.table) {
				this.$scope.table = qlik.table(this);
			}
			return qlik.Promise.resolve();
		},
		controller: ['$scope', function ($scope) {

			$scope.export = function () {

				console.log('movoo ', qlik.table(this).qHyperCube);


				/**
				 * Tehdään Hypercubesta CSV
				 */
				var matriisi = qlik.table(this).qHyperCube.qDataPages[0].qMatrix;
				var dimensiot = qlik.table(this).qHyperCube.qDimensionInfo;
				var measuret = qlik.table(this).qHyperCube.qMeasureInfo;
				var taulukko = [];
				var otsikko = [];
				for (var i = 0; i < dimensiot.length; i++) { otsikko.push(dimensiot[i].title) }
				for (var i = 0; i < measuret.length; i++) { otsikko.push(measuret[i].qFallbackTitle) }
				taulukko.push(otsikko.join(","));

				for (var i = 0; i < matriisi.length; i++) {
					var rivi = [];
					for (var j = 0; j < matriisi[i].length; j++) {
						if (matriisi[i][j].qNum == "NaN") {
							rivi.push('"' + matriisi[i][j].qText + '"');
						} else {
							rivi.push('"' + matriisi[i][j].qText.replace(".", ",") + '"');
						}
					}
					taulukko.push(rivi.join(","));
				}
				var taulukkoCSV = taulukko.join("\r\n");

				console.log(taulukkoCSV);


				/**
				 * Pusketaan CSV käyttäjälle
				 */

				window.open(encodeURI("data:text/csv;charset=utf-8," + taulukkoCSV));


			}

		}]
	};

});
