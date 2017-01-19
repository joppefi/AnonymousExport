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


			/**
			 * Hoitaa CSV -exportin
			 */
			$scope.exportCSV = function () {

				var self = this;
				var hypercube = qlik.table(this).qHyperCube;
				var rowcount = hypercube.qDataPages[0].qMatrix.length;
				var colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;

				var requestPage = [{
					qTop: rowcount,
					qLeft: 0,
					qWidth: colcount,
					qHeight: Math.min(1000, qlik.table(this).qHyperCube.qSize.qcy - rowcount)
				}];
				self.backendApi.getData(requestPage).then(function (dataPages) {
					rowcount += dataPages[0].qMatrix.length;

					var requestPage = [{
						qTop: rowcount,
						qLeft: 0,
						qWidth: colcount,
						qHeight: Math.min(1000, qlik.table(self).qHyperCube.qSize.qcy - rowcount)
					}];
					self.backendApi.getData(requestPage).then(function (dataPages) {
						rowcount += dataPages[0].qMatrix.length;


						/**
						 * Tehdään Hypercubesta CSV
				 		*/
						var matriisi = qlik.table(self).qHyperCube.qDataPages[0].qMatrix;
						var dimensiot = qlik.table(self).qHyperCube.qDimensionInfo;
						var measuret = qlik.table(self).qHyperCube.qMeasureInfo;
						var taulukkoCSVtemp = [];
						var otsikko = [];
						for (var i = 0; i < dimensiot.length; i++) { otsikko.push(dimensiot[i].qFallbackTitle) }
						for (var i = 0; i < measuret.length; i++) { otsikko.push(measuret[i].qFallbackTitle) }
						taulukkoCSVtemp.push(otsikko.join(","));
						console.log(rowcount);
						var maxFetches = Math.min(3, qlik.table(self).qHyperCube.qDataPages.length);

						for (var h = 0; h < maxFetches; h++) {
							var matriisi = qlik.table(self).qHyperCube.qDataPages[h].qMatrix;
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



					});

				});

			}

			/**
			 * Hoitaa excel -exportin
			 */
			$scope.exportXLS = function () {

				var self = this;
				var hypercube = qlik.table(this).qHyperCube;
				var rowcount = hypercube.qDataPages[0].qMatrix.length;
				var colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;

				var requestPage = [{
					qTop: rowcount,
					qLeft: 0,
					qWidth: colcount,
					qHeight: Math.min(1000, qlik.table(this).qHyperCube.qSize.qcy - rowcount)
				}];
				self.backendApi.getData(requestPage).then(function (dataPages) {
					rowcount += dataPages[0].qMatrix.length;

					var requestPage = [{
						qTop: rowcount,
						qLeft: 0,
						qWidth: colcount,
						qHeight: Math.min(1000, qlik.table(self).qHyperCube.qSize.qcy - rowcount)
					}];
					self.backendApi.getData(requestPage).then(function (dataPages) {
						rowcount += dataPages[0].qMatrix.length;


						/**
				 		* Tehdään hypercubesta taulukko
				 		*/

						var dimensiot = qlik.table(self).qHyperCube.qDimensionInfo;
						var measuret = qlik.table(self).qHyperCube.qMeasureInfo;
						var taulukko = [];
						var otsikko = [];


						for (var i = 0; i < dimensiot.length; i++) { otsikko.push(dimensiot[i].qFallbackTitle) }
						for (var i = 0; i < measuret.length; i++) { otsikko.push(measuret[i].qFallbackTitle) }
						taulukko.push(otsikko);

						var maxFetches = Math.min(3, qlik.table(self).qHyperCube.qDataPages.length);

						for (var h = 0; h < maxFetches; h++) {
							var matriisi = qlik.table(self).qHyperCube.qDataPages[h].qMatrix;
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


					});

				});

			}

			/**
			 * Muuttaa base64 blobiksi
			 */
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
