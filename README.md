# scalable-table
Extremely fast native html table.

## Quickstart
Add `scalable-table` to your project.

```javascript
var myproject = angular.module('myproject', ['scalable-table']);
```

```html
<scalable-table
        scalable-table-data-fn="getDataForScalableTable"
        scalable-table-data-length=""
        scalable-table-columns="currentColumns"
        scalable-table-defaults="{ cellWidth: 150, cellHeight: 32, cellSpacing: -1 }"
        scalable-table-reset-view=""
        scalable-table-rerender=""
        scalable-table-reset-data=""
        scalable-table-reset-data-on-events=""
        scalable-table-export-goto="gotoColumn"
        scalable-table-render-row-nums="true">
    <scalable-table-header-pre>
        <div class="calc-columns-column-wrapper">
            {{column.Name}}
            <span class="caret"></span>
        </div>
    </scalable-table-header-pre>

    <scalable-table-header>
        <div class="calc-columns-column-wrapper">
            {{column.Name}}
            <span class="caret"></span>
        </div>
    </scalable-table-header>

    <scalable-table-cell scalable-table-cell-title="">
        {{ cell }}
    </scalable-table-cell>
</scalable-table>
```

## Models usage

Scalable-table has two usable options. You can define `scalable-table-data-fn` to get a data dynamically with a function. In static model define `scalable-table-data` to get a data as a static array.

## Attributes usage

### scalable-table-data-fn
Requires function which returns a **Promise object** which returns data to be shown in a table. The data must be presented in a 2d array where each sub-array is a row in a table. Function takes an offset and a limit parameters.

For example:

```html
<scalable-table scalable-table-data-fn="getDataForScalableTable" >
```

In controller:

```javascript
$scope.getDataForScalableTable = function(offset, limit) {
  return new Promise(function(resolve) {
     resolve([ [1,2], [2,3]]);
  };
}
```

### scalable-table-data
Requires a 2d array where each sub-array is a row in table. For example, `scalable-table-data="[[1,2], [2,3]]"` where `[1,2]` - first row, `[2,3]` - a second row.

### scalable-table-defaults
Requires an object with default settings for a table. For example, `scalable-table-defaults="{ cellWidth: 150, cellHeight: 32, cellSpacing: -1 }"`.

### scalable-table-data-length
Requires a length of a data array. For example, `scalable-table-data-length="2"`. It can be also defined as function's call for a dynamic model: `scalable-table-data-length="getDataLength()"`.

### scalable-table-columns
Requires an array of objects. Each object should contain field **Name** and also could contain other additional fields as **with** and etc.

For example: `scalable-table-columns="[{width:100, Name:'Name'},{width:100, Name:'E-mail'},{width:100, Name:'Company'}]"`.

### scalable-table-reset-data-on-events
Requires an event as string on which a data will reset. For example: `scalable-table-reset-data-on-events="click"`.

### scalable-table-render-row-nums
Requires boolean value. If `true` row number will be shown.
For example: `scalable-table-render-row-nums="true"`

### scalable-table-reset-view
Requires a name of calculated expression. Change of this variable will trigger table view reset.
For example: `scalable-table-reset-view="dataLength"`. In controller:

```javascript
$scope.dataLength = 5;

// ... some actions ...

$scope.dataLength = 6; // table view reset called here
```

### scalable-table-rerender
Requires name of a calculated expression. Change of this variable will trigger table view table rerender.

### scalable-table-reset-data
Requires name of a calculated expression. Change of this variable will trigger update of data. 

### scalable-table-export-goto
Requires a name of a function which will be created in a `$scope` and can be used for scrolling the table to needed column. For example: 

```
scalable-table-export-goto="gotoFoo"
```

Then you can call it in a controller: 

```javascript
$scope.gotoFoo(6);
```

Or in a template:

```
ng-click="gotoFoo(6)"
```