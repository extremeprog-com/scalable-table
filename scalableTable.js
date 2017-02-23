angular.module('scalable-table', [])
    .directive('scalableTable', function($compile, $rootScope) {

    var template =
        '<style> ' +
        '  scalable-table { width: 100%; height: 100%; display: block; position: relative; overflow: hidden;}' +
        '  .headContainer { top: 0; bottom:0; left: 0; right: 0; position: absolute; overflow: hidden;}' +
        '  .head          { width: 100%; position: absolute; }' +
        '  .head > *      { position: absolute; opacity: 1; -webkit-transition: 0.5s; transition: 0.5s; }' +
        '  .pinnedHeadContainer { width: 0; top: 0; bottom: 0; left: 0; position: absolute; overflow: hidden;}' +
        '  .pinnedheadArea      { width: 0; position: absolute; }' +
        '  .pinnedHeadArea > *  { position: absolute; opacity: 1; -webkit-transition: 0.5s; transition: 0.5s; }' +
        '  .dataContainer { bottom: 0; left: 0; right: 0; position: absolute; overflow: hidden; }' +
        '  .dataArea      { position: absolute; }' +
        '  .dataArea > *  { position: absolute; overflow: hidden;}' +
        '  .pinnedDataContainer { bottom: 0; left: 0; right: 0; position: absolute; overflow: hidden; }' +
        '  .pinnedDataArea      { position: absolute; }' +
        '  .pinnedDataArea > *  { position: absolute; overflow: hidden;}' +
        '  .scrollable    { bottom: 0; left: 0; right: 0; position: absolute; overflow: auto; }' +
        '  .scrollArea    { position: absolute; background-color: rgba(0,0,0,0.005); }' +
        '  .scrollArea > *{ position: absolute; }' +
        '  .title-tooltip::before { content: attr(title); position: absolute; top: 50%; left: 20%; border: solid 1px #CCC; padding: 0.2em 0.5em; background-color: #F8F0CC; }' +
        '</style>' +
        '<style class="scalableTableGeneratedHeadStyles"></style>' +
        '<style class="scalableTableGeneratedNumRowsStyles"></style>' +
        '<div class="headContainer">' +
        '  <div class="head"></div>' +
        '</div>' +
        '<div class="pinnedHeadContainer">' +
        '  <div class="pinnedHeadArea"></div>' +
        '</div>' +
        '<div class="pinnedDataContainer">' +
        '  <div class="pinnedDataArea"></div>' +
        '</div>' +
        '<div class="dataContainer">' +
        '  <div class="dataArea"></div>' +
        '</div>' +
        '<div class="scrollable">' +
        '  <div class="scrollArea"></div>' +
        '</div>' +
        '';

    return {
        restrict: 'E',
        priority: Infinity,
        scope: {
            scalableTableData: '=',
            scalableTableDataFn: '=',
            scalableTableDataLength: '=',
            scalableTableColumns: '=',
            scalableTableDefaults: '=',
            scalableTableResetView : '=',
            scalableTableRerender: '=',
            scalableTableRenderRowNums: '=',
            scalableTableResetData: '='
        },
        compile: function(tElement) {

            var templateHeaderPre;
            var templateHeader;
            var templateCell;
            var cellTitleFn;

            (templateHeaderPre = tElement[0].querySelector('scalable-table-header-pre')) && (templateHeaderPre = templateHeaderPre.innerHTML);
            (templateHeader    = tElement[0].querySelector('scalable-table-header'    )) && (templateHeader    = templateHeader   .innerHTML);
            (templateCell      = tElement[0].querySelector('scalable-table-cell'      )) && (templateCell      = templateCell     .innerHTML);
            (cellTitleFn       = tElement[0].querySelector('scalable-table-cell'      )) && (
                cellTitleFn = new Function('scope', 'with(scope) { return ' + cellTitleFn.getAttribute('scalable-table-cell-title') + ' }')
            );

            var cell = { cell: ''}, bracketsRegExp = /\{\{([^}]+)\}\}/g;

            function cellReplacer(all, value) {
                return (new Function('scope', 'with(scope) { return ' + value + ' }'))(cell);
            }

            tElement[0].innerHTML = template;

            return {
                post: function(scope, elem, attrs) {
                    var destroyed = false;

                    scope.$on('$destroy', function() {
                        destroyed = true;
                    });

                    var columnsCompileCompletely = {};

                    var defaultCellWidth  = 100;
                    var defaultCellHeight = 20 ;
                    var defaultCellSpacing = -1; // collapsed

                    var headContainer = elem[0].querySelector('.headContainer');
                    var head          = elem[0].querySelector('.head');
                    var dataContainer = elem[0].querySelector('.dataContainer');
                    var dataArea      = elem[0].querySelector('.dataArea');
                    var scrollable    = elem[0].querySelector('.scrollable');
                    var scrollArea    = elem[0].querySelector('.scrollArea');

                    var pinnedHeadContainer = elem[0].querySelector('.pinnedHeadContainer');
                    var pinnedHeadArea      = elem[0].querySelector('.pinnedHeadArea');
                    var pinnedDataContainer = elem[0].querySelector('.pinnedDataContainer');
                    var pinnedDataArea      = elem[0].querySelector('.pinnedDataArea');

                    var resetWidthsOnRepaint = false;

                    var dataRows = [], dataRowsLength, dataFn, emptyRow = {};

                    scope.scalableTablePinnedColumns = [
                        { _key: 'num' }
                        //{_key : 0, Value: {"ColumnDataType":"text","ColumnType":"Original","Name":"_InsertingUserID","ColumnType":1,"ColumnDataType":2}},
                        //{_key : 1, Value: {"ColumnDataType":"text","ColumnType":"Original","Name":"_InsertingUserID","ColumnType":1,"ColumnDataType":2}}
                    ];

                    var num_scope = scope.$parent.$new();
                    num_scope.column = {};

                    if('ontouchstart' in window || navigator.maxTouchPoints) {
                        $(scrollArea).on('click', function(event) {
                            $('.title-tooltip').not(event.target).removeClass('title-tooltip');
                            $(event.target).toggleClass('title-tooltip');
                        });
                    } else {
                        $(scrollArea).on('mousedown', function() {
                            dataContainer.style.zIndex = 1;
                            $rootScope.$emit('scalableTable.grid.mousedown');
                        });

                        var disableScrollTimeout;

                        $(dataArea).on('mouseup', function() {
                            clearTimeout(disableScrollTimeout);
                            disableScrollTimeout = setTimeout( function() {
                                dataContainer.style.zIndex = 0;
                            }, 200)
                        });

                    }


                    var scrolling = false;

                    $(scrollable).on('scroll', function checkScrollingAndRender() {
                        scrolling = true;
                        clearTimeout(checkScrollingAndRender._to);
                        checkScrollingAndRender._to = setTimeout(function() {
                            checkScrollingAndRender._screenSync = false;
                            scrolling = false;
                            scope.$broadcast('scroll_end');
                            render_hard();
                        }, 200);
                        if(window.requestAnimationFrame) {
                            if(!checkScrollingAndRender._screenSync) {
                                checkScrollingAndRender._screenSync = true;
                                (function makeRender() {
                                    if(checkScrollingAndRender._screenSync) {
                                        window.requestAnimationFrame(makeRender);
                                        render();
                                    }
                                })();
                            }
                        } else {
                            render();
                        }
                    });

                    var x0, y0, x1, y1;

                    var rendered_elements, cursor_x0, cursor_x1, cursor_y0, cursor_y1;

                    function resetView(reset_coords) {
                        dataArea.innerHTML = head.innerHTML = scrollArea.innerHTML = pinnedDataArea.innerHTML = pinnedHeadArea.innerHTML = '';
                        x1 = x0 = 0; y1 = y0;
                        cursor_x0 = 0; cursor_x1 = cursor_x0 - 1; cursor_y1 = cursor_y0 - 1;
                        for(var i in rendered_elements) {
                            if(rendered_elements.hasOwnProperty(i) && rendered_elements[i].__scope__) {
                                rendered_elements[i].__scope__.$destroy();
                            }
                        }
                        rendered_elements = {};
                        headHeight = 0;
                        if(reset_coords) {
                            x0 = 0; y0 = 0; x1 = 0; y1 = 0;
                            cursor_x0 = 0; cursor_x1 = -1; cursor_y0 = 0; cursor_y1 = -1;
                            scrollable.scrollLeft = 0;
                            scrollable.scrollTop  = 0;
                            dataRows = {};
                            requestRowsBusy = false;
                            start_row = Infinity;
                            end_row = -Infinity;
                        }
                    }

                    scope.$watchCollection('scalableTablePinnedColumns', function() {
                        if(scope.scalableTablePinnedColumns) {
                            renderPinnedColumnsHead()
                        }
                    });

                    scope.$watchGroup(['scalableTableRenderRowNums', function() { return dataRowsLength }], function(on) {
                        if(on && on[0] && on[1]) {
                            $('.scalableTableGeneratedNumRowsStyles').html(
                                '.pinnedHeadContainer,  .pinnedDataContainer { width: 50px; }' +
                                '.headContainer, .dataContainer, .scrollable { left : 50px; }'
                            );
                            $('.pinnedHeadContainer').html('<div class="pinnedHead"></div>');
                        } else {
                            $('.scalableTableGeneratedNumRowsStyles').html('');
                            $('.pinnedHeadContainer').html('');
                        }
                    });

                    function renderPinnedColumnsHead() {
                        for(var i = 0; i < scope.scalableTablePinnedColumns.length; i++) {
                            //console.log(scope.scalableTablePinnedColumns[i]);
                        }
                    }

                    scope.$watchCollection('scalableTableColumns', function() {
                        if(scope.scalableTableColumns) {
                            if(resetWidthsOnRepaint) {
                                scope.scalableTableColumns.map(function(it) {
                                    delete it.width;
                                })
                            }
                            resetView();
                            if(!scope.scalableTableData) {
                                dataRows = {};
                            }
                            emptyRow = {};
                            for(var i = 0, sx = 0, width; i < scope.scalableTableColumns.length; i++) {
                                emptyRow[scope.scalableTableColumns[i]._key || i] = '';
                                sx += width = (scope.scalableTableColumns[i].width  || scope.scalableTableDefaults.cellWidth  || defaultCellWidth) + (i ? scope.scalableTableDefaults.cellSpacing || defaultCellSpacing : 0);
                            }

                            scrollArea.style.width  = dataArea.style.width = head.style.width = sx + 'px';

                            if(scope.scalableTableColumns.length) {
                                render();
                                checkCellsWidth();
                            }
                        }
                    });

                    scope.$watchCollection('scalableTableData', function(data) {
                        if(scope.scalableTableData) {
                            dataRows       = scope.scalableTableData;
                            dataRowsLength = scope.scalableTableData.length;
                        }
                    });

                    scope.$watch('scalableTableDataFn', function(fn) {
                        dataRows = {};
                        dataFn = fn;
                        requestRowsBusy = false;
                        start_row = Infinity;
                        end_row = -Infinity
                    });

                    scope.$watchCollection('scalableTableDataLength', function(count) {
                        dataRowsLength = count;
                        resetView();
                        repaint();
                    });

                    scope.$watch(function() { return dataRows }, function() {
                        if(dataRows) {
                            resetView();
                            scrollArea.style.height = (
                                    scope.scalableTableDefaults.cellHeight * dataRowsLength
                                    + ( dataRowsLength
                                        ? (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing)
                                    * (dataRowsLength - 1)
                                        : 1 )
                                ) + 'px';
                            if(typeof dataRowsLength == 'number') {
                                render();
                                checkCellsWidth();
                            }
                        }
                    });

                    scope.$watch(function() {return dataRowsLength}, function() {
                        if(typeof dataRowsLength == 'number') {
                            resetView();
                            scrollArea.style.height = (
                                    scope.scalableTableDefaults.cellHeight * dataRowsLength
                                    + ( dataRowsLength
                                        ? (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing)
                                    * (dataRowsLength - 1)
                                        : 1 )
                                ) + 'px';
                            if(typeof dataRowsLength == 'number') {
                                render();
                                checkCellsWidth();
                            }
                        }
                    });

                    var requestRowsBusy = false, start_row = Infinity, end_row = -Infinity;

                    function requestRows(start_row_rq, end_row_rq) {

                        //if(start_row_rq < start_row) {
                            start_row = start_row_rq;
                        //}
                        //if(end_row_rq > end_row) {
                            end_row   = end_row_rq;
                        //}
                        if(start_row < 0) {
                            start_row = 0;
                        }
                        if(end_row > dataRowsLength - 1) {
                            end_row = dataRowsLength - 1;
                        }

                        // adjust window to get data
                        while( dataRows[start_row] && dataRows[start_row] != emptyRow && end_row - start_row > -1) { start_row++; }
                        while( dataRows[  end_row] && dataRows[  end_row] != emptyRow && end_row - start_row > -1) {   end_row--; }

                        if(requestRowsBusy) return;

                        requestRowsBusy = true;

                        setTimeout(function doServerRequest() {

                            if(end_row - start_row > -1) {

                                if(scrolling) {
                                    setTimeout(doServerRequest, 100);
                                    return;
                                }

                                (function(offset, limit) {
                                    var result = dataFn(offset, limit);
                                    if (result instanceof Promise) {
                                        result
                                            .then(function (data) {
                                                //if (!requestRowsBusy) return;
                                                requestRowsBusy = false;
                                                for (var i = 0; i < data.length; i++) {
                                                    dataRows[offset + i] = data[i];
                                                }
                                                //requestRows(start_row, end_row);
                                                resetView();
                                                render();
                                                checkCellsWidth();
                                            })
                                            .catch(function () {
                                                requestRowsBusy = false;
                                                if(!destroyed){
                                                    requestRows(start_row, end_row);
                                                }
                                            })
                                    }
                                })(start_row, end_row - start_row + 1)
                            } else {
                                requestRowsBusy = false
                            }
                        }, 0);
                    }

                    $(window).resize(function() {
                        //if(resetWidthsOnRepaint) {
                        //    resetWidthsOnRepaint = false;
                        //    scope.scalableTableColumns.map(function(it) {
                        //        delete it.width;
                        //    });
                        //}
                        render();
                    });

                    $(elem).on('transitionend', function(e) {
                        if(e.originalEvent.target == elem[0]) {
                            //if(resetWidthsOnRepaint) {
                            //    resetWidthsOnRepaint = false;
                            //    scope.scalableTableColumns.map(function(it) {
                            //        delete it.width;
                            //    });
                            //}
                            render()
                        }
                    });

                    var viewport_rows;

                    function render() {

                        if(!scope.scalableTableColumns || typeof dataRowsLength != 'number' || !scope.scalableTableColumns[0]) return;

                        // get viewport
                        var xr0 = scrollable.scrollLeft, xr1 = xr0 + $(scrollable).width(), yr0 = scrollable.scrollTop, yr1 = yr0 + $(scrollable).height();

                        viewport_rows = parseInt((yr1 - yr0) / scope.scalableTableDefaults.cellHeight || defaultCellHeight);

                        var _size;

                        if(cursor_x0 < 0) {
                            console.warn('warn: cursor_x0=', cursor_x0);
                            cursor_x0 = 0;
                        }

                        if(cursor_x1 > scope.scalableTableColumns.length - 1) {
                            console.warn('warn: cursor_x1=', cursor_x1);
                            cursor_x0 = scope.scalableTableColumns.length - 1;
                        }

                        if(cursor_y0 < 0) {
                            console.warn('warn: cursor_y0=', cursor_y0);
                            cursor_y0 = 0;
                        }

                        if(cursor_y1 > dataRowsLength - 1) {
                            console.warn('warn: cursor_y1=', cursor_y1);
                            cursor_y1 = dataRowsLength - 1;
                        }

                        // move left border to left
                        while(xr0 < x0 && cursor_x0 > 0) {
                            cursor_x0--;
                            x0 -= (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + (scope.scalableTableColumns[cursor_x0].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth);
                            addCol(cursor_x0, x0, y0);
                        }

                        // move right border to right
                        while(xr1 > x1 && cursor_x1 < scope.scalableTableColumns.length - 1) {
                            cursor_x1++;
                            addCol(cursor_x1, x1, y0);
                            x1 += (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + (scope.scalableTableColumns[cursor_x1].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth);
                        }

                        // move right border to left
                        while(xr1 < x1 - ( (scope.scalableTableColumns[cursor_x1].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth ) + (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) ) ) {
                            _size = scope.scalableTableColumns[cursor_x1].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth;
                            x1 -= (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + _size;
                            removeCol(cursor_x1, _size, true);
                            cursor_x1--;
                        }

                        // move left border to right
                        while(xr0 > x0 + ((scope.scalableTableColumns[cursor_x0].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth) - (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing)) ) {
                            _size = scope.scalableTableColumns[cursor_x0].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth;
                            x0 += (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + _size;
                            removeCol(cursor_x0);
                            cursor_x0++;
                        }

                        // move top border to top
                        while(yr0 < y0 && cursor_y0 > 0) {
                            cursor_y0--;
                            y0 -= (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + (scope.scalableTableDefaults.cellHeight || defaultCellHeight);
                            addRow(cursor_y0, x0, y0);
                        }

                        // move bottom border to bottom
                        while(yr1 > y1 && cursor_y1 < dataRowsLength - 1) {
                            cursor_y1++;
                            addRow(cursor_y1, x0, y1);
                            y1 += (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + (scope.scalableTableDefaults.cellHeight || defaultCellHeight);
                        }


                        // move bottom border to top
                        while(yr1 < y1 - ( (scope.scalableTableDefaults.cellHeight || defaultCellHeight ) + (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) ) ) {
                            _size = scope.scalableTableDefaults.cellHeight || defaultCellHeight;
                            y1 -= (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + _size;
                            removeRow(cursor_y1);
                            cursor_y1--;
                        }

                        // move top border to bottom
                        while(yr0 > y0 + ((scope.scalableTableDefaults.cellHeight || defaultCellHeight) - (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing)) ) {
                            _size = scope.scalableTableDefaults.cellHeight || defaultCellHeight;
                            y0 += (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing) + _size;
                            removeRow(cursor_y0);
                            cursor_y0++;
                        }

                        /*

                        if(!render.busy) {
                            render.busy = true;
                            try {
                                if(x1 < xr1 - xr0) {
                                    resetWidthsOnRepaint = true;

                                    var dx = parseInt((xr1 - xr0 - x1)/(scope.scalableTableColumns.length));
                                    for(var i = 0; i < scope.scalableTableColumns.length; i++) {
                                        scope.scalableTableColumns[i].width += dx;
                                    }
                                    repaint();
                                } else {
                                    if(x1 - (xr1 - xr0) > 10 ) {
                                        resetWidthsOnRepaint = false;
                                    }
                                }
                            } catch(e) {
                                console.error(e);
                            }
                            render.busy = false;
                        }
                        */

                        dataContainer.scrollLeft = xr0;
                        dataContainer.scrollTop  = yr0;
                        headContainer.scrollLeft = xr0;
                        pinnedDataContainer.scrollTop = yr0;
                    }

                    var columns_scope = [];

                    function addCell(x0, y0, width, height, content, is_head, classname, proto, is_pinned) {

                        var el = document.createElement('div');
                        cell.cell = content;
                        if(proto) {
                            cell.__proto__ = proto;
                        } else {
                            cell.__proto__ = Object.prototype;
                        }

                        el.innerHTML    = templateCell.replace(bracketsRegExp, cellReplacer);
                        //el.innerHTML    = content;
                        if(width) {
                            el.style.width  = width  + 'px';
                        }
                        el.style.height = height + 'px';
                        el.style.top    = y0     + 'px';
                        el.style.left   = x0     + 'px';
                        if(classname) {
                            el.className = classname;
                        }
                        if(!is_head) {
                            (is_pinned ? pinnedDataArea : dataArea).appendChild(el);
                            var title;
                            if(title = cellTitleFn(cell)) {
                                var el_title = document.createElement('div');
                                el_title.style.width  = width  + 'px';
                                el_title.style.height = height + 'px';
                                el_title.style.top    = y0     + 'px';
                                el_title.style.left   = x0     + 'px';
                                el_title.title = title;
                                scrollArea.appendChild(el_title);
                                el.titleNode = el_title;
                            }
                        } else {
                            (is_pinned ? pinnedHeadArea : head).appendChild(el)
                        }
                        return el;
                    }

                    function addCol(num, x0, y0, is_pinned, ignore_nested_adjust) {
                        var cursor_x   = num, y = y0;
                        var cellWidth  = scope.scalableTableColumns[cursor_x].width || 0;
                        var cellHeight = scope.scalableTableDefaults.cellHeight || defaultCellWidth;

                        var column_scope = scope.$parent.$new();
                        column_scope.column     = scope.scalableTableColumns[cursor_x];
                        column_scope.lastColumn = num && num == (scope.scalableTableColumns.length - 1);

                        columns_scope[num] = column_scope;

                        // add column heading
                        var pre_node = rendered_elements[cursor_x + '-hp'] =  addCell(x0, 0, cellWidth, 30, '', 1, 'column-head-pre', column_scope, is_pinned),
                            node     = rendered_elements[cursor_x + '-h' ] =  addCell(x0, 0, cellWidth, 30, '', 1, 'column-head'    , column_scope, is_pinned);
                        node.__scope__ = column_scope;


                        pre_node.innerHTML =  templateHeaderPre.replace(/\{\{(.+?)\}\}/g, function(all, value) {
                            return (new Function('scope', 'with(scope) { return ' + value + ' }'))(column_scope);
                        });

                        $('[ng-if]', pre_node).each(function(i,e) {
                            try {
                                if( ! (new Function('scope', 'with(scope) { return ' + $(e).attr('ng-if') + ' }'))(column_scope) ) {
                                    $(e).remove();
                                }
                            } catch(error) {
                                $(e).remove();
                            }
                        });

                        columnsCompileCompletely[cursor_x + '-h'] = {
                            node: node,
                            pre_node : pre_node,
                            num  : cursor_x,
                            scope: column_scope
                        };

                        node.style.opacity = 0;

                        for(var cursor_y = cursor_y0; cursor_y <= cursor_y1; cursor_y++) {
                            var data = dataRows[cursor_y][ scope.scalableTableColumns[cursor_x]._key != undefined ? scope.scalableTableColumns[cursor_x]._key : cursor_x];
                            rendered_elements[cursor_x + '-' + cursor_y] = addCell(x0, y, cellWidth, cellHeight, data, false, cursor_y%2 ? 'odd' : '', column_scope, is_pinned);
                            y += cellHeight + (scope.scalableTableDefaults.cellSpacing || defaultCellSpacing);
                        }

                        if(!ignore_nested_adjust) {

                            adjustHeadHeight(pre_node);

                            if(!scope.scalableTableColumns[cursor_x].width /* || pre_scroll_width > pre_client_width */ ) {

                                var pre_scroll_width = pre_node.scrollWidth;
                                var pre_client_width = pre_node.clientWidth;

                                scrollArea.style.width  = dataArea.style.width = head.style.width = (parseInt(scrollArea.style.width) + 1 + pre_scroll_width - (!scope.scalableTableColumns[cursor_x].width? scope.scalableTableDefaults.cellWidth || defaultCellWidth : pre_client_width) ) + 'px';
                                scope.scalableTableColumns[cursor_x].width = pre_scroll_width + 1;
                                removeCol(num);
                                addCol(num, x0, y0, is_pinned, 1);
                            }

                            render_hard();
                        }
                    }

                    function removeCol(num) {
                        var cursor_x   = num;
                        for(var cursor_y = cursor_y0; cursor_y <= cursor_y1; cursor_y++) {
                            dataArea.removeChild(rendered_elements[cursor_x + '-' + cursor_y]);
                            if(rendered_elements[cursor_x + '-' + cursor_y].titleNode) {
                                scrollArea.removeChild(rendered_elements[cursor_x + '-' + cursor_y].titleNode);
                            }
                            delete rendered_elements[cursor_x + '-' + cursor_y];
                        }

                        // remove column heading
                        head.removeChild(rendered_elements[cursor_x + '-hp']);
                        head.removeChild(rendered_elements[cursor_x + '-h']);

                        delete columnsCompileCompletely[cursor_x + '-h'];
                        rendered_elements[cursor_x + '-h'].__scope__.$destroy()
                    }

                    function addRow(num, x0, y0) {

                        if(!dataRows[num] || dataRows[num] == emptyRow) {
                            requestRows(num - viewport_rows * 3, num + viewport_rows * 3); // magic 3 screens
                        }

                        if(!dataRows[num]) {
                            dataRows[num] = emptyRow;
                        }

                        var cursor_y   = num;
                        var cellHeight = scope.scalableTableDefaults.cellHeight || defaultCellHeight;
                        for(var cursor_x = cursor_x0; cursor_x <= cursor_x1; cursor_x++) {
                            var cellWidth  = scope.scalableTableColumns[cursor_x].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth;
                            var data = dataRows[cursor_y][ scope.scalableTableColumns[cursor_x]._key != undefined ? scope.scalableTableColumns[cursor_x]._key : cursor_x];
                            rendered_elements[cursor_x + '-' + cursor_y] = addCell(x0, y0, cellWidth, cellHeight, data, false, cursor_y%2 ? 'odd' : '', columns_scope[cursor_x]);
                            x0 += cellWidth + scope.scalableTableDefaults.cellSpacing || defaultCellSpacing;
                        }

                        var rx = 0;
                        for(var i = 0; i < scope.scalableTablePinnedColumns.length; i++) {
                            cellWidth = scope.scalableTablePinnedColumns[i].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth;
                            data = scope.scalableTableColumns[i]._key == 'num' ? dataRows[cursor_y][scope.scalableTableColumns[i]._key] : (num + 1).toString();
                            rendered_elements['p' +  i + '-' + cursor_y] = addCell(
                                rx,
                                y0,
                                cellWidth,
                                cellHeight,
                                data,
                                false,
                                (cursor_y%2 ? 'odd' : '') + ' pinnedCell' + (scope.scalableTableColumns[i]._key == 'num' ? ' pinnedNum' : ''),
                                num_scope,
                                true
                            );
                        }

                    }

                    function removeRow(num) {
                        var cursor_y   = num;
                        for(var cursor_x = cursor_x0; cursor_x <= cursor_x1; cursor_x++) {
                            dataArea.removeChild(rendered_elements[cursor_x + '-' + cursor_y]);
                            if(rendered_elements[cursor_x + '-' + cursor_y].titleNode) {
                                scrollArea.removeChild(rendered_elements[cursor_x + '-' + cursor_y].titleNode);
                            }
                            delete rendered_elements[cursor_x + '-' + cursor_y];
                        }
                        for(var i = 0; i < scope.scalableTablePinnedColumns.length; i++) {
                            //console.log('remove ' + 'p' + i + '-' + cursor_y)
                            pinnedDataArea.removeChild(rendered_elements['p' + i + '-' + cursor_y]);
                            delete rendered_elements['p' + i + '-' + cursor_y];
                        }
                    }

                    var _render_hard_busy;

                    function render_hard() {

                        if(!_render_hard_busy) {
                            (function renderFirstElement() {
                                for(var i in columnsCompileCompletely) {

                                    if(!columnsCompileCompletely.hasOwnProperty(i)) continue;

                                    _render_hard_busy = true;

                                    $compile(angular.element(columnsCompileCompletely[i].node).html(templateHeader).contents())(columnsCompileCompletely[i].scope);

                                    columnsCompileCompletely[i].pre_node.style.opacity = 0;
                                    columnsCompileCompletely[i].    node.style.opacity = 1;
                                    setTimeout(renderFirstElement, 30);

                                    delete columnsCompileCompletely[i];

                                    return
                                }

                                _render_hard_busy = false;
                            })();
                        }
                    }

                    function repaint(recalc_width) {
                        if(scope.scalableTableColumns) {
                            if(recalc_width && typeof cursor_x0 == 'number' && typeof cursor_x1 == 'number') {
                                for(var cursor_x = cursor_x0; cursor_x <= cursor_x1; cursor_x++) {
                                    scope.scalableTableColumns[cursor_x].width = 0;
                                }
                            }
                            resetView();
                            for (var i = 0, sx = 0, width; i < scope.scalableTableColumns.length; i++) {
                                sx += width = (scope.scalableTableColumns[i].width || scope.scalableTableDefaults.cellWidth || defaultCellWidth) + (i ? scope.scalableTableDefaults.cellSpacing || defaultCellSpacing : 0);
                            }
                            scrollArea.style.width  = dataArea.style.width = head.style.width = sx + 'px';

                            if (scope.scalableTableColumns.length) {
                                render();
                                checkHeaderWidth();
                            }
                        }
                    }

                    scope.$watch('scalableTableRerender', function() {
                        repaint(true);
                    });

                    scope.$watch('scalableTableResetView', function(data) {
                        resetView(true);
                        repaint();
                    });

                    var scalableTableResetDataOnEvents = attrs['scalableTableResetDataOnEvents'].split(/[\t\r\n ]*,[\t\r\n ]*/);

                    for( var i = 0, l = scalableTableResetDataOnEvents.length; i < l; i++ ) {
                        $rootScope.$on(scalableTableResetDataOnEvents[i], function() {
                            dataRows = {};
                            resetView();
                            repaint();
                        });
                    }

                    scope.$watch('scalableTableResetData', function() {
                        dataRows = {};
                        resetView();
                        repaint();
                    });

                    function checkCellsWidth() {

                        var need_adjust = false, node;

                        for(var cursor_x = cursor_x0; cursor_x <= cursor_x1; cursor_x++) {
                            for(var cursor_y = cursor_y0; cursor_y <= cursor_y1; cursor_y++) {
                                node = rendered_elements[cursor_x + '-' + cursor_y];
                                if( node.scrollWidth > node.clientWidth && node.scrollWidth > scope.scalableTableColumns[cursor_x].width ) {
                                    scope.scalableTableColumns[cursor_x].width  = node.scrollWidth + (parseInt($(node).css('padding-right')) || 0);
                                    need_adjust = true;
                                }
                            }
                        }
                        if(need_adjust) {
                            repaint();
                        }
                    }

                    function checkHeaderWidth() {

                        var need_adjust = false, node;

                        for(var cursor_x = cursor_x0; cursor_x <= cursor_x1; cursor_x++) {
                            node = rendered_elements[cursor_x + '-h'];

                            if( !scope.scalableTableColumns[cursor_x].width || (node.scrollWidth > node.clientWidth && node.scrollWidth > scope.scalableTableColumns[cursor_x].width ) ) {
                                scope.scalableTableColumns[cursor_x].width  = node.scrollWidth + (parseInt($(node).css('padding-right')) || 0);
                                need_adjust = true;
                            }
                        }
                        if(need_adjust) {
                            repaint();
                        }
                    }

                    scope.$on('scroll_end', checkCellsWidth);

                    var headHeight;

                    function adjustHeadHeight(node) {
                        if(!headHeight /* || headHeight < node.scrollHeight */) {
                            headHeight = node.scrollHeight;
                            elem[0].querySelector('.scalableTableGeneratedHeadStyles').innerHTML = '' +
                                '.dataContainer, .pinnedDataContainer, .scrollable { top: ' + headHeight + 'px; }' +
                                '';
                        }
                    }

                    scope.$parent.$eval(attrs.scalableTableExportGoto + '= fn', {fn: function(key) {
                        (function scroll(t) {
                            var scrollToWidth = 0;
                            if(t < 0) return;

                            for(var i = 0, l = scope.scalableTableColumns.length; i < l; i++) {
                                var el = scope.scalableTableColumns[i];

                                if(key != ( el._key || i ) ) {
                                    scrollToWidth += el.width || defaultCellWidth;
                                } else {
                                    scrollable.scrollLeft = scrollToWidth - 50;
                                    render();
                                    if(cursor_x0 >= i || i >= cursor_x1) {
                                        scroll(t - 1);
                                    }
                                    return;
                                }
                            }
                        })(50)
                    }});
                }
            }
        }
    }
});