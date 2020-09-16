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

				$scope.ext.model
          .exportData("CSV_C", "/qHyperCubeDef", "filename", true)
          .then(function (file) {
              var qUrl = file.result ? file.result.qUrl : file.qUrl;
              var link = $scope.getBasePath() + qUrl;
              console.log(link);
              window.open(link);
          });

			}

			// Same as sense-export
			$scope.getBasePath = function () {
        var prefix = window.location.pathname.substr(
          0,
          window.location.pathname.toLowerCase().lastIndexOf("/sense") + 1
        );
        var url = window.location.href;
        url = url.split("/");
        return (
          url[0] +
          "//" +
          url[2] +
          (prefix[prefix.length - 1] === "/"
            ? prefix.substr(0, prefix.length - 1)
            : prefix)
        );
      };

			$scope.exportXLS = function () {
				$scope.ext.model
          .exportData("OOXML", "/qHyperCubeDef", "filename", true)
          .then(function (file) {
              var qUrl = file.result ? file.result.qUrl : file.qUrl;
              var link = $scope.getBasePath() + qUrl;
              console.log(link);
              window.open(link);
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

			/**
			 * Hakee kaiken datan APIsta
			 */
			function fetchAllData(self, table, rowcount, callback) {

				rowcount = typeof rowcount !== 'undefined' ? rowcount : 0;

				var hypercube = table.qHyperCube;
				if (rowcount == 0) {
					for (var i = 0; i < hypercube.qDataPages.length; i++) {
						rowcount += hypercube.qDataPages[i].qMatrix.length; /// Prevents duplication of data
					}
				}

				var colcount = hypercube.qDimensionInfo.length + hypercube.qMeasureInfo.length;

				var requestPage = [{
					qTop: rowcount,
					qLeft: 0,
					qWidth: colcount,
					qHeight: Math.min(1000, table.qHyperCube.qSize.qcy - rowcount)
				}];
				self.backendApi.getData(requestPage).then(function (dataPages) {
					rowcount += dataPages[0].qMatrix.length;

					if (rowcount < hypercube.qSize.qcy) {
						fetchAllData(self, table, rowcount, callback);
					}

					if (rowcount >= hypercube.qSize.qcy) {
						callback(table);
					}

				});
			}

		}]
	};

});
