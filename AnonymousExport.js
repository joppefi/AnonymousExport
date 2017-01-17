requirejs.config({
	paths: {
		jszip: '../Extensions/AnonymousExport/js/jszip.min',
		xlsxloader: '../Extensions/AnonymousExport/ExcelLoader',
		xlsx: '../Extensions/AnonymousExport/js/excel-builder.dist'
	},
	shim: {
		xlsx: {
			exports: 'XLSX',
			deps: ['xlsxloader']
		}
	}
});

define(["qlik", "jquery", "text!./style.css", "text!./template.html", "xlsx", "./js/lodash"], function (qlik, $, cssContent, template) {
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



			$scope.exportCSV = function () {
				/**
				 * Tehdään Hypercubesta CSV
				 */
				var matriisi = qlik.table(this).qHyperCube.qDataPages[0].qMatrix;
				var dimensiot = qlik.table(this).qHyperCube.qDimensionInfo;
				var measuret = qlik.table(this).qHyperCube.qMeasureInfo;
				var taulukkoCSVtemp = [];
				var otsikko = [];
				for (var i = 0; i < dimensiot.length; i++) { otsikko.push(dimensiot[i].qFallbackTitle) }
				for (var i = 0; i < measuret.length; i++) { otsikko.push(measuret[i].qFallbackTitle) }
				taulukkoCSVtemp.push(otsikko.join(","));

				for (var i = 0; i < matriisi.length; i++) {
					var rivi = [];
					for (var j = 0; j < matriisi[i].length; j++) {
						if (matriisi[i][j].qNum == "NaN") {
							rivi.push('"' + matriisi[i][j].qText + '"');
						} else {
							rivi.push('"' + matriisi[i][j].qText.replace(".", ",") + '"');
						}
					}
					taulukkoCSVtemp.push(rivi.join(","));
				}
				var taulukkoCSV = taulukkoCSVtemp.join("\r\n");


				/**
				 * Pusketaan CSV käyttäjälle
				 */

				var csvBlob = new Blob([taulukkoCSV], { type: 'text/csv' });


				if (window.navigator.msSaveOrOpenBlob) {  // IE:tä varten
					window.navigator.msSaveBlob(csvBlob, 'data.csv');
				} else {
					download(csvBlob, "data.CSV", 'text/csv');
				}
			}

			$scope.exportXLS = function () {
				/**
				 * Tehdään hypercubesta taulukko
				 */
				var matriisi = qlik.table(this).qHyperCube.qDataPages[0].qMatrix;
				var dimensiot = qlik.table(this).qHyperCube.qDimensionInfo;
				var measuret = qlik.table(this).qHyperCube.qMeasureInfo;
				var taulukko = [];
				var otsikko = [];


				for (var i = 0; i < dimensiot.length; i++) { otsikko.push(dimensiot[i].qFallbackTitle) }
				for (var i = 0; i < measuret.length; i++) { otsikko.push(measuret[i].qFallbackTitle) }
				taulukko.push(otsikko);

				for (var i = 0; i < matriisi.length; i++) {
					var rivi = [];
					for (var j = 0; j < matriisi[i].length; j++) {
						if (matriisi[i][j].qNum == "NaN") {
							rivi.push(matriisi[i][j].qText);
						} else {
							//rivi.push(parseFloat(matriisi[i][j].qText)); //Antaa NaN jos formatointi on Sensessä väärin
							rivi.push(matriisi[i][j].qText);
						}
					}
					taulukko.push(rivi);
				}

				/**
				 * Luodaan Excel
				 */
				var workbook = ExcelBuilder.Builder.createWorkbook();
				var worksheet = workbook.createWorksheet({ name: 'Data' });
				var stylesheet = workbook.getStyleSheet();

				worksheet.setData(taulukko);
				workbook.addWorksheet(worksheet);

				/**
				 * Pusketaan Excel käyttäjälle
				 */

				ExcelBuilder.Builder.createFile(workbook).then(function (data) {

					var dataBlob = b64toBlob(data, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
					if (window.navigator.msSaveOrOpenBlob) {  // IE:tä varten
						window.navigator.msSaveBlob(dataBlob, 'data.xlsx');
					} else {
						download(dataBlob, "data.xlsx", 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
					}

				});
			}

			function b64toBlob(b64Data, contentType, sliceSize) {
				contentType = contentType || '';
				sliceSize = sliceSize || 512;

				var byteCharacters = atob(b64Data);
				var byteArrays = [];

				for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
					var slice = byteCharacters.slice(offset, offset + sliceSize);

					var byteNumbers = new Array(slice.length);
					for (var i = 0; i < slice.length; i++) {
						byteNumbers[i] = slice.charCodeAt(i);
					}

					var byteArray = new Uint8Array(byteNumbers);

					byteArrays.push(byteArray);
				}

				var blob = new Blob(byteArrays, { type: contentType });
				return blob;
			}

		}]
	};

});
