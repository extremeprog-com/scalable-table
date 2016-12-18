# scalable-table
Extremely fast native html table.

## Quickstart
Add `scalable-table` for your project.

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