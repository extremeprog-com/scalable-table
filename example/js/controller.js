app.controller('MyController', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  window.scope = $scope;
  window.rootScope = $rootScope;

  $scope.getData = function (offset, limit) {
    // should return promise which returns array

    return new Promise(function (resolve) {
      $scope.tableData = function () {
        var arr = [];

        data.forEach(function (obj) {
          var subArr = [];

          for (var key in obj) {
            var value = obj[key];
            subArr.push(value);
          }
          arr.push(subArr);
        });

        return arr;
      };

      var _to = setTimeout(function () {
        clearTimeout(_to);
        resolve($scope.tableData());
      }, 800);
    });
  };


  $scope.dataColumns = ["lalala", "prprpr"];
  $scope.columns = function () {
    var cell = [];

    for (var key in data[0]) {
      var obj = {};
      obj.Name = key;
      obj.width = 200;
      cell.push(obj);
    }

    return cell;
  };

  $scope.no = 1;

  $scope.length = function () {
    return 1000;
  };

  $scope.gotoFoo = function (key) {
    return 1;
  }
}]);
