import { PivotSheet } from '@antv/s2';

fetch(
  'https://gw.alipayobjects.com/os/bmw-prod/2a5dbbc8-d0a7-4d02-b7c9-34f6ca63cff6.json',
)
  .then((res) => res.json())
  .then((dataCfg) => {
    const container = document.getElementById('container');

    const s2Options = {
      width: 600,
      height: 480,
      interaction: {
        hoverHighlight: false,
      },
      conditions: {
        interval: [
          {
            field: 'number',
            mapping() {
              return {
                fill: '#80BFFF',
                // 自定义柱状图范围
                isCompare: true,
                maxValue: 8000,
                minValue: 300,
              };
            },
          },
        ],
      },
    };
    const s2 = new PivotSheet(container, dataCfg, s2Options);

    s2.render();
  });
