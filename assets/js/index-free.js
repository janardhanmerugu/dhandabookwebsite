$(function() {
	"use strict";


 // chart 1

 var options = {
    series: [{
      name: "Desktops",
      data: [4, 10, 25, 12, 25, 18, 40, 22, 7]
  }],
    chart: {
    foreColor: "#9ba7b2",
    height: 350,
    type: 'area',
    zoom: {
      enabled: false
    },
    toolbar: {
        show: !1,
    },
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    width: 4,
    curve: 'smooth'
  },
  fill: {
    type: 'gradient',
    gradient: {
      shade: 'dark',
      gradientToColors: ['#ff0080'],
      shadeIntensity: 1,
      type: 'vertical',
      opacityFrom: 0.8,
      opacityTo: 0.1,
      stops: [0, 100, 100, 100]
    },
  },
  colors: ["#ffd200"],
  grid: {
    show: true,
    borderColor: 'rgba(0, 0, 0, 0.15)',
    strokeDashArray: 4,
  },
  tooltip: {
    theme: "dark",
  },
  xaxis: {
    categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'],
  },
  markers: {
    show: !1,
    size: 5,
   },
  };

  var chart = new ApexCharts(document.querySelector("#chart1"), options);
  chart.render();




    // chart 11 

    var options = {
        series: [58, 25, 25],
        chart: {
            height: 290,
            type: 'donut',
        },
        legend: {
            position: 'bottom',
            show: !1
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                gradientToColors: ['#ee0979', '#17ad37', '#ec6ead'],
                shadeIntensity: 1,
                type: 'vertical',
                opacityFrom: 1,
                opacityTo: 1,
                //stops: [0, 100, 100, 100]
            },
        },
        colors: ["#ff6a00", "#98ec2d", "#3494e6"],
        dataLabels: {
            enabled: !1
        },
        plotOptions: {
            pie: {
                donut: {
                    size: "85%"
                }
            }
        },
        responsive: [{
            breakpoint: 480,
            options: {
                chart: {
                    height: 270
                },
                legend: {
                    position: 'bottom',
                    show: !1
                }
            }
        }]
    };

    var chart = new ApexCharts(document.querySelector("#chart11"), options);
    chart.render();





});