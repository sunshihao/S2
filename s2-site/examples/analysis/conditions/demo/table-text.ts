import { TableSheet } from '@antv/s2';

fetch(
  '../data/basic-table-mode.json',
)
  .then((res) => res.json())
  .then((data) => {
    const container = document.getElementById('container');
    const s2DataConfig = {
      fields: {
        columns: ['province', 'city', 'type', 'price', 'cost'],
      },
      meta: [
        {
          field: 'province',
          name: '省份',
        },
        {
          field: 'city',
          name: '城市',
        },
        {
          field: 'type',
          name: '商品类别',
        },
        {
          field: 'price',
          name: '价格',
        },
        {
          field: 'cost',
          name: '成本',
        },
      ],
      data,
    };

    const s2Options = {
      width: 600,
      height: 480,
      interaction: {
        hoverHighlight: false,
      },
      conditions: {
        text: [
          {
            field: 'price',
            mapping(fieldValue, data) {
              return {
                fill: '#30BF78',
              };
            },
          },
          {
            field: new RegExp('co*'),
            mapping(fieldValue, data) {
              return {
                fill: '#F4664A',
              };
            },
          },
        ],
      },
    };
    const s2 = new TableSheet(container, s2DataConfig, s2Options);

    s2.render();
  });
