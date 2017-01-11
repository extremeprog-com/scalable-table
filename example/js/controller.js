app.controller('MyController', ['$scope', '$http', '$rootScope', function ($scope, $http, $rootScope) {
  window.scope = $scope;
  window.rootScope = $rootScope;

  console.log(data);

  $scope.getData = function (offset, limit) {
    // should return promise which returns array

    return new Promise(function (resolve) {
      $scope.tableData = data.map(function (item) {
        var arr = [];
        arr.push(item.name.first + " " + item.name.last);
        arr.push(item.email);
        arr.push(item.company);

        return arr;
      });
      console.log($scope.tableData);
      console.log($scope.tableData.length);

      var _to = setTimeout(function () {
        clearTimeout(_to);
        resolve($scope.tableData);
      }, 800);
    });
  };


  $scope.dataColumns = ["lalala", "prprpr"];
  // $scope.data = [[1,2],[3,4]];
  $scope.no = 1;

  $scope.length = function () {
    return 5;
  };

  $scope.gotoFoo = function (key) {
    console.log(key)
    return 1;
  }
}]);
