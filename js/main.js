am5.ready(function () {
  let root = am5.Root.new('chartdiv');

  // Set themes
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/concepts/themes/
  root.setThemes([am5themes_Animated.new(root)]);

  // Create a stock chart
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/stock-chart/#Instantiating_the_chart
  let stockChart = root.container.children.push(am5stock.StockChart.new(root, {}));

  // Set global number format
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/concepts/formatters/formatting-numbers/
  root.numberFormatter.set('numberFormat', '#,###.00');

  // Create a main stock panel (chart)
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/stock-chart/#Adding_panels
  let mainPanel = stockChart.panels.push(
    am5stock.StockPanel.new(root, {
      wheelY: 'zoomX',
      panX: true,
      panY: true,
    }),
  );

  var easing = am5.ease.linear;

  // Create value axis
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/

  let valueAxis = mainPanel.yAxes.push(
    am5xy.ValueAxis.new(root, {
      renderer: am5xy.AxisRendererY.new(root, {
        pan: 'zoom',
      }),
      extraMin: 0.1, // adds some space for for main series
      tooltip: am5.Tooltip.new(root, {}),
      numberFormat: '#,###.00',
      extraTooltipPrecision: 2,
    }),
  );

  let dateAxis = mainPanel.xAxes.push(
    am5xy.GaplessDateAxis.new(root, {
      baseInterval: {
        timeUnit: 'minute',
        count: 1,
      },
      renderer: am5xy.AxisRendererX.new(root, {}),
      tooltip: am5.Tooltip.new(root, {}),
    }),
  );

  // add range which will show current value
  let currentValueDataItem = valueAxis.createAxisRange(valueAxis.makeDataItem({ value: 0 }));
  let currentLabel = currentValueDataItem.get('label');
  if (currentLabel) {
    currentLabel.setAll({
      fill: am5.color(0xffffff),
      background: am5.Rectangle.new(root, { fill: am5.color(0x000000) }),
    });
  }

  let currentGrid = currentValueDataItem.get('grid');
  if (currentGrid) {
    currentGrid.setAll({ strokeOpacity: 0.5, strokeDasharray: [2, 5] });
  }

  // Add series
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
  let valueSeries = mainPanel.series.push(
    am5xy.LineSeries.new(root, {
      name: "line",
      valueXField: "Date",
      valueYField: "Close",
      xAxis: dateAxis,
      yAxis: valueAxis,
    }),
  );

  // Set main value series
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
  stockChart.set('stockSeries', valueSeries);

  // Add a stock legend
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/stock-chart/stock-legend/
  let valueLegend = mainPanel.plotContainer.children.push(
    am5stock.StockLegend.new(root, {
      stockChart: stockChart,
    }),
  );

  // Set main series
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/stock-chart/#Setting_main_series
  valueLegend.data.setAll([valueSeries]);

  // Add cursor(s)
  // -------------------------------------------------------------------------------
  // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
  mainPanel.set(
    'cursor',
    am5xy.XYCursor.new(root, {
      yAxis: valueAxis,
      xAxis: dateAxis,
      // snapToSeries: [valueSeries],
      // snapToSeriesBy: 'y!',
    }),
  );

  let cursor = mainPanel.get('cursor');

  // Data generator
  let firstDate = new Date();
  let lastDate;
  let value = 1200;

  // data
  function generateChartData() {
    let chartData = [];

    for (let i = 0; i < 50; i++) {
      let newDate = new Date(firstDate);
      newDate.setMinutes(newDate.getMinutes() - i);

      value += Math.round((Math.random() < 0.49 ? 1 : -1) * Math.random() * 10);

      let open = value + Math.round(Math.random() * 16 - 8);
      let low = Math.min(value, open) - Math.round(Math.random() * 5);
      let high = Math.max(value, open) + Math.round(Math.random() * 5);

      chartData.unshift({
        Date: newDate.getTime(),
        Value: value,
        Close: value,
        Open: open,
        Low: low,
        High: high,
      });

      lastDate = newDate;
    }
    return chartData;
  }

  let data = generateChartData();

  // set data to all series
  valueSeries.data.setAll(data);

  // tell that the last data item must create bullet
  data[data.length - 1].bullet = true;

  // update data
  let previousDate;

  $('.up-btn').on('click', function () {
    let newDate = new Date();
    let minutes = $('.time li.active').text();
    $('.up-btn').prop('disabled', true);
    // Create range axis data item
    let rangeValueDataItem = valueAxis.makeDataItem({
      value: currentValueDataItem._settings.value,
    });
    let rangeDateDataItem = dateAxis.makeDataItem({
      value: newDate.setMinutes(newDate.getMinutes() + Number(minutes)),
    });

    // Create a range
    let rangeValue = valueAxis.createAxisRange(rangeValueDataItem);
    let rangeDate = dateAxis.createAxisRange(rangeDateDataItem);

    // Styles
    rangeValueDataItem.get('grid').setAll({
      stroke: am5.color(0x006400),
      strokeOpacity: 3,
      visible: true,
    });
    rangeDateDataItem.get('grid').setAll({
      stroke: am5.color(0xffff00),
      strokeOpacity: 3,
      visible: true,
    });

    setTimeout(function () {
      console.log(`Прошло ${minutes} минуты`);
      rangeValueDataItem.get('grid').setAll({
        visible: false,
      });
      rangeDateDataItem.get('grid').setAll({
        visible: false,
      });
      $('.up-btn').prop('disabled', false);
    }, Number(minutes) * 60000); // * 60000
  });

  // Create animating bullet by adding two circles in a bullet container and
  // animating radius and opacity of one of them.
  valueSeries.bullets.push(function(root, valueSeries, dataItem) {  
    // only create sprite if bullet == true in data context
    if (dataItem.dataContext.bullet) {    
      let container = am5.Container.new(root, {});
      let circle0 = container.children.push(am5.Circle.new(root, {
        radius: 5,
        fill: am5.color(0xff0000)
      }));
      let circle1 = container.children.push(am5.Circle.new(root, {
        radius: 5,
        fill: am5.color(0xff0000)
      }));

      circle1.animate({
        key: "radius",
        to: 20,
        duration: 1000,
        easing: am5.ease.out(am5.ease.cubic),
        loops: Infinity
      });
      circle1.animate({
        key: "opacity",
        to: 0,
        from: 1,
        duration: 1000,
        easing: am5.ease.out(am5.ease.cubic),
        loops: Infinity
      });

      return am5.Bullet.new(root, {
        locationX:undefined,
        sprite: container
      })
    }
  })

  setInterval(function () {
    let valueSeries = stockChart.get('stockSeries');
    let date = Date.now();
    let lastDataObject = valueSeries.data.getIndex(valueSeries.data.length - 1);
    if (lastDataObject) {
      let previousDate = lastDataObject.Date;
      let previousValue = lastDataObject.Close;

      value = am5.math.round(previousValue + (Math.random() < 0.5 ? 1 : -1) * Math.random() * 2, 2);

      let high = lastDataObject.High;
      let low = lastDataObject.Low;
      let open = lastDataObject.Open;

      if (am5.time.checkChange(date, previousDate, 'second')) {
        open = value;
        high = value;
        low = value;

        let dObj1 = {
          Date: date,
          Value: value,
          Close: value,
          // Open: open,
          // Low: low,
          // High: high,
        };

        valueSeries.data.push(dObj1);
        previousDate = date;
      } else {
        if (value > high) {
          high = value;
        }

        if (value < low) {
          low = value;
        }

        let dObj2 = {
          Date: date,
          Value: value,
          Close: value,
          // Open: open,
          // Low: low,
          // High: high,
        };

        valueSeries.data.setIndex(valueSeries.data.length - 1, dObj2);
      }
      // update current value
      if (currentLabel) {
        currentValueDataItem.animate({
          key: 'value',
          to: value,
          duration: 500,
          easing: am5.ease.out(am5.ease.cubic),
        });
        currentLabel.set('text', stockChart.getNumberFormatter().format(value));
        let bg = currentLabel.get('background');
        if (bg) {
          if (value < open) {
            bg.set('fill', root.interfaceColors.get('negative'));
          } else {
            bg.set('fill', root.interfaceColors.get('positive'));
          }
        }
      }
    }


  }, 1000);
});
